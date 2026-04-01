import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2, RotateCcw, Dumbbell } from "lucide-react";
import { toast } from "sonner";

interface ExerciseRow {
  workoutExerciseId: string;
  exerciseName: string;
  defaultSets: number;
  defaultReps: string;
  defaultNotes: string | null;
  overrideSets: number | null;
  overrideReps: string | null;
  overrideNotes: string | null;
}

interface WorkoutExerciseEditorProps {
  workoutId: string;
  userId: string;
  workoutName: string;
}

export function WorkoutExerciseEditor({
  workoutId,
  userId,
  workoutName,
}: WorkoutExerciseEditorProps) {
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edits, setEdits] = useState<
    Record<string, { sets: string; reps: string; notes: string }>
  >({});

  useEffect(() => {
    fetchExercises();
  }, [workoutId, userId]);

  async function fetchExercises() {
    setLoading(true);
    try {
      const [weRes, overridesRes] = await Promise.all([
        supabase
          .from("workout_exercises")
          .select(
            "id, sets, reps, notes, order_index, exercises(name)"
          )
          .eq("workout_id", workoutId)
          .order("order_index"),
        supabase
          .from("user_exercise_overrides")
          .select("workout_exercise_id, sets, reps, notes")
          .eq("user_id", userId),
      ]);

      const overrideMap = new Map(
        (overridesRes.data || []).map((o) => [o.workout_exercise_id, o])
      );

      const rows: ExerciseRow[] = (weRes.data || []).map((we) => {
        const exercise = we.exercises as { name: string } | null;
        const override = overrideMap.get(we.id);
        return {
          workoutExerciseId: we.id,
          exerciseName: exercise?.name || "Unknown",
          defaultSets: we.sets,
          defaultReps: we.reps,
          defaultNotes: we.notes,
          overrideSets: override?.sets ?? null,
          overrideReps: override?.reps ?? null,
          overrideNotes: override?.notes ?? null,
        };
      });

      setExercises(rows);

      // Initialize edits with current values (override or default)
      const initialEdits: Record<string, { sets: string; reps: string; notes: string }> = {};
      rows.forEach((r) => {
        initialEdits[r.workoutExerciseId] = {
          sets: String(r.overrideSets ?? r.defaultSets),
          reps: r.overrideReps ?? r.defaultReps,
          notes: r.overrideNotes ?? r.defaultNotes ?? "",
        };
      });
      setEdits(initialEdits);
    } catch (err) {
      console.error("Error fetching exercises:", err);
    } finally {
      setLoading(false);
    }
  }

  function updateEdit(weId: string, field: "sets" | "reps" | "notes", value: string) {
    setEdits((prev) => ({
      ...prev,
      [weId]: { ...prev[weId], [field]: value },
    }));
  }

  function hasOverride(row: ExerciseRow): boolean {
    const edit = edits[row.workoutExerciseId];
    if (!edit) return false;
    return (
      edit.sets !== String(row.defaultSets) ||
      edit.reps !== row.defaultReps ||
      edit.notes !== (row.defaultNotes ?? "")
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Delete existing overrides for this user + these workout exercises
      const weIds = exercises.map((e) => e.workoutExerciseId);
      await supabase
        .from("user_exercise_overrides")
        .delete()
        .eq("user_id", userId)
        .in("workout_exercise_id", weIds);

      // Insert only overrides that differ from defaults
      const inserts = exercises
        .filter((row) => hasOverride(row))
        .map((row) => {
          const edit = edits[row.workoutExerciseId];
          return {
            user_id: userId,
            workout_exercise_id: row.workoutExerciseId,
            sets: parseInt(edit.sets) || row.defaultSets,
            reps: edit.reps || row.defaultReps,
            notes: edit.notes || null,
          };
        });

      if (inserts.length > 0) {
        const { error } = await supabase
          .from("user_exercise_overrides")
          .insert(inserts);
        if (error) throw error;
      }

      toast.success("Exercise overrides saved");
      fetchExercises();
    } catch (err) {
      console.error("Error saving overrides:", err);
      toast.error("Failed to save overrides");
    } finally {
      setSaving(false);
    }
  }

  function handleResetAll() {
    const reset: Record<string, { sets: string; reps: string; notes: string }> = {};
    exercises.forEach((r) => {
      reset[r.workoutExerciseId] = {
        sets: String(r.defaultSets),
        reps: r.defaultReps,
        notes: r.defaultNotes ?? "",
      };
    });
    setEdits(reset);
  }

  const anyOverrides = exercises.some((r) => hasOverride(r));

  if (loading) {
    return (
      <div className="space-y-2 py-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No exercises in this workout
      </p>
    );
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <Dumbbell className="h-3 w-3" />
          Exercises in {workoutName}
        </p>
        <div className="flex gap-1.5">
          {anyOverrides && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleResetAll}>
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
          <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
            Save
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        {exercises.map((row) => {
          const edit = edits[row.workoutExerciseId];
          if (!edit) return null;
          const isCustom = hasOverride(row);

          return (
            <div
              key={row.workoutExerciseId}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-background border border-border/50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate">
                    {row.exerciseName}
                  </span>
                  {isCustom && (
                    <Badge variant="default" className="text-[10px] h-4 px-1">
                      Custom
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Default: {row.defaultSets} × {row.defaultReps}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Input
                  type="number"
                  value={edit.sets}
                  onChange={(e) => updateEdit(row.workoutExerciseId, "sets", e.target.value)}
                  className="w-14 h-8 text-center text-sm"
                  min={1}
                />
                <span className="text-muted-foreground text-sm">×</span>
                <Input
                  value={edit.reps}
                  onChange={(e) => updateEdit(row.workoutExerciseId, "reps", e.target.value)}
                  className="w-16 h-8 text-center text-sm"
                  placeholder="reps"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
