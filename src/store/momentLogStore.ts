import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { MomentLog, MusicLogItem } from '@/types/domain';

type MomentLogState = {
  logs: MomentLog[];
  addLog: (log: MomentLog) => void;
  getRecentLogs: (limit?: number) => MomentLog[];
  removeLog: (id: string) => void;
};

export function momentLogToMusicLogItem(log: MomentLog): MusicLogItem {
  return {
    artistName: log.track?.artist ?? '음악 없음',
    createdAt: log.createdAt,
    id: log.id,
    placeName: log.placeName ?? '위치 없음',
    trackTitle: log.track?.title ?? '저장된 순간',
  };
}

export const useMomentLogStore = create<MomentLogState>()(
  persist(
    (set, get) => ({
      logs: [],
      addLog: (log) =>
        set((state) => ({
          logs: [log, ...state.logs.filter((item) => item.id !== log.id)],
        })),
      getRecentLogs: (limit = 10) => get().logs.slice(0, limit),
      removeLog: (id) =>
        set((state) => ({
          logs: state.logs.filter((item) => item.id !== id),
        })),
    }),
    {
      name: 'soundlog-moment-logs',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
