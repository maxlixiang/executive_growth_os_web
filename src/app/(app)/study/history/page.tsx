import Link from "next/link";
import { ArrowRight, CircleCheck, CircleX } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { getStudyHistory } from "@/features/knowledge/queries";

export const dynamic = "force-dynamic";

export default async function StudyHistoryPage() {
  const history = await getStudyHistory();
  return (
    <PageContainer>
      <PageHeader backHref="/study" eyebrow="Inspectable Memory" title="学习历史" description="每次已确认的 Study 与 Quiz 都可检查、作废和恢复。Invalid Session 不参与进度与复习安排。" />
      {history.length ? <div className="mt-8 divide-y divide-line border-y border-line">{history.map(({ session, concept }) => (
        <Link key={session.id} href={`/study/history/${session.id}`} className="group flex min-h-24 items-center gap-4 py-4">
          <span className={`grid size-10 shrink-0 place-items-center rounded-full ${session.is_valid ? "bg-accent-soft text-accent" : "bg-red-50 text-red-600"}`}>{session.is_valid ? <CircleCheck size={20} /> : <CircleX size={20} />}</span>
          <div className="min-w-0 flex-1"><p className="font-bold group-hover:text-accent">{concept?.title_zh ?? "Unknown concept"}</p><p className="mt-1 text-sm text-muted">{concept?.capability} · Concept {session.concept_score}/3 · Application {session.application_score}/3</p><p className="mt-1 text-xs text-muted">{new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(session.committed_at))}</p></div>
          <span className="text-xs font-bold text-muted">{session.is_valid ? "VALID" : "INVALID"}</span><ArrowRight size={18} className="text-muted" />
        </Link>
      ))}</div> : <p className="mt-8 rounded-2xl border border-line p-8 text-muted">还没有已确认的学习记录。</p>}
    </PageContainer>
  );
}
