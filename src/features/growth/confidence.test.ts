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
      monthlyReviews: 0,
      completedQuarterlyReviews: 0,
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
      monthlyReviews: 1,
      completedQuarterlyReviews: 1,
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
      monthlyReviews: 99,
      completedQuarterlyReviews: 99,
    });
    expect(result.score).toBe(100);
  });
});
