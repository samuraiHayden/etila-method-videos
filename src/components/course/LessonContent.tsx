import { cn } from "@/lib/utils";
import { BookOpen, Play } from "lucide-react";
import { BunnyVideo } from "@/components/ui/bunny-video";

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  content_type: string;
  duration_minutes: number | null;
  order_index: number;
  completed: boolean;
}

interface LessonContentProps {
  lesson: Lesson | null;
  moduleName?: string;
  moduleVideoUrl?: string;
  showIntro?: boolean;
  onToggleCompletion: (lesson: Lesson) => void;
}

function renderContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function LessonContent({ lesson, moduleName, moduleVideoUrl, showIntro, onToggleCompletion }: LessonContentProps) {
  // Show intro video view
  if (showIntro && moduleVideoUrl) {
    return (
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {moduleName && (
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
              {moduleName}
            </p>
          )}
          <h1 className="text-2xl font-bold text-foreground mb-6">Introduction</h1>
          <div className="rounded-lg overflow-hidden bg-black aspect-video">
            <BunnyVideo
              
              url={moduleVideoUrl}
              controlsList="nodownload"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Watch this introduction video before diving into the lessons.
          </p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Select a lesson</h2>
          <p className="text-sm text-muted-foreground">Choose a lesson from the sidebar to start learning</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Module breadcrumb */}
        {moduleName && (
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
            {moduleName}
          </p>
        )}

        {/* Lesson title */}
        <h1 className="text-2xl font-bold text-foreground mb-6">{lesson.title}</h1>

        {/* Content */}
        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground leading-relaxed">
          {lesson.content ? renderContent(lesson.content) : "No content available."}
        </div>

        {/* Completion button */}
        <div className="mt-8 pt-6 border-t border-border">
          <button
            onClick={() => onToggleCompletion(lesson)}
            className={cn(
              "px-5 py-2.5 rounded-lg text-sm font-medium transition-colors",
              lesson.completed
                ? "bg-success/10 text-success hover:bg-success/20"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {lesson.completed ? "✓ Completed" : "Mark as Complete"}
          </button>
        </div>
      </div>
    </div>
  );
}
