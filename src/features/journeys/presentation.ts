export type JourneyPhase =
  | "foundation"
  | "baseline"
  | "formal_confirmation"
  | "trial_complete"
  | "cycle"
  | "formal_assessment";

type JourneyPhaseInput = {
  mode: string;
  stage: string;
  baselineCompletedOn: string | null;
  foundationReady: boolean;
  formalAssessmentDue: boolean;
};

export function getJourneyPhase(input: JourneyPhaseInput): JourneyPhase {
  if (input.stage === "active") return input.formalAssessmentDue ? "formal_assessment" : "cycle";
  if (input.baselineCompletedOn) return input.mode === "trial" ? "trial_complete" : "formal_confirmation";
  return input.foundationReady ? "baseline" : "foundation";
}

export function journeyPhaseStep(phase: JourneyPhase) {
  if (phase === "foundation") return 0;
  if (phase === "baseline") return 1;
  if (phase === "formal_confirmation" || phase === "trial_complete") return 2;
  if (phase === "cycle") return 3;
  return 4;
}
