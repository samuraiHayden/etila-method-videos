import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExerciseCard } from "@/components/workout/ExerciseCard";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dumbbell } from "lucide-react";
import { motion } from "framer-motion";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DayWorkoutDetail = () => {
  const { dayOfWeek } = useParams<{ dayOfWeek: string }>();
  const { user } = useAuth();
  const dow = parseInt(dayOfWeek || "0");
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(null);

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ["day-exercises", dow, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_day_exercises").select(`id, exercise_id, sets, reps, order_index, notes, exercises (id, name, video_url, written_cues, coaching_tips)`)
        .eq("user_id", user!.id).eq("day_of_week", dow).order("order_index");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !isNaN(dow),
  });

  const { data: previousSetLogs = {} } = useQuery({
    queryKey: ["previous-day-set-logs", user?.id, exercises.map((e) => (e.exercises as any)?.id).join(",")],
    queryFn: async () => {
      if (!user || exercises.length === 0) return {};
      const exerciseIds = exercises.map((e) => (e.exercises as any)?.id).filter(Boolean) as string[];
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
    queryKey: ["user-program-day", user?.id, dow],
    queryFn: async () => {
      const { data } = await supabase.from("user_program_days").select("workout_id").eq("user_id", user!.id).eq("day_of_week", dow).single();
      return data;
    },
    enabled: !!user && !isNaN(dow),
  });

  useEffect(() => {
    if (!user || !programDay?.workout_id) return;
    const workoutId = programDay.workout_id;
    (async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase.from("workout_logs").select("id").eq("user_id", user.id).eq("workout_id", workoutId).eq("workout_date", today).single();
      if (existing) { setWorkoutLogId(existing.id); } else {
        const { data: created } = await supabase.from("workout_logs").insert({ user_id: user.id, workout_id: workoutId, workout_date: today, started_at: new Date().toISOString() }).select("id").single();
        if (created) setWorkoutLogId(created.id);
      }
    })();
  }, [user, programDay?.workout_id]);

  const totalExercises = exercises.length;
  const progress = totalExercises > 0 ? (completedExercises.size / totalExercises) * 100 : 0;

  const handleLogSet = async (exerciseId: string, setNumber: number, weight: string, reps: string) => {
    if (!workoutLogId || !user) return;
    try {
      await supabase.from("set_logs").upsert({ workout_log_id: workoutLogId, exercise_id: exerciseId, set_number: setNumber, weight: weight ? parseFloat(weight) : null, reps: reps ? parseInt(reps) : null }, { onConflict: "workout_log_id,exercise_id,set_number", ignoreDuplicates: false });
    } catch (error) { console.error("Error logging set:", error); }
  };

  const handleExerciseComplete = (exerciseId: string, completed: boolean) => {
    setCompletedExercises((prev) => { const next = new Set(prev); if (completed) next.add(exerciseId); else next.delete(exerciseId); return next; });
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="px-5 py-4 space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={DAY_NAMES[dow] || "Workout"}
        subtitle={`${totalExercises} exercises`}
        showBack
        variant="hero"
        actions={
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Dumbbell className="h-4 w-4" />
              {totalExercises}
            </span>
          </div>
        }
      />

      <div className="px-5 py-4 pb-28 space-y-4">
        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl p-4 bg-card/80 backdrop-blur-xl border border-border/40 shadow-soft"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Progress</span>
            <span className="text-xs font-semibold text-muted-foreground">
              {completedExercises.size}/{totalExercises}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </motion.div>

        {/* Exercises */}
        <div className="space-y-3">
          {exercises.map((de, i) => {
            const exercise = de.exercises as { id: string; name: string; video_url: string | null; written_cues: string | null; coaching_tips: string | null } | null;
            if (!exercise) return null;
            const prevSets = previousSetLogs[exercise.id];
            const prevBest = prevSets?.reduce(
              (best, s) => (s.weight != null && s.reps != null && (s.weight > (best?.weight ?? 0))) ? { weight: s.weight, reps: s.reps } : best,
              null as { weight: number; reps: number } | null
            );

            return (
              <motion.div key={de.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
                <ExerciseCard
                  id={de.id} name={exercise.name} sets={de.sets} reps={de.reps} defaultOpen
                  videoUrl={exercise.video_url ?? undefined}
                  notes={de.notes || exercise.written_cues || exercise.coaching_tips || undefined}
                  previousBest={prevBest ?? undefined} previousSets={prevSets}
                  onLogSet={(setNumber, weight, reps) => handleLogSet(exercise.id, setNumber, weight, reps)}
                  onExerciseComplete={handleExerciseComplete}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
};

export default DayWorkoutDetail;
