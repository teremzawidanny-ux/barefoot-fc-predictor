// Generates supabase/official_schedule_seed.sql from the official FIFA 2026 match schedule.
// Source: NBC Sports (US broadcast rights holder), cross-referenced with Sky Sports and FIFA.com
// Run with: bun scripts/generate-official-seed.ts

import { writeFileSync } from 'fs';
import { join } from 'path';

type MatchDef = {
  round: string;
  group: string | null;
  team1: string;
  team2: string;
  teamsKnown: boolean;
  etDate: string; // YYYY-MM-DD (actual ET calendar date)
  etHour: number; // 0-23
  etMinute: number; // 0-59
};

// Convert ET time to UTC timestamp string
function toUTC(etDate: string, etHour: number, etMinute: number): string {
  const [y, m, d] = etDate.split('-').map(Number);
  let utcH = etHour + 4; // EDT = UTC-4
  let utcD = d;
  let utcM = m;
  if (utcH >= 24) {
    utcH -= 24;
    utcD++;
    const daysInMonth = new Date(y, utcM, 0).getDate();
    if (utcD > daysInMonth) {
      utcD = 1;
      utcM++;
    }
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${y}-${pad(utcM)}-${pad(utcD)} ${pad(utcH)}:${pad(etMinute)}:00+00`;
}

// Prediction deadline = 11:59 PM ET the night before match's ET date
// = match ET date at 03:59:00 UTC
function deadline(etDate: string): string {
  return `${etDate} 03:59:00+00`;
}

// ========== GROUP STAGE (72 matches) ==========
// Source: NBC Sports complete schedule, all times Eastern (EDT)
// Cross-referenced with Sky Sports UK times (BST-5 = ET)

const groupStage: MatchDef[] = [
  // --- Group A: Mexico, South Africa, South Korea, Czechia ---
  // Matchday 1
  { round: 'Group Stage', group: 'A', team1: 'Mexico', team2: 'South Africa', teamsKnown: true, etDate: '2026-06-11', etHour: 15, etMinute: 0 },
  { round: 'Group Stage', group: 'A', team1: 'South Korea', team2: 'Czechia', teamsKnown: true, etDate: '2026-06-11', etHour: 22, etMinute: 0 },
  // Matchday 2
  { round: 'Group Stage', group: 'A', team1: 'Czechia', team2: 'South Africa', teamsKnown: true, etDate: '2026-06-18', etHour: 12, etMinute: 0 },
  { round: 'Group Stage', group: 'A', team1: 'Mexico', team2: 'South Korea', teamsKnown: true, etDate: '2026-06-18', etHour: 21, etMinute: 0 },
  // Matchday 3
  { round: 'Group Stage', group: 'A', team1: 'Czechia', team2: 'Mexico', teamsKnown: true, etDate: '2026-06-24', etHour: 21, etMinute: 0 },
  { round: 'Group Stage', group: 'A', team1: 'South Africa', team2: 'South Korea', teamsKnown: true, etDate: '2026-06-24', etHour: 21, etMinute: 0 },

  // --- Group B: Canada, Bosnia & Herzegovina, Qatar, Switzerland ---
  // Matchday 1
  { round: 'Group Stage', group: 'B', team1: 'Canada', team2: 'Bosnia & Herzegovina', teamsKnown: true, etDate: '2026-06-12', etHour: 15, etMinute: 0 },
  { round: 'Group Stage', group: 'B', team1: 'Qatar', team2: 'Switzerland', teamsKnown: true, etDate: '2026-06-13', etHour: 15, etMinute: 0 },
  // Matchday 2
  { round: 'Group Stage', group: 'B', team1: 'Switzerland', team2: 'Bosnia & Herzegovina', teamsKnown: true, etDate: '2026-06-18', etHour: 15, etMinute: 0 },
  { round: 'Group Stage', group: 'B', team1: 'Canada', team2: 'Qatar', teamsKnown: true, etDate: '2026-06-18', etHour: 18, etMinute: 0 },
  // Matchday 3
  { round: 'Group Stage', group: 'B', team1: 'Switzerland', team2: 'Canada', teamsKnown: true, etDate: '2026-06-24', etHour: 15, etMinute: 0 },
  { round: 'Group Stage', group: 'B', team1: 'Bosnia & Herzegovina', team2: 'Qatar', teamsKnown: true, etDate: '2026-06-24', etHour: 15, etMinute: 0 },

  // --- Group C: Brazil, Morocco, Haiti, Scotland ---
  // Matchday 1
  { round: 'Group Stage', group: 'C', team1: 'Brazil', team2: 'Morocco', teamsKnown: true, etDate: '2026-06-13', etHour: 18, etMinute: 0 },
  { round: 'Group Stage', group: 'C', team1: 'Haiti', team2: 'Scotland', teamsKnown: true, etDate: '2026-06-13', etHour: 21, etMinute: 0 },
  // Matchday 2
  { round: 'Group Stage', group: 'C', team1: 'Scotland', team2: 'Morocco', teamsKnown: true, etDate: '2026-06-19', etHour: 18, etMinute: 0 },
  { round: 'Group Stage', group: 'C', team1: 'Brazil', team2: 'Haiti', teamsKnown: true, etDate: '2026-06-19', etHour: 21, etMinute: 0 },
  // Matchday 3
  { round: 'Group Stage', group: 'C', team1: 'Scotland', team2: 'Brazil', teamsKnown: true, etDate: '2026-06-24', etHour: 18, etMinute: 0 },
  { round: 'Group Stage', group: 'C', team1: 'Morocco', team2: 'Haiti', teamsKnown: true, etDate: '2026-06-24', etHour: 18, etMinute: 0 },

  // --- Group D: USA, Paraguay, Australia, Turkiye ---
  // Matchday 1
  { round: 'Group Stage', group: 'D', team1: 'USA', team2: 'Paraguay', teamsKnown: true, etDate: '2026-06-12', etHour: 21, etMinute: 0 },
  // Midnight ET = 00:00 on June 14 (end of June 13 evening program)
  { round: 'Group Stage', group: 'D', team1: 'Australia', team2: 'Turkiye', teamsKnown: true, etDate: '2026-06-14', etHour: 0, etMinute: 0 },
  // Matchday 2
  { round: 'Group Stage', group: 'D', team1: 'USA', team2: 'Australia', teamsKnown: true, etDate: '2026-06-19', etHour: 15, etMinute: 0 },
  // Midnight ET = 00:00 on June 20
  { round: 'Group Stage', group: 'D', team1: 'Turkiye', team2: 'Paraguay', teamsKnown: true, etDate: '2026-06-20', etHour: 0, etMinute: 0 },
  // Matchday 3
  { round: 'Group Stage', group: 'D', team1: 'Turkiye', team2: 'USA', teamsKnown: true, etDate: '2026-06-25', etHour: 22, etMinute: 0 },
  { round: 'Group Stage', group: 'D', team1: 'Paraguay', team2: 'Australia', teamsKnown: true, etDate: '2026-06-25', etHour: 22, etMinute: 0 },

  // --- Group E: Germany, Curacao, Ivory Coast, Ecuador ---
  // Matchday 1
  { round: 'Group Stage', group: 'E', team1: 'Germany', team2: 'Curacao', teamsKnown: true, etDate: '2026-06-14', etHour: 13, etMinute: 0 },
  { round: 'Group Stage', group: 'E', team1: 'Ivory Coast', team2: 'Ecuador', teamsKnown: true, etDate: '2026-06-14', etHour: 19, etMinute: 0 },
  // Matchday 2
  { round: 'Group Stage', group: 'E', team1: 'Germany', team2: 'Ivory Coast', teamsKnown: true, etDate: '2026-06-20', etHour: 16, etMinute: 0 },
  { round: 'Group Stage', group: 'E', team1: 'Ecuador', team2: 'Curacao', teamsKnown: true, etDate: '2026-06-20', etHour: 20, etMinute: 0 },
  // Matchday 3
  { round: 'Group Stage', group: 'E', team1: 'Ecuador', team2: 'Germany', teamsKnown: true, etDate: '2026-06-25', etHour: 16, etMinute: 0 },
  { round: 'Group Stage', group: 'E', team1: 'Curacao', team2: 'Ivory Coast', teamsKnown: true, etDate: '2026-06-25', etHour: 16, etMinute: 0 },

  // --- Group F: Netherlands, Japan, Sweden, Tunisia ---
  // Matchday 1
  { round: 'Group Stage', group: 'F', team1: 'Netherlands', team2: 'Japan', teamsKnown: true, etDate: '2026-06-14', etHour: 16, etMinute: 0 },
  { round: 'Group Stage', group: 'F', team1: 'Sweden', team2: 'Tunisia', teamsKnown: true, etDate: '2026-06-14', etHour: 22, etMinute: 0 },
  // Matchday 2
  { round: 'Group Stage', group: 'F', team1: 'Netherlands', team2: 'Sweden', teamsKnown: true, etDate: '2026-06-20', etHour: 13, etMinute: 0 },
  // Midnight ET = 00:00 on June 21
  { round: 'Group Stage', group: 'F', team1: 'Tunisia', team2: 'Japan', teamsKnown: true, etDate: '2026-06-21', etHour: 0, etMinute: 0 },
  // Matchday 3
  { round: 'Group Stage', group: 'F', team1: 'Japan', team2: 'Sweden', teamsKnown: true, etDate: '2026-06-25', etHour: 19, etMinute: 0 },
  { round: 'Group Stage', group: 'F', team1: 'Tunisia', team2: 'Netherlands', teamsKnown: true, etDate: '2026-06-25', etHour: 19, etMinute: 0 },

  // --- Group G: Belgium, Egypt, Iran, New Zealand ---
  // Matchday 1
  { round: 'Group Stage', group: 'G', team1: 'Belgium', team2: 'Egypt', teamsKnown: true, etDate: '2026-06-15', etHour: 15, etMinute: 0 },
  { round: 'Group Stage', group: 'G', team1: 'Iran', team2: 'New Zealand', teamsKnown: true, etDate: '2026-06-15', etHour: 21, etMinute: 0 },
  // Matchday 2
  { round: 'Group Stage', group: 'G', team1: 'Belgium', team2: 'Iran', teamsKnown: true, etDate: '2026-06-21', etHour: 15, etMinute: 0 },
  { round: 'Group Stage', group: 'G', team1: 'New Zealand', team2: 'Egypt', teamsKnown: true, etDate: '2026-06-21', etHour: 21, etMinute: 0 },
  // Matchday 3
  { round: 'Group Stage', group: 'G', team1: 'Egypt', team2: 'Iran', teamsKnown: true, etDate: '2026-06-26', etHour: 23, etMinute: 0 },
  { round: 'Group Stage', group: 'G', team1: 'New Zealand', team2: 'Belgium', teamsKnown: true, etDate: '2026-06-26', etHour: 23, etMinute: 0 },

  // --- Group H: Spain, Cape Verde, Saudi Arabia, Uruguay ---
  // Matchday 1
  { round: 'Group Stage', group: 'H', team1: 'Spain', team2: 'Cape Verde', teamsKnown: true, etDate: '2026-06-15', etHour: 12, etMinute: 0 },
  { round: 'Group Stage', group: 'H', team1: 'Saudi Arabia', team2: 'Uruguay', teamsKnown: true, etDate: '2026-06-15', etHour: 18, etMinute: 0 },
  // Matchday 2
  { round: 'Group Stage', group: 'H', team1: 'Spain', team2: 'Saudi Arabia', teamsKnown: true, etDate: '2026-06-21', etHour: 12, etMinute: 0 },
  { round: 'Group Stage', group: 'H', team1: 'Uruguay', team2: 'Cape Verde', teamsKnown: true, etDate: '2026-06-21', etHour: 18, etMinute: 0 },
  // Matchday 3
  { round: 'Group Stage', group: 'H', team1: 'Cape Verde', team2: 'Saudi Arabia', teamsKnown: true, etDate: '2026-06-26', etHour: 20, etMinute: 0 },
  { round: 'Group Stage', group: 'H', team1: 'Uruguay', team2: 'Spain', teamsKnown: true, etDate: '2026-06-26', etHour: 20, etMinute: 0 },

  // --- Group I: France, Senegal, Iraq, Norway ---
  // Matchday 1
  { round: 'Group Stage', group: 'I', team1: 'France', team2: 'Senegal', teamsKnown: true, etDate: '2026-06-16', etHour: 15, etMinute: 0 },
  { round: 'Group Stage', group: 'I', team1: 'Iraq', team2: 'Norway', teamsKnown: true, etDate: '2026-06-16', etHour: 18, etMinute: 0 },
  // Matchday 2
  { round: 'Group Stage', group: 'I', team1: 'France', team2: 'Iraq', teamsKnown: true, etDate: '2026-06-22', etHour: 17, etMinute: 0 },
  { round: 'Group Stage', group: 'I', team1: 'Norway', team2: 'Senegal', teamsKnown: true, etDate: '2026-06-22', etHour: 20, etMinute: 0 },
  // Matchday 3
  { round: 'Group Stage', group: 'I', team1: 'Norway', team2: 'France', teamsKnown: true, etDate: '2026-06-26', etHour: 15, etMinute: 0 },
  { round: 'Group Stage', group: 'I', team1: 'Senegal', team2: 'Iraq', teamsKnown: true, etDate: '2026-06-26', etHour: 15, etMinute: 0 },

  // --- Group J: Argentina, Algeria, Austria, Jordan ---
  // Matchday 1
  { round: 'Group Stage', group: 'J', team1: 'Argentina', team2: 'Algeria', teamsKnown: true, etDate: '2026-06-16', etHour: 21, etMinute: 0 },
  // Midnight ET = 00:00 on June 17
  { round: 'Group Stage', group: 'J', team1: 'Austria', team2: 'Jordan', teamsKnown: true, etDate: '2026-06-17', etHour: 0, etMinute: 0 },
  // Matchday 2
  { round: 'Group Stage', group: 'J', team1: 'Argentina', team2: 'Austria', teamsKnown: true, etDate: '2026-06-22', etHour: 13, etMinute: 0 },
  { round: 'Group Stage', group: 'J', team1: 'Jordan', team2: 'Algeria', teamsKnown: true, etDate: '2026-06-22', etHour: 23, etMinute: 0 },
  // Matchday 3
  { round: 'Group Stage', group: 'J', team1: 'Algeria', team2: 'Austria', teamsKnown: true, etDate: '2026-06-27', etHour: 22, etMinute: 0 },
  { round: 'Group Stage', group: 'J', team1: 'Jordan', team2: 'Argentina', teamsKnown: true, etDate: '2026-06-27', etHour: 22, etMinute: 0 },

  // --- Group K: Portugal, DR Congo, Uzbekistan, Colombia ---
  // Matchday 1
  { round: 'Group Stage', group: 'K', team1: 'Portugal', team2: 'DR Congo', teamsKnown: true, etDate: '2026-06-17', etHour: 13, etMinute: 0 },
  { round: 'Group Stage', group: 'K', team1: 'Uzbekistan', team2: 'Colombia', teamsKnown: true, etDate: '2026-06-17', etHour: 22, etMinute: 0 },
  // Matchday 2
  { round: 'Group Stage', group: 'K', team1: 'Portugal', team2: 'Uzbekistan', teamsKnown: true, etDate: '2026-06-23', etHour: 13, etMinute: 0 },
  { round: 'Group Stage', group: 'K', team1: 'Colombia', team2: 'DR Congo', teamsKnown: true, etDate: '2026-06-23', etHour: 22, etMinute: 0 },
  // Matchday 3
  { round: 'Group Stage', group: 'K', team1: 'Colombia', team2: 'Portugal', teamsKnown: true, etDate: '2026-06-27', etHour: 19, etMinute: 30 },
  { round: 'Group Stage', group: 'K', team1: 'DR Congo', team2: 'Uzbekistan', teamsKnown: true, etDate: '2026-06-27', etHour: 19, etMinute: 30 },

  // --- Group L: England, Croatia, Ghana, Panama ---
  // Matchday 1
  { round: 'Group Stage', group: 'L', team1: 'England', team2: 'Croatia', teamsKnown: true, etDate: '2026-06-17', etHour: 16, etMinute: 0 },
  { round: 'Group Stage', group: 'L', team1: 'Ghana', team2: 'Panama', teamsKnown: true, etDate: '2026-06-17', etHour: 19, etMinute: 0 },
  // Matchday 2
  { round: 'Group Stage', group: 'L', team1: 'England', team2: 'Ghana', teamsKnown: true, etDate: '2026-06-23', etHour: 16, etMinute: 0 },
  { round: 'Group Stage', group: 'L', team1: 'Panama', team2: 'Croatia', teamsKnown: true, etDate: '2026-06-23', etHour: 19, etMinute: 0 },
  // Matchday 3
  { round: 'Group Stage', group: 'L', team1: 'Panama', team2: 'England', teamsKnown: true, etDate: '2026-06-27', etHour: 17, etMinute: 0 },
  { round: 'Group Stage', group: 'L', team1: 'Croatia', team2: 'Ghana', teamsKnown: true, etDate: '2026-06-27', etHour: 17, etMinute: 0 },
];

// ========== KNOCKOUT STAGE (32 matches) ==========
// Match numbers 73-104 are official FIFA match numbers
// Source: NBC Sports, verified against Sky Sports

const knockout: MatchDef[] = [
  // --- Round of 32 (16 matches) ---
  { round: 'Round of 32', group: null, team1: '2nd Group A', team2: '2nd Group B', teamsKnown: false, etDate: '2026-06-28', etHour: 15, etMinute: 0 },
  { round: 'Round of 32', group: null, team1: '1st Group E', team2: 'Best 3rd Place', teamsKnown: false, etDate: '2026-06-29', etHour: 16, etMinute: 30 },
  { round: 'Round of 32', group: null, team1: '1st Group F', team2: '2nd Group C', teamsKnown: false, etDate: '2026-06-29', etHour: 21, etMinute: 0 },
  { round: 'Round of 32', group: null, team1: '1st Group C', team2: '2nd Group F', teamsKnown: false, etDate: '2026-06-29', etHour: 13, etMinute: 0 },
  { round: 'Round of 32', group: null, team1: '1st Group I', team2: 'Best 3rd Place', teamsKnown: false, etDate: '2026-06-30', etHour: 17, etMinute: 0 },
  { round: 'Round of 32', group: null, team1: '2nd Group E', team2: '2nd Group I', teamsKnown: false, etDate: '2026-06-30', etHour: 13, etMinute: 0 },
  { round: 'Round of 32', group: null, team1: '1st Group A', team2: 'Best 3rd Place', teamsKnown: false, etDate: '2026-06-30', etHour: 21, etMinute: 0 },
  { round: 'Round of 32', group: null, team1: '1st Group L', team2: 'Best 3rd Place', teamsKnown: false, etDate: '2026-07-01', etHour: 12, etMinute: 0 },
  { round: 'Round of 32', group: null, team1: '1st Group D', team2: 'Best 3rd Place', teamsKnown: false, etDate: '2026-07-01', etHour: 20, etMinute: 0 },
  { round: 'Round of 32', group: null, team1: '1st Group G', team2: 'Best 3rd Place', teamsKnown: false, etDate: '2026-07-01', etHour: 16, etMinute: 0 },
  { round: 'Round of 32', group: null, team1: '2nd Group K', team2: '2nd Group L', teamsKnown: false, etDate: '2026-07-02', etHour: 19, etMinute: 0 },
  { round: 'Round of 32', group: null, team1: '1st Group H', team2: '2nd Group J', teamsKnown: false, etDate: '2026-07-02', etHour: 15, etMinute: 0 },
  { round: 'Round of 32', group: null, team1: '1st Group B', team2: 'Best 3rd Place', teamsKnown: false, etDate: '2026-07-02', etHour: 23, etMinute: 0 },
  { round: 'Round of 32', group: null, team1: '1st Group J', team2: '2nd Group H', teamsKnown: false, etDate: '2026-07-03', etHour: 18, etMinute: 0 },
  { round: 'Round of 32', group: null, team1: '1st Group K', team2: 'Best 3rd Place', teamsKnown: false, etDate: '2026-07-03', etHour: 21, etMinute: 30 },
  { round: 'Round of 32', group: null, team1: '2nd Group D', team2: '2nd Group G', teamsKnown: false, etDate: '2026-07-03', etHour: 14, etMinute: 0 },

  // --- Round of 16 (8 matches) ---
  { round: 'Round of 16', group: null, team1: 'W Match 74', team2: 'W Match 77', teamsKnown: false, etDate: '2026-07-04', etHour: 17, etMinute: 0 },
  { round: 'Round of 16', group: null, team1: 'W Match 73', team2: 'W Match 75', teamsKnown: false, etDate: '2026-07-04', etHour: 13, etMinute: 0 },
  { round: 'Round of 16', group: null, team1: 'W Match 76', team2: 'W Match 78', teamsKnown: false, etDate: '2026-07-05', etHour: 16, etMinute: 0 },
  { round: 'Round of 16', group: null, team1: 'W Match 79', team2: 'W Match 80', teamsKnown: false, etDate: '2026-07-05', etHour: 20, etMinute: 0 },
  { round: 'Round of 16', group: null, team1: 'W Match 83', team2: 'W Match 84', teamsKnown: false, etDate: '2026-07-06', etHour: 15, etMinute: 0 },
  { round: 'Round of 16', group: null, team1: 'W Match 81', team2: 'W Match 82', teamsKnown: false, etDate: '2026-07-06', etHour: 20, etMinute: 0 },
  { round: 'Round of 16', group: null, team1: 'W Match 86', team2: 'W Match 88', teamsKnown: false, etDate: '2026-07-07', etHour: 12, etMinute: 0 },
  { round: 'Round of 16', group: null, team1: 'W Match 85', team2: 'W Match 87', teamsKnown: false, etDate: '2026-07-07', etHour: 16, etMinute: 0 },

  // --- Quarter-finals (4 matches) ---
  { round: 'Quarter-final', group: null, team1: 'W Match 89', team2: 'W Match 90', teamsKnown: false, etDate: '2026-07-09', etHour: 16, etMinute: 0 },
  { round: 'Quarter-final', group: null, team1: 'W Match 93', team2: 'W Match 94', teamsKnown: false, etDate: '2026-07-10', etHour: 15, etMinute: 0 },
  { round: 'Quarter-final', group: null, team1: 'W Match 91', team2: 'W Match 92', teamsKnown: false, etDate: '2026-07-11', etHour: 17, etMinute: 0 },
  { round: 'Quarter-final', group: null, team1: 'W Match 95', team2: 'W Match 96', teamsKnown: false, etDate: '2026-07-11', etHour: 21, etMinute: 0 },

  // --- Semi-finals (2 matches) ---
  { round: 'Semi-final', group: null, team1: 'W Match 97', team2: 'W Match 98', teamsKnown: false, etDate: '2026-07-14', etHour: 15, etMinute: 0 },
  { round: 'Semi-final', group: null, team1: 'W Match 99', team2: 'W Match 100', teamsKnown: false, etDate: '2026-07-15', etHour: 15, etMinute: 0 },

  // --- Third Place (1 match) ---
  { round: 'Third Place', group: null, team1: 'L Match 101', team2: 'L Match 102', teamsKnown: false, etDate: '2026-07-18', etHour: 17, etMinute: 0 },

  // --- Final (1 match) ---
  { round: 'Final', group: null, team1: 'W Match 101', team2: 'W Match 102', teamsKnown: false, etDate: '2026-07-19', etHour: 15, etMinute: 0 },
];

// Sort group stage chronologically, then assign match numbers 1-72
groupStage.sort((a, b) => {
  const dateA = new Date(`${a.etDate}T${String(a.etHour).padStart(2, '0')}:${String(a.etMinute).padStart(2, '0')}:00`);
  const dateB = new Date(`${b.etDate}T${String(b.etHour).padStart(2, '0')}:${String(b.etMinute).padStart(2, '0')}:00`);
  if (dateA.getTime() !== dateB.getTime()) return dateA.getTime() - dateB.getTime();
  // Same time: sort by group letter
  return (a.group || '').localeCompare(b.group || '');
});

// Combine: group stage (1-72) + knockout (73-104)
const allMatches = [...groupStage, ...knockout];

// Verify counts
if (groupStage.length !== 72) throw new Error(`Expected 72 group stage matches, got ${groupStage.length}`);
if (knockout.length !== 32) throw new Error(`Expected 32 knockout matches, got ${knockout.length}`);
if (allMatches.length !== 104) throw new Error(`Expected 104 total matches, got ${allMatches.length}`);

// Generate SQL
const lines: string[] = [];
lines.push('-- ============================================================');
lines.push('-- 2026 FIFA World Cup -- Official Schedule Seed Data (104 matches)');
lines.push('-- Source: NBC Sports (US broadcast rights holder), cross-referenced');
lines.push('-- with Sky Sports UK times and FIFA.com fixtures');
lines.push('-- Run AFTER phase3-migration.sql in Supabase SQL Editor');
lines.push('-- ============================================================');
lines.push('');
lines.push('-- 1. Delete existing predictions and matches (keeps participants)');
lines.push('DELETE FROM predictions;');
lines.push('DELETE FROM matches;');
lines.push('');
lines.push('-- 2. Insert all 104 matches');
lines.push('INSERT INTO matches (id, match_number, round, group_name, team1_source, team2_source, team1_actual, team2_actual, match_date, prediction_deadline, status, manual_locked, team1_score, team2_score, winner, method)');
lines.push('VALUES');

const valueLines: string[] = [];

allMatches.forEach((m, i) => {
  const matchNumber = i + 1;
  const uuid = crypto.randomUUID();
  const matchDateUTC = toUTC(m.etDate, m.etHour, m.etMinute);
  const deadlineUTC = deadline(m.etDate);
  const status = m.teamsKnown ? 'open' : 'teams_pending';
  const groupVal = m.group ? `'${m.group}'` : 'NULL';
  const team1Actual = m.teamsKnown ? `'${m.team1}'` : 'NULL';
  const team2Actual = m.teamsKnown ? `'${m.team2}'` : 'NULL';

  valueLines.push(
    `  ('${uuid}', ${matchNumber}, '${m.round}', ${groupVal}, '${m.team1}', '${m.team2}', ${team1Actual}, ${team2Actual}, '${matchDateUTC}', '${deadlineUTC}', '${status}', FALSE, NULL, NULL, NULL, NULL)`
  );
});

lines.push(valueLines.join(',\n') + ';');

// Write file
const outPath = join(import.meta.dir, '..', 'supabase', 'official_schedule_seed.sql');
writeFileSync(outPath, lines.join('\n') + '\n');

// Print summary
console.log(`\n=== Official Schedule Seed Generated ===`);
console.log(`Output: ${outPath}`);
console.log(`Total matches: ${allMatches.length}`);
console.log(`Group Stage: ${groupStage.length}`);
console.log(`Knockout: ${knockout.length}`);

// Verify groups
const groups = new Map<string, number>();
groupStage.forEach(m => {
  groups.set(m.group!, (groups.get(m.group!) || 0) + 1);
});
console.log('\nMatches per group:');
for (const [g, count] of [...groups.entries()].sort()) {
  console.log(`  Group ${g}: ${count} matches`);
}

// Verify round counts
const rounds = new Map<string, number>();
allMatches.forEach(m => {
  rounds.set(m.round, (rounds.get(m.round) || 0) + 1);
});
console.log('\nMatches per round:');
for (const [r, count] of rounds.entries()) {
  console.log(`  ${r}: ${count}`);
}

// Show first and last 5 matches
console.log('\nFirst 10 matches:');
allMatches.slice(0, 10).forEach((m, i) => {
  console.log(`  #${i + 1}: ${m.etDate} ${String(m.etHour).padStart(2, '0')}:${String(m.etMinute).padStart(2, '0')} ET - ${m.team1} vs ${m.team2} (${m.group ? `Group ${m.group}` : m.round})`);
});

