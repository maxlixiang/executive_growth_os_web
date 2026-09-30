import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { buildGrowthContext } from "./context-builder";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
function fixture() {
  const queries: Array<{ table: string; filters: Array<[string, unknown]> }> = [];
  const client = { from(table: string) {
    const record = { table, filters: [] as Array<[string, unknown]> }; queries.push(record);
    const q = { select() { return q; }, eq(k: string, v: unknown) { record.filters.push([k, v]); return q; }, filter(k: string, _op: string, v: unknown) { return q.eq(k, v); }, order() { return q; }, limit() { return q; }, maybeSingle() { return q; }, then(resolve: (r: unknown) => void) { resolve({ error: null, data: table === "learning_journeys" ? { id: "active" } : table === "learner_memories" ? { profile_markdown: "财务从零开始；每周3小时" } : table === "study_sessions" ? [{ id: "valid-source", recall_answer: "把净收益误写成收入", ai_feedback: "这是以前的AI意见" }] : [] }); } }; return q;
  } } as unknown as SupabaseClient<Database>;
  return { client, queries };
}
describe("personal teacher context", () => {
  it("scopes every private source to both user and active journey", async () => { const f = fixture(); await buildGrowthContext(f.client, "user-a", undefined, "roi"); for (const q of f.queries.filter(q => q.table !== "learning_journeys")) { expect(q.filters).toContainEqual(["user_id", "user-a"]); if (!["knowledge_progress", "user_growth_state", "user_focuses"].includes(q.table)) expect(q.filters).toContainEqual(["journey_id", "active"]); } expect(f.queries.filter(q => q.table === "study_sessions").every(q => q.filters.some(([k,v]) => k === "is_valid" && v === true))).toBe(true); expect(f.queries.find(q => q.table === "practice_evidence")?.filters).toContainEqual(["review_status", "confirmed"]); });
  it("contains actual answers, learner background and topic history without a date cutoff", async () => { const f = fixture(); const context = await buildGrowthContext(f.client, "user-a", undefined, "roi"); expect(context).toContain("财务从零开始"); expect(context).toContain("把净收益误写成收入"); expect(context).toContain("valid-source"); expect(f.queries.some(q => q.table === "study_sessions" && q.filters.some(([k,v]) => k === "concept_id" && v === "roi"))).toBe(true); });
});
