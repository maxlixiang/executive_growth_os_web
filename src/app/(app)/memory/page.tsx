import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth/require-user";
import { getJourneyWorkspace } from "@/features/journeys/queries";
import { buildGrowthContext } from "@/features/ai/context-builder";
import { MemoryExport, MemoryForm } from "@/features/memory/memory-form";
export const dynamic = "force-dynamic";
export default async function MemoryPage() {
  const [{ supabase, user }, workspace] = await Promise.all([requireUser(), getJourneyWorkspace()]);
  if (!workspace.journey) return <PageContainer><PageHeader title="AI学习记忆" description="先建立学习旅程，再保存私人老师的档案。" /><Link href="/settings">前往设置</Link></PageContainer>;
  const { data, error } = await supabase.from("learner_memories").select("profile_markdown").eq("user_id", user.id).eq("journey_id", workspace.journey.id).maybeSingle();
  if (error) throw new Error(error.message);
  const context = await buildGrowthContext(supabase, user.id);
  return <PageContainer>
    <PageHeader backHref="/settings" eyebrow="Personal Teacher Memory" title="AI学习记忆" description="私人老师在每次教学前读取当前旅程的档案、原始问答、复习状态、工作记录和训练计划。记忆保存在你的私有账户中，重新登录后仍可读取。" />
    <MemoryForm journeyId={workspace.journey.id} markdown={data?.profile_markdown ?? ""} />
    <section className="mt-8 rounded-2xl border border-line p-5">
      <h2 className="text-xl font-bold">老师实际可读取的记忆</h2>
      <p className="mt-2 text-sm leading-6 text-muted">以下是当前完整预览。具体课程会按能力和概念取相关记录；长历史超出模型容量时会显示摘录与省略范围；本次问答使用的精确记忆另随学习尝试保存。长期原始记录保留在学习历史；重启旅程不会自动导入旧记忆。档案内容会随AI请求发送给已配置的DeepSeek服务。</p>
      <MemoryExport markdown={context} />
      <details className="mt-5"><summary className="cursor-pointer font-bold">展开记忆内容与来源ID</summary><pre className="mt-4 max-h-[36rem] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-soft p-4 text-xs leading-6">{context}</pre></details>
      <Link href="/study/history" className="mt-4 inline-block font-bold text-accent">查看并作废不准确的学习记录 →</Link>
    </section>
  </PageContainer>;
}
