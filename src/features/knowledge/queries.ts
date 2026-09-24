import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import { requireUser } from "@/lib/auth/require-user";
import type { CurriculumConcept, ProgressSnapshot, ProgressStatus } from "./domain";
import { dueConcepts, recommendNext } from "./recommendation";

type CapabilityRow = Database["public"]["Tables"]["capabilities"]["Row"];
type ConceptRow = Database["public"]["Tables"]["knowledge_concepts"]["Row"];
type CategoryRow = Database["public"]["Tables"]["knowledge_categories"]["Row"];
type ProgressRow = Database["public"]["Tables"]["knowledge_progress"]["Row"];

export type KnowledgeConcept = CurriculumConcept & {
  id: string;
  capabilityId: string;
  categoryId: string;
  corePrinciples: string[];
  keyQuestions: string[];
  applicationQuestions: string[];
  commonMistakes: string[];
  tags: string[];
};

export type CapabilitySummary = {
  id: string;
  code: string;
  titleEn: string;
  titleZh: string;
  sortOrder: number;
};

export type KnowledgeWorkspace = {
  userId: string;
  concepts: KnowledgeConcept[];
  capabilities: CapabilitySummary[];
  progress: Record<string, ProgressSnapshot | undefined>;
  focusCapabilities: string[];
  recentGapText: string;
};

function stringArray(value: Json): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function mapProgress(row: ProgressRow): ProgressSnapshot {
  return {
    status: row.status as ProgressStatus,
    firstLearnedAt: row.first_learned_at ?? row.created_at.slice(0, 10),
    lastReviewedAt: row.last_reviewed_at ?? row.created_at.slice(0, 10),
    nextReviewAt: row.next_review_at ?? "9999-12-31",
    reviewCount: row.review_count,
    consecutiveSuccesses: row.consecutive_successes,
    lastConceptScore: row.last_concept_score ?? 0,
    lastApplicationScore: row.last_application_score ?? 0,
  };
}

function assertNoErrors(results: Array<{ error: { message: string } | null }>) {
  const failure = results.find((result) => result.error);
  if (failure?.error) throw new Error(failure.error.message);
}

