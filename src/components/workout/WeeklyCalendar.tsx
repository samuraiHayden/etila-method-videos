import { format, startOfWeek, addDays, isSameDay, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface DayStatus {
  date: Date;
  hasWorkout: boolean;
  isCompleted: boolean;
}

interface WeeklyCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  weekData?: DayStatus[];
}

export function WeeklyCalendar({
  selectedDate,
  onSelectDate,
  weekData,
}: WeeklyCalendarProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dayData = weekData?.find((d) => isSameDay(d.date, date));
    return {
      date,
      dayName: format(date, "EEE"),
      dayNumber: format(date, "d"),
      hasWorkout: dayData?.hasWorkout ?? false,
      isCompleted: dayData?.isCompleted ?? false,
    };
  });

  return (
    <div className="grid grid-cols-7 gap-1 py-2 px-1">
      {days.map((day) => {
        const isSelected = isSameDay(day.date, selectedDate);
        const isCurrentDay = isToday(day.date);

        return (
          <button
            key={day.date.toISOString()}
            onClick={() => onSelectDate(day.date)}
            className={cn(
              "flex-1 min-w-[48px] flex flex-col items-center py-2 px-1 rounded-xl transition-all duration-200",
              isSelected
                ? "bg-primary text-primary-foreground shadow-soft"
                : "hover:bg-secondary"
            )}
          >
            <span
              className={cn(
                "text-xs font-medium",
                isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
              )}
            >
              {day.dayName}
            </span>
            <span
              className={cn(
                "text-lg font-semibold mt-0.5",
                isCurrentDay && !isSelected && "text-primary"
              )}
            >
              {day.dayNumber}
            </span>
            
            {/* Workout indicator */}
            <div className="h-4 mt-1 flex items-center justify-center">
              {day.isCompleted ? (
                <CheckCircle2
                  className={cn(
                    "h-4 w-4",
                    isSelected ? "text-primary-foreground" : "text-success"
                  )}
                />
              ) : day.hasWorkout ? (
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isSelected ? "bg-primary-foreground" : "bg-primary"
                  )}
                />
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
