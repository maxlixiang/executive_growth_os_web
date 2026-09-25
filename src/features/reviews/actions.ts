"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateInterviewQuestion, generateMonthlyReview, generateQuarterlyAssessment } from "@/features/ai/reviewer";
import { requireUser } from "@/lib/auth/require-user";
import { buildPeriodContext } from "./queries";
import { monthPeriod, quarterPeriod } from "./periods";

export type WorkflowState = { ok: boolean; message: string; href?: string };
const initialFailure: WorkflowState = { ok: false, message: "请求无效。" };

function safeMessage(error: unknown) {
  console.error("Review workflow error", error);
  return error instanceof Error && error.message.includes("DeepSeek")
    ? "AI 服务暂时不可用，已保存的数据不会丢失，请稍后继续。"
    : "操作未完成，请稍后重试。";
}

export async function runMonthlyReview(_previous: WorkflowState, formData: FormData): Promise<WorkflowState> {
  const key = z.string().regex(/^\d{4}-\d{2}$/).safeParse(formData.get("period"));
  if (!key.success) return initialFailure;
  const period = monthPeriod(key.data);
  if (!period) return initialFailure;
  try {
    const { supabase, user } = await requireUser();
    const context = await buildPeriodContext(supabase, user.id, period);
    const result = await generateMonthlyReview(key.data, context);
    const { data: concepts, error: conceptError } = await supabase.from("knowledge_concepts").select("id, concept_code, title_en, title_zh");
    if (conceptError) throw new Error(conceptError.message);
    const recommendations = result.recommended_concept_codes.map((item) => item.toLocaleLowerCase());
    const recommendedIds = (concepts ?? []).filter((concept) => recommendations.some((item) =>
      [concept.concept_code, concept.title_en, concept.title_zh].some((candidate) => item === candidate.toLocaleLowerCase() || item.includes(candidate.toLocaleLowerCase())),
    )).map((item) => item.id);
    const { error } = await supabase.rpc("finalize_monthly_review", {
      p_period_start: period.start,
      p_period_end: period.end,
      p_review_markdown: result.review_markdown,
      p_recommended_concept_ids: recommendedIds,
      p_recommended_practice_challenges: result.recommended_practice_challenges,
      p_focus_codes: result.focus_codes,
      p_summary: result.summary,
      p_capability_assessments: result.capability_assessments,
      p_strengths: result.strengths,
      p_weaknesses: result.weaknesses,
      p_knowledge_gaps: result.knowledge_gaps,
      p_practice_gaps: result.practice_gaps,
      p_recent_training_direction: result.recent_training_direction,
    });
    if (error) throw new Error(error.message);
    for (const path of ["/", "/reviews", "/progress", "/plan", `/reviews/monthly/${key.data}`]) revalidatePath(path);
    return { ok: true, message: `${key.data} Monthly Review 已生成。`, href: `/reviews/monthly/${key.data}` };
  } catch (error) {
    return { ok: false, message: safeMessage(error) };
  }
}

function transcriptText(messages: Array<{ role: string; content: string; sequence_number: number }>) {
  return messages.map((item) => `${item.sequence_number}. ${item.role === "interviewer" ? "Interviewer" : "User"}: ${item.content}`).join("\n\n");
}

async function insertQuestion(sessionId: string, sequence: number, context: string, transcript: string) {
  const { supabase, user } = await requireUser();
  const question = await generateInterviewQuestion(context, transcript);
  const { data: capability, error: capabilityError } = await supabase.from("capabilities").select("id").eq("code", question.capability_focus).single();
  if (capabilityError) throw new Error(capabilityError.message);
  const { error } = await supabase.from("interview_messages").insert({
    user_id: user.id,
    interview_session_id: sessionId,
    role: "interviewer",
    content: question.question,
    capability_id: capability.id,
    sequence_number: sequence,
  });
  if (error) throw new Error(error.message);
}

export async function startQuarterlyInterview(_previous: WorkflowState, formData: FormData): Promise<WorkflowState> {
  const key = z.string().regex(/^\d{4}-Q[1-4]$/).safeParse(formData.get("period"));
  if (!key.success) return initialFailure;
  const period = quarterPeriod(key.data);
  if (!period) return initialFailure;
  try {
    const { supabase, user } = await requireUser();
    const { data: session, error } = await supabase.rpc("start_quarterly_interview", { p_period_start: period.start, p_period_end: period.end });
    if (error || !session) throw new Error(error?.message ?? "Unable to start interview");
    const { data: messages, error: messagesError } = await supabase.from("interview_messages").select("role, content, sequence_number").eq("interview_session_id", session.id).eq("user_id", user.id).order("sequence_number");
    if (messagesError) throw new Error(messagesError.message);
    if (!messages?.length) {
      const context = await buildPeriodContext(supabase, user.id, period);
      await insertQuestion(session.id, 1, context, "");
    }
    revalidatePath("/reviews");
    revalidatePath("/interviews");
    return { ok: true, message: `${key.data} 模拟面试已准备好。`, href: `/interviews/${session.id}` };
  } catch (error) {
    return { ok: false, message: safeMessage(error) };
  }
}

