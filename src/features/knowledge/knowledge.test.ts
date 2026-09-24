import { describe, expect, it } from "vitest";
import type { CurriculumConcept, ProgressSnapshot } from "./domain";
import { dueConcepts, recommendNext } from "./recommendation";
import { calculateProgress, nextReviewDate, rebuildProgress } from "./spaced-repetition";

const concepts: CurriculumConcept[] = [
  {
    code: "business_model", capability: "Business", category: "基础", titleEn: "Business Model",
    titleZh: "商业模式", description: "测试", whyItMatters: "测试", prerequisites: [], sortOrder: 1,
  },
  {
    code: "accounts_receivable", capability: "Finance", category: "基础", titleEn: "Accounts Receivable",
    titleZh: "应收账款", description: "测试", whyItMatters: "测试", prerequisites: [], sortOrder: 1,
  },
  {
    code: "working_capital", capability: "Finance", category: "基础", titleEn: "Working Capital",
    titleZh: "营运资本", description: "测试", whyItMatters: "测试", prerequisites: ["accounts_receivable"], sortOrder: 2,
  },
];

const snapshot = (overrides: Partial<ProgressSnapshot> = {}): ProgressSnapshot => ({
  status: "understood", firstLearnedAt: "2026-01-01", lastReviewedAt: "2026-01-01",
  nextReviewAt: "2026-12-31", reviewCount: 1, consecutiveSuccesses: 1,
  lastConceptScore: 2, lastApplicationScore: 2, ...overrides,
});

describe("spaced repetition parity", () => {
  it("matches every CLI scheduler branch, including first perfect result at 30 days", () => {
    expect(nextReviewDate(1, 3, 5, "2026-01-01")).toBe("2026-01-02");
    expect(nextReviewDate(2, 1, 0, "2026-01-01")).toBe("2026-01-04");
    expect(nextReviewDate(2, 2, 0, "2026-01-01")).toBe("2026-01-08");
    expect(calculateProgress(undefined, { conceptScore: 3, applicationScore: 3, reviewedOn: "2026-01-01" }).nextReviewAt).toBe("2026-01-31");
    expect(nextReviewDate(3, 3, 3, "2026-01-01")).toBe("2026-04-01");
  });

  it("rebuilds progress from valid sessions only", () => {
    const rebuilt = rebuildProgress([
      { conceptScore: 2, applicationScore: 2, reviewedOn: "2026-01-01", committedAt: "2026-01-01T09:00:00Z", valid: true },
      { conceptScore: 3, applicationScore: 3, reviewedOn: "2026-01-02", committedAt: "2026-01-02T09:00:00Z", valid: false },
    ]);
    expect(rebuilt?.reviewCount).toBe(1);
    expect(rebuilt?.lastConceptScore).toBe(2);
  });
});

describe("study next parity", () => {
  it("uses stable foundation order for a new user", () => {
    expect(recommendNext({ concepts, progress: {}, focusCapabilities: [], recentGapText: "", today: "2026-09-24" })?.concept.code).toBe("business_model");
  });

  it("prioritizes focus, then an eligible recent gap", () => {
    const progress = { accounts_receivable: snapshot() };
    expect(recommendNext({ concepts, progress, focusCapabilities: ["Finance"], recentGapText: "Working Capital / 营运资本", today: "2026-09-24" })?.concept.code).toBe("working_capital");
  });

  it("prioritizes an eligible recent gap before curriculum fallback when no focus exists", () => {
    expect(recommendNext({
      concepts,
      progress: {},
      focusCapabilities: [],
      recentGapText: "应收账款周转率需要补足 / Accounts Receivable",
      today: "2026-09-24",
    })?.concept.code).toBe("accounts_receivable");
  });

  it("blocks an unmet prerequisite and leaves due work for quiz", () => {
    const progress = { accounts_receivable: snapshot({ status: "learning", nextReviewAt: "2026-09-24" }) };
    expect(recommendNext({ concepts, progress, focusCapabilities: ["Finance"], recentGapText: "Working Capital", today: "2026-09-24" })?.concept.code).toBe("business_model");
    expect(dueConcepts(concepts, progress, "2026-09-24")[0]?.concept.code).toBe("accounts_receivable");
  });
});
