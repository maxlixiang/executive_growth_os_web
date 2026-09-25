import "server-only";
import { z } from "zod";
import type { DiagnosticConfidence } from "@/features/growth/confidence";
import { askDeepSeekJson } from "./deepseek-client";

const capabilityCode = z.enum(["business", "finance", "strategy", "execution", "leadership", "influence"]);

function normalizeMilestone(value: unknown) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;

  const parts = Object.values(value)
    .flatMap((item) => Array.isArray(item) ? item : [item])
    .filter((item): item is string | number => typeof item === "string" || typeof item === "number")
    .map(String)
    .map((item) => item.trim())
    .filter(Boolean);

  return [...new Set(parts)].join("；").slice(0, 300);
}

const milestonesSchema = z.preprocess(
  (value) => Array.isArray(value) ? value.slice(0, 4) : value,
  z.array(z.preprocess(normalizeMilestone, z.string().min(3).max(300))).min(2).max(4),
);

export const growthPlanSuggestionSchema = z.object({
  phase_goal: z.string().min(10).max(1000),
  focus_codes: z.array(capabilityCode).min(1).max(2),
  rationale: z.string().min(20).max(3000),
  milestones: milestonesSchema,
  review_in_days: z.number().int().min(42).max(56),
});

export type GrowthPlanSuggestion = z.infer<typeof growthPlanSuggestionSchema>;

export async function recommendGrowthPlan({
  longTermGoal,
  planningSignals,
  confidence,
  currentPlan,
}: {
  longTermGoal: string;
  planningSignals: unknown;
  confidence: DiagnosticConfidence;
  currentPlan: unknown;
}) {
  return askDeepSeekJson({
    system: `你是 Executive Growth OS 的长期发展教练。你的任务是建议未来 6–8 周的阶段计划，而不是评价人格或承诺晋升。

必须遵守：
1. 阶段计划必须服务于用户的长期方向，并连接真实岗位责任与六项标准能力。
2. focus_codes 只能从 business、finance、strategy、execution、leadership、influence 中选择 1–2 项。
3. 优先补足先修知识、反复出现的 Gap 和缺少实践证据的能力；不得仅按课程完成率判断。
4. 区分知识掌握、应用和真实结果；不得虚构经历、数字或能力结论。
5. 当前诊断置信度由系统根据可审计数据确定，你不得修改、重算或另报置信度。置信度低时，必须说明这是暂定计划，需要更多学习与真实工作证据校准。
6. 当前计划不足 42 天时，除非聚合数据出现明显新缺口，否则应保持连续性；如建议切换，必须说明依据。
7. milestones 必须是 2–4 个可观察的中文字符串，不得输出对象，也不得要求用户编造尚未发生的业务结果。
8. 你只能看到能力级聚合数据，不得推断未提供的具体工作事件。
9. 所有输出使用中文。`,
    user: `长期目标：${longTermGoal}

系统诊断置信度：${confidence.score}/100（${confidence.label}）
置信度构成：${JSON.stringify(confidence.factors.map(({ label, points, maximum, detail }) => ({ label, points, maximum, detail })))}
当前阶段计划：${JSON.stringify(currentPlan)}
能力级聚合信号：${JSON.stringify(planningSignals)}

请生成 phase_goal、focus_codes、rationale、milestones、review_in_days。milestones 的格式示例：["完成基础概念学习并通过一次复习", "在真实工作中记录一次判断依据"]。`,
    schema: growthPlanSuggestionSchema,
  });
}
