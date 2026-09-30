import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { evaluateManagementInterview } from "./interview-teacher";
import { assessmentQuestions } from "@/features/assessment/questions";
import { generateStudyQuestions, evaluateStudyAnswers } from "./teacher";
import type { KnowledgeConcept } from "@/features/knowledge/queries";
const live = process.env.DEEPSEEK_LIVE_TEST === "1";
describe.skipIf(!live)("real DeepSeek private teacher", () => {
 it("teaches a beginner and assesses a new answer using persistent source history", async () => {
  process.loadEnvFile(".env.local");
  const concept = { code: "roi", capability: "Finance", titleEn: "ROI", titleZh: "投资回报率", description: "收益减成本除以成本", whyItMatters: "判断投入回报", corePrinciples: ["净收益除以投资成本"], keyQuestions: [], applicationQuestions: [], commonMistakes: ["收入当净收益"] } as unknown as KnowledgeConcept;
  const context = "## 学习者自述\n只有法务经验，财务零基础。每天30分钟，先直接讲解。\n## 有效原始问答 source_id=synthetic-roi-1\n上次把收入当作净收益，回答成本100收入130的ROI是130%。AI纠正为30%。上次日期2026-09-20，今天复习，不要凭旧分数判断本次已掌握。";
  const lesson = await generateStudyQuestions(concept, context, "foundation");
  expect(lesson.teaching_intro.length).toBeGreaterThan(50);
  expect(lesson.teaching_intro).toMatch(/成本|净收益/);
  const feedback = await evaluateStudyAnswers({ concept, context, mode: "review", recallQuestion: "请解释ROI，以及收入和净收益的区别。", recallAnswer: "ROI是收入除以成本。", applicationQuestion: "成本200，收入250，ROI是多少？", applicationAnswer: "250除以200等于125%。" });
  expect(feedback.concept_score).toBeLessThan(2);
  expect(feedback.application_score).toBeLessThan(2);
  expect(feedback.teaching).toMatch(/25%|25％|0\.25/);
  console.log("Live teaching and forgetting check passed; no credentials or user data printed.");
 }, 150000);
 it("does not infer interview readiness from background when every answer is unknown", async () => {
  process.loadEnvFile(".env.local");
  const transcript = assessmentQuestions.map((q, i) => `${i*4+1}. Interviewer (${q.code}): ${q.knowledgeQuestion} ${q.caseQuestion}\n${i*4+2}. User: 不知道。\n${i*4+3}. Interviewer (${q.code} follow-up): 请说明判断依据和风险。\n${i*4+4}. User: 没有理解，无法回答。`).join("\n\n");
  const result = await evaluateManagementInterview("用户自述法务经验丰富；不得用背景替代本场回答。", transcript, Array.from({ length: 12 }, (_, i) => (i+1)*2));
  expect(result.ready).toBe(false);
  expect(result.readiness).toBeLessThan(55);
  expect(result.scores).toHaveLength(6);
 }, 150000);
});
