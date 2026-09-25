import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, Clock3, Gauge, ShieldCheck } from "lucide-react";
import { ContextHelpLink } from "@/components/context-help-link";
import { PageContainer, PageHeader } from "@/components/page-header";
import { capabilityWeights } from "@/features/assessment/readiness";
import { JourneySummary } from "@/features/journeys/journey-summary";
import { getJourneyWorkspace } from "@/features/journeys/queries";

export const dynamic = "force-dynamic";

export default async function AssessmentPage() {
  const workspace = await getJourneyWorkspace();
  const byCapability = workspace.foundation.reduce((map, concept) => {
    const items = map.get(concept.capability_id) ?? [];
    items.push(concept);
    map.set(concept.capability_id, items);
    return map;
  }, new Map<string, typeof workspace.foundation>());
  const foundationReady = workspace.foundationTotal > 0 && workspace.foundationCompleted === workspace.foundationTotal;
  const activeLearning = workspace.journey?.stage === "active";
  const formalDue = activeLearning && Boolean(workspace.cycle?.assessment_due_on) && workspace.cycle!.assessment_due_on <= new Date().toISOString().slice(0, 10);

  return (
    <PageContainer>
      <PageHeader backHref="/" eyebrow="Assessment" title="评估中心" description="基线诊断建立初始分数；自主评估用于查漏补缺；双月正式评估更新可审计的正式评分。" />
      <ContextHelpLink section="assessment">了解三类评估、评分和 Cycle 规则</ContextHelpLink>
      <div className="mt-7"><JourneySummary workspace={workspace} /></div>

      <section className="mt-8">
        <h2 className="text-xl font-bold">三类评估，各自承担不同职责</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <AssessmentTypeCard number="1" title="基线诊断" subtitle="预学习后的初始正式评分" available={foundationReady && workspace.journey?.stage !== "active"} status={foundationReady ? "基础概念已完成，可以准备基线诊断。" : `完成 ${workspace.foundationTotal || 24} 项基础概念后解锁，目前 ${workspace.foundationCompleted}/${workspace.foundationTotal || 24}。`} detail="每个学习旅程进行一次。完成后进入正式学习 Cycle 1。" />
          <AssessmentTypeCard number="2" title="自主评估" subtitle="随时查漏补缺" available={activeLearning} status={activeLearning ? "正式学习中可随时发起，不会结束当前 Cycle。" : "完成基线诊断并进入正式学习后开放。"} detail="更新 AI 对当前能力的估计和教学建议，不覆盖最近正式评分。" />
          <AssessmentTypeCard number="3" title="双月正式评估" subtitle="Cycle 结束时更新正式评分" available={Boolean(formalDue)} status={!activeLearning ? "进入正式学习后开始计算双月周期。" : formalDue ? "本周期评估已到期。" : `下一次评估：${workspace.cycle?.assessment_due_on ?? "待安排"}`} detail="综合知识、案例与实践证据，结束当前 Cycle 并生成下一 Cycle 建议。" />
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-accent-soft p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-sm font-bold text-accent">两种分数</p><h2 className="mt-1 text-xl font-bold">动态估计与正式评分分开保存</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">自主评估可以改变“当前能力估计”；只有基线诊断和双月正式评估会更新“最近正式评分”。每一次结果都进入历史，不会静默覆盖。</p></div><div className="grid min-w-52 gap-2"><ScoreLine label="当前能力估计" value={workspace.currentEstimate?.readiness_score} /><ScoreLine label="最近正式评分" value={workspace.latestAssessment?.readiness_score} /></div></div>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-bold">基线诊断准备 · 24 项基础概念</h2>
        <p className="mt-2 text-sm leading-6 text-muted">每项能力先学习 4 个基础概念。完成后由你主动发起基线诊断，基线结果不会与正式周期混在一起。</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {workspace.capabilities.map((capability) => (
            <article key={capability.id} className="rounded-2xl bg-soft p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold">{capability.title_en} · {capability.title_zh}</h3>
                <span className="shrink-0 text-xs font-bold text-muted">权重 {capabilityWeights[capability.code as keyof typeof capabilityWeights] ?? 0}%</span>
              </div>
              <ul className="mt-4 space-y-2">
                {(byCapability.get(capability.id) ?? []).map((concept) => (
                  <li key={concept.id} className="flex items-center gap-2 text-sm">
                    <Circle size={14} className="text-muted" />
                    <Link className="hover:text-accent" href={`/study/${capability.code}/${concept.concept_code}`}>{concept.title_en} · {concept.title_zh}</Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-8 rounded-2xl border border-line p-5 sm:p-7">
        <div className="flex items-start gap-3"><ShieldCheck className="mt-1 shrink-0 text-accent" /><div><h2 className="text-xl font-bold">100 分代表什么</h2><p className="mt-2 leading-7 text-muted">每项能力由知识 30 分、案例分析 30 分、实践证据 40 分组成，再按六项能力权重汇总。70 分是“具备岗位准备度”的参考门槛，不要求追求满分。</p></div></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{["总分 ≥ 70", "每项能力 ≥ 55", "每项知识 ≥ 18/30", "每项实践 ≥ 16/40"].map((item) => <div key={item} className="flex items-center gap-2 rounded-xl bg-soft px-4 py-3 text-sm font-bold"><CheckCircle2 size={17} className="text-accent" />{item}</div>)}</div>
        <p className="mt-5 text-sm leading-6 text-muted">分数以最近一次正式评估为准，可能因遗忘或实践证据失效而下降。AI 必须给出评分依据、证据引用与置信度，不能只给结论。</p>
      </section>
    </PageContainer>
  );
}

function AssessmentTypeCard({ number, title, subtitle, available, status, detail }: { number: string; title: string; subtitle: string; available: boolean; status: string; detail: string }) {
  return <article className={`rounded-2xl border p-5 sm:p-6 ${available ? "border-accent bg-white" : "border-line bg-soft/60"}`}><div className="flex items-start justify-between gap-3"><span className={`grid size-9 place-items-center rounded-full text-sm font-bold ${available ? "bg-accent text-white" : "bg-white text-muted"}`}>{number}</span>{available ? <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent-strong">当前可用</span> : <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-muted">尚未解锁</span>}</div><p className="mt-5 text-sm font-semibold text-muted">{subtitle}</p><h3 className="mt-1 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6">{status}</p><p className="mt-3 text-sm leading-6 text-muted">{detail}</p><Link href="/help#assessment" className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-accent">查看规则 <ArrowRight size={16} /></Link></article>;
}

function ScoreLine({ label, value }: { label: string; value: number | null | undefined }) {
  return <div className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3"><span className="flex items-center gap-2 text-sm font-semibold text-muted">{label === "当前能力估计" ? <Gauge size={17} /> : <Clock3 size={17} />}{label}</span><strong>{value == null ? "尚未评估" : `${value}/100`}</strong></div>;
}
