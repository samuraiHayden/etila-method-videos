import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { WeeklyCalendar } from "@/components/workout/WeeklyCalendar";
import { DayWorkoutInline } from "@/components/workout/DayWorkoutInline";
import { Loader2, Dumbbell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, addDays } from "date-fns";
import { motion } from "framer-motion";

interface WorkoutDay {
  dayOfWeek: number;
  label: string;
  exerciseCount: number;
  exerciseNames: string[];
  source: "day_exercises" | "program";
  workoutId?: string;
  workoutName?: string;
}

interface WeekDayData {
  date: Date;
  hasWorkout: boolean;
  isCompleted: boolean;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const WorkoutsPage = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekData, setWeekData] = useState<WeekDayData[]>([]);
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSchedule, setHasSchedule] = useState(false);

  useEffect(() => {
    if (user) fetchScheduleData();
  }, [user]);

  async function fetchScheduleData() {
    try {
      const [dayExRes, programRes] = await Promise.all([
        supabase
          .from("user_day_exercises")
          .select("day_of_week, exercise_id, exercises (id, name)")
          .eq("user_id", user!.id)
          .order("order_index"),
        supabase
          .from("user_programs")
          .select("program_id, start_date, status")
          .eq("user_id", user!.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

      const dayExercises = dayExRes.data;
      const userPrograms = programRes.data;
      const days: WorkoutDay[] = [];
      const daysWithWorkouts = new Set<number>();

      if (dayExercises && dayExercises.length > 0) {
        const byDay: Record<number, typeof dayExercises> = {};
        for (const ex of dayExercises) {
          if (!byDay[ex.day_of_week]) byDay[ex.day_of_week] = [];
          byDay[ex.day_of_week].push(ex);
        }
        for (const [dowStr, exercises] of Object.entries(byDay)) {
          const dow = parseInt(dowStr);
          daysWithWorkouts.add(dow);
          days.push({
            dayOfWeek: dow, label: DAY_NAMES[dow], exerciseCount: exercises.length,
            exerciseNames: exercises.slice(0, 3).map((e) => (e.exercises as any)?.name || ""),
            source: "day_exercises",
          });
        }
      }

      if (userPrograms && userPrograms.length > 0) {
        const programId = userPrograms[0].program_id;
        const { data: programDays } = await supabase
          .from("program_days")
          .select("day_of_week, is_rest_day, workout_id, workouts (id, name, duration_minutes)")
          .eq("program_id", programId)
          .order("day_of_week");

        if (programDays) {
          const workoutIds = programDays
            .filter((pd) => !pd.is_rest_day && pd.workout_id && !daysWithWorkouts.has(pd.day_of_week))
            .map((pd) => pd.workout_id!);

          let exercisesByWorkout: Record<string, { name: string }[]> = {};
          if (workoutIds.length > 0) {
            const { data: allWe } = await supabase
              .from("workout_exercises")
              .select("workout_id, exercises (name)")
              .in("workout_id", workoutIds)
              .order("order_index");
            if (allWe) {
              for (const we of allWe) {
                if (!exercisesByWorkout[we.workout_id]) exercisesByWorkout[we.workout_id] = [];
                exercisesByWorkout[we.workout_id].push({ name: (we.exercises as any)?.name || "" });
              }
            }
          }

          for (const pd of programDays) {
            if (pd.is_rest_day || !pd.workout_id) continue;
            if (daysWithWorkouts.has(pd.day_of_week)) continue;
            const workout = pd.workouts as any;
            const exercises = exercisesByWorkout[pd.workout_id] || [];
            daysWithWorkouts.add(pd.day_of_week);
            days.push({
              dayOfWeek: pd.day_of_week, label: DAY_NAMES[pd.day_of_week],
              exerciseCount: exercises.length,
              exerciseNames: exercises.slice(0, 3).map((e) => e.name),
              source: "program", workoutId: pd.workout_id,
              workoutName: workout?.name || undefined,
            });
          }
        }
      }

      if (days.length === 0) { setHasSchedule(false); setLoading(false); return; }
      setHasSchedule(true);
      setWorkoutDays(days);

      const ws = startOfWeek(new Date(), { weekStartsOn: 0 });
      const weekDataArray: WeekDayData[] = [];
      for (let i = 0; i < 7; i++) {
        weekDataArray.push({ date: addDays(ws, i), hasWorkout: daysWithWorkouts.has(i), isCompleted: false });
      }
      setWeekData(weekDataArray);
    } catch (error) {
      console.error("Error fetching schedule:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="px-5 pt-14 pb-2 safe-top">
          <h1 className="text-[34px] font-bold tracking-tight">Workouts</h1>
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!hasSchedule) {
    return (
      <AppShell>
        <div className="px-5 pt-14 pb-2 safe-top">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-[34px] font-bold tracking-tight">
            Workouts
          </motion.h1>
        </div>
        <div className="px-5 py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/60 flex items-center justify-center">
            <Dumbbell className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <h2 className="text-lg font-semibold mb-1">No Workouts Assigned</h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Your workout schedule will appear here once your coach assigns exercises.
          </p>
        </div>
      </AppShell>
    );
  }

  const selectedDow = selectedDate.getDay();
  const selectedDay = workoutDays.find((d) => d.dayOfWeek === selectedDow);

  return (
    <AppShell>
      <div className="px-5 pt-14 pb-2 safe-top">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-[34px] font-bold tracking-tight"
        >
          Workouts
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-muted-foreground text-sm mt-0.5"
        >
          Train with purpose
        </motion.p>
      </div>

      <div className="px-5 py-4 pb-28 space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.35 }}
          className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 shadow-soft p-4"
        >
          <WeeklyCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            weekData={weekData}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.35 }}
        >
          {selectedDay ? (
            <DayWorkoutInline
              key={selectedDow}
              dayOfWeek={selectedDay.dayOfWeek}
              source={selectedDay.source}
              workoutId={selectedDay.workoutId}
              workoutName={selectedDay.workoutName}
              dayLabel={selectedDay.label}
            />
          ) : (
            <div className="rounded-2xl p-8 bg-card/80 backdrop-blur-xl border border-border/40 shadow-soft text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-secondary/50 flex items-center justify-center">
                <Dumbbell className="h-7 w-7 text-muted-foreground/25" />
              </div>
              <h3 className="font-semibold text-lg mb-1">Rest Day</h3>
              <p className="text-sm text-muted-foreground">No workout scheduled for {DAY_NAMES[selectedDow]}.</p>
            </div>
          )}
        </motion.div>
      </div>
    </AppShell>
  );
};

export default WorkoutsPage;
