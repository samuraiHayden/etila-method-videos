import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UtensilsCrossed, Loader2, Plus, X, Search, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { MealIngredientEditor } from "./MealIngredientEditor";
import type { Json } from "@/integrations/supabase/types";

interface NutritionAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

interface Meal {
  id: string;
  name: string;
  category: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  image_url: string | null;
  ingredients: string[] | null;
  default_ingredients: IngredientEntry[] | null;
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

interface MealPlanItem {
  id?: string;
  meal_id: string;
  day_of_week: number;
  meal_type: string;
  serving_quantity: number | null;
  serving_unit: string | null;
  scheduled_time: string | null;
  custom_ingredients?: IngredientEntry[] | null;
  meal?: Meal;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

function parseCustomIngredients(raw: Json | null): IngredientEntry[] | null {
  if (!raw || !Array.isArray(raw)) return null;
  // Check if it's the new structured format (array of objects with food_item_id)
  if (raw.length > 0 && typeof raw[0] === "object" && raw[0] !== null && "food_item_id" in raw[0]) {
    return raw as unknown as IngredientEntry[];
  }
  // Legacy string[] format — return null (will fall back to meal template)
  return null;
}

export function NutritionAssignmentDialog({
  open,
  onOpenChange,
  userId,
  userName,
}: NutritionAssignmentDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [mealSearch, setMealSearch] = useState("");

  // Macro targets
  const [macros, setMacros] = useState({
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    notes: "",
  });

  // Meal plan
  const [mealPlanId, setMealPlanId] = useState<string | null>(null);
  const [mealPlanItems, setMealPlanItems] = useState<MealPlanItem[]>([]);
  const [addingMeal, setAddingMeal] = useState<{ type: string; quantity: string; unit: string; time: string } | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [copyTargetDays, setCopyTargetDays] = useState<number[]>([]);
  const [copyingDay, setCopyingDay] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    if (open && userId) {
      fetchAll();
    }
  }, [open, userId]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [mealsRes, targetsRes, planRes, foodItemsRes] = await Promise.all([
        supabase.from("meals").select("id, name, category, calories, protein, carbs, fat, image_url, ingredients, default_ingredients").order("name"),
        supabase.from("user_nutrition_targets").select("*").eq("user_id", userId).maybeSingle(),
        supabase
          .from("meal_plans")
          .select("id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("food_items" as any).select("*").order("name"),
      ]);

      setAllMeals((mealsRes.data || []).map((m: any) => ({
        ...m,
        default_ingredients: parseCustomIngredients(m.default_ingredients),
      })));
      setFoodItems((foodItemsRes.data as unknown as FoodItem[]) || []);

      if (targetsRes.data) {
        setMacros({
          calories: targetsRes.data.calories?.toString() || "",
          protein: targetsRes.data.protein?.toString() || "",
          carbs: targetsRes.data.carbs?.toString() || "",
          fat: targetsRes.data.fat?.toString() || "",
          notes: (targetsRes.data as any).notes || "",
        });
      } else {
        setMacros({ calories: "", protein: "", carbs: "", fat: "", notes: "" });
      }

      if (planRes.data) {
        setMealPlanId(planRes.data.id);
        const { data: items } = await supabase
          .from("meal_plan_items")
          .select("id, meal_id, day_of_week, meal_type, serving_quantity, serving_unit, scheduled_time, custom_ingredients")
          .eq("meal_plan_id", planRes.data.id);
        setMealPlanItems(
          (items || []).map((i) => ({
            ...i,
            custom_ingredients: parseCustomIngredients(i.custom_ingredients),
          }))
        );
      } else {
        setMealPlanId(null);
        setMealPlanItems([]);
      }
    } catch (error) {
      console.error("Error fetching nutrition data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveMacros() {
    setSaving(true);
    try {
      const payload = {
        user_id: userId,
        calories: macros.calories ? parseInt(macros.calories) : null,
        protein: macros.protein ? parseFloat(macros.protein) : null,
        carbs: macros.carbs ? parseFloat(macros.carbs) : null,
        fat: macros.fat ? parseFloat(macros.fat) : null,
        notes: macros.notes || null,
        assigned_by: user?.id || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("user_nutrition_targets")
        .upsert(payload, { onConflict: "user_id" });

      if (error) throw error;
      toast.success("Macro targets saved");
    } catch (error) {
      console.error("Error saving macros:", error);
      toast.error("Failed to save macro targets");
    } finally {
      setSaving(false);
    }
  }

  async function ensureMealPlan(): Promise<string> {
    if (mealPlanId) return mealPlanId;

    const weekStart = getWeekStart();
    const { data, error } = await supabase
      .from("meal_plans")
      .insert({ user_id: userId, week_start_date: weekStart })
      .select("id")
      .single();

    if (error) throw error;
    setMealPlanId(data.id);
    return data.id;
  }

  function getWeekStart() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split("T")[0];
  }

  async function handleAddMealToPlan(mealId: string) {
    if (!addingMeal) return;
    try {
      const planId = await ensureMealPlan();
      const meal = allMeals.find((m) => m.id === mealId);
      const defaultIngs = meal?.default_ingredients || null;
      const { data, error } = await supabase
        .from("meal_plan_items")
        .insert({
          meal_plan_id: planId,
          meal_id: mealId,
          day_of_week: selectedDay,
          meal_type: addingMeal.type.toLowerCase(),
          serving_quantity: addingMeal.quantity ? parseFloat(addingMeal.quantity) : 1,
          serving_unit: addingMeal.unit || "serving",
          scheduled_time: addingMeal.time || null,
          custom_ingredients: defaultIngs as unknown as Json,
        })
        .select("id, meal_id, day_of_week, meal_type, serving_quantity, serving_unit, scheduled_time, custom_ingredients")
        .single();

      if (error) throw error;
      setMealPlanItems((prev) => [...prev, { ...data, custom_ingredients: defaultIngs }]);
      setAddingMeal(null);
      setMealSearch("");
      toast.success("Meal added");
    } catch (error) {
      console.error("Error adding meal:", error);
      toast.error("Failed to add meal");
    }
  }

  async function handleRemoveMealFromPlan(itemId: string) {
    try {
      const { error } = await supabase.from("meal_plan_items").delete().eq("id", itemId);
      if (error) throw error;
      setMealPlanItems((prev) => prev.filter((i) => i.id !== itemId));
      toast.success("Meal removed");
    } catch (error) {
      console.error("Error removing meal:", error);
      toast.error("Failed to remove meal");
    }
  }

  async function handleUpdateServings(itemId: string, quantity: number, unit: string) {
    const item = mealPlanItems.find((i) => i.id === itemId);
    if (!item) return;

    const oldQty = item.serving_quantity || 1;
    const ratio = quantity / oldQty;

    // Scale custom_ingredients proportionally when quantity changes
    let scaledIngredients = item.custom_ingredients;
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

    setMealPlanItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, serving_quantity: quantity, serving_unit: unit, custom_ingredients: scaledIngredients } : i))
    );
    try {
      const updatePayload: any = { serving_quantity: quantity, serving_unit: unit };
      if (scaledIngredients) {
        updatePayload.custom_ingredients = scaledIngredients as unknown as Json;
      }
      const { error } = await supabase
        .from("meal_plan_items")
        .update(updatePayload)
        .eq("id", itemId);
      if (error) throw error;
    } catch (error) {
      console.error("Error updating servings:", error);
      toast.error("Failed to update servings");
    }
  }

  async function handleUpdateStructuredIngredients(itemId: string, ingredients: IngredientEntry[]) {
    setMealPlanItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, custom_ingredients: ingredients } : i))
    );
    try {
      const { error } = await supabase
        .from("meal_plan_items")
        .update({ custom_ingredients: ingredients as unknown as Json })
        .eq("id", itemId);
      if (error) throw error;
    } catch (error) {
      console.error("Error updating ingredients:", error);
      toast.error("Failed to update ingredients");
    }
  }

  function handleResetIngredients(itemId: string) {
    const item = mealPlanItems.find((i) => i.id === itemId);
    const meal = item ? allMeals.find((m) => m.id === item.meal_id) : null;
    const defaults = meal?.default_ingredients || null;
    setMealPlanItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, custom_ingredients: defaults } : i))
    );
    supabase
      .from("meal_plan_items")
      .update({ custom_ingredients: (defaults as unknown as Json) || null })
      .eq("id", itemId)
      .then(({ error }) => {
        if (error) toast.error("Failed to reset ingredients");
      });
  }

  async function handleCopyDay() {
    if (copyTargetDays.length === 0) return;
    setCopyingDay(true);
    try {
      const planId = await ensureMealPlan();
      const sourceItems = mealPlanItems.filter((i) => i.day_of_week === selectedDay);
      if (sourceItems.length === 0) {
        toast.error("No meals to copy on this day");
        setCopyingDay(false);
        return;
      }

      const newRows = copyTargetDays.flatMap((targetDay) =>
        sourceItems.map((item) => ({
          meal_plan_id: planId,
          meal_id: item.meal_id,
          day_of_week: targetDay,
          meal_type: item.meal_type,
          serving_quantity: item.serving_quantity,
          serving_unit: item.serving_unit,
          scheduled_time: item.scheduled_time,
          custom_ingredients: (item.custom_ingredients as unknown as Json) || null,
        }))
      );

      const { data, error } = await supabase
        .from("meal_plan_items")
        .insert(newRows)
        .select("id, meal_id, day_of_week, meal_type, serving_quantity, serving_unit, scheduled_time, custom_ingredients");

      if (error) throw error;
      setMealPlanItems((prev) => [
        ...prev,
        ...(data || []).map((d) => ({
          ...d,
          custom_ingredients: parseCustomIngredients(d.custom_ingredients),
        })),
      ]);
      setCopyTargetDays([]);
      toast.success(`Copied meals to ${copyTargetDays.length} day(s)`);
    } catch (error) {
      console.error("Error copying meals:", error);
      toast.error("Failed to copy meals");
    } finally {
      setCopyingDay(false);
    }
  }

  // Calculate macros for an item, using structured ingredients if available
  function getItemMacros(item: MealPlanItem) {
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
    const meal = allMeals.find((m) => m.id === item.meal_id);
    const qty = item.serving_quantity || 1;
    return {
      calories: (meal?.calories || 0) * qty,
      protein: (meal?.protein || 0) * qty,
      carbs: (meal?.carbs || 0) * qty,
      fat: (meal?.fat || 0) * qty,
    };
  }

  const getMealName = (mealId: string) => allMeals.find((m) => m.id === mealId)?.name || "Unknown";

  const filteredMeals = allMeals.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(mealSearch.toLowerCase());
    if (!addingMeal) return matchesSearch;
    const type = addingMeal.type.toLowerCase();
    const category = m.category.toLowerCase();
    if (type === "breakfast") return matchesSearch && category === "breakfast";
    if (type === "lunch" || type === "dinner") return matchesSearch && category === "lunch/dinner";
    if (type === "snack") return matchesSearch && category === "snack";
    return matchesSearch;
  });

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5" />
                Nutrition Plan — {userName}
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="macros" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="macros">Macro Targets</TabsTrigger>
                <TabsTrigger value="meals">Meal Plan</TabsTrigger>
              </TabsList>

              {/* MACROS TAB */}
              <TabsContent value="macros" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Set daily calorie and macronutrient targets for this client.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Daily Calories</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 2000"
                      value={macros.calories}
                      onChange={(e) => setMacros({ ...macros, calories: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Protein (g)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 150"
                      value={macros.protein}
                      onChange={(e) => setMacros({ ...macros, protein: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Carbs (g)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 200"
                      value={macros.carbs}
                      onChange={(e) => setMacros({ ...macros, carbs: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Fat (g)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 60"
                      value={macros.fat}
                      onChange={(e) => setMacros({ ...macros, fat: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Coach Notes</Label>
                  <Textarea
                    placeholder="Any dietary notes, allergies, preferences..."
                    value={macros.notes}
                    onChange={(e) => setMacros({ ...macros, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button onClick={handleSaveMacros} className="w-full" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save Macro Targets
                </Button>
              </TabsContent>

              {/* MEAL PLAN TAB */}
              <TabsContent value="meals" className="space-y-4 mt-4">
                {/* Day selector + Copy */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 overflow-x-auto pb-1 flex-1">
                    {DAYS.map((day, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedDay(idx)}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          selectedDay === idx
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs shrink-0 gap-1">
                        <Copy className="h-3 w-3" />
                        Copy Day
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-3" align="end">
                      <p className="text-xs font-semibold mb-2">
                        Copy {DAYS[selectedDay]}'s meals to:
                      </p>
                      <div className="space-y-2">
                        {DAYS.map((day, idx) => {
                          if (idx === selectedDay) return null;
                          return (
                            <label key={idx} className="flex items-center gap-2 text-sm cursor-pointer">
                              <Checkbox
                                checked={copyTargetDays.includes(idx)}
                                onCheckedChange={(checked) => {
                                  setCopyTargetDays((prev) =>
                                    checked ? [...prev, idx] : prev.filter((d) => d !== idx)
                                  );
                                }}
                              />
                              {day}
                            </label>
                          );
                        })}
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-3 text-xs"
                        disabled={copyTargetDays.length === 0 || copyingDay}
                        onClick={handleCopyDay}
                      >
                        {copyingDay ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                        Copy to {copyTargetDays.length} day{copyTargetDays.length !== 1 ? "s" : ""}
                      </Button>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Live macro calculator */}
                {(() => {
                  const dayItems = mealPlanItems.filter((i) => i.day_of_week === selectedDay);
                  const totals = dayItems.reduce(
                    (acc, item) => {
                      const m = getItemMacros(item);
                      return {
                        calories: acc.calories + m.calories,
                        protein: acc.protein + m.protein,
                        carbs: acc.carbs + m.carbs,
                        fat: acc.fat + m.fat,
                      };
                    },
                    { calories: 0, protein: 0, carbs: 0, fat: 0 }
                  );

                  return (
                    <div className="grid grid-cols-4 gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="text-center">
                        <p className="text-lg font-bold">{Math.round(totals.calories)}</p>
                        <p className="text-[10px] text-muted-foreground">Kcal</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{Math.round(totals.protein * 10) / 10}g</p>
                        <p className="text-[10px] text-muted-foreground">Protein</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{Math.round(totals.carbs * 10) / 10}g</p>
                        <p className="text-[10px] text-muted-foreground">Carbs</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{Math.round(totals.fat * 10) / 10}g</p>
                        <p className="text-[10px] text-muted-foreground">Fat</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Meal picker overlay */}
                {addingMeal && (
                  <div className="border border-border rounded-lg p-3 space-y-2 bg-muted/50">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        Add {addingMeal.type} for {DAYS[selectedDay]}
                      </p>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setAddingMeal(null); setMealSearch(""); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-20">
                        <Input
                          type="number"
                          min="0.1"
                          step="0.5"
                          placeholder="Qty"
                          value={addingMeal.quantity}
                          onChange={(e) => setAddingMeal({ ...addingMeal, quantity: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <Select
                        value={addingMeal.unit}
                        onValueChange={(v) => setAddingMeal({ ...addingMeal, unit: v })}
                      >
                        <SelectTrigger className="h-8 text-sm w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="serving">Serving</SelectItem>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="oz">oz</SelectItem>
                          <SelectItem value="qty">Qty</SelectItem>
                          <SelectItem value="cup">Cup</SelectItem>
                          <SelectItem value="tbsp">Tbsp</SelectItem>
                          <SelectItem value="ml">ml</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Input
                        type="time"
                        value={addingMeal.time}
                        onChange={(e) => setAddingMeal({ ...addingMeal, time: e.target.value })}
                        className="h-8 text-sm w-32"
                        placeholder="Time"
                      />
                    </div>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search meals..."
                        value={mealSearch}
                        onChange={(e) => setMealSearch(e.target.value)}
                        className="pl-8 h-8 text-sm"
                        autoFocus
                      />
                    </div>
                    <ScrollArea className="h-72">
                      <div className="space-y-1">
                        {filteredMeals.map((meal) => (
                          <button
                            key={meal.id}
                            className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-accent flex items-center justify-between"
                            onClick={() => handleAddMealToPlan(meal.id)}
                          >
                            <span className="truncate">{meal.name}</span>
                            <span className="text-xs text-muted-foreground ml-2 shrink-0 flex gap-2">
                              {meal.calories && <span>{meal.calories} cal</span>}
                              {meal.protein && <span>{meal.protein}g P</span>}
                            </span>
                          </button>
                        ))}
                        {filteredMeals.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-2">No meals found</p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Grouped by meal type */}
                <div className="space-y-4">
                  {MEAL_TYPES.map((type) => {
                    const typeItems = mealPlanItems.filter(
                      (i) => i.day_of_week === selectedDay && i.meal_type === type.toLowerCase()
                    );
                    const typeTotals = typeItems.reduce(
                      (acc, item) => {
                        const m = getItemMacros(item);
                        return {
                          calories: acc.calories + m.calories,
                          protein: acc.protein + m.protein,
                          carbs: acc.carbs + m.carbs,
                          fat: acc.fat + m.fat,
                        };
                      },
                      { calories: 0, protein: 0, carbs: 0, fat: 0 }
                    );

                    return (
                      <div key={type} className="border border-border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-xs font-bold text-primary uppercase tracking-wider">{type}</p>
                            <div className="h-0.5 w-6 bg-primary mt-0.5 rounded-full" />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={() => setAddingMeal({ type, quantity: "1", unit: "serving", time: "" })}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>

                        {typeItems.length > 0 ? (
                          <div className="space-y-0">
                            {typeItems.map((item) => {
                              const meal = allMeals.find((m) => m.id === item.meal_id);
                              const qty = item.serving_quantity || 1;
                              const isExpanded = expandedItem === item.id;
                              const hasCustom = !!item.custom_ingredients && item.custom_ingredients.length > 0;
                              const itemMacros = getItemMacros(item);

                              return (
                                <div key={item.id} className="border-b border-border/30 last:border-0">
                                  <div className="flex items-center justify-between py-2 gap-2">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <button
                                        onClick={() => setExpandedItem(isExpanded ? null : item.id!)}
                                        className="shrink-0 p-0.5 hover:bg-muted rounded"
                                      >
                                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                                      </button>
                                      {item.scheduled_time && (
                                        <span className="text-[10px] text-primary font-medium shrink-0">
                                          {item.scheduled_time}
                                        </span>
                                      )}
                                      <span className="text-sm truncate">{getMealName(item.meal_id)}</span>
                                      {hasCustom && (
                                        <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded shrink-0">Custom</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Input
                                        type="number"
                                        min="0.1"
                                        step="0.5"
                                        value={qty}
                                        onChange={(e) => handleUpdateServings(item.id!, parseFloat(e.target.value) || 1, item.serving_unit || "serving")}
                                        className="h-7 w-16 text-xs text-center px-1"
                                      />
                                      <Select
                                        value={item.serving_unit || "serving"}
                                        onValueChange={(v) => handleUpdateServings(item.id!, qty, v)}
                                      >
                                        <SelectTrigger className="h-7 text-xs w-20 px-2">
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
                                      <div className="hidden sm:flex items-center gap-2 text-[10px] text-muted-foreground ml-1">
                                        <span>{Math.round(itemMacros.calories)}</span>
                                        <span>{Math.round(itemMacros.protein * 10) / 10}P</span>
                                        <span>{Math.round(itemMacros.carbs * 10) / 10}C</span>
                                        <span>{Math.round(itemMacros.fat * 10) / 10}F</span>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5"
                                        onClick={() => item.id && handleRemoveMealFromPlan(item.id)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  {/* Expandable structured ingredient editor + recipe info */}
                                  {isExpanded && (
                                    <div className="pb-3 pl-6 pr-2 space-y-3">
                                      <MealIngredientEditor
                                        foodItems={foodItems}
                                        ingredients={item.custom_ingredients && item.custom_ingredients.length > 0
                                          ? item.custom_ingredients
                                          : (meal?.default_ingredients || [])}
                                        onChange={(ings) => handleUpdateStructuredIngredients(item.id!, ings)}
                                        onReset={() => handleResetIngredients(item.id!)}
                                        hasCustom={hasCustom}
                                      />
                                      {meal?.ingredients && meal.ingredients.length > 0 && (
                                        <div className="pt-2 border-t border-border/30">
                                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Recipe Ingredients</p>
                                          <ul className="space-y-1">
                                            {meal.ingredients.map((ing: string, i: number) => (
                                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                                <span className="text-primary mt-0.5">•</span>
                                                {ing}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {/* Type subtotal */}
                            <div className="flex justify-end gap-2 pt-1.5 text-[10px]">
                              <Badge variant="secondary" className="text-[9px] font-bold">
                                {Math.round(typeTotals.calories)} Kcal
                              </Badge>
                              <Badge variant="secondary" className="text-[9px] font-bold">
                                {Math.round(typeTotals.protein * 10) / 10}g P
                              </Badge>
                              <Badge variant="secondary" className="text-[9px] font-bold">
                                {Math.round(typeTotals.carbs * 10) / 10}g C
                              </Badge>
                              <Badge variant="secondary" className="text-[9px] font-bold">
                                {Math.round(typeTotals.fat * 10) / 10}g F
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No meals assigned</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
