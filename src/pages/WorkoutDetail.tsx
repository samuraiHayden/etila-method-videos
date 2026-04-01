import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExerciseCard } from "@/components/workout/ExerciseCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, Dumbbell } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const WorkoutDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(null);

  const { data: workout, isLoading: workoutLoading } = useQuery({
    queryKey: ["workout", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("workouts").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: exercises = [], isLoading: exercisesLoading } = useQuery({
    queryKey: ["workout-exercises", id, user?.id],
    queryFn: async () => {
      const [weRes, overridesRes] = await Promise.all([
        supabase.from("workout_exercises").select(`id, sets, reps, order_index, notes, exercises (id, name, video_url, written_cues, coaching_tips)`).eq("workout_id", id!).order("order_index"),
        user ? supabase.from("user_exercise_overrides").select("workout_exercise_id, sets, reps, notes").eq("user_id", user.id) : Promise.resolve({ data: [] }),
      ]);
      if (weRes.error) throw weRes.error;
      const overrideMap = new Map((overridesRes.data || []).map((o) => [o.workout_exercise_id, o]));
      return (weRes.data || []).map((we) => {
        const override = overrideMap.get(we.id);
        return { ...we, sets: override?.sets ?? we.sets, reps: override?.reps ?? we.reps, notes: override?.notes ?? we.notes };
      });
    },
    enabled: !!id,
  });

  const { data: previousSetLogs = {} } = useQuery({
    queryKey: ["previous-set-logs", id, user?.id],
    queryFn: async () => {
      if (!user || !id) return {};
      const { data: lastLog } = await supabase.from("workout_logs").select("id").eq("user_id", user.id).eq("workout_id", id).not("completed_at", "is", null).order("workout_date", { ascending: false }).limit(1).single();
      if (!lastLog) return {};
      const { data: setLogs } = await supabase.from("set_logs").select("exercise_id, set_number, weight, reps").eq("workout_log_id", lastLog.id).order("set_number");
      const grouped: Record<string, { setNumber: number; weight: number | null; reps: number | null }[]> = {};
      (setLogs || []).forEach((sl) => {
        if (!grouped[sl.exercise_id]) grouped[sl.exercise_id] = [];
        grouped[sl.exercise_id].push({ setNumber: sl.set_number, weight: sl.weight, reps: sl.reps });
      });
      return grouped;
    },
    enabled: !!id && !!user,
  });

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase.from("workout_logs").select("id").eq("user_id", user.id).eq("workout_id", id).eq("workout_date", today).single();
      if (existing) { setWorkoutLogId(existing.id); } else {
        const { data: created } = await supabase.from("workout_logs").insert({ user_id: user.id, workout_id: id, workout_date: today, started_at: new Date().toISOString() }).select("id").single();
        if (created) setWorkoutLogId(created.id);
      }
    })();
  }, [user, id]);

  const isLoading = workoutLoading || exercisesLoading;
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
      navigate(-1);
    } catch (error) { toast.error("Failed to complete workout"); }
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
        title={workout?.name ?? "Workout"}
        subtitle={workout?.description ?? ""}
        showBack
        variant="hero"
        actions={
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {workout?.duration_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {workout.duration_minutes} min
              </span>
            )}
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
          {exercises.map((we, i) => {
            const exercise = we.exercises as { id: string; name: string; video_url: string | null; written_cues: string | null; coaching_tips: string | null } | null;
            if (!exercise) return null;
            const prevSets = previousSetLogs[exercise.id];
            const prevBest = prevSets?.reduce(
              (best, s) => (s.weight != null && s.reps != null && (s.weight > (best?.weight ?? 0))) ? { weight: s.weight, reps: s.reps } : best,
              null as { weight: number; reps: number } | null
            );

            return (
              <motion.div key={we.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
                <ExerciseCard
                  id={we.id} name={exercise.name} sets={we.sets} reps={we.reps} defaultOpen
                  videoUrl={exercise.video_url ?? undefined}
                  notes={we.notes || exercise.written_cues || exercise.coaching_tips || undefined}
                  previousBest={prevBest ?? undefined} previousSets={prevSets}
                  onLogSet={(setNumber, weight, reps) => handleLogSet(exercise.id, setNumber, weight, reps)}
                  onExerciseComplete={(exId, completed) => {
                    setCompletedExercises((prev) => { const next = new Set(prev); if (completed) next.add(exId); else next.delete(exId); return next; });
                  }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Complete Workout Button */}
        <div className="sticky bottom-20 pt-4 pb-2 bg-gradient-to-t from-background via-background to-transparent">
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
    </AppShell>
  );
};

export default WorkoutDetail;
