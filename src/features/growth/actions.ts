"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recommendGrowthPlan, type GrowthPlanSuggestion } from "@/features/ai/growth-planner";
import { requireUser } from "@/lib/auth/require-user";
import type { Json } from "@/lib/supabase/database.types";
import { getGrowthPlanWorkspace } from "./queries";

const capabilityCode = z.enum(["business", "finance", "strategy", "execution", "leadership", "influence"]);
const longTermGoalSchema = z.string().trim().min(10, "请先填写长期发展目标。").max(2000);

export type PlanRecommendationState = {
  ok: boolean;
  message: string;
  suggestion?: GrowthPlanSuggestion;
  longTermGoal?: string;
};

export type ActivatePlanState = { ok: boolean; message: string };

function publicError(error: unknown) {
  console.error("Growth plan workflow error", error);
  if (error instanceof Error && error.message.includes("DeepSeek")) return "AI 服务暂时不可用，请稍后再试。当前计划不会发生变化。";
  if (error instanceof Error && error.message.includes("change reason")) return "修改当前计划时必须填写调整原因。";
  return "操作未完成，请稍后重试。";
}

export async function generateGrowthPlanRecommendation(
  _previous: PlanRecommendationState,
  formData: FormData,
): Promise<PlanRecommendationState> {
  const goal = longTermGoalSchema.safeParse(formData.get("longTermGoal"));
  if (!goal.success) return { ok: false, message: goal.error.issues[0]?.message ?? "长期目标无效。" };
  try {
    const workspace = await getGrowthPlanWorkspace();
    const currentPlan = workspace.currentPlan ? {
      phase_goal: workspace.currentPlan.phase_goal,
      focus_codes: workspace.currentPlan.focus_codes,
      starts_at: workspace.currentPlan.starts_at,
      target_ends_at: workspace.currentPlan.target_ends_at,
    } : null;
    const suggestion = await recommendGrowthPlan({
      longTermGoal: goal.data,
      planningSignals: workspace.planningSignals,
      confidence: workspace.confidence,
      currentPlan,
    });
    return { ok: true, message: "AI 已生成阶段计划建议。请核对后再确认启用。", suggestion, longTermGoal: goal.data };
  } catch (error) {
    return { ok: false, message: publicError(error) };
  }
}

const activationSchema = z.object({
  longTermGoal: longTermGoalSchema,
  phaseGoal: z.string().trim().min(10).max(1000),
  focuses: z.array(capabilityCode).min(1).max(2),
  rationale: z.string().trim().min(10).max(3000),
  milestones: z.array(z.string().trim().min(3).max(300)).min(1).max(4),
  reviewInDays: z.coerce.number().int().min(42).max(56),
  changeReason: z.string().trim().max(1000),
  source: z.enum(["user", "ai"]),
});

export async function activateGrowthPlan(
  _previous: ActivatePlanState,
  formData: FormData,
): Promise<ActivatePlanState> {
  const parsed = activationSchema.safeParse({
    longTermGoal: formData.get("longTermGoal"),
    phaseGoal: formData.get("phaseGoal"),
    focuses: formData.getAll("focus"),
    rationale: formData.get("rationale"),
    milestones: formData.getAll("milestone"),
    reviewInDays: formData.get("reviewInDays"),
    changeReason: formData.get("changeReason") ?? "",
    source: formData.get("source"),
  });
  if (!parsed.success) return { ok: false, message: "计划内容不完整：请选择 1–2 项重点能力，并填写阶段目标与依据。" };
  try {
    const [{ supabase }, workspace] = await Promise.all([requireUser(), getGrowthPlanWorkspace()]);
    if (workspace.currentPlan && parsed.data.changeReason.length < 5) {
      return { ok: false, message: "已有执行中的计划。请填写至少 5 个字的调整原因，旧计划会保留在历史中。" };
    }
    const target = new Date();
    target.setUTCDate(target.getUTCDate() + parsed.data.reviewInDays);
    const confidenceBasis = {
      version: workspace.confidence.version,
      calculated_at: new Date().toISOString(),
      score: workspace.confidence.score,
      factors: workspace.confidence.factors,
    } satisfies Json;
    const { error } = await supabase.rpc("activate_growth_plan", {
      p_long_term_goal: parsed.data.longTermGoal,
      p_phase_goal: parsed.data.phaseGoal,
      p_focus_codes: parsed.data.focuses,
      p_rationale: parsed.data.rationale,
      p_milestones: parsed.data.milestones,
      p_confidence_score: workspace.confidence.score,
      p_confidence_basis: confidenceBasis,
      p_change_reason: parsed.data.changeReason || null,
      p_source: parsed.data.source,
      p_target_ends_at: target.toISOString().slice(0, 10),
    });
    if (error) throw new Error(error.message);
    for (const path of ["/", "/plan", "/progress", "/study", "/help"]) revalidatePath(path);
    return { ok: true, message: "新的阶段计划已经启用；上一版本及调整原因已保留。" };
  } catch (error) {
    return { ok: false, message: publicError(error) };
  }
}
