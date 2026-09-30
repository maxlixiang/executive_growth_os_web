"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
export async function saveLearnerMemory(_previous: { ok: boolean; message: string }, form: FormData) {
  const input = z.object({ journeyId: z.string().uuid(), markdown: z.string().trim().max(12000) }).safeParse({ journeyId: form.get("journeyId"), markdown: form.get("markdown") });
  if (!input.success) return { ok: false, message: "档案最多12000字，请检查内容。" };
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("save_learner_memory", { p_journey_id: input.data.journeyId, p_markdown: input.data.markdown });
  if (error) return { ok: false, message: "档案未保存。请检查当前旅程或稍后重试。" };
  revalidatePath("/memory");
  return { ok: true, message: "已保存。下一次AI教学、工作分析、计划和面试将读取新档案。" };
}
