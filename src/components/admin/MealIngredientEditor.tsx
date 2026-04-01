import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, X, Search, RotateCcw } from "lucide-react";

interface FoodItem {
  id: string;
  name: string;
  category: string;
  default_portion_qty: number;
  default_portion_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface IngredientEntry {
  food_item_id: string;
  name: string;
  qty: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealIngredientEditorProps {
  foodItems: FoodItem[];
  ingredients: IngredientEntry[];
  onChange: (ingredients: IngredientEntry[]) => void;
  originalIngredientTexts?: string[] | null;
  onReset?: () => void;
  hasCustom?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  protein: "bg-red-500/10 text-red-700",
  carb: "bg-amber-500/10 text-amber-700",
  fat: "bg-green-500/10 text-green-700",
};

export function MealIngredientEditor({
  foodItems,
  ingredients,
  onChange,
  onReset,
  hasCustom,
}: MealIngredientEditorProps) {
  const [search, setSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const filteredFoodItems = foodItems.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const groupedFoodItems = {
    protein: filteredFoodItems.filter((f) => f.category === "protein"),
    carb: filteredFoodItems.filter((f) => f.category === "carb"),
    fat: filteredFoodItems.filter((f) => f.category === "fat"),
  };

  function handleAddFoodItem(item: FoodItem) {
    const entry: IngredientEntry = {
      food_item_id: item.id,
      name: item.name,
      qty: item.default_portion_qty,
      unit: item.default_portion_unit,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    };
    onChange([...ingredients, entry]);
    setShowPicker(false);
    setSearch("");
  }

  function handleUpdateQty(index: number, newQty: number) {
    const updated = [...ingredients];
    const item = updated[index];
    const foodItem = foodItems.find((f) => f.id === item.food_item_id);
    if (!foodItem) return;

    const ratio = newQty / foodItem.default_portion_qty;
    updated[index] = {
      ...item,
      qty: newQty,
      calories: Math.round(foodItem.calories * ratio * 10) / 10,
      protein: Math.round(foodItem.protein * ratio * 10) / 10,
      carbs: Math.round(foodItem.carbs * ratio * 10) / 10,
      fat: Math.round(foodItem.fat * ratio * 10) / 10,
    };
    onChange(updated);
  }

  function handleRemove(index: number) {
    onChange(ingredients.filter((_, i) => i !== index));
  }

  const totals = ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + ing.calories,
      protein: acc.protein + ing.protein,
      carbs: acc.carbs + ing.carbs,
      fat: acc.fat + ing.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Ingredients
        </p>
        <div className="flex items-center gap-1">
          {hasCustom && onReset && (
            <button
              onClick={onReset}
              className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-5 text-[10px] px-1.5"
            onClick={() => setShowPicker(!showPicker)}
          >
            <Plus className="h-3 w-3 mr-0.5" />
            Add
          </Button>
        </div>
      </div>

      {/* Ingredient list */}
      {ingredients.map((ing, idx) => (
        <div
          key={idx}
          className="flex items-center gap-1.5 py-1 border-b border-border/20 last:border-0"
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{ing.name}</p>
          </div>
          <Input
            type="number"
            min="0"
            step="0.5"
            value={ing.qty}
            onChange={(e) => handleUpdateQty(idx, parseFloat(e.target.value) || 0)}
            className="h-6 w-14 text-[11px] text-center px-1"
          />
          <span className="text-[10px] text-muted-foreground w-10 shrink-0">
            {ing.unit}
          </span>
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground shrink-0">
            <span>{Math.round(ing.calories)}cal</span>
            <span className="text-red-600">{Math.round(ing.protein * 10) / 10}P</span>
            <span className="text-amber-600">{Math.round(ing.carbs * 10) / 10}C</span>
            <span className="text-green-600">{Math.round(ing.fat * 10) / 10}F</span>
          </div>
          <button
            onClick={() => handleRemove(idx)}
            className="shrink-0 p-0.5 hover:bg-destructive/10 rounded"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      ))}

      {/* Totals row */}
      {ingredients.length > 0 && (
        <div className="flex items-center justify-end gap-2 pt-1 text-[10px] font-semibold border-t border-border/40">
          <span>Total:</span>
          <span>{Math.round(totals.calories)} cal</span>
          <span className="text-red-600">{Math.round(totals.protein * 10) / 10}P</span>
          <span className="text-amber-600">{Math.round(totals.carbs * 10) / 10}C</span>
          <span className="text-green-600">{Math.round(totals.fat * 10) / 10}F</span>
        </div>
      )}

      {/* Food item picker */}
      {showPicker && (
        <div className="border border-border rounded-lg p-2 bg-muted/30 space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search ingredients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 h-7 text-xs"
              autoFocus
            />
          </div>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {(["protein", "carb", "fat"] as const).map((cat) => {
                const items = groupedFoodItems[cat];
                if (items.length === 0) return null;
                return (
                  <div key={cat}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      {cat === "carb" ? "Carbs" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </p>
                    {items.map((item) => (
                      <button
                        key={item.id}
                        className="w-full text-left px-2 py-1 rounded text-xs hover:bg-accent flex items-center justify-between"
                        onClick={() => handleAddFoodItem(item)}
                      >
                        <span>{item.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {item.default_portion_qty} {item.default_portion_unit} · {item.calories}cal · {item.protein}P {item.carbs}C {item.fat}F
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
