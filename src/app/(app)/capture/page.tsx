import { CheckCircle2 } from "lucide-react";
import { ContextHelpLink } from "@/components/context-help-link";
import { PageContainer, PageHeader } from "@/components/page-header";
import { CaptureForm } from "@/features/practice/capture-form";
import { getCaptureEntries } from "@/features/practice/queries";

export const dynamic = "force-dynamic";

const labels: Record<string, string> = { work_event: "工作事件", idea: "想法", question: "问题", follow_up: "待跟进" };

export default async function CapturePage() {
  const entries = await getCaptureEntries();
  return <PageContainer>
    <PageHeader eyebrow="Quick Capture" title="记录工作 / 想法" description="手机上先把原始信息安全保存，再选择是否让 AI 提取 Evidence、Knowledge Gap 与 Practice Gap。" />
    <section className="mt-7 rounded-2xl bg-soft px-5 py-5 sm:px-6">
      <h2 className="font-bold">让 AI 更准确地理解这条记录</h2>
      <p className="mt-2 text-sm leading-6 text-muted">尽量包含以下真实信息；暂时没有结果时，直接写“待验证”即可。</p>
      <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        {["背景与事件", "你的角色", "行动与判断", "参与人员", "取舍与依据", "结果或数字", "限制与风险", "尚未确定之处"].map((item) => <li key={item} className="flex items-center gap-2"><CheckCircle2 className="shrink-0 text-accent" size={16} />{item}</li>)}
      </ul>
      <ContextHelpLink section="capture">查看高质量记录指南</ContextHelpLink>
    </section>
    <CaptureForm />
    <section className="mt-10"><h2 className="text-xl font-bold">最近记录</h2><div className="mt-4 divide-y divide-line border-y border-line">
      {entries.length ? entries.map((entry) => <article key={entry.id} className="py-5"><div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted"><span>{labels[entry.entry_type]}</span><span>·</span><time>{new Date(entry.created_at).toLocaleString("zh-CN")}</time><span className="rounded-full bg-soft px-2 py-1">{entry.analysis_status}</span></div><h3 className="mt-2 font-bold">{entry.title || "无标题记录"}</h3><p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-muted">{entry.content}</p>{entry.analysis_error ? <p className="mt-2 text-sm text-red-700">{entry.analysis_error}</p> : null}</article>) : <p className="py-6 text-sm text-muted">还没有 Capture。</p>}
    </div></section>
  </PageContainer>;
}
