import { useState, useEffect, useMemo } from "react";
import { format, differenceInWeeks, startOfWeek, addDays, isSameDay, isToday } from "date-fns";
import { Flame, Target, Trophy, TrendingUp, Bell, Dumbbell, Calendar, ChevronRight, Utensils } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { WorkoutCard } from "@/components/workout/WorkoutCard";
import { WeeklyCalendar } from "@/components/workout/WeeklyCalendar";
import { ProgressRing } from "@/components/progress/ProgressRing";
import { Button } from "@/components/ui/button";
import { DailyMealSuggestions } from "@/components/dashboard/DailyMealSuggestions";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface DayWorkoutInfo {
  id: string;
  name: string;
  duration: string;
  exerciseCount: number;
  isCompleted: boolean;
}

interface StrengthHighlight {
  exercise_name: string;
  weight: number;
  reps: number;
}

interface WeekDayData {
  date: Date;
  hasWorkout: boolean;
  isCompleted: boolean;
  workout: DayWorkoutInfo | null;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const Dashboard = () => {
  const { profile, user, isLoading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekData, setWeekData] = useState<WeekDayData[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [hasProgram, setHasProgram] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState({
    completedThisWeek: 0,
    totalThisWeek: 0,
    prsThisMonth: 0,
    streak: 0,
  });
  const [strengthHighlights, setStrengthHighlights] = useState<StrengthHighlight[]>([]);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      navigate("/admin");
    }
  }, [authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (user && !isAdmin) {
      setLoading(true);
      Promise.all([fetchDashboardData(), fetchUnreadCount()]).finally(() => {
        setLoading(false);
        setInitialLoad(false);
      });
    } else if (!authLoading) {
      setInitialLoad(false);
    }
  }, [user, isAdmin]);

  async function fetchUnreadCount() {
    if (!user) return;
    try {
      const { data: threads } = await supabase
        .from("message_threads")
        .select("id")
        .eq("client_id", user.id);
      if (!threads || threads.length === 0) { setUnreadCount(0); return; }
      const threadIds = threads.map(t => t.id);
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("thread_id", threadIds)
        .neq("sender_id", user.id)
        .eq("is_read", false);
      setUnreadCount(count ?? 0);
    } catch (e) {
      console.error("Error fetching unread count:", e);
    }
  }

  async function fetchDashboardData() {
    try {
      const today = new Date();
      const todayDayOfWeek = today.getDay();
      const weekStart = startOfWeek(today, { weekStartsOn: 0 });
      const [userProgramsRes, userProgramDaysRes, userDayExercisesRes, weekLogsRes] = await Promise.all([
        supabase.from("user_programs").select("*, program_templates(*)").eq("user_id", user!.id).eq("status", "active").order("created_at", { ascending: false }).limit(1),
        supabase.from("user_program_days").select("*, workouts(id, name, duration_minutes)").eq("user_id", user!.id),
        supabase.from("user_day_exercises").select("id, day_of_week, exercise_id").eq("user_id", user!.id),
        supabase.from("workout_logs").select("workout_id, completed_at").eq("user_id", user!.id).gte("workout_date", format(weekStart, "yyyy-MM-dd")),
      ]);
      const userProgram = userProgramsRes.data?.[0];
      const userProgramDays = userProgramDaysRes.data || [];
      const userDayExercises = userDayExercisesRes.data || [];
      const weekLogs = weekLogsRes.data || [];
      let programDays: any[] = [];
      if (userProgram) {
        const { data } = await supabase.from("program_days").select("*, workouts(id, name, duration_minutes)").eq("program_id", userProgram.program_id);
        programDays = data || [];
      }
      const hasAnyProgram = userDayExercises.length > 0 || userProgramDays.length > 0 || !!userProgram;
      setHasProgram(hasAnyProgram);
      if (!hasAnyProgram) return;
      const completedIds = new Set(weekLogs.filter((l) => l.completed_at).map((l) => l.workout_id));
      const weekDataArray: WeekDayData[] = [];
      let totalWorkoutsThisWeek = 0;
      let completedThisWeek = 0;
      for (let i = 0; i < 7; i++) {
        const date = addDays(weekStart, i);
        let hasWorkout = false;
        let isCompleted = false;
        let workoutInfo: DayWorkoutInfo | null = null;
        const customDay = i === 0 ? 6 : i - 1;
        const dayCustomExercises = userDayExercises.filter((e) => e.day_of_week === customDay);
        if (dayCustomExercises.length > 0) {
          hasWorkout = true;
          workoutInfo = { id: "custom-day", name: "Custom Workout", duration: "~45 min", exerciseCount: dayCustomExercises.length, isCompleted: false };
        } else {
          const upd = userProgramDays.find((d) => d.day_of_week === i);
          if (upd && !upd.is_rest_day && upd.workout_id) {
            hasWorkout = true;
            isCompleted = completedIds.has(upd.workout_id);
            const workout = upd.workouts as any;
            if (workout) {
              const { count } = await supabase.from("workout_exercises").select("id", { count: "exact", head: true }).eq("workout_id", workout.id);
              workoutInfo = { id: workout.id, name: workout.name || "Workout", duration: workout.duration_minutes ? `${workout.duration_minutes} min` : "~45 min", exerciseCount: count || 0, isCompleted };
            }
          } else if (!upd) {
            const pd = programDays.find((d) => d.day_of_week === i);
            if (pd && !pd.is_rest_day && pd.workout_id) {
              hasWorkout = true;
              isCompleted = completedIds.has(pd.workout_id);
              const workout = pd.workouts as any;
              if (workout) {
                const { count } = await supabase.from("workout_exercises").select("id", { count: "exact", head: true }).eq("workout_id", workout.id);
                workoutInfo = { id: workout.id, name: workout.name || "Workout", duration: workout.duration_minutes ? `${workout.duration_minutes} min` : "~45 min", exerciseCount: count || 0, isCompleted };
              }
            }
          }
        }
        if (hasWorkout) { totalWorkoutsThisWeek++; if (isCompleted) completedThisWeek++; }
        weekDataArray.push({ date, hasWorkout, isCompleted, workout: workoutInfo });
      }
      setWeekData(weekDataArray);
      // Fetch PRs this month using inner join
      const monthStart = format(new Date(today.getFullYear(), today.getMonth(), 1), "yyyy-MM-dd");
      const { count: prCount } = await supabase
        .from("set_logs")
        .select("id, workout_logs!inner(user_id)", { count: "exact", head: true })
        .eq("is_pr", true)
        .gte("created_at", monthStart)
        .eq("workout_logs.user_id", user!.id);

      // Fetch strength highlights scoped to today's workout exercises
      const todayDayData = weekDataArray.find(d => isSameDay(d.date, new Date()));
      const todayWorkout = todayDayData?.workout;
      let highlights: StrengthHighlight[] = [];

      if (todayWorkout && todayWorkout.id !== "custom-day") {
        // Get exercise IDs for today's workout
        const { data: todayExercises } = await supabase
          .from("workout_exercises")
          .select("exercise_id, exercises(name)")
          .eq("workout_id", todayWorkout.id);

        if (todayExercises && todayExercises.length > 0) {
          const exerciseIds = todayExercises.map((e: any) => e.exercise_id);
          const exerciseNames = new Map(todayExercises.map((e: any) => [e.exercise_id, (e.exercises as any)?.name || "Unknown"]));

          // Get best lifts for those exercises
          const { data: topLifts } = await supabase
            .from("set_logs")
            .select("weight, reps, exercise_id, workout_logs!inner(user_id)")
            .eq("workout_logs.user_id", user!.id)
            .in("exercise_id", exerciseIds)
            .not("weight", "is", null)
            .order("weight", { ascending: false })
            .limit(50);

          const exerciseBests = new Map<string, StrengthHighlight>();
          (topLifts || []).forEach((lift: any) => {
            const name = exerciseNames.get(lift.exercise_id) || "Unknown";
            if (!exerciseBests.has(name) || lift.weight > exerciseBests.get(name)!.weight) {
              exerciseBests.set(name, { exercise_name: name, weight: lift.weight, reps: lift.reps || 0 });
            }
          });
          highlights = Array.from(exerciseBests.values()).sort((a, b) => b.weight - a.weight).slice(0, 5);
        }
      } else if (todayWorkout && todayWorkout.id === "custom-day") {
        // Custom day: get exercises from user_day_exercises
        const todayCustomDay = new Date().getDay();
        const customDayIdx = todayCustomDay === 0 ? 6 : todayCustomDay - 1;
        const todayCustomExercises = userDayExercises.filter(e => e.day_of_week === customDayIdx);
        if (todayCustomExercises.length > 0) {
          const exerciseIds = todayCustomExercises.map(e => e.exercise_id);
          const { data: exerciseData } = await supabase.from("exercises").select("id, name").in("id", exerciseIds);
          const exerciseNames = new Map((exerciseData || []).map(e => [e.id, e.name]));

          const { data: topLifts } = await supabase
            .from("set_logs")
            .select("weight, reps, exercise_id, workout_logs!inner(user_id)")
            .eq("workout_logs.user_id", user!.id)
            .in("exercise_id", exerciseIds)
            .not("weight", "is", null)
            .order("weight", { ascending: false })
            .limit(50);

          const exerciseBests = new Map<string, StrengthHighlight>();
          (topLifts || []).forEach((lift: any) => {
            const name = exerciseNames.get(lift.exercise_id) || "Unknown";
            if (!exerciseBests.has(name) || lift.weight > exerciseBests.get(name)!.weight) {
              exerciseBests.set(name, { exercise_name: name, weight: lift.weight, reps: lift.reps || 0 });
            }
          });
          highlights = Array.from(exerciseBests.values()).sort((a, b) => b.weight - a.weight).slice(0, 5);
        }
      }
      setStrengthHighlights(highlights);

      setStats({ completedThisWeek, totalThisWeek: totalWorkoutsThisWeek, prsThisMonth: prCount || 0, streak: 0 });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  }

  const getFirstName = () => {
    if (profile?.full_name) return profile.full_name.split(" ")[0];
    const metaName = user?.user_metadata?.full_name;
    if (metaName) return String(metaName).split(" ")[0];
    if (profile?.email) return profile.email.split("@")[0];
    if (user?.email) return user.email.split("@")[0];
    return "there";
  };

  const getWeekNumber = () => {
    if (profile?.program_start_date) {
      const startDate = new Date(profile.program_start_date);
      const weeks = differenceInWeeks(new Date(), startDate) + 1;
      return Math.max(1, weeks);
    }
    return 1;
  };

  const weeklyProgress = stats.totalThisWeek > 0
    ? Math.round((stats.completedThisWeek / stats.totalThisWeek) * 100)
    : 0;

  if (authLoading || initialLoad) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        {/* Hero Header with frosted glass */}
        <header className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-accent/[0.04]" />
          <div className="relative px-6 pt-6 pb-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0}
              className="flex items-start justify-between"
            >
              <div>
                <p className="text-muted-foreground/50 text-[11px] font-semibold tracking-[0.15em] uppercase">
                  {format(new Date(), "EEEE, MMMM d")}
                </p>
                <h1 className="text-[34px] font-bold tracking-tight leading-none mt-1 text-foreground">
                  Hey {getFirstName()}
                </h1>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="relative -mr-1 h-10 w-10 rounded-full bg-card/80 backdrop-blur-xl border border-border/50 shadow-soft hover:shadow-card transition-all"
                onClick={() => navigate("/messages")}
              >
                <Bell className="h-[18px] w-[18px] text-foreground/70" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive rounded-full ring-2 ring-background flex items-center justify-center">
                    <span className="text-[10px] font-bold text-destructive-foreground">{unreadCount > 9 ? "9+" : unreadCount}</span>
                  </span>
                )}
              </Button>
            </motion.div>
          </div>
        </header>

        {/* Content */}
        <div className="px-6 space-y-6 pb-10 -mt-1">
          {/* Weekly Progress Hero */}
          {hasProgram ? (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-accent p-6 text-primary-foreground shadow-glow"
            >
              {/* Decorative circles */}
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/[0.06]" />
              <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/[0.04]" />

              <div className="relative flex items-center gap-5">
                <ProgressRing progress={weeklyProgress} size="md">
                  <div className="text-center">
                    <span className="text-[22px] font-extrabold leading-none text-primary-foreground">
                      {weeklyProgress}<span className="text-xs font-bold opacity-80">%</span>
                    </span>
                  </div>
                </ProgressRing>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary-foreground/60">
                    Week {getWeekNumber()}
                  </p>
                  <p className="text-xl font-bold mt-0.5 leading-snug">
                    {stats.completedThisWeek} of {stats.totalThisWeek} workouts
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {stats.totalThisWeek - stats.completedThisWeek === 0 ? (
                      <span className="text-xs font-semibold text-primary-foreground/90">All done this week! 🎉</span>
                    ) : (
                      <>
                        <div className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-white/90 transition-all duration-700 ease-out"
                            style={{ width: `${weeklyProgress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-primary-foreground/70 tabular-nums">
                          {stats.totalThisWeek - stats.completedThisWeek} left
                        </span>
                      </>
                    )}
                  </div>
                  {stats.streak > 0 && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Flame className="h-3.5 w-3.5 text-warning" />
                      <span className="text-xs font-semibold text-warning">{stats.streak} day streak!</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
              className="rounded-3xl bg-card p-8 border border-border/50 shadow-card text-center"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/8 flex items-center justify-center">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <p className="font-bold text-foreground">No Program Assigned</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your coach will assign your workout program soon
              </p>
            </motion.div>
          )}

          {/* Weekly Calendar */}
          {hasProgram && weekData.length > 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={2}
              className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 shadow-soft p-2"
            >
              <WeeklyCalendar
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                weekData={weekData}
              />
            </motion.div>
          )}

          {/* Today's Workout */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-foreground">
                {isToday(selectedDate) ? "Today's Workout" : format(selectedDate, "EEEE's Workout")}
              </h2>
              {hasProgram && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary hover:text-primary font-semibold -mr-2 h-auto py-1"
                  onClick={() => navigate("/workouts")}
                >
                  View All
                  <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              )}
            </div>
            {(() => {
              const selectedDayData = weekData.find(d => isSameDay(d.date, selectedDate));
              const selectedWorkout = selectedDayData?.workout;
              if (selectedWorkout) {
                return <WorkoutCard {...selectedWorkout} isToday={isToday(selectedDate)} />;
              } else if (hasProgram) {
                return (
                  <div className="rounded-2xl bg-card border border-border/50 shadow-soft p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-muted flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="font-semibold text-foreground">Rest Day</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Recovery is part of the process 💪</p>
                  </div>
                );
              } else {
                return (
                  <div className="rounded-2xl bg-card border border-border/50 shadow-soft p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-muted flex items-center justify-center">
                      <Dumbbell className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="font-semibold">No Workouts Yet</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Your program will appear once assigned</p>
                  </div>
                );
              }
            })()}
          </motion.section>

          {/* Stats Grid — Glassmorphism */}
          {hasProgram && (
            <motion.section
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={4}
            >
              <h2 className="text-lg font-bold text-foreground mb-3">Your Stats</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="group relative overflow-hidden rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 p-5 shadow-soft hover:shadow-card transition-all duration-300">
                  <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-primary/[0.06] group-hover:bg-primary/[0.1] transition-colors duration-300" />
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-3xl font-extrabold text-foreground tracking-tight">
                      {stats.completedThisWeek}<span className="text-lg font-bold text-muted-foreground">/{stats.totalThisWeek}</span>
                    </p>
                    <p className="text-xs text-muted-foreground font-medium mt-1">This Week</p>
                  </div>
                </div>
                <div className="group relative overflow-hidden rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 p-5 shadow-soft hover:shadow-card transition-all duration-300">
                  <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-warning/[0.06] group-hover:bg-warning/[0.1] transition-colors duration-300" />
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl bg-warning/10 flex items-center justify-center mb-3">
                      <Trophy className="h-5 w-5 text-warning" />
                    </div>
                    <p className="text-3xl font-extrabold text-foreground tracking-tight">{stats.prsThisMonth}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-1">PRs This Month</p>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* Strength Highlights */}
          {hasProgram && strengthHighlights.length > 0 && isToday(selectedDate) && (
            <motion.section
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={4.5}
            >
              <h2 className="text-lg font-bold text-foreground mb-3">Today's Best Lifts</h2>
              <div className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 shadow-soft divide-y divide-border/40">
                {strengthHighlights.map((lift, idx) => (
                  <div key={lift.exercise_name} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{idx + 1}</span>
                    </div>
                    <span className="flex-1 text-sm font-medium text-foreground truncate">{lift.exercise_name}</span>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-foreground">{lift.weight} lbs</span>
                      <span className="text-xs text-muted-foreground ml-1">x {lift.reps}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={5}
          >
            {user && <DailyMealSuggestions userId={user.id} selectedDate={selectedDate} />}
          </motion.div>

          {/* Quick Actions */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={6}
          >
            <h2 className="text-lg font-bold text-foreground mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate("/progress")}
                className="group relative overflow-hidden rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 p-5 text-left shadow-soft hover:shadow-card active:scale-[0.98] transition-all duration-200"
              >
                <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-full bg-accent/[0.06] group-hover:bg-accent/[0.1] transition-colors" />
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center mb-3">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  <p className="text-sm font-bold text-foreground">View Progress</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Track your journey</p>
                </div>
              </button>
              <button
                onClick={() => navigate("/meals")}
                className="group relative overflow-hidden rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 p-5 text-left shadow-soft hover:shadow-card active:scale-[0.98] transition-all duration-200"
              >
                <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-full bg-warning/[0.06] group-hover:bg-warning/[0.1] transition-colors" />
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-warning/10 flex items-center justify-center mb-3">
                    <Utensils className="h-5 w-5 text-warning" />
                  </div>
                  <p className="text-sm font-bold text-foreground">Meal Plan</p>
                  <p className="text-xs text-muted-foreground mt-0.5">View your meals</p>
                </div>
              </button>
            </div>
          </motion.section>
        </div>
      </div>
    </AppShell>
  );
};

export default Dashboard;
