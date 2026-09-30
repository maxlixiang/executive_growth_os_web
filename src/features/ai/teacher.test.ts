import { describe, expect, it, vi } from "vitest";
const { ask } = vi.hoisted(() => ({ ask: vi.fn() }));
vi.mock("./deepseek-client", () => ({ askDeepSeekJson: ask }));
import { generateStudyQuestions } from "./teacher";
import type { KnowledgeConcept } from "@/features/knowledge/queries";
describe("foundation teaching", () => {
 it("teaches first in foundation and tests recall first in review", async () => { const concept = { code: "roi" } as KnowledgeConcept; await generateStudyQuestions(concept, "金融零基础", "foundation"); expect(ask.mock.lastCall?.[0].user).toContain("模式：foundation"); expect(ask.mock.lastCall?.[0].user).toContain("零基础语言直接讲解"); await generateStudyQuestions(concept, "历史问答", "review"); expect(ask.mock.lastCall?.[0].user).toContain("模式：review"); expect(ask.mock.lastCall?.[0].user).toContain("针对历史错误验证遗忘"); });
});
