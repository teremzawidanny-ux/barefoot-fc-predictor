// Phase 3 validation tests for round-aware prediction rules
// Run with: bun scripts/test-phase3-validation.ts

import { isGroupStage, isKnockoutRound } from '../backend/src/lib/rounds';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.log(`  ❌ FAIL: ${message}`);
  }
}

// --- Round utility tests ---
console.log('\n=== Round Utility Tests ===');
assert(isGroupStage('Group Stage'), 'Group Stage is group stage');
assert(!isGroupStage('Round of 32'), 'Round of 32 is not group stage');
assert(!isGroupStage('Final'), 'Final is not group stage');

assert(!isKnockoutRound('Group Stage'), 'Group Stage is not knockout');
assert(isKnockoutRound('Round of 32'), 'Round of 32 is knockout');
assert(isKnockoutRound('Round of 16'), 'Round of 16 is knockout');
assert(isKnockoutRound('Quarter-final'), 'Quarter-final is knockout');
assert(isKnockoutRound('Semi-final'), 'Semi-final is knockout');
assert(isKnockoutRound('Third Place'), 'Third Place is knockout');
assert(isKnockoutRound('Final'), 'Final is knockout');

// --- Scoring tests with Draw ---
console.log('\n=== Scoring Tests (Draw Support) ===');
import { scorePredicton } from '../backend/src/lib/scoring';

// Group stage draw: exact score
const drawExact = scorePredicton(
  { team1_score_predicted: 1, team2_score_predicted: 1, winner_predicted: 'Draw', method_predicted: 'regulation' },
  { team1_score: 1, team2_score: 1, winner: 'Draw', method: 'regulation' }
);
assert(drawExact.correct_winner === true, 'Draw exact: correct winner');
assert(drawExact.exact_score === true, 'Draw exact: exact score');
assert(drawExact.correct_goal_difference === true, 'Draw exact: correct goal diff');
assert(drawExact.correct_method === true, 'Draw exact: correct method');
assert(drawExact.points_awarded === 8, 'Draw exact: 8 points');

// Group stage draw: wrong score but correct draw
const drawWrongScore = scorePredicton(
  { team1_score_predicted: 0, team2_score_predicted: 0, winner_predicted: 'Draw', method_predicted: 'regulation' },
  { team1_score: 1, team2_score: 1, winner: 'Draw', method: 'regulation' }
);
assert(drawWrongScore.correct_winner === true, 'Draw wrong score: correct winner');
assert(drawWrongScore.exact_score === false, 'Draw wrong score: not exact');
assert(drawWrongScore.correct_goal_difference === true, 'Draw wrong score: goal diff correct (0=0)');
assert(drawWrongScore.correct_method === true, 'Draw wrong score: correct method');
assert(drawWrongScore.points_awarded === 5, 'Draw wrong score: 5 points (3+1+1)');

// Wrong draw prediction
const wrongDraw = scorePredicton(
  { team1_score_predicted: 1, team2_score_predicted: 1, winner_predicted: 'Draw', method_predicted: 'regulation' },
  { team1_score: 2, team2_score: 1, winner: 'Brazil', method: 'regulation' }
);
assert(wrongDraw.correct_winner === false, 'Wrong draw: incorrect winner');
assert(wrongDraw.points_awarded === 0, 'Wrong draw: 0 points');

// --- Backend prediction validation simulation ---
console.log('\n=== Group Stage Prediction Validation ===');

type ValidationResult = { ok: boolean; error?: string };

function validatePrediction(
  round: string,
  team1Score: number,
  team2Score: number,
  winner: string,
  method: string,
  team1: string,
  team2: string
): ValidationResult {
  const tied = team1Score === team2Score;

  if (isGroupStage(round)) {
    if (method !== 'regulation') return { ok: false, error: 'Group stage: method must be regulation' };
    if (tied && winner !== 'Draw') return { ok: false, error: 'Group stage: tied must be Draw' };
    if (!tied && winner === 'Draw') return { ok: false, error: 'Group stage: non-tied cannot be Draw' };
    if (!tied) {
      const expected = team1Score > team2Score ? team1 : team2;
      if (winner !== expected) return { ok: false, error: `Group stage: winner must be ${expected}` };
    }
  } else {
    if (winner === 'Draw') return { ok: false, error: 'Knockout: Draw not allowed' };
    if (tied && method !== 'penalties') return { ok: false, error: 'Knockout: tied must use penalties' };
    if (!tied && method === 'penalties') return { ok: false, error: 'Knockout: non-tied cannot use penalties' };
    if (!tied) {
      const expected = team1Score > team2Score ? team1 : team2;
      if (winner !== expected) return { ok: false, error: `Knockout: winner must be ${expected}` };
    }
  }
  return { ok: true };
}

