import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const { askDeepSeekJson } = vi.hoisted(() => ({ askDeepSeekJson: vi.fn() }));
vi.mock("./deepseek-client", () => ({ askDeepSeekJson }));

import { evaluateAssessment } from "./assessment-evaluator";

const validEvaluation = {
  scores: ["business", "finance", "strategy", "execution", "leadership", "influence"].map((code) => ({
    code,
    knowledge_score: 20,
    case_score: 20,
    practice_score: 0,
    evidence_level: "E0",
    rationale: "这是用于验证评估返回结构和重试行为的充分长度测试理由。",
    evidence_refs: [],
  })),
  confidence_score: 40,
  summary: "这是用于验证评估返回结构和重试行为的综合测试结论，不代表任何真实用户的能力水平。",
};

function schemaError() {
  try {
    z.object({ scores: z.array(z.unknown()) }).parse({});
  } catch (error) {
    return error;
  }
  throw new Error("Expected schema validation to fail.");
}

describe("evaluateAssessment", () => {
  beforeEach(() => askDeepSeekJson.mockReset());

  it("returns the first valid structured evaluation without retrying", async () => {
    askDeepSeekJson.mockResolvedValueOnce(validEvaluation);

    await expect(evaluateAssessment({ assessment_type: "baseline" })).resolves.toEqual(validEvaluation);
    expect(askDeepSeekJson).toHaveBeenCalledTimes(1);
  });

  it("retries once with stricter structure instructions after a schema mismatch", async () => {
    askDeepSeekJson.mockRejectedValueOnce(schemaError()).mockResolvedValueOnce(validEvaluation);

    await expect(evaluateAssessment({ assessment_type: "baseline" })).resolves.toEqual(validEvaluation);
    expect(askDeepSeekJson).toHaveBeenCalledTimes(2);
    expect(askDeepSeekJson.mock.calls[1][0].system).toContain("结构修复重试");
    expect(askDeepSeekJson.mock.calls[1][0].system).toContain("顶层只能包含 scores、confidence_score、summary");
  });
});
