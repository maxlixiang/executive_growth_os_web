import { describe, expect, it } from "vitest";
import { interviewReadiness } from "./readiness";
const answers = Array.from({ length: 12 }, (_, i) => (i + 1) * 2);
const result = () => ({ scores: ["business", "finance", "strategy", "execution", "leadership", "influence"].map((code, i) => ({ code, knowledge: 24, case: 24, defense: 30, rationale: "独立解释了概念并完成案例与追问，但实际工作表现仍需要进一步验证。", transcript_refs: [answers[i * 2]], next_practice: "在真实工作中验证这次案例使用的关键假设。" })), confidence: 70, feedback_markdown: "本场回答具有结构和依据，可继续练习情景判断；模拟面试通过并不能证明真实岗位中的管理表现。" });
describe("management interview readiness", () => {
  it("can pass using interview reasoning without requiring real management evidence", () => { expect(interviewReadiness(result(), answers)).toMatchObject({ version: 2, ready: true, readiness: 78 }); });
  it("does not let a high average hide a weak capability", () => { const r = result(); r.scores[1].knowledge = 5; expect(interviewReadiness(r, answers).ready).toBe(false); });
  it("rejects duplicate capabilities", () => { const r = result(); r.scores[1].code = "business"; expect(() => interviewReadiness(r, answers)).toThrow(); });
  it("rejects nonexistent or cross-capability answer references", () => { const r = result(); r.scores[0].transcript_refs = [999]; expect(() => interviewReadiness(r, answers)).toThrow(); r.scores[0].transcript_refs = [answers[2]]; expect(() => interviewReadiness(r, answers)).toThrow(); });
});
