// Generate real_schedule_seed.sql for 2026 FIFA World Cup
// Run with: bun scripts/generate-seed.ts > supabase/real_schedule_seed.sql

const groups: Record<string, string[]> = {
  A: ['Mexico', 'South Africa', 'South Korea', 'Czechia'],
  B: ['Canada', 'Switzerland', 'Qatar', 'Bosnia & Herzegovina'],
  C: ['Brazil', 'Morocco', 'Scotland', 'Haiti'],
  D: ['USA', 'Paraguay', 'Australia', 'Turkey'],
  E: ['Germany', 'Curaçao', 'Costa Rica', 'Ecuador'],
  F: ['Netherlands', 'Japan', 'Tunisia', 'Sweden'],
  G: ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
  H: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
  I: ['France', 'Senegal', 'Norway', 'Iraq'],
  J: ['Argentina', 'Algeria', 'Austria', 'Jordan'],
  K: ['Portugal', 'Colombia', 'Uzbekistan', 'DR Congo'],
  L: ['England', 'Croatia', 'Ghana', 'Panama'],
};

// Round-robin pairings for [T0, T1, T2, T3]
// MD1: T0vT1, T2vT3 | MD2: T0vT2, T1vT3 | MD3: T0vT3, T1vT2
const pairings: [number, number][][] = [
  [[0, 1], [2, 3]],
  [[0, 2], [1, 3]],
  [[0, 3], [1, 2]],
];

// Two groups play per day, 4 matches per day
const groupPairsPerDay: [string, string][] = [
  ['A', 'B'], ['C', 'D'], ['E', 'F'],
  ['G', 'H'], ['I', 'J'], ['K', 'L'],
];

// MD starts: June 11, June 17, June 23
const mdStartDates = [11, 17, 23];

// ET match times (in hours): 12PM, 3PM, 6PM, 9PM
const matchTimesHoursET = [12, 15, 18, 21];

// Convert ET date+time to UTC ISO string (EDT = UTC-4 in June/July)
function etToUTC(year: number, month: number, day: number, hourET: number): string {
  const hourUTC = hourET + 4;
  const d = new Date(Date.UTC(year, month - 1, day, hourUTC, 0, 0));
  return d.toISOString().replace('T', ' ').replace('.000Z', '+00');
}

// Deadline: 11:59 PM ET the night before the match (ET calendar date)
// 11:59 PM EDT = 03:59 AM UTC same calendar date as match (ET)
function deadlineUTC(year: number, month: number, matchETDay: number): string {
  // Night before matchETDay at 23:59 ET = matchETDay at 03:59 UTC
  const d = new Date(Date.UTC(year, month - 1, matchETDay, 3, 59, 0));
  return d.toISOString().replace('T', ' ').replace('.000Z', '+00');
}

