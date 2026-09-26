import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ContextHelpLink } from "@/components/context-help-link";
import { assessmentTabs, FeatureTabs } from "@/components/feature-tabs";
import { PageContainer, PageHeader } from "@/components/page-header";
import { ReviewWorkflowButtons } from "@/features/reviews/workflow-buttons";
import { getReviewHistory } from "@/features/reviews/queries";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const history = await getReviewHistory();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return <PageContainer>
    <PageHeader eyebrow="Self-directed Review" title="评估与复盘" description="你决定何时复盘以及覆盖多长时间；复盘生成事实总结与建议，但不更新正式评分。" />
    <FeatureTabs tabs={assessmentTabs} active="/reviews" />
    <ContextHelpLink section="reviews">复盘使用哪些数据？</ContextHelpLink>
    <ReviewWorkflowButtons today={today} />
    <section className="mt-10"><h2 className="text-xl font-bold">历次复盘</h2><div className="mt-4 divide-y divide-line border-y border-line">{history.monthly.length ? history.monthly.map((item) => <Link key={item.id} href={`/reviews/${item.id}`} className="flex min-h-16 items-center justify-between gap-4 py-3 font-semibold hover:text-accent"><span><strong>第{item.review_number}次复盘</strong><span className="ml-3 text-sm font-normal text-muted">{item.title} · {item.period_start}—{item.period_end}</span></span><ArrowRight size={18} /></Link>) : <p className="py-5 text-muted">尚未生成复盘。你可以从任意合适的时间范围开始。</p>}</div></section>
  </PageContainer>;
}
