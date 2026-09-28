import Link from "next/link";
import { ArrowRight, Check, ChevronRight, Plus } from "lucide-react";
import { ContextHelpLink } from "@/components/context-help-link";
import { GrowthPlanSummary } from "@/features/growth/growth-plan-summary";
import { getGrowthPlanWorkspace } from "@/features/growth/queries";
import { getQuizQueue, getRecommendation } from "@/features/knowledge/queries";
import { requireUser } from "@/lib/auth/require-user";
import { JourneySummary } from "@/features/journeys/journey-summary";
import { getJourneyWorkspace } from "@/features/journeys/queries";
import { InitialJourneyForm } from "@/features/journeys/journey-forms";
import { getJourneyPhase, journeyPhaseStep } from "@/features/journeys/presentation";

function formatDate(value: string | Date, timezone: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("zh-CN", { timeZone: timezone, ...options }).format(new Date(value));
}

export async function Dashboard() {
  const journeyWorkspace = await getJourneyWorkspace();
  if (!journeyWorkspace.journey) {
    const displayName = journeyWorkspace.profile?.display_name || journeyWorkspace.user.email.split("@")[0] || "Executive";
    return <main className="mx-auto w-full max-w-[1220px] px-5 py-6 sm:px-8 lg:px-12 lg:py-10"><header><p className="text-sm font-semibold text-ink lg:hidden">Executive Growth OS</p><h1 className="mt-9 text-[36px] font-bold leading-none tracking-[-0.045em] sm:text-[42px] lg:mt-0 lg:text-[46px]">你好，{displayName}</h1><p className="mt-3 text-[17px] text-muted">先建立学习旅程，系统才能隔离并理解你的学习数据。</p></header><div className="mt-8"><InitialJourneyForm /></div></main>;
  }
  const [{ workspace, recommendation }, { due }, { supabase, user }, growthPlan] = await Promise.all([
    getRecommendation(),
    getQuizQueue(),
    requireUser(),
    getGrowthPlanWorkspace(),
  ]);
  const { data: profile } = await supabase.from("profiles").select("display_name, timezone").eq("id", user.id).maybeSingle();
  const timezone = profile?.timezone ?? "Asia/Shanghai";
  const displayName = profile?.display_name || user.email?.split("@")[0] || "Executive";
  const today = formatDate(new Date(), timezone, { month: "long", day: "numeric", weekday: "long" });
  const recentGap = workspace.recentGapText.split("\n").find(Boolean);
  const focusItems = workspace.focusCapabilities;
  const capabilityLabels = Object.fromEntries(growthPlan.capabilities.map((item) => [item.code, `${item.title_en} · ${item.title_zh}`]));
  const journeyStage = journeyWorkspace.journey?.stage ?? "preparation";
  const foundationReady = journeyWorkspace.foundationTotal > 0 && journeyWorkspace.foundationCompleted === journeyWorkspace.foundationTotal;
  const formalDue = journeyStage === "active" && Boolean(journeyWorkspace.cycle?.assessment_due_on) && journeyWorkspace.cycle!.assessment_due_on <= new Date().toISOString().slice(0, 10);
  const journeyPhase = getJourneyPhase({
    mode: journeyWorkspace.journey.mode,
    stage: journeyStage,
    baselineCompletedOn: journeyWorkspace.journey.baseline_completed_on,
    foundationReady,
    formalAssessmentDue: formalDue,
  });
  const currentStep = journeyPhaseStep(journeyPhase);
  const journeySteps = [
    "基础预学习",
    "基线诊断",
    journeyPhase === "trial_complete" ? "建立正式旅程" : "确认正式开始",
    `正式学习 Cycle ${journeyWorkspace.cycle?.cycle_number ?? 1}`,
    "双月正式评估",
    "进入下一 Cycle",
  ];
  const foundationRecommendation = journeyWorkspace.nextFoundation ? workspace.concepts.find((item) => item.id === journeyWorkspace.nextFoundation?.id) : null;
  const todayRecommendation = journeyPhase === "cycle" || journeyPhase === "formal_assessment"
    ? recommendation
    : journeyPhase === "foundation" && foundationRecommendation
      ? { concept: foundationRecommendation, reasons: ["基础预学习按六项能力各 4 个核心概念推进；完成 24 项后再进行基线诊断。"] }
      : null;
  const nextAction = journeyPhase === "foundation"
    ? `继续基础预学习，目前 ${journeyWorkspace.foundationCompleted}/${journeyWorkspace.foundationTotal || 24}。`
    : journeyPhase === "baseline"
      ? "24 项基础概念已完成；请主动发起基线诊断，建立第一个正式评分。"
      : journeyPhase === "formal_confirmation"
        ? "基线诊断已完成；请确认正式学习起始日，随后进入 Cycle 1。"
        : journeyPhase === "trial_complete"
          ? "试用基线诊断已完成；准备正式使用时，请归档试用数据并建立正式旅程。"
          : journeyPhase === "formal_assessment"
            ? "本 Cycle 的双月正式评估已到期；完成后系统会更新正式评分并进入下一 Cycle。"
            : `继续 Cycle ${journeyWorkspace.cycle?.cycle_number ?? 1} 的学习与实践；下一次正式评估 ${journeyWorkspace.cycle?.assessment_due_on ?? "待安排"}。`;
  const stageAction = journeyPhase === "trial_complete"
    ? { href: "/settings", label: "建立正式旅程", title: "试用基线已完成", description: "试用旅程不会自动转为正式学习。确认准备好后，归档试用旅程并从新的正式旅程开始。" }
    : journeyPhase === "baseline" || journeyPhase === "formal_confirmation"
      ? { href: "/assessment", label: journeyPhase === "baseline" ? "开始基线诊断" : "确认正式开始", title: journeyPhase === "baseline" ? "准备进行基线诊断" : "基线诊断已经完成", description: journeyPhase === "baseline" ? "完成诊断后，AI 才会生成可审计的初始评分。" : "确认正式学习起始日后，系统会建立 Cycle 1 和双月评估日期。" }
      : null;

  return (
    <main className="mx-auto w-full max-w-[1220px] px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink lg:hidden">Executive Growth OS</p>
          <h1 className="mt-9 break-words text-[36px] font-bold leading-none tracking-[-0.045em] [overflow-wrap:anywhere] sm:text-[42px] lg:mt-0 lg:text-[46px]">
            你好，{displayName}
          </h1>
          <p className="mt-3 text-[17px] text-muted">{today}</p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-soft text-base font-semibold lg:hidden">{displayName.slice(0, 1).toLocaleUpperCase()}</span>
      </header>

      <div className="mt-8"><JourneySummary workspace={journeyWorkspace} compact /></div>
      <div className="mt-5"><GrowthPlanSummary plan={growthPlan.currentPlan} confidence={growthPlan.confidence} capabilityLabels={capabilityLabels} compact /></div>

      <section className="mt-5 rounded-2xl border border-line bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-bold">你的学习旅程</h2><p className="mt-2 text-sm leading-6 text-muted">基础预学习不是正式 Cycle。完成基线诊断并确认正式开始后，系统才会按 Cycle 组织学习、实践与双月评估。</p></div><ContextHelpLink section="journey">了解完整学习流程</ContextHelpLink></div>
        <ol className="mt-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {journeySteps.map((step, index) => <li key={step} className={`rounded-xl px-4 py-4 ${index === currentStep ? "bg-accent text-white" : index < currentStep ? "bg-accent-soft text-accent-strong" : "bg-soft text-muted"}`}><span className={`grid size-7 place-items-center rounded-full text-xs font-bold ${index === currentStep ? "bg-white text-accent" : "bg-white"}`}>{index < currentStep ? <Check size={15} /> : index + 1}</span><p className="mt-3 text-sm font-bold leading-5">{step}</p></li>)}
        </ol>
        <p className="mt-5 text-sm leading-6 text-muted"><strong className="text-ink">当前下一步：</strong>{nextAction}</p>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl bg-accent-soft p-6 sm:p-8 lg:min-h-72">
          <p className="text-sm font-bold text-accent-strong">今日建议学习</p>
          <div className="mt-6 flex flex-col justify-between gap-6 lg:h-[188px]">
            {stageAction ? <div>
              <h2 className="text-[28px] font-bold leading-tight tracking-[-0.03em]">{stageAction.title}</h2>
              <p className="mt-3 max-w-xl text-[15px] leading-6 text-muted sm:text-base">{stageAction.description}</p>
              <Link href={stageAction.href} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-bold text-white transition-colors hover:bg-accent-strong sm:w-fit">{stageAction.label} <ArrowRight aria-hidden="true" size={19} /></Link>
            </div> : todayRecommendation ? <>
              <div>
                <p className="text-[22px] font-medium text-muted sm:text-[25px]">{todayRecommendation.concept.titleEn}</p>
                <h2 className="mt-1 text-[34px] font-bold leading-tight tracking-[-0.035em] sm:text-[38px]">{todayRecommendation.concept.titleZh}</h2>
                <p className="mt-3 max-w-xl text-[15px] leading-6 text-muted sm:text-base">{todayRecommendation.reasons[0]}</p>
              </div>
              <Link
                href={`/study/${todayRecommendation.concept.capability.toLocaleLowerCase()}/${todayRecommendation.concept.code}`}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-bold text-white transition-colors hover:bg-accent-strong sm:w-fit"
              >
                开始学习 <ArrowRight aria-hidden="true" size={19} />
              </Link>
            </> : <div><h2 className="text-2xl font-bold">当前没有新的推荐项</h2><p className="mt-3 text-muted">可以完成到期复习，或从知识地图自由浏览。</p></div>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="flex min-h-32 items-center justify-between rounded-2xl border border-line bg-white p-6 lg:min-h-36">
            <div>
              <h2 className="text-lg font-bold">今日待复习</h2>
              <p className="mt-2 text-2xl font-bold">{due.length} 项</p>
            </div>
            <Link href="/quiz" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-accent px-5 text-sm font-bold text-accent hover:bg-accent-soft">
              开始 Quiz
            </Link>
          </div>
          <Link href="/capture" aria-label="＋ 记录工作 / 想法" className="flex min-h-[76px] items-center justify-center gap-3 rounded-xl bg-accent px-6 text-base font-bold text-white transition-colors hover:bg-accent-strong lg:min-h-28">
            <Plus aria-hidden="true" size={23} />记录工作 / 想法
          </Link>
        </div>
      </section>

      <div className="dashboard-details mt-9 lg:gap-x-8">
        <section className="dashboard-gap border-b border-line pb-8 lg:pr-0">
          <SectionTitle title="最近 Knowledge Gap" href="/knowledge" />
          {recentGap ? <p className="mt-5 max-w-2xl text-[15px] leading-6 text-muted">{recentGap}</p> : <p className="mt-5 text-[15px] text-muted">最近 30 天还没有 Knowledge Gap。</p>}
        </section>

        <section className="dashboard-focus border-b border-line py-8 lg:border-l lg:pl-8 lg:pt-0">
          <SectionTitle title="Current Focus" href="/progress" />
          <ul className="mt-4 flex flex-wrap gap-2 lg:flex-col lg:gap-0">
            {focusItems.length > 0 ? focusItems.map((item) => (
              <li key={item} className="rounded-full bg-soft px-4 py-2 text-sm font-medium lg:rounded-none lg:bg-transparent lg:px-0 lg:py-3 lg:text-base">{item}</li>
            )) : <li className="py-3 text-sm text-muted">尚未设置 Focus</li>}
          </ul>
        </section>

      </div>
    </main>
  );
}

function SectionTitle({ title, href }: { title: string; href?: string }) {
  const content = (
    <><h2 className="text-[20px] font-bold tracking-[-0.02em]">{title}</h2>{href ? <ChevronRight aria-hidden="true" size={20} className="text-muted" /> : null}</>
  );
  return href ? <Link href={href} className="flex min-h-11 items-center justify-between hover:text-accent">{content}</Link> : <div className="flex min-h-11 items-center justify-between">{content}</div>;
}
