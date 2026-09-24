"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";

export type GrowthProfileState = { ok: boolean; message: string };

export async function saveGrowthProfile(_previous: GrowthProfileState, formData: FormData): Promise<GrowthProfileState> {
  const parsed = z.object({
    goal: z.string().trim().max(2000),
    focuses: z.array(z.enum(["business", "finance", "strategy", "execution", "leadership", "influence"])).max(6),
  }).safeParse({ goal: formData.get("goal")?.toString() ?? "", focuses: formData.getAll("focus") });
  if (!parsed.success) return { ok: false, message: "Growth Profile 内容无效。" };
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("set_growth_profile", {
    p_overall_goal: parsed.data.goal,
    p_focus_codes: parsed.data.focuses,
  });
  if (error) return { ok: false, message: "保存失败，请稍后重试。" };
  for (const path of ["/settings", "/progress", "/study", "/"]) revalidatePath(path);
  return { ok: true, message: "Growth State 与 Current Focus 已保存。" };
}
