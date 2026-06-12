import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Save, RefreshCw, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  adminGetMatches,
  adminUpdateMatch,
  adminRecalculate,
  verifySession,
  getCurrentParticipant,
} from '@/lib/storage';
import { calculateLeaderboard } from '@/lib/leaderboard';
import { getMatchStatus } from '@/lib/scoring';
import { Match, MatchMethod, MatchRound, LeaderboardEntry } from '@/lib/types';
import { cn } from '@/lib/utils';
import { isGroupStage } from '@/lib/rounds';

type MatchFormState = {
  team1Actual: string;
  team2Actual: string;
  matchDate: string;
  predictionDeadline: string;
  manualLocked: boolean;
  team1Score: string;
  team2Score: string;
  winner: string;
  method: MatchMethod;
  status: Match['status'];
};

function validateResult(form: MatchFormState, round: string): string | null {
  if (form.status !== 'completed') return null;
  if (form.team1Score === '' || form.team2Score === '') return 'Enter both scores before marking as completed.';

  const s1 = Number(form.team1Score);
  const s2 = Number(form.team2Score);

  if (!Number.isInteger(s1) || !Number.isInteger(s2)) return 'Scores must be whole numbers.';
  if (s1 < 0 || s2 < 0) return 'Scores cannot be negative.';

  const tied = s1 === s2;
  const t1 = form.team1Actual.trim();
  const t2 = form.team2Actual.trim();

  if (isGroupStage(round)) {
    // Group stage: draws allowed, method must be regulation
    if (form.method !== 'regulation') {
      return 'Group stage matches must be decided in regulation time (Full Time).';
    }
    if (tied && form.winner && form.winner !== 'Draw') {
      return 'Tied scores in the group stage must have winner set to "Draw".';
    }
    if (!tied && form.winner === 'Draw') {
      return 'Non-tied scores cannot be a Draw.';
    }
    if (form.winner && form.winner !== 'Draw' && t1 && t2 && form.winner !== t1 && form.winner !== t2) {
      return `Winner must be "${t1}", "${t2}", or "Draw".`;
    }
    if (!tied && form.winner && t1 && t2 && form.winner !== 'Draw') {
      const expected = s1 > s2 ? t1 : t2;
      if (form.winner !== expected) {
        return `With this score, winner must be "${expected}" (higher score).`;
      }
    }
  } else {
    // Knockout: no draws allowed
    if (form.winner === 'Draw') {
      return 'Knockout matches must have a winner. Draws are not allowed.';
    }
    if (form.winner && t1 && t2 && form.winner !== t1 && form.winner !== t2) {
      return `Winner must be "${t1}" or "${t2}".`;
    }
    if (tied && form.method !== 'penalties') {
      return 'Tied scores must be decided by penalties.';
    }
    if (!tied && form.method === 'penalties') {
      return 'Penalties only applies when scores are tied.';
    }
    if (!tied && form.winner && t1 && t2) {
      const expected = s1 > s2 ? t1 : t2;
      if (form.winner !== expected) {
        return `With this score, winner must be "${expected}" (higher score).`;
      }
    }
  }

  return null;
}

