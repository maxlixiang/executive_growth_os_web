import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { getJourneyWorkspace } from "./queries";

type Workspace = Awaited<ReturnType<typeof getJourneyWorkspace>>;

export function JourneySummary({ workspace, compact = false }: { workspace: Workspace; compact?: boolean }) {
  const { journey, cycle, latestAssessment, currentEstimate, foundationCompleted, foundationTotal } = workspace;
  if (!journey) return <section className="rounded-2xl bg-accent-soft p-5 sm:p-7"><p className="font-bold text-accent">学习旅程尚未建立</p><p className="mt-2 text-sm text-muted">请先选择试用或正式旅程，并确认基础预学习开始日期。</p></section>;
  const preparation = journey.stage !== "active";
  const baselineComplete = Boolean(journey.baseline_completed_on);
  const phaseTitle = !preparation
    ? `正式学习 · Cycle ${cycle?.cycle_number ?? 1}`
    : baselineComplete
      ? journey.mode === "trial" ? "试用基线已完成" : "基线已完成 · 待确认正式开始"
      : "基础预学习";
  const phaseDescription = !preparation
    ? `正式起始日 ${journey.formal_started_on}；下一次双月评估 ${cycle?.assessment_due_on ?? "待安排"}。`
    : baselineComplete
      ? journey.mode === "trial"
        ? "试用旅程不会自动进入正式学习；准备好后请建立新的正式旅程。"
        : "初始评分已经建立；确认正式学习起始日后，系统才会创建 Cycle 1。"
      : `从 ${journey.preparation_started_on} 开始；完成 24 项基础概念后进行基线诊断。`;
  const actionHref = baselineComplete && journey.mode === "trial" ? "/settings" : "/assessment";
  const actionLabel = baselineComplete && journey.mode === "trial" ? "建立正式旅程" : baselineComplete ? "确认正式开始" : "查看评估规则与准备进度";
  return <section className="rounded-2xl border border-line bg-white p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-bold text-accent">{journey.mode === "trial" ? "TRIAL JOURNEY · 试用旅程" : `LEARNING JOURNEY ${journey.sequence_number}`}</p><h2 className="mt-2 text-2xl font-bold">{phaseTitle}</h2><p className="mt-2 text-sm leading-6 text-muted">{phaseDescription}</p></div><div className="grid min-w-44 gap-2 text-right"><div className="rounded-xl bg-soft px-4 py-3"><p className="text-xs font-semibold text-muted">最近正式评分</p><p className="mt-1 text-xl font-bold">{latestAssessment?.readiness_score == null ? "尚未评估" : `${latestAssessment.readiness_score} / 100`}</p></div>{currentEstimate?.assessment_type === "self_check" ? <div className="px-4 text-xs text-muted">当前能力估计：<strong className="text-ink">{currentEstimate.readiness_score ?? "待生成"}</strong></div> : null}</div></div>{preparation && !baselineComplete ? <div className="mt-5"><div className="flex justify-between text-sm font-semibold"><span>基础课程进度</span><span>{foundationCompleted} / {foundationTotal || 24}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-soft"><div className="h-full rounded-full bg-accent" style={{ width: `${foundationTotal ? foundationCompleted / foundationTotal * 100 : 0}%` }} /></div></div> : null}{compact ? <Link href={actionHref} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-accent">{actionLabel} <ArrowRight size={17} /></Link> : <div className="mt-5 flex flex-wrap gap-3"><Link href="/history" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-5 text-sm font-bold">查看旅程历史</Link></div>}</section>;
}
