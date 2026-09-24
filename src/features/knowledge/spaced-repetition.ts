import type { ProgressSnapshot, StudyResultInput, StudySessionSnapshot } from "./domain";

const DAY_MS = 86_400_000;

function assertScore(score: number) {
  if (!Number.isInteger(score) || score < 0 || score > 3) {
    throw new RangeError("Scores must be integers between 0 and 3.");
  }
}

export function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(value.valueOf())) throw new RangeError(`Invalid ISO date: ${date}`);
  return new Date(value.valueOf() + days * DAY_MS).toISOString().slice(0, 10);
}

export function nextReviewDate(
  conceptScore: number,
  applicationScore: number,
  consecutiveSuccesses: number,
  reviewedOn: string,
) {
  assertScore(conceptScore);
  assertScore(applicationScore);

  let days: number;
  if (conceptScore <= 1) days = 1;
  else if (applicationScore <= 1) days = 3;
  else if (applicationScore === 2) days = 7;
  else days = [14, 30, 60, 90][Math.min(consecutiveSuccesses, 3)] ?? 90;

  return addDays(reviewedOn, days);
}

export function calculateProgress(
  prior: ProgressSnapshot | undefined,
  input: StudyResultInput,
): ProgressSnapshot {
  assertScore(input.conceptScore);
  assertScore(input.applicationScore);

  const passed = input.conceptScore >= 2 && input.applicationScore >= 2;
  const streak = passed ? (prior?.consecutiveSuccesses ?? 0) + 1 : 0;
  const status =
    input.conceptScore === 3 && input.applicationScore === 3
      ? "verified"
      : passed
        ? "applied"
        : "needs_review";

  return {
    status,
    firstLearnedAt: prior?.firstLearnedAt ?? input.reviewedOn,
    lastReviewedAt: input.reviewedOn,
    nextReviewAt: nextReviewDate(
      input.conceptScore,
      input.applicationScore,
      streak,
      input.reviewedOn,
    ),
    reviewCount: (prior?.reviewCount ?? 0) + 1,
    consecutiveSuccesses: streak,
    lastConceptScore: input.conceptScore,
    lastApplicationScore: input.applicationScore,
  };
}

export function rebuildProgress(sessions: StudySessionSnapshot[]) {
  return sessions
    .filter((session) => session.valid)
    .toSorted((left, right) => left.committedAt.localeCompare(right.committedAt))
    .reduce<ProgressSnapshot | undefined>(
      (progress, session) => calculateProgress(progress, session),
      undefined,
    );
}
