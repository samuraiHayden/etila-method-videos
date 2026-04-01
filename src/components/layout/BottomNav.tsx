import { Link, useLocation } from "react-router-dom";
import { Dumbbell, BookOpen, UtensilsCrossed, User, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { path: "/workouts", icon: Dumbbell, label: "Workouts" },
  { path: "/courses", icon: BookOpen, label: "Courses" },
  { path: "/meals", icon: UtensilsCrossed, label: "Meals" },
  { path: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/40 safe-bottom">
      <div className="flex items-center justify-around h-[52px] max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground/60"
              )}
            >
              <item.icon
                className="h-[22px] w-[22px]"
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span className={cn(
                "text-[10px] tracking-wide",
                isActive ? "font-semibold" : "font-medium"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
