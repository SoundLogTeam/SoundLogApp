import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { TravelRoom } from '@/types/domain';

type TravelRoomState = {
  roomsById: Record<string, TravelRoom>;
  roomsBySessionId: Record<string, TravelRoom>;
  clearRoom: (sessionId: string) => void;
  setRoomById: (room: TravelRoom) => void;
  setRoom: (sessionId: string, room: TravelRoom) => void;
};

export const useTravelRoomStore = create<TravelRoomState>()(
  persist(
    (set) => ({
      roomsById: {},
      roomsBySessionId: {},
      clearRoom: (sessionId) =>
        set((state) => {
          const roomsBySessionId = { ...state.roomsBySessionId };
          const roomId = roomsBySessionId[sessionId]?.id;
          const roomsById = { ...state.roomsById };

          delete roomsBySessionId[sessionId];
          if (roomId) {
            delete roomsById[roomId];
          }

          return { roomsById, roomsBySessionId };
        }),
      setRoomById: (room) =>
        set((state) => ({
          roomsById: {
            ...state.roomsById,
            [room.id]: room,
          },
          roomsBySessionId: room.sessionId
            ? {
                ...state.roomsBySessionId,
                [room.sessionId]: room,
              }
            : state.roomsBySessionId,
        })),
      setRoom: (sessionId, room) =>
        set((state) => ({
          roomsById: {
            ...state.roomsById,
            [room.id]: room,
          },
          roomsBySessionId: {
            ...state.roomsBySessionId,
            [sessionId]: room,
          },
        })),
    }),
    {
      name: 'soundlog-travel-rooms',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
