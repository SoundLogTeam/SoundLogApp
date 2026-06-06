export const layout = {
  miniPlayerGap: 12,
  miniPlayerHeight: 96,
  screenX: 20,
  tabBarBaseHeight: 76,
} as const;

export function getTabBarHeight(safeAreaBottom: number) {
  return layout.tabBarBaseHeight + safeAreaBottom;
}

export function getMiniPlayerBottom(safeAreaBottom: number) {
  return getTabBarHeight(safeAreaBottom) + layout.miniPlayerGap;
}

export function getHomeContentBottomPadding(safeAreaBottom: number, hasMiniPlayer: boolean) {
  const tabBarHeight = getTabBarHeight(safeAreaBottom);

  if (!hasMiniPlayer) {
    return tabBarHeight + 32;
  }

  return tabBarHeight + layout.miniPlayerHeight + layout.miniPlayerGap + 32;
}

export function getCurationListBottomPadding(safeAreaBottom: number, hasMiniPlayer: boolean) {
  const tabBarHeight = getTabBarHeight(safeAreaBottom);

  if (!hasMiniPlayer) {
    return tabBarHeight + 32;
  }

  return tabBarHeight + layout.miniPlayerHeight + layout.miniPlayerGap + 28;
}
