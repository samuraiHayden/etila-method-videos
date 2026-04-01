import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ExerciseCard } from "@/components/workout/ExerciseCard";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface DayWorkoutInlineProps {
  dayOfWeek: number;
  source: "day_exercises" | "program";
  workoutId?: string;
  workoutName?: string;
  dayLabel: string;
}

export function DayWorkoutInline({ dayOfWeek, source, workoutId, workoutName, dayLabel }: DayWorkoutInlineProps) {
  const { user } = useAuth();
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(null);

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ["inline-exercises", source, dayOfWeek, workoutId, user?.id],
    queryFn: async () => {
      if (source === "day_exercises") {
        const { data, error } = await supabase
          .from("user_day_exercises")
          .select(`id, exercise_id, sets, reps, order_index, notes, exercises (id, name, video_url, written_cues, coaching_tips)`)
          .eq("user_id", user!.id).eq("day_of_week", dayOfWeek).order("order_index");
        if (error) throw error;
        return (data || []).map((de) => ({
          id: de.id, exerciseId: (de.exercises as any)?.id, name: (de.exercises as any)?.name || "",
          sets: de.sets, reps: de.reps, videoUrl: (de.exercises as any)?.video_url,
          notes: de.notes || (de.exercises as any)?.written_cues || (de.exercises as any)?.coaching_tips,
        }));
      } else if (workoutId) {
        const [weRes, overridesRes] = await Promise.all([
          supabase.from("workout_exercises").select(`id, sets, reps, order_index, notes, exercises (id, name, video_url, written_cues, coaching_tips)`).eq("workout_id", workoutId).order("order_index"),
          supabase.from("user_exercise_overrides").select("workout_exercise_id, sets, reps, notes").eq("user_id", user!.id),
        ]);
        if (weRes.error) throw weRes.error;
        const overrideMap = new Map((overridesRes.data || []).map((o) => [o.workout_exercise_id, o]));
        return (weRes.data || []).map((we) => {
          const override = overrideMap.get(we.id);
          const ex = we.exercises as any;
          return {
            id: we.id, exerciseId: ex?.id, name: ex?.name || "",
            sets: override?.sets ?? we.sets, reps: override?.reps ?? we.reps, videoUrl: ex?.video_url,
            notes: override?.notes ?? we.notes ?? ex?.written_cues ?? ex?.coaching_tips,
          };
        });
      }
      return [];
    },
    enabled: !!user,
  });

  const { data: previousSetLogs = {} } = useQuery({
    queryKey: ["inline-prev-logs", user?.id, exercises.map((e) => e.exerciseId).join(",")],
    queryFn: async () => {
      if (!user || exercises.length === 0) return {};
      const exerciseIds = exercises.map((e) => e.exerciseId).filter(Boolean) as string[];
      if (exerciseIds.length === 0) return {};
      const { data: setLogs } = await supabase
        .from("set_logs").select(`exercise_id, set_number, weight, reps, workout_log_id, workout_logs!inner (user_id, completed_at, workout_date)`)
        .in("exercise_id", exerciseIds).eq("workout_logs.user_id", user.id)
        .not("workout_logs.completed_at", "is", null).order("workout_logs(workout_date)", { ascending: false });
      const grouped: Record<string, { setNumber: number; weight: number | null; reps: number | null }[]> = {};
      const seenExerciseLog: Record<string, string> = {};
      (setLogs || []).forEach((sl) => {
        if (!seenExerciseLog[sl.exercise_id]) seenExerciseLog[sl.exercise_id] = sl.workout_log_id;
        if (sl.workout_log_id !== seenExerciseLog[sl.exercise_id]) return;
        if (!grouped[sl.exercise_id]) grouped[sl.exercise_id] = [];
        grouped[sl.exercise_id].push({ setNumber: sl.set_number, weight: sl.weight, reps: sl.reps });
      });
      return grouped;
    },
    enabled: !!user && exercises.length > 0,
  });

  const { data: programDay } = useQuery({
    queryKey: ["inline-program-day", user?.id, dayOfWeek],
    queryFn: async () => {
      const { data } = await supabase.from("user_program_days").select("workout_id").eq("user_id", user!.id).eq("day_of_week", dayOfWeek).single();
      return data;
    },
    enabled: !!user && source === "day_exercises",
  });

  const logWorkoutId = source === "program" ? workoutId : programDay?.workout_id;

  useEffect(() => {
    if (!user || !logWorkoutId) return;
    (async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase.from("workout_logs").select("id").eq("user_id", user.id).eq("workout_id", logWorkoutId).eq("workout_date", today).single();
      if (existing) { setWorkoutLogId(existing.id); } else {
        const { data: created } = await supabase.from("workout_logs").insert({ user_id: user.id, workout_id: logWorkoutId, workout_date: today, started_at: new Date().toISOString() }).select("id").single();
        if (created) setWorkoutLogId(created.id);
      }
    })();
  }, [user, logWorkoutId]);

  const totalExercises = exercises.length;
  const progress = totalExercises > 0 ? (completedExercises.size / totalExercises) * 100 : 0;
  const workoutComplete = completedExercises.size === totalExercises && totalExercises > 0;

  const handleLogSet = async (exerciseId: string, setNumber: number, weight: string, reps: string) => {
    if (!workoutLogId || !user) return;
    try {
      await supabase.from("set_logs").upsert({ workout_log_id: workoutLogId, exercise_id: exerciseId, set_number: setNumber, weight: weight ? parseFloat(weight) : null, reps: reps ? parseInt(reps) : null }, { onConflict: "workout_log_id,exercise_id,set_number", ignoreDuplicates: false });
    } catch (error) { console.error("Error logging set:", error); }
  };

  const handleCompleteWorkout = async () => {
    if (!workoutLogId) return;
    try {
      await supabase.from("workout_logs").update({ completed_at: new Date().toISOString() }).eq("id", workoutLogId);
      toast.success("Workout completed! 💪");
    } catch (error) { toast.error("Failed to complete workout"); }
  };

  const handleExerciseComplete = (exerciseId: string, completed: boolean) => {
    setCompletedExercises((prev) => { const next = new Set(prev); if (completed) next.add(exerciseId); else next.delete(exerciseId); return next; });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl p-5 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-soft"
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/60">
          {dayLabel}
        </span>
        <h3 className="font-bold text-lg mt-1">
          {workoutName || `${totalExercises} Exercise${totalExercises !== 1 ? "s" : ""}`}
        </h3>
        <p className="text-xs text-primary-foreground/60 mt-1 line-clamp-1">
          {exercises.map((e) => e.name).join(" · ")}
        </p>
      </motion.div>

      {/* Progress */}
      <div className="rounded-2xl p-4 bg-card/80 backdrop-blur-xl border border-border/40 shadow-soft">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Progress</span>
          <span className="text-xs font-semibold text-muted-foreground">
            {completedExercises.size}/{totalExercises}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Exercises */}
      <div className="space-y-3">
        {exercises.map((ex, i) => {
          if (!ex.exerciseId) return null;
          const prevSets = previousSetLogs[ex.exerciseId];
          const prevBest = prevSets?.reduce(
            (best, s) => (s.weight != null && s.reps != null && (s.weight > (best?.weight ?? 0))) ? { weight: s.weight, reps: s.reps } : best,
            null as { weight: number; reps: number } | null
          );

          return (
            <motion.div key={ex.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
              <ExerciseCard
                id={ex.id} name={ex.name} sets={ex.sets} reps={ex.reps} defaultOpen
                videoUrl={ex.videoUrl ?? undefined} notes={ex.notes || undefined}
                previousBest={prevBest ?? undefined} previousSets={prevSets}
                onLogSet={(setNumber, weight, reps) => handleLogSet(ex.exerciseId, setNumber, weight, reps)}
                onExerciseComplete={handleExerciseComplete}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Complete Button */}
      <div className="pb-2">
        <Button
          size="lg"
          className="w-full h-14 text-lg font-semibold rounded-2xl shadow-soft"
          disabled={!workoutComplete}
          onClick={handleCompleteWorkout}
        >
          {workoutComplete ? (
            <><CheckCircle2 className="h-5 w-5 mr-2" />Complete Workout</>
          ) : (
            `${totalExercises - completedExercises.size} exercises remaining`
          )}
        </Button>
      </div>
    </div>
  );
}
