import { z } from "zod";
import { askDeepSeekJson } from "./deepseek-client";

const capabilityCode = z.enum(["business", "finance", "strategy", "execution", "leadership", "influence"]);
const gapSchema = z.object({
  capability_code: capabilityCode,
  concept_code: z.string().nullable().default(null),
  title: z.string().min(1),
  detail: z.string().min(1),
});
const evidenceSchema = z.object({
  capability_code: capabilityCode,
  evidence_level: z.enum(["E0", "E1", "E2", "E3", "E4", "E5"]),
  context: z.string(),
  user_role: z.string(),
  action: z.string(),
  decision: z.string(),
  stakeholders: z.string(),
  outcome: z.string(),
  why_it_matters: z.string(),
  limitations: z.string(),
  next_evidence_needed: z.string(),
});

const canonicalSchema = z.object({
  analysis: z.string().min(20),
  responsibility_hint: z.string().min(1),
  capabilities: z.array(z.object({ capability_code: capabilityCode, confidence: z.number().min(0).max(1) })),
  evidences: z.array(evidenceSchema),
  knowledge_gaps: z.array(gapSchema),
  practice_gaps: z.array(gapSchema),
  practice_suggestions: z.array(z.string().min(1)),
});

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : value == null ? [] : [value];
}

function text(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value == null) return "";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function normalizedCapability(value: unknown, fallbackText = "") {
  const token = `${text(value)} ${fallbackText}`.toLocaleLowerCase();
  if (/finance|财务|现金|营运资本|working capital/.test(token)) return "finance";
  if (/strategy|战略/.test(token)) return "strategy";
  if (/execution|执行|项目/.test(token)) return "execution";
  if (/leadership|领导/.test(token)) return "leadership";
  if (/influence|影响|沟通/.test(token)) return "influence";
  return "business";
}

function normalizeGap(value: unknown) {
  const item = object(value);
  const raw = text(value);
  const title = text(item.title ?? item.gap ?? item.name) || raw.slice(0, 120) || "未命名 Gap";
  const detail = text(item.detail ?? item.description ?? item.reason) || raw || title;
  const combined = `${title} ${detail}`;
  return {
    capability_code: normalizedCapability(item.capability_code ?? item.capability, combined),
    concept_code: text(item.concept_code ?? item.concept) || (/working capital|营运资本/i.test(combined) ? "working_capital" : null),
    title,
    detail,
  };
}

function normalizeDaily(value: unknown) {
  const root = object(value);
  const evidences = list(root.evidences ?? root.evidence).map((value) => {
    const item = object(value);
    const raw = text(value);
    const level = text(item.evidence_level ?? item.level).toLocaleUpperCase().match(/E[0-5]/)?.[0] ?? "E0";
    return {
      capability_code: normalizedCapability(item.capability_code ?? item.capability, raw),
      evidence_level: level,
      context: text(item.context ?? item.situation ?? item.description),
      user_role: text(item.user_role ?? item.role),
      action: text(item.action),
      decision: text(item.decision),
      stakeholders: text(item.stakeholders),
      outcome: text(item.outcome ?? item.result),
      why_it_matters: text(item.why_it_matters ?? item.significance),
      limitations: text(item.limitations ?? item.limitation),
      next_evidence_needed: text(item.next_evidence_needed ?? item.next_step),
    };
  });
  const knowledgeGaps = list(root.knowledge_gaps).map(normalizeGap);
  const practiceGaps = list(root.practice_gaps).map(normalizeGap);
  const capabilities = list(root.capabilities ?? root.capability_classification).map((value) => {
    const item = object(value);
    const confidence = Number(item.confidence ?? 0.6);
    return { capability_code: normalizedCapability(item.capability_code ?? item.capability ?? value, text(value)), confidence: Number.isFinite(confidence) ? confidence : 0.6 };
  });
  if (!capabilities.length) {
    for (const code of new Set([...evidences, ...knowledgeGaps, ...practiceGaps].map((item) => item.capability_code))) {
      capabilities.push({ capability_code: code, confidence: 0.6 });
    }
  }
  return {
    analysis: text(root.analysis ?? root.summary) || "AI 未提供完整分析，请检查原始记录。",
    responsibility_hint: text(root.responsibility_hint ?? root.responsibility) || "责任层级信息不足",
    capabilities,
    evidences,
    knowledge_gaps: knowledgeGaps,
    practice_gaps: practiceGaps,
    practice_suggestions: list(root.practice_suggestions ?? root.next_practice_suggestions).map(text).filter(Boolean),
  };
}

export const dailyAnalysisSchema = z.preprocess(normalizeDaily, canonicalSchema);

const dailySystem = `你是 Executive Growth OS 的实践证据分析师。绝不改写或丢失用户原始输入。
从真实工作叙述中识别：发生了什么、用户角色、行动、决策、利益相关者、数字、取舍、结果、学习与未理解之处。
六项能力代码只能是 business, finance, strategy, execution, leadership, influence。
Evidence 等级：E0 无有效证据；E1 学习；E2 分析；E3 应用；E4 结果；E5 组织层影响。
证据必须保守，缺少可验证结果时不得评为 E4/E5。Knowledge Gap 尽量填写课程 concept_code；不确定则为 null。
严格输出以下 JSON 结构，不要使用其他字段名：
{"analysis":"string","responsibility_hint":"string","capabilities":[{"capability_code":"finance","confidence":0.8}],"evidences":[{"capability_code":"finance","evidence_level":"E2","context":"string","user_role":"string","action":"string","decision":"string","stakeholders":"string","outcome":"string","why_it_matters":"string","limitations":"string","next_evidence_needed":"string"}],"knowledge_gaps":[{"capability_code":"finance","concept_code":"working_capital","title":"string","detail":"string"}],"practice_gaps":[{"capability_code":"finance","concept_code":null,"title":"string","detail":"string"}],"practice_suggestions":["string"]}。`;

export function analyzeDaily(rawContent: string, context: string) {
  return askDeepSeekJson({
    system: dailySystem,
    schema: dailyAnalysisSchema,
    user: `Context:\n${context}\n\nRaw Input:\n${rawContent}`,
  });
}

export type DailyAnalysis = z.infer<typeof dailyAnalysisSchema>;