// Test 1: Group-stage tied score — Draw allowed, regulation only
console.log('\n  1. Group-stage tied score:');
assert(validatePrediction('Group Stage', 1, 1, 'Draw', 'regulation', 'Brazil', 'Scotland').ok, 'Draw allowed with tied score');
assert(!validatePrediction('Group Stage', 1, 1, 'Draw', 'penalties', 'Brazil', 'Scotland').ok, 'Penalties rejected');
assert(!validatePrediction('Group Stage', 1, 1, 'Draw', 'extra_time', 'Brazil', 'Scotland').ok, 'Extra time rejected');
assert(!validatePrediction('Group Stage', 1, 1, 'Brazil', 'regulation', 'Brazil', 'Scotland').ok, 'Team winner rejected for tied scores');

// Test 2: Group-stage non-tied score — Draw rejected
console.log('\n  2. Group-stage non-tied score:');
assert(validatePrediction('Group Stage', 2, 1, 'Brazil', 'regulation', 'Brazil', 'Scotland').ok, 'Higher-scoring team as winner');
assert(!validatePrediction('Group Stage', 2, 1, 'Draw', 'regulation', 'Brazil', 'Scotland').ok, 'Draw rejected for non-tied');
assert(!validatePrediction('Group Stage', 2, 1, 'Scotland', 'regulation', 'Brazil', 'Scotland').ok, 'Lower-scoring team rejected');

// Test 3: Knockout tied score — Penalties required, Draw rejected
console.log('\n  3. Knockout tied score:');
assert(validatePrediction('Round of 32', 1, 1, 'Brazil', 'penalties', 'Brazil', 'Scotland').ok, 'Penalties required');
assert(!validatePrediction('Round of 32', 1, 1, 'Draw', 'penalties', 'Brazil', 'Scotland').ok, 'Draw rejected');
assert(!validatePrediction('Round of 32', 1, 1, 'Brazil', 'regulation', 'Brazil', 'Scotland').ok, 'Regulation rejected for tied');
assert(!validatePrediction('Round of 32', 1, 1, 'Brazil', 'extra_time', 'Brazil', 'Scotland').ok, 'Extra time rejected for tied');

// Test 4: Knockout non-tied score
console.log('\n  4. Knockout non-tied score:');
assert(validatePrediction('Round of 16', 2, 1, 'Brazil', 'regulation', 'Brazil', 'Scotland').ok, 'Regulation allowed');
assert(validatePrediction('Round of 16', 2, 1, 'Brazil', 'extra_time', 'Brazil', 'Scotland').ok, 'Extra time allowed');
assert(!validatePrediction('Round of 16', 2, 1, 'Brazil', 'penalties', 'Brazil', 'Scotland').ok, 'Penalties rejected for non-tied');
assert(validatePrediction('Round of 16', 2, 1, 'Brazil', 'regulation', 'Brazil', 'Scotland').ok, 'Winner matches higher-scoring team');

// Test 5: Round of 32 and onward — penalties only for tied
console.log('\n  5. Round of 32 and onward:');
assert(validatePrediction('Round of 32', 0, 0, 'Mexico', 'penalties', 'Mexico', 'USA').ok, 'R32 tied: penalties OK');
assert(!validatePrediction('Round of 32', 0, 0, 'Mexico', 'regulation', 'Mexico', 'USA').ok, 'R32 tied: regulation rejected');
assert(validatePrediction('Quarter-final', 2, 2, 'England', 'penalties', 'England', 'France').ok, 'QF tied: penalties OK');
assert(validatePrediction('Semi-final', 3, 1, 'Germany', 'regulation', 'Germany', 'Spain').ok, 'SF non-tied: regulation OK');
assert(validatePrediction('Final', 1, 0, 'Argentina', 'extra_time', 'Argentina', 'Brazil').ok, 'Final non-tied: ET OK');

// Test 6: Group Stage — penalties never available
console.log('\n  6. Group Stage — penalties never available:');
assert(!validatePrediction('Group Stage', 0, 0, 'Draw', 'penalties', 'Mexico', 'USA').ok, 'Penalties rejected in GS (tied)');
assert(!validatePrediction('Group Stage', 2, 1, 'Mexico', 'penalties', 'Mexico', 'USA').ok, 'Penalties rejected in GS (non-tied)');
assert(!validatePrediction('Group Stage', 3, 3, 'Draw', 'extra_time', 'Mexico', 'USA').ok, 'Extra time rejected in GS');

// --- Summary ---
console.log('\n=== Results ===');
console.log(`Passed: ${passed}/${passed + failed}`);
console.log(`Failed: ${failed}/${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
