import { describe, expect, it } from "vitest";

import {
  createRecommendationFeedbackValue,
  normalizeRecommendationFeedbackOpinion,
  RECOMMENDATION_FEEDBACK_MAX_LENGTH,
} from "@/utils/recommendationFeedback";

describe("recommendationFeedback", () => {
  it("creates a rating-only value", () => {
    expect(
      JSON.parse(
        createRecommendationFeedbackValue({
          rating: 5,
          subject: "music",
        }),
      ),
    ).toEqual({
      rating: 5,
      subject: "music",
      version: 1,
    });
  });

  it("trims an optional opinion", () => {
    expect(
      JSON.parse(
        createRecommendationFeedbackValue({
          opinion: "  산책할 때 잘 어울렸어요.  ",
          rating: 4,
          subject: "photo",
        }),
      ),
    ).toEqual({
      opinion: "산책할 때 잘 어울렸어요.",
      rating: 4,
      subject: "photo",
      version: 1,
    });
  });

  it("removes an opinion that only contains spaces", () => {
    expect(normalizeRecommendationFeedbackOpinion("   \n ")).toBeUndefined();
  });

  it("limits an opinion to the frontend contract", () => {
    expect(
      normalizeRecommendationFeedbackOpinion(
        "가".repeat(RECOMMENDATION_FEEDBACK_MAX_LENGTH + 1),
      ),
    ).toHaveLength(RECOMMENDATION_FEEDBACK_MAX_LENGTH);
  });
});
