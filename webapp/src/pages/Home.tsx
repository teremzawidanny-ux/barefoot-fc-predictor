import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Target, Users, BookOpen, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MatchCard } from '@/components/match/MatchCard';
import { getMatches, getMyPredictions, getCurrentParticipant } from '@/lib/storage';
import { getMatchStatus } from '@/lib/scoring';
import { calculateLeaderboard } from '@/lib/leaderboard';
import { Match, Prediction, LeaderboardEntry, Participant } from '@/lib/types';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function PitchPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-pitch via-pitch/95 to-pitch" />
      {/* Pitch lines SVG */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.04]"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="pitch-lines" width="120" height="80" patternUnits="userSpaceOnUse">
            <rect width="120" height="80" fill="none" stroke="#ffffff" strokeWidth="0.5" />
            <line x1="60" y1="0" x2="60" y2="80" stroke="#ffffff" strokeWidth="0.5" />
            <circle cx="60" cy="40" r="20" fill="none" stroke="#ffffff" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pitch-lines)" />
      </svg>
      {/* Radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-crimson/8 blur-3xl" />
    </div>
  );
}

interface HeroProps {
  participant: Participant | null;
}

function Hero({ participant }: HeroProps) {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center px-4 overflow-hidden bg-pitch">
      <PitchPattern />
      <motion.div
        className="relative z-10 text-center max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Club crest */}
        <motion.div variants={itemVariants} className="mb-6 flex justify-center">
          <img
            src="/barefoot-fc-logo.jpg"
            alt="Barefoot FC"
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover ring-4 ring-primary shadow-[0_0_60px_rgba(192,57,43,0.4)]"
          />
        </motion.div>

        <motion.div variants={itemVariants} className="mb-4">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-field border border-stripe text-xs font-body font-medium text-gold uppercase tracking-widest">
            World Cup 2026 · Match Predictor
          </span>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="font-heading text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-foreground leading-none mb-4"
        >
          BAREFOOT FC
        </motion.h1>

        <motion.h2
          variants={itemVariants}
          className="font-heading text-2xl sm:text-3xl md:text-4xl text-gold leading-tight mb-6"
        >
          WORLD CUP MATCH PREDICTOR
        </motion.h2>

        <motion.p
          variants={itemVariants}
          className="font-body text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Predict the scores of every knockout match. Earn points for correct winners,
          exact scores, goal differences, and more. Rise to the top of the leaderboard.
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-wrap gap-3 justify-center">
          {participant ? (
            <>
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white font-body px-8">
                <Link to="/predictions">
                  Make Predictions
                  <ChevronRight size={18} className="ml-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-stripe text-foreground hover:bg-field font-body px-8">
                <Link to="/leaderboard">
                  <Trophy size={16} className="mr-2 text-gold" />
                  Leaderboard
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="lg" className="bg-gold hover:bg-gold/90 text-pitch font-body font-semibold px-8">
                <Link to="/join">
                  Join the League
                  <ChevronRight size={18} className="ml-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-stripe text-foreground hover:bg-field font-body px-8">
                <Link to="/predictions">
                  <Target size={16} className="mr-2" />
                  View Matches
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="text-muted-foreground hover:text-foreground font-body px-8">
                <Link to="/leaderboard">
                  <Trophy size={16} className="mr-2 text-gold" />
                  Leaderboard
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="text-muted-foreground hover:text-foreground font-body px-8">
                <Link to="/rules">
                  <BookOpen size={16} className="mr-2" />
                  Rules
                </Link>
              </Button>
            </>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs font-body text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="font-heading text-2xl text-foreground">{value}</p>
      </div>
    </div>
  );
}

interface NextDeadlinesProps {
  matches: Match[];
  predictions: Map<string, Prediction>;
  participant: Participant | null;
}

