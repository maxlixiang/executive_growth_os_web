import { describe, expect, it } from "vitest";
import { isRedundantAssessmentLifecycleEvent } from "./presentation";

describe("isRedundantAssessmentLifecycleEvent", () => {
  it("removes assessment start and completion events represented by the assessment session", () => {
    expect(isRedundantAssessmentLifecycleEvent({ event_type: "assessment_started", source_type: "assessment_session" })).toBe(true);
    expect(isRedundantAssessmentLifecycleEvent({ event_type: "assessment_completed", source_type: "assessment_session" })).toBe(true);
  });

  it("keeps journey and unrelated activity events", () => {
    expect(isRedundantAssessmentLifecycleEvent({ event_type: "formal_learning_started", source_type: null })).toBe(false);
    expect(isRedundantAssessmentLifecycleEvent({ event_type: "profile_updated", source_type: null })).toBe(false);
  });
});
