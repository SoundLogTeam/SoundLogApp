import { isServerApiSource } from '@/api/apiSource';
import { requestEnvelope } from '@/api/soundlogClient';
import { mockServer } from '@/mock-server';
import type { RecapItem, RecapShare } from '@/types/domain';

export const recapApi = {
  getRecapList: () =>
    isServerApiSource()
      ? requestEnvelope<RecapItem[]>('/v1/recaps')
      : mockServer.recap.getRecapList(),
  getRecapShare: (id?: string) =>
    isServerApiSource() && id
      ? requestEnvelope<RecapShare>(`/v1/recaps/${id}/share`)
      : mockServer.recap.getRecapShare(id),
};
