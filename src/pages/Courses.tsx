import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Brain, Dumbbell, Sparkles, CheckCircle2, Loader2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

interface ModuleCard {
  moduleId: string;
  courseId: string;
  moduleTitle: string;
  category: string;
  lessonCount: number;
  completedCount: number;
  orderIndex: number;
}

const categoryColors: Record<string, string> = {
  nutrition: "bg-success/10 text-success",
  mental: "bg-primary/10 text-primary",
  fitness: "bg-warning/10 text-warning",
};

const categoryIcons: Record<string, React.ElementType> = {
  nutrition: Sparkles,
  mental: Brain,
  fitness: Dumbbell,
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const CoursesPage = () => {
  const { user } = useAuth();
  const [modules, setModules] = useState<ModuleCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchModules();
  }, [user]);

  async function fetchModules() {
    try {
      const { data: coursesData } = await supabase
        .from("courses").select("id, title, category").eq("is_published", true).order("title");
      if (!coursesData || coursesData.length === 0) { setModules([]); setLoading(false); return; }

      const courseIds = coursesData.map((c) => c.id);
      const courseMap = Object.fromEntries(coursesData.map((c) => [c.id, c]));
      const { data: modulesData } = await supabase
        .from("course_modules").select("id, course_id, title, order_index").in("course_id", courseIds).order("order_index");
      if (!modulesData || modulesData.length === 0) { setModules([]); setLoading(false); return; }

      const moduleIds = modulesData.map((m) => m.id);
      const { data: lessonsData } = await supabase.from("lessons").select("id, module_id").in("module_id", moduleIds);
      const lessons = lessonsData || [];
      const lessonsByModule: Record<string, string[]> = {};
      for (const l of lessons) {
        if (!lessonsByModule[l.module_id]) lessonsByModule[l.module_id] = [];
        lessonsByModule[l.module_id].push(l.id);
      }

      let completedSet = new Set<string>();
      if (user && lessons.length > 0) {
        const allLessonIds = lessons.map((l) => l.id);
        const { data: completions } = await supabase
          .from("lesson_completions").select("lesson_id").eq("user_id", user.id).in("lesson_id", allLessonIds);
        completedSet = new Set((completions || []).map((c) => c.lesson_id));
      }

      const cards: ModuleCard[] = modulesData.map((mod) => {
        const course = courseMap[mod.course_id];
        const modLessons = lessonsByModule[mod.id] || [];
        return {
          moduleId: mod.id, courseId: mod.course_id, moduleTitle: mod.title,
          category: course?.category || "fitness", lessonCount: modLessons.length,
          completedCount: modLessons.filter((id) => completedSet.has(id)).length, orderIndex: mod.order_index,
        };
      });
      setModules(cards);
    } catch (error) {
      console.error("Error fetching modules:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="px-5 pt-14 pb-2 safe-top">
          <h1 className="text-[34px] font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Your learning journey</p>
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (modules.length === 0) {
    return (
      <AppShell>
        <div className="px-5 pt-14 pb-2 safe-top">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-[34px] font-bold tracking-tight">Courses</motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-muted-foreground text-sm mt-0.5">Your learning journey</motion.p>
        </div>
        <div className="px-5 py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/60 flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <h2 className="text-lg font-semibold mb-1">No Courses Available</h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Educational courses will appear here when your coach publishes them.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-5 pt-14 pb-2 safe-top">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-[34px] font-bold tracking-tight"
        >
          Courses
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-muted-foreground text-sm mt-0.5"
        >
          Your learning journey
        </motion.p>
      </div>

      <div className="px-5 py-4 pb-28 space-y-4">
        {/* Start Here Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.4 }}
          className="rounded-2xl p-5 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-soft"
        >
          <div className="flex items-start justify-between">
            <div>
              <Badge variant="secondary" className="mb-2 bg-primary-foreground/20 text-primary-foreground border-0 text-[10px] font-semibold">
                Start Here
              </Badge>
              <h3 className="font-bold text-lg">Getting Started Guide</h3>
              <p className="text-primary-foreground/70 text-sm mt-1">
                Everything you need to get the most out of your program
              </p>
            </div>
            <BookOpen className="h-8 w-8 opacity-30" />
          </div>
        </motion.div>

        {/* Module List */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {modules.map((mod, i) => {
            const progress = mod.lessonCount > 0
              ? Math.round((mod.completedCount / mod.lessonCount) * 100) : 0;
            const isComplete = progress === 100;
            const IconComponent = categoryIcons[mod.category.toLowerCase()] || BookOpen;

            return (
              <motion.div key={mod.moduleId} custom={i} variants={fadeUp}>
                <Link
                  to={`/courses/${mod.courseId}/module/${mod.moduleId}`}
                  className="block p-4 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 shadow-soft transition-all duration-200 hover:border-border/60 hover:shadow-elevated"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                        isComplete ? "bg-success/10" : "bg-secondary/60"
                      )}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <IconComponent className="h-4 w-4 text-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] border-0 font-semibold",
                            categoryColors[mod.category.toLowerCase()] || "bg-muted text-muted-foreground"
                          )}
                        >
                          {mod.category}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-sm">{mod.moduleTitle}</h3>
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                          <span className="flex items-center gap-1 font-medium">
                            <Play className="h-2.5 w-2.5" />
                            {mod.completedCount}/{mod.lessonCount} lessons
                          </span>
                          <span className="font-semibold">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </AppShell>
  );
};

export default CoursesPage;
