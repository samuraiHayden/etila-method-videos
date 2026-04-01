import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Loader2, Search, UtensilsCrossed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Meal {
  id: string;
  name: string;
  description: string | null;
  category: string;
  ingredients: string[] | null;
  instructions: string | null;
  prep_time_minutes: number | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  image_url: string | null;
}

export default function AdminMeals() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "lunch" as string,
    ingredients: "",
    instructions: "",
    prep_time_minutes: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    image_url: "",
  });

  useEffect(() => {
    fetchMeals();
  }, []);

  async function fetchMeals() {
    try {
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .order("name");

      if (error) throw error;
      setMeals(data || []);
    } catch (error) {
      console.error("Error fetching meals:", error);
      toast.error("Failed to load meals");
    } finally {
      setLoading(false);
    }
  }

  function openDialog(meal?: Meal) {
    if (meal) {
      setEditingMeal(meal);
      setForm({
        name: meal.name,
        description: meal.description || "",
        category: meal.category,
        ingredients: meal.ingredients?.join("\n") || "",
        instructions: meal.instructions || "",
        prep_time_minutes: meal.prep_time_minutes?.toString() || "",
        calories: meal.calories?.toString() || "",
        protein: meal.protein?.toString() || "",
        carbs: meal.carbs?.toString() || "",
        fat: meal.fat?.toString() || "",
        image_url: meal.image_url || "",
      });
    } else {
      setEditingMeal(null);
      setForm({
        name: "",
        description: "",
        category: "lunch",
        ingredients: "",
        instructions: "",
        prep_time_minutes: "",
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
        image_url: "",
      });
    }
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    const data = {
      name: form.name,
      description: form.description || null,
      category: form.category,
      ingredients: form.ingredients
        ? form.ingredients.split("\n").map((i) => i.trim()).filter(Boolean)
        : null,
      instructions: form.instructions || null,
      prep_time_minutes: form.prep_time_minutes
        ? parseInt(form.prep_time_minutes)
        : null,
      calories: form.calories ? parseInt(form.calories) : null,
      protein: form.protein ? parseFloat(form.protein) : null,
      carbs: form.carbs ? parseFloat(form.carbs) : null,
      fat: form.fat ? parseFloat(form.fat) : null,
      image_url: form.image_url || null,
    };

    try {
      if (editingMeal) {
        const { error } = await supabase
          .from("meals")
          .update(data)
          .eq("id", editingMeal.id);
        if (error) throw error;
        toast.success("Meal updated");
      } else {
        const { error } = await supabase
          .from("meals")
          .insert({ ...data, created_by: user?.id });
        if (error) throw error;
        toast.success("Meal created");
      }

      setDialogOpen(false);
      fetchMeals();
    } catch (error) {
      console.error("Error saving meal:", error);
      toast.error("Failed to save meal");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this meal?")) return;

    try {
      const { error } = await supabase.from("meals").delete().eq("id", id);
      if (error) throw error;
      toast.success("Meal deleted");
      fetchMeals();
    } catch (error) {
      console.error("Error deleting meal:", error);
      toast.error("Failed to delete meal");
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "breakfast":
        return "bg-yellow-500/10 text-yellow-700";
      case "lunch":
        return "bg-green-500/10 text-green-700";
      case "dinner":
        return "bg-blue-500/10 text-blue-700";
      case "snack":
        return "bg-purple-500/10 text-purple-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredMeals = meals.filter((meal) => {
    const matchesSearch = meal.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || meal.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Cookbook</h1>
            <p className="text-muted-foreground">Manage meal recipes</p>
          </div>
          <Button onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Meal
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search meals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="breakfast">Breakfast</SelectItem>
              <SelectItem value="lunch">Lunch</SelectItem>
              <SelectItem value="dinner">Dinner</SelectItem>
              <SelectItem value="snack">Snack</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeals.map((meal) => (
            <Card key={meal.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UtensilsCrossed className="h-5 w-5 text-primary" />
                      {meal.name}
                    </CardTitle>
                    <Badge className={getCategoryColor(meal.category) + " mt-2"}>
                      {meal.category}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDialog(meal)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(meal.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {meal.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {meal.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {meal.prep_time_minutes && (
                    <span>⏱️ {meal.prep_time_minutes} min</span>
                  )}
                  {meal.calories && <span>🔥 {meal.calories} cal</span>}
                  {meal.protein && <span>💪 {meal.protein}g protein</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredMeals.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No meals found. Create your first recipe!
          </div>
        )}

        {/* Meal Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMeal ? "Edit Meal" : "Add Meal"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="ml-name">Meal Name</Label>
                <Input
                  id="ml-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ml-category">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm({ ...form, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ml-desc">Description</Label>
                <Textarea
                  id="ml-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="ml-ingredients">Ingredients (one per line)</Label>
                <Textarea
                  id="ml-ingredients"
                  value={form.ingredients}
                  onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
                  placeholder="1 cup rice\n2 eggs\n..."
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="ml-instructions">Instructions</Label>
                <Textarea
                  id="ml-instructions"
                  value={form.instructions}
                  onChange={(e) =>
                    setForm({ ...form, instructions: e.target.value })
                  }
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ml-prep">Prep Time (min)</Label>
                  <Input
                    id="ml-prep"
                    type="number"
                    value={form.prep_time_minutes}
                    onChange={(e) =>
                      setForm({ ...form, prep_time_minutes: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="ml-cal">Calories</Label>
                  <Input
                    id="ml-cal"
                    type="number"
                    value={form.calories}
                    onChange={(e) => setForm({ ...form, calories: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="ml-protein">Protein (g)</Label>
                  <Input
                    id="ml-protein"
                    type="number"
                    step="0.1"
                    value={form.protein}
                    onChange={(e) => setForm({ ...form, protein: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="ml-carbs">Carbs (g)</Label>
                  <Input
                    id="ml-carbs"
                    type="number"
                    step="0.1"
                    value={form.carbs}
                    onChange={(e) => setForm({ ...form, carbs: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="ml-fat">Fat (g)</Label>
                  <Input
                    id="ml-fat"
                    type="number"
                    step="0.1"
                    value={form.fat}
                    onChange={(e) => setForm({ ...form, fat: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="ml-img">Image URL</Label>
                <Input
                  id="ml-img"
                  type="url"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <Button type="submit" className="w-full">
                {editingMeal ? "Save Changes" : "Create Meal"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
