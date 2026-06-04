import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ChevronRight, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { MatchCard } from '@/components/match/MatchCard';
import { getMatches, getCurrentParticipant, getMyPredictions } from '@/lib/storage';
import { getMatchStatus } from '@/lib/scoring';
import { Match, Prediction, Participant, MatchStatus } from '@/lib/types';
import { isGroupStage } from '@/lib/rounds';
import { cn } from '@/lib/utils';

type ViewMode = 'upcoming' | 'missing' | 'by-group' | 'all';
type UpcomingRange = 'next5days' | 'all-upcoming';

const VIEW_TABS: { key: ViewMode; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'missing', label: 'My Picks' },
  { key: 'by-group', label: 'By Group' },
  { key: 'all', label: 'All Matches' },
];

const RANGE_OPTIONS: { key: UpcomingRange; label: string }[] = [
  { key: 'next5days', label: 'Next 5 Days' },
  { key: 'all-upcoming', label: 'All Upcoming' },
];

const ROUND_ORDER = [
  'Group Stage',
  'Round of 32',
  'Round of 16',
  'Quarter-final',
  'Semi-final',
  'Third Place',
  'Final',
];

function JoinBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 flex items-start gap-3 bg-primary/10 border border-primary/30 rounded-lg p-4"
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

function SectionHeader({ title, count, color }: { title: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <h2 className="font-heading text-2xl text-foreground">{title}</h2>
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-body font-semibold ${color}`}
      >
        {count}
      </span>
    </div>
  );
}

function groupMatchesByDate(matches: Match[]): { label: string; matches: Match[] }[] {
  const groups = new Map<string, Match[]>();
  const order: string[] = [];

  for (const m of matches) {
    const key = new Date(m.matchDate).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/New_York',
    });
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(m);
  }

  return order.map((label) => ({ label, matches: groups.get(label)! }));
}

export default function Predictions() {
  const navigate = useNavigate();
  const location = useLocation();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [predMap, setPredMap] = useState<Map<string, Prediction>>(new Map());
  const [now, setNow] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('upcoming');
  const [upcomingRange, setUpcomingRange] = useState<UpcomingRange>('next5days');

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

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const filteredMatches = useMemo(() => {
    switch (viewMode) {
      case 'upcoming': {
        const matches = allMatches
          .filter((m) => getMatchStatus(m, now) !== 'completed')
          .sort(
            (a, b) =>
              new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
          );
        if (upcomingRange === 'next5days') {
          const cutoff = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
          return matches.filter(
            (m) => new Date(m.matchDate).getTime() <= cutoff.getTime()
          );
        }
        return matches;
      }
      case 'missing': {
        return allMatches
          .filter((m) => !predMap.has(m.id))
          .sort((a, b) => {
            const sa = getMatchStatus(a, now);
            const sb = getMatchStatus(b, now);
            const priority = (s: MatchStatus) =>
              s === 'open' ? 0 : s === 'teams_pending' ? 1 : s === 'locked' ? 2 : 3;
            const diff = priority(sa) - priority(sb);
            if (diff !== 0) return diff;
            return (
              new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
            );
          });
      }
      case 'all': {
        return [...allMatches].sort(
          (a, b) =>
            new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
        );
      }
      default:
        return [];
    }
  }, [viewMode, upcomingRange, allMatches, predMap, now]);

  const missingOpenCount = useMemo(() => {
    if (!participant) return 0;
    return allMatches.filter(
      (m) => !predMap.has(m.id) && getMatchStatus(m, now) === 'open'
    ).length;
  }, [allMatches, predMap, now, participant]);

  useEffect(() => {
    if (loading) return;
    const navState = location.state as {
      justPredictedMatchId?: string;
    } | null;
    if (!navState?.justPredictedMatchId) return;

    const candidates =
      viewMode === 'by-group'
        ? allMatches
            .filter((m) => getMatchStatus(m, now) === 'open')
            .sort(
              (a, b) =>
                new Date(a.matchDate).getTime() -
                new Date(b.matchDate).getTime()
            )
        : filteredMatches;

    const nextUnpredicted = candidates.find(
      (m) => !predMap.has(m.id) && getMatchStatus(m, now) === 'open'
    );

    if (nextUnpredicted) {
      setTimeout(() => {
        document
          .getElementById(`match-card-${nextUnpredicted.id}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
    } else {
      toast.success("You're all caught up for this view!");
    }

    window.history.replaceState({}, document.title);
  }, [loading, location.state, filteredMatches, predMap, now, viewMode, allMatches]);

  const handlePredict = (matchId: string) => {
    navigate(`/predictions/${matchId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pitch flex items-center justify-center">
        <p className="font-body text-muted-foreground">Loading matches...</p>
      </div>
    );
  }

  const contextLabel = (() => {
    if (viewMode === 'upcoming') {
      return upcomingRange === 'next5days'
        ? `Next 5 days: ${filteredMatches.length} matches`
        : `${filteredMatches.length} upcoming`;
    }
    if (viewMode === 'missing') {
      return `${filteredMatches.length} need predictions`;
    }
    return undefined;
  })();

  const renderByGroup = () => {
    const grouped: Record<MatchStatus, Match[]> = {
      open: [],
      teams_pending: [],
      locked: [],
      completed: [],
    };
    allMatches.forEach((m) => {
      const status = getMatchStatus(m, now);
      grouped[status].push(m);
    });

    const sections: {
      key: MatchStatus;
      title: string;
      badgeColor: string;
    }[] = [
      {
        key: 'open',
        title: 'OPEN FOR PREDICTIONS',
        badgeColor: 'bg-emerald-500/20 text-emerald-400',
      },
      {
        key: 'teams_pending',
        title: 'TEAMS TO BE CONFIRMED',
        badgeColor: 'bg-amber-500/20 text-amber-400',
      },
      {
        key: 'locked',
        title: 'LOCKED',
        badgeColor: 'bg-orange-500/20 text-orange-400',
      },
      {
        key: 'completed',
        title: 'COMPLETED',
        badgeColor: 'bg-blue-500/20 text-blue-400',
      },
    ];

    return (
      <div className="space-y-10">
        {sections.map(({ key, title, badgeColor }) => {
          const sectionMatches = grouped[key];
          if (sectionMatches.length === 0) return null;

          const byRound = new Map<string, Match[]>();
          sectionMatches.forEach((m) => {
            const list = byRound.get(m.round) ?? [];
            list.push(m);
            byRound.set(m.round, list);
          });

          return (
            <section key={key}>
              <SectionHeader
                title={title}
                count={sectionMatches.length}
                color={badgeColor}
              />
              <div className="space-y-5">
                {ROUND_ORDER.map((round) => {
                  const roundMatches = byRound.get(round);
                  if (!roundMatches || roundMatches.length === 0) return null;

                  if (isGroupStage(round)) {
                    const groupNames = Array.from(
                      new Set(
                        roundMatches
                          .map((m) => m.groupName ?? '')
                          .filter(Boolean)
                      )
                    ).sort();
                    const ungrouped = roundMatches
                      .filter((m) => !m.groupName)
                      .sort((a, b) => a.matchNumber - b.matchNumber);

                    return (
                      <div key={round}>
                        <h3 className="font-heading text-lg text-muted-foreground mb-2 uppercase">
                          {round}
                        </h3>
                        {groupNames.map((groupName) => {
                          const groupMatches = roundMatches
                            .filter((m) => m.groupName === groupName)
                            .sort((a, b) => a.matchNumber - b.matchNumber);
                          return (
                            <div key={groupName} className="mb-4">
                              <h4 className="font-heading text-sm text-muted-foreground mb-2 ml-1">
                                Group {groupName}
                              </h4>
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

                  return (
                    <div key={round}>
                      <h3 className="font-heading text-lg text-muted-foreground mb-2 uppercase">
                        {round}
                      </h3>
                      <div className="space-y-3">
                        {roundMatches
                          .sort((a, b) => a.matchNumber - b.matchNumber)
                          .map((match) => (
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
    );
  };

  const renderFlat = () => {
    if (viewMode === 'missing' && !participant) {
      return (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <p className="font-body text-sm text-muted-foreground mb-3">
            Join to track your missing predictions
          </p>
          <Button
            asChild
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white font-body"
          >
            <Link to="/join">Join</Link>
          </Button>
        </div>
      );
    }

    if (filteredMatches.length === 0) {
      const messages: Record<string, string> = {
        upcoming:
          upcomingRange === 'next5days'
            ? 'No matches in the next 5 days'
            : 'No upcoming matches',
        missing: "You're all caught up! No missing predictions.",
        all: 'No matches yet',
      };
      return (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <p className="font-body text-sm text-muted-foreground">
            {messages[viewMode] ?? ''}
          </p>
        </div>
      );
    }

    const dateGroups = groupMatchesByDate(filteredMatches);

    return (
      <div className="space-y-6">
        {dateGroups.map((group) => (
          <div key={group.label}>
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={14} className="text-muted-foreground" />
              <h3 className="font-heading text-sm text-muted-foreground uppercase">
                {group.label}
              </h3>
            </div>
            <div className="space-y-3">
              {group.matches.map((match) => (
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
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-pitch px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-6">
            <h1 className="font-heading text-5xl text-foreground mb-2">
              PREDICTIONS
            </h1>
            <p className="font-body text-sm text-muted-foreground">
              Submit your score predictions before each match deadline
            </p>
          </div>

          {!participant && <JoinBanner />}

          {/* Sticky controls */}
          <div className="sticky top-0 z-20 bg-pitch -mx-4 px-4 pt-3 pb-3 space-y-3">
            {participant ? (
              <div className="flex items-center justify-between text-sm font-body">
                <span className="text-muted-foreground">
                  Predicted{' '}
                  <span className="text-foreground font-semibold">
                    {predMap.size}
                  </span>{' '}
                  of{' '}
                  <span className="text-foreground font-semibold">
                    {allMatches.length}
                  </span>{' '}
                  matches
                </span>
                {contextLabel ? (
                  <span className="text-xs text-muted-foreground">
                    {contextLabel}
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {VIEW_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setViewMode(tab.key)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-body font-medium transition-all min-h-[44px]',
                    viewMode === tab.key
                      ? 'bg-primary text-white'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
                  )}
                >
                  {tab.label}
                  {tab.key === 'missing' &&
                  participant &&
                  missingOpenCount > 0 ? (
                    <span
                      className={cn(
                        'ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs',
                        viewMode === 'missing'
                          ? 'bg-white/20 text-white'
                          : 'bg-primary/10 text-primary'
                      )}
                    >
                      {missingOpenCount}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            {viewMode === 'upcoming' ? (
              <div className="flex gap-2">
                {RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setUpcomingRange(opt.key)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all min-h-[36px]',
                      upcomingRange === opt.key
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'bg-field border border-stripe text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-4">
            {viewMode === 'by-group' ? renderByGroup() : renderFlat()}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
