import "server-only";
import { z } from "zod";
import { askDeepSeekJson } from "./deepseek-client";

const capabilityCode = z.enum(["business", "finance", "strategy", "execution", "leadership", "influence"]);
const growthStateSchema = z.object({
  summary: z.string().min(1),
  capability_assessments: z.record(z.string(), z.string()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  knowledge_gaps: z.array(z.string()),
  practice_gaps: z.array(z.string()),
  recent_training_direction: z.string().min(1),
});

export const monthlyReviewSchema = growthStateSchema.extend({
  review_markdown: z.string().min(1),
  focus_codes: z.array(capabilityCode).min(1).max(3),
  recommended_concept_codes: z.array(z.string()).max(12),
  recommended_practice_challenges: z.array(z.string()).max(12),
});

export type MonthlyReviewResult = z.infer<typeof monthlyReviewSchema>;

const looseObjectSchema = z.record(z.string(), z.unknown());

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function stringList(value: unknown) {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
  if (typeof value === "string") return value.split(/\r?\n|[；;]/).map((item) => item.replace(/^[-*\d.\s]+/, "").trim()).filter(Boolean);
  return [];
}

function markdownSection(markdown: string, heading: string) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`##\\s+${escaped}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, "i").exec(markdown);
  return match ? stringList(match[1]) : [];
}

function focusCodes(value: unknown, fallback: string[]) {
  const source = Array.isArray(value) ? value.join(" ") : typeof value === "string" ? value : "";
  const aliases = [
    ["business", /business|商业/i], ["finance", /finance|财务|经营数字/i], ["strategy", /strategy|战略/i],
    ["execution", /execution|执行|项目管理/i], ["leadership", /leadership|领导力/i], ["influence", /influence|影响力/i],
  ] as const;
  const matched = aliases.filter(([, pattern]) => pattern.test(source)).map(([code]) => code);
  return (matched.length ? matched : fallback).slice(0, 3);
}

function capability(value: unknown) {
  return focusCodes(value, ["business"])[0];
}

function contextFocuses(context: string) {
  try {
    const parsed = JSON.parse(context) as { current_focus?: Array<{ capabilities?: { code?: string } }> };
    return (parsed.current_focus ?? []).flatMap((item) => item.capabilities?.code ? [item.capabilities.code] : []);
  } catch {
    return [];
  }
}

export async function generateMonthlyReview(period: string, context: string) {
  const raw = await askDeepSeekJson({
    system: `你是严谨的高管发展评估者。只依据记录评估，不得虚构成果或数字；证据不足时必须明确说明。按以下章节输出 review_markdown：Executive Summary、Capability Progress、Knowledge Progress、Practice Progress、Strong Evidence、Repeated Weaknesses、Knowledge Gaps、Practice Gaps、Missed Opportunities、Next Month Focus、Recommended Concepts、Recommended Practice Challenges。focus_codes 只能从 business、finance、strategy、execution、leadership、influence 中选 1–3 项。所有输出使用中文。`,
    user: `为 ${period} 生成 Monthly Review。以下上下文已经严格按该用户与自然月筛选：\n${context}`,
    schema: looseObjectSchema,
  });
  const currentState = object(raw.current_state);
  const currentStateText = text(raw.current_state);
  const reviewMarkdown = text(raw.review_markdown ?? raw.review);
  const recommendedConcepts = stringList(raw.recommended_concept_codes);
  const practiceChallenges = stringList(raw.recommended_practice_challenges);
  return monthlyReviewSchema.parse({
    review_markdown: reviewMarkdown,
    summary: text(raw.summary ?? currentState.summary, currentStateText || "本周期证据有限，当前状态仍需通过更多真实工作记录校准。"),
    capability_assessments: raw.capability_assessments ?? currentState.capability_assessments ?? {},
    strengths: stringList(raw.strengths ?? currentState.strengths),
    weaknesses: stringList(raw.weaknesses ?? currentState.weaknesses),
    knowledge_gaps: stringList(raw.knowledge_gaps ?? currentState.knowledge_gaps),
    practice_gaps: stringList(raw.practice_gaps ?? currentState.practice_gaps),
    recent_training_direction: text(raw.recent_training_direction ?? currentState.recent_training_direction, "继续积累可验证的工作证据，并针对开放 Gap 进行刻意练习。"),
    focus_codes: focusCodes(raw.focus_codes ?? raw.current_focus, contextFocuses(context)),
    recommended_concept_codes: recommendedConcepts.length ? recommendedConcepts : markdownSection(reviewMarkdown, "Recommended Concepts"),
    recommended_practice_challenges: practiceChallenges.length ? practiceChallenges : markdownSection(reviewMarkdown, "Recommended Practice Challenges"),
  });
}

export const interviewQuestionSchema = z.object({
  question: z.string().min(1),
  capability_focus: capabilityCode,
  why_asked: z.string().min(1),
});

export async function generateInterviewQuestion(context: string, transcript: string) {
  const raw = await askDeepSeekJson({
    system: "你是严苛、中立、Evidence First 的 Executive Interviewer。不要替用户回答。每次只问一个问题，优先追问本人行动、备选方案、取舍、反对者、数字、结果和反事实；避免重复已经回答的内容。所有输出使用中文。",
    user: `成长上下文：\n${context}\n\n当前访谈记录：\n${transcript || "尚未开始。请提出第一问。"}`,
    schema: looseObjectSchema,
  });
  const firstText = Object.values(raw).find((value): value is string => typeof value === "string" && Boolean(value.trim()));
  return interviewQuestionSchema.parse({
    question: raw.question ?? raw.interview_question ?? raw.next_question ?? raw["问题"] ?? firstText,
    capability_focus: capability(raw.capability_focus ?? raw.capability ?? raw["能力"]),
    why_asked: text(raw.why_asked ?? raw.reason ?? raw["提问原因"], "用于检验用户本人贡献、判断依据、取舍与可验证结果。"),
  });
}

export const quarterlyAssessmentSchema = growthStateSchema.extend({
  assessment_markdown: z.string().min(1),
  executive_level_gaps: z.array(z.string()).min(1).max(12),
  next_quarter_focus: z.array(capabilityCode).min(1).max(3),
});

export type QuarterlyAssessmentResult = z.infer<typeof quarterlyAssessmentSchema>;

export async function generateQuarterlyAssessment(period: string, context: string, transcript: string) {
  const raw = await askDeepSeekJson({
    system: "你是严苛、中立、Evidence First 的高管评审者。仅依据成长记录和访谈回答区分团队成果与用户本人贡献，要求数字、结果、取舍和反事实。明确证据不足与 Executive-Level Gap，不得虚构。assessment_markdown 必须包含 Assessment、Evidence、Capability Judgment、Executive-Level Gaps、Next Quarter Focus。所有输出使用中文。",
    user: `为 ${period} 完成 Quarterly Mock Executive Review。\n\n成长上下文：\n${context}\n\n完整访谈：\n${transcript}`,
    schema: looseObjectSchema,
  });
  const currentState = object(raw.current_state);
  const currentStateText = text(raw.current_state);
  const assessmentMarkdown = text(raw.assessment_markdown ?? raw.review);
  const assessmentGaps = stringList(raw.executive_level_gaps ?? raw.gaps);
  return quarterlyAssessmentSchema.parse({
    assessment_markdown: assessmentMarkdown,
    executive_level_gaps: assessmentGaps.length ? assessmentGaps : markdownSection(assessmentMarkdown, "Executive-Level Gaps").slice(0, 12).length ? markdownSection(assessmentMarkdown, "Executive-Level Gaps").slice(0, 12) : ["现有证据不足，需要继续验证高管层级判断与影响力。"],
    next_quarter_focus: focusCodes(raw.next_quarter_focus ?? raw.current_focus, contextFocuses(context)),
    summary: text(raw.summary ?? currentState.summary, currentStateText || "季度访谈已完成，后续需以真实结果继续校准评估。"),
    capability_assessments: raw.capability_assessments ?? currentState.capability_assessments ?? {},
    strengths: stringList(raw.strengths ?? currentState.strengths),
    weaknesses: stringList(raw.weaknesses ?? currentState.weaknesses),
    knowledge_gaps: stringList(raw.knowledge_gaps ?? currentState.knowledge_gaps),
    practice_gaps: stringList(raw.practice_gaps ?? currentState.practice_gaps),
    recent_training_direction: text(raw.recent_training_direction ?? currentState.recent_training_direction, "围绕季度评估暴露的 Executive-Level Gap 进行刻意练习。"),
  });
}
