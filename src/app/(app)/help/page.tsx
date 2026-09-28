import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleHelp } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";

const helpSections = [
  {
    id: "dashboard", title: "首页", english: "Dashboard", href: "/",
    purpose: "说明当前学习阶段、下一步行动、成长计划、下一项学习和到期复习。",
    input: "无需在本页填写。内容来自你的 Growth Profile、学习记录、复盘和实践证据。",
    output: "一个根据当前状态生成的行动入口，而不是独立的数据源。",
    tips: ["先看当前旅程阶段和下一步。", "历史活动与 Review 已集中到历史页，不在首页重复展示。"],
  },
  {
    id: "records", title: "工作记录", english: "Records", href: "/capture",
    purpose: "随时保存会议、工作事件、想法、问题和待跟进事项；在同一处查看 AI 分析并核对候选实践证据。",
    input: "尽量写清背景、你的角色、行动、判断或取舍、相关人员、结果或数字，以及仍不确定的地方。",
    output: "“仅保存，暂不分析”只保留原文；“保存并 AI 分析”会生成摘要、能力标签、Gap 和候选实践证据。只有经你确认的证据才参与正式评估。",
    tips: ["AI 只分析你明确选择的记录；不会因分析新记录而读取此前仅保存的内容。", "未分析记录可以逐条处理，也可以明确选择批量分析。", "不需要下班后重新写一遍当天工作。", "会议记录可以直接粘贴，但应指出你本人做了什么。"],
  },
  {
    id: "learning", title: "学习中心", english: "Learning", href: "/study",
    purpose: "在同一个入口完成基础预学习、正式阶段学习、到期复习和知识地图浏览；页面会根据当前旅程阶段切换下一步。",
    input: "先用自己的话回答，不要复制定义；应用题应结合真实或明确标注的假设情境。",
    output: "基础预学习进度，或正式 Cycle 中的概念分、应用分、掌握状态、复习安排和知识覆盖情况。",
    tips: ["预学习阶段只推进 24 项核心概念，不使用正式阶段的动态推荐。", "基线诊断或正式开始待确认时，学习中心会停止推荐并引导你完成该节点。", "知识地图用于理解结构和自由浏览；学习历史统一在历史页查看。"],
  },
  {
    id: "plan", title: "成长中心", english: "Growth", href: "/plan",
    purpose: "在一个一级入口中管理长期目标和 6–8 周阶段计划，并查看六项能力的学习、应用、证据、Gap 与 Focus 进度。",
    input: "长期目标和计划调整需要你确认；能力进度无需直接填写，来自有效学习、已确认实践证据、Gap 和正式评估。",
    output: "可追溯的计划版本、当前 Focus、阶段里程碑、诊断置信度，以及能力维度的进展仪表板。",
    tips: ["用页面上方页签切换“成长概览与计划”和“能力进度”。", "课程完成度不等于能力证据。", "AI 建议的计划经你确认后才生效。"],
  },
  {
    id: "history", title: "历史", english: "History", href: "/history",
    purpose: "按类别查找学习、工作记录、实践证据、复盘、评估以及计划与旅程变化。",
    input: "无需填写。系统在重要操作完成后自动记录。",
    output: "当前旅程或全部旅程的可审计时间线；归档旅程会明确标注不参与当前评分。",
    tips: ["昵称修改等低重要性事件归入“其他”。", "历史用于回看发生了什么，不等同于知识复习。"],
  },
  {
    id: "assessment", title: "评估与复盘", english: "Assessment & Review", href: "/assessment",
    purpose: "在一个一级入口中完成正式评估、自主复盘和模拟面试，并集中查看历史结果。",
    input: "完成 24 项预学习后发起基线诊断；基线完成后，正式旅程还需确认正式起始日。进入 Cycle 后可自主评估，并按双月周期进行正式评估。",
    output: "基线诊断建立初始正式评分；自主评估更新当前能力估计；双月正式评估更新正式评分并推进 Cycle。自主复盘和模拟面试不会覆盖正式评分。",
    tips: ["用页面上方页签切换当前评估、自主复盘、模拟面试和历史结果。", "试用旅程完成基线后不会自动转为正式学习。", "只有基线诊断和双月正式评估属于可审计的正式评分。"],
  },
  {
    id: "reviews", title: "自主复盘", english: "Flexible Review", href: "/reviews",
    purpose: "由你选择任意起止日期，回顾这段时间的学习、工作实践、已确认实践证据、Gap 和 Focus 执行情况。",
    input: "填写复盘名称并选择日期范围；系统只读取当前学习旅程在该范围内的已有数据。",
    output: "按次数编号的事实摘要、优势、缺口和下一步建议，不直接更新正式评分或当前计划。",
    tips: ["复盘没有固定周、月或季度限制。", "每次复盘都会保留，可从历史结果中回看。", "复盘结论受记录完整度限制。"],
  },
  {
    id: "interviews", title: "模拟面试", english: "Interview Practice", href: "/interviews",
    purpose: "在你认为合适时，用三轮追问练习以高管标准说明责任、判断、结果和组织影响。",
    input: "优先回答真实案例，说明你的角色、决策依据、行动、量化结果、限制和复盘。",
    output: "完整问答记录和 AI 练习反馈；它不会自动更新正式能力评分。",
    tips: ["由你决定何时开始，不设固定频率。", "不知道或没有真实案例时可以明确说明。", "不要编造数字；正式评分仍以正式评估流程为准。"],
  },
  {
    id: "journey", title: "学习旅程", english: "Journey", href: "/",
    purpose: "从基础预学习开始，经基线诊断和正式开始确认进入 Cycle，再通过双月正式评估持续校准方向。",
    input: "首次选择试用或正式旅程并确认预学习日期；基线完成后，正式旅程还需确认正式起始日。更正日期或重启时必须填写原因。",
    output: "相互隔离的预学习阶段、初始评分、正式 Cycle、下次正式评估日期，以及可审计的旅程历史。",
    tips: ["预学习和基线诊断不属于 Cycle 1。", "试用旅程不会自动进入正式学习；正式使用时要新建正式旅程。", "重新规划当前 Cycle 不等于重启学习旅程；重启会归档旧旅程并从预学习重新开始。"],
  },
  {
    id: "settings", title: "设置", english: "Settings", href: "/settings",
    purpose: "管理昵称、预学习日期和学习旅程的数据边界。",
    input: "昵称可随时修改；更正日期必须填写原因；重启旅程需要强确认。",
    output: "更新界面称呼，或建立可审计的旅程日期与重启记录。",
    tips: ["昵称变化不会改变用户身份。", "重启会归档旧旅程，旧数据不参与当前 AI 判断。"],
  },
] as const;

