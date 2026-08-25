import React, { useState, useEffect } from 'react';
import { Edit2 } from 'lucide-react';
import { cn } from '../utils';

interface EditableCurrencyInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  placeholder?: string;
  title?: string;
  showEditIcon?: boolean;
}

export function EditableCurrencyInput({
  value,
  onChange,
  className,
  placeholder = "0.00",
  title = "Click to edit",
  showEditIcon = true,
}: EditableCurrencyInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [localText, setLocalText] = useState(() => (value ? value.toFixed(2) : "0.00"));

  useEffect(() => {
    if (!isFocused) {
      setLocalText(value ? value.toFixed(2) : "0.00");
    }
  }, [value, isFocused]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    setLocalText(value ? value.toString() : "");
    e.target.select();
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseFloat(localText.replace(',', '.')) || 0;
    const clean = Math.max(0, Math.round(parsed * 100) / 100);
    setLocalText(clean.toFixed(2));
    if (clean !== value) {
      onChange(clean);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setLocalText(value ? value.toFixed(2) : "0.00");
      setIsFocused(false);
      e.currentTarget.blur();
    }
  };

  return (
    <div
      className="inline-flex items-center group relative cursor-pointer rounded px-1 -mx-1 transition-colors hover:bg-slate-700/40 print:hover:bg-transparent"
      title={title}
    >
      <input
        type="text"
        inputMode="decimal"
        className={cn(
          "bg-transparent border-none p-0 outline-none w-20 transition-all cursor-pointer focus:cursor-text",
          "focus:ring-1 focus:ring-indigo-400 focus:rounded px-1",
          className
        )}
        value={localText}
        placeholder={placeholder}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={(e) => setLocalText(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {showEditIcon && (
        <Edit2 className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0 print:hidden" />
      )}
    </div>
  );
}
