export type ConfidenceInputs = {
  hasLongTermGoal: boolean;
  validStudySessions: number;
  studiedCapabilities: number;
  analyzedReflections: number;
  practiceEvidence: number;
  evidencedCapabilities: number;
  monthlyReviews: number;
  completedQuarterlyReviews: number;
};

export type ConfidenceFactor = {
  key: keyof ConfidenceInputs | "baseline";
  label: string;
  points: number;
  maximum: number;
  detail: string;
};

export type DiagnosticConfidence = {
  score: number;
  level: "low" | "medium" | "high";
  label: "低" | "中" | "高";
  factors: ConfidenceFactor[];
  nextStep: string;
  version: 1;
};

function capped(value: number, pointsPerItem: number, maximum: number) {
  return Math.min(maximum, Math.max(0, Math.floor(value * pointsPerItem)));
}

export function calculateDiagnosticConfidence(input: ConfidenceInputs): DiagnosticConfidence {
  const factors: ConfidenceFactor[] = [
    { key: "baseline", label: "基础校准", points: 10, maximum: 10, detail: "系统保留最低基线，但不会把缺少数据误判为高置信度。" },
    { key: "hasLongTermGoal", label: "长期目标", points: input.hasLongTermGoal ? 10 : 0, maximum: 10, detail: input.hasLongTermGoal ? "已提供长期发展方向。" : "尚未提供长期发展方向。" },
    { key: "validStudySessions", label: "有效学习", points: capped(input.validStudySessions, 1.5, 15), maximum: 15, detail: `${input.validStudySessions} 次有效 Study / Quiz。` },
    { key: "studiedCapabilities", label: "知识覆盖", points: capped(input.studiedCapabilities, 2.5, 15), maximum: 15, detail: `已覆盖 ${input.studiedCapabilities}/6 项能力。` },
    { key: "analyzedReflections", label: "工作复盘", points: capped(input.analyzedReflections, 2, 10), maximum: 10, detail: `${input.analyzedReflections} 条已分析工作记录。` },
    { key: "practiceEvidence", label: "实践证据", points: capped(input.practiceEvidence, 2, 10), maximum: 10, detail: `${input.practiceEvidence} 条实践证据。` },
    { key: "evidencedCapabilities", label: "证据覆盖", points: capped(input.evidencedCapabilities, 2.5, 15), maximum: 15, detail: `证据覆盖 ${input.evidencedCapabilities}/6 项能力。` },
    { key: "monthlyReviews", label: "月度校准", points: capped(input.monthlyReviews, 5, 5), maximum: 5, detail: `${input.monthlyReviews} 次月度复盘。` },
    { key: "completedQuarterlyReviews", label: "季度校准", points: capped(input.completedQuarterlyReviews, 10, 10), maximum: 10, detail: `${input.completedQuarterlyReviews} 次完整季度评估。` },
  ];
  const score = Math.min(100, factors.reduce((total, factor) => total + factor.points, 0));
  const level = score < 40 ? "low" : score < 70 ? "medium" : "high";
  const label = level === "low" ? "低" : level === "medium" ? "中" : "高";
  const nextStep = level === "low"
    ? "继续完成基础学习，并记录至少两次包含本人判断与结果的真实工作事件。"
    : level === "medium"
      ? "扩大实践证据的能力覆盖，并通过月度或季度复盘校准阶段方向。"
      : "数据基础较充分；仍需用最新工作结果持续校准，而不是把高置信度当成能力认证。";
  return { score, level, label, factors, nextStep, version: 1 };
}
