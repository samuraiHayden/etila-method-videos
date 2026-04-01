import { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  actions?: ReactNode;
  variant?: "default" | "hero" | "large";
}

export function PageHeader({
  title,
  subtitle,
  showBack = false,
  actions,
  variant = "default",
}: PageHeaderProps) {
  const navigate = useNavigate();

  // Large iOS-style title for top-level tab pages
  if (variant === "large") {
    return (
      <header className="px-5 pt-14 pb-2 safe-top">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[34px] font-bold tracking-tight text-foreground leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-[15px] text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      </header>
    );
  }

  if (variant === "hero") {
    return (
      <header className="px-5 pt-14 pb-6 safe-top">
        <div className="flex items-center justify-between mb-1">
          {showBack ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-foreground hover:bg-muted -ml-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div className="w-10" />
          )}
          {actions}
        </div>
        <h1 className="text-[28px] font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-muted-foreground mt-0.5 text-[15px]">{subtitle}</p>
        )}
      </header>
    );
  }

  // Default — compact sticky header for sub-pages
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40 px-5 py-3 safe-top">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-primary hover:bg-muted -ml-2 h-8 w-8"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-[17px] font-semibold text-foreground tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-[13px] text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
