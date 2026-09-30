import "server-only";
import { z } from "zod";
import { askDeepSeekJson } from "./deepseek-client";
import { assessmentQuestions } from "@/features/assessment/questions";
import { interviewEvaluationSchema, interviewReadiness } from "@/features/interviews/readiness";
import { memoryInstructions } from "@/features/memory/format";
export async function nextManagementQuestion(context: string, transcript: string, answers: number) {
  const capability = assessmentQuestions[Math.floor(answers / 2)];
  if (!capability) throw new Error("Interview is complete");
  const result = await askDeepSeekJson({
    system: `你是管理者模拟面试官。${memoryInstructions}。每项能力一问一追问，共12次回答。问题结合档案和当前训练目标，但不要教答案。没有管理岗位经历时允许明确标记的假设案例；不得要求用户编造真实业绩。追问独立检验判断依据、数字、备选方案、反对意见、风险与本人角色，不重复主问题。`,
    user: `能力：${capability.code}；${answers % 2 === 0 ? "主问题，请同时检验概念及案例判断" : "追问上一条回答的薄弱环节和证据"}。题材：${capability.knowledgeQuestion}；${capability.caseQuestion}。\n记忆：${context}\n访谈：${transcript}`,
    schema: z.object({ question: z.string().min(15) }),
  });
  return { ...result, capability_focus: capability.code };
}
export async function evaluateManagementInterview(context: string, transcript: string, answerSequences: number[]) {
  const result = await askDeepSeekJson({
    system: `你是严谨的模拟管理者面试评估者。${memoryInstructions}。六项能力各知识0–30、案例推理0–30、追问与证据陈述defense 0–40。defense考查独立回答追问、具体判断依据、逻辑一致性、事实与假设边界；允许真实可追溯证据或明确标记的模拟案例推理，无实际管理岗位经历不自动扣为零。只有自信表达、重复AI讲解或空泛自述不能高分。仅对本场面试回答评分，背景记忆不能替用户作答。每能力rationale解释分数与不足，transcript_refs引用本场该能力用户回答的序号，next_practice给下一步练习。confidence代表本场面试判断的可靠度，不代表真实岗位胜任。不得输出已证明真实管理能力。返回scores（六项各code,knowledge,case,defense,rationale,transcript_refs,next_practice）、confidence、feedback_markdown。`,
    user: `记忆：${context}\n本场原始访谈：${transcript}\n每项能力允许引用的用户回答序号：${JSON.stringify(Object.fromEntries(assessmentQuestions.map((q, i) => [q.code, answerSequences.slice(i * 2, i * 2 + 2)])))}`,
    schema: interviewEvaluationSchema,
  });
  return interviewReadiness(result, answerSequences);
}