console.log('\nLast 10 matches:');
allMatches.slice(-10).forEach((m, i) => {
  const num = allMatches.length - 10 + i + 1;
  console.log(`  #${num}: ${m.etDate} ${String(m.etHour).padStart(2, '0')}:${String(m.etMinute).padStart(2, '0')} ET - ${m.team1} vs ${m.team2} (${m.group ? `Group ${m.group}` : m.round})`);
});

// Verify specific known fixtures
console.log('\nKey fixture verification:');
const m1 = allMatches[0];
console.log(`  Opening: #1 ${m1.team1} vs ${m1.team2}, ${m1.etDate} ${m1.etHour}:00 ET ${m1.etHour === 15 ? '✓' : '✗'}`);
const m104 = allMatches[103];
console.log(`  Final: #104 ${m104.team1} vs ${m104.team2}, ${m104.etDate} ${m104.etHour}:00 ET ${m104.etDate === '2026-07-19' && m104.etHour === 15 ? '✓' : '✗'}`);

// Find USA matches
console.log('\nUSA matches:');
allMatches.forEach((m, i) => {
  if (m.team1 === 'USA' || m.team2 === 'USA') {
    console.log(`  #${i + 1}: ${m.etDate} ${String(m.etHour).padStart(2, '0')}:${String(m.etMinute).padStart(2, '0')} ET - ${m.team1} vs ${m.team2}`);
  }
});

console.log('\nDone!');