export default function HelpPage() {
  return (
    <PageContainer>
      <PageHeader backHref="/" eyebrow="Product Guide" title="使用帮助" description="了解每个页面的用途、需要提供的数据、系统会生成的结果，以及怎样获得更可靠的 AI 分析。" />

      <section className="mt-8 rounded-2xl bg-accent-soft p-6 sm:p-8">
        <div className="flex items-center gap-3 text-accent-strong"><CircleHelp size={22} /><h2 className="text-xl font-bold">第一次使用，按这个顺序走完</h2></div>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">这不是七个每天都要做的任务，而是一条阶段路线。首页会持续告诉你当前所在阶段和唯一的优先下一步。</p>
        <ol className="mt-6 grid gap-x-6 gap-y-7 md:grid-cols-2 xl:grid-cols-4">
          <QuickStep number="1" title="建立学习旅程" description="选择试用或正式旅程，确认基础预学习开始日期。" href="/" />
          <QuickStep number="2" title="完成基础预学习" description="学习六项能力各 4 个核心概念，共 24 项；此时还没有正式评分。" href="/study" />
          <QuickStep number="3" title="进行基线诊断" description="准备好后主动发起，建立第一份可审计的初始正式评分。" href="/assessment" />
          <QuickStep number="4" title="确认正式开始" description="正式旅程确认起始日后进入 Cycle 1；试用旅程需另建正式旅程。" href="/assessment" />
          <QuickStep number="5" title="按 Cycle 学习与实践" description="依据 Focus 学习、复习并记录真实工作，确认可参与评估的实践证据。" href="/plan" />
          <QuickStep number="6" title="按需复盘与自测" description="可随时自主复盘、进行能力自测或模拟面试；这些不会覆盖正式评分。" href="/assessment" />
          <QuickStep number="7" title="完成双月正式评估" description="到期后更新正式评分并进入下一 Cycle，继续查漏补缺。" href="/assessment" />
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
