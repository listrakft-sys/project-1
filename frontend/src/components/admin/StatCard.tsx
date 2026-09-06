'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  trend?: {
    value: string | number;
    isPositive: boolean;
    label?: string;
  };
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  trend,
  className = '',
  onClick,
}) => {
  return (
    <Card
      onClick={onClick}
      className={`p-6 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-primary/50' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          <span
            className={`inline-flex items-center gap-0.5 font-semibold ${
              trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {trend.isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {trend.value}
          </span>
          {trend.label && <span className="text-muted-foreground">{trend.label}</span>}
        </div>
      )}
    </Card>
  );
};

export default StatCard;
