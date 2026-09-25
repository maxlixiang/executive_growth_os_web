import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ContextHelpLink } from "@/components/context-help-link";
import { PageContainer, PageHeader } from "@/components/page-header";
import { getReviewHistory } from "@/features/reviews/queries";

export const dynamic = "force-dynamic";

export default async function InterviewsPage() {
  const { interviews } = await getReviewHistory();
  return <PageContainer>
    <PageHeader eyebrow="Evidence First" title="模拟面试历史" description="每一次提问与回答都会完整保存；未完成的访谈可以继续。" />
    <ContextHelpLink section="interviews">怎样回答才能形成有效评估？</ContextHelpLink>
    <div className="mt-8 divide-y divide-line border-y border-line">{interviews.length ? interviews.map((item) => <Link key={item.id} href={`/interviews/${item.id}`} className="flex min-h-20 items-center justify-between gap-4 py-4 hover:text-accent"><div><p className="font-bold">{item.quarterly_reviews?.period_start ?? "Quarterly Review"}</p><p className="mt-1 text-sm text-muted">{item.status} · {new Date(item.started_at).toLocaleDateString("zh-CN")}</p></div><ArrowRight size={18} /></Link>) : <div className="py-8"><p className="text-muted">尚无模拟面试。</p><Link href="/reviews" className="mt-4 inline-flex min-h-11 items-center font-bold text-accent">前往 Reviews 开始 <ArrowRight size={18} /></Link></div>}</div>
  </PageContainer>;
}
