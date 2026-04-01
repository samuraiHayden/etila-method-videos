import { useState, useEffect } from "react";
import { SignedImage } from "@/components/ui/signed-image";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Camera,
  ChevronRight,
  TrendingUp,
  Scale,
  Ruler,
  Target,
  Calendar,
  LogOut,
  MessageSquare,
  Loader2,
  Edit,
  Plus,
  Image,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { differenceInWeeks, format } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MeasurementLog {
  id: string;
  logged_at: string;
  weight: number | null;
  waist: number | null;
  hips: number | null;
  chest: number | null;
  left_arm: number | null;
  right_arm: number | null;
  left_thigh: number | null;
  right_thigh: number | null;
}

interface ProgressPhoto {
  id: string;
  photo_url: string;
  taken_at: string;
  photo_type: string | null;
  notes: string | null;
}

interface Coach {
  full_name: string | null;
  email: string;
}

const PHOTO_TYPES = ["front", "side", "back", "other"] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const ProfilePage = () => {
  const { profile, user, signOut, refreshProfile, isLoading } = useAuth();
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [measurementDialogOpen, setMeasurementDialogOpen] = useState(false);
  const [photoUploadDialogOpen, setPhotoUploadDialogOpen] = useState(false);
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoForm, setPhotoForm] = useState({
    photo_type: "front" as typeof PHOTO_TYPES[number],
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [weightLost, setWeightLost] = useState<number | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementLog[]>([]);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [hasCoach, setHasCoach] = useState(false);
  const [activeProgram, setActiveProgram] = useState<{ start_date: string; duration_weeks: number; name: string } | null>(null);

  const [editForm, setEditForm] = useState({
    full_name: "",
    height: "",
    current_weight: "",
    goal_weight: "",
    goals: "",
    injuries: "",
    experience_level: "",
  });

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

  // Sync form from profile when dialog opens OR when profile loads while dialog is open
  useEffect(() => {
    if (editDialogOpen && profile) {
      setEditForm({
        full_name: profile.full_name || "",
        height: profile.height || "",
        current_weight: profile.current_weight || "",
        goal_weight: profile.goal_weight || "",
        goals: profile.goals?.join(", ") || "",
        injuries: profile.injuries || "",
        experience_level: profile.experience_level || "",
      });
    }
  }, [editDialogOpen, profile]);

  useEffect(() => {
    if (user && !isLoading) {
      fetchUserData();
    }
  }, [user, isLoading]);

  async function fetchUserData() {
    if (!user) return;
    try {
      const { data: measurementsData } = await supabase
        .from("measurement_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .limit(5);

      setMeasurements(measurementsData || []);

      if (measurementsData && measurementsData.length > 0) {
        const { data: allWeights } = await supabase
          .from("measurement_logs")
          .select("weight, logged_at")
          .eq("user_id", user.id)
          .not("weight", "is", null)
          .order("logged_at", { ascending: true });

        if (allWeights && allWeights.length >= 2) {
          const firstWeight = allWeights[0].weight as number;
          const latestWeight = allWeights[allWeights.length - 1].weight as number;
          setWeightLost(firstWeight - latestWeight);
        } else if (allWeights && allWeights.length === 1 && profile?.starting_weight) {
          const start = parseFloat(profile.starting_weight);
          const current = allWeights[0].weight as number;
          if (!isNaN(start)) setWeightLost(start - current);
        } else {
          setWeightLost(null);
        }
      } else if (profile?.starting_weight && profile?.current_weight) {
        const start = parseFloat(profile.starting_weight);
        const current = parseFloat(profile.current_weight);
        if (!isNaN(start) && !isNaN(current)) setWeightLost(start - current);
      }

      const { data: photosData } = await supabase
        .from("progress_photos")
        .select("*")
        .eq("user_id", user.id)
        .order("taken_at", { ascending: false })
        .limit(6);

      setPhotos(photosData || []);

      if (profile?.assigned_coach_id) {
        const { data: coachProfile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("user_id", profile.assigned_coach_id)
          .single();

        if (coachProfile) {
          setCoach(coachProfile);
          setHasCoach(true);
        }
      }

      const { data: userProgramData, error: upError } = await supabase
        .from("user_programs")
        .select("start_date, status, program_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);

      if (upError) console.error("Error fetching user program:", upError);

      if (userProgramData && userProgramData.length > 0) {
        const up = userProgramData[0];
        const { data: templateData } = await supabase
          .from("program_templates")
          .select("name, duration_weeks")
          .eq("id", up.program_id)
          .single();

        setActiveProgram({
          start_date: up.start_date,
          duration_weeks: templateData?.duration_weeks || 12,
          name: templateData?.name || "Training Program",
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleSaveProfile = async () => {
    const userId = user?.id;
    if (!userId) {
      toast.error("You must be logged in to save profile changes");
      return;
    }
    setSaving(true);
    try {
      const updateData: Record<string, any> = {
        full_name: editForm.full_name || null,
        height: editForm.height || null,
        current_weight: editForm.current_weight || null,
        goal_weight: editForm.goal_weight || null,
        goals: editForm.goals ? editForm.goals.split(",").map((g) => g.trim()) : null,
        injuries: editForm.injuries || null,
        experience_level: editForm.experience_level || null,
      };
      if ((!profile?.starting_weight) && editForm.current_weight) {
        updateData.starting_weight = editForm.current_weight;
      }
      console.log("Updating profile with:", updateData, "user_id:", userId);
      const { data, error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", userId)
        .select();
      console.log("Update result:", { data, error });
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Update returned no rows - possible permissions issue");
      }
      await refreshProfile();
      toast.success("Profile updated!");
      setEditDialogOpen(false);
      fetchUserData();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
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
      if (measurementForm.weight && profile) {
        await supabase.from("profiles").update({ current_weight: measurementForm.weight }).eq("id", profile.id);
        await refreshProfile();
      }
      toast.success("Measurements logged!");
      setMeasurementDialogOpen(false);
      setMeasurementForm({ weight: "", waist: "", hips: "", chest: "", left_arm: "", right_arm: "", left_thigh: "", right_thigh: "" });
      fetchUserData();
    } catch (error) {
      console.error("Error saving measurement:", error);
      toast.error("Failed to save measurements");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be less than 5MB"); return; }
    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}_${photoForm.photo_type}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("progress-photos").upload(fileName, file);
      if (uploadError) throw uploadError;
      // Store path, not public URL (bucket is private)
      const { error: dbError } = await supabase.from("progress_photos").insert({
        user_id: user.id, photo_url: fileName, photo_type: photoForm.photo_type,
        notes: photoForm.notes || null, taken_at: new Date().toISOString().split("T")[0],
      });
      if (dbError) throw dbError;
      toast.success("Photo uploaded successfully!");
      setPhotoUploadDialogOpen(false);
      setPhotoForm({ photo_type: "front", notes: "" });
      fetchUserData();
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId: string, photoUrl: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;
    try {
      const urlParts = photoUrl.split("/progress-photos/");
      const filePath = urlParts[1];
      if (filePath) await supabase.storage.from("progress-photos").remove([filePath]);
      const { error } = await supabase.from("progress_photos").delete().eq("id", photoId);
      if (error) throw error;
      toast.success("Photo deleted");
      fetchUserData();
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error("Failed to delete photo");
    }
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    if (email) return email[0].toUpperCase();
    return "U";
  };

  const getProgramWeek = () => {
    const startDate = profile?.program_start_date || activeProgram?.start_date;
    if (startDate) {
      const weeks = differenceInWeeks(new Date(), new Date(startDate)) + 1;
      return Math.max(1, weeks);
    }
    return null;
  };

  const programDurationWeeks = activeProgram?.duration_weeks || 12;
  const programWeek = getProgramWeek();
  const programProgress = programWeek ? (programWeek / programDurationWeeks) * 100 : 0;

  if (isLoading) {
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
      {/* iOS-style header */}
      <div className="px-5 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-[34px] font-bold tracking-tight"
          >
            Profile
          </motion.h1>
          <Button size="icon" variant="ghost" className="text-muted-foreground" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="px-5 pb-28 space-y-5">
        {/* User Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.4 }}
          className="flex items-center gap-4 p-5 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 shadow-soft"
        >
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                {getInitials(profile?.full_name || null, profile?.email || null)}
              </AvatarFallback>
            </Avatar>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg">
              <Camera className="h-3 w-3" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold truncate">
                {profile?.full_name || user?.user_metadata?.full_name || profile?.email?.split("@")[0] || user?.email?.split("@")[0] || "User"}
              </h2>
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <button className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors shrink-0">
                    <Edit className="h-4 w-4 text-primary" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription className="sr-only">Update your profile information</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit_full_name">Full Name</Label>
                      <Input id="edit_full_name" name="edit_full_name" autoComplete="off" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} className="rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit_height">Height</Label>
                        <Input id="edit_height" name="edit_height" autoComplete="off" value={editForm.height} onChange={(e) => setEditForm({ ...editForm, height: e.target.value })} placeholder="5'6&quot;" className="rounded-xl" />
                      </div>
                      <div>
                        <Label htmlFor="edit_current_weight">Current Weight</Label>
                        <Input id="edit_current_weight" name="edit_current_weight" autoComplete="off" value={editForm.current_weight} onChange={(e) => setEditForm({ ...editForm, current_weight: e.target.value })} placeholder="145 lbs" className="rounded-xl" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit_goal_weight">Goal Weight</Label>
                      <Input id="edit_goal_weight" name="edit_goal_weight" autoComplete="off" value={editForm.goal_weight} onChange={(e) => setEditForm({ ...editForm, goal_weight: e.target.value })} placeholder="135 lbs" className="rounded-xl" />
                    </div>
                    <div>
                      <Label htmlFor="edit_experience_level">Experience Level</Label>
                      <Select value={editForm.experience_level} onValueChange={(value) => setEditForm({ ...editForm, experience_level: value })}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select level" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit_goals">Goals (comma separated)</Label>
                      <Input id="edit_goals" name="edit_goals" autoComplete="off" value={editForm.goals} onChange={(e) => setEditForm({ ...editForm, goals: e.target.value })} placeholder="Build muscle, Lose fat" className="rounded-xl" />
                    </div>
                    <div>
                      <Label htmlFor="edit_injuries">Injuries / Limitations</Label>
                      <Textarea id="edit_injuries" name="edit_injuries" autoComplete="off" value={editForm.injuries} onChange={(e) => setEditForm({ ...editForm, injuries: e.target.value })} className="rounded-xl" />
                    </div>
                    <Button 
                      type="button" 
                      className="w-full rounded-xl relative z-50" 
                      disabled={saving} 
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleSaveProfile();
                      }}
                    >
                      {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
            <Badge variant="secondary" className="mt-1.5 bg-success/10 text-success border-0 text-[10px] font-semibold">
              {profile?.status || "Active"}
            </Badge>
          </div>
        </motion.div>

        {/* Program Progress */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.4 }}
        >
          {programWeek ? (
            <div className="p-5 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-primary" />
                  <span className="text-sm font-bold">{activeProgram?.name || "Program Progress"}</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  Week {programWeek}/{programDurationWeeks}
                </span>
              </div>
              <Progress value={Math.min(programProgress, 100)} className="h-2 rounded-full" />
              <div className="flex items-center justify-between mt-2.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Started {(profile?.program_start_date || activeProgram?.start_date)
                    ? format(new Date(profile?.program_start_date || activeProgram!.start_date), "MMM d, yyyy")
                    : "Not set"}
                </span>
                <span className="font-semibold text-primary">
                  {Math.min(Math.round(programProgress), 100)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border/30">
              <div className="flex items-center gap-3 text-muted-foreground">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="text-xs">No program assigned yet. Your coach will set this up.</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-3"
        >
          {[
            {
              icon: Ruler, label: "Height", value: profile?.height,
              placeholder: "Tap to set", onClick: () => { if (!profile?.height) setEditDialogOpen(true); },
            },
            {
              icon: Scale, label: "Current Weight",
              value: measurements.length > 0 && measurements[0].weight
                ? `${measurements[0].weight} lbs`
                : profile?.current_weight ? `${profile.current_weight} lbs` : null,
            },
            {
              icon: Target, label: "Goal Weight",
              value: profile?.goal_weight ? `${profile.goal_weight} lbs` : null,
              placeholder: "Tap to set", onClick: () => { if (!profile?.goal_weight) setEditDialogOpen(true); },
            },
            {
              icon: TrendingUp,
              label: weightLost !== null && weightLost < 0 ? "Weight Gained" : "Weight Lost",
              value: weightLost !== null ? `${Math.abs(weightLost).toFixed(1)} lbs` : null,
              highlight: weightLost !== null && weightLost > 0,
            },
          ].map((stat, i) => (
            <motion.button
              key={stat.label}
              custom={i}
              variants={fadeUp}
              onClick={stat.onClick}
              className={cn(
                "p-4 rounded-2xl text-left transition-all duration-200 border",
                stat.highlight
                  ? "bg-success/5 border-success/20"
                  : "bg-card/80 backdrop-blur-xl border-border/40 shadow-soft hover:border-border/60"
              )}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="text-xl font-bold">
                {stat.value || (
                  <span className="text-xs text-muted-foreground/50 font-normal">{stat.placeholder || "—"}</span>
                )}
              </p>
            </motion.button>
          ))}
        </motion.div>

        {/* Goals */}
        {profile?.goals && profile.goals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="p-5 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 shadow-soft"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">My Goals</h3>
            <div className="flex flex-wrap gap-2">
              {profile.goals.map((goal) => (
                <Badge key={goal} variant="secondary" className="rounded-lg border-0 bg-secondary/60 text-foreground text-xs font-medium">
                  {goal}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Measurements */}
        {measurements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36, duration: 0.4 }}
            className="p-5 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 shadow-soft"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Recent Measurements</h3>
            <div className="space-y-2.5">
              {measurements.slice(0, 3).map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(m.logged_at), "MMM d, yyyy")}
                  </span>
                  <div className="flex items-center gap-3 text-xs font-medium">
                    {m.weight && <span>{m.weight} lbs</span>}
                    {m.waist && <span className="text-muted-foreground">Waist: {m.waist}"</span>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.4 }}
          className="space-y-2"
        >
          {/* Progress Photos */}
          <button
            onClick={() => setPhotoGalleryOpen(true)}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 shadow-soft hover:border-border/60 transition-all"
          >
            <span className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Image className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium">Progress Photos ({photos.length})</span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
          </button>

          {/* Photo Gallery Dialog */}
          <Dialog open={photoGalleryOpen} onOpenChange={setPhotoGalleryOpen}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  Progress Photos
                  <Button size="sm" className="rounded-xl" onClick={() => { setPhotoGalleryOpen(false); setPhotoUploadDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> Add Photo
                  </Button>
                </DialogTitle>
              </DialogHeader>
              {photos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No progress photos yet</p>
                  <p className="text-xs mt-1">Upload your first photo to track your journey!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group rounded-xl overflow-hidden">
                      <SignedImage bucket="progress-photos" url={photo.photo_url} alt={`Progress photo - ${photo.photo_type}`} className="w-full aspect-square object-cover" />
                      <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <Badge variant="secondary" className="capitalize">{photo.photo_type || "Photo"}</Badge>
                        <span className="text-primary-foreground text-xs">{format(new Date(photo.taken_at), "MMM d, yyyy")}</span>
                        <Button size="sm" variant="destructive" className="rounded-lg" onClick={() => handleDeletePhoto(photo.id, photo.photo_url)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Photo Upload Dialog */}
          <Dialog open={photoUploadDialogOpen} onOpenChange={setPhotoUploadDialogOpen}>
            <DialogContent className="rounded-2xl">
              <DialogHeader><DialogTitle>Upload Progress Photo</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Photo Type</Label>
                  <Select value={photoForm.photo_type} onValueChange={(value) => setPhotoForm({ ...photoForm, photo_type: value as typeof PHOTO_TYPES[number] })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{PHOTO_TYPES.map((type) => (<SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notes (optional)</Label>
                  <Textarea value={photoForm.notes} onChange={(e) => setPhotoForm({ ...photoForm, notes: e.target.value })} placeholder="Any notes about this photo..." className="rounded-xl" />
                </div>
                <div>
                  <Label>Select Photo</Label>
                  <Input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} className="cursor-pointer rounded-xl" />
                  {uploadingPhoto && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />Uploading...
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Log Measurements */}
          <Dialog open={measurementDialogOpen} onOpenChange={setMeasurementDialogOpen}>
            <DialogTrigger asChild>
              <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 shadow-soft hover:border-border/60 transition-all">
                <span className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Scale className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">Log Measurements</span>
                </span>
                <Plus className="h-4 w-4 text-muted-foreground/40" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
              <DialogHeader><DialogTitle>Log Measurements</DialogTitle></DialogHeader>
              <form onSubmit={handleSaveMeasurement} className="space-y-4">
                <div>
                  <Label htmlFor="m-weight">Weight (lbs)</Label>
                  <Input id="m-weight" type="number" step="0.1" value={measurementForm.weight} onChange={(e) => setMeasurementForm({ ...measurementForm, weight: e.target.value })} placeholder="145" className="rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: "waist", label: "Waist (in)" },
                    { key: "hips", label: "Hips (in)" },
                    { key: "chest", label: "Chest (in)" },
                    { key: "left_arm", label: "Left Arm (in)" },
                    { key: "right_arm", label: "Right Arm (in)" },
                    { key: "left_thigh", label: "Left Thigh (in)" },
                    { key: "right_thigh", label: "Right Thigh (in)" },
                  ].map((field) => (
                    <div key={field.key}>
                      <Label>{field.label}</Label>
                      <Input type="number" step="0.1" value={(measurementForm as any)[field.key]} onChange={(e) => setMeasurementForm({ ...measurementForm, [field.key]: e.target.value })} className="rounded-xl" />
                    </div>
                  ))}
                </div>
                <Button type="submit" className="w-full rounded-xl" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save Measurements
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Coach / Messages */}
          <button
            onClick={() => {
              if (hasCoach) navigate("/messages");
              else toast.info("No coach assigned yet");
            }}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 shadow-soft hover:border-border/60 transition-all"
          >
            <span className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium">
                {hasCoach ? `Message ${coach?.full_name || "Coach"}` : "Coach Not Assigned"}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
          </button>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <Button
            variant="ghost"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </motion.div>
      </div>
    </AppShell>
  );
};

export default ProfilePage;