function escapeSQL(s: string): string {
  return s.replace(/'/g, "''");
}

interface MatchEntry {
  matchNumber: number;
  round: string;
  groupName: string | null;
  team1Source: string;
  team2Source: string;
  team1Actual: string | null;
  team2Actual: string | null;
  matchDate: string;
  deadline: string;
  status: string;
}

const matches: MatchEntry[] = [];
let matchNumber = 1;

// --- GROUP STAGE: 72 matches ---
for (let md = 0; md < 3; md++) {
  for (let dayIdx = 0; dayIdx < 6; dayIdx++) {
    const [grpA, grpB] = groupPairsPerDay[dayIdx];
    const etDay = mdStartDates[md] + dayIdx;
    const teamsA = groups[grpA];
    const teamsB = groups[grpB];
    const [pair1, pair2] = pairings[md];

    // Group A match 1
    matches.push({
      matchNumber: matchNumber++,
      round: 'Group Stage',
      groupName: grpA,
      team1Source: teamsA[pair1[0]],
      team2Source: teamsA[pair1[1]],
      team1Actual: teamsA[pair1[0]],
      team2Actual: teamsA[pair1[1]],
      matchDate: etToUTC(2026, 6, etDay, matchTimesHoursET[0]),
      deadline: deadlineUTC(2026, 6, etDay),
      status: 'open',
    });

    // Group A match 2
    matches.push({
      matchNumber: matchNumber++,
      round: 'Group Stage',
      groupName: grpA,
      team1Source: teamsA[pair2[0]],
      team2Source: teamsA[pair2[1]],
      team1Actual: teamsA[pair2[0]],
      team2Actual: teamsA[pair2[1]],
      matchDate: etToUTC(2026, 6, etDay, matchTimesHoursET[1]),
      deadline: deadlineUTC(2026, 6, etDay),
      status: 'open',
    });

    // Group B match 1
    matches.push({
      matchNumber: matchNumber++,
      round: 'Group Stage',
      groupName: grpB,
      team1Source: teamsB[pair1[0]],
      team2Source: teamsB[pair1[1]],
      team1Actual: teamsB[pair1[0]],
      team2Actual: teamsB[pair1[1]],
      matchDate: etToUTC(2026, 6, etDay, matchTimesHoursET[2]),
      deadline: deadlineUTC(2026, 6, etDay),
      status: 'open',
    });

    // Group B match 2
    matches.push({
      matchNumber: matchNumber++,
      round: 'Group Stage',
      groupName: grpB,
      team1Source: teamsB[pair2[0]],
      team2Source: teamsB[pair2[1]],
      team1Actual: teamsB[pair2[0]],
      team2Actual: teamsB[pair2[1]],
      matchDate: etToUTC(2026, 6, etDay, matchTimesHoursET[3]),
      deadline: deadlineUTC(2026, 6, etDay),
      status: 'open',
    });
  }
}

// --- ROUND OF 32: 16 matches (July 3-6, 4 per day) ---
const r32Sources: [string, string][] = [
  ['1st Group A', '2nd Group C'],
  ['1st Group C', '2nd Group A'],
  ['1st Group B', '2nd Group D'],
  ['1st Group D', '2nd Group B'],
  ['1st Group E', '2nd Group G'],
  ['1st Group G', '2nd Group E'],
  ['1st Group F', '2nd Group H'],
  ['1st Group H', '2nd Group F'],
  ['1st Group I', '2nd Group K'],
  ['1st Group K', '2nd Group I'],
  ['1st Group J', '2nd Group L'],
  ['1st Group L', '2nd Group J'],
  ['Best 3rd (Pool 1)', 'Best 3rd (Pool 2)'],
  ['Best 3rd (Pool 3)', 'Best 3rd (Pool 4)'],
  ['Best 3rd (Pool 5)', 'Best 3rd (Pool 6)'],
  ['Best 3rd (Pool 7)', 'Best 3rd (Pool 8)'],
];

const r32Days = [3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6]; // July dates
const r32Times = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3]; // time slot index

for (let i = 0; i < 16; i++) {
  matches.push({
    matchNumber: matchNumber++,
    round: 'Round of 32',
    groupName: null,
    team1Source: r32Sources[i][0],
    team2Source: r32Sources[i][1],
    team1Actual: null,
    team2Actual: null,
    matchDate: etToUTC(2026, 7, r32Days[i], matchTimesHoursET[r32Times[i]]),
    deadline: deadlineUTC(2026, 7, r32Days[i]),
    status: 'teams_pending',
  });
}

// --- ROUND OF 16: 8 matches (July 7-8, 4 per day) ---
const r16Days = [7, 7, 7, 7, 8, 8, 8, 8];
for (let i = 0; i < 8; i++) {
  const m1 = 73 + i * 2;
  const m2 = 74 + i * 2;
  matches.push({
    matchNumber: matchNumber++,
    round: 'Round of 16',
    groupName: null,
    team1Source: `W Match ${m1}`,
    team2Source: `W Match ${m2}`,
    team1Actual: null,
    team2Actual: null,
    matchDate: etToUTC(2026, 7, r16Days[i], matchTimesHoursET[i % 4]),
    deadline: deadlineUTC(2026, 7, r16Days[i]),
    status: 'teams_pending',
  });
}

