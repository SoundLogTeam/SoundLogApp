import { StyleSheet, Text, TextProps } from 'react-native';

const textColorClassPattern = /(?:^|\s)text-(?:\[#|(?:black|white|transparent)(?:\/\d+)?(?:\s|$)|(?:amber|blue|cyan|emerald|fuchsia|gray|green|indigo|lime|neutral|orange|pink|purple|red|rose|sky|slate|stone|teal|violet|yellow|zinc)-\d+(?:\/\d+)?(?:\s|$)|soundlog-[\w-]+(?:\/\d+)?(?:\s|$))/;

export function AppText({
  className = '',
  style,
  ...props
}: TextProps & { className?: string }) {
  const hasExplicitColor =
    textColorClassPattern.test(className) || Boolean(StyleSheet.flatten(style)?.color);
  const resolvedClassName = hasExplicitColor ? className : `text-white ${className}`.trim();

  return <Text className={resolvedClassName} style={style} {...props} />;
}