function NextDeadlines({ matches, predictions, participant }: NextDeadlinesProps) {
  const now = new Date();
  const openMatches = matches
    .filter((m) => getMatchStatus(m, now) === 'open')
    .slice(0, 3);

  if (openMatches.length === 0) return null;

  return (
    <section className="px-4 py-12 max-w-4xl mx-auto">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        <motion.div variants={itemVariants} className="mb-6">
          <h2 className="font-heading text-3xl sm:text-4xl text-foreground">
            OPEN FOR PREDICTIONS
          </h2>
          <p className="font-body text-muted-foreground text-sm mt-1">
            Submit your score predictions before the deadline
          </p>
        </motion.div>

        <div className="space-y-3">
          {openMatches.map((match) => (
            <motion.div key={match.id} variants={itemVariants}>
              <MatchCard
                match={match}
                prediction={predictions.get(match.id)}
                currentParticipantId={participant?.id}
              />
            </motion.div>
          ))}
        </div>

        <motion.div variants={itemVariants} className="mt-4 text-center">
          <Button asChild variant="ghost" className="font-body text-muted-foreground hover:text-foreground">
            <Link to="/predictions">
              View All Matches
              <ChevronRight size={16} className="ml-1" />
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}

interface MiniLeaderboardProps {
  entries: LeaderboardEntry[];
  currentParticipantId?: string;
}

function MiniLeaderboard({ entries, currentParticipantId }: MiniLeaderboardProps) {
  const top5 = entries.slice(0, 5);

  if (top5.length === 0) return null;

  const RANK_STYLES = [
    'text-gold',
    'text-slate-300',
    'text-amber-600',
  ];

  return (
    <section className="px-4 py-12 max-w-4xl mx-auto border-t border-border">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        <motion.div variants={itemVariants} className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-3xl sm:text-4xl text-foreground">TOP PREDICTORS</h2>
            <p className="font-body text-muted-foreground text-sm mt-1">Current standings</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="font-body text-muted-foreground hover:text-foreground">
            <Link to="/leaderboard">
              Full Table
              <ChevronRight size={14} className="ml-1" />
            </Link>
          </Button>
        </motion.div>

        <div className="space-y-2">
          {top5.map((entry, i) => (
            <motion.div
              key={entry.participantId}
              variants={itemVariants}
              className={cn(
                'flex items-center gap-4 p-3 rounded-lg bg-card border transition-colors',
                entry.participantId === currentParticipantId
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border hover:border-stripe'
              )}
            >
              <span className={cn('font-heading text-2xl w-8 text-center', RANK_STYLES[i] ?? 'text-muted-foreground')}>
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="font-body font-medium text-sm text-foreground">{entry.displayName}</p>
                <p className="font-body text-xs text-muted-foreground">
                  {entry.predictionsCount} prediction{entry.predictionsCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-heading text-xl text-gold">{entry.totalPoints}</p>
                <p className="font-body text-xs text-muted-foreground">pts</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

export default function Home() {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictionMap, setPredictionMap] = useState<Map<string, Prediction>>(new Map());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const p = getCurrentParticipant();
      setParticipant(p);
      try {
        const [allMatches, lb] = await Promise.all([getMatches(), calculateLeaderboard()]);
        setMatches(allMatches);
        setLeaderboard(lb);
        if (p) {
          const preds = await getMyPredictions();
          const map = new Map<string, Prediction>();
          preds.forEach((pred) => map.set(pred.matchId, pred));
          setPredictionMap(map);
        }
      } catch {
        // silently fail — show empty state
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-pitch">
      <Hero participant={participant} />

      {loading ? (
        <div className="px-4 py-16 max-w-4xl mx-auto flex items-center justify-center">
          <p className="font-body text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="px-4 py-8 max-w-4xl mx-auto">
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              <motion.div variants={itemVariants}>
                <StatCard icon={<Target size={18} />} label="Matches" value={`${matches.length}`} />
              </motion.div>
              <motion.div variants={itemVariants}>
                <StatCard icon={<Users size={18} />} label="Predictors" value={`${leaderboard.length}`} />
              </motion.div>
              <motion.div variants={itemVariants}>
                <StatCard icon={<Trophy size={18} />} label="Top Score" value={`${leaderboard[0]?.totalPoints ?? 0}`} />
              </motion.div>
              <motion.div variants={itemVariants}>
                <StatCard icon={<BookOpen size={18} />} label="Max Points" value="8" />
              </motion.div>
            </motion.div>
          </div>

          <NextDeadlines
            matches={matches}
            predictions={predictionMap}
            participant={participant}
          />

          <MiniLeaderboard
            entries={leaderboard}
            currentParticipantId={participant?.id}
          />
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8 text-center">
        <p className="font-body text-xs text-muted-foreground">
          Barefoot FC · World Cup 2026 Predictor ·{' '}
          <Link to="/admin" className="hover:text-foreground transition-colors underline underline-offset-2">
            Admin
          </Link>
        </p>
      </footer>
    </div>
  );
}
