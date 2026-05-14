import React from 'react';
import { cn } from '../lib/utils';

export type TransactionStatus = 
  | 'pending'
  | 'funded'
  | 'ai_verifying'
  | 'released'
  | 'refunded'
  | 'expired'
  | 'needs_review';

interface StatusBadgeProps {
  status: TransactionStatus;
  className?: string;
}

const statusStyles: Record<TransactionStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Pending' },
  funded: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Funded' },
  ai_verifying: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Verifying' },
  released: { bg: 'bg-green-100', text: 'text-green-700', label: 'Released' },
  refunded: { bg: 'bg-red-100', text: 'text-red-700', label: 'Refunded' },
  expired: { bg: 'bg-red-100', text: 'text-red-700', label: 'Expired' },
  needs_review: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Needs Review' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.pending;
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        style.bg,
        style.text,
        className
      )}
    >
      {style.label}
    </span>
  );
}
