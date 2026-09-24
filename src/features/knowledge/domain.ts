export const progressStatuses = [
  "unknown",
  "learning",
  "understood",
  "applied",
  "verified",
  "needs_review",
] as const;

export type ProgressStatus = (typeof progressStatuses)[number];

export type CurriculumConcept = {
  code: string;
  capability: string;
  category: string;
  titleEn: string;
  titleZh: string;
  description: string;
  whyItMatters: string;
  prerequisites: string[];
  sortOrder: number;
};

export type ProgressSnapshot = {
  status: ProgressStatus;
  firstLearnedAt: string;
  lastReviewedAt: string;
  nextReviewAt: string;
  reviewCount: number;
  consecutiveSuccesses: number;
  lastConceptScore: number;
  lastApplicationScore: number;
};

export type StudyResultInput = {
  conceptScore: number;
  applicationScore: number;
  reviewedOn: string;
};

export type StudySessionSnapshot = StudyResultInput & {
  committedAt: string;
  valid: boolean;
};
