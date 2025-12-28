"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface SortOption {
  value: string;
  label: string;
}

interface SortDropdownProps {
  options: SortOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

/**
 * Sort Dropdown компонент
 */
export function SortDropdown({
  options,
  value,
  onChange,
  label = "Сортиране",
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full sm:w-auto" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-auto flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        type="button"
      >
        <span className="flex items-center gap-2">
          <span className="text-gray-500">{label}:</span>
          <span>{selectedOption.label}</span>
        </span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-64 bg-white rounded-lg border border-gray-200 shadow-lg z-50 py-1"
          role="listbox"
        >
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors ${
                option.value === value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
              role="option"
              aria-selected={option.value === value}
            >
              <span>{option.label}</span>
              {option.value === value && (
                <Check className="h-4 w-4 text-blue-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
