import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleHelp } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";

const helpSections = [
  {
    id: "dashboard", title: "首页", english: "Dashboard", href: "/",
    purpose: "汇总今天最值得采取的行动：下一项学习、到期复习、最近 Gap、Focus、活动和 Review。",
    input: "无需在本页填写。内容来自你的 Growth Profile、学习记录、复盘和实践证据。",
    output: "一个根据当前状态生成的行动入口，而不是独立的数据源。",
    tips: ["优先处理 Study Next 或到期 Quiz。", "首页数字异常时，可到 Progress 和学习历史检查来源。"],
  },
  {
    id: "capture", title: "快速记录", english: "Capture", href: "/capture",
    purpose: "保存会议、工作事件、想法、问题和待跟进事项，并可让 AI 立即分析。",
    input: "尽量写清背景、你的角色、行动、判断或取舍、相关人员、结果或数字，以及仍不确定的地方。",
    output: "“仅保存”只保留原文；“保存并 AI 分析”还会生成 Daily 分析、能力标签、Gap 和实践证据。",
    tips: ["不要为了显得完整而补写没有发生的结果。", "会议记录可以直接粘贴，但应指出你本人做了什么。"],
  },
  {
    id: "daily", title: "每日复盘", english: "Daily", href: "/daily",
    purpose: "用自然语言复盘当天真实工作，把经历转化为可追踪的能力信号。",
    input: "写下事件、责任、关键判断、取舍、结果、困难和仍未理解的内容；不需要整理成表格。",
    output: "AI 分析、责任层级提示、能力标签、Knowledge Gap、Practice Gap、练习建议和实践证据。",
    tips: ["一次复盘聚焦一到三个重要事件即可。", "结果尚未发生时明确写“待验证”，比猜测结果更有价值。"],
  },
  {
    id: "study", title: "学习", english: "Study", href: "/study",
    purpose: "学习下一项新知识，并通过 Active Recall 和 Application Question 检验理解与应用。",
    input: "先用自己的话回答，不要复制定义；应用题应结合真实或明确标注的假设情境。",
    output: "概念分、应用分、学习状态和下一次复习时间。确认提交后才进入有效学习历史。",
    tips: ["不会时先暴露盲区，再阅读反馈。", "把假设案例写成假设，避免与真实实践证据混淆。"],
  },
  {
    id: "quiz", title: "复习", english: "Quiz", href: "/quiz",
    purpose: "在知识到期时检查是否仍能回忆并应用，使用间隔重复巩固记忆。",
    input: "像 Study 一样独立作答，但重点是从记忆中提取，而不是重新学习新内容。",
    output: "更新复习次数、连续成功次数、掌握状态和下一次到期时间。",
    tips: ["没有到期项目是正常状态。", "评分异常可在学习历史中作废该次 Session。"],
  },
  {
    id: "knowledge", title: "知识地图", english: "Knowledge", href: "/knowledge",
    purpose: "浏览六大能力、分类与 138 个标准知识点，理解课程结构和个人掌握状态。",
    input: "无需填写。可以选择任一能力或概念进入学习。",
    output: "展示每个知识点的未学习、学习中、已应用或已验证状态。",
    tips: ["分类是知识结构，具体中英文名称才是学习概念。", "优先遵循 Study Next，必要时再按能力自由浏览。"],
  },
  {
    id: "progress", title: "进度", english: "Progress", href: "/progress",
    purpose: "汇总六项能力的学习、应用、证据、开放 Gap 和 Focus 状态。",
    input: "无需直接填写。数据来自有效 Study/Quiz、实践证据、Gap 和 Growth Profile。",
    output: "能力维度的进展仪表板和到期复习队列。",
    tips: ["课程完成度不等于能力证据。", "Progress 中的证据等级来自真实工作记录的 AI 分析。"],
  },
  {
    id: "evidence", title: "实践证据", english: "Evidence", href: "/evidence",
    purpose: "汇总 AI 从真实工作记录中提取的角色、行动、判断、结果与限制。",
    input: "本页不直接填写。来源是选择“保存并 AI 分析”的快速记录，以及每日复盘。",
    output: "Context、User Role、Action、Decision、Outcome、Limitations、Next Evidence 和 E0–E5 等级。",
    tips: ["AI 生成内容需要由你结合真实工作核对。", "缺少可验证结果时，不应把 E1–E3 当成已取得业务成果。"],
  },
  {
    id: "reviews", title: "复盘", english: "Reviews", href: "/reviews",
    purpose: "按自然月和季度汇总学习、实践、Gap、Focus 与能力变化。",
    input: "Monthly Review 使用周期内已有数据；Quarterly Review 还需要完成三轮模拟高管面试。",
    output: "月度事实摘要、季度评估、优势、Gap、证据缺口和下一阶段训练方向。",
    tips: ["复盘结论受输入质量限制。", "合成测试内容必须明确标注，不能计入真实履历。"],
  },
  {
    id: "interviews", title: "模拟面试", english: "Interviews", href: "/interviews",
    purpose: "用三轮追问检验是否能以高管标准说明责任、判断、结果和组织影响。",
    input: "优先回答真实案例，说明你的角色、决策依据、行动、量化结果、限制和复盘。",
    output: "完整问答记录，并作为 Quarterly Review 的评估输入。",
    tips: ["不知道或没有真实案例时可以明确说明。", "不要编造数字；证据不足应保留为“不可评级”。"],
  },
  {
    id: "settings", title: "设置", english: "Growth Profile", href: "/settings",
    purpose: "维护长期发展目标，查看诊断置信度，并确认未来 6–8 周的阶段训练计划。",
    input: "填写长期目标；可以采用 AI 建议或自行制定阶段目标。替换已有计划时必须说明调整原因。",
    output: "生成可追溯的计划版本、1–2 项 Current Focus、阶段里程碑、复核日期和置信度快照。",
    tips: ["AI 只使用能力级聚合数据生成计划建议，确认后才会生效。", "置信度随有效学习和实践数据变化，表示数据充分程度而不是能力等级。"],
  },
] as const;

