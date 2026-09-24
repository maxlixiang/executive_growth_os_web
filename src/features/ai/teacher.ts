import { z } from "zod";
import type { KnowledgeConcept } from "@/features/knowledge/queries";
import { askDeepSeekJson } from "./deepseek-client";

const teacherSystem = `你是严谨、耐心的高管能力 Teacher。
先问再讲；区分会背与会应用。将概念连接至快消、北美业务、渠道、供应链与法务工作。
评分规则：concept_score 与 application_score 都只能是 0、1、2、3。
0 表示不会或无法应用；1 表示部分理解或提示后才能应用；2 表示基本掌握或能处理基础案例；3 表示清晰掌握或能独立处理复杂案例。
教学反馈必须指出错误、补足概念，并说明如何改进真实应用判断。`;

const questionsSchema = z.object({
  recall_question: z.string().min(10),
  application_question: z.string().min(10),
});

const evaluationSchema = z.object({
  teaching: z.string().min(20),
  concept_score: z.number().int().min(0).max(3),
  application_score: z.number().int().min(0).max(3),
  rationale: z.string().min(10),
});

function conceptContext(concept: KnowledgeConcept) {
  return JSON.stringify({
    capability: concept.capability,
    code: concept.code,
    title_en: concept.titleEn,
    title_zh: concept.titleZh,
    description: concept.description,
    why_it_matters: concept.whyItMatters,
    core_principles: concept.corePrinciples,
    key_questions: concept.keyQuestions,
    application_questions: concept.applicationQuestions,
    common_mistakes: concept.commonMistakes,
  });
}

export function generateStudyQuestions(concept: KnowledgeConcept, context: string) {
  return askDeepSeekJson({
    system: teacherSystem,
    schema: questionsSchema,
    user: `Context:\n${context}\n\nConcept:\n${conceptContext(concept)}\n\n现在生成两个诊断问题。输出字段 recall_question, application_question。`,
  });
}

export function evaluateStudyAnswers({
  concept,
  context,
  recallQuestion,
  recallAnswer,
  applicationQuestion,
  applicationAnswer,
}: {
  concept: KnowledgeConcept;
  context: string;
  recallQuestion: string;
  recallAnswer: string;
  applicationQuestion: string;
  applicationAnswer: string;
}) {
  return askDeepSeekJson({
    system: teacherSystem,
    schema: evaluationSchema,
    user: `Context:\n${context}\n\nConcept:\n${conceptContext(concept)}\n\nRecall question: ${recallQuestion}\nRecall answer: ${recallAnswer}\n\nApplication question: ${applicationQuestion}\nApplication answer: ${applicationAnswer}\n\n请评估、教学并评分。输出字段 teaching, concept_score, application_score, rationale。`,
  });
}
