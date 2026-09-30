import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleHelp } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";

const helpSections = [
  { id: "roi-example", title: "完整学习样例：ROI", english: "Learning Example", href: "/study/finance/ROI", purpose: "体验概念讲解、独立回答、纠错、保存与复习，再连接工作记录。", input: "先理解ROI＝净收益÷投入成本：收入130、成本100，净收益30，ROI为30%。另做迁移题：收入250、成本200，ROI为25%。", output: "AI分别判断概念与简单应用，解释错误。你确认后保存原始问答并安排复习；老师下次读取历史，检验是否遗忘或重复混淆收入与净收益。", tips: ["基础理解不等于整个财务能力通过。", "工作中遇到投资取舍时，记录你掌握的数据、疑问与判断，再由AI生成候选证据并由你核对。", "以上是流程示例，AI实际生成的题目可能不同；样例数字只是教学情境，不保存为你的真实工作成果。"] },
  { id: "memory", title: "AI学习记忆", english: "Personal Teacher Memory", href: "/memory", purpose: "让老师连续了解你的背景、目标、原始学习回答与常见误解。", input: "填写或纠正岗位、基础、可用时间、学习偏好和工作机会。", output: "私有账户中持久保存的档案，及老师实际读取的Markdown上下文与来源ID。", tips: ["重新登录后仍可读取；你可以纠正背景档案，AI不会擅自覆盖它，自述也不会自动提高能力分数。", "老师按当前旅程和课程读取相关历史，有最近记录数量及上下文容量限制；预览会说明覆盖范围，Markdown导出不是全部历史的备份。", "学习历史详情可查看本次出题与评判实际使用的记忆。未确认保存或已作废的学习不构成掌握证据。", "档案和相关学习记录会随AI请求发送给已配置的DeepSeek服务。", "重启旅程不会自动导入旧档案；可主动查看旧历史。"] },
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
    tips: ["AI 只分析你明确选择的记录；不会因分析新记录而读取此前仅保存的内容。", "工作记录从基础预学习第一天就可使用，无须等到正式学习。", "未分析记录可以逐条处理；批量分析每次最多处理当前旅程的20条未分析或失败记录，更多记录可分次处理。", "分析时老师也会读取当前旅程的相关教学记忆，包括此前已经分析的工作记录。", "不需要下班后重新写一遍当天工作。", "会议记录可以直接粘贴，但应指出你本人做了什么。"],
  },
  {
    id: "learning", title: "学习中心", english: "Learning", href: "/study",
    purpose: "在同一个入口完成基础预学习、正式阶段学习、到期复习和知识地图浏览；页面会根据当前旅程阶段切换下一步。",
    input: "基础学习先听概念讲解与例子，再用自己的话回忆；复习时先独立回答。应用题结合真实或明确标注的假设情境。",
    output: "基础预学习进度，或正式 Cycle 中的概念分、应用分、掌握状态、复习安排和知识覆盖情况。",
    tips: ["预学习阶段的默认推荐围绕24项核心概念，不随训练重点切换；完成全部基础后才开放基线诊断。", "看完讲解或收到反馈还不算完成；确认保存结果后才更新进度与复习安排。基础理解不等于整个能力已经掌握。", "基线诊断或正式开始待确认时，学习中心会停止推荐并引导你完成该节点。", "知识地图用于理解结构和自由浏览；学习历史统一在历史页查看。"],
  },
  {
    id: "revision", title: "到期复习", english: "Revision", href: "/quiz",
    purpose: "检验知识在一段时间后是否仍能独立回忆与应用，处理遗忘和反复出现的误解。",
    input: "进入学习中心的“复习”页签，先独立回答概念题和应用题，再查看AI反馈并确认保存。",
    output: "本次复习结果、掌握状态和下次复习安排；当天答对不代表永久掌握。",
    tips: ["队列按到期日期安排；今天没有到期复习时，可以继续学习新概念。", "更换训练重点不会取消其他能力的到期复习。", "如果记录不准确，可在学习历史中填写原因并作废；作废结果不再参与有效进度与教学记忆。"],
  },
  {
    id: "knowledge-map", title: "知识地图", english: "Knowledge Map", href: "/knowledge",
    purpose: "浏览六项能力的课程结构、概念状态和前置知识，按需要进入相应知识点学习。",
    input: "选择能力和知识点；无须额外填写掌握情况。",
    output: "从有效学习与复习结果计算的知识状态，帮助区分未学、理解、应用与待复习。",
    tips: ["基础预学习的24项概念只是完整课程的一部分。", "浏览页面不会自动标记完成；正式动态推荐还会考虑训练重点、前置知识和知识缺口。"],
  },
  {
    id: "practice-evidence", title: "实践证据", english: "Practice Evidence", href: "/capture?view=analysis#evidence",
    purpose: "把工作中的行动、判断与结果整理成能力相关证据，并由你核对AI是否正确理解。",
    input: "在工作记录的“AI分析与实践证据”页签逐条核对候选项，选择确认采用、需补充或不采用。",
    output: "已确认的证据进入成长分析与正式评估；候选、需补充或不采用的记录保留供回看，但不作为已确认能力证据。",
    tips: ["确认采用表示你核对了记录，不代表系统已独立验证实际结果。", "缺少结果或数字时如实说明，可后续记录跟进情况；不要把假设案例当成真实工作成果。"],
  },
  {
    id: "plan", title: "成长中心", english: "Growth", href: "/plan",
    purpose: "在一个一级入口中管理长期目标和 6–8 周阶段计划，并查看六项能力的学习、应用、证据、Gap 与 Focus 进度。",
    input: "长期目标和计划调整需要你确认；能力进度无需直接填写，来自有效学习、已确认实践证据、Gap 和正式评估。",
    output: "可追溯的计划版本、当前 Focus、阶段里程碑、诊断置信度，以及能力维度的进展仪表板。",
    tips: ["用页面上方页签切换“成长概览与计划”和“能力进度”。", "课程完成度、模拟面试准备度和正式能力评分分别反映不同情况，不能互相替代。", "诊断置信度由记录数量与覆盖等规则计算，表示规划依据的充分程度，不是能力分数，也不是AI判断正确的概率。", "AI 建议的计划经你确认后才生效。"],
  },
  {
    id: "capability-progress", title: "能力进度", english: "Capability Progress", href: "/progress",
    purpose: "在成长中心按六项能力查看学习、应用、确认的证据与待解决缺口，并查看最近一次模拟面试准备度。",
    input: "无需手动填分；持续学习、复习、记录工作并核对实践证据。",
    output: "当前旅程的能力进展与后续行动线索；不同指标各自反映学习或实践情况。",
    tips: ["基础概念理解后，知识地图的应用掌握数量可能仍较低，这是统计口径不同，不是基础学习丢失。", "没有模拟面试结果时显示尚无结果，不能据此判断能力为零；完整评分详情在相应面试或评估中查看。"],
  },
  {
    id: "training-focus", title: "基础预学习与训练重点", english: "Training Focus", href: "/plan",
    purpose: "基础预学习用于建立六大核心能力的共同基础；当前训练重点用于选择下一阶段优先深入学习和实践的 1–2 项能力，两者不冲突。",
    input: "在成长中心展开“自行制定阶段计划”，选择 1–2 项能力，填写阶段目标、制定依据、里程碑和调整原因，再启用新计划；也可以先让 AI 建议，再由你确认。",
    output: "新训练重点生效后，正式学习的动态推荐会优先考虑这些能力；旧计划及调整原因保留在历史中，已有学习记录继续保留。",
    tips: [
      "基础预学习覆盖六项能力各 4 个核心概念，共 24 项。选择商业理解和财务不会取消其他能力的基础学习；本阶段的默认推荐仍按基础课程顺序推进，不随训练重点改变。",
      "进入正式学习后，训练重点仍可调整。例如先用约两个月加强商业理解和财务，再根据学习情况选择战略、执行与项目管理等其他方向。",
      "阶段计划通常安排 6–8 周，正式学习 Cycle 按两个月进行评估，两者是不同的安排。你可以在阶段结束后调整，也可以因学习需要提前调整，无须等到 Cycle 结束。",
      "到期评估或进入下一 Cycle 不会自动切换训练重点；继续原重点或启用新计划都由你确认。换重点不会重启旅程，也不需要重新完成全部基础预学习。",
      "训练重点表示学习优先级，其他能力仍可学习，到期复习仍需处理。",
    ],
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
    tips: ["用页面上方页签切换当前评估、自主复盘、模拟面试和历史结果。", "试用旅程完成基线后不会自动转为正式学习。", "只有基线诊断和双月正式评估更新最近正式评分；自主评估、复盘和模拟面试也会保留历史。", "尚未评估表示没有结果，不等于零分。正式评估仍采用知识、案例与实践证据口径，与模拟面试准备度分开查看。"],
  },
  {
    id: "reviews", title: "自主复盘", english: "Flexible Review", href: "/reviews",
    purpose: "由你选择任意起止日期，回顾这段时间的学习、工作实践、已确认实践证据、Gap 和 Focus 执行情况。",
    input: "填写复盘名称并选择日期范围。系统提取当前旅程在该范围内的学习、工作记录和确认的证据，同时读取私人教学记忆与当前状态作为背景。",
    output: "按次数编号的事实摘要、优势、缺口和下一步建议，不直接更新正式评分或当前计划。",
    tips: ["复盘没有固定周、月或季度限制。", "每次复盘都会保留，可从历史结果中回看。", "复盘结论受记录完整度限制；范围外的历史仅作背景，不应算作所选期间的新成果。", "复盘建议不会自动切换训练重点；如需调整，前往成长中心确认新计划。"],
  },
  {
    id: "interviews", title: "模拟面试", english: "Interview Practice", href: "/interviews",
    purpose: "在你认为合适时，用六项能力各一问一追问（12次回答），检验管理者模拟面试准备度；每项结论保留原始回答依据。",
    input: "说明你的角色、概念、决策依据、取舍和限制；无真实管理经历时允许明确标记的模拟案例，不能编造业绩。",
    output: "完整问答记录、六项能力的知识理解、案例推理与追问答辩评分、综合面试准备度、未满足的条件和下一步练习建议；它不会自动更新正式能力评分。",
    tips: ["由你决定何时开始，不设固定频率。", "不知道或没有真实案例时可以明确说明。", "当前面试需完成12次回答，再结合综合分和各能力最低要求判定准备度；历史旧版面试保留原规则。", "能清晰回答并经得起追问，可以近似判断模拟面试准备情况；回答好问题不代表能解决真实工作问题，岗位表现仍需实践验证。", "不要编造数字；正式评分仍以正式评估流程为准。"],
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
    purpose: "管理昵称、预学习日期和学习旅程的数据边界，并进入AI学习记忆查看或纠正背景档案。",
    input: "昵称可随时修改；更正日期必须填写原因；重启旅程需要强确认。",
    output: "更新界面称呼，或建立可审计的旅程日期与重启记录。",
    tips: ["昵称变化不会改变用户身份。", "长期目标和训练重点在成长中心修改，背景与学习约定在AI学习记忆中修改。", "重启会归档旧旅程，旧数据不参与当前 AI 判断；仅更换训练重点请使用成长计划，不要重启。"],
  },
] as const;

