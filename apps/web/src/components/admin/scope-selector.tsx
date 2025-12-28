"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/Badge";

export interface Scope {
  type: 'global' | 'area';
  settlements?: string[];
  municipalities?: string[];
  provinces?: string[];
}

interface ScopeSelectorProps {
  value: Scope | null;
  onChange: (scope: Scope | null) => void;
}

// Mock data - в реалност от API
const SETTLEMENTS = [
  { id: 'sofia-city', name: 'София (столица)' },
  { id: 'plovdiv', name: 'Пловдив' },
  { id: 'varna', name: 'Варна' },
  { id: 'burgas', name: 'Бургас' },
];

export function ScopeSelector({ value, onChange }: ScopeSelectorProps) {
  const [type, setType] = useState<'global' | 'area'>(
    value?.type || 'global'
  );
  
  const handleTypeChange = (newType: 'global' | 'area') => {
    setType(newType);
    if (newType === 'global') {
      onChange({ type: 'global' });
    } else {
      onChange({ type: 'area', settlements: [] });
    }
  };
  
  const toggleSettlement = (id: string) => {
    if (type !== 'area') return;
    
    const current = value?.settlements || [];
    const newSettlements = current.includes(id)
      ? current.filter(s => s !== id)
      : [...current, id];
      
    onChange({
      type: 'area',
      settlements: newSettlements
    });
  };
  
  return (
    <div className="space-y-3">
      <Label>Обхват *</Label>
      
      <RadioGroup value={type} onValueChange={handleTypeChange}>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="global" id="scope-global" />
          <Label htmlFor="scope-global" className="font-normal cursor-pointer">
            Global (цялата страна)
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="area" id="scope-area" />
          <Label htmlFor="scope-area" className="font-normal cursor-pointer">
            Area (конкретен район)
          </Label>
        </div>
      </RadioGroup>
      
      {type === 'area' && (
        <div className="mt-3 space-y-2">
          <Label className="text-sm">Избери населени места</Label>
          <div className="rounded-md border p-3 space-y-2">
            {SETTLEMENTS.map(settlement => {
              const isSelected = value?.settlements?.includes(settlement.id);
              return (
                <div key={settlement.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`settlement-${settlement.id}`}
                    checked={isSelected}
                    onChange={() => toggleSettlement(settlement.id)}
                    className="rounded"
                  />
                  <label
                    htmlFor={`settlement-${settlement.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {settlement.name}
                  </label>
                </div>
              );
            })}
          </div>
          
          {value?.settlements && value.settlements.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {value.settlements.map(id => {
                const settlement = SETTLEMENTS.find(s => s.id === id);
                return (
                  <Badge key={id} variant="secondary" className="gap-1">
                    📍 {settlement?.name || id}
                    <button
                      onClick={() => toggleSettlement(id)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
