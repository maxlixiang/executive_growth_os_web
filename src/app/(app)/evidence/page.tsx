import { PageContainer, PageHeader } from "@/components/page-header";
import { getEvidenceFeed } from "@/features/practice/queries";

export const dynamic = "force-dynamic";

export default async function EvidencePage() {
  const evidences = await getEvidenceFeed();
  return <PageContainer>
    <PageHeader eyebrow="Evidence First" title="实践证据" description="E0–E5 记录的不是感觉，而是你在真实工作中承担的角色、行动、判断与结果。" />
    <div className="mt-8 grid gap-4 lg:grid-cols-2">{evidences.length ? evidences.map((evidence) => <article key={evidence.id} className="rounded-2xl border border-line p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><p className="font-bold">{evidence.capabilities?.title_en} · {evidence.capabilities?.title_zh}</p><span className="rounded-full bg-accent px-3 py-1 text-sm font-bold text-white">{evidence.evidence_level}</span></div><dl className="mt-5 space-y-3 text-sm leading-6"><EvidenceField label="Context" value={evidence.context} /><EvidenceField label="User Role" value={evidence.user_role} /><EvidenceField label="Action" value={evidence.action} /><EvidenceField label="Decision" value={evidence.decision} /><EvidenceField label="Outcome" value={evidence.outcome} /><EvidenceField label="Limitations" value={evidence.limitations} /><EvidenceField label="Next Evidence" value={evidence.next_evidence_needed} /></dl></article>) : <p className="rounded-2xl border border-line p-6 text-sm text-muted">Daily 分析产生的 Evidence 会出现在这里。</p>}</div>
  </PageContainer>;
}

function EvidenceField({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return <div><dt className="font-bold text-muted">{label}</dt><dd>{value}</dd></div>;
}