export default function HelpPage() {
  return (
    <PageContainer>
      <PageHeader backHref="/" eyebrow="Product Guide" title="使用帮助" description="了解每个页面的用途、需要提供的数据、系统会生成的结果，以及怎样获得更可靠的 AI 分析。" />

      <section className="mt-8 rounded-2xl bg-accent-soft p-6 sm:p-8">
        <div className="flex items-center gap-3 text-accent-strong"><CircleHelp size={22} /><h2 className="text-xl font-bold">第一次使用，从这三步开始</h2></div>
        <ol className="mt-6 grid gap-5 md:grid-cols-3">
          <QuickStep number="1" title="设置目标" description="在 Growth Profile 填写长期目标并选择 Current Focus。" href="/settings" />
          <QuickStep number="2" title="记录真实工作" description="使用 Capture 或 Daily 写下事件、角色、判断和结果。" href="/capture" />
          <QuickStep number="3" title="学习并验证" description="完成 Study、Quiz，再用真实实践和 Review 校准能力。" href="/study" />
        </ol>
      </section>

      <div className="mt-10 grid items-start gap-10 lg:grid-cols-[230px_minmax(0,1fr)]">
        <nav aria-label="帮助章节" className="rounded-2xl border border-line p-4 lg:sticky lg:top-6">
          <p className="px-3 pb-3 text-sm font-bold text-muted">页面指南</p>
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
            {helpSections.map((section) => <a key={section.id} href={`#${section.id}`} className="rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-soft hover:text-accent">{section.title} <span className="font-normal text-muted">{section.english}</span></a>)}
            <a href="#ai-boundaries" className="rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-soft hover:text-accent">AI 能力边界</a>
          </div>
        </nav>

        <div className="divide-y divide-line border-y border-line">
          {helpSections.map((section) => (
            <section id={section.id} key={section.id} className="scroll-mt-6 py-9 first:pt-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="text-sm font-bold text-accent">{section.english}</p><h2 className="mt-1 text-2xl font-bold">{section.title}</h2></div>
                <Link href={section.href} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-bold hover:border-accent hover:text-accent">进入功能 <ArrowRight size={17} /></Link>
              </div>
              <p className="mt-5 leading-7 text-muted">{section.purpose}</p>
              <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                <HelpField term="需要提供什么" description={section.input} />
                <HelpField term="系统会生成什么" description={section.output} />
              </dl>
              <div className="mt-6 rounded-xl bg-soft px-5 py-4">
                <p className="text-sm font-bold">使用建议</p>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-muted">{section.tips.map((tip) => <li key={tip} className="flex gap-2"><CheckCircle2 className="mt-1 shrink-0 text-accent" size={16} /><span>{tip}</span></li>)}</ul>
              </div>
            </section>
          ))}

          <section id="ai-boundaries" className="scroll-mt-6 py-9">
            <p className="text-sm font-bold text-accent">Responsible AI</p>
            <h2 className="mt-1 text-2xl font-bold">AI 的能力边界</h2>
            <div className="mt-5 space-y-4 leading-7 text-muted">
              <p>AI 只能根据你提供的文字和系统中已有的成长记录进行分析，不能自动验证会议是否发生、数字是否准确或结果是否真正归因于你的行动。</p>
              <p>系统会尽量保守评估证据，但生成内容仍可能遗漏或误解。请保留原始事实、明确区分真实与假设，并在重要复盘或职业判断前自行核对。</p>
            </div>
          </section>
        </div>
      </div>
    </PageContainer>
  );
}

function QuickStep({ number, title, description, href }: { number: string; title: string; description: string; href: string }) {
  return <li><span className="grid size-8 place-items-center rounded-full bg-accent text-sm font-bold text-white">{number}</span><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{description}</p><Link href={href} className="mt-3 inline-flex min-h-10 items-center gap-1 text-sm font-bold text-accent">前往 <ArrowRight size={16} /></Link></li>;
}

function HelpField({ term, description }: { term: string; description: string }) {
  return <div><dt className="text-sm font-bold">{term}</dt><dd className="mt-2 text-sm leading-6 text-muted">{description}</dd></div>;
}
