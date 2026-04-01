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
import { Plus, Edit, Trash2, Loader2, Calendar, Copy, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface ProgramTemplate {
  id: string;
  name: string;
  description: string | null;
  duration_weeks: number;
  is_active: boolean;
}

interface Workout {
  id: string;
  name: string;
}

interface ProgramDay {
  id: string;
  program_id: string;
  day_of_week: number;
  workout_id: string | null;
  is_rest_day: boolean;
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

export default function AdminPrograms() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<ProgramTemplate[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignedCounts, setAssignedCounts] = useState<Record<string, number>>({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ProgramTemplate | null>(null);
  const [programForm, setProgramForm] = useState({
    name: "",
    description: "",
    duration_weeks: "12",
    is_active: true,
  });

  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ProgramTemplate | null>(null);
  const [schedule, setSchedule] = useState<Record<number, string>>({});
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [programsRes, workoutsRes] = await Promise.all([
        supabase.from("program_templates").select("*").order("name"),
        supabase.from("workouts").select("id, name").order("name"),
      ]);

      setPrograms(programsRes.data || []);
      setWorkouts(workoutsRes.data || []);

      // Get count of users assigned to each program
      if (programsRes.data) {
        const counts: Record<string, number> = {};
        for (const program of programsRes.data) {
          const { count } = await supabase
            .from("user_programs")
            .select("*", { count: "exact", head: true })
            .eq("program_id", program.id)
            .eq("status", "active");
          counts[program.id] = count || 0;
        }
        setAssignedCounts(counts);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  function openDialog(program?: ProgramTemplate) {
    if (program) {
      setEditingProgram(program);
      setProgramForm({
        name: program.name,
        description: program.description || "",
        duration_weeks: program.duration_weeks.toString(),
        is_active: program.is_active,
      });
    } else {
      setEditingProgram(null);
      setProgramForm({
        name: "",
        description: "",
        duration_weeks: "12",
        is_active: true,
      });
    }
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    const data = {
      name: programForm.name,
      description: programForm.description || null,
      duration_weeks: parseInt(programForm.duration_weeks),
      is_active: programForm.is_active,
    };

    try {
      if (editingProgram) {
        const { error } = await supabase
          .from("program_templates")
          .update(data)
          .eq("id", editingProgram.id);
        if (error) throw error;
        toast.success("Program updated");
      } else {
        const { data: newProgram, error } = await supabase
          .from("program_templates")
          .insert({ ...data, created_by: user?.id })
          .select()
          .single();
        if (error) throw error;
        toast.success("Program created! Now set up the weekly schedule.");
        setDialogOpen(false);
        if (newProgram) {
          openScheduleDialog(newProgram);
        }
        fetchData();
        return;
      }

      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving program:", error);
      toast.error("Failed to save program");
    }
  }

  async function handleDelete(id: string) {
    const assignedCount = assignedCounts[id] || 0;
    if (assignedCount > 0) {
      toast.error(`Cannot delete: ${assignedCount} user(s) are assigned to this program`);
      return;
    }

    if (!confirm("Are you sure you want to delete this program?")) return;

    try {
      // Delete program days first
      await supabase.from("program_days").delete().eq("program_id", id);
      // Then delete program
      const { error } = await supabase.from("program_templates").delete().eq("id", id);
      if (error) throw error;
      toast.success("Program deleted");
      fetchData();
    } catch (error) {
      console.error("Error deleting program:", error);
      toast.error("Failed to delete program");
    }
  }

  async function openScheduleDialog(program: ProgramTemplate) {
    setSelectedProgram(program);

    try {
      const { data: days } = await supabase
        .from("program_days")
        .select("*")
        .eq("program_id", program.id);

      const scheduleMap: Record<number, string> = {};
      // Initialize all days as empty
      DAYS.forEach((day) => {
        scheduleMap[day.index] = "";
      });
      // Fill in existing data
      days?.forEach((day) => {
        scheduleMap[day.day_of_week] = day.is_rest_day ? "rest" : day.workout_id || "";
      });

      setSchedule(scheduleMap);
      setScheduleDialogOpen(true);
    } catch (error) {
      console.error("Error fetching schedule:", error);
      toast.error("Failed to load schedule");
    }
  }

  async function handleSaveSchedule() {
    if (!selectedProgram) return;

    setSavingSchedule(true);
    try {
      // Delete existing days
      await supabase
        .from("program_days")
        .delete()
        .eq("program_id", selectedProgram.id);

      // Insert new days (only non-empty ones)
      const days = Object.entries(schedule)
        .filter(([_, value]) => value && value !== "")
        .map(([dayOfWeek, value]) => ({
          program_id: selectedProgram.id,
          day_of_week: parseInt(dayOfWeek),
          workout_id: value === "rest" ? null : value,
          is_rest_day: value === "rest",
        }));

      if (days.length > 0) {
        const { error } = await supabase.from("program_days").insert(days);
        if (error) throw error;
      }

      toast.success("Weekly schedule saved!");
      setScheduleDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast.error("Failed to save schedule");
    } finally {
      setSavingSchedule(false);
    }
  }

  async function handleCloneProgram(program: ProgramTemplate) {
    try {
      // Create new program
      const { data: newProgram, error: programError } = await supabase
        .from("program_templates")
        .insert({
          name: `${program.name} (Copy)`,
          description: program.description,
          duration_weeks: program.duration_weeks,
          is_active: false,
          created_by: user?.id,
        })
        .select()
        .single();

      if (programError) throw programError;

      // Copy days
      const { data: days } = await supabase
        .from("program_days")
        .select("*")
        .eq("program_id", program.id);

      if (days && days.length > 0 && newProgram) {
        const newDays = days.map((day) => ({
          program_id: newProgram.id,
          day_of_week: day.day_of_week,
          workout_id: day.workout_id,
          is_rest_day: day.is_rest_day,
        }));

        await supabase.from("program_days").insert(newDays);
      }

      toast.success("Program cloned");
      fetchData();
    } catch (error) {
      console.error("Error cloning program:", error);
      toast.error("Failed to clone program");
    }
  }

  // Get schedule summary for a program
  const [programSchedules, setProgramSchedules] = useState<Record<string, ProgramDay[]>>({});

  useEffect(() => {
    async function fetchSchedules() {
      const schedules: Record<string, ProgramDay[]> = {};
      for (const program of programs) {
        const { data } = await supabase
          .from("program_days")
          .select("*")
          .eq("program_id", program.id)
          .order("day_of_week");
        schedules[program.id] = data || [];
      }
      setProgramSchedules(schedules);
    }
    if (programs.length > 0) {
      fetchSchedules();
    }
  }, [programs]);

  const getWorkoutName = (workoutId: string | null) => {
    if (!workoutId) return null;
    return workouts.find((w) => w.id === workoutId)?.name || null;
  };

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
            <h1 className="text-2xl font-bold">Program Templates</h1>
            <p className="text-muted-foreground">
              Create weekly workout schedules to assign to clients
            </p>
          </div>
          <Button onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Create Program
          </Button>
        </div>

        {workouts.length === 0 && (
          <Card className="border-dashed border-2 bg-muted/50">
            <CardContent className="py-6 text-center">
              <p className="text-muted-foreground mb-2">
                You need to create workouts first before building program templates.
              </p>
              <Button variant="outline" onClick={() => window.location.href = "/admin/workouts"}>
                Go to Workouts
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {programs.map((program) => {
            const days = programSchedules[program.id] || [];
            const workoutDays = days.filter((d) => !d.is_rest_day && d.workout_id);
            const restDays = days.filter((d) => d.is_rest_day);

            return (
              <Card key={program.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        {program.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={program.is_active ? "default" : "secondary"}>
                          {program.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">{program.duration_weeks} weeks</Badge>
                        {assignedCounts[program.id] > 0 && (
                          <Badge variant="outline" className="bg-primary/10">
                            <Users className="h-3 w-3 mr-1" />
                            {assignedCounts[program.id]} assigned
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCloneProgram(program)}
                        title="Clone program"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDialog(program)}
                        title="Edit details"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(program.id)}
                        title="Delete program"
                        disabled={assignedCounts[program.id] > 0}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {program.description && (
                    <p className="text-sm text-muted-foreground">{program.description}</p>
                  )}

                  {/* Weekly Schedule Preview */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Weekly Schedule</p>
                    <div className="grid grid-cols-7 gap-1">
                      {DAYS.map((day) => {
                        const programDay = days.find((d) => d.day_of_week === day.index);
                        const hasWorkout = programDay && !programDay.is_rest_day && programDay.workout_id;
                        const isRest = programDay?.is_rest_day;

                        return (
                          <div
                            key={day.index}
                            className={`text-center py-2 rounded text-xs ${
                              hasWorkout
                                ? "bg-primary/20 text-primary font-medium"
                                : isRest
                                ? "bg-muted text-muted-foreground"
                                : "bg-background border border-dashed text-muted-foreground"
                            }`}
                            title={
                              hasWorkout
                                ? getWorkoutName(programDay.workout_id) || "Workout"
                                : isRest
                                ? "Rest Day"
                                : "Not set"
                            }
                          >
                            {day.short}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {workoutDays.length} workout day{workoutDays.length !== 1 ? "s" : ""} •{" "}
                      {restDays.length} rest day{restDays.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => openScheduleDialog(program)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Edit Weekly Schedule
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {programs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No program templates yet</p>
            <p className="text-sm mt-1">
              Create templates to easily assign workout schedules to clients
            </p>
          </div>
        )}

        {/* Program Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProgram ? "Edit Program" : "Create Program Template"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="pg-name">Program Name</Label>
                <Input
                  id="pg-name"
                  value={programForm.name}
                  onChange={(e) =>
                    setProgramForm({ ...programForm, name: e.target.value })
                  }
                  required
                  placeholder="e.g., Beginner Strength Program"
                />
              </div>
              <div>
                <Label htmlFor="pg-weeks">Duration (weeks)</Label>
                <Input
                  id="pg-weeks"
                  type="number"
                  value={programForm.duration_weeks}
                  onChange={(e) =>
                    setProgramForm({ ...programForm, duration_weeks: e.target.value })
                  }
                  required
                  min="1"
                  max="52"
                />
              </div>
              <div>
                <Label htmlFor="pg-desc">Description</Label>
                <Textarea
                  id="pg-desc"
                  value={programForm.description}
                  onChange={(e) =>
                    setProgramForm({ ...programForm, description: e.target.value })
                  }
                  placeholder="Describe who this program is for..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pg-active"
                  checked={programForm.is_active}
                  onChange={(e) =>
                    setProgramForm({ ...programForm, is_active: e.target.checked })
                  }
                  className="rounded border-input"
                />
                <Label htmlFor="pg-active">Active (available for assignment)</Label>
              </div>
              <Button type="submit" className="w-full">
                {editingProgram ? "Save Changes" : "Create Program"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Schedule Dialog */}
        <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Weekly Schedule: {selectedProgram?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Assign workouts to each day of the week. This schedule repeats weekly.
              </p>

              <div className="space-y-3">
                {DAYS.map((day) => (
                  <div key={day.index} className="flex items-center gap-3">
                    <span className="w-24 text-sm font-medium">{day.name}</span>
                    <Select
                      value={schedule[day.index] || "none"}
                      onValueChange={(value) =>
                        setSchedule({ ...schedule, [day.index]: value === "none" ? "" : value })
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="No workout" />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[200] max-h-60 overflow-y-auto">
                        <SelectItem value="none">— No workout —</SelectItem>
                        <SelectItem value="rest">🛌 Rest Day</SelectItem>
                        {workouts.map((workout) => (
                          <SelectItem key={workout.id} value={workout.id}>
                            💪 {workout.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <Button 
                onClick={handleSaveSchedule} 
                className="w-full" 
                disabled={savingSchedule}
              >
                {savingSchedule && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Weekly Schedule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}