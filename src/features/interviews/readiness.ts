import { z } from "zod";
import { capabilityWeights, calculateReadiness, evaluateReadinessGate } from "@/features/assessment/readiness";
const code = z.enum(["business", "finance", "strategy", "execution", "leadership", "influence"]);
export const interviewEvaluationSchema = z.object({
  scores: z.array(z.object({ code, knowledge: z.number().int().min(0).max(30), case: z.number().int().min(0).max(30), defense: z.number().int().min(0).max(40), rationale: z.string().min(20), transcript_refs: z.array(z.number().int().positive()).min(1), next_practice: z.string().min(10) })).length(6).refine(items => new Set(items.map(i => i.code)).size === 6, "Each capability must appear once"),
  confidence: z.number().int().min(0).max(100),
  feedback_markdown: z.string().min(40),
});
export function interviewReadiness(input: unknown, availableAnswers: number[]) {
  const evaluation = interviewEvaluationSchema.parse(input);
  const validRefs = new Set(availableAnswers);
  if (evaluation.scores.some(i => i.transcript_refs.some(ref => !validRefs.has(ref)))) throw new Error("Interview references must identify actual answers");
  for (const score of evaluation.scores) {
    const index = Object.keys(capabilityWeights).indexOf(score.code);
    const relevant = availableAnswers.slice(index * 2, index * 2 + 2);
    if (score.transcript_refs.some(ref => !relevant.includes(ref))) throw new Error("Reference belongs to another capability");
  }
  const scores = Object.fromEntries(evaluation.scores.map(s => [s.code, { knowledge: s.knowledge, case: s.case, practice: s.defense }])) as Parameters<typeof calculateReadiness>[0];
  const gate = evaluateReadinessGate(scores);
  return { version: 2, purpose: "模拟管理者面试准备度", ...evaluation, readiness: Number(gate.readiness.toFixed(2)), ready: availableAnswers.length >= 12 && gate.ready, gates: { overall: gate.gates.overall, capabilityFloor: gate.gates.capabilityFloor, knowledgeFloor: gate.gates.knowledgeFloor, defenseFloor: gate.gates.practiceFloor, completeInterview: availableAnswers.length >= 12 }, weights: capabilityWeights, limitation: "回答好问题并不代表能解决实际问题；真实岗位胜任需要在工作与试用期中验证。" };
}
