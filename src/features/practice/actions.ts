"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { analyzeDaily, type DailyAnalysis } from "@/features/ai/daily-analyzer";
import { buildGrowthContext } from "@/features/ai/context-builder";
import { requireUser } from "@/lib/auth/require-user";

const captureSchema = z.object({
  title: z.string().trim().max(160).optional(),
  content: z.string().trim().min(1, "请先写下内容。").max(20_000),
  entryType: z.enum(["work_event", "idea", "question", "follow_up"]),
  mode: z.enum(["save", "analyze"]),
});

export type CaptureState = { ok: boolean; message: string; captureId?: string; dailyId?: string };

async function analyzeStoredCapture(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string,
  capture: { id: string; content: string },
) {
  await supabase.from("capture_entries").update({ analysis_status: "processing", analysis_error: null }).eq("id", capture.id).eq("user_id", userId);
  try {
    const context = await buildGrowthContext(supabase, userId);
    const analysis = await analyzeDaily(capture.content, context);
    const analysisForStorage = {
      ...analysis,
      analysis: analysis.practice_suggestions.length
        ? `${analysis.analysis}\n\n下一步练习建议：\n${analysis.practice_suggestions.map((item) => `• ${item}`).join("\n")}`
        : analysis.analysis,
    };
    const { data: daily, error } = await supabase.rpc("finalize_capture_analysis", {
      p_capture_id: capture.id,
      p_analysis: analysisForStorage as DailyAnalysis,
    });
    if (error) throw error;
    return daily;
  } catch (error) {
    await supabase.from("capture_entries").update({
      analysis_status: "failed",
      analysis_error: "AI 分析失败，可稍后重试；原始记录已安全保存。",
    }).eq("id", capture.id).eq("user_id", userId);
    throw error;
  }
}

function revalidateRecordViews() {
  for (const path of ["/capture", "/knowledge", "/study", "/history", "/progress", "/"]) revalidatePath(path);
}

async function persistCapture(input: z.infer<typeof captureSchema>): Promise<CaptureState> {
  const { supabase, user } = await requireUser();
  const { data: capture, error: insertError } = await supabase.from("capture_entries").insert({
    user_id: user.id,
    title: input.title || null,
    content: input.content,
    entry_type: input.entryType,
    analysis_status: input.mode === "analyze" ? "pending" : "not_requested",
  }).select("id").single();
  if (insertError) throw insertError;
  revalidatePath("/capture");
  if (input.mode === "save") return { ok: true, message: "原始记录已保存，尚未发送给 AI。你可以稍后单独分析这条记录。", captureId: capture.id };

  try {
    const daily = await analyzeStoredCapture(supabase, user.id, { id: capture.id, content: input.content });
    revalidateRecordViews();
    return { ok: true, message: "记录已保存并完成 AI 分析。实践证据已作为候选项生成，请核对后确认。", captureId: capture.id, dailyId: daily?.id };
  } catch (error) {
    console.error("Daily analysis failed", error);
    await supabase.from("capture_entries").update({
      analysis_status: "failed",
      analysis_error: "AI 分析失败，可稍后重试；原始记录已安全保存。",
    }).eq("id", capture.id).eq("user_id", user.id);
    return { ok: true, message: "原始记录已保存，但 AI 分析失败；内容没有丢失。", captureId: capture.id };
  }
}

export async function analyzeCapture(formData: FormData) {
  const captureId = z.string().uuid().safeParse(formData.get("captureId"));
  if (!captureId.success) return;
  const { supabase, user } = await requireUser();
  const { data: capture, error } = await supabase.from("capture_entries").select("id, content, analysis_status").eq("id", captureId.data).eq("user_id", user.id).single();
  if (error || !capture || capture.analysis_status === "completed" || capture.analysis_status === "processing") return;
  try { await analyzeStoredCapture(supabase, user.id, capture); }
  catch (analysisError) { console.error("Capture analysis failed", analysisError); }
  revalidateRecordViews();
}

export async function analyzePendingCaptures() {
  const { supabase, user } = await requireUser();
  const { data: journey } = await supabase.from("learning_journeys").select("id").eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (!journey) return;
  const { data: captures, error } = await supabase.from("capture_entries")
    .select("id, content, analysis_status")
    .eq("user_id", user.id)
    .eq("journey_id", journey.id)
    .in("analysis_status", ["not_requested", "failed"])
    .order("created_at", { ascending: true })
    .limit(20);
  if (error) throw error;
  for (const capture of captures ?? []) {
    try { await analyzeStoredCapture(supabase, user.id, capture); }
    catch (analysisError) { console.error("Pending capture analysis failed", capture.id, analysisError); }
  }
  revalidateRecordViews();
}

export async function reviewEvidence(formData: FormData) {
  const parsed = z.object({
    evidenceId: z.string().uuid(),
    status: z.enum(["confirmed", "needs_more", "invalidated"]),
  }).safeParse({ evidenceId: formData.get("evidenceId"), status: formData.get("status") });
  if (!parsed.success) return;
  const { supabase, user } = await requireUser();
  const { data: evidence, error: evidenceError } = await supabase.from("practice_evidence")
    .select("id, journey_id, evidence_level")
    .eq("id", parsed.data.evidenceId)
    .eq("user_id", user.id)
    .single();
  if (evidenceError) throw evidenceError;
  const { error } = await supabase.from("practice_evidence").update({
    review_status: parsed.data.status,
    reviewed_at: new Date().toISOString(),
  }).eq("id", parsed.data.evidenceId).eq("user_id", user.id);
  if (error) throw error;
  const statusLabels = { confirmed: "确认采用", needs_more: "标记为需补充", invalidated: "不采用" } as const;
  const { error: eventError } = await supabase.from("activity_events").insert({
    user_id: user.id,
    journey_id: evidence.journey_id,
    event_type: "practice_evidence_reviewed",
    title: `${statusLabels[parsed.data.status]}实践证据`,
    summary: `证据等级 ${evidence.evidence_level}。`,
    source_type: "practice_evidence",
    source_id: evidence.id,
    metadata: { review_status: parsed.data.status },
  });
  if (eventError) throw eventError;
  revalidateRecordViews();
}

export async function submitCapture(_previous: CaptureState, formData: FormData): Promise<CaptureState> {
  const parsed = captureSchema.safeParse({
    title: formData.get("title")?.toString(), content: formData.get("content")?.toString(),
    entryType: formData.get("entryType")?.toString(), mode: formData.get("mode")?.toString(),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "提交内容无效。" };
  try { return await persistCapture(parsed.data); }
  catch (error) { console.error("Capture save failed", error); return { ok: false, message: "保存失败，请稍后重试。" }; }
}

export async function submitDaily(_previous: CaptureState, formData: FormData): Promise<CaptureState> {
  const parsed = captureSchema.safeParse({
    title: formData.get("title")?.toString() || "Daily Reflection",
    content: formData.get("content")?.toString(), entryType: "work_event", mode: "analyze",
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "提交内容无效。" };
  try { return await persistCapture(parsed.data); }
  catch (error) { console.error("Daily save failed", error); return { ok: false, message: "保存失败，请稍后重试。" }; }
}
