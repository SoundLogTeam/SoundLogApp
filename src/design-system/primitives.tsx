import { Feather } from '@expo/vector-icons';
import type { ComponentProps, PropsWithChildren, ReactNode } from 'react';
import { Pressable, PressableProps, View, ViewProps } from 'react-native';

import { AppText } from '@/components/AppText';

type FeatherIconName = ComponentProps<typeof Feather>['name'];

type ClassValue = false | null | string | undefined;

function mergeClasses(...classes: ClassValue[]) {
  return classes.filter(Boolean).join(' ');
}

export type SoundlogButtonVariant =
  | 'danger'
  | 'ghost'
  | 'primary'
  | 'secondary';
export type SoundlogButtonSize = 'compact' | 'default';

type SoundlogButtonProps = Omit<PressableProps, 'children'> & {
  className?: string;
  fullWidth?: boolean;
  iconName?: FeatherIconName;
  label: string;
  size?: SoundlogButtonSize;
  textClassName?: string;
  variant?: SoundlogButtonVariant;
};

const buttonSizeClass: Record<SoundlogButtonSize, string> = {
  compact: 'h-11 px-4',
  default: 'h-14 px-5',
};

const buttonVariantClass: Record<SoundlogButtonVariant, string> = {
  danger: 'bg-soundlog-warning',
  ghost: 'border border-white/10 bg-white/10',
  primary: 'bg-soundlog-lime',
  secondary: 'border border-white/15 bg-transparent',
};

const buttonTextClass: Record<SoundlogButtonVariant, string> = {
  danger: 'text-black',
  ghost: 'text-white',
  primary: 'text-soundlog-inverse',
  secondary: 'text-white',
};

function getButtonIconColor(variant: SoundlogButtonVariant) {
  return variant === 'primary' || variant === 'danger' ? '#090515' : '#FFFFFF';
}

export function SoundlogButton({
  accessibilityLabel,
  className,
  disabled,
  fullWidth = false,
  iconName,
  label,
  size = 'default',
  textClassName,
  variant = 'primary',
  ...props
}: SoundlogButtonProps) {
  const isDisabled = Boolean(disabled);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      className={mergeClasses(
        'min-w-0 flex-row items-center justify-center gap-2 rounded-full',
        buttonSizeClass[size],
        buttonVariantClass[variant],
        fullWidth && 'flex-1',
        isDisabled && 'opacity-60',
        className,
      )}
      disabled={isDisabled}
      {...props}
    >
      {iconName ? (
        <Feather
          color={getButtonIconColor(variant)}
          name={iconName}
          size={size === 'compact' ? 16 : 18}
        />
      ) : null}
      <AppText
        className={mergeClasses(
          size === 'compact' ? 'text-sm' : 'text-base',
          'min-w-0 font-semibold',
          buttonTextClass[variant],
          textClassName,
        )}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export type SoundlogSurfaceVariant =
  | 'base'
  | 'elevated'
  | 'glass'
  | 'hero'
  | 'media';

type SoundlogSurfaceProps = PropsWithChildren<
  ViewProps & {
    className?: string;
    variant?: SoundlogSurfaceVariant;
  }
>;

const surfaceClass: Record<SoundlogSurfaceVariant, string> = {
  base: 'rounded-[20px] border border-white/10 bg-soundlog-card p-4',
  elevated: 'rounded-[20px] bg-soundlog-elevated/80 p-2',
  glass: 'rounded-[22px] border border-white/10 bg-white/10 p-4',
  hero: 'rounded-[30px] border border-white/10 bg-white/10 p-6',
  media: 'overflow-hidden rounded-[26px] border border-white/10 bg-white/10',
};

export function SoundlogSurface({
  children,
  className,
  variant = 'glass',
  ...props
}: SoundlogSurfaceProps) {
  return (
    <View className={mergeClasses(surfaceClass[variant], className)} {...props}>
      {children}
    </View>
  );
}

type SoundlogSectionHeaderProps = {
  actionIconName?: FeatherIconName;
  actionLabel?: string;
  className?: string;
  description?: string;
  eyebrow?: string;
  onActionPress?: () => void;
  title: string;
};

export function SoundlogSectionHeader({
  actionIconName,
  actionLabel,
  className,
  description,
  eyebrow,
  onActionPress,
  title,
}: SoundlogSectionHeaderProps) {
  const hasAction = Boolean(actionLabel && onActionPress);

  return (
    <View
      className={mergeClasses(
        'flex-row items-end justify-between gap-3',
        className,
      )}
    >
      <View className="min-w-0 flex-1">
        {eyebrow ? (
          <AppText
            className="mb-1 text-xs font-semibold text-soundlog-lime"
            numberOfLines={1}
          >
            {eyebrow}
          </AppText>
        ) : null}
        <AppText
          className="text-[22px] font-semibold text-white"
          numberOfLines={2}
        >
          {title}
        </AppText>
        {description ? (
          <AppText
            className="mt-1 text-sm leading-6 text-white/60"
            numberOfLines={2}
          >
            {description}
          </AppText>
        ) : null}
      </View>

      {hasAction ? (
        <Pressable
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
          className="min-h-[44px] max-w-[132px] shrink-0 flex-row items-center justify-center gap-1.5 rounded-full bg-white/10 px-4"
          onPress={onActionPress}
        >
          {actionIconName ? (
            <Feather color="#FFFFFF" name={actionIconName} size={14} />
          ) : null}
          <AppText
            className="text-xs font-semibold text-white"
            numberOfLines={1}
          >
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

type SoundlogMetricProps = {
  className?: string;
  compact?: boolean;
  label: string;
  tone?: 'default' | 'lime' | 'muted';
  value: ReactNode;
};

const metricToneClass: Record<
  NonNullable<SoundlogMetricProps['tone']>,
  string
> = {
  default: 'text-white',
  lime: 'text-soundlog-lime',
  muted: 'text-white/70',
};

export function SoundlogMetric({
  className,
  compact = false,
  label,
  tone = 'default',
  value,
}: SoundlogMetricProps) {
  return (
    <View
      className={mergeClasses(
        'min-w-[126px] flex-1 bg-white/10',
        compact ? 'rounded-[14px] px-3 py-2.5' : 'rounded-[18px] p-4',
        className,
      )}
    >
      <AppText
        className={
          compact
            ? 'text-[10px] font-semibold text-white/45'
            : 'text-[11px] font-semibold text-white'
        }
      >
        {label}
      </AppText>
      <AppText
        className={mergeClasses(
          compact ? 'mt-1 text-sm' : 'mt-2 text-base',
          'font-semibold',
          metricToneClass[tone],
        )}
        numberOfLines={1}
      >
        {value}
      </AppText>
    </View>
  );
}
