import { ApiSource, useDevToolsStore } from '@/store/devToolsStore';

export function getApiSource(): ApiSource {
  return useDevToolsStore.getState().apiSource;
}

export function isServerApiSource() {
  return getApiSource() === 'server';
}
