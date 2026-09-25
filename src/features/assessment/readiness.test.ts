import { describe, expect, it } from "vitest";
import { calculateReadiness, evaluateReadinessGate, type CapabilityCode } from "./readiness";

const codes: CapabilityCode[] = ["business", "finance", "strategy", "execution", "leadership", "influence"];
const scores = (knowledge: number, caseScore: number, practice: number) => Object.fromEntries(codes.map((code) => [code, { knowledge, case: caseScore, practice }])) as Record<CapabilityCode, { knowledge: number; case: number; practice: number }>;

describe("executive readiness", () => {
  it("uses a 100 point weighted scale", () => expect(calculateReadiness(scores(30, 30, 40))).toBe(100));
  it("requires the overall threshold and every floor", () => {
    expect(evaluateReadinessGate(scores(21, 21, 28)).ready).toBe(true);
    const result = evaluateReadinessGate({ ...scores(21, 21, 28), finance: { knowledge: 17, case: 30, practice: 40 } });
    expect(result.ready).toBe(false);
    expect(result.gates.knowledgeFloor).toBe(false);
  });
});
