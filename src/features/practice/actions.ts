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
  if (input.mode === "save") return { ok: true, message: "原始记录已保存。", captureId: capture.id };

  try {
    await supabase.from("capture_entries").update({ analysis_status: "processing" }).eq("id", capture.id).eq("user_id", user.id);
    const context = await buildGrowthContext(supabase, user.id);
    const analysis = await analyzeDaily(input.content, context);
    const analysisForStorage = {
      ...analysis,
      analysis: analysis.practice_suggestions.length
        ? `${analysis.analysis}\n\n下一步练习建议：\n${analysis.practice_suggestions.map((item) => `• ${item}`).join("\n")}`
        : analysis.analysis,
    };
    const { data: daily, error: finalizeError } = await supabase.rpc("finalize_capture_analysis", {
      p_capture_id: capture.id,
      p_analysis: analysisForStorage as DailyAnalysis,
    });
    if (finalizeError) throw finalizeError;
    for (const path of ["/capture", "/evidence", "/knowledge", "/study", "/history", "/"]) revalidatePath(path);
    return { ok: true, message: "原始记录已保存，AI 分析、Gap 与 Evidence 已生成。", captureId: capture.id, dailyId: daily?.id };
  } catch (error) {
    console.error("Daily analysis failed", error);
    await supabase.from("capture_entries").update({
      analysis_status: "failed",
      analysis_error: "AI 分析失败，可稍后重试；原始记录已安全保存。",
    }).eq("id", capture.id).eq("user_id", user.id);
    return { ok: true, message: "原始记录已保存，但 AI 分析失败；内容没有丢失。", captureId: capture.id };
  }
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
