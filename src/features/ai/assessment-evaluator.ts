import { z } from "zod";
import { askDeepSeekJson } from "./deepseek-client";

const capabilityCode = z.enum(["business", "finance", "strategy", "execution", "leadership", "influence"]);
const resultSchema = z.object({
  scores: z.array(z.object({ code: capabilityCode, knowledge_score: z.number().min(0).max(30), case_score: z.number().min(0).max(30), practice_score: z.number().min(0).max(40), evidence_level: z.enum(["E0", "E1", "E2", "E3", "E4", "E5"]), rationale: z.string().min(20), evidence_refs: z.array(z.string().uuid()) })).length(6),
  confidence_score: z.number().int().min(0).max(100),
  summary: z.string().min(40),
});

const system = `你是 Executive Growth OS 的能力评估员。你评估的是用户当前可证明的能力，不是潜力，也不因表达自信而加分。
六项能力代码固定为 business, finance, strategy, execution, leadership, influence。每项能力由知识 0–30、案例分析 0–30、实践证据 0–40 组成。
知识评分看概念准确性、边界和误区识别；案例评分看结构、数据、取舍、风险和行动；实践只允许使用提供的、已由用户确认的证据。
没有已确认实践证据时 practice_score 必须为 0 且 evidence_level 为 E0。证据等级上限：E1≤8，E2≤16，E3≤24，E4≤32，E5≤40。
不得把学习记录、假设案例或自述计划当作真实实践。每项 rationale 必须说明得分与不足。evidence_refs 只能引用输入中出现的证据 UUID。
confidence_score 反映数据充分度而非能力高低；数据少时必须降低。严格返回六项且每个代码一次。`;

const outputContract = `输出 JSON 必须严格遵守以下结构，顶层只能包含 scores、confidence_score、summary 三个字段：
{
  "scores": [
    {
      "code": "business | finance | strategy | execution | leadership | influence",
      "knowledge_score": 0,
      "case_score": 0,
      "practice_score": 0,
      "evidence_level": "E0 | E1 | E2 | E3 | E4 | E5",
      "rationale": "至少20个字的中文评分理由",
      "evidence_refs": []
    }
  ],
  "confidence_score": 0,
  "summary": "至少40个字的中文综合结论"
}
scores 必须恰好包含六个对象，每个能力代码出现且只出现一次。不要把六项能力直接放在 JSON 顶层，不要增加 result、assessment、capabilities 等包装字段。`;

export type AssessmentEvaluation = z.infer<typeof resultSchema>;

function requestEvaluation(input: unknown, retry: boolean) {
  return askDeepSeekJson({
    system: `${system}\n\n${outputContract}${retry ? "\n这是一次结构修复重试。上一次返回未通过结构校验；本次必须逐字遵守字段名称和层级。" : ""}`,
    schema: resultSchema,
    user: `请按评分规则评估以下资料，并严格按指定 JSON 结构返回。\n${JSON.stringify(input)}`,
  });
}

export async function evaluateAssessment(input: unknown) {
  try {
    return await requestEvaluation(input, false);
  } catch (error) {
    if (!(error instanceof z.ZodError)) throw error;
    try {
      return await requestEvaluation(input, true);
    } catch (retryError) {
      throw new Error("DeepSeek assessment response failed schema validation after retry.", { cause: retryError });
    }
  }
}
