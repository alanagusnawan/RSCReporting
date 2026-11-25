import React, { useState, useEffect, useRef } from 'react';
import { SchemaFieldItem, getFieldSuggestions, validateFieldPath } from './schemaHelper';
import { AlertCircle, Database } from 'lucide-react';

interface DataSourceAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  allFields: SchemaFieldItem[];
  placeholder?: string;
  rows?: number;
  label?: string;
  singleLine?: boolean;
}

export function DataSourceAutocomplete({
  value,
  onChange,
  allFields,
  placeholder,
  rows = 2,
  label,
  singleLine = false,
}: DataSourceAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SchemaFieldItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Validate free text formula against schema (supports +, -, *, /, parenthesis)
  const validation = validateFieldPath(value, allFields);

  const handleInputChange = (val: string, selectionPos: number) => {
    onChange(val);

    // Extract current token right before cursor (e.g. user typing "items.[0]." or "price")
    const textBeforeCursor = val.slice(0, selectionPos);
    const tokenMatch = textBeforeCursor.match(/([a-zA-Z0-9_\.\[\]]+)$/);
    const currentToken = tokenMatch ? tokenMatch[1] : '';

    if (currentToken && (currentToken.includes('.') || currentToken.startsWith('Fields.') || currentToken.length >= 2)) {
      const matched = getFieldSuggestions(currentToken, allFields);
      setSuggestions(matched.slice(0, 8));
      setShowSuggestions(matched.length > 0);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (field: SchemaFieldItem) => {
    const el = inputRef.current;
    if (!el) return;

    const pos = el.selectionStart || value.length;
    const textBeforeCursor = value.slice(0, pos);
    const textAfterCursor = value.slice(pos);

    // Replace the exact token before cursor with selected path
    const replacedBefore = textBeforeCursor.replace(/([a-zA-Z0-9_\.\[\]]+)$/, (m) => {
      if (m.startsWith('Fields.') || m.startsWith('=Fields.')) {
        return m.startsWith('=') ? `=Fields.${field.path}` : `Fields.${field.path}`;
      }
      return field.path;
    });

    const finalVal = replacedBefore + textAfterCursor;
    onChange(finalVal);
    setShowSuggestions(false);

    setTimeout(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(replacedBefore.length, replacedBefore.length);
      }
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative flex flex-col gap-1 text-xs">
      {label && (
        <div className="flex justify-between items-center">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {label}
          </label>
          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
            <Database className="w-2.5 h-2.5 text-indigo-400" />
            {allFields.length} schema fields
          </span>
        </div>
      )}

      <div className="relative">
        {singleLine ? (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={value}
            onChange={(e) => handleInputChange(e.target.value, e.target.selectionStart || 0)}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder || 'Ketik formula teks/ekspresi...'}
            className={`w-full px-2.5 py-1.5 bg-slate-900 border rounded-lg text-slate-100 font-mono text-xs outline-none transition ${
              !validation.valid
                ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500/50 bg-rose-950/20'
                : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50'
            }`}
            spellCheck={false}
          />
        ) : (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            rows={rows}
            value={value}
            onChange={(e) => handleInputChange(e.target.value, e.target.selectionStart || 0)}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder || 'Ketik formula teks/ekspresi, contoh: =Fields.items.[0].price * Fields.items.[0].quantity'}
            className={`w-full p-2.5 bg-slate-900 border rounded-lg text-slate-100 font-mono text-xs leading-relaxed outline-none transition ${
              !validation.valid
                ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500/50 bg-rose-950/20'
                : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50'
            }`}
            spellCheck={false}
          />
        )}

        {/* Suggestion Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-indigo-600 rounded-lg shadow-2xl z-50 overflow-hidden divide-y divide-slate-800/80 max-h-48 overflow-y-auto animate-in fade-in duration-100">
            <div className="px-2.5 py-1 bg-indigo-950/90 text-[10px] text-indigo-300 font-semibold flex justify-between items-center">
              <span>💡 Field Suggestions (Tekan Tab / Enter)</span>
              <span>{suggestions.length} ditemukan</span>
            </div>
            {suggestions.map((item, idx) => (
              <button
                type="button"
                key={item.path}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectSuggestion(item);
                }}
                className={`w-full px-3 py-1.5 flex items-center justify-between text-left text-xs transition ${
                  idx === selectedIndex ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-slate-900 text-slate-200'
                }`}
              >
                <span className="font-mono text-[11px] truncate">{item.path}</span>
                <span className="text-[10px] font-sans opacity-75 bg-slate-800 px-1.5 py-0.5 rounded ml-2 shrink-0">
                  {item.type}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Strict Validation Error Indicator */}
      {!validation.valid && validation.message && (
        <div className="flex items-center gap-1.5 text-[11px] text-rose-400 mt-0.5 font-medium animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
          <span>{validation.message}</span>
        </div>
      )}
    </div>
  );
}
