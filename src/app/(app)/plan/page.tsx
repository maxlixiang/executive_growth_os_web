import { PageContainer, PageHeader } from "@/components/page-header";
import { GrowthPlanManager } from "@/features/growth/growth-profile-form";
import { GrowthPlanSummary } from "@/features/growth/growth-plan-summary";
import { getGrowthPlanWorkspace } from "@/features/growth/queries";
import { JourneySummary } from "@/features/journeys/journey-summary";
import { getJourneyWorkspace } from "@/features/journeys/queries";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const [workspace, journeyWorkspace] = await Promise.all([getGrowthPlanWorkspace(), getJourneyWorkspace()]);
  const activeCodes = workspace.currentPlan?.focus_codes ?? workspace.focuses.flatMap((focus) => focus.capabilities?.code ? [focus.capabilities.code] : []);
  const capabilityLabels = Object.fromEntries(workspace.capabilities.map((item) => [item.code, `${item.title_en} · ${item.title_zh}`]));

  return <PageContainer>
    <PageHeader backHref="/" eyebrow="Long-term Growth" title="成长计划" description="长期目标保持方向稳定；AI 根据学习与实践数据建议 6–8 周阶段计划，由你确认后生效。" />

    <div className="mt-8"><JourneySummary workspace={journeyWorkspace} /></div>

    <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Layer number="1" title="长期发展目标" description="你希望承担什么更高层级的责任，原则上保持稳定。" />
      <Layer number="2" title="能力标准" description="高级管理者需要达到的六项能力，由系统课程框架维护。" />
      <Layer number="3" title="阶段训练重点" description="未来 6–8 周聚焦 1–2 项能力，由 AI 建议、你确认。" />
      <Layer number="4" title="每日学习计划" description="Study、Quiz 与实践任务根据实时状态动态安排。" />
    </section>

    <div className="mt-8"><GrowthPlanSummary plan={workspace.currentPlan} confidence={workspace.confidence} capabilityLabels={capabilityLabels} /></div>

    <section className="mt-8 rounded-2xl bg-soft p-5 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-bold text-accent">置信度如何变化</p><h2 className="mt-1 text-xl font-bold">由系统数据规则计算，不由 AI 自由打分</h2></div><p className="text-2xl font-bold text-accent">{workspace.confidence.score}<span className="text-sm text-muted"> / 100</span></p></div>
      <div className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">{workspace.confidence.factors.map((factor) => <div key={factor.key}><div className="flex justify-between gap-3 text-sm"><span className="font-semibold">{factor.label}</span><span className="font-bold">{factor.points}/{factor.maximum}</span></div><p className="mt-1 text-xs leading-5 text-muted">{factor.detail}</p></div>)}</div>
      <p className="mt-5 border-t border-line pt-4 text-sm leading-6 text-muted"><strong className="text-foreground">下一步：</strong>{workspace.confidence.nextStep}</p>
    </section>

    <GrowthPlanManager goal={workspace.currentPlan?.long_term_goal ?? workspace.state?.overall_goal ?? ""} currentFocusCodes={activeCodes} hasCurrentPlan={Boolean(workspace.currentPlan)} capabilities={workspace.capabilities.map((item) => ({ code: item.code, titleEn: item.title_en, titleZh: item.title_zh }))} />

    <section className="mt-10">
      <h2 className="text-xl font-bold">计划版本历史</h2>
      <p className="mt-2 text-sm text-muted">新计划不会删除旧计划；调整原因、当时的置信度和执行周期都会保留。</p>
      <div className="mt-5 divide-y divide-line border-y border-line">{workspace.history.length ? workspace.history.map((plan) => <article key={plan.id} className="py-5"><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-bold">v{plan.version} · {plan.phase_goal}</p><span className="text-sm font-semibold text-muted">{plan.status === "active" ? "执行中" : plan.status === "completed" ? "已完成" : "已被新计划取代"}</span></div><p className="mt-2 text-sm text-muted">{plan.starts_at} — {plan.ended_at ?? plan.target_ends_at} · 置信度快照 {plan.confidence_score}/100</p><div className="mt-3 flex flex-wrap gap-2">{plan.focus_codes.map((code) => <span key={code} className="rounded-full bg-soft px-3 py-1 text-xs font-bold">{capabilityLabels[code] ?? code}</span>)}</div>{plan.change_reason ? <p className="mt-3 text-sm leading-6"><strong>调整原因：</strong>{plan.change_reason}</p> : null}</article>) : <p className="py-6 text-sm text-muted">启用第一项阶段计划后，版本历史会出现在这里。</p>}</div>
    </section>
  </PageContainer>;
}

function Layer({ number, title, description }: { number: string; title: string; description: string }) {
  return <div className="rounded-2xl bg-soft p-5"><span className="grid size-8 place-items-center rounded-full bg-accent text-sm font-bold text-white">{number}</span><h2 className="mt-4 font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{description}</p></div>;
}
