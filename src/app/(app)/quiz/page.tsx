import { PageContainer, PageHeader } from "@/components/page-header";
import { getQuizQueue } from "@/features/knowledge/queries";
import { StudyRunner } from "@/features/study/study-runner";

export const dynamic = "force-dynamic";

export default async function QuizPage() {
  const { due } = await getQuizQueue();
  const next = due[0];

  return (
    <PageContainer>
      <PageHeader eyebrow="Spaced Repetition" title="今日复习" description="Quiz 回答的是：以前学过的东西，现在还会不会？它不会混入 Study Next 的新知识推荐。" />
      {next ? (
        <div className="mt-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold text-muted">{next.concept.capability} · {next.concept.titleEn}</p><h2 className="mt-1 text-2xl font-bold">{next.concept.titleZh}</h2></div><p className="text-sm font-semibold text-orange-700">到期：{next.progress.nextReviewAt} · 队列剩余 {due.length} 项</p></div>
          <StudyRunner conceptId={next.concept.id} sessionType="quiz" />
        </div>
      ) : (
        <section className="mt-8 rounded-2xl border border-line bg-white p-8"><h2 className="text-2xl font-bold">今天没有到期复习</h2><p className="mt-3 leading-7 text-muted">已学习内容会在 next_review_at 到期后出现在这里。现在可以前往 Study Next 学习下一项知识。</p></section>
      )}
    </PageContainer>
  );
}
