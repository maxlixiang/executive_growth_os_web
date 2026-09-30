import { describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
vi.mock("server-only", () => ({}));
import { buildGrowthContext } from "./context-builder";
import type { Database } from "@/lib/supabase/database.types";
const live = process.env.MEMORY_LIVE_TEST === "1";
describe.skipIf(!live)("real private memory persistence", () => {
 it("persists across sign-in, blocks another user and isolates a restart", async () => {
  process.loadEnvFile(".env.local");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  expect(new URL(url).hostname).toBe("bzkimnflxteyhfgjgaih.supabase.co");
  const opts = { auth: { persistSession: false, autoRefreshToken: false } };
  const admin = createClient<Database>(url, process.env.SUPABASE_SECRET_KEY!, opts);
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const password = "TestOnly-TeacherMemory-2026!";
  async function user(label: string) {
    const email = `teacher-qa-${label}-${Date.now()}@example.invalid`;
    const users = await admin.auth.admin.listUsers({ perPage: 100 });
    const existing = users.data.users.filter(u => u.email?.startsWith(`teacher-qa-${label}-`) && u.email.endsWith("@example.invalid")).at(-1);
    const created = existing ? { data: { user: existing }, error: null } : await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: "私人老师验收（合成数据）" } });
    const loginEmail = created.data.user?.email ?? email;
    if (created.error || !created.data.user) throw created.error;
    const client = createClient<Database>(url, key, opts);
    const login = await client.auth.signInWithPassword({ email: loginEmail, password }); if (login.error) throw login.error;
    return { email: loginEmail, id: created.data.user.id, client };
  }
  const a = await user("a"), b = await user("b");
  const prior = await a.client.from("learning_journeys").select("*").eq("user_id", a.id).eq("status", "active").maybeSingle();
  try {
  const start = prior.data ? { data: prior.data, error: null } : await a.client.rpc("start_initial_learning_journey", { p_mode: "trial", p_preparation_started_on: new Date().toISOString().slice(0,10), p_long_term_goal: "合成验收：从财务基础逐步准备管理者模拟面试" });
  if (start.error) throw start.error;
  const jid = start.data.id;
  const profile = "## 背景\n法务经验；财务零基础（合成验收档案）。\n## 学习约定\n每天30分钟，先讲概念、例子与记忆要点，再独立回忆。\n## 目标\n准备管理者模拟面试，工作记录从第一天开放。";
  const save = await a.client.rpc("save_learner_memory", { p_journey_id: jid, p_markdown: profile }); if (save.error) throw save.error;
  await a.client.auth.signOut();
  const again = createClient<Database>(url, key, opts); const login = await again.auth.signInWithPassword({ email: a.email, password }); if (login.error) throw login.error;
  const remembered = await again.from("learner_memories").select("profile_markdown").eq("journey_id", jid).single(); expect(remembered.data?.profile_markdown).toBe(profile);
  const otherRead = await b.client.from("learner_memories").select("profile_markdown").eq("journey_id", jid); expect(otherRead.data).toEqual([]);
  const otherWrite = await b.client.rpc("save_learner_memory", { p_journey_id: jid, p_markdown: "forged" }); expect(otherWrite.error).not.toBeNull();
  const concept = await again.from("knowledge_concepts").select("id, capability_id").eq("concept_code", "ROI").single(); if (concept.error) throw concept.error;
  const attempt = await again.from("study_attempts").insert({ user_id: a.id, journey_id: jid, concept_id: concept.data.id, session_type: "study", teaching_mode: "foundation", teaching_intro: "合成ROI概念教学", recall_question: "解释ROI", recall_answer: "收入除以成本", application_question: "成本200收入250", application_answer: "125%", ai_feedback: "合成：混淆净收益与收入，需要复习", ai_rationale: "合成测试验证历史原始错误可被重新读取", concept_score: 2, application_score: 2, status: "awaiting_confirmation" }).select("id").single(); if (attempt.error) throw attempt.error;
  const committed = await again.rpc("commit_study_attempt", { p_attempt_id: attempt.data.id }); if (committed.error) throw committed.error;
  expect(committed.data.resulting_status).toBe("understood");
  const context = await buildGrowthContext(again, a.id, concept.data.capability_id, concept.data.id); expect(context).toContain("收入除以成本"); expect(context).toContain(profile.split("\n")[1]);
  const invalid = await again.rpc("set_study_session_validity", { p_session_id: committed.data.id, p_valid: false, p_reason: "合成验收：验证作废记录不进入教学" }); if (invalid.error) throw invalid.error;
  expect(await buildGrowthContext(again, a.id, concept.data.capability_id, concept.data.id)).not.toContain(committed.data.id);
  const restart = await again.rpc("restart_learning_journey", { p_mode: "trial", p_preparation_started_on: new Date().toISOString().slice(0,10), p_reason: "合成验收：验证旧记忆不会进入新旅程", p_copy_long_term_goal: false, p_confirmation: "重新开始学习旅程" }); if (restart.error) throw restart.error;
  expect(await buildGrowthContext(again, a.id)).not.toContain("合成验收档案");
  const staleSave = await again.rpc("save_learner_memory", { p_journey_id: jid, p_markdown: "should fail" }); expect(staleSave.error).not.toBeNull();
  const savedAgain = await again.rpc("save_learner_memory", { p_journey_id: restart.data.id, p_markdown: profile }); if (savedAgain.error) throw savedAgain.error;
  console.log("Persistence, user isolation, invalidation and journey restart verified with synthetic data only.");
  } finally {
    const removedA = await admin.auth.admin.deleteUser(a.id); if (removedA.error) throw removedA.error;
    const removedB = await admin.auth.admin.deleteUser(b.id); if (removedB.error) throw removedB.error;
  }
 }, 120000);
});
