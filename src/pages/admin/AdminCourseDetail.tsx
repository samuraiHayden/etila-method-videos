import { useEffect, useState } from "react";
import { SignedVideo } from "@/components/ui/signed-video";
import { useParams, Link } from "react-router-dom";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  ArrowLeft,
  GripVertical,
  FileText,
  Video,
  File,
  Upload,
  X as XIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Module {
  id: string;
  title: string;
  order_index: number;
  drip_week: number | null;
  video_url: string | null;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  content_type: string;
  order_index: number;
  content: string | null;
  duration_minutes: number | null;
  is_start_here: boolean;
  module_id: string;
}

export default function AdminCourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const [courseTitle, setCourseTitle] = useState("");
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Module dialog
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleForm, setModuleForm] = useState({ title: "", drip_week: "", video_url: "" });

  // Lesson dialog
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonModuleId, setLessonModuleId] = useState("");
  const [lessonForm, setLessonForm] = useState({
    title: "",
    content_type: "text",
    content: "",
    duration_minutes: "",
    is_start_here: false,
  });

  useEffect(() => {
    if (courseId) fetchData();
  }, [courseId]);

  async function fetchData() {
    try {
      const [{ data: course }, { data: modulesData }] = await Promise.all([
        supabase.from("courses").select("title").eq("id", courseId!).single(),
        supabase
          .from("course_modules")
          .select("*")
          .eq("course_id", courseId!)
          .order("order_index"),
      ]);

      setCourseTitle(course?.title || "");

      if (modulesData && modulesData.length > 0) {
        const moduleIds = modulesData.map((m) => m.id);
        const { data: lessonsData } = await supabase
          .from("lessons")
          .select("*")
          .in("module_id", moduleIds)
          .order("order_index");

        const modulesWithLessons: Module[] = modulesData.map((m) => ({
          ...m,
          lessons: (lessonsData || []).filter((l) => l.module_id === m.id),
        }));
        setModules(modulesWithLessons);
      } else {
        setModules([]);
      }
    } catch (error) {
      console.error("Error fetching course detail:", error);
      toast.error("Failed to load course details");
    } finally {
      setLoading(false);
    }
  }

  // --- Module CRUD ---
  function openModuleDialog(mod?: Module) {
    if (mod) {
      setEditingModule(mod);
      setModuleForm({
        title: mod.title,
        drip_week: mod.drip_week?.toString() || "",
        video_url: mod.video_url || "",
      });
    } else {
      setEditingModule(null);
      setModuleForm({ title: "", drip_week: "", video_url: "" });
    }
    setModuleDialogOpen(true);
  }

  async function handleSaveModule(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      title: moduleForm.title,
      drip_week: moduleForm.drip_week ? parseInt(moduleForm.drip_week) : null,
      video_url: moduleForm.video_url || null,
      course_id: courseId!,
    };

    try {
      if (editingModule) {
        const { error } = await supabase
          .from("course_modules")
          .update(data)
          .eq("id", editingModule.id);
        if (error) throw error;
        toast.success("Module updated");
      } else {
        const { error } = await supabase.from("course_modules").insert({
          ...data,
          order_index: modules.length,
        });
        if (error) throw error;
        toast.success("Module created");
      }
      setModuleDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving module:", error);
      toast.error("Failed to save module");
    }
  }

  async function handleDeleteModule(id: string) {
    if (!confirm("Delete this module and all its lessons?")) return;
    try {
      // Delete lessons first
      await supabase.from("lessons").delete().eq("module_id", id);
      const { error } = await supabase.from("course_modules").delete().eq("id", id);
      if (error) throw error;
      toast.success("Module deleted");
      fetchData();
    } catch (error) {
      console.error("Error deleting module:", error);
      toast.error("Failed to delete module");
    }
  }

  // --- Lesson CRUD ---
  function openLessonDialog(moduleId: string, lesson?: Lesson) {
    setLessonModuleId(moduleId);
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({
        title: lesson.title,
        content_type: lesson.content_type,
        content: lesson.content || "",
        duration_minutes: lesson.duration_minutes?.toString() || "",
        is_start_here: lesson.is_start_here,
      });
    } else {
      setEditingLesson(null);
      setLessonForm({
        title: "",
        content_type: "text",
        content: "",
        duration_minutes: "",
        is_start_here: false,
      });
    }
    setLessonDialogOpen(true);
  }

  async function handleSaveLesson(e: React.FormEvent) {
    e.preventDefault();
    const mod = modules.find((m) => m.id === lessonModuleId);
    const data = {
      title: lessonForm.title,
      content_type: lessonForm.content_type,
      content: lessonForm.content || null,
      duration_minutes: lessonForm.duration_minutes
        ? parseInt(lessonForm.duration_minutes)
        : null,
      is_start_here: lessonForm.is_start_here,
      module_id: lessonModuleId,
    };

    try {
      if (editingLesson) {
        const { error } = await supabase
          .from("lessons")
          .update(data)
          .eq("id", editingLesson.id);
        if (error) throw error;
        toast.success("Lesson updated");
      } else {
        const { error } = await supabase.from("lessons").insert({
          ...data,
          order_index: mod?.lessons.length || 0,
        });
        if (error) throw error;
        toast.success("Lesson created");
      }
      setLessonDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving lesson:", error);
      toast.error("Failed to save lesson");
    }
  }

  async function handleDeleteLesson(id: string) {
    if (!confirm("Delete this lesson?")) return;
    try {
      const { error } = await supabase.from("lessons").delete().eq("id", id);
      if (error) throw error;
      toast.success("Lesson deleted");
      fetchData();
    } catch (error) {
      console.error("Error deleting lesson:", error);
      toast.error("Failed to delete lesson");
    }
  }

  const contentTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "pdf":
        return <File className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
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
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/admin/courses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{courseTitle}</h1>
            <p className="text-muted-foreground">
              {modules.length} module{modules.length !== 1 ? "s" : ""} ·{" "}
              {modules.reduce((a, m) => a + m.lessons.length, 0)} lessons
            </p>
          </div>
          <Button onClick={() => openModuleDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Module
          </Button>
        </div>

        {/* Modules */}
        {modules.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No modules yet. Add your first module!
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={modules.map((m) => m.id)}>
            {modules.map((mod) => (
              <AccordionItem key={mod.id} value={mod.id}>
                <div className="flex items-center">
                  <AccordionTrigger className="flex-1 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{mod.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {mod.lessons.length} lesson{mod.lessons.length !== 1 ? "s" : ""}
                      </Badge>
                      {mod.drip_week && (
                        <Badge variant="outline" className="text-xs">
                          Week {mod.drip_week}
                        </Badge>
                      )}
                      {mod.video_url && (
                        <Badge variant="secondary" className="text-xs">
                          <Video className="h-3 w-3 mr-1" />
                          Video
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <div className="flex gap-1 mr-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        openModuleDialog(mod);
                      }}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteModule(mod.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                <AccordionContent>
                  <div className="space-y-2 pl-7">
                    {mod.lessons.map((lesson) => (
                      <Card key={lesson.id} className="shadow-none">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {contentTypeIcon(lesson.content_type)}
                            <div>
                              <p className="font-medium text-sm">{lesson.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="capitalize">{lesson.content_type}</span>
                                {lesson.duration_minutes && (
                                  <span>· {lesson.duration_minutes} min</span>
                                )}
                                {lesson.is_start_here && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    Start Here
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openLessonDialog(mod.id, lesson)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleDeleteLesson(lesson.id)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => openLessonDialog(mod.id)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-2" />
                      Add Lesson
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {/* Module Dialog */}
        <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingModule ? "Edit Module" : "Add Module"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveModule} className="space-y-4">
              <div>
                <Label htmlFor="mod-title">Title</Label>
                <Input
                  id="mod-title"
                  value={moduleForm.title}
                  onChange={(e) =>
                    setModuleForm({ ...moduleForm, title: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="mod-drip">Drip Week (optional)</Label>
                <Input
                  id="mod-drip"
                  type="number"
                  value={moduleForm.drip_week}
                  onChange={(e) =>
                    setModuleForm({ ...moduleForm, drip_week: e.target.value })
                  }
                  placeholder="e.g. 2"
                />
              </div>
              <div>
                <Label>Module Video (optional)</Label>
                {moduleForm.video_url ? (
                  <div className="space-y-2">
                    <div className="rounded-lg overflow-hidden bg-black aspect-video">
                      <SignedVideo bucket="exercise-videos" url={moduleForm.video_url} />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setModuleForm({ ...moduleForm, video_url: "" })}
                    >
                      <XIcon className="h-3.5 w-3.5 mr-1" />
                      Remove Video
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <label
                      htmlFor="mod-video-upload"
                      className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      {uploadingVideo ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                          <span className="text-sm text-muted-foreground">Upload video file</span>
                        </>
                      )}
                    </label>
                    <input
                      id="mod-video-upload"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      disabled={uploadingVideo}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingVideo(true);
                        try {
                          const ext = file.name.split(".").pop();
                          const path = `module-videos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                          const { error } = await supabase.storage
                            .from("exercise-videos")
                            .upload(path, file);
                          if (error) throw error;
                          // Store path, not public URL (bucket is private)
                          setModuleForm({ ...moduleForm, video_url: path });
                          toast.success("Video uploaded");
                        } catch (err) {
                          console.error(err);
                          toast.error("Failed to upload video");
                        } finally {
                          setUploadingVideo(false);
                          e.target.value = "";
                        }
                      }}
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Add an intro/overview video for this module
                </p>
              </div>
              <Button type="submit" className="w-full">
                {editingModule ? "Save Changes" : "Create Module"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Lesson Dialog */}
        <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingLesson ? "Edit Lesson" : "Add Lesson"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveLesson} className="space-y-4">
              <div>
                <Label htmlFor="les-title">Title</Label>
                <Input
                  id="les-title"
                  value={lessonForm.title}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, title: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="les-type">Content Type</Label>
                <Select
                  value={lessonForm.content_type}
                  onValueChange={(v) =>
                    setLessonForm({ ...lessonForm, content_type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="les-content">Content</Label>
                <Textarea
                  id="les-content"
                  value={lessonForm.content}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, content: e.target.value })
                  }
                  rows={6}
                  placeholder={
                    lessonForm.content_type === "video"
                      ? "Paste video URL..."
                      : lessonForm.content_type === "pdf"
                      ? "Paste PDF URL..."
                      : "Lesson content..."
                  }
                />
              </div>
              <div>
                <Label htmlFor="les-dur">Duration (minutes)</Label>
                <Input
                  id="les-dur"
                  type="number"
                  value={lessonForm.duration_minutes}
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      duration_minutes: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="les-start"
                  checked={lessonForm.is_start_here}
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      is_start_here: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <Label htmlFor="les-start">Mark as "Start Here" lesson</Label>
              </div>
              <Button type="submit" className="w-full">
                {editingLesson ? "Save Changes" : "Create Lesson"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
