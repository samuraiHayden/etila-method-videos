import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UtensilsCrossed, ChevronDown, ChevronUp, Trash2, Plus, Search, Flame, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MealIngredientEditor } from "@/components/admin/MealIngredientEditor";
import { toast } from "sonner";
import { format, startOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { Json } from "@/integrations/supabase/types";

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

interface Meal {
  id: string;
  name: string;
  category: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  ingredients: string[] | null;
  instructions: string | null;
  image_url: string | null;
  default_ingredients: IngredientEntry[] | null;
}

interface PlanItem {
  id: string;
  meal_plan_id: string;
  meal_id: string;
  day_of_week: number;
  meal_type: string;
  serving_quantity: number | null;
  serving_unit: string | null;
  scheduled_time: string | null;
  custom_ingredients: IngredientEntry[] | null;
  meal: Meal;
}

interface MacroTargets {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  notes: string | null;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

function getMealTypeOrder(type: string): number {
  const order: Record<string, number> = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };
  return order[type.toLowerCase()] ?? 4;
}

function parseCustomIngredients(raw: Json | null): IngredientEntry[] | null {
  if (!raw || !Array.isArray(raw)) return null;
  if (raw.length > 0 && typeof raw[0] === "object" && raw[0] !== null && "food_item_id" in raw[0]) {
    return raw as unknown as IngredientEntry[];
  }
  return null;
}

function getItemMacros(item: PlanItem) {
  if (item.custom_ingredients && item.custom_ingredients.length > 0) {
    return item.custom_ingredients.reduce(
      (acc, ing) => ({
        calories: acc.calories + ing.calories,
        protein: acc.protein + ing.protein,
        carbs: acc.carbs + ing.carbs,
        fat: acc.fat + ing.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }
  const qty = item.serving_quantity || 1;
  return {
    calories: (item.meal.calories || 0) * qty,
    protein: (item.meal.protein || 0) * qty,
    carbs: (item.meal.carbs || 0) * qty,
    fat: (item.meal.fat || 0) * qty,
  };
}

function MacroBar({ label, value, target, color }: { label: string; value: number; target: number | null; color: string }) {
  const pct = target ? Math.min((value / target) * 100, 100) : 0;
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="text-xs font-bold">
          {Math.round(value)}
          {target ? <span className="text-muted-foreground font-normal">/{target}</span> : null}
        </span>
      </div>
      {target ? (
        <div className="h-1.5 rounded-full bg-secondary/80 overflow-hidden">
          <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
        </div>
      ) : null}
    </div>
  );
}

interface MealPlanViewProps {
  userId: string;
}

export function MealPlanView({ userId }: MealPlanViewProps) {
  const [loading, setLoading] = useState(true);
  const [planId, setPlanId] = useState<string | null>(null);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [macroTargets, setMacroTargets] = useState<MacroTargets | null>(null);
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  });
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState("breakfast");
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPlan();
  }, [userId]);

  async function fetchPlan() {
    setLoading(true);
    try {
      let { data: plan } = await supabase
        .from("meal_plans")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!plan) {
        const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
        const { data: newPlan, error } = await supabase
          .from("meal_plans")
          .insert({ user_id: userId, week_start_date: weekStart })
          .select("id")
          .single();
        if (error) throw error;
        plan = newPlan;
      }

      setPlanId(plan.id);

      const [targetsRes, itemsRes, mealsRes, foodRes] = await Promise.all([
        supabase.from("user_nutrition_targets").select("calories, protein, carbs, fat, notes").eq("user_id", userId).maybeSingle(),
        supabase.from("meal_plan_items").select("id, meal_plan_id, meal_id, day_of_week, meal_type, serving_quantity, serving_unit, scheduled_time, custom_ingredients").eq("meal_plan_id", plan.id),
        supabase.from("meals").select("id, name, category, calories, protein, carbs, fat, ingredients, instructions, image_url, default_ingredients").order("name"),
        supabase.from("food_items").select("*").order("name"),
      ]);

      if (targetsRes.data) setMacroTargets(targetsRes.data as any);
      setFoodItems((foodRes.data || []) as FoodItem[]);

      const meals = (mealsRes.data || []).map((m: any) => ({
        ...m,
        default_ingredients: parseCustomIngredients(m.default_ingredients),
      })) as Meal[];
      setAllMeals(meals);

      const mealsMap = new Map(meals.map((m) => [m.id, m]));
      const enriched: PlanItem[] = (itemsRes.data || [])
        .map((item: any) => ({
          ...item,
          custom_ingredients: parseCustomIngredients(item.custom_ingredients),
          meal: mealsMap.get(item.meal_id)!,
        }))
        .filter((i: any) => i.meal);

      setPlanItems(enriched);
    } catch (error) {
      console.error("Error fetching meal plan:", error);
    } finally {
      setLoading(false);
    }
  }

  async function addMealToPlan(meal: Meal) {
    if (!planId) return;
    setSaving(true);
    try {
      const defaultIngs = meal.default_ingredients || null;
      const { data, error } = await supabase
        .from("meal_plan_items")
        .insert({
          meal_plan_id: planId,
          meal_id: meal.id,
          day_of_week: selectedDay,
          meal_type: selectedMealType,
          serving_quantity: 1,
          serving_unit: "serving",
          custom_ingredients: (defaultIngs as unknown as Json) || null,
        })
        .select("id, meal_plan_id, meal_id, day_of_week, meal_type, serving_quantity, serving_unit, scheduled_time, custom_ingredients")
        .single();

      if (error) throw error;
      setPlanItems((prev) => [...prev, { ...data, custom_ingredients: parseCustomIngredients(data.custom_ingredients), meal }]);
      toast.success(`Added ${meal.name}`);
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding meal:", error);
      toast.error("Failed to add meal");
    } finally {
      setSaving(false);
    }
  }

  async function removeMealFromPlan(itemId: string) {
    try {
      const { error } = await supabase.from("meal_plan_items").delete().eq("id", itemId);
      if (error) throw error;
      setPlanItems((prev) => prev.filter((i) => i.id !== itemId));
      toast.success("Meal removed");
    } catch (error) {
      console.error("Error removing meal:", error);
      toast.error("Failed to remove meal");
    }
  }

  async function handleUpdateServings(itemId: string, quantity: number, unit: string) {
    const item = planItems.find((i) => i.id === itemId);
    if (!item) return;
    const oldQty = item.serving_quantity || 1;
    const ratio = quantity / oldQty;
    let effectiveIngredients = item.custom_ingredients && item.custom_ingredients.length > 0
      ? item.custom_ingredients : item.meal.default_ingredients;
    let scaledIngredients = effectiveIngredients;
    if (scaledIngredients && scaledIngredients.length > 0 && ratio !== 1) {
      scaledIngredients = scaledIngredients.map((ing) => ({
        ...ing,
        qty: Math.round(ing.qty * ratio * 100) / 100,
        calories: Math.round(ing.calories * ratio * 10) / 10,
        protein: Math.round(ing.protein * ratio * 10) / 10,
        carbs: Math.round(ing.carbs * ratio * 10) / 10,
        fat: Math.round(ing.fat * ratio * 10) / 10,
      }));
    }
    setPlanItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, serving_quantity: quantity, serving_unit: unit, custom_ingredients: scaledIngredients } : i))
    );
    try {
      const updatePayload: any = { serving_quantity: quantity, serving_unit: unit };
      if (scaledIngredients) updatePayload.custom_ingredients = scaledIngredients as unknown as Json;
      const { error } = await supabase.from("meal_plan_items").update(updatePayload).eq("id", itemId);
      if (error) throw error;
    } catch (error) {
      console.error("Error updating servings:", error);
      toast.error("Failed to update servings");
    }
  }

  async function handleUpdateIngredients(itemId: string, ingredients: IngredientEntry[]) {
    setPlanItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, custom_ingredients: ingredients } : i))
    );
    try {
      const { error } = await supabase.from("meal_plan_items").update({ custom_ingredients: ingredients as unknown as Json }).eq("id", itemId);
      if (error) throw error;
    } catch (error) {
      console.error("Error updating ingredients:", error);
      toast.error("Failed to update ingredients");
    }
  }

  function handleResetIngredients(itemId: string) {
    const item = planItems.find((i) => i.id === itemId);
    const meal = item ? allMeals.find((m) => m.id === item.meal_id) : null;
    const defaults = meal?.default_ingredients || null;
    setPlanItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, custom_ingredients: defaults } : i))
    );
    supabase
      .from("meal_plan_items")
      .update({ custom_ingredients: (defaults as unknown as Json) || null })
      .eq("id", itemId)
      .then(({ error }) => {
        if (error) toast.error("Failed to reset ingredients");
        else toast.success("Reset to defaults");
      });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const dayItems = planItems
    .filter((i) => i.day_of_week === selectedDay)
    .sort((a, b) => getMealTypeOrder(a.meal_type) - getMealTypeOrder(b.meal_type));

  const groupedByType: Record<string, PlanItem[]> = {};
  dayItems.forEach((item) => {
    const type = item.meal_type.toLowerCase();
    if (!groupedByType[type]) groupedByType[type] = [];
    groupedByType[type].push(item);
  });

  const sortedTypes = Object.keys(groupedByType).sort(
    (a, b) => getMealTypeOrder(a) - getMealTypeOrder(b)
  );

  const dayTotals = dayItems.reduce(
    (acc, item) => {
      const macros = getItemMacros(item);
      return {
        calories: acc.calories + macros.calories,
        protein: acc.protein + macros.protein,
        carbs: acc.carbs + macros.carbs,
        fat: acc.fat + macros.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const filteredMeals = allMeals.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Macro Progress Card */}
      {macroTargets && (macroTargets.calories || macroTargets.protein) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="p-5 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 shadow-soft"
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Daily Targets</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {macroTargets.calories != null && (
              <MacroBar label="Calories" value={dayTotals.calories} target={macroTargets.calories} color="bg-primary" />
            )}
            {macroTargets.protein != null && (
              <MacroBar label="Protein" value={dayTotals.protein} target={Number(macroTargets.protein)} color="bg-success" />
            )}
            {macroTargets.carbs != null && (
              <MacroBar label="Carbs" value={dayTotals.carbs} target={Number(macroTargets.carbs)} color="bg-warning" />
            )}
            {macroTargets.fat != null && (
              <MacroBar label="Fat" value={dayTotals.fat} target={Number(macroTargets.fat)} color="bg-accent" />
            )}
          </div>
          {macroTargets.notes && (
            <p className="text-[11px] text-muted-foreground mt-3 italic border-t border-border/30 pt-3">{macroTargets.notes}</p>
          )}
        </motion.div>
      )}

      {/* Day selector — grid, no scroll */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((day, idx) => {
          const dayCount = planItems.filter((i) => i.day_of_week === idx).length;
          const isActive = selectedDay === idx;
          return (
            <button
              key={idx}
              onClick={() => setSelectedDay(idx)}
              className={cn(
                "flex flex-col items-center py-2 rounded-xl text-xs font-semibold transition-all duration-200 border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-soft"
                  : "bg-card/80 text-muted-foreground border-border/40 hover:border-border hover:text-foreground"
              )}
            >
              <span>{day.slice(0, 3)}</span>
              {dayCount > 0 && (
                <span className={cn(
                  "text-[9px] mt-0.5 font-bold",
                  isActive ? "text-primary-foreground/70" : "text-muted-foreground/50"
                )}>
                  {dayCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Add meal button */}
      <Button
        variant="outline"
        className="w-full border-dashed border-border/50 rounded-xl h-11 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
        onClick={() => setAddDialogOpen(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Meal to {DAYS[selectedDay]}
      </Button>

      {/* Meal groups */}
      <AnimatePresence mode="wait">
        {dayItems.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-secondary/50 flex items-center justify-center">
              <UtensilsCrossed className="h-7 w-7 text-muted-foreground/25" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No meals planned for {DAYS[selectedDay]}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Tap "Add Meal" to start building your plan</p>
          </motion.div>
        ) : (
          <motion.div
            key="meals"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {sortedTypes.map((type) => {
              const items = groupedByType[type];
              const mealTotals = items.reduce(
                (acc, item) => {
                  const macros = getItemMacros(item);
                  return {
                    calories: acc.calories + macros.calories,
                    protein: acc.protein + macros.protein,
                    carbs: acc.carbs + macros.carbs,
                    fat: acc.fat + macros.fat,
                  };
                },
                { calories: 0, protein: 0, carbs: 0, fat: 0 }
              );

              return (
                <div key={type} className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border/40 overflow-hidden shadow-soft">
                  {/* Section header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-secondary/30 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 rounded-full bg-primary" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {Math.round(mealTotals.calories)} cal
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-2 text-primary hover:text-primary"
                      onClick={() => {
                        setSelectedMealType(type);
                        setAddDialogOpen(true);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-border/20">
                    {items.map((item) => {
                      const qty = item.serving_quantity || 1;
                      const isExpanded = expandedItem === item.id;
                      const hasCustom = !!item.custom_ingredients && item.custom_ingredients.length > 0;
                      const itemMacros = getItemMacros(item);

                      return (
                        <div key={item.id}>
                          <div className="flex items-start gap-2 px-3 py-3">
                            <button
                              onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                              className="shrink-0 p-1 hover:bg-muted/60 rounded-lg transition-colors mt-0.5"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {item.scheduled_time && (
                                  <span className="text-[10px] text-primary font-semibold shrink-0">
                                    {(() => {
                                      const [h, m] = item.scheduled_time.split(":").map(Number);
                                      const ampm = h >= 12 ? "PM" : "AM";
                                      const h12 = h % 12 || 12;
                                      return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
                                    })()}
                                  </span>
                                )}
                                <span className="text-sm font-medium truncate">{item.meal.name}</span>
                                {hasCustom && (
                                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-0 shrink-0">Custom</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                                <span>{Math.round(itemMacros.calories)} cal</span>
                                <span>·</span>
                                <span>{Math.round(itemMacros.protein * 10) / 10}P</span>
                                <span>{Math.round(itemMacros.carbs * 10) / 10}C</span>
                                <span>{Math.round(itemMacros.fat * 10) / 10}F</span>
                              </div>

                              {/* Serving controls on own row */}
                              <div className="flex items-center gap-1.5 mt-2">
                                <Input
                                  type="number"
                                  min="0.1"
                                  step="0.5"
                                  value={qty}
                                  onChange={(e) => handleUpdateServings(item.id, parseFloat(e.target.value) || 1, item.serving_unit || "serving")}
                                  className="h-7 w-12 text-xs text-center px-1 rounded-lg border-border/50"
                                />
                                <Select
                                  value={item.serving_unit || "serving"}
                                  onValueChange={(v) => handleUpdateServings(item.id, qty, v)}
                                >
                                  <SelectTrigger className="h-7 text-xs w-[85px] px-2 rounded-lg border-border/50">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="serving">Serving</SelectItem>
                                    <SelectItem value="g">g</SelectItem>
                                    <SelectItem value="oz">oz</SelectItem>
                                    <SelectItem value="cup">Cup</SelectItem>
                                    <SelectItem value="tbsp">Tbsp</SelectItem>
                                    <SelectItem value="ml">ml</SelectItem>
                                    <SelectItem value="qty">Qty</SelectItem>
                                  </SelectContent>
                                </Select>
                                <button
                                  onClick={() => removeMealFromPlan(item.id)}
                                  className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors ml-auto"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive transition-colors" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expandable details */}
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="px-4 pb-4 pl-12 space-y-3"
                            >
                              <MealIngredientEditor
                                foodItems={foodItems}
                                ingredients={item.custom_ingredients && item.custom_ingredients.length > 0
                                  ? item.custom_ingredients
                                  : (item.meal.default_ingredients || [])}
                                onChange={(ings) => handleUpdateIngredients(item.id, ings)}
                                onReset={() => handleResetIngredients(item.id)}
                                hasCustom={hasCustom}
                              />
                              {item.meal.ingredients && item.meal.ingredients.length > 0 && (
                                <div className="pt-3 border-t border-border/30">
                                  <p className="text-xs font-semibold mb-2">Recipe Ingredients</p>
                                  <ul className="space-y-1">
                                    {item.meal.ingredients.map((ing, i) => (
                                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        {ing}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {item.meal.instructions && (
                                <div className="pt-3 border-t border-border/30">
                                  <p className="text-xs font-semibold mb-2">Instructions</p>
                                  <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                                    {item.meal.instructions}
                                  </p>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Day total card */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Day Total</span>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1">
                  <Flame className="h-3 w-3 text-primary" />
                  {Math.round(dayTotals.calories)}
                </span>
                <span className="text-success">{Math.round(dayTotals.protein * 10) / 10}P</span>
                <span className="text-warning">{Math.round(dayTotals.carbs * 10) / 10}C</span>
                <span className="text-accent">{Math.round(dayTotals.fat * 10) / 10}F</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Meal Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] p-0 rounded-2xl overflow-hidden">
          <DialogHeader className="p-5 pb-0">
            <DialogTitle className="text-lg font-bold">Add Meal to {DAYS[selectedDay]}</DialogTitle>
          </DialogHeader>

          <div className="px-5 space-y-3 pb-2">
            <Select value={selectedMealType} onValueChange={setSelectedMealType}>
              <SelectTrigger className="h-10 rounded-xl border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search meals..."
                className="pl-9 h-10 rounded-xl border-border/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="max-h-[50vh] px-5 pb-5">
            <div className="space-y-1 pt-1">
              {filteredMeals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No meals found</p>
              ) : (
                filteredMeals.map((meal) => (
                  <button
                    key={meal.id}
                    onClick={() => addMealToPlan(meal)}
                    disabled={saving}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors text-left group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0 overflow-hidden">
                      {meal.image_url ? (
                        <img src={meal.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <UtensilsCrossed className="h-4 w-4 text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{meal.name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                        {meal.calories != null && <span>{meal.calories} cal</span>}
                        {meal.protein != null && <span>· {meal.protein}g P</span>}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                      <Plus className="h-4 w-4 text-primary" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
