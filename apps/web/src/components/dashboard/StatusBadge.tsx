import React from 'react';

interface StatusBadgeProps {
  status: 'online' | 'offline' | string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const isOnline = status.toLowerCase() === 'online';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${
        isOnline
          ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'
          : 'bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]'
      } ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span
        className={`rounded-full shrink-0 ${
          isOnline ? 'w-2 h-2 bg-[#16A34A] animate-pulse' : 'w-2 h-2 bg-[#9CA3AF]'
        }`}
      />
      <span className="capitalize">{isOnline ? 'Online' : 'Offline'}</span>
    </span>
  );
}