export default function HelpPage() {
  return (
    <PageContainer>
      <PageHeader backHref="/" eyebrow="Product Guide" title="使用帮助" description="了解每个页面的用途、需要提供的数据、系统会生成的结果，以及怎样获得更可靠的 AI 分析。" />

      <section className="mt-8 rounded-2xl bg-accent-soft p-6 sm:p-8">
        <div className="flex items-center gap-3 text-accent-strong"><CircleHelp size={22} /><h2 className="text-xl font-bold">第一次使用，按这个顺序走完</h2></div>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">以下是一条阶段路线，无须每天把所有任务都做一遍。首页会提示当前阶段和优先下一步；工作记录从第一天开放，已学内容按到期安排复习。</p>
        <ol className="mt-6 grid gap-x-6 gap-y-7 md:grid-cols-2 xl:grid-cols-4">
          <QuickStep number="1" title="建立学习旅程" description="选择试用或正式旅程，确认基础预学习开始日期。" href="/" />
          <QuickStep number="2" title="完成基础预学习" description="学习六项能力各 4 个核心概念，共 24 项；此时还没有正式评分。" href="/study" />
          <QuickStep number="3" title="进行基线诊断" description="准备好后主动发起，建立第一份可审计的初始正式评分。" href="/assessment" />
          <QuickStep number="4" title="确认正式开始" description="正式旅程确认起始日后进入 Cycle 1；试用旅程需另建正式旅程。" href="/assessment" />
          <QuickStep number="5" title="按 Cycle 学习与实践" description="依据当前训练重点学习与实践，可按阶段调整重点；持续复习并核对工作证据。" href="/plan" />
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
              <p>AI会结合当前旅程的私人教学记忆进行个性化教学，记忆有读取范围和容量限制，并非每次都读取全部历史。背景变化时请更新档案；AI反馈不能替代原始事实。</p>
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
