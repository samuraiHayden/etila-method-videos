import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek } from "date-fns";
import { motion } from "framer-motion";
import {
  Scale, Dumbbell, TrendingUp, Trophy, ChevronRight, Ruler, Camera,
  Plus, Loader2, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

interface WeightEntry {
  date: string;
  weight: number;
}

interface WorkoutStats {
  totalWorkouts: number;
  thisWeek: number;
  totalSets: number;
  totalPRs: number;
}

interface TopExercise {
  name: string;
  bestWeight: number;
  bestReps: number;
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const ProgressPage = () => {
  const { user, profile, isLoading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [weightData, setWeightData] = useState<WeightEntry[]>([]);
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats>({ totalWorkouts: 0, thisWeek: 0, totalSets: 0, totalPRs: 0 });
  const [topExercises, setTopExercises] = useState<TopExercise[]>([]);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [weightChange, setWeightChange] = useState<number | null>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [measurementCount, setMeasurementCount] = useState(0);

  // Log weight dialog
  const [logWeightOpen, setLogWeightOpen] = useState(false);
  const [logWeight, setLogWeight] = useState("");
  const [savingWeight, setSavingWeight] = useState(false);

  // Log measurements dialog
  const [logMeasurementsOpen, setLogMeasurementsOpen] = useState(false);
  const [savingMeasurements, setSavingMeasurements] = useState(false);
  const [measurementForm, setMeasurementForm] = useState({
    weight: "",
    waist: "",
    hips: "",
    chest: "",
    left_arm: "",
    right_arm: "",
    left_thigh: "",
    right_thigh: "",
  });

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  async function fetchAll() {
    if (!user) return;
    setLoading(true);
    try {
      await Promise.all([fetchWeightHistory(), fetchWorkoutStats(), fetchTopExercises(), fetchCounts()]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchWeightHistory() {
    const { data } = await supabase
      .from("measurement_logs")
      .select("weight, logged_at")
      .eq("user_id", user!.id)
      .not("weight", "is", null)
      .order("logged_at", { ascending: true });

    if (data && data.length > 0) {
      const entries: WeightEntry[] = data.map(d => ({
        date: format(new Date(d.logged_at), "MMM d"),
        weight: Number(d.weight),
      }));
      setWeightData(entries);
      setLatestWeight(entries[entries.length - 1].weight);
      if (entries.length >= 2) {
        setWeightChange(entries[entries.length - 1].weight - entries[0].weight);
      }
    } else {
      // Fall back to profile weight if no measurement logs
      if (profile?.current_weight) {
        const w = parseFloat(profile.current_weight);
        if (!isNaN(w)) {
          setLatestWeight(w);
        }
      }
      setWeightData([]);
      setWeightChange(null);
    }
  }

  async function fetchWorkoutStats() {
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 0 }), "yyyy-MM-dd");

    const { data: userLogIds } = await supabase.from("workout_logs").select("id").eq("user_id", user!.id);
    const logIds = userLogIds?.map(w => w.id) || [];

    const [allLogsRes, weekLogsRes] = await Promise.all([
      supabase.from("workout_logs").select("id", { count: "exact", head: true }).eq("user_id", user!.id).not("completed_at", "is", null),
      supabase.from("workout_logs").select("id", { count: "exact", head: true }).eq("user_id", user!.id).not("completed_at", "is", null).gte("workout_date", weekStart),
    ]);

    let totalSets = 0;
    let totalPRs = 0;

    if (logIds.length > 0) {
      const [setsRes, prsRes] = await Promise.all([
        supabase.from("set_logs").select("id", { count: "exact", head: true }).in("workout_log_id", logIds),
        supabase.from("set_logs").select("id", { count: "exact", head: true }).eq("is_pr", true).in("workout_log_id", logIds),
      ]);
      totalSets = setsRes.count || 0;
      totalPRs = prsRes.count || 0;
    }

    setWorkoutStats({
      totalWorkouts: allLogsRes.count || 0,
      thisWeek: weekLogsRes.count || 0,
      totalSets,
      totalPRs,
    });
  }

  async function fetchTopExercises() {
    const { data: logIds } = await supabase.from("workout_logs").select("id").eq("user_id", user!.id);
    if (!logIds || logIds.length === 0) return;

    const { data: sets } = await supabase
      .from("set_logs")
      .select("exercise_id, weight, reps")
      .in("workout_log_id", logIds.map(l => l.id))
      .not("weight", "is", null)
      .order("weight", { ascending: false });

    if (!sets || sets.length === 0) return;

    const exerciseMap = new Map<string, { weight: number; reps: number }>();
    for (const s of sets) {
      if (!exerciseMap.has(s.exercise_id) || (s.weight || 0) > exerciseMap.get(s.exercise_id)!.weight) {
        exerciseMap.set(s.exercise_id, { weight: Number(s.weight), reps: s.reps || 0 });
      }
    }

    const exerciseIds = Array.from(exerciseMap.keys()).slice(0, 5);
    const { data: exercises } = await supabase.from("exercises").select("id, name").in("id", exerciseIds);

    if (exercises) {
      const top: TopExercise[] = exercises.map(e => ({
        name: e.name,
        bestWeight: exerciseMap.get(e.id)?.weight || 0,
        bestReps: exerciseMap.get(e.id)?.reps || 0,
      })).sort((a, b) => b.bestWeight - a.bestWeight).slice(0, 5);
      setTopExercises(top);
    }
  }

  async function fetchCounts() {
    const [photosRes, measurementsRes] = await Promise.all([
      supabase.from("progress_photos").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
      supabase.from("measurement_logs").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
    ]);
    setPhotoCount(photosRes.count || 0);
    setMeasurementCount(measurementsRes.count || 0);
  }

  async function handleLogWeight() {
    if (!user || !logWeight) return;
    const weightNum = parseFloat(logWeight);
    if (isNaN(weightNum) || weightNum <= 0) {
      toast.error("Please enter a valid weight");
      return;
    }
    setSavingWeight(true);
    try {
      const { error } = await supabase.from("measurement_logs").insert({
        user_id: user.id,
        weight: weightNum,
      });
      if (error) throw error;

      // Also update profile current_weight
      await supabase
        .from("profiles")
        .update({ current_weight: logWeight })
        .eq("user_id", user.id);

      await refreshProfile();
      toast.success("Weight logged!");
      setLogWeightOpen(false);
      setLogWeight("");
      fetchAll();
    } catch (error) {
      console.error("Error logging weight:", error);
      toast.error("Failed to log weight");
    } finally {
      setSavingWeight(false);
    }
  }

  async function handleLogMeasurements() {
    if (!user) return;
    const hasAnyValue = Object.values(measurementForm).some(v => v.trim() !== "");
    if (!hasAnyValue) {
      toast.error("Please enter at least one measurement");
      return;
    }
    setSavingMeasurements(true);
    try {
      const { error } = await supabase.from("measurement_logs").insert({
        user_id: user.id,
        weight: measurementForm.weight ? parseFloat(measurementForm.weight) : null,
        waist: measurementForm.waist ? parseFloat(measurementForm.waist) : null,
        hips: measurementForm.hips ? parseFloat(measurementForm.hips) : null,
        chest: measurementForm.chest ? parseFloat(measurementForm.chest) : null,
        left_arm: measurementForm.left_arm ? parseFloat(measurementForm.left_arm) : null,
        right_arm: measurementForm.right_arm ? parseFloat(measurementForm.right_arm) : null,
        left_thigh: measurementForm.left_thigh ? parseFloat(measurementForm.left_thigh) : null,
        right_thigh: measurementForm.right_thigh ? parseFloat(measurementForm.right_thigh) : null,
      });
      if (error) throw error;

      if (measurementForm.weight) {
        await supabase
          .from("profiles")
          .update({ current_weight: measurementForm.weight })
          .eq("user_id", user.id);
        await refreshProfile();
      }

      toast.success("Measurements logged!");
      setLogMeasurementsOpen(false);
      setMeasurementForm({ weight: "", waist: "", hips: "", chest: "", left_arm: "", right_arm: "", left_thigh: "", right_thigh: "" });
      fetchAll();
    } catch (error) {
      console.error("Error logging measurements:", error);
      toast.error("Failed to log measurements");
    } finally {
      setSavingMeasurements(false);
    }
  }

  if (authLoading || loading) {
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
        {/* Header */}
        <div className="px-5 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button size="icon" variant="ghost" onClick={() => navigate(-1)} className="h-9 w-9 rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[28px] font-bold tracking-tight text-foreground"
              >
                Your Progress
              </motion.h1>
            </div>
            {/* Quick Log Weight Button */}
            <Dialog open={logWeightOpen} onOpenChange={setLogWeightOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-xl gap-1.5">
                  <Scale className="h-4 w-4" />
                  Log Weight
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-sm">
                <DialogHeader>
                  <DialogTitle>Log Weight</DialogTitle>
                  <DialogDescription>Enter your current weight to track progress over time.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  {latestWeight && (
                    <p className="text-sm text-muted-foreground">
                      Last recorded: <span className="font-semibold text-foreground">{latestWeight} lbs</span>
                    </p>
                  )}
                  <div>
                    <Label htmlFor="log_weight_input">Weight (lbs)</Label>
                    <Input
                      id="log_weight_input"
                      name="log_weight_input"
                      autoComplete="off"
                      type="number"
                      min="0"
                      step="0.1"
                      value={logWeight}
                      onChange={(e) => setLogWeight(e.target.value)}
                      placeholder={latestWeight ? String(latestWeight) : "e.g. 175"}
                      className="rounded-xl text-lg h-12 font-semibold"
                      autoFocus
                    />
                  </div>
                  <Button
                    className="w-full rounded-xl h-11"
                    disabled={savingWeight || !logWeight}
                    onClick={handleLogWeight}
                  >
                    {savingWeight && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Save Weight
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="px-5 pb-28 space-y-5">
          {/* Stats Grid */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="grid grid-cols-2 gap-3">
            <StatCard icon={Dumbbell} label="Total Workouts" value={workoutStats.totalWorkouts} color="primary" />
            <StatCard icon={TrendingUp} label="This Week" value={workoutStats.thisWeek} color="accent" />
            <StatCard icon={Trophy} label="Personal Records" value={workoutStats.totalPRs} color="warning" />
            <StatCard icon={Scale} label="Weigh-ins" value={measurementCount} color="success" />
          </motion.div>

          {/* Weight Chart */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
            <div className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 shadow-soft p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-foreground">Weight Trend</h2>
                  {latestWeight && (
                    <p className="text-sm text-muted-foreground">
                      Current: <span className="font-semibold text-foreground">{latestWeight} lbs</span>
                      {weightChange !== null && (
                        <span className={`ml-2 font-semibold ${weightChange <= 0 ? "text-success" : "text-destructive"}`}>
                          {weightChange > 0 ? "+" : ""}{weightChange.toFixed(1)} lbs
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-xl text-xs gap-1"
                  onClick={() => setLogWeightOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
              {weightData.length > 1 ? (
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weightData}>
                      <defs>
                        <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                      <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={40} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                          fontSize: "13px",
                        }}
                      />
                      <Area type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#weightGradient)" dot={{ r: 3, fill: "hsl(var(--primary))" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : weightData.length === 1 ? (
                <div className="h-44 flex items-center justify-center text-center">
                  <div>
                    <p className="text-3xl font-bold text-foreground">{weightData[0].weight} lbs</p>
                    <p className="text-sm text-muted-foreground mt-1">Log again to see your trend line</p>
                  </div>
                </div>
              ) : (
                <div className="h-44 flex items-center justify-center text-center">
                  <div>
                    <Scale className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">No weigh-ins yet</p>
                    <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => setLogWeightOpen(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      Log Your First Weight
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Top Exercises / Strength */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            <div className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 shadow-soft p-5">
              <h2 className="text-base font-bold text-foreground mb-3">Strength Highlights</h2>
              {topExercises.length > 0 ? (
                <div className="space-y-3">
                  {topExercises.map((ex, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {i + 1}
                        </div>
                        <span className="text-sm font-medium text-foreground">{ex.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-foreground">{ex.bestWeight} lbs</span>
                        <span className="text-xs text-muted-foreground ml-1">× {ex.bestReps}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Dumbbell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Complete workouts to see your top lifts</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Body Measurements */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="space-y-3">
            <Dialog open={logMeasurementsOpen} onOpenChange={setLogMeasurementsOpen}>
              <DialogTrigger asChild>
                <button className="w-full flex items-center justify-between rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 shadow-soft p-4 active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Ruler className="h-5 w-5 text-accent" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-foreground">Body Measurements</p>
                      <p className="text-xs text-muted-foreground">{measurementCount} entries logged</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Plus className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Log Measurements</DialogTitle>
                  <DialogDescription>Enter your body measurements. Fill in any fields you'd like to track.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label htmlFor="meas_weight">Weight (lbs)</Label>
                    <Input id="meas_weight" type="number" min="0" step="0.1" autoComplete="off" value={measurementForm.weight}
                      onChange={(e) => setMeasurementForm({ ...measurementForm, weight: e.target.value })}
                      placeholder="e.g. 175" className="rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="meas_waist">Waist (in)</Label>
                      <Input id="meas_waist" type="number" min="0" step="0.1" autoComplete="off" value={measurementForm.waist}
                        onChange={(e) => setMeasurementForm({ ...measurementForm, waist: e.target.value })}
                        placeholder="e.g. 32" className="rounded-xl" />
                    </div>
                    <div>
                      <Label htmlFor="meas_hips">Hips (in)</Label>
                      <Input id="meas_hips" type="number" min="0" step="0.1" autoComplete="off" value={measurementForm.hips}
                        onChange={(e) => setMeasurementForm({ ...measurementForm, hips: e.target.value })}
                        placeholder="e.g. 38" className="rounded-xl" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="meas_chest">Chest (in)</Label>
                    <Input id="meas_chest" type="number" min="0" step="0.1" autoComplete="off" value={measurementForm.chest}
                      onChange={(e) => setMeasurementForm({ ...measurementForm, chest: e.target.value })}
                      placeholder="e.g. 40" className="rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="meas_left_arm">Left Arm (in)</Label>
                      <Input id="meas_left_arm" type="number" min="0" step="0.1" autoComplete="off" value={measurementForm.left_arm}
                        onChange={(e) => setMeasurementForm({ ...measurementForm, left_arm: e.target.value })}
                        placeholder="e.g. 14" className="rounded-xl" />
                    </div>
                    <div>
                      <Label htmlFor="meas_right_arm">Right Arm (in)</Label>
                      <Input id="meas_right_arm" type="number" min="0" step="0.1" autoComplete="off" value={measurementForm.right_arm}
                        onChange={(e) => setMeasurementForm({ ...measurementForm, right_arm: e.target.value })}
                        placeholder="e.g. 14" className="rounded-xl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="meas_left_thigh">Left Thigh (in)</Label>
                      <Input id="meas_left_thigh" type="number" min="0" step="0.1" autoComplete="off" value={measurementForm.left_thigh}
                        onChange={(e) => setMeasurementForm({ ...measurementForm, left_thigh: e.target.value })}
                        placeholder="e.g. 22" className="rounded-xl" />
                    </div>
                    <div>
                      <Label htmlFor="meas_right_thigh">Right Thigh (in)</Label>
                      <Input id="meas_right_thigh" type="number" min="0" step="0.1" autoComplete="off" value={measurementForm.right_thigh}
                        onChange={(e) => setMeasurementForm({ ...measurementForm, right_thigh: e.target.value })}
                        placeholder="e.g. 22" className="rounded-xl" />
                    </div>
                  </div>
                  <Button
                    className="w-full rounded-xl h-11"
                    disabled={savingMeasurements}
                    onClick={handleLogMeasurements}
                  >
                    {savingMeasurements && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Save Measurements
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <button
              onClick={() => navigate("/profile")}
              className="w-full flex items-center justify-between rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 shadow-soft p-4 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Camera className="h-5 w-5 text-warning" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Progress Photos</p>
                  <p className="text-xs text-muted-foreground">{photoCount} photos uploaded</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
};

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  const colorClasses: Record<string, { bg: string; icon: string; dot: string }> = {
    primary: { bg: "bg-primary/10", icon: "text-primary", dot: "bg-primary/[0.06]" },
    accent: { bg: "bg-accent/10", icon: "text-accent", dot: "bg-accent/[0.06]" },
    warning: { bg: "bg-warning/10", icon: "text-warning", dot: "bg-warning/[0.06]" },
    success: { bg: "bg-success/10", icon: "text-success", dot: "bg-success/[0.06]" },
  };
  const c = colorClasses[color] || colorClasses.primary;

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 p-5 shadow-soft">
      <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-full ${c.dot}`} />
      <div className="relative">
        <div className={`w-10 h-10 rounded-2xl ${c.bg} flex items-center justify-center mb-3`}>
          <Icon className={`h-5 w-5 ${c.icon}`} />
        </div>
        <p className="text-3xl font-extrabold text-foreground tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground font-medium mt-1">{label}</p>
      </div>
    </div>
  );
}

export default ProgressPage;
