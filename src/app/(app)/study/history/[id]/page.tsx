import { notFound } from "next/navigation";
import { PageContainer, PageHeader } from "@/components/page-header";
import { getStudySession } from "@/features/knowledge/queries";
import { SessionValidityControl } from "@/features/study/session-validity-control";

export const dynamic = "force-dynamic";

export default async function StudySessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getStudySession(id);
  if (!item) notFound();
  const { session, concept } = item;
  return (
    <PageContainer>
      <PageHeader backHref="/study/history" eyebrow={`${session.session_type === "quiz" ? "Quiz" : "Study"} · ${session.is_valid ? "Valid" : "Invalid"}`} title={concept?.title_zh ?? "学习记录"} description={`${concept?.capability ?? ""} · ${concept?.title_en ?? ""}`} />
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="space-y-7 rounded-2xl border border-line p-6 sm:p-8">
          <SessionField title="Recall Question" text={session.recall_question} />
          <SessionField title="你的 Recall 回答" text={session.recall_answer} />
          <SessionField title="Application Question" text={session.application_question} />
          <SessionField title="你的 Application 回答" text={session.application_answer} />
          <SessionField title="AI Feedback" text={session.ai_feedback} />
          <SessionField title="AI Rationale" text={session.ai_rationale} />
        </article>
        <aside className="space-y-4">
          <section className="grid grid-cols-2 gap-3"><Score label="Concept" value={session.concept_score} /><Score label="Application" value={session.application_score} /></section>
          <section className="rounded-2xl bg-soft p-5 text-sm leading-6"><p><strong>Status：</strong>{session.resulting_status}</p><p className="mt-2"><strong>Next Review：</strong>{session.resulting_next_review_at}</p>{session.invalidated_reason ? <p className="mt-2"><strong>作废原因：</strong>{session.invalidated_reason}</p> : null}</section>
          <SessionValidityControl sessionId={session.id} valid={session.is_valid} />
        </aside>
      </div>
    </PageContainer>
  );
}

function SessionField({ title, text }: { title: string; text: string }) {
  return <section><h2 className="text-sm font-bold text-accent">{title}</h2><p className="mt-2 whitespace-pre-wrap leading-7 text-ink">{text}</p></section>;
}

function Score({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl bg-accent-soft p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-accent-strong">{label}</p><p className="mt-2 text-3xl font-bold">{value}<span className="text-sm text-muted"> / 3</span></p></div>;
}
