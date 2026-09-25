import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { JourneyControls, NicknameForm } from "@/features/journeys/journey-forms";
import { getJourneyWorkspace } from "@/features/journeys/queries";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const workspace = await getJourneyWorkspace();

  return <PageContainer>
    <PageHeader backHref="/" eyebrow="Account & Data" title="设置" description="管理界面称呼、学习旅程日期和数据边界。成长目标与阶段训练计划已移至独立的成长计划页面。" />

    <div className="mt-8"><NicknameForm nickname={workspace.profile?.display_name || workspace.user.email.split("@")[0] || ""} email={workspace.user.email} /></div>

    <section className="mt-6 rounded-2xl bg-accent-soft p-5 sm:p-7">
      <h2 className="text-xl font-bold">成长计划</h2>
      <p className="mt-2 text-sm leading-6 text-muted">长期目标、阶段重点、AI 建议和计划版本历史现在集中在一个独立页面中。</p>
      <Link href="/plan" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-bold text-white">前往成长计划 <ArrowRight size={17} /></Link>
    </section>

    {workspace.journey ? <section className="mt-9"><div className="mb-5"><h2 className="text-2xl font-bold">学习旅程与数据</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">更正预学习日期或重启旅程会影响评估时间线与 AI 使用的数据范围，因此保留在设置中。</p></div><JourneyControls mode={workspace.journey.mode} startDate={workspace.journey.preparation_started_on} baselineCompleted={Boolean(workspace.journey.baseline_completed_on)} /></section> : null}
  </PageContainer>;
}
