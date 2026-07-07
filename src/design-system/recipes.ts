export const soundlogRecipes = {
  screen: {
    root: 'flex-1 bg-soundlog-bg',
    content: 'px-5 pt-4',
    sectionStack: 'mt-5 gap-4',
  },
  text: {
    screenTitle: 'text-[28px] font-semibold text-white',
    heroTitle: 'text-[30px] font-semibold leading-9 text-white',
    sectionTitle: 'text-[22px] font-semibold text-white',
    cardTitle: 'text-[18px] font-bold leading-6 text-white',
    body: 'text-sm leading-6 text-white/60',
    caption: 'text-xs text-white/45',
    chip: 'text-[13px] font-medium',
  },
  card: {
    base: 'rounded-[20px] border border-white/10 bg-soundlog-card p-4',
    elevated: 'rounded-[20px] bg-soundlog-elevated/80 p-2',
    glass: 'rounded-[22px] border border-white/10 bg-white/10 p-4',
    hero: 'rounded-[30px] border border-white/10 bg-white/10 p-6',
    media: 'overflow-hidden rounded-[26px] border border-white/10 bg-white/10',
  },
  chip: {
    base: 'min-h-[38px] justify-center rounded-full border px-5',
    selected: 'border-soundlog-lime bg-soundlog-selected',
    idle: 'border-transparent bg-soundlog-chip',
    small: 'min-h-[28px] px-3',
  },
  button: {
    primary: 'h-14 items-center justify-center rounded-full bg-soundlog-lime',
    secondary: 'h-14 items-center justify-center rounded-full border border-white/15',
    compactPrimary: 'h-11 items-center justify-center rounded-full bg-soundlog-lime',
    compactDanger: 'h-11 items-center justify-center rounded-full bg-soundlog-warning',
    icon: 'h-11 w-11 items-center justify-center rounded-full bg-white/10',
  },
  control: {
    segmentedShell: 'rounded-[20px] bg-soundlog-elevated/80 p-2',
    segmentedTrack: 'rounded-full bg-black/25 p-1',
    segmentedItem: 'h-10 flex-1 items-center justify-center rounded-full',
    filterShell:
      'rounded-full border border-soundlog-border/70 bg-soundlog-chip/70 py-2 pl-2 pr-0',
  },
  travel: {
    activeCard: 'overflow-hidden rounded-[22px] border border-soundlog-lime/35 bg-white/10 p-4',
    endedCard: 'rounded-[28px] border border-white/10 bg-white/10 p-5',
    idleCard: 'rounded-[30px] border border-white/10 bg-white/10 p-6',
    metric: 'min-w-[126px] flex-1 rounded-[18px] bg-white/10 p-4',
    compactMetric: 'min-w-[126px] flex-1 rounded-[14px] bg-white/10 px-3 py-2.5',
  },
  recap: {
    listCard: 'h-[188px] overflow-hidden rounded-[26px] border border-white/10 bg-white/10',
    actionCircle: 'h-10 w-10 items-center justify-center rounded-full bg-white/90',
  },
} as const;

export type SoundlogRecipes = typeof soundlogRecipes;
