export const capabilityWeights = { business: 18, finance: 15, strategy: 18, execution: 18, leadership: 16, influence: 15 } as const;
export type CapabilityCode = keyof typeof capabilityWeights;
export type CapabilityScore = { knowledge: number; case: number; practice: number };

export function calculateReadiness(scores: Record<CapabilityCode, CapabilityScore>) {
  return Object.entries(capabilityWeights).reduce((total, [code, weight]) => {
    const score = scores[code as CapabilityCode];
    return total + (score.knowledge + score.case + score.practice) * weight / 100;
  }, 0);
}

export function evaluateReadinessGate(scores: Record<CapabilityCode, CapabilityScore>) {
  const readiness = calculateReadiness(scores);
  const capabilityScores = Object.values(scores).map((score) => score.knowledge + score.case + score.practice);
  const knowledgeFloor = Object.values(scores).every((score) => score.knowledge >= 18);
  const practiceFloor = Object.values(scores).every((score) => score.practice >= 16);
  return { readiness, ready: readiness >= 70 && Math.min(...capabilityScores) >= 55 && knowledgeFloor && practiceFloor, gates: { overall: readiness >= 70, capabilityFloor: Math.min(...capabilityScores) >= 55, knowledgeFloor, practiceFloor } };
}
