import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Clock, AlertTriangle } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/match/StatusBadge';
import { getMatches, getCurrentParticipant, getMyPredictions, savePrediction } from '@/lib/storage';
import { ApiError } from '@/lib/api';
import { getMatchStatus } from '@/lib/scoring';
import { Match, Prediction, MatchMethod } from '@/lib/types';
import { cn } from '@/lib/utils';
import { isGroupStage } from '@/lib/rounds';

const predictionSchema = z.object({
  team1Score: z.coerce.number().int().min(0, 'Score must be 0 or more'),
  team2Score: z.coerce.number().int().min(0, 'Score must be 0 or more'),
  winner: z.string().min(1, 'Please select a winner or Draw'),
  method: z.enum(['regulation', 'extra_time', 'penalties'] as const),
});

type PredictionFormValues = z.infer<typeof predictionSchema>;

function formatMatchDate(isoDate: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York',
      timeZoneName: 'short',
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}

function DeadlineCountdown({ deadline }: { deadline: string }) {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const diff = new Date(deadline).getTime() - now.getTime();

  if (diff <= 0) return <span className="text-destructive">Deadline passed</span>;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 30) return <span className="text-emerald-400">Deadline open</span>;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);

  return (
    <span className="text-amber-400">
      <Clock size={12} className="inline mr-1" />
      {parts.join(' ')} left
    </span>
  );
}

interface BlockedMessageProps {
  reason: 'locked' | 'completed' | 'teams_pending' | 'no_participant';
  match?: Match;
}

function BlockedMessage({ reason, match }: BlockedMessageProps) {
  const messages: Record<string, { icon: React.ReactNode; title: string; body: string }> = {
    locked: {
      icon: <Lock size={20} className="text-orange-400" />,
      title: 'Predictions Locked',
      body: 'The deadline for this match has passed. No more predictions can be submitted.',
    },
    completed: {
      icon: <Lock size={20} className="text-blue-400" />,
      title: 'Match Completed',
      body: match?.winner
        ? `Result: ${match.team1Actual ?? match.team1Source} ${match.team1Score}–${match.team2Score} ${match.team2Actual ?? match.team2Source}. Winner: ${match.winner}.`
        : 'This match has already been played.',
    },
    teams_pending: {
      icon: <AlertTriangle size={20} className="text-amber-400" />,
      title: 'Teams Not Yet Confirmed',
      body: 'The teams for this match have not been confirmed yet. Predictions open once both teams are known.',
    },
    no_participant: {
      icon: <AlertTriangle size={20} className="text-primary" />,
      title: 'Join to Predict',
      body: 'You need to join the league before making predictions.',
    },
  };

  const config = messages[reason];

  return (
    <div className="bg-card border border-border rounded-lg p-6 text-center">
      <div className="flex justify-center mb-3">{config.icon}</div>
      <h3 className="font-heading text-xl text-foreground mb-2">{config.title}</h3>
      <p className="font-body text-sm text-muted-foreground mb-4">{config.body}</p>
      {reason === 'no_participant' && (
        <Button asChild className="bg-primary hover:bg-primary/90 text-white font-body">
          <Link to="/join">Join the League</Link>
        </Button>
      )}
    </div>
  );
}

