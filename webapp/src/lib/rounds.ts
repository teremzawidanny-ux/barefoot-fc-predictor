const KNOCKOUT_ROUNDS = ['Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Third Place', 'Final'] as const;

export function isKnockoutRound(round: string): boolean {
  return (KNOCKOUT_ROUNDS as readonly string[]).includes(round);
}

export function isGroupStage(round: string): boolean {
  return round === 'Group Stage';
}
