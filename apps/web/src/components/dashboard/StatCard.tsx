import React from 'react';
import { ArrowUpRight, LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  onClick?: () => void;
  active?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  onClick,
  active = false,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`group relative bg-white border rounded-2xl p-5 shadow-xs transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-sm' : ''
      } ${
        active
          ? 'border-[#2F6BFF] ring-2 ring-[#2F6BFF]/20'
          : 'border-[#E5E7EB] hover:border-[#D1D5DB]'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#F4F4F5] border border-[#E5E7EB] flex items-center justify-center text-[#2F6BFF] group-hover:scale-105 transition-transform">
          <Icon className="w-5 h-5" strokeWidth={1.8} />
        </div>
        {onClick && (
          <div className="w-7 h-7 rounded-lg text-[#9CA3AF] group-hover:text-[#2F6BFF] flex items-center justify-center transition-colors">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111827] tabular-nums mb-1">
          {value}
        </div>
        <div className="text-xs font-medium text-[#6B7280] flex items-center justify-between">
          <span>{title}</span>
          {badge && (
            <span className="text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full bg-[#EAF0FF] text-[#2F6BFF]">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[11px] text-[#9CA3AF] mt-1.5 line-clamp-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
