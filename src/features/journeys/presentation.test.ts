import { describe, expect, it } from "vitest";
import { getJourneyPhase, journeyPhaseStep } from "./presentation";

describe("journey presentation", () => {
  it.each([
    [{ mode: "official", stage: "preparation", baselineCompletedOn: null, foundationReady: false, formalAssessmentDue: false }, "foundation", 0],
    [{ mode: "official", stage: "preparation", baselineCompletedOn: null, foundationReady: true, formalAssessmentDue: false }, "baseline", 1],
    [{ mode: "official", stage: "preparation", baselineCompletedOn: "2026-09-28", foundationReady: true, formalAssessmentDue: false }, "formal_confirmation", 2],
    [{ mode: "trial", stage: "preparation", baselineCompletedOn: "2026-09-28", foundationReady: true, formalAssessmentDue: false }, "trial_complete", 2],
    [{ mode: "official", stage: "active", baselineCompletedOn: "2026-09-28", foundationReady: true, formalAssessmentDue: false }, "cycle", 3],
    [{ mode: "official", stage: "active", baselineCompletedOn: "2026-09-28", foundationReady: true, formalAssessmentDue: true }, "formal_assessment", 4],
  ] as const)("maps %o to %s", (input, expectedPhase, expectedStep) => {
    const phase = getJourneyPhase(input);
    expect(phase).toBe(expectedPhase);
    expect(journeyPhaseStep(phase)).toBe(expectedStep);
  });
});
