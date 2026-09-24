"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { generateStudyQuestions, evaluateStudyAnswers } from "@/features/ai/teacher";
import { getKnowledgeWorkspace } from "@/features/knowledge/queries";

const uuidSchema = z.string().uuid();
const answerSchema = z.object({
  attemptId: z.string().uuid(),
  recallAnswer: z.string().trim().min(1, "请先回答 Recall Question。"),
  applicationAnswer: z.string().trim().min(1, "请先回答 Application Question。"),
});

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function contextFor(workspace: Awaited<ReturnType<typeof getKnowledgeWorkspace>>, conceptCode: string) {
  const progress = workspace.progress[conceptCode];
  return JSON.stringify({
    current_focus: workspace.focusCapabilities,
    current_progress: progress ?? null,
    recent_knowledge_gaps: workspace.recentGapText || null,
  });
}

function safeMessage(error: unknown) {
  console.error("Study workflow error", error);
  return error instanceof Error && error.message.includes("DeepSeek")
    ? "AI Teacher 暂时不可用，本次内容没有保存，请稍后重试。"
    : "操作没有完成，本次结果尚未写入进度。";
}

export async function startStudyAttempt(conceptId: string, sessionType: "study" | "quiz"): Promise<Result<{
  attemptId: string;
  recallQuestion: string;
  applicationQuestion: string;
}>> {
  const parsedId = uuidSchema.safeParse(conceptId);
  if (!parsedId.success || !["study", "quiz"].includes(sessionType)) return { ok: false, error: "学习目标无效。" };
  try {
    const [{ supabase, user }, workspace] = await Promise.all([requireUser(), getKnowledgeWorkspace()]);
    const concept = workspace.concepts.find((item) => item.id === parsedId.data);
    if (!concept) return { ok: false, error: "找不到这个知识点。" };
    const questions = await generateStudyQuestions(concept, contextFor(workspace, concept.code));
    const { data, error } = await supabase.from("study_attempts").insert({
      user_id: user.id,
      concept_id: concept.id,
      session_type: sessionType,
      recall_question: questions.recall_question,
      application_question: questions.application_question,
      status: "questioning",
    }).select("id").single();
    if (error) throw error;
    return { ok: true, data: { attemptId: data.id, recallQuestion: questions.recall_question, applicationQuestion: questions.application_question } };
  } catch (error) {
    return { ok: false, error: safeMessage(error) };
  }
}

export async function evaluateStudyAttempt(input: z.infer<typeof answerSchema>): Promise<Result<{
  teaching: string;
  rationale: string;
  conceptScore: number;
  applicationScore: number;
}>> {
  const parsed = answerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "回答不完整。" };
  try {
    const [{ supabase, user }, workspace] = await Promise.all([requireUser(), getKnowledgeWorkspace()]);
    const { data: attempt, error } = await supabase.from("study_attempts").select("*")
      .eq("id", parsed.data.attemptId).eq("user_id", user.id).eq("status", "questioning").single();
    if (error || !attempt) return { ok: false, error: "这次学习已取消、过期或不存在。" };
    const concept = workspace.concepts.find((item) => item.id === attempt.concept_id);
    if (!concept) return { ok: false, error: "找不到这个知识点。" };
    const evaluation = await evaluateStudyAnswers({
      concept,
      context: contextFor(workspace, concept.code),
      recallQuestion: attempt.recall_question,
      recallAnswer: parsed.data.recallAnswer,
      applicationQuestion: attempt.application_question,
      applicationAnswer: parsed.data.applicationAnswer,
    });
    const { error: updateError } = await supabase.from("study_attempts").update({
      recall_answer: parsed.data.recallAnswer,
      application_answer: parsed.data.applicationAnswer,
      ai_feedback: evaluation.teaching,
      ai_rationale: evaluation.rationale,
      concept_score: evaluation.concept_score,
      application_score: evaluation.application_score,
      status: "awaiting_confirmation",
    }).eq("id", attempt.id).eq("user_id", user.id).eq("status", "questioning");
    if (updateError) throw updateError;
    return { ok: true, data: {
      teaching: evaluation.teaching,
      rationale: evaluation.rationale,
      conceptScore: evaluation.concept_score,
      applicationScore: evaluation.application_score,
    } };
  } catch (error) {
    return { ok: false, error: safeMessage(error) };
  }
}

export async function confirmStudyAttempt(attemptId: string): Promise<Result<{ sessionId: string; nextReviewAt: string }>> {
  const parsed = uuidSchema.safeParse(attemptId);
  if (!parsed.success) return { ok: false, error: "学习记录无效。" };
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase.rpc("commit_study_attempt", { p_attempt_id: parsed.data });
    if (error) throw error;
    const session = data as unknown as { id: string; resulting_next_review_at: string };
    revalidatePath("/study");
    revalidatePath("/quiz");
    revalidatePath("/progress");
    revalidatePath("/");
    return { ok: true, data: { sessionId: session.id, nextReviewAt: session.resulting_next_review_at } };
  } catch (error) {
    return { ok: false, error: safeMessage(error) };
  }
}

export async function cancelStudyAttempt(attemptId: string): Promise<Result<null>> {
  const parsed = uuidSchema.safeParse(attemptId);
  if (!parsed.success) return { ok: false, error: "学习记录无效。" };
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("study_attempts").update({ status: "cancelled" })
    .eq("id", parsed.data).eq("user_id", user.id).in("status", ["questioning", "awaiting_confirmation"]);
  return error ? { ok: false, error: "取消失败，请刷新后重试。" } : { ok: true, data: null };
}

export async function setStudySessionValidity(sessionId: string, valid: boolean, reason?: string): Promise<Result<null>> {
  const parsed = uuidSchema.safeParse(sessionId);
  if (!parsed.success) return { ok: false, error: "学习记录无效。" };
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.rpc("set_study_session_validity", {
      p_session_id: parsed.data,
      p_valid: valid,
      p_reason: reason ?? null,
    });
    if (error) throw error;
    revalidatePath("/study/history");
    revalidatePath(`/study/history/${sessionId}`);
    revalidatePath("/progress");
    revalidatePath("/");
    return { ok: true, data: null };
  } catch (error) {
    return { ok: false, error: safeMessage(error) };
  }
}
