import { describe, expect, it } from "vitest";
import { calculateDiagnosticConfidence } from "./confidence";

describe("calculateDiagnosticConfidence", () => {
  it("keeps a cold-start plan at low confidence", () => {
    const result = calculateDiagnosticConfidence({
      hasLongTermGoal: true,
      validStudySessions: 0,
      studiedCapabilities: 0,
      analyzedReflections: 0,
      practiceEvidence: 0,
      evidencedCapabilities: 0,
      flexibleReviews: 0,
      completedFormalAssessments: 0,
    });
    expect(result.score).toBe(20);
    expect(result.level).toBe("low");
  });

  it("rises as independent learning and evidence signals accumulate", () => {
    const result = calculateDiagnosticConfidence({
      hasLongTermGoal: true,
      validStudySessions: 10,
      studiedCapabilities: 4,
      analyzedReflections: 5,
      practiceEvidence: 5,
      evidencedCapabilities: 4,
      flexibleReviews: 1,
      completedFormalAssessments: 1,
    });
    expect(result.score).toBe(90);
    expect(result.level).toBe("high");
  });

  it("never exceeds 100", () => {
    const result = calculateDiagnosticConfidence({
      hasLongTermGoal: true,
      validStudySessions: 999,
      studiedCapabilities: 99,
      analyzedReflections: 999,
      practiceEvidence: 999,
      evidencedCapabilities: 99,
      flexibleReviews: 99,
      completedFormalAssessments: 99,
    });
    expect(result.score).toBe(100);
  });
});
