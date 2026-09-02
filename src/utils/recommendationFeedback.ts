export const RECOMMENDATION_FEEDBACK_MAX_LENGTH = 300;

export type RecommendationFeedbackRating = 1 | 2 | 3 | 4 | 5;
export type RecommendationFeedbackSubject = "music" | "photo";

export type RecommendationFeedbackSubmission = {
  opinion?: string;
  rating: RecommendationFeedbackRating;
};

export type RecommendationFeedbackValue = RecommendationFeedbackSubmission & {
  subject: RecommendationFeedbackSubject;
  version: 1;
};

export function normalizeRecommendationFeedbackOpinion(opinion?: string) {
  const normalizedOpinion = opinion?.trim();

  if (!normalizedOpinion) {
    return undefined;
  }

  return normalizedOpinion.slice(0, RECOMMENDATION_FEEDBACK_MAX_LENGTH);
}

export function createRecommendationFeedbackValue({
  opinion,
  rating,
  subject,
}: RecommendationFeedbackSubmission & {
  subject: RecommendationFeedbackSubject;
}) {
  const normalizedOpinion = normalizeRecommendationFeedbackOpinion(opinion);
  const value: RecommendationFeedbackValue = {
    rating,
    subject,
    version: 1,
    ...(normalizedOpinion ? { opinion: normalizedOpinion } : {}),
  };

  return JSON.stringify(value);
}
