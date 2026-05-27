import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal } from 'lucide-react';
import { calculateLeaderboard } from '@/lib/leaderboard';
import { getCurrentParticipant } from '@/lib/storage';
import { LeaderboardEntry, Participant } from '@/lib/types';
import { cn } from '@/lib/utils';

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy size={16} className="text-gold" />;
  if (rank === 2) return <Medal size={16} className="text-slate-300" />;
  if (rank === 3) return <Medal size={16} className="text-amber-600" />;
  return <span className="font-heading text-lg text-muted-foreground w-4 text-center">{rank}</span>;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="font-heading text-2xl text-gold">1</span>;
  if (rank === 2) return <span className="font-heading text-2xl text-slate-300">2</span>;
  if (rank === 3) return <span className="font-heading text-2xl text-amber-600">3</span>;
  return <span className="font-heading text-xl text-muted-foreground">{rank}</span>;
}

function rowAccent(rank: number): string {
  if (rank === 1) return 'border-gold/30 bg-gold/5';
  if (rank === 2) return 'border-slate-400/20 bg-slate-400/5';
  if (rank === 3) return 'border-amber-600/20 bg-amber-600/5';
  return 'border-border';
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [participant, setParticipant] = useState<Participant | null>(null);

  useEffect(() => {
    async function load() {
      setParticipant(getCurrentParticipant());
      try {
        const lb = await calculateLeaderboard();
        setEntries(lb);
      } catch {
        // empty state
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-pitch px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-8">
            <h1 className="font-heading text-5xl text-foreground mb-2">LEADERBOARD</h1>
            <p className="font-body text-sm text-muted-foreground">
              Overall standings · Updated after each completed match
            </p>
          </div>

          {entries.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Trophy size={40} className="text-muted-foreground mx-auto mb-4" />
              <p className="font-heading text-2xl text-foreground mb-2">NO PREDICTIONS YET</p>
              <p className="font-body text-sm text-muted-foreground">
                The leaderboard will populate once predictions are submitted.
              </p>
            </div>
          ) : (
            <>
              {/* Top 3 podium cards on larger screens */}
              <div className="hidden sm:grid sm:grid-cols-3 gap-4 mb-8">
                {entries.slice(0, 3).map((entry, i) => {
                  const rank = i + 1;
                  const isCurrent = entry.participantId === participant?.id;
                  return (
                    <div
                      key={entry.participantId}
                      className={cn(
                        'bg-card border rounded-xl p-5 text-center',
                        rowAccent(rank),
                        isCurrent && 'ring-2 ring-primary/50',
                        rank === 1 && 'sm:order-2',
                        rank === 2 && 'sm:order-1',
                        rank === 3 && 'sm:order-3'
                      )}
                    >
                      <div className="flex justify-center mb-2">
                        <RankBadge rank={rank} />
                      </div>
                      <p className="font-body font-semibold text-sm text-foreground truncate mb-1">
                        {entry.displayName}
                        {isCurrent && <span className="ml-1 text-xs text-primary">(you)</span>}
                      </p>
                      <p className="font-heading text-4xl text-gold mb-1">{entry.totalPoints}</p>
                      <p className="font-body text-xs text-muted-foreground">points</p>
                      <div className="mt-3 grid grid-cols-2 gap-1 text-xs font-body text-muted-foreground">
                        <div className="bg-field rounded p-1">
                          <p className="text-foreground font-medium">{entry.correctWinners}</p>
                          <p>Winners</p>
                        </div>
                        <div className="bg-field rounded p-1">
                          <p className="text-foreground font-medium">{entry.exactScores}</p>
                          <p>Exact</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Full table */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[2rem_1fr_3rem_3rem_3rem_3rem_3rem] gap-2 px-4 py-3 border-b border-border bg-field">
                  <div className="font-body text-xs text-muted-foreground">#</div>
                  <div className="font-body text-xs text-muted-foreground">Player</div>
                  <div className="font-body text-xs text-muted-foreground text-right">Pts</div>
                  <div className="font-body text-xs text-muted-foreground text-right hidden sm:block">Win</div>
                  <div className="font-body text-xs text-muted-foreground text-right hidden sm:block">Exact</div>
                  <div className="font-body text-xs text-muted-foreground text-right hidden md:block">GD</div>
                  <div className="font-body text-xs text-muted-foreground text-right hidden md:block">Mthd</div>
                </div>

                {/* Table rows */}
                {entries.map((entry, i) => {
                  const rank = i + 1;
                  const isCurrent = entry.participantId === participant?.id;

                  return (
                    <div
                      key={entry.participantId}
                      className={cn(
                        'grid grid-cols-[2rem_1fr_3rem_3rem_3rem_3rem_3rem] gap-2 px-4 py-3 border-b border-border last:border-0 items-center transition-colors',
                        isCurrent ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-field/50',
                        rank <= 3 && !isCurrent && rowAccent(rank)
                      )}
                    >
                      <div className="flex items-center justify-center">
                        <RankIcon rank={rank} />
                      </div>
                      <div>
                        <p className={cn('font-body text-sm font-medium', isCurrent ? 'text-primary' : 'text-foreground')}>
                          {entry.displayName}
                          {isCurrent && <span className="ml-1 text-xs font-normal text-muted-foreground">(you)</span>}
                        </p>
                        <p className="font-body text-xs text-muted-foreground">
                          {entry.predictionsCount} prediction{entry.predictionsCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-heading text-xl text-gold">{entry.totalPoints}</span>
                      </div>
                      <div className="text-right hidden sm:block">
                        <span className="font-body text-sm text-foreground">{entry.correctWinners}</span>
                      </div>
                      <div className="text-right hidden sm:block">
                        <span className="font-body text-sm text-foreground">{entry.exactScores}</span>
                      </div>
                      <div className="text-right hidden md:block">
                        <span className="font-body text-sm text-foreground">{entry.goalDifferenceBonuses}</span>
                      </div>
                      <div className="text-right hidden md:block">
                        <span className="font-body text-sm text-foreground">{entry.methodBonuses}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Column legend */}
              <div className="mt-4 flex flex-wrap gap-4 text-xs font-body text-muted-foreground">
                <span><span className="text-foreground font-medium">Pts</span> = Total points</span>
                <span className="hidden sm:inline"><span className="text-foreground font-medium">Win</span> = Correct winners</span>
                <span className="hidden sm:inline"><span className="text-foreground font-medium">Exact</span> = Exact scores</span>
                <span className="hidden md:inline"><span className="text-foreground font-medium">GD</span> = Goal difference bonuses</span>
                <span className="hidden md:inline"><span className="text-foreground font-medium">Mthd</span> = Method bonuses</span>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
