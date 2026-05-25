import { Directory, File, Paths } from 'expo-file-system';

const MOMENT_LOGS_DIRECTORY = 'moment-logs';

function getMomentDirectory() {
  const directory = new Directory(Paths.document, MOMENT_LOGS_DIRECTORY);
  directory.create({ idempotent: true, intermediates: true });

  return directory;
}

function getExtension(uri: string) {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
  return match?.[1] ? `.${match[1]}` : '.jpg';
}

export async function persistMomentPhoto(sourceUri: string, logId: string) {
  const directory = getMomentDirectory();
  const source = new File(sourceUri);
  const destination = new File(directory, `${logId}${getExtension(sourceUri)}`);

  await source.copy(destination, { overwrite: true });

  return destination.uri;
}
