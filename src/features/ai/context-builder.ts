import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { memoryMarkdown, memoryInstructions } from "@/features/memory/format";

export async function buildGrowthContext(client: SupabaseClient<Database>, userId: string, capabilityId?: string, conceptId?: string) {
  const { data: journey, error } = await client.from("learning_journeys").select("id, stage, mode, preparation_started_on, formal_started_on").eq("user_id", userId).eq("status", "active").maybeSingle();
  if (error || !journey) throw new Error(error?.message ?? "Active learning journey required");
  const jid = journey.id;
  const [profile, state, plan, focuses, progress, sessions, topicSessions, daily, evidence, gaps, reviews, interviews] = await Promise.all([
    client.from("learner_memories").select("profile_markdown, updated_at").eq("user_id", userId).eq("journey_id", jid).maybeSingle(),
    client.from("user_growth_state").select("*").eq("user_id", userId).maybeSingle(),
    client.from("growth_plans").select("id, long_term_goal, phase_goal, focus_codes, milestones, rationale, starts_at, target_ends_at").eq("user_id", userId).filter("journey_id", "eq", jid).eq("status", "active").maybeSingle(),
    client.from("user_focuses").select("priority, note, capabilities(code, title_en)").eq("user_id", userId).eq("is_active", true).order("priority"),
    client.from("knowledge_progress").select("status, review_count, consecutive_successes, last_concept_score, last_application_score, next_review_at, knowledge_concepts(concept_code, title_en, capability_id)").eq("user_id", userId),
    client.from("study_sessions").select("id, concept_id, committed_at, session_type, resulting_status, recall_question, recall_answer, application_question, application_answer, concept_score, application_score, ai_feedback, ai_rationale, knowledge_concepts(concept_code, capability_id)").eq("user_id", userId).eq("journey_id", jid).eq("is_valid", true).order("committed_at", { ascending: false }).limit(60),
    conceptId ? client.from("study_sessions").select("id, committed_at, session_type, resulting_status, recall_question, recall_answer, application_question, application_answer, concept_score, application_score, ai_feedback, ai_rationale").eq("user_id", userId).eq("journey_id", jid).eq("concept_id", conceptId).eq("is_valid", true).order("committed_at", { ascending: false }).limit(20) : Promise.resolve({ data: [], error: null }),
    client.from("daily_reflections").select("id, reflection_date, raw_content, analysis, responsibility_hint").eq("user_id", userId).filter("journey_id", "eq", jid).order("created_at", { ascending: false }).limit(20),
    client.from("practice_evidence").select("id, evidence_level, context, user_role, action, decision, outcome, limitations, next_evidence_needed, capability_id").eq("user_id", userId).filter("journey_id", "eq", jid).eq("review_status", "confirmed").order("created_at", { ascending: false }).limit(60),
    client.from("growth_gaps").select("id, gap_type, title, detail, capability_id, concept_id").eq("user_id", userId).filter("journey_id", "eq", jid).eq("status", "open").order("created_at", { ascending: false }).limit(60),
    client.from("monthly_reviews").select("id, period_start, period_end, review_markdown").eq("user_id", userId).eq("journey_id", jid).order("created_at", { ascending: false }).limit(3),
    client.from("interview_sessions").select("id, title, completed_at, feedback_markdown, readiness_result").eq("user_id", userId).eq("journey_id", jid).eq("status", "completed").order("completed_at", { ascending: false }).limit(3),
  ]);
  const failed = [profile, state, plan, focuses, progress, sessions, topicSessions, daily, evidence, gaps, reviews, interviews].find(r => r.error);
  if (failed?.error) throw new Error(failed.error.message);
  const interviewIds = (interviews.data ?? []).map(i => i.id);
  const transcript = interviewIds.length ? await client.from("interview_messages").select("id, interview_session_id, role, content, sequence_number").eq("user_id", userId).filter("journey_id", "eq", jid).in("interview_session_id", interviewIds).order("sequence_number") : { data: [], error: null };
  if (transcript.error) throw new Error(transcript.error.message);
  const current = await client.from("learning_journeys").select("id").eq("user_id", userId).eq("status", "active").maybeSingle();
  if (current.error || current.data?.id !== jid) throw new Error("Learning journey changed while reading memory; retry");
  const relevant = <T extends { capability_id?: string | null }>(items: T[]) => capabilityId ? items.filter(i => !i.capability_id || i.capability_id === capabilityId) : items;
  return memoryMarkdown({
    "读取规则": memoryInstructions,
    "范围": { journey, generated_at: new Date().toISOString(), capabilityId, conceptId, coverage: "当前旅程。全部概念进度；最近60次有效学习原始问答；当前概念另外读取最近20次（不限日期）；最近20份工作记录、60条确认的证据、60个开放缺口、3次复盘和3次面试结论。原始记录仍完整保留在数据库；超出此范围请查历史。未保存、作废、候选、其他旅程记录不构成掌握证据。" },
    "学习者自述档案（可纠正，不是能力评分）": profile.data ?? { profile_markdown: "尚未填写；不得推断岗位、行业或已有知识。" },
    "当前成长状态（AI结论）": state.data,
    "已确认训练计划": plan.data,
    "重点能力": focuses.data,
    "概念掌握与复习日期": (progress.data ?? []).filter(i => !capabilityId || i.knowledge_concepts?.capability_id === capabilityId),
    "当前概念的长期学习记录": topicSessions.data,
    "待解决缺口": relevant(gaps.data ?? []),
    "近期原始学习问答与AI反馈": (sessions.data ?? []).filter(i => !capabilityId || i.knowledge_concepts?.capability_id === capabilityId),
    "工作记录（自述；analysis为AI分析）": daily.data,
    "用户已确认的实践证据": relevant(evidence.data ?? []),
    "近期复盘（AI结论）": reviews.data,
    "近期模拟面试结论": interviews.data,
    "近期模拟面试原始问答": transcript.data,
  });
}
