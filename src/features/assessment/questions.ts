import type { CapabilityCode } from "./readiness";

export type AssessmentQuestion = {
  code: CapabilityCode;
  title: string;
  knowledgeQuestion: string;
  caseQuestion: string;
};

const questions: Record<CapabilityCode, Omit<AssessmentQuestion, "code">> = {
  business: { title: "Business · 商业理解", knowledgeQuestion: "请用自己的话说明商业模式如何创造、交付和获取价值，并指出一个常见误区。", caseQuestion: "一家消费品公司销量增长但利润持续下降。你会先检查哪些商业模式要素，并如何判断问题来自客户、渠道、成本结构还是收入模式？" },
  finance: { title: "Finance · 财务与经营数字", knowledgeQuestion: "请解释利润、现金流和营运资本之间的关系，并说明为什么盈利企业也可能出现现金危机。", caseQuestion: "经销商要求延长账期以换取更高采购量。请说明你会需要哪些数据、如何测算影响，并给出决策条件。" },
  strategy: { title: "Strategy · 战略与决策", knowledgeQuestion: "请说明战略选择与一般经营目标的区别，并解释机会成本在战略决策中的作用。", caseQuestion: "公司只能在进入新市场和提升现有渠道效率之间选择一个。你会如何建立决策标准、验证关键假设并作出取舍？" },
  execution: { title: "Execution · 执行与项目管理", knowledgeQuestion: "请说明目标、里程碑、责任人、风险和反馈机制如何共同构成可执行的项目计划。", caseQuestion: "一个跨部门项目连续两周延期，各部门都称自己的任务已完成。你会如何定位瓶颈、重建责任边界并恢复节奏？" },
  leadership: { title: "Leadership · 领导力", knowledgeQuestion: "请说明管理者如何在授权、问责和支持之间取得平衡，并指出过度介入的风险。", caseQuestion: "一名高绩效员工结果优秀但破坏团队协作。你会如何判断、沟通并采取行动，同时保护团队和业务结果？" },
  influence: { title: "Influence · 影响力", knowledgeQuestion: "请说明在没有直接汇报权的情况下，建立影响力需要哪些基础，并解释利益相关者分析的作用。", caseQuestion: "你需要推动销售、财务和法务接受一项各有代价的新流程。你会如何识别诉求、设计沟通顺序并形成承诺？" },
};

export const assessmentQuestions: AssessmentQuestion[] = (Object.keys(questions) as CapabilityCode[]).map((code) => ({ code, ...questions[code] }));
