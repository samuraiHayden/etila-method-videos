import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "success";
  className?: string;
}

export function StatsCard({
  label,
  value,
  icon,
  trend,
  variant = "default",
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl p-4 shadow-card transition-all duration-200 hover:shadow-elevated",
        variant === "default" && "bg-card",
        variant === "primary" && "bg-gradient-primary text-primary-foreground",
        variant === "success" && "bg-gradient-success text-success-foreground",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p
            className={cn(
              "text-sm font-medium",
              variant === "default"
                ? "text-muted-foreground"
                : "opacity-80"
            )}
          >
            {label}
          </p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && (
            <p
              className={cn(
                "text-xs mt-1 font-medium",
                variant === "default"
                  ? trend.isPositive
                    ? "text-success"
                    : "text-destructive"
                  : "opacity-80"
              )}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}% from last week
            </p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "p-2 rounded-lg",
              variant === "default"
                ? "bg-secondary text-secondary-foreground"
                : "bg-primary-foreground/20"
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
