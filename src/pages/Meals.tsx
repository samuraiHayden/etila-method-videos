import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Clock, Flame, Loader2, UtensilsCrossed, BookOpen, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { MealPlanView } from "@/components/meals/MealPlanView";
import { motion } from "framer-motion";

interface Meal {
  id: string;
  name: string;
  description: string | null;
  category: string;
  image_url: string | null;
  prep_time_minutes: number | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  ingredients: string[] | null;
  instructions: string | null;
  isFavorite: boolean;
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const MealCard = ({ meal, onToggleFavorite, onClick }: { meal: Meal; onToggleFavorite: (id: string) => void; onClick: () => void }) => (
  <motion.div
    variants={fadeUp}
    className="group relative bg-card/80 backdrop-blur-xl rounded-2xl border border-border/40 overflow-hidden cursor-pointer hover:shadow-elevated transition-all duration-300 hover:border-border/60"
    onClick={onClick}
  >
    <div className="flex items-center gap-4 p-3">
      <div className="w-16 h-16 shrink-0 rounded-xl bg-secondary/60 flex items-center justify-center overflow-hidden">
        {meal.image_url ? (
          <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover" />
        ) : (
          <UtensilsCrossed className="h-5 w-5 text-muted-foreground/30" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm leading-tight line-clamp-1">{meal.name}</h3>
        <div className="flex items-center gap-3 mt-1.5">
          {meal.calories != null && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
              <Flame className="h-3 w-3 text-warning" />{meal.calories} cal
            </span>
          )}
          {meal.protein != null && (
            <span className="text-[11px] text-muted-foreground font-medium">{meal.protein}g P</span>
          )}
          {meal.prep_time_minutes != null && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />{meal.prep_time_minutes}m
            </span>
          )}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(meal.id); }}
        className="p-2.5 rounded-full hover:bg-muted/60 transition-colors shrink-0"
      >
        <Heart className={cn("h-4 w-4 transition-all", meal.isFavorite ? "text-primary fill-primary scale-110" : "text-muted-foreground/30")} />
      </button>
    </div>
  </motion.div>
);

