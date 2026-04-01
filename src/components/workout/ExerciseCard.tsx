import { useState } from "react";
import { BunnyVideo } from "@/components/ui/bunny-video";
import { ChevronDown, ChevronUp, Trophy, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PreviousSetData {
  setNumber: number;
  weight: number | null;
  reps: number | null;
}

interface SetLog {
  setNumber: number;
  weight: string;
  reps: string;
  completed: boolean;
}

interface ExerciseCardProps {
  id: string;
  name: string;
  sets: number;
  reps: string;
  videoUrl?: string;
  notes?: string;
  defaultOpen?: boolean;
  previousBest?: { weight: number; reps: number };
  previousSets?: PreviousSetData[];
  onLogSet?: (setNumber: number, weight: string, reps: string) => void;
  onExerciseComplete?: (exerciseId: string, completed: boolean) => void;
}

export function ExerciseCard({
  id, name, sets, reps, videoUrl, notes, defaultOpen = false,
  previousBest, previousSets, onLogSet, onExerciseComplete,
}: ExerciseCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [setLogs, setSetLogs] = useState<SetLog[]>(
    Array.from({ length: sets }, (_, i) => ({ setNumber: i + 1, weight: "", reps: "", completed: false }))
  );

  const completedSets = setLogs.filter((s) => s.completed).length;
  const allCompleted = completedSets === sets;

  const handleSetComplete = (index: number) => {
    const newLogs = [...setLogs];
    newLogs[index].completed = !newLogs[index].completed;
    setSetLogs(newLogs);
    if (onLogSet && newLogs[index].completed) onLogSet(index + 1, newLogs[index].weight, newLogs[index].reps);
    const completedCount = newLogs.filter((s) => s.completed).length;
    onExerciseComplete?.(id, completedCount === sets);
  };

  const updateSetLog = (index: number, field: "weight" | "reps", value: string) => {
    const newLogs = [...setLogs];
    newLogs[index][field] = value;
    setSetLogs(newLogs);
  };

  const hasPreviousData = previousSets && previousSets.length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          "rounded-2xl border overflow-hidden transition-all duration-200",
          allCompleted
            ? "bg-success/5 border-success/20 shadow-soft"
            : "bg-card/80 backdrop-blur-xl border-border/40 shadow-soft"
        )}
      >
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between text-left">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">{name}</h4>
                {allCompleted && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-success/10 text-success">
                    Done
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {sets} sets × {reps} reps
                {completedSets > 0 && !allCompleted && (
                  <span className="ml-2 text-primary font-medium">
                    ({completedSets}/{sets})
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {previousBest && (
                <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/60 px-2 py-1 rounded-lg">
                  <Trophy className="h-3 w-3 text-warning" />
                  {previousBest.weight} lbs × {previousBest.reps}
                </div>
              )}
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground/40" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground/40" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            {videoUrl && (
              <div className="w-full sm:max-w-xs rounded-xl overflow-hidden">
                <BunnyVideo url={videoUrl} />
              </div>
            )}

            {previousBest && (
              <div className="flex items-center gap-2 p-3 bg-secondary/40 rounded-xl border border-border/30">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs">
                  <span className="text-muted-foreground">Previous best: </span>
                  <span className="font-semibold">{previousBest.weight} lbs × {previousBest.reps} reps</span>
                </span>
              </div>
            )}

            <div className="space-y-2">
              {hasPreviousData && (
                <div className="flex items-center gap-3 px-3 text-[9px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
                  <span className="w-16">Set</span>
                  <span className="w-20 text-center">Previous</span>
                  <span className="w-1" />
                  <span className="w-20 text-center">Weight</span>
                  <span className="w-4" />
                  <span className="w-20 text-center">Reps</span>
                  <span className="ml-auto w-14" />
                </div>
              )}

              {setLogs.map((set, index) => {
                const prev = previousSets?.find((p) => p.setNumber === set.setNumber);
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-colors",
                      set.completed ? "bg-success/10" : "bg-secondary/30"
                    )}
                  >
                    <span className="text-xs font-semibold w-16">Set {set.setNumber}</span>
                    {hasPreviousData && (
                      <span className="w-20 text-center text-[10px] text-muted-foreground">
                        {prev && prev.weight != null ? `${prev.weight}×${prev.reps ?? "-"}` : "—"}
                      </span>
                    )}
                    <Input
                      type="number" min="0"
                      placeholder={prev?.weight != null ? String(prev.weight) : "lbs"}
                      value={set.weight}
                      onChange={(e) => updateSetLog(index, "weight", e.target.value)}
                      className="w-20 text-center rounded-lg border-border/50 h-9"
                      disabled={set.completed}
                    />
                    <span className="text-muted-foreground/40 text-xs">×</span>
                    <Input
                      type="number" min="0"
                      placeholder={prev?.reps != null ? String(prev.reps) : "reps"}
                      value={set.reps}
                      onChange={(e) => updateSetLog(index, "reps", e.target.value)}
                      className="w-20 text-center rounded-lg border-border/50 h-9"
                      disabled={set.completed}
                    />
                    <Button
                      size="sm"
                      variant={set.completed ? "default" : "secondary"}
                      onClick={() => handleSetComplete(index)}
                      className={cn("ml-auto rounded-lg h-8 text-xs", set.completed && "bg-success hover:bg-success/90")}
                    >
                      {set.completed ? "Done" : "Log"}
                    </Button>
                  </div>
                );
              })}
            </div>

            {notes && (
              <div className="p-3 bg-secondary/30 rounded-xl border border-border/30">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Coaching Tips</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{notes}</p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
