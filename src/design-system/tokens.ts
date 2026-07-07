import { colors } from '@/constants/colors';

export const soundlogDesignTokens = {
  color: {
    brand: {
      limeWave: colors.brand.limeWave,
    },
    background: {
      app: colors.background.primary,
      raised: colors.background.secondary,
    },
    surface: {
      card: colors.surface.card,
      elevated: colors.surface.cardElevated,
      chip: colors.surface.chip,
      selected: colors.surface.chipSelected,
      player: colors.surface.player,
      tab: colors.surface.tab,
      glass: colors.surface.glass,
    },
    border: {
      subtle: colors.border.subtle,
      chip: colors.border.chip,
      focus: colors.border.focus,
    },
    accent: {
      blue: colors.accent.blue,
      purple: colors.accent.purple,
      gold: colors.accent.gold,
      lime: colors.accent.lime,
      warning: colors.accent.warning,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
      muted: colors.text.muted,
      inverse: colors.text.inverse,
    },
  },
  radius: {
    chip: 999,
    control: 20,
    cardSmall: 12,
    cardMedium: 18,
    cardLarge: 22,
    cardXLarge: 28,
    heroCard: 30,
  },
  spacing: {
    screenX: 20,
    screenTop: 16,
    sectionGap: 18,
    cardPadding: 16,
    cardPaddingLarge: 20,
    chipX: 20,
    chipY: 8,
  },
  typography: {
    screenTitle: 'text-[28px] font-semibold text-white',
    heroTitle: 'text-[30px] font-semibold leading-9 text-white',
    sectionTitle: 'text-[22px] font-semibold text-white',
    cardTitle: 'text-[18px] font-bold leading-6 text-white',
    body: 'text-sm leading-6 text-white/60',
    caption: 'text-xs text-white/45',
    chip: 'text-[13px] font-medium',
  },
  touchTarget: {
    iconButton: 44,
    primaryButton: 56,
    compactButton: 44,
  },
} as const;

export type SoundlogDesignTokens = typeof soundlogDesignTokens;