// --- QUARTER-FINALS: 4 matches (July 11-12, 2 per day) ---
const qfDays = [11, 11, 12, 12];
const qfTimes = [15, 21, 15, 21]; // 3PM and 9PM ET
for (let i = 0; i < 4; i++) {
  const m1 = 89 + i * 2;
  const m2 = 90 + i * 2;
  matches.push({
    matchNumber: matchNumber++,
    round: 'Quarter-final',
    groupName: null,
    team1Source: `W Match ${m1}`,
    team2Source: `W Match ${m2}`,
    team1Actual: null,
    team2Actual: null,
    matchDate: etToUTC(2026, 7, qfDays[i], qfTimes[i]),
    deadline: deadlineUTC(2026, 7, qfDays[i]),
    status: 'teams_pending',
  });
}

// --- SEMI-FINALS: 2 matches (July 15) ---
for (let i = 0; i < 2; i++) {
  const m1 = 97 + i * 2;
  const m2 = 98 + i * 2;
  matches.push({
    matchNumber: matchNumber++,
    round: 'Semi-final',
    groupName: null,
    team1Source: `W Match ${m1}`,
    team2Source: `W Match ${m2}`,
    team1Actual: null,
    team2Actual: null,
    matchDate: etToUTC(2026, 7, 15, i === 0 ? 15 : 21),
    deadline: deadlineUTC(2026, 7, 15),
    status: 'teams_pending',
  });
}

// --- THIRD PLACE: 1 match (July 18) ---
matches.push({
  matchNumber: matchNumber++,
  round: 'Third Place',
  groupName: null,
  team1Source: 'L Match 101',
  team2Source: 'L Match 102',
  team1Actual: null,
  team2Actual: null,
  matchDate: etToUTC(2026, 7, 18, 15),
  deadline: deadlineUTC(2026, 7, 18),
  status: 'teams_pending',
});

// --- FINAL: 1 match (July 19) ---
matches.push({
  matchNumber: matchNumber++,
  round: 'Final',
  groupName: null,
  team1Source: 'W Match 101',
  team2Source: 'W Match 102',
  team1Actual: null,
  team2Actual: null,
  matchDate: etToUTC(2026, 7, 19, 15),
  deadline: deadlineUTC(2026, 7, 19),
  status: 'teams_pending',
});

// --- Generate SQL ---
const lines: string[] = [];
lines.push('-- ============================================================');
lines.push('-- 2026 FIFA World Cup -- Real Schedule Seed Data (104 matches)');
lines.push('-- Run AFTER phase3-migration.sql in Supabase SQL Editor');
lines.push('-- ============================================================');
lines.push('');
lines.push('-- 1. Delete existing demo predictions and matches (keeps participants)');
lines.push('DELETE FROM predictions;');
lines.push('DELETE FROM matches;');
lines.push('');
lines.push('-- 2. Insert all 104 matches');
lines.push('INSERT INTO matches (id, match_number, round, group_name, team1_source, team2_source, team1_actual, team2_actual, match_date, prediction_deadline, status, manual_locked, team1_score, team2_score, winner, method)');
lines.push('VALUES');

for (let i = 0; i < matches.length; i++) {
  const m = matches[i];
  const uuid = crypto.randomUUID();
  const groupVal = m.groupName ? `'${escapeSQL(m.groupName)}'` : 'NULL';
  const t1a = m.team1Actual ? `'${escapeSQL(m.team1Actual)}'` : 'NULL';
  const t2a = m.team2Actual ? `'${escapeSQL(m.team2Actual)}'` : 'NULL';
  const comma = i < matches.length - 1 ? ',' : ';';

  lines.push(`  ('${uuid}', ${m.matchNumber}, '${escapeSQL(m.round)}', ${groupVal}, '${escapeSQL(m.team1Source)}', '${escapeSQL(m.team2Source)}', ${t1a}, ${t2a}, '${m.matchDate}', '${m.deadline}', '${m.status}', FALSE, NULL, NULL, NULL, NULL)${comma}`);
}

console.log(lines.join('\n'));
