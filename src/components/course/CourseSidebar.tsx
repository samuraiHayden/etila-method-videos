import { ChevronDown, ChevronRight, CheckCircle2, Circle, Play } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

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

interface CourseSidebarProps {
  courseTitle: string;
  modules: Module[];
  openModules: Set<string>;
  selectedLessonId: string | null;
  showIntro: boolean;
  onToggleModule: (modId: string) => void;
  onSelectLesson: (lesson: Lesson) => void;
  onSelectIntro: () => void;
  progress: number;
  completedLessons: number;
  totalLessons: number;
}

export function CourseSidebar({
  courseTitle,
  modules,
  openModules,
  selectedLessonId,
  showIntro,
  onToggleModule,
  onSelectLesson,
  onSelectIntro,
  progress,
  completedLessons,
  totalLessons,
}: CourseSidebarProps) {
  // Check if any module has a video
  const hasIntroVideo = modules.some((m) => m.video_url);

  return (
    <div className="w-80 min-w-[280px] border-r border-border bg-card flex flex-col h-full overflow-hidden">
      {/* Course header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-bold text-base text-foreground truncate">{courseTitle}</h2>
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 mb-1">
          <span>{completedLessons}/{totalLessons} lessons</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Modules list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Intro Video button — only if a module has a video */}
        {hasIntroVideo && (
          <button
            onClick={onSelectIntro}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors mb-1",
              showIntro
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted/50 text-foreground"
            )}
          >
            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Play className="h-2.5 w-2.5 text-primary" />
            </div>
            <p className="text-sm font-medium">Introduction</p>
          </button>
        )}

        {modules.map((mod) => {
          const modCompleted = mod.lessons.filter((l) => l.completed).length;
          const isOpen = openModules.has(mod.id);

          return (
            <Collapsible key={mod.id} open={isOpen} onOpenChange={() => onToggleModule(mod.id)}>
              <CollapsibleTrigger className="w-full flex items-center justify-between rounded-lg p-3 hover:bg-muted/50 transition-colors text-left">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm text-foreground truncate">{mod.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {modCompleted}/{mod.lessons.length} completed
                  </p>
                </div>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 ml-1">
                {mod.lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => onSelectLesson(lesson)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                      selectedLessonId === lesson.id && !showIntro
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/50 text-foreground"
                    )}
                  >
                    {lesson.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{lesson.title}</p>
                      {lesson.duration_minutes && (
                        <p className="text-xs text-muted-foreground">{lesson.duration_minutes} min</p>
                      )}
                    </div>
                  </button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
