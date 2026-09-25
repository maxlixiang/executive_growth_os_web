import Link from "next/link";
import { CheckCircle2, Circle, ShieldCheck } from "lucide-react";
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

  return (
    <PageContainer>
      <PageHeader backHref="/" eyebrow="Assessment" title="评估中心" description="先完成两周基础预学习，再进行基线诊断；正式学习开始后，每两个月进行一次可审计评估。" />
      <div className="mt-8"><JourneySummary workspace={workspace} /></div>
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
