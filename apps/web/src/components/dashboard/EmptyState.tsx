import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white rounded-2xl border border-dashed border-[#E5E7EB]">
      <div className="w-12 h-12 rounded-2xl bg-[#F4F4F5] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] mb-4">
        <Icon className="w-6 h-6" strokeWidth={1.5} />
      </div>
      <h3 className="text-sm font-semibold text-[#111827] mb-1">{title}</h3>
      <p className="text-xs text-[#6B7280] max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[#2F6BFF] hover:bg-[#1F55E0] text-white shadow-xs transition-all active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
