import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MatchCard } from '@/components/match/MatchCard';
import { getMatches, getCurrentParticipant, getMyPredictions } from '@/lib/storage';
import { getMatchStatus } from '@/lib/scoring';
import { Match, Prediction, Participant, MatchStatus } from '@/lib/types';
import { isGroupStage } from '@/lib/rounds';

interface GroupedMatches {
  open: Match[];
  teams_pending: Match[];
  locked: Match[];
  completed: Match[];
}

function SectionHeader({ title, count, color }: { title: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <h2 className="font-heading text-2xl text-foreground">{title}</h2>
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-body font-semibold ${color}`}>
        {count}
      </span>
    </div>
  );
}

function JoinBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 flex items-start gap-3 bg-primary/10 border border-primary/30 rounded-lg p-4"
    >
      <AlertCircle size={18} className="text-primary mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="font-body text-sm text-foreground font-medium">Join to make predictions</p>
        <p className="font-body text-xs text-muted-foreground mt-0.5">
          Create your free predictor profile to submit score predictions and compete on the leaderboard.
        </p>
      </div>
      <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-white font-body flex-shrink-0">
        <Link to="/join">
          Join
          <ChevronRight size={14} className="ml-1" />
        </Link>
      </Button>
    </motion.div>
  );
}

export default function Predictions() {
  const navigate = useNavigate();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [predMap, setPredMap] = useState<Map<string, Prediction>>(new Map());
  const [now, setNow] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const p = getCurrentParticipant();
      setParticipant(p);
      try {
        const [matches, preds] = await Promise.all([
          getMatches(),
          p ? getMyPredictions() : Promise.resolve([]),
        ]);
        setAllMatches(matches);
        const map = new Map<string, Prediction>();
        preds.forEach((pred) => map.set(pred.matchId, pred));
        setPredMap(map);
      } catch {
        // show empty state
      }
      setLoading(false);
    }
    load();
  }, []);

  // Refresh `now` every 60s so statuses re-evaluate automatically
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-pitch flex items-center justify-center">
        <p className="font-body text-muted-foreground">Loading matches...</p>
      </div>
    );
  }

  // Derive grouped matches from current time (recomputed on every tick)
  const grouped: GroupedMatches = { open: [], teams_pending: [], locked: [], completed: [] };
  allMatches.forEach((m) => {
    const status: MatchStatus = getMatchStatus(m, now);
    grouped[status].push(m);
  });

  const handlePredict = (matchId: string) => {
    navigate(`/predictions/${matchId}`);
  };

  const sections: { key: MatchStatus; title: string; badgeColor: string }[] = [
    { key: 'open', title: 'OPEN FOR PREDICTIONS', badgeColor: 'bg-emerald-500/20 text-emerald-400' },
    { key: 'teams_pending', title: 'TEAMS TO BE CONFIRMED', badgeColor: 'bg-amber-500/20 text-amber-400' },
    { key: 'locked', title: 'LOCKED', badgeColor: 'bg-orange-500/20 text-orange-400' },
    { key: 'completed', title: 'COMPLETED', badgeColor: 'bg-blue-500/20 text-blue-400' },
  ];

  return (
    <div className="min-h-screen bg-pitch px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-8">
            <h1 className="font-heading text-5xl text-foreground mb-2">PREDICTIONS</h1>
            <p className="font-body text-sm text-muted-foreground">
              Submit your score predictions before each match deadline
            </p>
          </div>

          {!participant && <JoinBanner />}

          <div className="space-y-10">
            {sections.map(({ key, title, badgeColor }) => {
              const sectionMatches = grouped[key];
              if (sectionMatches.length === 0) return null;

              // Group matches by round
              const roundOrder = ['Group Stage', 'Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Third Place', 'Final'];
              const byRound = new Map<string, Match[]>();
              sectionMatches.forEach((m) => {
                const list = byRound.get(m.round) ?? [];
                list.push(m);
                byRound.set(m.round, list);
              });

              return (
                <section key={key}>
                  <SectionHeader title={title} count={sectionMatches.length} color={badgeColor} />
                  <div className="space-y-5">
                    {roundOrder.map((round) => {
                      const roundMatches = byRound.get(round);
                      if (!roundMatches || roundMatches.length === 0) return null;

                      // Group Stage: further sub-group by groupName
                      if (isGroupStage(round)) {
                        const groupNames = Array.from(new Set(roundMatches.map((m) => m.groupName ?? '').filter(Boolean))).sort();
                        const ungrouped = roundMatches.filter((m) => !m.groupName).sort((a, b) => a.matchNumber - b.matchNumber);

                        return (
                          <div key={round}>
                            <h3 className="font-heading text-lg text-muted-foreground mb-2 uppercase">{round}</h3>
                            {groupNames.map((groupName) => {
                              const groupMatches = roundMatches
                                .filter((m) => m.groupName === groupName)
                                .sort((a, b) => a.matchNumber - b.matchNumber);
                              return (
                                <div key={groupName} className="mb-4">
                                  <h4 className="font-heading text-sm text-muted-foreground mb-2 ml-1">Group {groupName}</h4>
                                  <div className="space-y-3">
                                    {groupMatches.map((match) => (
                                      <MatchCard
                                        key={match.id}
                                        match={match}
                                        prediction={predMap.get(match.id)}
                                        currentParticipantId={participant?.id}
                                        onPredict={handlePredict}
                                      />
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                            {ungrouped.length > 0 && (
                              <div className="space-y-3">
                                {ungrouped.map((match) => (
                                  <MatchCard
                                    key={match.id}
                                    match={match}
                                    prediction={predMap.get(match.id)}
                                    currentParticipantId={participant?.id}
                                    onPredict={handlePredict}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Knockout rounds
                      return (
                        <div key={round}>
                          <h3 className="font-heading text-lg text-muted-foreground mb-2 uppercase">{round}</h3>
                          <div className="space-y-3">
                            {roundMatches.sort((a, b) => a.matchNumber - b.matchNumber).map((match) => (
                              <MatchCard
                                key={match.id}
                                match={match}
                                prediction={predMap.get(match.id)}
                                currentParticipantId={participant?.id}
                                onPredict={handlePredict}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
