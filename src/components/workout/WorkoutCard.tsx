import { Link } from "react-router-dom";
import { Play, CheckCircle2, Clock, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface WorkoutCardProps {
  id: string;
  name: string;
  duration: string;
  exerciseCount: number;
  isCompleted?: boolean;
  isToday?: boolean;
  dayLabel?: string;
}

export function WorkoutCard({
  id,
  name,
  duration,
  exerciseCount,
  isCompleted = false,
  isToday = false,
  dayLabel,
}: WorkoutCardProps) {
  return (
    <Link
      to={`/workout/${id}`}
      className={cn(
        "block rounded-2xl p-4 shadow-card transition-all duration-200",
        isToday && !isCompleted
          ? "bg-gradient-primary text-primary-foreground shadow-glow"
          : isCompleted
          ? "bg-secondary border-2 border-success/20"
          : "bg-card hover:shadow-elevated"
      )}
    >
      {dayLabel && (
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-wide",
            isToday && !isCompleted
              ? "text-primary-foreground/80"
              : "text-muted-foreground"
          )}
        >
          {dayLabel}
        </span>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex-1">
          <h3
            className={cn(
              "font-semibold text-lg",
              isCompleted && !isToday && "text-muted-foreground"
            )}
          >
            {name}
          </h3>

          <div
            className={cn(
              "flex items-center gap-3 mt-2 text-sm",
              isToday && !isCompleted
                ? "text-primary-foreground/80"
                : "text-muted-foreground"
            )}
          >
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {duration}
            </span>
            <span className="flex items-center gap-1">
              <Dumbbell className="h-4 w-4" />
              {exerciseCount} exercises
            </span>
          </div>
        </div>

        {isCompleted ? (
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success/10">
            <CheckCircle2 className="h-6 w-6 text-success" />
          </div>
        ) : (
          <Button
            size="icon"
            variant={isToday ? "secondary" : "default"}
            className={cn(
              "rounded-full w-12 h-12",
              isToday && "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            )}
          >
            <Play className="h-5 w-5 ml-0.5" />
          </Button>
        )}
      </div>
    </Link>
  );
}
