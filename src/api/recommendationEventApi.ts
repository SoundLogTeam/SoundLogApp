import { createIdempotencyKey, requestApi, shouldAttemptAuthenticatedApi } from '@/api/client';
import { RecommendationEvent } from '@/store/recommendationEventStore';

export const recommendationEventApi = {
  createEvents: (events: RecommendationEvent[]) => {
    if (!shouldAttemptAuthenticatedApi() || events.length === 0) {
      return Promise.resolve({ accepted: false });
    }

    return requestApi<{ accepted: boolean }>('/v1/recommendation-events', {
      body: { events },
      idempotencyKey: events[0]?.id ?? createIdempotencyKey('recommendation-events-batch'),
      method: 'POST',
    });
  },
};

export function syncRecommendationEvent(event?: RecommendationEvent) {
  if (!event) {
    return;
  }

  void recommendationEventApi.createEvents([event]).catch(() => undefined);
}
