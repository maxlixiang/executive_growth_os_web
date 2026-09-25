import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ContextHelpLink } from "@/components/context-help-link";
import { PageContainer, PageHeader } from "@/components/page-header";
import { GrowthPlanSummary } from "@/features/growth/growth-plan-summary";
import { getGrowthPlanWorkspace } from "@/features/growth/queries";
import { getKnowledgeWorkspace, getQuizQueue } from "@/features/knowledge/queries";
import { StatusBadge } from "@/features/knowledge/status";
import { requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const { supabase, user } = await requireUser();
  const [workspace, queue, growthPlan, focusesResult, evidenceResult, gapsResult] = await Promise.all([
    getKnowledgeWorkspace(),
    getQuizQueue(),
    getGrowthPlanWorkspace(),
    supabase.from("user_focuses").select("priority, capabilities(code, title_en, title_zh)").eq("user_id", user.id).eq("is_active", true).order("priority"),
    supabase.from("practice_evidence").select("capability_id, evidence_level").eq("user_id", user.id).eq("review_status", "confirmed"),
    supabase.from("growth_gaps").select("capability_id").eq("user_id", user.id).eq("status", "open"),
  ]);
  const failed = [focusesResult, evidenceResult, gapsResult].find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);
  const statuses = Object.values(workspace.progress).filter(Boolean);
  const mastered = statuses.filter((item) => item && ["applied", "verified"].includes(item.status)).length;
  const reviews = statuses.reduce((total, item) => total + (item?.reviewCount ?? 0), 0);
  const focusCodes = new Set(growthPlan.currentPlan?.focus_codes ?? (focusesResult.data ?? []).flatMap((item) => item.capabilities?.code ? [item.capabilities.code] : []));
  const capabilityLabels = Object.fromEntries(growthPlan.capabilities.map((item) => [item.code, `${item.title_en} · ${item.title_zh}`]));
  const evidenceRank = { E0: 0, E1: 1, E2: 2, E3: 3 } as const;
  const capabilityStats = workspace.capabilities.map((capability) => {
    const concepts = workspace.concepts.filter((concept) => concept.capabilityId === capability.id);
    const learned = concepts.filter((concept) => workspace.progress[concept.code]).length;
    const applied = concepts.filter((concept) => ["applied", "verified"].includes(workspace.progress[concept.code]?.status ?? "")).length;
    const evidence = (evidenceResult.data ?? []).filter((item) => item.capability_id === capability.id);
    const level = evidence.reduce<keyof typeof evidenceRank>((best, item) =>
      evidenceRank[item.evidence_level as keyof typeof evidenceRank] > evidenceRank[best]
        ? item.evidence_level as keyof typeof evidenceRank
        : best, "E0");
    return {
      ...capability,
      learned,
      applied,
      total: concepts.length,
      evidenceCount: evidence.length,
      evidenceLevel: level,
      openGaps: (gapsResult.data ?? []).filter((item) => item.capability_id === capability.id).length,
      isFocus: focusCodes.has(capability.code),
    };
  });

  return (
    <PageContainer>
      <PageHeader eyebrow="Knowledge Progress" title="学习进度" description="进度来自有效 Study Session。作废错误记录后，这里会按剩余有效历史重新计算。" />
      <ContextHelpLink section="progress">进度和能力评分有什么区别？</ContextHelpLink>
      <div className="mt-8"><GrowthPlanSummary plan={growthPlan.currentPlan} confidence={growthPlan.confidence} capabilityLabels={capabilityLabels} /></div>
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="课程标准" value={workspace.concepts.length} suffix="项" />
        <Metric label="已有记录" value={statuses.length} suffix="项" />
        <Metric label="Applied / Verified" value={mastered} suffix="项" />
        <Metric label="累计学习" value={reviews} suffix="次" />
      </div>
      <section className="mt-8">
        <div><p className="text-sm font-bold text-accent">Capability Dashboard</p><h2 className="mt-1 text-xl font-bold">六项能力进展</h2></div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {capabilityStats.map((item) => (
            <article key={item.id} className={`rounded-2xl border p-5 ${item.isFocus ? "border-accent bg-accent/5" : "border-line"}`}>
              <div className="flex items-start justify-between gap-3"><div><p className="font-bold">{item.titleZh}</p><p className="mt-1 text-sm text-muted">{item.titleEn}</p></div>{item.isFocus ? <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-white">Focus</span> : null}</div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                <MiniMetric label="已学习" value={`${item.learned}/${item.total}`} />
                <MiniMetric label="已应用" value={item.applied} />
                <MiniMetric label="证据" value={`${item.evidenceLevel} · ${item.evidenceCount}`} />
              </div>
              <p className="mt-4 text-sm text-muted">开放 Gap：<span className="font-bold text-foreground">{item.openGaps}</span></p>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-8 rounded-2xl border border-line p-6">
        <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-accent">Quiz Queue</p><h2 className="mt-1 text-xl font-bold">到期复习</h2></div><Link href="/quiz" className="inline-flex min-h-11 items-center gap-2 font-bold text-accent">开始 Quiz <ArrowRight size={18} /></Link></div>
        {queue.due.length ? <div className="mt-5 divide-y divide-line">{queue.due.slice(0, 5).map(({ concept, progress }) => <div key={concept.code} className="flex min-h-16 items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="font-bold">{concept.titleZh}</p><p className="mt-1 text-sm text-muted">{concept.capability} · 到期 {progress.nextReviewAt}</p></div><StatusBadge status={progress.status} /></div>)}</div> : <p className="mt-5 text-muted">目前没有到期项目。</p>}
      </section>
    </PageContainer>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl bg-soft px-2 py-3"><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-1 font-bold">{value}</p></div>;
}

function Metric({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return <div className="rounded-2xl bg-soft p-5"><p className="text-sm font-semibold text-muted">{label}</p><p className="mt-3 text-3xl font-bold tracking-[-0.04em]">{value}<span className="ml-1 text-sm font-semibold text-muted">{suffix}</span></p></div>;
}
