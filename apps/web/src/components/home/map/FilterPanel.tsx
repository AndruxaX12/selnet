"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import type { LatLng } from "@/lib/geo2";

export type Filter = {
  types: { signals: boolean; ideas: boolean; events: boolean };
  statuses: string[];
  radiusKm: number | null;
  center?: LatLng | null;
};

const ALL_STATUSES = [
  { id: "novo", label: "Нов", color: "red", pulse: true },
  { id: "v_process", label: "В процес", color: "yellow", pulse: false },
  { id: "zavarsheno", label: "Завършен", color: "green", pulse: false },
  { id: "othvarlen", label: "Отхвърлен", color: "gray", pulse: false }
];

interface FilterPanelProps {
  value: Filter;
  onChange: (filter: Filter) => void;
  isMobile?: boolean;
}

export default function FilterPanel({ value, onChange, isMobile = false }: FilterPanelProps) {
  const [state, setState] = useState<Filter>(value);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setState(value);
  }, [value]);

  useEffect(() => {
    if (!isMobile) {
      setMobileOpen(false);
    }
  }, [isMobile]);

  function save(next: Filter) {
    setState(next);
    onChange(next);
  }

  function toggleType(key: keyof Filter["types"]) {
    save({
      ...state,
      types: { ...state.types, [key]: !state.types[key] }
    });
  }

  function toggleStatus(id: string) {
    const exists = state.statuses.includes(id);
    save({
      ...state,
      statuses: exists ? state.statuses.filter((s) => s !== id) : [...state.statuses, id]
    });
  }

  function setRadius(next: number) {
    save({
      ...state,
      radiusKm: next === 0 ? null : next
    });
  }

  function geolocate() {
    if (!navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const center = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        save({
          ...state,
          center,
          radiusKm: state.radiusKm ?? 5
        });
      },
      () => {
        // Ignore errors silently; user may have denied permission.
      },
      { enableHighAccuracy: false, timeout: 10_000 }
    );
  }

  const content = (
    <div className="space-y-3">
      <div className="text-sm font-medium">Филтрирай по:</div>

      <div className="space-y-1">
        <div className="text-xs font-medium uppercase text-neutral-500">Тип</div>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" checked={state.types.signals} onChange={() => toggleType("signals")} />
          <span>Сигнали</span>
        </label>
      </div>

      <div className="space-y-1">
        <div className="text-xs font-medium uppercase text-neutral-500">Статус</div>
        {ALL_STATUSES.map((status) => {
          const isChecked = state.statuses.includes(status.id);
          const dotColor = {
            red: "bg-red-500",
            yellow: "bg-yellow-500",
            green: "bg-green-500",
            gray: "bg-gray-400"
          }[status.color];
          
          return (
            <label key={status.id} className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer hover:bg-gray-50 p-1 rounded">
              <input 
                type="checkbox" 
                checked={isChecked} 
                onChange={() => toggleStatus(status.id)}
                className="sr-only"
              />
              <div className="relative flex items-center">
                <div className={`w-3 h-3 rounded-full ${dotColor} ${status.pulse ? 'animate-pulse' : ''}`}></div>
                {isChecked && (
                  <svg className="absolute inset-0 w-3 h-3 text-white" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                  </svg>
                )}
              </div>
              <span>{status.label}</span>
            </label>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium uppercase text-neutral-500">
          Радиус {state.radiusKm ? `· ${state.radiusKm} km` : "(изкл.)"}
        </div>
        <input
          type="range"
          min={0}
          max={20}
          step={1}
          value={state.radiusKm ?? 0}
          onChange={(event) => setRadius(Number(event.target.value))}
          className="w-full"
        />
        <Button size="sm" variant="secondary" className="w-full" onClick={geolocate} type="button">
          Моето място
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="absolute top-3 left-3 z-[1000] md:hidden rounded-full bg-white/95 px-4 py-2 text-sm font-medium shadow focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-expanded={mobileOpen}
        >
          Филтри
        </button>
        {mobileOpen && (
          <div
            className="fixed inset-0 z-[1100] bg-black/40 md:hidden"
            role="dialog"
            aria-modal="true"
            onClick={() => setMobileOpen(false)}
          >
            <div
              className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-4 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold">Филтри</h2>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Затвори
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto space-y-4">
                {content}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="absolute top-14 left-14 z-[1000] hidden w-56 rounded-2xl border bg-white/95 backdrop-blur p-3 shadow md:block">
      {content}
    </div>
  );
}
