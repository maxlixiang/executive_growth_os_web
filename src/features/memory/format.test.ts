import { describe, expect, it } from "vitest";
import { memoryMarkdown } from "./format";
describe("memory coverage", () => {
 it("keeps capacity bounds across all actual context sections", () => {
  const records = Array.from({length: 20}, (_,i) => ({ id: `source-${i}`, text: "长历史记录".repeat(5000) }));
  const sections = Object.fromEntries(Array.from({length: 17}, (_,i) => [`section-${i}`, records]));
  expect(memoryMarkdown(sections, 10_000).length).toBeLessThanOrEqual(10_000);
 });
 it("keeps small histories complete", () => { expect(memoryMarkdown({ 档案: "财务零基础", 原始回答: [{ id: "source-1", answer: "不知道" }] })).toContain("source-1"); });
 it("bounds long inputs and reports excerpts without modifying canonical data", () => {
  const records = Array.from({ length: 30 }, (_, i) => ({ id: `source-${i}`, answer: "这是非常长的原始回答".repeat(2000) }));
  const output = memoryMarkdown({ 档案: "财务零基础", 当前概念: records }, 10_000);
  expect(output.length).toBeLessThanOrEqual(10_000); expect(output).toContain("财务零基础"); expect(output).toContain("source-0"); expect(output).toContain("本次记忆覆盖说明"); expect(output).toContain("memory_excerpt"); expect(records[0].answer.length).toBeGreaterThan(10000);
 });
});
