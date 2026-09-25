"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";

export type JourneyActionState = { ok: boolean; message: string };

const nicknameSchema = z.string().trim().min(1, "昵称不能为空。").max(40, "昵称不能超过 40 个字符。");

function refreshJourneyViews() {
  for (const path of ["/", "/settings", "/assessment", "/history"]) revalidatePath(path);
}

export async function updateNickname(_previous: JourneyActionState, formData: FormData): Promise<JourneyActionState> {
  const nickname = nicknameSchema.safeParse(formData.get("nickname"));
  if (!nickname.success) return { ok: false, message: nickname.error.issues[0]?.message ?? "昵称无效。" };
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from("profiles").update({ display_name: nickname.data }).eq("id", user.id);
    if (error) throw error;
    const { data: journey } = await supabase.from("learning_journeys").select("id").eq("user_id", user.id).eq("status", "active").maybeSingle();
    if (journey) await supabase.from("activity_events").insert({ user_id: user.id, journey_id: journey.id, event_type: "profile_updated", title: "修改昵称", summary: "昵称已更新；用户身份没有改变。" });
    refreshJourneyViews();
    return { ok: true, message: "昵称已保存。登录邮箱和用户身份没有改变。" };
  } catch (error) {
    console.error("Nickname update failed", error);
    return { ok: false, message: "昵称保存失败，请稍后再试。" };
  }
}

const restartSchema = z.object({
  mode: z.enum(["trial", "official"]),
  startDate: z.iso.date(),
  reason: z.string().trim().min(5, "请填写至少 5 个字的重启原因。").max(1000),
  confirmation: z.literal("重新开始学习旅程", { error: "请输入完整确认文字。" }),
  copyGoal: z.boolean(),
});

export async function restartJourney(_previous: JourneyActionState, formData: FormData): Promise<JourneyActionState> {
  const parsed = restartSchema.safeParse({ mode: formData.get("mode"), startDate: formData.get("startDate"), reason: formData.get("reason"), confirmation: formData.get("confirmation"), copyGoal: formData.get("copyGoal") === "on" });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "重启信息不完整。" };
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.rpc("restart_learning_journey", { p_mode: parsed.data.mode, p_preparation_started_on: parsed.data.startDate, p_reason: parsed.data.reason, p_copy_long_term_goal: parsed.data.copyGoal, p_confirmation: parsed.data.confirmation });
    if (error) throw error;
    refreshJourneyViews();
    return { ok: true, message: "新旅程已建立。旧旅程仍可在历史中查看，但不会参与当前 AI 判断或评分。" };
  } catch (error) {
    console.error("Journey restart failed", error);
    return { ok: false, message: "旅程重启失败，当前旅程没有改变。" };
  }
}

export async function correctPreparationDate(_previous: JourneyActionState, formData: FormData): Promise<JourneyActionState> {
  const parsed = z.object({ date: z.iso.date(), reason: z.string().trim().min(5).max(1000) }).safeParse({ date: formData.get("date"), reason: formData.get("reason") });
  if (!parsed.success) return { ok: false, message: "请选择日期，并填写至少 5 个字的更正原因。" };
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.rpc("correct_journey_preparation_date", { p_date: parsed.data.date, p_reason: parsed.data.reason });
    if (error) throw error;
    refreshJourneyViews();
    return { ok: true, message: "预学习开始日期已更正，原因已写入历史。" };
  } catch (error) {
    console.error("Journey date correction failed", error);
    return { ok: false, message: "日期无法更正；完成基线诊断后只能通过重启旅程重新计时。" };
  }
}