async function advanceInterview(sessionId: string): Promise<WorkflowState> {
  const { supabase, user } = await requireUser();
  const [sessionResult, messagesResult] = await Promise.all([
    supabase.from("interview_sessions").select("*, quarterly_reviews(*)").eq("id", sessionId).eq("user_id", user.id).maybeSingle(),
    supabase.from("interview_messages").select("role, content, sequence_number").eq("interview_session_id", sessionId).eq("user_id", user.id).order("sequence_number"),
  ]);
  if (sessionResult.error || !sessionResult.data) throw new Error(sessionResult.error?.message ?? "Interview not found");
  if (messagesResult.error) throw new Error(messagesResult.error.message);
  const session = sessionResult.data;
  const review = session.quarterly_reviews;
  if (!review || session.status !== "active") return { ok: true, message: "访谈已经完成。", href: `/reviews/quarterly/${review?.period_start ?? ""}` };
  const messages = messagesResult.data ?? [];
  const last = messages.at(-1);
  const answerCount = messages.filter((item) => item.role === "user").length;
  const quarter = Math.floor((Number(review.period_start.slice(5, 7)) - 1) / 3) + 1;
  const key = `${review.period_start.slice(0, 4)}-Q${quarter}`;
  const period = quarterPeriod(key);
  if (!period) throw new Error("Invalid review period");
  const context = await buildPeriodContext(supabase, user.id, period);
  const transcript = transcriptText(messages);
  if (!last) {
    await insertQuestion(sessionId, 1, context, "");
    revalidatePath(`/interviews/${sessionId}`);
    return { ok: true, message: "第一问已生成。" };
  }
  if (last.role !== "user") return { ok: true, message: "请回答当前问题。" };
  if (answerCount < 3) {
    await insertQuestion(sessionId, last.sequence_number + 1, context, transcript);
    revalidatePath(`/interviews/${sessionId}`);
    return { ok: true, message: "下一问已生成。" };
  }
  const result = await generateQuarterlyAssessment(key, context, transcript);
  const { error } = await supabase.rpc("complete_quarterly_review", {
    p_session_id: sessionId,
    p_assessment_markdown: result.assessment_markdown,
    p_executive_level_gaps: result.executive_level_gaps,
    p_next_quarter_focus: result.next_quarter_focus,
    p_summary: result.summary,
    p_capability_assessments: result.capability_assessments,
    p_strengths: result.strengths,
    p_weaknesses: result.weaknesses,
    p_knowledge_gaps: result.knowledge_gaps,
    p_practice_gaps: result.practice_gaps,
    p_recent_training_direction: result.recent_training_direction,
  });
  if (error) throw new Error(error.message);
  for (const path of ["/", "/reviews", "/interviews", "/progress", "/plan", `/interviews/${sessionId}`, `/reviews/quarterly/${key}`]) revalidatePath(path);
  return { ok: true, message: "Quarterly Assessment 已完成。", href: `/reviews/quarterly/${key}` };
}

export async function answerInterview(_previous: WorkflowState, formData: FormData): Promise<WorkflowState> {
  const parsed = z.object({ id: z.string().uuid(), answer: z.string().trim().min(1).max(8000) }).safeParse({ id: formData.get("id"), answer: formData.get("answer") });
  if (!parsed.success) return { ok: false, message: "请输入有效回答。" };
  try {
    const { supabase, user } = await requireUser();
    const { data: messages, error: messagesError } = await supabase.from("interview_messages").select("role, sequence_number").eq("interview_session_id", parsed.data.id).eq("user_id", user.id).order("sequence_number");
    if (messagesError) throw new Error(messagesError.message);
    const last = messages?.at(-1);
    if (!last || last.role !== "interviewer") return { ok: false, message: "当前没有等待回答的问题。" };
    const { error } = await supabase.from("interview_messages").insert({ user_id: user.id, interview_session_id: parsed.data.id, role: "user", content: parsed.data.answer, sequence_number: last.sequence_number + 1 });
    if (error) throw new Error(error.message);
    return await advanceInterview(parsed.data.id);
  } catch (error) {
    revalidatePath(`/interviews/${parsed.data.id}`);
    return { ok: false, message: safeMessage(error) };
  }
}

export async function continueInterview(_previous: WorkflowState, formData: FormData): Promise<WorkflowState> {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return initialFailure;
  try {
    return await advanceInterview(id.data);
  } catch (error) {
    return { ok: false, message: safeMessage(error) };
  }
}
