'use client';

import React from 'react';
import { Bot, X, Loader2, Send, Sparkles } from 'lucide-react';

interface AiStudioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Array<{ role: 'user' | 'assistant'; text: string }>;
  promptInput: string;
  setPromptInput: (p: string) => void;
  isLoading: boolean;
  onSendMessage: (e: React.FormEvent) => void;
}

export function AiStudioDrawer({
  isOpen,
  onClose,
  messages,
  promptInput,
  setPromptInput,
  isLoading,
  onSendMessage,
}: AiStudioDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-88 bg-[#090d16] border-l border-white/[0.08] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-xs text-white block">Gemini Agent Assistant</span>
            <span className="text-[10px] text-slate-400 font-mono">Agent-First Reasoning</span>
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 text-xs">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-2xl leading-relaxed ${
              msg.role === 'user'
                ? 'bg-gradient-to-r from-indigo-500 to-sky-500 text-white ml-6 shadow-sm'
                : 'bg-[#0e131f] text-slate-200 mr-4 border border-white/[0.08]'
            }`}
          >
            {msg.text}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
            <span>Gemini agent synthesizing layout...</span>
          </div>
        )}
      </div>

      <form onSubmit={onSendMessage} className="p-3 border-t border-white/[0.08] flex gap-2 bg-[#07090e]">
        <input
          type="text"
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          placeholder="Ask Gemini to rearrange or add components..."
          className="flex-1 px-3.5 py-2 bg-[#0e131f] border border-white/10 rounded-full text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
        />
        <button
          type="submit"
          disabled={isLoading || !promptInput.trim()}
          className="p-2 bg-white text-slate-950 rounded-full hover:bg-slate-200 disabled:opacity-40 transition shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
