import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import YAML from "yaml";

const root = resolve(import.meta.dirname, "..");
const sourceDirectory = resolve(root, "data", "curriculum");
const outputPath = resolve(root, "supabase", "migrations", "202609240002_seed_curriculum.sql");
const titleMigrationPath = resolve(root, "supabase", "migrations", "202609250007_curriculum_concept_titles.sql");
const capabilityTitles = {
  Business: "商业理解",
  Finance: "财务与经营数字",
  Strategy: "战略与决策",
  Execution: "执行与项目管理",
  Leadership: "领导力",
  Influence: "影响力",
};

const sql = (value) => `'${String(value).replaceAll("'", "''")}'`;
const json = (value) => `${sql(JSON.stringify(value))}::jsonb`;
const files = (await readdir(sourceDirectory)).filter((file) => file.endsWith(".yaml")).toSorted();
const capabilities = [];
const categories = [];
const concepts = [];

for (const [capabilityIndex, file] of files.entries()) {
  const document = YAML.parse(await readFile(resolve(sourceDirectory, file), "utf8"), { merge: true });
  const capability = document.capability;
  capabilities.push({ code: capability.toLowerCase(), titleEn: capability, titleZh: capabilityTitles[capability], sortOrder: capabilityIndex + 1 });
  const categoryEntries = Object.entries(document.categories ?? {});
  const categoryForConcept = new Map();
  categoryEntries.forEach(([titleZh, codes], categoryIndex) => {
    const categoryCode = `${capability.toLowerCase()}_${String(categoryIndex + 1).padStart(2, "0")}`;
    categories.push({ capability, categoryCode, titleZh, sortOrder: categoryIndex + 1 });
    codes.forEach((code) => categoryForConcept.set(code, categoryCode));
  });
  const order = new Map(categoryEntries.flatMap(([, codes]) => codes).map((code, index) => [code, index + 1]));
  for (const [index, concept] of (document.concepts ?? []).entries()) {
    const required = ["id", "title", "description", "why_it_matters", "core_principles", "key_questions", "application_questions", "common_mistakes", "prerequisites", "tags"];
    if (required.some((field) => concept[field] === undefined)) throw new Error(`Incomplete concept ${concept.id ?? "unknown"} in ${file}`);
    const titleZh = document.title_zh?.[concept.id] ?? concept.title_zh;
    if (!titleZh) throw new Error(`Missing Chinese title for concept ${concept.id} in ${file}`);
    const categoryCode = categoryForConcept.get(concept.id);
    if (!categoryCode) throw new Error(`Uncategorized concept ${concept.id} in ${file}`);
    concepts.push({
      capability,
      categoryCode,
      code: concept.id,
      titleEn: concept.title,
      titleZh,
      description: concept.description,
      whyItMatters: concept.why_it_matters,
      corePrinciples: concept.core_principles,
      keyQuestions: concept.key_questions,
      applicationQuestions: concept.application_questions,
      commonMistakes: concept.common_mistakes,
      prerequisites: concept.prerequisites,
      tags: concept.tags,
      sortOrder: order.get(concept.id) ?? index + 1,
    });
  }
}

if (capabilities.length !== 6 || concepts.length !== 138) {
  throw new Error(`Expected 6 capabilities and 138 concepts, received ${capabilities.length} and ${concepts.length}.`);
}

const statements = [
  "begin;",
  ...capabilities.map((item) => `insert into public.capabilities (code, title_en, title_zh, sort_order, is_active) values (${sql(item.code)}, ${sql(item.titleEn)}, ${sql(item.titleZh)}, ${item.sortOrder}, true) on conflict (code) do update set title_en = excluded.title_en, title_zh = excluded.title_zh, sort_order = excluded.sort_order, is_active = true, updated_at = now();`),
  ...categories.map((item) => `insert into public.knowledge_categories (capability_id, category_code, title_zh, sort_order, is_active) select id, ${sql(item.categoryCode)}, ${sql(item.titleZh)}, ${item.sortOrder}, true from public.capabilities where code = ${sql(item.capability.toLowerCase())} on conflict (capability_id, category_code) do update set title_zh = excluded.title_zh, sort_order = excluded.sort_order, is_active = true, updated_at = now();`),
  ...concepts.map((item) => `insert into public.knowledge_concepts (capability_id, category_id, concept_code, title_en, title_zh, description, why_it_matters, core_principles, key_questions, application_questions, common_mistakes, tags, sort_order, is_active) select c.id, k.id, ${sql(item.code)}, ${sql(item.titleEn)}, ${sql(item.titleZh)}, ${sql(item.description)}, ${sql(item.whyItMatters)}, ${json(item.corePrinciples)}, ${json(item.keyQuestions)}, ${json(item.applicationQuestions)}, ${json(item.commonMistakes)}, ${json(item.tags)}, ${item.sortOrder}, true from public.capabilities c join public.knowledge_categories k on k.capability_id = c.id and k.category_code = ${sql(item.categoryCode)} where c.code = ${sql(item.capability.toLowerCase())} on conflict (capability_id, concept_code) do update set category_id = excluded.category_id, title_en = excluded.title_en, title_zh = excluded.title_zh, description = excluded.description, why_it_matters = excluded.why_it_matters, core_principles = excluded.core_principles, key_questions = excluded.key_questions, application_questions = excluded.application_questions, common_mistakes = excluded.common_mistakes, tags = excluded.tags, sort_order = excluded.sort_order, is_active = true, updated_at = now();`),
  "delete from public.knowledge_concept_prerequisites where concept_id in (select id from public.knowledge_concepts);",
  ...concepts.flatMap((item) => item.prerequisites.map((prerequisite) => `insert into public.knowledge_concept_prerequisites (concept_id, prerequisite_concept_id) select child.id, parent.id from public.knowledge_concepts child join public.capabilities c on c.id = child.capability_id join public.knowledge_concepts parent on parent.capability_id = c.id where c.code = ${sql(item.capability.toLowerCase())} and child.concept_code = ${sql(item.code)} and parent.concept_code = ${sql(prerequisite)} on conflict do nothing;`)),
  "commit;",
  "",
];

const titleMigration = [
  "begin;",
  "update public.knowledge_concepts as concept",
  "set title_zh = translation.title_zh, updated_at = now()",
  "from public.capabilities as capability",
  "join (values",
  concepts.map((item) => `  (${sql(item.capability.toLowerCase())}, ${sql(item.code)}, ${sql(item.titleZh)})`).join(",\n"),
  ") as translation(capability_code, concept_code, title_zh) on translation.capability_code = capability.code",
  "where concept.capability_id = capability.id and concept.concept_code = translation.concept_code;",
  "commit;",
  "",
];

await Promise.all([
  writeFile(outputPath, statements.join("\n"), "utf8"),
  writeFile(titleMigrationPath, titleMigration.join("\n"), "utf8"),
]);
console.log(`Generated curriculum seed and title migration with ${capabilities.length} capabilities, ${categories.length} categories, and ${concepts.length} concepts.`);
