import { cn } from '@/lib/utils';
import { MatchStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: MatchStatus;
  className?: string;
}

const STATUS_CONFIG: Record<MatchStatus, { label: string; classes: string }> = {
  open: {
    label: 'Open',
    classes: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  },
  teams_pending: {
    label: 'Teams TBD',
    classes: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  },
  locked: {
    label: 'Locked',
    classes: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  },
  completed: {
    label: 'Completed',
    classes: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-body',
        config.classes,
        className
      )}
    >
      {config.label}
    </span>
  );
}
