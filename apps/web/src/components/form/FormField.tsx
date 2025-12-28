"use client";
import { FieldError } from "react-hook-form";

export function FormField({ label, hint, children, error, required }: {
  label?: string;
  hint?: string;
  children: React.ReactNode;
  error?: FieldError;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className={`${error ? 'ring-2 ring-red-200 rounded-lg' : ''}`}>
        {children}
      </div>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <span className="text-red-500">⚠</span>
          {error.message as any}
        </p>
      )}
    </div>
  );
}

export const inputClass = "w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500";
export const textareaClass = "w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-400 min-h-[100px] sm:min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500";
export const selectClass = "w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500";
