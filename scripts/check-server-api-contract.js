#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const projectRoot = path.resolve(__dirname, '..');
const serverRoot = path.resolve(
  process.env.SOUNDLOG_SERVER_ROOT || path.join(projectRoot, '..', 'SoundLogServer'),
);
const openApiPath = path.join(serverRoot, 'openapi', 'soundlog-api.yaml');
const apiRoot = path.join(projectRoot, 'src', 'api');

if (!fs.existsSync(openApiPath)) {
  throw new Error(
    `SoundLogServer OpenAPI를 찾을 수 없습니다: ${openApiPath}\n` +
      'SOUNDLOG_SERVER_ROOT로 서버 저장소 경로를 지정하세요.',
  );
}

function normalizePath(value) {
  return value.replace(/\{[^}]+\}/g, '{param}').replace(/\/+$/, '') || '/';
}

function readOpenApiOperations() {
  const operations = new Set();
  let currentPath;

  fs.readFileSync(openApiPath, 'utf8')
    .split(/\r?\n/)
    .forEach((line) => {
      const pathMatch = line.match(/^  (\/[^:]+):\s*$/);

      if (pathMatch) {
        currentPath = pathMatch[1];
        return;
      }

      const methodMatch = line.match(/^    (delete|get|patch|post|put):\s*$/);

      if (currentPath && methodMatch) {
        operations.add(
          `${methodMatch[1].toUpperCase()} ${normalizePath(currentPath)}`,
        );
      }
    });

  return operations;
}

function getPropertyName(node) {
  if (!node) {
    return undefined;
  }

  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) {
    return node.text;
  }

  return undefined;
}

function getStringProperty(objectLiteral, propertyName) {
  if (!objectLiteral || !ts.isObjectLiteralExpression(objectLiteral)) {
    return undefined;
  }

  const property = objectLiteral.properties.find(
    (candidate) =>
      ts.isPropertyAssignment(candidate) &&
      getPropertyName(candidate.name) === propertyName,
  );

  if (
    property &&
    ts.isPropertyAssignment(property) &&
    (ts.isStringLiteral(property.initializer) ||
      ts.isNoSubstitutionTemplateLiteral(property.initializer))
  ) {
    return property.initializer.text;
  }

  return undefined;
}

function readStringConstants(sourceFile) {
  const constants = new Map();

  sourceFile.statements.forEach((statement) => {
    if (!ts.isVariableStatement(statement)) {
      return;
    }

    statement.declarationList.declarations.forEach((declaration) => {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.initializer &&
        (ts.isStringLiteral(declaration.initializer) ||
          ts.isNoSubstitutionTemplateLiteral(declaration.initializer))
      ) {
        constants.set(declaration.name.text, declaration.initializer.text);
      }
    });
  });

  return constants;
}

function expressionToPath(expression, constants) {
  if (
    ts.isStringLiteral(expression) ||
    ts.isNoSubstitutionTemplateLiteral(expression)
  ) {
    return expression.text;
  }

  if (ts.isIdentifier(expression)) {
    return constants.get(expression.text) ?? `{${expression.text}}`;
  }

  if (ts.isCallExpression(expression)) {
    const firstArgument = expression.arguments[0];

    if (
      ts.isIdentifier(expression.expression) &&
      expression.expression.text === 'encodeURIComponent' &&
      firstArgument
    ) {
      if (ts.isIdentifier(firstArgument)) {
        return `{${firstArgument.text}}`;
      }

      return '{param}';
    }
  }

  if (ts.isTemplateExpression(expression)) {
    return expression.templateSpans.reduce(
      (value, span) =>
        value + expressionToPath(span.expression, constants) + span.literal.text,
      expression.head.text,
    );
  }

  return undefined;
}

function readFrontendOperations() {
  const operations = [];
  const unresolved = [];
  const apiFiles = fs
    .readdirSync(apiRoot)
    .filter((fileName) => fileName.endsWith('Api.ts'))
    .sort();

  apiFiles.forEach((fileName) => {
    const filePath = path.join(apiRoot, fileName);
    const sourceText = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    const constants = readStringConstants(sourceFile);

    function visit(node) {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        ['requestApi', 'uploadApiFile'].includes(node.expression.text)
      ) {
        const pathValue = node.arguments[0]
          ? expressionToPath(node.arguments[0], constants)
          : undefined;

        if (!pathValue || !pathValue.startsWith('/')) {
          const position = sourceFile.getLineAndCharacterOfPosition(
            node.getStart(sourceFile),
          );
          unresolved.push(`${fileName}:${position.line + 1}`);
        } else {
          const isUpload = node.expression.text === 'uploadApiFile';
          const options = node.arguments[isUpload ? 2 : 1];
          const method =
            getStringProperty(options, isUpload ? 'httpMethod' : 'method') ??
            (isUpload ? 'POST' : 'GET');
          const position = sourceFile.getLineAndCharacterOfPosition(
            node.getStart(sourceFile),
          );

          operations.push({
            key: `${method.toUpperCase()} ${normalizePath(pathValue)}`,
            source: `${fileName}:${position.line + 1}`,
          });
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
  });

  if (unresolved.length > 0) {
    throw new Error(
      `정적으로 해석하지 못한 API 호출이 있습니다:\n${unresolved
        .map((value) => `- ${value}`)
        .join('\n')}`,
    );
  }

  return operations;
}

const serverOperations = readOpenApiOperations();
const frontendOperations = readFrontendOperations();
const missingOperations = frontendOperations.filter(
  (operation) => !serverOperations.has(operation.key),
);

if (missingOperations.length > 0) {
  throw new Error(
    `서버 OpenAPI에 없는 프론트 API 호출이 있습니다:\n${missingOperations
      .map((operation) => `- ${operation.key} (${operation.source})`)
      .join('\n')}`,
  );
}

console.log(
  `Frontend/server API contract check passed (${new Set(
    frontendOperations.map((operation) => operation.key),
  ).size} frontend operations, ${serverOperations.size} server operations).`,
);
