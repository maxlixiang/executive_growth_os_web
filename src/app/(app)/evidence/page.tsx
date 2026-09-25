import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { ContextHelpLink } from "@/components/context-help-link";
import { PageContainer, PageHeader } from "@/components/page-header";
import { getEvidenceFeed } from "@/features/practice/queries";

export const dynamic = "force-dynamic";

export default async function EvidencePage() {
  const evidences = await getEvidenceFeed();
  return <PageContainer>
    <PageHeader eyebrow="Evidence First" title="实践证据" description="E0–E5 记录的不是感觉，而是你在真实工作中承担的角色、行动、判断与结果。" />
    <section className="mt-7 rounded-2xl bg-accent-soft p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-white text-accent"><Sparkles aria-hidden="true" size={20} /></span>
        <div>
          <h2 className="font-bold">实践证据如何生成？</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">本页不需要手动填写。当你在“工作记录”中选择“保存并 AI 分析”时，AI 会从原始记录中识别角色、行动、判断、结果与限制，并保守评定 E0–E5。生成内容需要由你结合真实工作核对。</p>
          <div className="flex flex-wrap items-center gap-x-5">
            <Link href="/capture" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-white">去工作记录 <ArrowRight size={17} /></Link>
            <ContextHelpLink section="evidence">查看证据生成规则</ContextHelpLink>
          </div>
        </div>
      </div>
    </section>
    <div className="mt-8 grid gap-4 lg:grid-cols-2">{evidences.length ? evidences.map((evidence) => <article key={evidence.id} className="rounded-2xl border border-line p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><p className="font-bold">{evidence.capabilities?.title_en} · {evidence.capabilities?.title_zh}</p><span className="rounded-full bg-accent px-3 py-1 text-sm font-bold text-white">{evidence.evidence_level}</span></div><dl className="mt-5 space-y-3 text-sm leading-6"><EvidenceField label="Context" value={evidence.context} /><EvidenceField label="User Role" value={evidence.user_role} /><EvidenceField label="Action" value={evidence.action} /><EvidenceField label="Decision" value={evidence.decision} /><EvidenceField label="Outcome" value={evidence.outcome} /><EvidenceField label="Limitations" value={evidence.limitations} /><EvidenceField label="Next Evidence" value={evidence.next_evidence_needed} /></dl></article>) : <p className="rounded-2xl border border-line p-6 text-sm leading-6 text-muted">还没有实践证据。记录一次真实工作事件并选择“保存并 AI 分析”，分析结果会出现在这里。</p>}</div>
  </PageContainer>;
}

function EvidenceField({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return <div><dt className="font-bold text-muted">{label}</dt><dd>{value}</dd></div>;
}
