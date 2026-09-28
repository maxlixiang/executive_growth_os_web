import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { ContextHelpLink } from "@/components/context-help-link";
import { FeatureTabs, learningTabs } from "@/components/feature-tabs";
import { PageContainer, PageHeader } from "@/components/page-header";
import { getJourneyPhase } from "@/features/journeys/presentation";
import { getJourneyWorkspace } from "@/features/journeys/queries";
import { getRecommendation } from "@/features/knowledge/queries";

export const dynamic = "force-dynamic";

export default async function StudyPage() {
  const [{ workspace, recommendation }, journeyWorkspace] = await Promise.all([getRecommendation(), getJourneyWorkspace()]);
  const journey = journeyWorkspace.journey;
  const foundationReady = journeyWorkspace.foundationTotal > 0 && journeyWorkspace.foundationCompleted === journeyWorkspace.foundationTotal;
  const formalDue = journey?.stage === "active" && Boolean(journeyWorkspace.cycle?.assessment_due_on) && journeyWorkspace.cycle!.assessment_due_on <= new Date().toISOString().slice(0, 10);
  const phase = journey ? getJourneyPhase({
    mode: journey.mode,
    stage: journey.stage,
    baselineCompletedOn: journey.baseline_completed_on,
    foundationReady,
    formalAssessmentDue: formalDue,
  }) : null;
  const foundationRecommendation = journeyWorkspace.nextFoundation ? workspace.concepts.find((item) => item.id === journeyWorkspace.nextFoundation?.id) : null;
  const studyRecommendation = phase === "foundation"
    ? foundationRecommendation ? { concept: foundationRecommendation, reasons: ["这是 24 项基础预学习中的下一项。完成全部基础概念后，系统才开放基线诊断。"] } : null
    : phase === "cycle" || phase === "formal_assessment" ? recommendation : null;
  const stageGuide = getStageGuide(phase, journeyWorkspace.foundationCompleted, journeyWorkspace.foundationTotal || 24, journeyWorkspace.cycle?.cycle_number ?? 1);

  return (
    <PageContainer>
      <PageHeader eyebrow="Learning Center" title="学习中心" description="系统会根据旅程阶段告诉你现在该学什么；学习、复习与知识地图都在这里完成。" />
      <FeatureTabs tabs={learningTabs} active="/study" />
      <ContextHelpLink section="learning">了解学习中心的完整流程</ContextHelpLink>
      <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <div><p className="text-sm font-bold text-accent">{stageGuide.eyebrow}</p><h2 className="mt-1 text-xl font-bold">{stageGuide.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{stageGuide.description}</p></div>
        {stageGuide.href ? <Link href={stageGuide.href} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-accent px-5 text-sm font-bold text-accent hover:bg-accent-soft">{stageGuide.action} <ArrowRight size={17} /></Link> : null}
      </section>
      {studyRecommendation ? (
        <section className="mt-8 rounded-2xl bg-accent-soft p-6 sm:p-8">
          <p className="text-sm font-bold text-accent-strong">{phase === "foundation" ? "Foundation Next · 基础预学习" : "Study Next · 下一项学习"}</p>
          <p className="mt-5 text-lg font-medium text-muted">{studyRecommendation.concept.capability} · {studyRecommendation.concept.titleEn}</p>
          <h2 className="mt-1 text-[32px] font-bold tracking-[-0.03em]">{studyRecommendation.concept.titleZh}</h2>
          <ul className="mt-5 space-y-2 text-sm leading-6 text-muted">
            {studyRecommendation.reasons.map((reason) => <li key={reason} className="flex gap-2"><span className="text-accent">•</span>{reason}</li>)}
          </ul>
          <Link href={`/study/${studyRecommendation.concept.capability.toLocaleLowerCase()}/${studyRecommendation.concept.code}`} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 font-bold text-white sm:w-auto">开始学习 <ArrowRight size={19} /></Link>
        </section>
      ) : phase === "cycle" || phase === "formal_assessment" ? (
        <section className="mt-8 rounded-2xl border border-line p-6"><h2 className="text-xl font-bold">当前没有合适的新知识</h2><p className="mt-2 text-muted">如果有到期内容，请前往 Quiz。</p></section>
      ) : null}

      <div className="mt-8">
        <section className="rounded-2xl border border-line p-6">
          <div className="flex items-center gap-3"><BookOpen className="text-accent" size={22} /><h2 className="text-xl font-bold">按能力浏览</h2></div>
          <div className="mt-4 divide-y divide-line">
            {workspace.capabilities.map((capability) => (
              <Link key={capability.id} href={`/study/${capability.code}`} className="flex min-h-16 items-center justify-between py-3 font-semibold hover:text-accent"><span>{capability.titleEn} · {capability.titleZh}</span><ArrowRight size={18} /></Link>
            ))}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}

function getStageGuide(phase: ReturnType<typeof getJourneyPhase> | null, completed: number, total: number, cycleNumber: number) {
  if (!phase) return { eyebrow: "尚未建立旅程", title: "先确认学习旅程", description: "选择试用或正式旅程并确认预学习开始日期后，系统才会给出阶段正确的学习内容。", href: "/", action: "返回首页" };
  if (phase === "foundation") return { eyebrow: "当前阶段 · 基础预学习", title: `基础概念 ${completed}/${total}`, description: "先完成六项能力各 4 个核心概念。此阶段用于建立共同语言，不计作正式 Cycle。", href: "/help#journey", action: "了解完整流程" };
  if (phase === "baseline") return { eyebrow: "当前阶段 · 基线诊断", title: "基础预学习已经完成", description: "现在应通过基线诊断建立初始评分；暂时不再推荐新的正式学习内容。", href: "/assessment", action: "开始基线诊断" };
  if (phase === "formal_confirmation") return { eyebrow: "当前阶段 · 正式开始确认", title: "基线诊断已经完成", description: "请确认正式学习起始日。确认后系统会创建 Cycle 1、阶段计划和双月正式评估日期。", href: "/assessment", action: "确认正式开始" };
  if (phase === "trial_complete") return { eyebrow: "当前阶段 · 试用旅程完成", title: "试用结果不会自动带入正式评分", description: "准备正式使用时，请归档试用旅程并建立新的正式旅程；旧数据仍可在历史中查看。", href: "/settings", action: "建立正式旅程" };
  if (phase === "formal_assessment") return { eyebrow: `正式学习 · Cycle ${cycleNumber}`, title: "双月正式评估已经到期", description: "你仍可继续学习，但应先完成正式评估，以最新结果更新能力评分并进入下一 Cycle。", href: "/assessment", action: "进入正式评估" };
  return { eyebrow: `正式学习 · Cycle ${cycleNumber}`, title: "按当前 Focus 学习、实践并积累证据", description: "系统根据阶段计划、Knowledge Gap、复习状态和已确认实践证据推荐下一项内容。", href: "/plan", action: "查看当前计划" };
}