export default function PredictionForm() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [existingPrediction, setExistingPrediction] = useState<Prediction | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [participantLoaded, setParticipantLoaded] = useState(false);

  const form = useForm<PredictionFormValues>({
    resolver: zodResolver(predictionSchema),
    defaultValues: {
      team1Score: 0,
      team2Score: 0,
      winner: '',
      method: 'regulation',
    },
  });

  useEffect(() => {
    async function load() {
      const p = getCurrentParticipant();
      setParticipantId(p?.id ?? null);
      setParticipantLoaded(true);

      if (!matchId) return;

      try {
        const allMatches = await getMatches();
        const found = allMatches.find((m) => m.id === matchId) ?? null;
        setMatch(found);

        if (found && p) {
          const preds = await getMyPredictions();
          const pred = preds.find((pr) => pr.matchId === matchId) ?? null;
          setExistingPrediction(pred);
          if (pred) {
            form.reset({
              team1Score: pred.team1ScorePredicted,
              team2Score: pred.team2ScorePredicted,
              winner: pred.winnerPredicted,
              method: pred.methodPredicted,
            });
          }
        }
      } catch {
        // show loading state
      }
    }
    load();
  }, [matchId, form]);

  // Watch score values to suggest winner auto-update
  const team1Score = form.watch('team1Score');
  const team2Score = form.watch('team2Score');

  const groupStage = match ? isGroupStage(match.round) : false;

  // Auto-selection logic based on scores and round type
  useEffect(() => {
    if (!match) return;
    const s1 = Number(team1Score);
    const s2 = Number(team2Score);
    const tied = s1 === s2;
    const t1 = match.team1Actual ?? match.team1Source ?? 'Team 1';
    const t2 = match.team2Actual ?? match.team2Source ?? 'Team 2';

    if (isGroupStage(match.round)) {
      // Group stage: auto-set everything
      if (tied) {
        form.setValue('winner', 'Draw');
        form.setValue('method', 'regulation');
      } else {
        form.setValue('winner', s1 > s2 ? t1 : t2);
        form.setValue('method', 'regulation');
      }
    } else {
      // Knockout: only auto-set method when tied
      if (tied) {
        form.setValue('method', 'penalties');
      }
    }
  }, [team1Score, team2Score, match, form]);

  const status = match ? getMatchStatus(match, new Date()) : null;
  const team1Name = match?.team1Actual ?? match?.team1Source ?? 'Team 1';
  const team2Name = match?.team2Actual ?? match?.team2Source ?? 'Team 2';

  async function onSubmit(values: PredictionFormValues) {
    if (!match || !participantId) return;

    const tied = values.team1Score === values.team2Score;
    const t1 = match.team1Actual ?? match.team1Source ?? 'Team 1';
    const t2 = match.team2Actual ?? match.team2Source ?? 'Team 2';

    // Force method to regulation for group stage
    const finalMethod = isGroupStage(match.round) ? 'regulation' as MatchMethod : values.method;

    // Cross-field validation
    if (isGroupStage(match.round)) {
      if (finalMethod !== 'regulation') {
        form.setError('root', { message: 'Group stage matches are always decided in regulation time.' });
        return;
      }
      if (tied && values.winner !== 'Draw') {
        form.setError('root', { message: 'Tied scores in the group stage must be a Draw.' });
        return;
      }
      if (!tied && values.winner === 'Draw') {
        form.setError('root', { message: 'Non-tied scores cannot be a Draw.' });
        return;
      }
    } else {
      // Knockout validation
      if (values.winner === 'Draw') {
        form.setError('root', { message: 'Knockout matches must have a winner. Draws are not allowed.' });
        return;
      }
      if (tied && values.method !== 'penalties') {
        form.setError('root', { message: 'Tied scores in knockout matches must be decided by penalties.' });
        return;
      }
      if (!tied && values.method === 'penalties') {
        form.setError('root', { message: 'Penalties only applies when scores are tied.' });
        return;
      }
      if (!tied) {
        const expected = values.team1Score > values.team2Score ? t1 : t2;
        if (values.winner !== expected) {
          form.setError('root', { message: `With this score, the winner must be "${expected}".` });
          return;
        }
      }
    }

    try {
      await savePrediction(
        {
          matchId: match.id,
          team1ScorePredicted: values.team1Score,
          team2ScorePredicted: values.team2Score,
          winnerPredicted: values.winner,
          methodPredicted: finalMethod,
        },
        existingPrediction?.id
      );
      navigate('/predictions', { state: { justPredictedMatchId: match.id } });
    } catch (err) {
      if (err instanceof ApiError) {
        form.setError('root', { message: err.message });
      }
    }
  }

  if (!participantLoaded || !match) {
    return (
      <div className="min-h-screen bg-pitch flex items-center justify-center">
        <p className="font-body text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const isBlocked = status === 'locked' || status === 'completed' || status === 'teams_pending';

  return (
    <div className="min-h-screen bg-pitch px-4 py-8">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/predictions')}
            className="mb-6 text-muted-foreground hover:text-foreground font-body -ml-2"
          >
            <ArrowLeft size={16} className="mr-1" />
            All Matches
          </Button>

          {/* Match header */}
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-body text-muted-foreground">
                Match {match.matchNumber} · {match.groupName ? `Group ${match.groupName}` : match.round}
              </span>
              {status && <StatusBadge status={status} />}
            </div>

            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex-1 text-center">
                <p className={cn('font-heading text-2xl sm:text-3xl', match.team1Actual ? 'text-foreground' : 'text-muted-foreground italic')}>
                  {team1Name}
                </p>
              </div>
              <div className="flex-shrink-0">
                {status === 'completed' && match.team1Score !== undefined ? (
                  <div className="flex items-center gap-2 bg-field border border-stripe rounded-lg px-3 py-1.5">
                    <span className="font-heading text-2xl text-gold">{match.team1Score}</span>
                    <span className="font-heading text-xl text-muted-foreground">—</span>
                    <span className="font-heading text-2xl text-gold">{match.team2Score}</span>
                  </div>
                ) : (
                  <span className="font-heading text-xl text-muted-foreground px-2">VS</span>
                )}
              </div>
              <div className="flex-1 text-center">
                <p className={cn('font-heading text-2xl sm:text-3xl', match.team2Actual ? 'text-foreground' : 'text-muted-foreground italic')}>
                  {team2Name}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-body text-muted-foreground">
              <span>{formatMatchDate(match.matchDate)}</span>
              {status === 'open' && (
                <DeadlineCountdown deadline={match.predictionDeadline} />
              )}
            </div>
          </div>

          {/* Blocked messages */}
          {!participantId && <BlockedMessage reason="no_participant" />}
          {participantId && status === 'teams_pending' && <BlockedMessage reason="teams_pending" match={match} />}
          {participantId && status === 'locked' && <BlockedMessage reason="locked" match={match} />}
          {participantId && status === 'completed' && <BlockedMessage reason="completed" match={match} />}

          {/* Form — only shown when open */}
          {participantId && status === 'open' && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-heading text-2xl text-foreground mb-5">
                {existingPrediction ? 'EDIT YOUR PREDICTION' : 'YOUR PREDICTION'}
              </h2>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Score inputs */}
                  <div>
                    <p className="font-body text-sm font-medium text-foreground mb-3">Predicted Score</p>
                    <div className="flex items-center gap-4">
                      <FormField
                        control={form.control}
                        name="team1Score"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="font-body text-xs text-muted-foreground text-center block truncate">
                              {team1Name}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                className="text-center text-2xl font-heading bg-field border-stripe text-foreground focus:border-primary h-14"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="font-body text-xs text-center" />
                          </FormItem>
                        )}
                      />

                      <span className="font-heading text-2xl text-muted-foreground pt-4 flex-shrink-0">—</span>

                      <FormField
                        control={form.control}
                        name="team2Score"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="font-body text-xs text-muted-foreground text-center block truncate">
                              {team2Name}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                className="text-center text-2xl font-heading bg-field border-stripe text-foreground focus:border-primary h-14"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="font-body text-xs text-center" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Winner */}
                  <FormField
                    control={form.control}
                    name="winner"
                    render={({ field }) => {
                      const winnerOptions = groupStage
                        ? [team1Name, 'Draw', team2Name]
                        : [team1Name, team2Name];

                      return (
                        <FormItem>
                          <FormLabel className="font-body text-sm font-medium text-foreground">
                            {groupStage ? 'Winner / Draw' : 'Winner'}
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className={cn('grid gap-3 pt-1', groupStage ? 'grid-cols-3' : 'grid-cols-2')}
                            >
                              {winnerOptions.map((option) => {
                                const isSelected = field.value === option;
                                const score1 = Number(team1Score);
                                const score2 = Number(team2Score);
                                const tied = score1 === score2;
                                const isSuggested =
                                  option === 'Draw'
                                    ? tied
                                    : !tied &&
                                      ((option === team1Name && score1 > score2) ||
                                        (option === team2Name && score2 > score1));

                                return (
                                  <label
                                    key={option}
                                    className={cn(
                                      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                                      isSelected
                                        ? 'border-primary bg-primary/10'
                                        : 'border-stripe bg-field hover:border-primary/50'
                                    )}
                                  >
                                    <RadioGroupItem value={option} id={`winner-${option}`} className="text-primary" />
                                    <div>
                                      <p className={cn('font-body text-sm font-medium', isSelected ? 'text-foreground' : 'text-muted-foreground')}>
                                        {option}
                                      </p>
                                      {isSuggested && !isSelected && (
                                        <p className="text-xs text-amber-400 font-body">Suggested</p>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage className="font-body text-xs" />
                        </FormItem>
                      );
                    }}
                  />

                  {/* Method — hidden for group stage (always regulation) */}
                  {!groupStage && (
                    <FormField
                      control={form.control}
                      name="method"
                      render={({ field }) => {
                        const score1 = Number(team1Score);
                        const score2 = Number(team2Score);
                        const tied = score1 === score2;

                        const methods: { value: MatchMethod; label: string; description: string; disabled?: boolean }[] = [
                          {
                            value: 'regulation',
                            label: 'Full Time',
                            description: '90 minutes',
                            disabled: tied,
                          },
                          {
                            value: 'extra_time',
                            label: 'Extra Time',
                            description: '120 minutes',
                            disabled: tied,
                          },
                          {
                            value: 'penalties',
                            label: 'Penalties',
                            description: 'After AET',
                            disabled: !tied,
                          },
                        ];

                        return (
                          <FormItem>
                            <FormLabel className="font-body text-sm font-medium text-foreground">Decided By</FormLabel>
                            <FormControl>
                              <RadioGroup
                                value={field.value}
                                onValueChange={field.onChange}
                                className="grid grid-cols-3 gap-2 pt-1"
                              >
                                {methods.map((m) => {
                                  const isSelected = field.value === m.value;
                                  return (
                                    <label
                                      key={m.value}
                                      className={cn(
                                        'flex flex-col items-center gap-1 p-3 rounded-lg border cursor-pointer transition-all text-center',
                                        m.disabled && 'opacity-40 cursor-not-allowed',
                                        !m.disabled && isSelected && 'border-primary bg-primary/10',
                                        !m.disabled && !isSelected && 'border-stripe bg-field hover:border-primary/50'
                                      )}
                                    >
                                      <RadioGroupItem
                                        value={m.value}
                                        id={`method-${m.value}`}
                                        disabled={m.disabled}
                                        className="text-primary"
                                      />
                                      <p className={cn('font-body text-xs font-medium', isSelected && !m.disabled ? 'text-foreground' : 'text-muted-foreground')}>
                                        {m.label}
                                      </p>
                                      <p className="font-body text-xs text-muted-foreground">{m.description}</p>
                                    </label>
                                  );
                                })}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage className="font-body text-xs" />
                          </FormItem>
                        );
                      }}
                    />
                  )}

                  {/* Submit */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 border-stripe text-muted-foreground hover:text-foreground font-body"
                      onClick={() => navigate('/predictions')}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-primary hover:bg-primary/90 text-white font-body font-semibold"
                      disabled={form.formState.isSubmitting}
                    >
                      {existingPrediction ? 'Update Prediction' : 'Submit Prediction'}
                    </Button>
                  </div>

                  {/* Scoring hint */}
                  <div className="bg-field border border-stripe rounded-lg p-3">
                    <p className="font-body text-xs text-muted-foreground leading-relaxed">
                      <span className="text-gold font-semibold">Scoring: </span>
                      Correct winner/outcome = 3pts · Exact score = +3pts · Correct goal difference = +1pt · Correct method = +1pt
                    </p>
                  </div>

                  {form.formState.errors.root && (
                    <p className="font-body text-xs text-destructive">
                      {form.formState.errors.root.message}
                    </p>
                  )}
                </form>
              </Form>
            </div>
          )}

          {/* Show existing prediction when locked/completed */}
          {participantId && (status === 'locked' || status === 'completed') && existingPrediction && (
            <div className="mt-4 bg-card border border-border rounded-xl p-5">
              <h3 className="font-heading text-xl text-foreground mb-4">YOUR PREDICTION</h3>
              <div className="flex items-center justify-center gap-6 mb-4">
                <div className="text-center">
                  <p className="font-body text-xs text-muted-foreground mb-1">{team1Name}</p>
                  <p className="font-heading text-4xl text-foreground">{existingPrediction.team1ScorePredicted}</p>
                </div>
                <span className="font-heading text-2xl text-muted-foreground">—</span>
                <div className="text-center">
                  <p className="font-body text-xs text-muted-foreground mb-1">{team2Name}</p>
                  <p className="font-heading text-4xl text-foreground">{existingPrediction.team2ScorePredicted}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 text-sm font-body text-muted-foreground">
                <span>
                  {existingPrediction.winnerPredicted === 'Draw'
                    ? <span className="text-foreground font-medium">Draw</span>
                    : <>Winner: <span className="text-foreground font-medium">{existingPrediction.winnerPredicted}</span></>
                  }
                </span>
                <span>·</span>
                <span>
                  {existingPrediction.methodPredicted === 'extra_time' ? 'Extra Time' : existingPrediction.methodPredicted === 'penalties' ? 'Penalties' : 'Full Time'}
                </span>
              </div>
              {status === 'completed' && existingPrediction.pointsAwarded !== undefined && (
                <div className="mt-4 text-center">
                  <span className={cn(
                    'inline-flex items-center px-4 py-2 rounded-full font-heading text-2xl',
                    existingPrediction.pointsAwarded > 0 ? 'text-gold bg-gold/10' : 'text-muted-foreground bg-muted/30'
                  )}>
                    {existingPrediction.pointsAwarded > 0 ? `+${existingPrediction.pointsAwarded}` : '0'} POINTS
                  </span>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-border text-center">
          <p className="font-body text-xs text-muted-foreground">
            <Link to="/admin" className="hover:text-foreground transition-colors underline underline-offset-2">Admin</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
