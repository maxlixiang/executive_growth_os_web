import type { CurriculumConcept, ProgressSnapshot } from "./domain";

export type Recommendation = {
  concept: CurriculumConcept;
  reasons: string[];
};

function normalize(value: string) {
  return value.toLocaleLowerCase().replaceAll("_", " ");
}

function mentionedInGaps(concept: CurriculumConcept, gapText: string) {
  const haystack = normalize(gapText).replaceAll("_", " ");
  return [concept.code, concept.titleEn, concept.titleZh].some((term) =>
    haystack.includes(normalize(term).replaceAll("_", " ")),
  );
}

export function recommendNext({
  concepts,
  progress,
  focusCapabilities,
  recentGapText,
  today,
}: {
  concepts: CurriculumConcept[];
  progress: Record<string, ProgressSnapshot | undefined>;
  focusCapabilities: string[];
  recentGapText: string;
  today: string;
}): Recommendation | null {
  const capabilityFallback = [...new Set(concepts.map((item) => item.capability))].toSorted();
  const completed = new Set(["understood", "applied", "verified"]);

  const ranked = concepts.flatMap((concept) => {
    const state = progress[concept.code];
    const status = state?.status ?? "unknown";
    const isDue = Boolean(state?.nextReviewAt && state.nextReviewAt <= today);
    if (["applied", "verified", "needs_review"].includes(status) || isDue) return [];
    if (concept.prerequisites.some((code) => !completed.has(progress[code]?.status ?? "unknown"))) return [];

    const focusIndex = focusCapabilities.findIndex(
      (item) => normalize(item) === normalize(concept.capability),
    );
    const gapRank = mentionedInGaps(concept, recentGapText) ? 0 : 1;
    const masteryRank = status === "learning" ? 0 : status === "understood" ? 1 : 2;
    const rank = focusCapabilities.length > 0
      ? [focusIndex >= 0 ? 0 : 1, focusIndex >= 0 ? focusIndex : capabilityFallback.indexOf(concept.capability), gapRank, masteryRank, concept.sortOrder]
      : [gapRank, capabilityFallback.indexOf(concept.capability), masteryRank, concept.sortOrder];
    return [{ concept, rank }];
  });

  const selected = ranked.toSorted((left, right) => {
    for (let index = 0; index < left.rank.length; index += 1) {
      const difference = left.rank[index] - right.rank[index];
      if (difference !== 0) return difference;
    }
    return left.concept.code.localeCompare(right.concept.code);
  })[0];

  if (!selected) return null;
  const state = progress[selected.concept.code];
  const reasons: string[] = [];
  if (focusCapabilities.some((item) => normalize(item) === normalize(selected.concept.capability))) {
    reasons.push(`当前 Focus 包含 ${selected.concept.capability}`);
  }
  if (mentionedInGaps(selected.concept, recentGapText)) {
    reasons.push("最近 30 天的 Knowledge Gap 明确提到该概念");
  }
  reasons.push(
    selected.concept.prerequisites.length > 0
      ? "前置知识已达到 understood / applied / verified"
      : "该概念没有未完成的前置知识",
  );
  reasons.push(
    state?.status === "learning"
      ? `${selected.concept.titleZh} 仍在学习中`
      : state?.status === "understood"
        ? `${selected.concept.titleZh} 已理解但尚未达到应用掌握`
        : `${selected.concept.titleZh} 尚未学习`,
  );
  reasons.push(`在 curriculum 推荐顺序中位于第 ${selected.concept.sortOrder} 位`);
  return { concept: selected.concept, reasons };
}

export function dueConcepts<TConcept extends CurriculumConcept>(
  concepts: TConcept[],
  progress: Record<string, ProgressSnapshot | undefined>,
  today: string,
) {
  const conceptByCode = new Map(concepts.map((concept) => [concept.code, concept]));
  return Object.entries(progress)
    .flatMap(([code, state]) => {
      const concept = conceptByCode.get(code);
      return concept && state?.nextReviewAt && state.nextReviewAt <= today
        ? [{ concept, progress: state }]
        : [];
    })
    .toSorted((left, right) =>
      left.progress.nextReviewAt.localeCompare(right.progress.nextReviewAt)
      || left.concept.sortOrder - right.concept.sortOrder,
    );
}
