"use client";
import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

/**
 * SearchBar компонент с debounce
 */
export function SearchBar({
  value,
  onChange,
  placeholder = "Търсене...",
  debounceMs = 350,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange - use ref to avoid dependency on onChange
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onChangeRef.current(localValue);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [localValue, debounceMs]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className="relative w-full">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
        aria-label={placeholder}
      />

      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-gray-100 rounded-full p-1 transition-colors"
          aria-label="Изчисти търсенето"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      )}
    </div>
  );
}
