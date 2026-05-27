# Barefoot FC World Cup Match Predictor

A mobile-first web app for predicting World Cup knockout stage match scores.

## Phase 1 — Complete

### Pages
| Route | Description |
|-------|-------------|
| `/` | Home — hero, next deadlines preview, mini leaderboard |
| `/join` | Registration — display name, email, optional fields |
| `/predictions` | All matches grouped by status |
| `/predictions/:matchId` | Prediction form for a single match |
| `/leaderboard` | Full public leaderboard |
| `/rules` | Scoring rules and examples |
| `/admin` | Admin panel — edit matches, enter results, recalculate scores |

### Data Storage
- **localStorage** (Phase 1 MVP) — all participants, matches, and predictions stored in browser
- Keys: `barefoot_participants`, `barefoot_matches`, `barefoot_predictions`, `barefoot_current_participant`
- Seeded with 8 sample matches on first load via `initializeMockData()`

### Core Logic Files
- `src/lib/types.ts` — all shared TypeScript types
- `src/lib/scoring.ts` — `getMatchStatus()` and `calculateMatchPredictionScore()`
- `src/lib/storage.ts` — localStorage abstraction (swap for Supabase in Phase 2)
- `src/lib/mockData.ts` — seed data (8 matches, 3 demo participants)
- `src/lib/leaderboard.ts` — leaderboard aggregation and sorting

### Scoring Rules
- Correct winner: 3 pts
- Exact scoreline: +3 pts
- Correct goal difference: +1 pt
- Correct method (regulation/extra time/penalties): +1 pt
- Goal difference and method bonuses only apply if winner is correct
- Max per match: 8 points

### Design
- Fonts: Bebas Neue (headings) + DM Sans (body)
- Colors: deep green `#0a0f0d`, forest green `#1a7a3c`, gold `#d4a017`
- Mobile-first, dark theme, sporty aesthetic

## Phase 2 — Next Steps
- Replace localStorage with Supabase (tables already mirror the data models)
- Add Supabase Auth (email magic link or Google OAuth)
- Real deadline timezone enforcement server-side
- Admin authentication
- Email notifications when deadlines approach
