"use client";

import { useActionState } from "react";
import { Bot, CheckCircle2, Sparkles } from "lucide-react";
import {
  activateGrowthPlan,
  generateGrowthPlanRecommendation,
  type ActivatePlanState,
  type PlanRecommendationState,
} from "./actions";

const recommendationInitial: PlanRecommendationState = { ok: false, message: "" };
const activationInitial: ActivatePlanState = { ok: false, message: "" };

type Capability = { code: string; titleEn: string; titleZh: string };

export function GrowthPlanManager({
  goal,
  capabilities,
  hasCurrentPlan,
  currentFocusCodes,
}: {
  goal: string;
  capabilities: Capability[];
  hasCurrentPlan: boolean;
  currentFocusCodes: string[];
}) {
  const [recommendation, recommendAction, recommending] = useActionState(generateGrowthPlanRecommendation, recommendationInitial);
  const [activation, activateAction, activating] = useActionState(activateGrowthPlan, activationInitial);
  const suggestion = recommendation.suggestion;
  const capabilityMap = new Map(capabilities.map((item) => [item.code, item]));

  return (
    <div className="mt-8 space-y-8">
      <form action={recommendAction} className="rounded-2xl border border-line p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><Bot aria-hidden="true" size={20} /></span>
          <div><h2 className="text-xl font-bold">让 AI 建议下一阶段计划</h2><p className="mt-1 text-sm leading-6 text-muted">只发送长期目标和能力级聚合数据，不发送会议、复盘或证据正文。AI 只提出建议，不会自动修改当前计划。</p></div>
        </div>
        <label className="mt-6 block"><span className="font-bold">长期发展目标</span><textarea name="longTermGoal" defaultValue={goal} rows={4} maxLength={2000} required minLength={10} placeholder="例如：从法务专业岗位成长为能够承担经营判断、跨部门执行与组织影响责任的高级管理者。" className="mt-3 w-full rounded-xl border border-line px-4 py-3 leading-7" /></label>
        {recommendation.message ? <Status ok={recommendation.ok} message={recommendation.message} /> : null}
        <button disabled={recommending} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 font-bold text-white disabled:opacity-60 sm:w-auto"><Sparkles aria-hidden="true" size={18} />{recommending ? "正在分析聚合数据…" : "生成阶段计划建议"}</button>
      </form>

      {suggestion && recommendation.longTermGoal ? (
        <form action={activateAction} className="rounded-2xl bg-accent-soft p-5 sm:p-7">
          <p className="text-sm font-bold text-accent-strong">AI RECOMMENDATION · 等待确认</p>
          <h2 className="mt-2 text-2xl font-bold">{suggestion.phase_goal}</h2>
          <div className="mt-4 flex flex-wrap gap-2">{suggestion.focus_codes.map((code) => <span key={code} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-accent">{capabilityMap.get(code)?.titleEn} · {capabilityMap.get(code)?.titleZh}</span>)}</div>
          <p className="mt-5 leading-7 text-muted">{suggestion.rationale}</p>
          <div className="mt-5"><p className="text-sm font-bold">阶段里程碑</p><ul className="mt-3 space-y-2 text-sm leading-6">{suggestion.milestones.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-1 shrink-0 text-accent" size={16} /><span>{item}</span></li>)}</ul></div>
          <input type="hidden" name="longTermGoal" value={recommendation.longTermGoal} />
          <input type="hidden" name="phaseGoal" value={suggestion.phase_goal} />
          {suggestion.focus_codes.map((code) => <input key={code} type="hidden" name="focus" value={code} />)}
          <input type="hidden" name="rationale" value={suggestion.rationale} />
          {suggestion.milestones.map((item) => <input key={item} type="hidden" name="milestone" value={item} />)}
          <input type="hidden" name="reviewInDays" value={suggestion.review_in_days} />
          <input type="hidden" name="source" value="ai" />
          {hasCurrentPlan ? <ChangeReason /> : null}
          {activation.message ? <Status ok={activation.ok} message={activation.message} /> : null}
          <button disabled={activating} className="mt-6 min-h-12 w-full rounded-xl bg-accent px-6 font-bold text-white disabled:opacity-60 sm:w-auto">{activating ? "正在启用…" : "确认并启用这项计划"}</button>
        </form>
      ) : null}

      <details className="rounded-2xl border border-line p-5 sm:p-7">
        <summary className="cursor-pointer font-bold">自行制定阶段计划</summary>
        <p className="mt-2 text-sm leading-6 text-muted">适合你掌握了 AI 尚不知道的岗位变化或业务优先级时使用。系统仍会保留版本和调整原因。</p>
        <form action={activateAction} className="mt-6 space-y-6">
          <label className="block"><span className="font-bold">长期发展目标</span><textarea name="longTermGoal" defaultValue={goal} rows={3} required minLength={10} maxLength={2000} className="mt-3 w-full rounded-xl border border-line px-4 py-3 leading-7" /></label>
          <label className="block"><span className="font-bold">未来 6–8 周的阶段目标</span><textarea name="phaseGoal" rows={3} required minLength={10} maxLength={1000} className="mt-3 w-full rounded-xl border border-line px-4 py-3 leading-7" /></label>
          <fieldset><legend className="font-bold">当前训练重点（选择 1–2 项）</legend><div className="mt-4 grid gap-3 sm:grid-cols-2">{capabilities.map((capability) => <label key={capability.code} className="flex min-h-14 items-center gap-3 rounded-xl border border-line px-4"><input type="checkbox" name="focus" value={capability.code} defaultChecked={currentFocusCodes.includes(capability.code)} className="size-5 accent-[var(--color-accent)]" /><span className="font-semibold">{capability.titleEn} · {capability.titleZh}</span></label>)}</div></fieldset>
          <label className="block"><span className="font-bold">制定依据</span><textarea name="rationale" rows={3} required minLength={10} maxLength={3000} placeholder="说明它与岗位责任、能力缺口或近期任务的关系。" className="mt-3 w-full rounded-xl border border-line px-4 py-3 leading-7" /></label>
          <label className="block"><span className="font-bold">阶段里程碑</span><input name="milestone" required minLength={3} maxLength={300} placeholder="例如：完成基础概念学习，并在一次真实决策中记录判断依据。" className="mt-3 min-h-12 w-full rounded-xl border border-line px-4" /></label>
          <input type="hidden" name="reviewInDays" value="56" /><input type="hidden" name="source" value="user" />
          {hasCurrentPlan ? <ChangeReason /> : null}
          {activation.message ? <Status ok={activation.ok} message={activation.message} /> : null}
          <button disabled={activating} className="min-h-12 w-full rounded-xl border border-accent px-6 font-bold text-accent disabled:opacity-60 sm:w-auto">{activating ? "正在启用…" : "启用自行制定的计划"}</button>
        </form>
      </details>
    </div>
  );
}

function ChangeReason() {
  return <label className="mt-6 block"><span className="font-bold">为什么调整当前计划？</span><span className="ml-2 text-sm text-red-700">必填</span><textarea name="changeReason" rows={3} required minLength={5} maxLength={1000} placeholder="例如：当前岗位新增预算责任，需要把 Finance 纳入下一阶段训练。" className="mt-3 w-full rounded-xl border border-line bg-white px-4 py-3 leading-7" /><span className="mt-2 block text-sm text-muted">原因会和旧计划一起永久保留，避免无依据地频繁切换。</span></label>;
}

function Status({ ok, message }: { ok: boolean; message: string }) {
  return <p role="status" className={`mt-5 rounded-xl px-4 py-3 text-sm ${ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{message}</p>;
}