async function loadWorkspace(client: SupabaseClient<Database>, userId: string): Promise<KnowledgeWorkspace> {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const [capabilitiesResult, categoriesResult, conceptsResult, prerequisitesResult, progressResult, focusesResult, gapsResult] = await Promise.all([
    client.from("capabilities").select("*").eq("is_active", true).order("sort_order"),
    client.from("knowledge_categories").select("*").eq("is_active", true).order("sort_order"),
    client.from("knowledge_concepts").select("*").eq("is_active", true).order("sort_order"),
    client.from("knowledge_concept_prerequisites").select("concept_id, prerequisite_concept_id"),
    client.from("knowledge_progress").select("*").eq("user_id", userId),
    client.from("user_focuses").select("capability_id, priority").eq("user_id", userId).eq("is_active", true).order("priority"),
    client.from("growth_gaps").select("title, detail, concept_id, created_at").eq("user_id", userId).eq("gap_type", "knowledge").gte("created_at", since).order("created_at", { ascending: false }),
  ]);
  assertNoErrors([capabilitiesResult, categoriesResult, conceptsResult, prerequisitesResult, progressResult, focusesResult, gapsResult]);

  const capabilityById = new Map((capabilitiesResult.data ?? []).map((row: CapabilityRow) => [row.id, row]));
  const categoryById = new Map((categoriesResult.data ?? []).map((row: CategoryRow) => [row.id, row]));
  const conceptById = new Map((conceptsResult.data ?? []).map((row: ConceptRow) => [row.id, row]));
  const prerequisites = new Map<string, string[]>();
  for (const row of prerequisitesResult.data ?? []) {
    const code = conceptById.get(row.prerequisite_concept_id)?.concept_code;
    if (code) prerequisites.set(row.concept_id, [...(prerequisites.get(row.concept_id) ?? []), code]);
  }

  const concepts = (conceptsResult.data ?? []).flatMap((row: ConceptRow): KnowledgeConcept[] => {
    const capability = capabilityById.get(row.capability_id);
    const category = categoryById.get(row.category_id);
    if (!capability || !category) return [];
    return [{
      id: row.id,
      code: row.concept_code,
      capabilityId: row.capability_id,
      capability: capability.title_en,
      categoryId: row.category_id,
      category: category.title_zh,
      titleEn: row.title_en,
      titleZh: row.title_zh,
      description: row.description,
      whyItMatters: row.why_it_matters,
      prerequisites: prerequisites.get(row.id) ?? [],
      sortOrder: row.sort_order,
      corePrinciples: stringArray(row.core_principles),
      keyQuestions: stringArray(row.key_questions),
      applicationQuestions: stringArray(row.application_questions),
      commonMistakes: stringArray(row.common_mistakes),
      tags: stringArray(row.tags),
    }];
  }).toSorted((left, right) =>
    (capabilityById.get(left.capabilityId)?.sort_order ?? 0) - (capabilityById.get(right.capabilityId)?.sort_order ?? 0)
    || left.sortOrder - right.sortOrder,
  );

  const conceptCodeById = new Map(concepts.map((concept) => [concept.id, concept.code]));
  const progress: Record<string, ProgressSnapshot | undefined> = {};
  for (const row of progressResult.data ?? []) {
    const code = conceptCodeById.get(row.concept_id);
    if (code) progress[code] = mapProgress(row);
  }
  const capabilityNameById = new Map((capabilitiesResult.data ?? []).map((row) => [row.id, row.title_en]));
  const focusCapabilities = (focusesResult.data ?? []).flatMap((row) => {
    const name = capabilityNameById.get(row.capability_id);
    return name ? [name] : [];
  });
  const recentGapText = (gapsResult.data ?? []).map((row) =>
    [row.title, row.detail, row.concept_id ? conceptCodeById.get(row.concept_id) : null].filter(Boolean).join(" "),
  ).join("\n");

  return {
    userId,
    concepts,
    capabilities: (capabilitiesResult.data ?? []).map((row) => ({
      id: row.id,
      code: row.code,
      titleEn: row.title_en,
      titleZh: row.title_zh,
      sortOrder: row.sort_order,
    })),
    progress,
    focusCapabilities,
    recentGapText,
  };
}

export const getKnowledgeWorkspace = cache(async () => {
  const { supabase, user } = await requireUser();
  return loadWorkspace(supabase, user.id);
});

export async function getConcept(capability: string, code: string) {
  const workspace = await getKnowledgeWorkspace();
  return workspace.concepts.find((concept) =>
    concept.capability.toLocaleLowerCase() === capability.toLocaleLowerCase()
    && concept.code.toLocaleLowerCase() === code.toLocaleLowerCase(),
  ) ?? null;
}

export async function getRecommendation() {
  const workspace = await getKnowledgeWorkspace();
  const recommendation = recommendNext({
    ...workspace,
    today: new Date().toISOString().slice(0, 10),
  });
  return { workspace, recommendation };
}

export async function getQuizQueue() {
  const workspace = await getKnowledgeWorkspace();
  return {
    workspace,
    due: dueConcepts(workspace.concepts, workspace.progress, new Date().toISOString().slice(0, 10)),
  };
}

export async function getStudyHistory() {
  const { supabase, user } = await requireUser();
  const [sessionsResult, conceptsResult, capabilitiesResult] = await Promise.all([
    supabase.from("study_sessions").select("*").eq("user_id", user.id).order("committed_at", { ascending: false }),
    supabase.from("knowledge_concepts").select("id, concept_code, title_en, title_zh, capability_id"),
    supabase.from("capabilities").select("id, title_en"),
  ]);
  assertNoErrors([sessionsResult, conceptsResult, capabilitiesResult]);
  const capabilities = new Map((capabilitiesResult.data ?? []).map((row) => [row.id, row.title_en]));
  const concepts = new Map((conceptsResult.data ?? []).map((row) => [row.id, {
    ...row,
    capability: capabilities.get(row.capability_id) ?? "Unknown",
  }]));
  return (sessionsResult.data ?? []).map((session) => ({ session, concept: concepts.get(session.concept_id) }));
}

export async function getStudySession(id: string) {
  const history = await getStudyHistory();
  return history.find((item) => item.session.id === id) ?? null;
}
