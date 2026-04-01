import { useEffect, useState, useRef } from "react";
import { SignedVideo } from "@/components/ui/signed-video";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2, 
  Dumbbell, 
  Play, 
  GripVertical,
  ListPlus,
  X,
  Upload,
  Video,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Exercise {
  id: string;
  name: string;
  video_url: string | null;
  written_cues: string | null;
  coaching_tips: string | null;
  muscle_groups: string[] | null;
  equipment: string[] | null;
  level: string | null;
}

interface Workout {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
}

interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  order_index: number;
  sets: number;
  reps: string;
  rpe: number | null;
  rest_seconds: number | null;
  notes: string | null;
  exercise?: Exercise;
}

export default function AdminWorkouts() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Exercise form
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [exerciseForm, setExerciseForm] = useState({
    name: "",
    video_url: "",
    written_cues: "",
    coaching_tips: "",
    muscle_groups: "",
    equipment: "",
    level: "beginner",
  });

  // Video upload state
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  // Workout form
  const [workoutDialogOpen, setWorkoutDialogOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [workoutForm, setWorkoutForm] = useState({
    name: "",
    description: "",
    duration_minutes: "",
  });

  // Workout Builder
  const [builderDialogOpen, setBuilderDialogOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [savingExercises, setSavingExercises] = useState(false);

  // Add exercise to workout form
  const [addExerciseDialogOpen, setAddExerciseDialogOpen] = useState(false);
  const [newExerciseForm, setNewExerciseForm] = useState({
    exercise_id: "",
    sets: "3",
    reps: "10",
    rpe: "",
    rest_seconds: "90",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);



  async function fetchData() {
    try {
      const [exercisesRes, workoutsRes] = await Promise.all([
        supabase.from("exercises").select("*").order("name"),
        supabase.from("workouts").select("*").order("name"),
      ]);

      setExercises(exercisesRes.data || []);
      setWorkouts(workoutsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  // Video upload handler
  async function handleVideoUpload(file: File) {
    if (!file) return;
    setUploadingVideo(true);
    setUploadProgress(10);

    try {
      const ext = file.name.split(".").pop();
      const fileName = `exercise-${Date.now()}.${ext}`;
      setUploadProgress(30);

      const { data, error } = await supabase.storage
        .from("exercise-videos")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;
      setUploadProgress(80);

      // Store the path, not a public URL (bucket is private)
      const storagePath = data.path;
      const { data: signedData } = await supabase.storage
        .from("exercise-videos")
        .createSignedUrl(storagePath, 3600);

      setExerciseForm((prev) => ({ ...prev, video_url: storagePath }));
      setVideoPreviewUrl(signedData?.signedUrl || "");
      setUploadProgress(100);
      toast.success("Video uploaded successfully!");
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Failed to upload video");
    } finally {
      setUploadingVideo(false);
      setTimeout(() => setUploadProgress(0), 1500);
    }
  }

  // Exercise handlers
  function openExerciseDialog(exercise?: Exercise) {
    if (exercise) {
      setEditingExercise(exercise);
      setExerciseForm({
        name: exercise.name,
        video_url: exercise.video_url || "",
        written_cues: exercise.written_cues || "",
        coaching_tips: exercise.coaching_tips || "",
        muscle_groups: exercise.muscle_groups?.join(", ") || "",
        equipment: exercise.equipment?.join(", ") || "",
        level: exercise.level || "beginner",
      });
      setVideoPreviewUrl(exercise.video_url || null);
    } else {
      setEditingExercise(null);
      setExerciseForm({
        name: "",
        video_url: "",
        written_cues: "",
        coaching_tips: "",
        muscle_groups: "",
        equipment: "",
        level: "beginner",
      });
      setVideoPreviewUrl(null);
    }
    setExerciseDialogOpen(true);
  }

  async function handleSaveExercise(e: React.FormEvent) {
    e.preventDefault();

    const data = {
      name: exerciseForm.name,
      video_url: exerciseForm.video_url || null,
      written_cues: exerciseForm.written_cues || null,
      coaching_tips: exerciseForm.coaching_tips || null,
      muscle_groups: exerciseForm.muscle_groups
        ? exerciseForm.muscle_groups.split(",").map((s) => s.trim())
        : null,
      equipment: exerciseForm.equipment
        ? exerciseForm.equipment.split(",").map((s) => s.trim())
        : null,
      level: exerciseForm.level || "beginner",
    };

    try {
      if (editingExercise) {
        const { error } = await supabase
          .from("exercises")
          .update(data)
          .eq("id", editingExercise.id);
        if (error) throw error;
        toast.success("Exercise updated");
      } else {
        const { error } = await supabase
          .from("exercises")
          .insert({ ...data, created_by: user?.id });
        if (error) throw error;
        toast.success("Exercise created");
      }

      setExerciseDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving exercise:", error);
      toast.error("Failed to save exercise");
    }
  }

  async function handleDeleteExercise(id: string) {
    if (!confirm("Are you sure you want to delete this exercise?")) return;

    try {
      const { error } = await supabase.from("exercises").delete().eq("id", id);
      if (error) throw error;
      toast.success("Exercise deleted");
      fetchData();
    } catch (error) {
      console.error("Error deleting exercise:", error);
      toast.error("Failed to delete exercise. It may be in use by a workout.");
    }
  }

  // Workout handlers
  function openWorkoutDialog(workout?: Workout) {
    if (workout) {
      setEditingWorkout(workout);
      setWorkoutForm({
        name: workout.name,
        description: workout.description || "",
        duration_minutes: workout.duration_minutes?.toString() || "",
      });
    } else {
      setEditingWorkout(null);
      setWorkoutForm({
        name: "",
        description: "",
        duration_minutes: "",
      });
    }
    setWorkoutDialogOpen(true);
  }

  async function handleSaveWorkout(e: React.FormEvent) {
    e.preventDefault();

    const data = {
      name: workoutForm.name,
      description: workoutForm.description || null,
      duration_minutes: workoutForm.duration_minutes
        ? parseInt(workoutForm.duration_minutes)
        : null,
    };

    try {
      if (editingWorkout) {
        const { error } = await supabase
          .from("workouts")
          .update(data)
          .eq("id", editingWorkout.id);
        if (error) throw error;
        toast.success("Workout updated");
      } else {
        const { data: newWorkout, error } = await supabase
          .from("workouts")
          .insert({ ...data, created_by: user?.id })
          .select()
          .single();
        if (error) throw error;
        toast.success("Workout created! Now add exercises to it.");
        setWorkoutDialogOpen(false);
        // Open builder immediately for new workout
        if (newWorkout) {
          openWorkoutBuilder(newWorkout);
        }
        fetchData();
        return;
      }

      setWorkoutDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving workout:", error);
      toast.error("Failed to save workout");
    }
  }

  async function handleDeleteWorkout(id: string) {
    if (!confirm("Are you sure you want to delete this workout?")) return;

    try {
      // First delete workout exercises
      await supabase.from("workout_exercises").delete().eq("workout_id", id);
      // Then delete workout
      const { error } = await supabase.from("workouts").delete().eq("id", id);
      if (error) throw error;
      toast.success("Workout deleted");
      fetchData();
    } catch (error) {
      console.error("Error deleting workout:", error);
      toast.error("Failed to delete workout");
    }
  }

  // Workout Builder
  async function openWorkoutBuilder(workout: Workout) {
    setSelectedWorkout(workout);
    setLoadingExercises(true);
    setBuilderDialogOpen(true);

    try {
      const { data, error } = await supabase
        .from("workout_exercises")
        .select(`
          *,
          exercise:exercises(*)
        `)
        .eq("workout_id", workout.id)
        .order("order_index");

      if (error) throw error;
      setWorkoutExercises(data || []);
    } catch (error) {
      console.error("Error loading workout exercises:", error);
      toast.error("Failed to load workout exercises");
    } finally {
      setLoadingExercises(false);
    }
  }

  async function handleAddExerciseToWorkout(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedWorkout || !newExerciseForm.exercise_id) return;

    setSavingExercises(true);
    try {
      const nextIndex = workoutExercises.length;
      const { data, error } = await supabase
        .from("workout_exercises")
        .insert({
          workout_id: selectedWorkout.id,
          exercise_id: newExerciseForm.exercise_id,
          order_index: nextIndex,
          sets: parseInt(newExerciseForm.sets) || 3,
          reps: newExerciseForm.reps || "10",
          rpe: newExerciseForm.rpe ? parseInt(newExerciseForm.rpe) : null,
          rest_seconds: newExerciseForm.rest_seconds ? parseInt(newExerciseForm.rest_seconds) : null,
          notes: newExerciseForm.notes || null,
        })
        .select(`
          *,
          exercise:exercises(*)
        `)
        .single();

      if (error) throw error;

      setWorkoutExercises([...workoutExercises, data]);
      setAddExerciseDialogOpen(false);
      setNewExerciseForm({
        exercise_id: "",
        sets: "3",
        reps: "10",
        rpe: "",
        rest_seconds: "90",
        notes: "",
      });
      toast.success("Exercise added to workout");
    } catch (error) {
      console.error("Error adding exercise:", error);
      toast.error("Failed to add exercise");
    } finally {
      setSavingExercises(false);
    }
  }

  async function handleRemoveExerciseFromWorkout(exerciseId: string) {
    if (!confirm("Remove this exercise from the workout?")) return;

    try {
      const { error } = await supabase
        .from("workout_exercises")
        .delete()
        .eq("id", exerciseId);

      if (error) throw error;

      setWorkoutExercises(workoutExercises.filter((e) => e.id !== exerciseId));
      toast.success("Exercise removed");
    } catch (error) {
      console.error("Error removing exercise:", error);
      toast.error("Failed to remove exercise");
    }
  }

  async function handleUpdateWorkoutExercise(id: string, field: string, value: string | number) {
    try {
      const { error } = await supabase
        .from("workout_exercises")
        .update({ [field]: value })
        .eq("id", id);

      if (error) throw error;

      setWorkoutExercises(
        workoutExercises.map((e) =>
          e.id === id ? { ...e, [field]: value } : e
        )
      );
    } catch (error) {
      console.error("Error updating exercise:", error);
    }
  }

  const filteredExercises = exercises.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredWorkouts = workouts.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group exercises by level
  const levelOrder = ["super_beginner", "beginner", "advanced"];
  const levelLabels: Record<string, string> = {
    super_beginner: "Super Beginner",
    beginner: "Beginner",
    advanced: "Advanced",
  };
  const levelColors: Record<string, string> = {
    super_beginner: "bg-blue-500/10 text-blue-600 border-blue-200",
    beginner: "bg-green-500/10 text-green-600 border-green-200",
    advanced: "bg-orange-500/10 text-orange-600 border-orange-200",
  };
  const exercisesByLevel = levelOrder.reduce((acc, level) => {
    const group = filteredExercises.filter((e) => (e.level || "beginner") === level);
    if (group.length > 0) acc[level] = group;
    return acc;
  }, {} as Record<string, typeof exercises>);

  // Group workouts by level prefix
  const workoutGroups: Record<string, typeof workouts> = {};
  filteredWorkouts.forEach((w) => {
    let group = "Other";
    if (w.name.startsWith("Advanced:")) group = "Advanced";
    else if (w.name.startsWith("Beginner:")) group = "Beginner";
    else if (w.name.startsWith("Super Beginner:")) group = "Super Beginner";
    if (!workoutGroups[group]) workoutGroups[group] = [];
    workoutGroups[group].push(w);
  });
  const workoutGroupOrder = ["Super Beginner", "Beginner", "Advanced", "Other"];

  // Get exercise count for each workout
  const [workoutExerciseCounts, setWorkoutExerciseCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function fetchExerciseCounts() {
      const counts: Record<string, number> = {};
      for (const workout of workouts) {
        const { count } = await supabase
          .from("workout_exercises")
          .select("*", { count: "exact", head: true })
          .eq("workout_id", workout.id);
        counts[workout.id] = count || 0;
      }
      setWorkoutExerciseCounts(counts);
    }
    if (workouts.length > 0) {
      fetchExerciseCounts();
    }
  }, [workouts]);

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
          <h1 className="text-2xl font-bold">Workouts & Exercises</h1>
          <p className="text-muted-foreground">
            Build your exercise library, then create workouts from those exercises
          </p>
        </div>

        <Tabs defaultValue="exercises">
          <TabsList>
            <TabsTrigger value="exercises">
              Exercise Library ({exercises.length})
            </TabsTrigger>
            <TabsTrigger value="workouts">
              Workouts ({workouts.length})
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <TabsContent value="exercises" className="mt-4">
            <div className="flex justify-end mb-4">
              <Button onClick={() => openExerciseDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Exercise
              </Button>
            </div>

            {Object.keys(exercisesByLevel).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No exercises found. Create your first exercise!</p>
              </div>
            ) : (
              <div className="space-y-8">
                {levelOrder.filter((lvl) => exercisesByLevel[lvl]).map((level) => (
                  <div key={level}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${levelColors[level]}`}>
                        {levelLabels[level]}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {exercisesByLevel[level].length} exercises
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {exercisesByLevel[level].map((exercise) => (
                        <Card key={exercise.id}>
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-base">{exercise.name}</CardTitle>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openExerciseDialog(exercise)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteExercise(exercise.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {exercise.video_url && (
                              <div className="mb-3 rounded-lg overflow-hidden bg-black relative group cursor-pointer" onClick={() => openExerciseDialog(exercise)}>
                                <SignedVideo
                                  bucket="exercise-videos"
                                  url={exercise.video_url}
                                  className="w-full h-28 object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                  controls={false}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center">
                                    <Play className="h-4 w-4 text-primary-foreground ml-0.5" />
                                  </div>
                                </div>
                              </div>
                            )}
                            {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {exercise.muscle_groups.map((muscle) => (
                                  <Badge key={muscle} variant="secondary" className="text-xs">
                                    {muscle}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="workouts" className="mt-4">
            <div className="flex justify-end mb-4">
              <Button onClick={() => openWorkoutDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Workout
              </Button>
            </div>

            {filteredWorkouts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No workouts found. Create your first workout!</p>
                <p className="text-sm mt-1">
                  Workouts are collections of exercises that you can assign to program days.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {workoutGroupOrder.filter((g) => workoutGroups[g]).map((group) => {
                  const groupColor =
                    group === "Super Beginner" ? "bg-blue-500/10 text-blue-600 border-blue-200" :
                    group === "Beginner" ? "bg-green-500/10 text-green-600 border-green-200" :
                    group === "Advanced" ? "bg-orange-500/10 text-orange-600 border-orange-200" :
                    "bg-muted text-muted-foreground border-border";
                  return (
                    <div key={group}>
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${groupColor}`}>
                          {group}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {workoutGroups[group].length} workouts
                        </span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {workoutGroups[group].map((workout) => (
                          <Card key={workout.id} className="hover:border-primary/50 transition-colors">
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                  <Dumbbell className="h-4 w-4 text-primary flex-shrink-0" />
                                  {workout.name.replace(/^(Advanced|Beginner|Super Beginner):\s*/, "")}
                                </CardTitle>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openWorkoutDialog(workout)}
                                    title="Edit details"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteWorkout(workout.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="outline">
                                  {workoutExerciseCounts[workout.id] || 0} exercises
                                </Badge>
                                {workout.duration_minutes && (
                                  <Badge variant="outline">{workout.duration_minutes} min</Badge>
                                )}
                              </div>
                              {workout.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {workout.description}
                                </p>
                              )}
                              <Button
                                variant="default"
                                size="sm"
                                className="w-full"
                                onClick={() => openWorkoutBuilder(workout)}
                              >
                                <ListPlus className="h-4 w-4 mr-2" />
                                Build Workout
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Exercise Dialog */}
        <Dialog open={exerciseDialogOpen} onOpenChange={setExerciseDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingExercise ? "Edit Exercise" : "Add Exercise"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveExercise} className="space-y-4">
              <div>
                <Label htmlFor="ex-name">Exercise Name</Label>
                <Input
                  id="ex-name"
                  value={exerciseForm.name}
                  onChange={(e) =>
                    setExerciseForm({ ...exerciseForm, name: e.target.value })
                  }
                  required
                  placeholder="e.g., Barbell Squat"
                />
              </div>

              {/* Video Upload */}
              <div>
                <Label>Exercise Video</Label>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleVideoUpload(file);
                  }}
                />

                {/* Preview or upload area */}
                {videoPreviewUrl || exerciseForm.video_url ? (
                  <div className="mt-2 rounded-xl overflow-hidden border border-border bg-black relative">
                    <SignedVideo
                      bucket="exercise-videos"
                      url={videoPreviewUrl || exerciseForm.video_url}
                      className="w-full max-h-48 object-contain"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="text-xs h-7"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={uploadingVideo}
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Replace
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="text-xs h-7"
                        onClick={() => {
                          setVideoPreviewUrl(null);
                          setExerciseForm({ ...exerciseForm, video_url: "" });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60">
                        <Progress value={uploadProgress} className="h-1.5" />
                      </div>
                    )}
                    {uploadProgress === 100 && (
                      <div className="absolute bottom-2 right-2">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadingVideo}
                    className="mt-2 w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-muted/50 transition-colors disabled:opacity-50"
                  >
                    {uploadingVideo ? (
                      <>
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        <p className="text-sm font-medium">Uploading...</p>
                        <Progress value={uploadProgress} className="w-full h-1.5 mt-1" />
                      </>
                    ) : (
                      <>
                        <Video className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm font-medium">Click to upload video</p>
                        <p className="text-xs text-muted-foreground">MP4, WebM, MOV up to 600MB</p>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div>
                <Label htmlFor="ex-cues">Written Cues</Label>
                <Textarea
                  id="ex-cues"
                  value={exerciseForm.written_cues}
                  onChange={(e) =>
                    setExerciseForm({ ...exerciseForm, written_cues: e.target.value })
                  }
                  placeholder="Step-by-step instructions..."
                />
              </div>
              <div>
                <Label htmlFor="ex-tips">Coaching Tips</Label>
                <Textarea
                  id="ex-tips"
                  value={exerciseForm.coaching_tips}
                  onChange={(e) =>
                    setExerciseForm({ ...exerciseForm, coaching_tips: e.target.value })
                  }
                  placeholder="Pro tips for better form..."
                />
              </div>
              <div>
                <Label htmlFor="ex-muscles">Muscle Groups (comma separated)</Label>
                <Input
                  id="ex-muscles"
                  value={exerciseForm.muscle_groups}
                  onChange={(e) =>
                    setExerciseForm({ ...exerciseForm, muscle_groups: e.target.value })
                  }
                  placeholder="Chest, Triceps, Shoulders"
                />
              </div>
              <div>
                <Label htmlFor="ex-equipment">Equipment (comma separated)</Label>
                <Input
                  id="ex-equipment"
                  value={exerciseForm.equipment}
                  onChange={(e) =>
                    setExerciseForm({ ...exerciseForm, equipment: e.target.value })
                  }
                  placeholder="Barbell, Bench"
                />
              </div>
              <div>
                <Label htmlFor="ex-level">Level</Label>
                <Select
                  value={exerciseForm.level}
                  onValueChange={(value) => setExerciseForm({ ...exerciseForm, level: value })}
                >
                  <SelectTrigger id="ex-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_beginner">Super Beginner</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={uploadingVideo}>
                {uploadingVideo ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading video...</>
                ) : editingExercise ? "Save Changes" : "Create Exercise"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Workout Dialog */}
        <Dialog open={workoutDialogOpen} onOpenChange={setWorkoutDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingWorkout ? "Edit Workout" : "Create Workout"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveWorkout} className="space-y-4">
              <div>
                <Label htmlFor="wk-name">Workout Name</Label>
                <Input
                  id="wk-name"
                  value={workoutForm.name}
                  onChange={(e) =>
                    setWorkoutForm({ ...workoutForm, name: e.target.value })
                  }
                  required
                  placeholder="e.g., Upper Body Day A"
                />
              </div>
              <div>
                <Label htmlFor="wk-duration">Duration (minutes)</Label>
                <Input
                  id="wk-duration"
                  type="number"
                  value={workoutForm.duration_minutes}
                  onChange={(e) =>
                    setWorkoutForm({ ...workoutForm, duration_minutes: e.target.value })
                  }
                  placeholder="45"
                />
              </div>
              <div>
                <Label htmlFor="wk-desc">Description</Label>
                <Textarea
                  id="wk-desc"
                  value={workoutForm.description}
                  onChange={(e) =>
                    setWorkoutForm({ ...workoutForm, description: e.target.value })
                  }
                  placeholder="Brief description of this workout..."
                />
              </div>
              <Button type="submit" className="w-full">
                {editingWorkout ? "Save Changes" : "Create Workout"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Workout Builder Dialog */}
        <Dialog open={builderDialogOpen} onOpenChange={setBuilderDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                Build: {selectedWorkout?.name}
              </DialogTitle>
            </DialogHeader>

            {loadingExercises ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    {workoutExercises.length} exercise{workoutExercises.length !== 1 ? "s" : ""} in this workout
                  </p>
                  <Button onClick={() => setAddExerciseDialogOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Exercise
                  </Button>
                </div>

                <ScrollArea className="flex-1">
                  {workoutExercises.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ListPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No exercises yet</p>
                      <p className="text-sm">Add exercises from your library to build this workout</p>
                    </div>
                  ) : (
                    <div className="space-y-3 pr-4">
                      {workoutExercises.map((we, index) => (
                        <Card key={we.id} className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <GripVertical className="h-5 w-5 cursor-grab" />
                              <span className="text-lg font-bold">{index + 1}</span>
                            </div>
                            <div className="flex-1 space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-semibold">{we.exercise?.name}</h4>
                                  {we.exercise?.muscle_groups && (
                                    <p className="text-sm text-muted-foreground">
                                      {we.exercise.muscle_groups.join(", ")}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive"
                                  onClick={() => handleRemoveExerciseFromWorkout(we.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                <div>
                                  <Label className="text-xs">Sets</Label>
                                  <Input
                                    type="number"
                                    value={we.sets}
                                    onChange={(e) =>
                                      handleUpdateWorkoutExercise(we.id, "sets", parseInt(e.target.value) || 3)
                                    }
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Reps</Label>
                                  <Input
                                    value={we.reps}
                                    onChange={(e) =>
                                      handleUpdateWorkoutExercise(we.id, "reps", e.target.value)
                                    }
                                    className="h-8"
                                    placeholder="8-12"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">RPE</Label>
                                  <Input
                                    type="number"
                                    value={we.rpe || ""}
                                    onChange={(e) =>
                                      handleUpdateWorkoutExercise(we.id, "rpe", e.target.value ? parseInt(e.target.value) : null)
                                    }
                                    className="h-8"
                                    placeholder="7-9"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Rest (sec)</Label>
                                  <Input
                                    type="number"
                                    value={we.rest_seconds || ""}
                                    onChange={(e) =>
                                      handleUpdateWorkoutExercise(we.id, "rest_seconds", e.target.value ? parseInt(e.target.value) : null)
                                    }
                                    className="h-8"
                                    placeholder="90"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Exercise to Workout Dialog */}
        <Dialog open={addExerciseDialogOpen} onOpenChange={setAddExerciseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Exercise to Workout</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddExerciseToWorkout} className="space-y-4">
              <div>
                <Label>Select Exercise</Label>
                <Select
                  value={newExerciseForm.exercise_id || "none"}
                  onValueChange={(value) =>
                    setNewExerciseForm({ ...newExerciseForm, exercise_id: value === "none" ? "" : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an exercise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>Choose an exercise</SelectItem>
                    {levelOrder.filter((lvl) => exercises.some((e) => (e.level || "beginner") === lvl)).map((level) => (
                      <div key={level}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {levelLabels[level]}
                        </div>
                        {exercises
                          .filter((e) => (e.level || "beginner") === level)
                          .map((exercise) => (
                            <SelectItem key={exercise.id} value={exercise.id}>
                              {exercise.name}
                            </SelectItem>
                          ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sets</Label>
                  <Input
                    type="number"
                    value={newExerciseForm.sets}
                    onChange={(e) =>
                      setNewExerciseForm({ ...newExerciseForm, sets: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Reps</Label>
                  <Input
                    value={newExerciseForm.reps}
                    onChange={(e) =>
                      setNewExerciseForm({ ...newExerciseForm, reps: e.target.value })
                    }
                    placeholder="10 or 8-12"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>RPE (optional)</Label>
                  <Input
                    type="number"
                    value={newExerciseForm.rpe}
                    onChange={(e) =>
                      setNewExerciseForm({ ...newExerciseForm, rpe: e.target.value })
                    }
                    placeholder="7-9"
                  />
                </div>
                <div>
                  <Label>Rest (seconds)</Label>
                  <Input
                    type="number"
                    value={newExerciseForm.rest_seconds}
                    onChange={(e) =>
                      setNewExerciseForm({ ...newExerciseForm, rest_seconds: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  value={newExerciseForm.notes}
                  onChange={(e) =>
                    setNewExerciseForm({ ...newExerciseForm, notes: e.target.value })
                  }
                  placeholder="Any special instructions..."
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={!newExerciseForm.exercise_id || savingExercises}
              >
                {savingExercises && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Add to Workout
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}