import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CourseSidebar } from "@/components/course/CourseSidebar";
import { LessonContent } from "@/components/course/LessonContent";
import { cn } from "@/lib/utils";

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  content_type: string;
  duration_minutes: number | null;
  order_index: number;
  completed: boolean;
}

interface Module {
  id: string;
  title: string;
  order_index: number;
  video_url: string | null;
  lessons: Lesson[];
}

const CourseDetail = () => {
  const { id, moduleId } = useParams<{ id: string; moduleId?: string }>();
  const { user } = useAuth();
  const [courseTitle, setCourseTitle] = useState("");
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (user && id) fetchCourseDetail();
  }, [user, id, moduleId]);

  async function fetchCourseDetail() {
    try {
      const { data: course } = await supabase.from("courses").select("title").eq("id", id!).single();
      if (course) setCourseTitle(course.title);

      const { data: modulesData } = moduleId
        ? await supabase.from("course_modules").select("*").eq("course_id", id!).eq("id", moduleId).order("order_index")
        : await supabase.from("course_modules").select("*").eq("course_id", id!).order("order_index");

      if (!modulesData || modulesData.length === 0) { setLoading(false); return; }

      if (moduleId && modulesData.length === 1) setCourseTitle(modulesData[0].title);

      const modulesWithLessons = await Promise.all(
        modulesData.map(async (mod) => {
          const { data: lessons } = await supabase.from("lessons").select("*").eq("module_id", mod.id).order("order_index");
          let completedIds: string[] = [];
          if (user && lessons?.length) {
            const { data: completions } = await supabase.from("lesson_completions").select("lesson_id").eq("user_id", user.id).in("lesson_id", lessons.map((l) => l.id));
            completedIds = completions?.map((c) => c.lesson_id) || [];
          }
          return {
            id: mod.id, title: mod.title, order_index: mod.order_index, video_url: mod.video_url || null,
            lessons: (lessons || []).map((l) => ({ ...l, completed: completedIds.includes(l.id) })),
          };
        })
      );

      setModules(modulesWithLessons);
      setOpenModules(new Set(modulesWithLessons.map((m) => m.id)));
    } catch (e) {
      console.error("Error fetching course detail:", e);
    } finally {
      setLoading(false);
    }
  }

  async function toggleCompletion(lesson: Lesson) {
    if (!user) return;
    if (lesson.completed) {
      await supabase.from("lesson_completions").delete().eq("user_id", user.id).eq("lesson_id", lesson.id);
    } else {
      await supabase.from("lesson_completions").insert({ user_id: user.id, lesson_id: lesson.id });
    }
    setModules((prev) =>
      prev.map((mod) => ({ ...mod, lessons: mod.lessons.map((l) => l.id === lesson.id ? { ...l, completed: !l.completed } : l) }))
    );
    if (selectedLesson?.id === lesson.id) setSelectedLesson((prev) => prev ? { ...prev, completed: !prev.completed } : null);
  }

  const toggleModule = (modId: string) => {
    setOpenModules((prev) => { const next = new Set(prev); next.has(modId) ? next.delete(modId) : next.add(modId); return next; });
  };

  const totalLessons = modules.reduce((a, m) => a + m.lessons.length, 0);
  const completedLessons = modules.reduce((a, m) => a + m.lessons.filter((l) => l.completed).length, 0);
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const selectedModule = selectedLesson ? modules.find((m) => m.lessons.some((l) => l.id === selectedLesson.id)) : undefined;
  const selectedModuleName = selectedModule?.title || (showIntro ? modules[0]?.title : undefined);
  const introVideoUrl = modules.find((m) => m.video_url)?.video_url || undefined;
  const selectedModuleVideoUrl = showIntro ? introVideoUrl : undefined;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="h-12 border-b border-border/40 bg-background/80 backdrop-blur-xl flex items-center px-4 gap-3 shrink-0">
        <Link to="/courses" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to courses</span>
        </Link>
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="ml-auto sm:hidden p-1.5 rounded-lg hover:bg-muted/60 transition-colors"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {sidebarOpen && (
          <div className="fixed inset-0 bg-foreground/30 z-30 sm:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <div
          className={cn(
            "z-40 sm:z-auto transition-transform duration-200 sm:transition-none",
            "fixed sm:relative inset-y-0 left-0 sm:inset-auto",
            "top-12 sm:top-auto",
            sidebarOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
          )}
        >
          <CourseSidebar
            courseTitle={courseTitle} modules={modules} openModules={openModules}
            selectedLessonId={selectedLesson?.id || null} showIntro={showIntro}
            onToggleModule={toggleModule}
            onSelectLesson={(lesson) => { setSelectedLesson(lesson); setShowIntro(false); setSidebarOpen(false); }}
            onSelectIntro={() => { setShowIntro(true); setSelectedLesson(null); setSidebarOpen(false); }}
            progress={progress} completedLessons={completedLessons} totalLessons={totalLessons}
          />
        </div>

        <LessonContent
          lesson={selectedLesson} moduleName={selectedModuleName}
          moduleVideoUrl={selectedModuleVideoUrl} showIntro={showIntro}
          onToggleCompletion={toggleCompletion}
        />
      </div>
    </div>
  );
};

export default CourseDetail;
