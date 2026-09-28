"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { evaluateAssessment } from "@/features/ai/assessment-evaluator";
import { requireUser } from "@/lib/auth/require-user";
import { assessmentQuestions } from "./questions";
import { calculateReadiness, type CapabilityCode } from "./readiness";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };
const typeSchema = z.enum(["baseline", "self_check", "formal"]);
const uuidSchema = z.string().uuid();
const answerSchema = z.record(z.enum(["business", "finance", "strategy", "execution", "leadership", "influence"]), z.object({
  knowledge: z.string().trim().min(1, "请回答所有知识问题。").max(6000),
  case: z.string().trim().min(1, "请回答所有案例问题。").max(6000),
}));
const evidenceCaps = { E0: 0, E1: 8, E2: 16, E3: 24, E4: 32, E5: 40 } as const;

function safeError(error: unknown) {
  console.error("Assessment workflow error", error);
  const message = error instanceof Error ? error.message : "";
  if (message.includes("Foundation learning")) return "24 项基础概念尚未全部完成。";
  if (message.includes("already in progress")) return "已有一场评估正在进行，请先完成它。";
  if (message.includes("not due")) return "本周期正式评估日期尚未到。";
  if (message.includes("DeepSeek")) return "AI 评估暂时不可用；本次回答尚未写入评分，请稍后重试。";
  return "操作未完成，现有评分和学习进度没有改变。";
}

export async function startAssessment(type: string): Promise<Result<{ sessionId: string }>> {
  const parsed = typeSchema.safeParse(type);
  if (!parsed.success) return { ok: false, error: "评估类型无效。" };
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase.rpc("start_assessment_session", { p_assessment_type: parsed.data, p_question_set: assessmentQuestions });
    if (error) throw error;
    return { ok: true, data: { sessionId: data.id } };
  } catch (error) {
    return { ok: false, error: safeError(error) };
  }
}

export async function submitAssessment(sessionId: string, answers: unknown): Promise<Result<{ readiness: number }>> {
  const parsedId = uuidSchema.safeParse(sessionId);
  const parsedAnswers = answerSchema.safeParse(answers);
  if (!parsedId.success || !parsedAnswers.success) return { ok: false, error: parsedAnswers.error?.issues[0]?.message ?? "评估回答无效。" };
  try {
    const { supabase, user } = await requireUser();
    const { data: session, error: sessionError } = await supabase.from("assessment_sessions").select("id, journey_id, assessment_type, status, question_set")
      .eq("id", parsedId.data).eq("user_id", user.id).eq("status", "in_progress").single();
    if (sessionError || !session) return { ok: false, error: "这场评估不存在或已经结束。" };
    const [capabilities, evidence, progress] = await Promise.all([
      supabase.from("capabilities").select("id, code, title_en, title_zh").eq("is_active", true).order("sort_order"),
      supabase.from("practice_evidence").select("id, capability_id, evidence_level, context, user_role, action, decision, outcome, limitations, reviewed_at")
        .eq("user_id", user.id).eq("journey_id", session.journey_id).eq("review_status", "confirmed").order("created_at", { ascending: false }).limit(60),
      supabase.from("knowledge_progress").select("status, review_count, last_concept_score, last_application_score, knowledge_concepts(concept_code, title_en, capability_id)").eq("user_id", user.id),
    ]);
    const failed = [capabilities, evidence, progress].find((result) => result.error);
    if (failed?.error) throw failed.error;
    const codeById = new Map((capabilities.data ?? []).map((item) => [item.id, item.code]));
    const confirmedEvidence = (evidence.data ?? []).map((item) => ({ ...item, capability_code: codeById.get(item.capability_id) }));
    const evaluation = await evaluateAssessment({ assessment_type: session.assessment_type, questions: session.question_set, answers: parsedAnswers.data, confirmed_practice_evidence: confirmedEvidence, knowledge_progress: progress.data });
    const validEvidenceIds = new Set(confirmedEvidence.map((item) => item.id));
    const maxLevelByCode = new Map<string, keyof typeof evidenceCaps>();
    for (const item of confirmedEvidence) {
      const code = item.capability_code;
      const level = item.evidence_level as keyof typeof evidenceCaps;
      if (code && evidenceCaps[level] > evidenceCaps[maxLevelByCode.get(code) ?? "E0"]) maxLevelByCode.set(code, level);
    }
    const scoreByCode = new Map(evaluation.scores.map((item) => [item.code, item]));
    const normalized = (capabilities.data ?? []).map((capability) => {
      const code = capability.code as CapabilityCode;
      const score = scoreByCode.get(code);
      if (!score) throw new Error(`Missing capability score: ${code}`);
      const level = maxLevelByCode.get(code) ?? "E0";
      return { ...score, knowledge_score: Math.max(0, Math.min(30, Math.round(score.knowledge_score * 10) / 10)), case_score: Math.max(0, Math.min(30, Math.round(score.case_score * 10) / 10)), practice_score: Math.max(0, Math.min(evidenceCaps[level], Math.round(score.practice_score * 10) / 10)), evidence_level: level, evidence_refs: score.evidence_refs.filter((id) => validEvidenceIds.has(id)) };
    });
    const readiness = calculateReadiness(Object.fromEntries(normalized.map((item) => [item.code, { knowledge: item.knowledge_score, case: item.case_score, practice: item.practice_score }])) as Record<CapabilityCode, { knowledge: number; case: number; practice: number }>);
    const { data, error } = await supabase.rpc("complete_assessment_session", { p_session_id: session.id, p_answer_set: parsedAnswers.data, p_scores: normalized, p_confidence_score: evaluation.confidence_score, p_result_summary: evaluation.summary });
    if (error) throw error;
    for (const path of ["/", "/assessment", "/history", "/progress"]) revalidatePath(path);
    return { ok: true, data: { readiness: Number(data.readiness_score ?? readiness.toFixed(2)) } };
  } catch (error) {
    return { ok: false, error: safeError(error) };
  }
}
