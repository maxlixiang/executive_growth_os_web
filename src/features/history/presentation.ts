type AssessmentLifecycleEvent = {
  event_type: string;
  source_type: string | null;
};

export function isRedundantAssessmentLifecycleEvent(event: AssessmentLifecycleEvent) {
  const type = event.event_type.toLocaleLowerCase();
  const source = event.source_type?.toLocaleLowerCase() ?? "";
  return source === "assessment_session" || type === "assessment_started" || type === "assessment_completed";
}