const MealDetailDialog = ({ meal, open, onOpenChange, onToggleFavorite }: { meal: Meal | null; open: boolean; onOpenChange: (o: boolean) => void; onToggleFavorite: (id: string) => void }) => {
  if (!meal) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] p-0 overflow-hidden rounded-2xl">
        <ScrollArea className="max-h-[90vh]">
          <div className="aspect-video bg-secondary/40 flex items-center justify-center relative">
            {meal.image_url ? (
              <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover" />
            ) : (
              <ChefHat className="h-12 w-12 text-muted-foreground/20" />
            )}
            <button
              onClick={() => onToggleFavorite(meal.id)}
              className="absolute bottom-3 right-3 p-2.5 rounded-full bg-card/80 backdrop-blur-sm border border-border/40 hover:bg-card transition-colors shadow-soft"
            >
              <Heart className={cn("h-5 w-5 transition-colors", meal.isFavorite ? "text-primary fill-primary" : "text-muted-foreground")} />
            </button>
          </div>
          <div className="p-6 space-y-5">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{meal.name}</DialogTitle>
            </DialogHeader>
            {meal.description && <p className="text-sm text-muted-foreground leading-relaxed">{meal.description}</p>}
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: meal.calories, unit: "", label: "Calories" },
                { val: meal.protein, unit: "g", label: "Protein" },
                { val: meal.carbs, unit: "g", label: "Carbs" },
                { val: meal.fat, unit: "g", label: "Fat" },
              ].filter(m => m.val != null).map((m) => (
                <div key={m.label} className="text-center p-3 rounded-xl bg-secondary/50 border border-border/30">
                  <p className="text-lg font-bold">{m.val}{m.unit}</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{m.label}</p>
                </div>
              ))}
            </div>
            {meal.prep_time_minutes && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Prep time: {meal.prep_time_minutes} minutes</span>
              </div>
            )}
            {meal.ingredients && meal.ingredients.length > 0 && (
              <>
                <Separator className="bg-border/30" />
                <div>
                  <h3 className="font-semibold mb-3 text-sm">Ingredients</h3>
                  <ul className="space-y-2">
                    {meal.ingredients.map((ing, i) => (
                      <li key={i} className="text-sm flex items-start gap-2.5 text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
            {meal.instructions && (
              <>
                <Separator className="bg-border/30" />
                <div>
                  <h3 className="font-semibold mb-3 text-sm">Instructions</h3>
                  <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{meal.instructions}</div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const CATEGORIES = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch/dinner", label: "Meals" },
  { key: "snack", label: "Snacks" },
  { key: "favorites", label: "Saved" },
] as const;

const MealsPage = () => {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [hasMealPlan, setHasMealPlan] = useState(false);
  const [activeTab, setActiveTab] = useState<"my-plan" | "cookbook">("my-plan");
  const [activeCategory, setActiveCategory] = useState("breakfast");

  useEffect(() => {
    if (user) fetchMeals();
  }, [user]);

  async function fetchMeals() {
    try {
      const [mealsRes, favoritesRes, planRes] = await Promise.all([
        supabase.from("meals").select("*").order("name"),
        supabase.from("user_favorite_meals").select("meal_id").eq("user_id", user!.id),
        supabase.from("meal_plans").select("id").eq("user_id", user!.id).limit(1),
      ]);
      const favoriteIds = new Set(favoritesRes.data?.map((f) => f.meal_id) || []);
      setFavorites(favoriteIds);
      setMeals((mealsRes.data || []).map((meal) => ({ ...meal, isFavorite: favoriteIds.has(meal.id) })));
      const hasPlan = (planRes.data || []).length > 0;
      setHasMealPlan(hasPlan);
      if (!hasPlan) setActiveTab("cookbook");
    } catch (error) {
      console.error("Error fetching meals:", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite(mealId: string) {
    if (!user) return;
    try {
      if (favorites.has(mealId)) {
        await supabase.from("user_favorite_meals").delete().eq("user_id", user.id).eq("meal_id", mealId);
        setFavorites((prev) => { const next = new Set(prev); next.delete(mealId); return next; });
        toast.success("Removed from favorites");
      } else {
        await supabase.from("user_favorite_meals").insert({ user_id: user.id, meal_id: mealId });
        setFavorites((prev) => new Set([...prev, mealId]));
        toast.success("Added to favorites");
      }
      setMeals((prev) => prev.map((m) => m.id === mealId ? { ...m, isFavorite: !m.isFavorite } : m));
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorites");
    }
  }

  const filterByCategory = (category: string): Meal[] => {
    if (category === "favorites") return meals.filter((m) => m.isFavorite);
    return meals.filter((m) => m.category.toLowerCase() === category);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  const categoryMeals = filterByCategory(activeCategory);

  return (
    <AppShell>
      {/* iOS-style header */}
      <div className="px-5 pt-14 pb-2 safe-top">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-[34px] font-bold tracking-tight"
        >
          Nutrition
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-muted-foreground text-sm mt-0.5"
        >
          Fuel your fitness
        </motion.p>
      </div>

      <div className="px-5 pb-28">
        {/* Tab switcher — pill style */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.35 }}
          className="mt-4 mb-6"
        >
          <div className="flex bg-secondary/60 rounded-xl p-1 border border-border/30">
            {[
              { key: "my-plan" as const, label: "My Plan", icon: UtensilsCrossed },
              { key: "cookbook" as const, label: "Cookbook", icon: BookOpen },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
                  activeTab === tab.key
                    ? "bg-card shadow-soft text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* MY PLAN TAB */}
        {activeTab === "my-plan" && (
          <motion.div
            key="my-plan"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {user && <MealPlanView userId={user.id} />}
          </motion.div>
        )}

        {/* COOKBOOK TAB */}
        {activeTab === "cookbook" && (
          <motion.div
            key="cookbook"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {meals.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/60 flex items-center justify-center">
                  <ChefHat className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <h2 className="text-lg font-semibold mb-1">No Recipes Yet</h2>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  Recipes will appear here when your coach adds them to the cookbook.
                </p>
              </div>
            ) : (
              <>
                {/* Category pills */}
                <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
                  {CATEGORIES.map((cat) => {
                    const count = filterByCategory(cat.key).length;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => setActiveCategory(cat.key)}
                        className={cn(
                          "shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border",
                          activeCategory === cat.key
                            ? "bg-primary text-primary-foreground border-primary shadow-soft"
                            : "bg-card/80 text-muted-foreground border-border/40 hover:border-border hover:text-foreground"
                        )}
                      >
                        {cat.label}
                        {count > 0 && (
                          <span className={cn(
                            "ml-1.5 text-[10px]",
                            activeCategory === cat.key ? "text-primary-foreground/70" : "text-muted-foreground/60"
                          )}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Meal cards */}
                {categoryMeals.length > 0 ? (
                  <motion.div
                    className="space-y-3"
                    initial="hidden"
                    animate="visible"
                    key={activeCategory}
                  >
                    {categoryMeals.map((meal, i) => (
                      <MealCard
                        key={meal.id}
                        meal={meal}
                        onToggleFavorite={toggleFavorite}
                        onClick={() => setSelectedMeal(meal)}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    {activeCategory === "favorites" ? (
                      <>
                        <Heart className="h-8 w-8 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">No saved meals yet</p>
                        <p className="text-xs mt-1">Tap the heart icon to save meals here</p>
                      </>
                    ) : (
                      <>
                        <UtensilsCrossed className="h-8 w-8 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">No {CATEGORIES.find(c => c.key === activeCategory)?.label.toLowerCase()} recipes yet</p>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>

      <MealDetailDialog
        meal={selectedMeal}
        open={!!selectedMeal}
        onOpenChange={(open) => { if (!open) setSelectedMeal(null); }}
        onToggleFavorite={(id) => {
          toggleFavorite(id);
          setSelectedMeal((prev) => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
        }}
      />
    </AppShell>
  );
};

export default MealsPage;
