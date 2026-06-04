import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ChevronRight, Lock, CheckCircle2, Eye } from 'lucide-react';
import { Match, Prediction } from '@/lib/types';
import { getMatchStatus } from '@/lib/scoring';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MatchCardProps {
  match: Match;
  prediction?: Prediction;
  currentParticipantId?: string;
  onPredict?: (matchId: string) => void;
}

function formatMatchDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York',
      timeZoneName: 'short',
    }).format(d);
  } catch {
    return isoDate;
  }
}

function formatDeadlineCountdown(deadlineIso: string): string {
  const now = new Date();
  const deadline = new Date(deadlineIso);
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs <= 0) return 'Deadline passed';

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const remainHours = diffHours % 24;

  if (diffDays > 30) return 'Deadline open';
  if (diffDays > 0) return `${diffDays}d ${remainHours}h left`;
  if (diffHours > 0) return `${diffHours}h left`;

  const diffMins = Math.floor(diffMs / (1000 * 60));
  return `${diffMins}m left`;
}

interface ActionButtonProps {
  status: Match['status'];
  hasPrediction: boolean;
  onClick: () => void;
}

function ActionButton({ status, hasPrediction, onClick }: ActionButtonProps) {
  if (status === 'teams_pending') {
    return (
      <Button variant="ghost" size="sm" disabled className="text-muted-foreground font-body">
        Teams TBD
      </Button>
    );
  }

  if (status === 'completed') {
    return (
      <Button variant="ghost" size="sm" onClick={onClick} className="text-blue-400 hover:text-blue-300 font-body">
        <Eye size={14} className="mr-1" />
        View
      </Button>
    );
  }

  if (status === 'locked') {
    if (hasPrediction) {
      return (
        <Button variant="ghost" size="sm" onClick={onClick} className="text-muted-foreground hover:text-foreground font-body">
          <Eye size={14} className="mr-1" />
          View
        </Button>
      );
    }
    return (
      <Button variant="ghost" size="sm" disabled className="text-muted-foreground font-body">
        <Lock size={14} className="mr-1" />
        Missed
      </Button>
    );
  }

  // open
  if (hasPrediction) {
    return (
      <Button variant="outline" size="sm" onClick={onClick} className="border-primary text-primary hover:bg-primary/10 font-body">
        Edit
        <ChevronRight size={14} className="ml-1" />
      </Button>
    );
  }

  return (
    <Button size="sm" onClick={onClick} className="bg-primary hover:bg-primary/90 text-white font-body">
      Predict
      <ChevronRight size={14} className="ml-1" />
    </Button>
  );
}

export function MatchCard({ match, prediction, currentParticipantId, onPredict }: MatchCardProps) {
  const navigate = useNavigate();
  const status = getMatchStatus(match, new Date());
  const hasPrediction = !!prediction;

  const handleAction = () => {
    if (onPredict) {
      onPredict(match.id);
    } else {
      navigate(`/predictions/${match.id}`);
    }
  };

  const team1Name = match.team1Actual ?? match.team1Source;
  const team2Name = match.team2Actual ?? match.team2Source;
  const team1IsReal = !!match.team1Actual;
  const team2IsReal = !!match.team2Actual;

  return (
    <div
      id={`match-card-${match.id}`}
      className={cn(
        'group bg-card border border-border rounded-lg p-4 transition-all duration-200',
        status === 'open' && 'hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 cursor-pointer',
        status === 'completed' && 'hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer'
      )}
      onClick={status === 'open' || status === 'completed' || (status === 'locked' && hasPrediction) ? handleAction : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-body font-medium text-muted-foreground">
            Match {match.matchNumber}
          </span>
          <span className="text-muted-foreground text-xs">·</span>
          <span className="text-xs font-body font-medium text-muted-foreground">
            {match.groupName ? `Group ${match.groupName}` : match.round}
          </span>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex-1 text-center">
          <p
            className={cn(
              'font-heading text-xl sm:text-2xl leading-tight',
              team1IsReal ? 'text-foreground' : 'text-muted-foreground italic'
            )}
          >
            {team1Name}
          </p>
          {!team1IsReal && (
            <p className="text-xs text-muted-foreground mt-0.5 font-body">(TBD)</p>
          )}
        </div>

        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          {status === 'completed' && match.team1Score !== undefined && match.team2Score !== undefined ? (
            <div className="flex items-center gap-2 bg-field border border-stripe rounded-lg px-3 py-1">
              <span className="font-heading text-2xl text-gold">{match.team1Score}</span>
              <span className="text-muted-foreground font-heading text-lg">—</span>
              <span className="font-heading text-2xl text-gold">{match.team2Score}</span>
            </div>
          ) : (
            <div className="text-muted-foreground font-heading text-xl px-2">VS</div>
          )}
          {status === 'completed' && (match.method || match.winner === 'Draw') && (
            <span className="text-xs text-muted-foreground font-body">
              {match.winner === 'Draw'
                ? 'Draw'
                : match.method === 'extra_time' ? 'Extra Time' : match.method === 'penalties' ? 'Penalties' : 'Full Time'}
            </span>
          )}
        </div>

        <div className="flex-1 text-center">
          <p
            className={cn(
              'font-heading text-xl sm:text-2xl leading-tight',
              team2IsReal ? 'text-foreground' : 'text-muted-foreground italic'
            )}
          >
            {team2Name}
          </p>
          {!team2IsReal && (
            <p className="text-xs text-muted-foreground mt-0.5 font-body">(TBD)</p>
          )}
        </div>
      </div>

      {/* Date + Prediction info */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
            <Calendar size={12} />
            <span>{formatMatchDate(match.matchDate)}</span>
          </div>
          {status === 'open' && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-body">
              <Clock size={12} />
              <span>{formatDeadlineCountdown(match.predictionDeadline)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {hasPrediction && prediction && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-primary" />
              <span className="text-xs font-body text-muted-foreground">
                {prediction.team1ScorePredicted}–{prediction.team2ScorePredicted}
              </span>
              {status === 'completed' && prediction.pointsAwarded !== undefined && (
                <span className={cn(
                  'text-xs font-body font-semibold px-1.5 py-0.5 rounded',
                  prediction.pointsAwarded > 0
                    ? 'text-gold bg-gold/10'
                    : 'text-muted-foreground bg-muted/50'
                )}>
                  {prediction.pointsAwarded > 0 ? `+${prediction.pointsAwarded} pts` : '0 pts'}
                </span>
              )}
            </div>
          )}
          {currentParticipantId && (
            <div onClick={(e) => e.stopPropagation()}>
              <ActionButton
                status={status}
                hasPrediction={hasPrediction}
                onClick={handleAction}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
