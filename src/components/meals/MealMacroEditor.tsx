import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface MacroValues {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealMacroEditorProps {
  macros: MacroValues;
  onChange: (macros: MacroValues) => void;
  onReset?: () => void;
  hasCustom?: boolean;
}

export function MealMacroEditor({ macros, onChange, onReset, hasCustom }: MealMacroEditorProps) {
  function handleChange(field: keyof MacroValues, value: string) {
    const num = parseFloat(value) || 0;
    onChange({ ...macros, [field]: Math.max(0, num) });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Macros
        </p>
        {hasCustom && onReset && (
          <button
            onClick={onReset}
            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="text-[10px] text-muted-foreground font-medium block mb-1">Calories</label>
          <Input
            type="number"
            min="0"
            step="1"
            value={macros.calories}
            onChange={(e) => handleChange("calories", e.target.value)}
            className="h-8 text-xs text-center px-1"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-medium block mb-1">Protein (g)</label>
          <Input
            type="number"
            min="0"
            step="0.5"
            value={macros.protein}
            onChange={(e) => handleChange("protein", e.target.value)}
            className="h-8 text-xs text-center px-1"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-medium block mb-1">Carbs (g)</label>
          <Input
            type="number"
            min="0"
            step="0.5"
            value={macros.carbs}
            onChange={(e) => handleChange("carbs", e.target.value)}
            className="h-8 text-xs text-center px-1"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-medium block mb-1">Fat (g)</label>
          <Input
            type="number"
            min="0"
            step="0.5"
            value={macros.fat}
            onChange={(e) => handleChange("fat", e.target.value)}
            className="h-8 text-xs text-center px-1"
          />
        </div>
      </div>
    </div>
  );
}
