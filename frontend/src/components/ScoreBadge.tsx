import React from 'react';
import { cn } from '../utils/cn';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  size = 'md',
  showLabel = true,
}) => {
  const isStrong = score >= 80;
  const isModerate = score >= 60 && score < 80;

  const colorStyles = isStrong
    ? {
        border: 'border-status-success/30',
        bg: 'bg-status-success/10',
        text: 'text-status-success',
        dot: 'bg-status-success',
        label: 'Strong Match',
      }
    : isModerate
    ? {
        border: 'border-status-warning/30',
        bg: 'bg-status-warning/10',
        text: 'text-status-warning',
        dot: 'bg-status-warning',
        label: 'Moderate Match',
      }
    : {
        border: 'border-status-danger/30',
        bg: 'bg-status-danger/10',
        text: 'text-status-danger',
        dot: 'bg-status-danger',
        label: 'Low Match',
      };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-lg px-3.5 py-1.5',
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'inline-flex items-center gap-1.5 font-mono font-bold rounded-full border',
          colorStyles.border,
          colorStyles.bg,
          colorStyles.text,
          sizeStyles[size]
        )}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', colorStyles.dot)} />
        <span>{Math.round(score)}%</span>
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-primary-secondary hidden sm:inline">
          {colorStyles.label}
        </span>
      )}
    </div>
  );
};
