import { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Save,
  CalendarDays,
  Plus,
  X,
  Dumbbell,
  Search,
  GripVertical,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface Exercise {
  id: string;
  name: string;
  level: string | null;
  muscle_groups: string[] | null;
  equipment: string[] | null;
}

interface DayExercise {
  exercise_id: string;
  sets: number;
  reps: string;
  order_index: number;
  notes: string | null;
}

const DAYS = [
  { index: 0, name: "Sunday", short: "Sun" },
  { index: 1, name: "Monday", short: "Mon" },
  { index: 2, name: "Tuesday", short: "Tue" },
  { index: 3, name: "Wednesday", short: "Wed" },
  { index: 4, name: "Thursday", short: "Thu" },
  { index: 5, name: "Friday", short: "Fri" },
  { index: 6, name: "Saturday", short: "Sat" },
];

const LEVEL_COLORS: Record<string, string> = {
  super_beginner: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  beginner: "bg-green-500/10 text-green-600 border-green-500/20",
  advanced: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

export default function AdminScheduling() {
  const location = useLocation();
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [schedule, setSchedule] = useState<Record<number, DayExercise[]>>({});
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [addingToDay, setAddingToDay] = useState<number | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>("all");

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      const [profilesRes, exercisesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("id, user_id, full_name, email, avatar_url").order("full_name"),
        supabase.from("exercises").select("id, name, level, muscle_groups, equipment").order("name"),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      const clientUserIds = new Set(
        (rolesRes.data || []).filter((r) => r.role === "client").map((r) => r.user_id)
      );
      const clientList = (profilesRes.data || []).filter((p) => clientUserIds.has(p.user_id));
      setClients(clientList);
      setAllExercises(exercisesRes.data || []);

      // Auto-select user if navigated from assign dialog
      const preselectedUserId = (location.state as any)?.preselectedUserId;
      if (preselectedUserId) {
        const preselected = clientList.find((c) => c.user_id === preselectedUserId);
        if (preselected) {
          // Defer to after state is set
          setTimeout(() => selectUser(preselected), 0);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function selectUser(user: UserProfile) {
    setSelectedUser(user);
    setAddingToDay(null);

    try {
      const { data: dayExercises } = await supabase
        .from("user_day_exercises")
        .select("day_of_week, exercise_id, sets, reps, order_index, notes")
        .eq("user_id", user.user_id)
        .order("order_index");

      const map: Record<number, DayExercise[]> = {};
      DAYS.forEach((d) => { map[d.index] = []; });
      (dayExercises || []).forEach((de) => {
        map[de.day_of_week].push({
          exercise_id: de.exercise_id,
          sets: de.sets,
          reps: de.reps,
          order_index: de.order_index,
          notes: de.notes,
        });
      });
      setSchedule(map);
    } catch (error) {
      console.error("Error loading user schedule:", error);
    }
  }

  const filteredExercises = useMemo(() => {
    let filtered = allExercises;
    if (levelFilter !== "all") {
      filtered = filtered.filter((e) => e.level === levelFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.muscle_groups?.some((mg) => mg.toLowerCase().includes(q)) ||
          e.equipment?.some((eq) => eq.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [allExercises, searchQuery, levelFilter]);

  function addExerciseToDay(dayIndex: number, exercise: Exercise) {
    setSchedule((prev) => {
      const current = prev[dayIndex] || [];
      // Don't add duplicate
      if (current.some((e) => e.exercise_id === exercise.id)) return prev;
      return {
        ...prev,
        [dayIndex]: [
          ...current,
          {
            exercise_id: exercise.id,
            sets: 3,
            reps: "10",
            order_index: current.length,
            notes: null,
          },
        ],
      };
    });
  }

  function removeExerciseFromDay(dayIndex: number, exerciseIndex: number) {
    setSchedule((prev) => {
      const current = [...(prev[dayIndex] || [])];
      current.splice(exerciseIndex, 1);
      return { ...prev, [dayIndex]: current.map((e, i) => ({ ...e, order_index: i })) };
    });
  }

  function updateExercise(dayIndex: number, exerciseIndex: number, field: "sets" | "reps", value: string) {
    setSchedule((prev) => {
      const current = [...(prev[dayIndex] || [])];
      if (field === "sets") {
        current[exerciseIndex] = { ...current[exerciseIndex], sets: parseInt(value) || 1 };
      } else {
        current[exerciseIndex] = { ...current[exerciseIndex], reps: value };
      }
      return { ...prev, [dayIndex]: current };
    });
  }

  function moveExercise(dayIndex: number, fromIdx: number, toIdx: number) {
    if (toIdx < 0) return;
    setSchedule((prev) => {
      const current = [...(prev[dayIndex] || [])];
      if (toIdx >= current.length) return prev;
      const [item] = current.splice(fromIdx, 1);
      current.splice(toIdx, 0, item);
      return { ...prev, [dayIndex]: current.map((e, i) => ({ ...e, order_index: i })) };
    });
  }

  async function handleSave() {
    if (!selectedUser) return;
    setSaving(true);

    try {
      // Delete existing
      const { error: deleteError } = await supabase
        .from("user_day_exercises")
        .delete()
        .eq("user_id", selectedUser.user_id);
      if (deleteError) throw deleteError;

      // Build rows
      const rows: {
        user_id: string;
        day_of_week: number;
        exercise_id: string;
        sets: number;
        reps: string;
        order_index: number;
        notes: string | null;
      }[] = [];

      Object.entries(schedule).forEach(([dayStr, exercises]) => {
        const dayOfWeek = parseInt(dayStr);
        exercises.forEach((ex, idx) => {
          rows.push({
            user_id: selectedUser.user_id,
            day_of_week: dayOfWeek,
            exercise_id: ex.exercise_id,
            sets: ex.sets,
            reps: ex.reps,
            order_index: idx,
            notes: ex.notes,
          });
        });
      });

      if (rows.length > 0) {
        const { error } = await supabase.from("user_day_exercises").insert(rows);
        if (error) throw error;
      }

      toast.success(`Schedule saved for ${selectedUser.full_name || selectedUser.email}`);
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast.error("Failed to save schedule");
    } finally {
      setSaving(false);
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    return email[0].toUpperCase();
  };

  const getExerciseName = (exerciseId: string) =>
    allExercises.find((e) => e.id === exerciseId)?.name || "Unknown";

  const getExerciseLevel = (exerciseId: string) =>
    allExercises.find((e) => e.id === exerciseId)?.level || null;

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
        <div>
          <h1 className="text-2xl font-bold">Client Scheduling</h1>
          <p className="text-muted-foreground">
            Assign individual exercises from the library to each day
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Select Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 max-h-[60vh] overflow-y-auto">
              {clients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No clients found</p>
              ) : (
                clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => selectUser(client)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      selectedUser?.id === client.id
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted"
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={client.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {getInitials(client.full_name, client.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {client.full_name || client.email}
                      </p>
                      {client.full_name && (
                        <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Schedule Editor */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  {selectedUser
                    ? `${selectedUser.full_name || selectedUser.email}'s Schedule`
                    : "Weekly Schedule"}
                </CardTitle>
                {selectedUser && (
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Save
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedUser ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Select a client to manage their schedule</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {DAYS.map((day) => {
                    const exercises = schedule[day.index] || [];
                    const isAdding = addingToDay === day.index;

                    return (
                      <div key={day.index} className="rounded-lg bg-muted/50 overflow-hidden">
                        <div className="flex items-center justify-between p-3 border-b border-border/30">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold w-24">{day.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                          <Button
                            variant={isAdding ? "default" : "outline"}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setAddingToDay(isAdding ? null : day.index)}
                          >
                            {isAdding ? (
                              <>
                                <X className="h-3 w-3 mr-1" />
                                Close
                              </>
                            ) : (
                              <>
                                <Plus className="h-3 w-3 mr-1" />
                                Add Exercise
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Exercise Picker */}
                        {isAdding && (
                          <div className="p-3 border-b border-border/30 bg-background/50">
                            <div className="flex gap-2 mb-2">
                              <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                  placeholder="Search exercises..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="pl-8 h-8 text-sm"
                                />
                              </div>
                              <Select value={levelFilter} onValueChange={setLevelFilter}>
                                <SelectTrigger className="w-36 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Levels</SelectItem>
                                  <SelectItem value="super_beginner">Super Beginner</SelectItem>
                                  <SelectItem value="beginner">Beginner</SelectItem>
                                  <SelectItem value="advanced">Advanced</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="max-h-48 overflow-y-auto space-y-1">
                              {filteredExercises.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-3">
                                  No exercises found
                                </p>
                              ) : (
                                filteredExercises.map((ex) => {
                                  const alreadyAdded = exercises.some((e) => e.exercise_id === ex.id);
                                  return (
                                    <button
                                      key={ex.id}
                                      onClick={() => !alreadyAdded && addExerciseToDay(day.index, ex)}
                                      disabled={alreadyAdded}
                                      className={`w-full flex items-center gap-2 p-2 rounded text-left text-sm transition-colors ${
                                        alreadyAdded
                                          ? "opacity-40 cursor-not-allowed"
                                          : "hover:bg-primary/10"
                                      }`}
                                    >
                                      <Dumbbell className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                      <span className="flex-1 truncate">{ex.name}</span>
                                      {ex.level && (
                                        <Badge
                                          variant="outline"
                                          className={`text-[10px] h-4 px-1 shrink-0 ${
                                            LEVEL_COLORS[ex.level] || ""
                                          }`}
                                        >
                                          {ex.level === "super_beginner"
                                            ? "SB"
                                            : ex.level === "beginner"
                                            ? "BEG"
                                            : "ADV"}
                                        </Badge>
                                      )}
                                      {alreadyAdded && (
                                        <span className="text-[10px] text-muted-foreground">Added</span>
                                      )}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}

                        {/* Assigned Exercises */}
                        {exercises.length > 0 && (
                          <div className="p-3 space-y-1.5">
                            {exercises.map((ex, idx) => {
                              const level = getExerciseLevel(ex.exercise_id);
                              return (
                                <div
                                  key={`${ex.exercise_id}-${idx}`}
                                  className="flex items-center gap-2 p-2 rounded-md bg-background border border-border/50"
                                >
                                  <div className="flex flex-col gap-0.5 shrink-0">
                                    <button
                                      onClick={() => moveExercise(day.index, idx, idx - 1)}
                                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                      disabled={idx === 0}
                                    >
                                      <GripVertical className="h-3 w-3" />
                                    </button>
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-sm font-medium truncate">
                                        {getExerciseName(ex.exercise_id)}
                                      </span>
                                      {level && (
                                        <Badge
                                          variant="outline"
                                          className={`text-[10px] h-4 px-1 shrink-0 ${
                                            LEVEL_COLORS[level] || ""
                                          }`}
                                        >
                                          {level === "super_beginner"
                                            ? "SB"
                                            : level === "beginner"
                                            ? "BEG"
                                            : "ADV"}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <Input
                                      type="number"
                                      value={ex.sets}
                                      onChange={(e) =>
                                        updateExercise(day.index, idx, "sets", e.target.value)
                                      }
                                      className="w-14 h-7 text-center text-xs"
                                      min={1}
                                    />
                                    <span className="text-muted-foreground text-xs">×</span>
                                    <Input
                                      value={ex.reps}
                                      onChange={(e) =>
                                        updateExercise(day.index, idx, "reps", e.target.value)
                                      }
                                      className="w-16 h-7 text-center text-xs"
                                      placeholder="reps"
                                    />
                                  </div>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="shrink-0 h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => removeExerciseFromDay(day.index, idx)}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {exercises.length === 0 && !isAdding && (
                          <div className="px-3 pb-3 pt-2">
                            <p className="text-xs text-muted-foreground">No exercises assigned</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
