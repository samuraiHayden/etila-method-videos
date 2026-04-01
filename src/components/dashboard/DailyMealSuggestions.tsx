import { useState, useEffect } from "react";
import { Clock, Flame, UtensilsCrossed } from "lucide-react";
import { isToday, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Meal {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
  prep_time_minutes: number | null;
  calories: number | null;
  protein: number | null;
}

interface DailyMealItem {
  mealType: string;
  meal: Meal;
  scheduledTime: string | null;
}

interface DailyMealSuggestionsProps {
  userId: string;
  selectedDate?: Date;
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function DailyMealSuggestions({ userId, selectedDate }: DailyMealSuggestionsProps) {
  const [items, setItems] = useState<DailyMealItem[]>([]);
  const [loading, setLoading] = useState(true);

  const targetDate = selectedDate || new Date();

  useEffect(() => {
    fetchDayMeals();
  }, [userId, selectedDate]);

  async function fetchDayMeals() {
    setLoading(true);
    try {
      const jsDay = targetDate.getDay();
      const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

      // Get the user's latest meal plan
      const { data: plan, error: planError } = await supabase
        .from("meal_plans")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!plan) {
        setItems([]);
        setLoading(false);
        return;
      }

      const { data: allItems } = await supabase
        .from("meal_plan_items")
        .select("meal_id, meal_type, scheduled_time, day_of_week")
        .eq("meal_plan_id", plan.id);

      const planItems = (allItems || []).filter(i => i.day_of_week === dayOfWeek);

      if (!planItems || planItems.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      // Fetch meal details
      const mealIds = [...new Set(planItems.map((i) => i.meal_id))];
      const { data: meals } = await supabase
        .from("meals")
        .select("id, name, category, image_url, prep_time_minutes, calories, protein")
        .in("id", mealIds);

      const mealsMap = new Map((meals || []).map((m) => [m.id, m]));

      // Sort by meal type order, then by scheduled time
      const typeOrder: Record<string, number> = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };
      const result: DailyMealItem[] = planItems
        .map((item) => ({
          mealType: item.meal_type,
          meal: mealsMap.get(item.meal_id)!,
          scheduledTime: item.scheduled_time,
        }))
        .filter((i) => i.meal)
        .sort((a, b) => {
          const orderDiff = (typeOrder[a.mealType] ?? 4) - (typeOrder[b.mealType] ?? 4);
          if (orderDiff !== 0) return orderDiff;
          if (a.scheduledTime && b.scheduledTime) return a.scheduledTime.localeCompare(b.scheduledTime);
          return 0;
        });

      setItems(result);
    } catch (error) {
      console.error("Error fetching daily meals:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{isToday(targetDate) ? "Today's Meals" : `${format(targetDate, "EEEE")}'s Meals`}</h2>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const dayLabel = isToday(targetDate) ? "Today's Meals" : `${format(targetDate, "EEEE")}'s Meals`;

  if (items.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3">{dayLabel}</h2>
        <div className="bg-card rounded-xl shadow-card p-4 text-center">
          <UtensilsCrossed className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No meals assigned for {isToday(targetDate) ? "today" : format(targetDate, "EEEE")}</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">{dayLabel}</h2>
      <div className="space-y-2">
        {items.map(({ mealType, meal, scheduledTime }, idx) => (
          <div
            key={`${meal.id}-${idx}`}
            className="bg-card rounded-xl shadow-card p-3 flex items-center gap-3"
          >
            <div className="w-14 h-14 rounded-lg bg-secondary flex-shrink-0 overflow-hidden flex items-center justify-center">
              {meal.image_url ? (
                <img
                  src={meal.image_url}
                  alt={meal.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl">🍽️</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {mealType}
                </p>
                {scheduledTime && (
                  <span className="text-xs text-primary font-semibold">
                    {formatTime12h(scheduledTime)}
                  </span>
                )}
              </div>
              <p className="font-medium text-sm truncate">{meal.name}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                {meal.calories && (
                  <span className="flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    {meal.calories} cal
                  </span>
                )}
                {meal.protein && <span>{meal.protein}g protein</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