function toLocalDatetimeValue(isoString: string): string {
  try {
    const d = new Date(isoString);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

function matchToFormState(match: Match): MatchFormState {
  return {
    team1Actual: match.team1Actual ?? '',
    team2Actual: match.team2Actual ?? '',
    matchDate: toLocalDatetimeValue(match.matchDate),
    predictionDeadline: toLocalDatetimeValue(match.predictionDeadline),
    manualLocked: match.manualLocked,
    team1Score: match.team1Score !== undefined ? String(match.team1Score) : '',
    team2Score: match.team2Score !== undefined ? String(match.team2Score) : '',
    winner: match.winner ?? '',
    method: match.method ?? 'regulation',
    status: match.status,
  };
}

function MatchRow({ match, onSaved }: { match: Match; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MatchFormState>(matchToFormState(match));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [scoringMessage, setScoringMessage] = useState<string | null>(null);

  const liveStatus = getMatchStatus(match, new Date());

  function updateForm(partial: Partial<MatchFormState>) {
    setForm((prev) => ({ ...prev, ...partial }));
    setValidationError(null);
  }

  async function handleSave() {
    const error = validateResult(form, match.round);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    setSaving(true);

    const updated: Match = {
      ...match,
      team1Actual: form.team1Actual.trim() || undefined,
      team2Actual: form.team2Actual.trim() || undefined,
      matchDate: form.matchDate ? new Date(form.matchDate).toISOString() : match.matchDate,
      predictionDeadline: form.predictionDeadline ? new Date(form.predictionDeadline).toISOString() : match.predictionDeadline,
      manualLocked: form.manualLocked,
      team1Score: form.team1Score !== '' ? Number(form.team1Score) : undefined,
      team2Score: form.team2Score !== '' ? Number(form.team2Score) : undefined,
      winner: form.winner.trim() || undefined,
      method: form.method,
      status: form.status,
    };

    try {
      const result = await adminUpdateMatch(updated.id, updated) as Match & { scoringResult?: { scored: number; errors: number } | null };
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);

      if (result.scoringResult) {
        const { scored, errors } = result.scoringResult;
        if (errors > 0) {
          setScoringMessage(`Scored ${scored} predictions (${errors} errors)`);
        } else if (scored > 0) {
          setScoringMessage(`Scored ${scored} predictions successfully`);
        } else {
          setScoringMessage('No predictions found to score');
        }
        setTimeout(() => setScoringMessage(null), 5000);
      } else if (form.status === 'completed') {
        setScoringMessage('Result saved. Ensure all fields are filled to trigger scoring.');
        setTimeout(() => setScoringMessage(null), 5000);
      }

      onSaved();
    } catch {
      setValidationError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const team1Display = match.team1Actual ?? match.team1Source;
  const team2Display = match.team2Actual ?? match.team2Source;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Row header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-field transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-body text-xs text-muted-foreground flex-shrink-0">
            M{match.matchNumber}
          </span>
          <span className="font-body text-xs text-muted-foreground flex-shrink-0">
            {match.groupName ? `Group ${match.groupName}` : match.round}
          </span>
          <span className="font-body text-sm text-foreground truncate">
            {team1Display} vs {team2Display}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={cn('text-xs font-body px-2 py-0.5 rounded-full',
            liveStatus === 'open' ? 'bg-emerald-500/20 text-emerald-400' :
            liveStatus === 'teams_pending' ? 'bg-amber-500/20 text-amber-400' :
            liveStatus === 'locked' ? 'bg-orange-500/20 text-orange-400' :
            'bg-blue-500/20 text-blue-400'
          )}>
            {liveStatus}
          </span>
          {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded form */}
      {open && (
        <div className="bg-field border-t border-border p-4 space-y-4">
          {/* Team names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="font-body text-xs text-muted-foreground">
                Team 1 (actual) <span className="text-muted-foreground/60">source: {match.team1Source}</span>
              </Label>
              <Input
                value={form.team1Actual}
                onChange={(e) => updateForm({ team1Actual: e.target.value })}
                placeholder={match.team1Source}
                className="bg-card border-stripe text-foreground text-sm font-body"
              />
            </div>
            <div className="space-y-1">
              <Label className="font-body text-xs text-muted-foreground">
                Team 2 (actual) <span className="text-muted-foreground/60">source: {match.team2Source}</span>
              </Label>
              <Input
                value={form.team2Actual}
                onChange={(e) => updateForm({ team2Actual: e.target.value })}
                placeholder={match.team2Source}
                className="bg-card border-stripe text-foreground text-sm font-body"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="font-body text-xs text-muted-foreground">Match Date/Time</Label>
              <Input
                type="datetime-local"
                value={form.matchDate}
                onChange={(e) => updateForm({ matchDate: e.target.value })}
                className="bg-card border-stripe text-foreground text-sm font-body"
              />
            </div>
            <div className="space-y-1">
              <Label className="font-body text-xs text-muted-foreground">Prediction Deadline</Label>
              <Input
                type="datetime-local"
                value={form.predictionDeadline}
                onChange={(e) => updateForm({ predictionDeadline: e.target.value })}
                className="bg-card border-stripe text-foreground text-sm font-body"
              />
            </div>
          </div>

          {/* Status + lock */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="font-body text-xs text-muted-foreground">Status</Label>
              <select
                value={form.status}
                onChange={(e) => updateForm({ status: e.target.value as Match['status'] })}
                className="w-full bg-card border border-stripe text-foreground text-sm font-body rounded-md px-3 py-2"
              >
                <option value="teams_pending">teams_pending</option>
                <option value="open">open</option>
                <option value="locked">locked</option>
                <option value="completed">completed</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="font-body text-xs text-muted-foreground">Manual Lock</Label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id={`lock-${match.id}`}
                  checked={form.manualLocked}
                  onChange={(e) => updateForm({ manualLocked: e.target.checked })}
                  className="w-4 h-4 accent-primary"
                />
                <label htmlFor={`lock-${match.id}`} className="font-body text-sm text-foreground">
                  Locked
                </label>
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="border-t border-stripe pt-4">
            <p className="font-body text-xs text-muted-foreground uppercase tracking-wide mb-3">Match Result</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="font-body text-xs text-muted-foreground">
                  {form.team1Actual || match.team1Source} Score
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={form.team1Score}
                  onChange={(e) => updateForm({ team1Score: e.target.value })}
                  placeholder="0"
                  className="bg-card border-stripe text-foreground text-sm font-body"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-body text-xs text-muted-foreground">
                  {form.team2Actual || match.team2Source} Score
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={form.team2Score}
                  onChange={(e) => updateForm({ team2Score: e.target.value })}
                  placeholder="0"
                  className="bg-card border-stripe text-foreground text-sm font-body"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-body text-xs text-muted-foreground">Winner</Label>
                <select
                  value={form.winner}
                  onChange={(e) => updateForm({ winner: e.target.value })}
                  className="w-full bg-card border border-stripe text-foreground text-sm font-body rounded-md px-3 py-2"
                >
                  <option value="">Select winner</option>
                  {(form.team1Actual || match.team1Source) && (
                    <option value={form.team1Actual || match.team1Source}>{form.team1Actual || match.team1Source}</option>
                  )}
                  {(form.team2Actual || match.team2Source) && (
                    <option value={form.team2Actual || match.team2Source}>{form.team2Actual || match.team2Source}</option>
                  )}
                  {isGroupStage(match.round) && (
                    <option value="Draw">Draw</option>
                  )}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="font-body text-xs text-muted-foreground">Method</Label>
                <select
                  value={isGroupStage(match.round) ? 'regulation' : form.method}
                  onChange={(e) => updateForm({ method: e.target.value as MatchMethod })}
                  disabled={isGroupStage(match.round)}
                  className={cn(
                    'w-full bg-card border border-stripe text-foreground text-sm font-body rounded-md px-3 py-2',
                    isGroupStage(match.round) && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  <option value="regulation">Full Time</option>
                  {!isGroupStage(match.round) && (
                    <>
                      <option value="extra_time">Extra Time</option>
                      <option value="penalties">Penalties</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          {validationError && (
            <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
              <span className="text-destructive text-xs font-body mt-0.5">⚠</span>
              <p className="text-destructive text-xs font-body">{validationError}</p>
            </div>
          )}

          {scoringMessage && (
            <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-md px-3 py-2">
              <p className="text-emerald-400 text-xs font-body">{scoringMessage}</p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                'font-body font-semibold',
                saved ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-primary hover:bg-primary/90 text-white'
              )}
            >
              <Save size={14} className="mr-2" />
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [recalcStatus, setRecalcStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [recalcMessage, setRecalcMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  async function loadData() {
    try {
      const [m, lb] = await Promise.all([adminGetMatches(), calculateLeaderboard()]);
      setMatches(m);
      setLeaderboard(lb);
    } catch {
      // silent
    }
  }

  useEffect(() => {
    async function init() {
      // Quick check from cache first
      const cached = getCurrentParticipant();
      if (!cached) {
        setLoading(false);
        return;
      }
      const session = await verifySession();
      if (!session || !session.isAdmin) {
        setLoading(false);
        return;
      }
      setIsAdmin(true);
      await loadData();
      setLoading(false);
    }
    init();
  }, []);

  async function recalculateScores() {
    setRecalcStatus('running');
    setRecalcMessage(null);
    try {
      const result = await adminRecalculate() as { recalculated: number; predictionsScored: number; errors: number };
      await loadData();
      setRecalcStatus('done');
      setRecalcMessage(`${result.recalculated} matches, ${result.predictionsScored} predictions scored${result.errors > 0 ? `, ${result.errors} errors` : ''}`);
      setTimeout(() => { setRecalcStatus('idle'); setRecalcMessage(null); }, 5000);
    } catch {
      setRecalcStatus('idle');
      setRecalcMessage('Recalculation failed. Check backend connection.');
      setTimeout(() => setRecalcMessage(null), 5000);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-pitch flex items-center justify-center">
        <p className="font-body text-muted-foreground">Checking access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-pitch flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 border border-destructive/30 mb-6">
            <Lock size={28} className="text-destructive" />
          </div>
          <h1 className="font-heading text-4xl text-foreground mb-3">NOT AUTHORIZED</h1>
          <p className="font-body text-sm text-muted-foreground mb-6">
            You need admin access to view this page.
          </p>
          <Button asChild variant="outline" className="border-stripe text-foreground hover:bg-field font-body">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const rounds: MatchRound[] = ['Group Stage', 'Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Third Place', 'Final'];

  return (
    <div className="min-h-screen bg-pitch px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-heading text-4xl text-foreground">ADMIN PANEL</h1>
            <p className="font-body text-xs text-muted-foreground mt-0.5">
              Manage matches, enter results, and recalculate scores
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-8 flex-wrap">
          <Button
            onClick={recalculateScores}
            disabled={recalcStatus === 'running'}
            variant="outline"
            className={cn(
              'border-stripe font-body',
              recalcStatus === 'done' ? 'border-emerald-500 text-emerald-400' : 'text-foreground hover:bg-field'
            )}
          >
            <RefreshCw size={14} className={cn('mr-2', recalcStatus === 'running' && 'animate-spin')} />
            {recalcStatus === 'running' ? 'Recalculating...' : recalcStatus === 'done' ? 'Scores Recalculated!' : 'Recalculate All Scores'}
          </Button>
          {recalcMessage && (
            <span className={cn('font-body text-xs self-center', recalcStatus === 'done' ? 'text-emerald-400' : 'text-destructive')}>
              {recalcMessage}
            </span>
          )}
        </div>

        {/* Matches by round */}
        {rounds.map((round) => {
          const roundMatches = matches.filter((m) => m.round === round);
          if (roundMatches.length === 0) return null;

          // Group Stage: sub-group by groupName
          if (isGroupStage(round)) {
            const groupNames = Array.from(new Set(roundMatches.map((m) => m.groupName ?? '').filter(Boolean))).sort();
            const ungrouped = roundMatches.filter((m) => !m.groupName);

            return (
              <div key={round} className="mb-8">
                <h2 className="font-heading text-xl text-foreground mb-3 uppercase">{round}</h2>
                {groupNames.map((groupName) => {
                  const groupMatches = roundMatches
                    .filter((m) => m.groupName === groupName)
                    .sort((a, b) => a.matchNumber - b.matchNumber);
                  return (
                    <div key={groupName} className="mb-4">
                      <h3 className="font-heading text-base text-muted-foreground mb-2 ml-1">Group {groupName}</h3>
                      <div className="space-y-2">
                        {groupMatches.map((match) => (
                          <MatchRow key={match.id} match={match} onSaved={loadData} />
                        ))}
                      </div>
                    </div>
                  );
                })}
                {ungrouped.length > 0 && (
                  <div className="space-y-2">
                    {ungrouped.sort((a, b) => a.matchNumber - b.matchNumber).map((match) => (
                      <MatchRow key={match.id} match={match} onSaved={loadData} />
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={round} className="mb-8">
              <h2 className="font-heading text-xl text-foreground mb-3 uppercase">{round}</h2>
              <div className="space-y-2">
                {roundMatches.map((match) => (
                  <MatchRow key={match.id} match={match} onSaved={loadData} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Mini leaderboard */}
        <div className="mt-10 border-t border-border pt-8">
          <h2 className="font-heading text-2xl text-foreground mb-4">CURRENT LEADERBOARD</h2>
          {leaderboard.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground">No predictions yet.</p>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {leaderboard.map((entry, i) => (
                <div
                  key={entry.participantId}
                  className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0"
                >
                  <span className="font-heading text-lg text-muted-foreground w-6 text-center">{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-body text-sm text-foreground">{entry.displayName}</p>
                    <p className="font-body text-xs text-muted-foreground">{entry.predictionsCount} predictions</p>
                  </div>
                  <span className="font-heading text-xl text-gold">{entry.totalPoints} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
