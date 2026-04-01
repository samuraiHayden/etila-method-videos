import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new: { label: "New", className: "bg-blue-100 text-blue-800 border-blue-200" },
  incomplete_application: { label: "Incomplete App", className: "bg-slate-100 text-slate-800 border-slate-200" },
  contacted: { label: "Contacted", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  call_scheduled: { label: "Call Scheduled", className: "bg-purple-100 text-purple-800 border-purple-200" },
  call_cancelled: { label: "Call Cancelled", className: "bg-orange-100 text-orange-800 border-orange-200" },
  disqualified: { label: "Disqualified", className: "bg-amber-100 text-amber-800 border-amber-200" },
  bought_low_ticket: { label: "Bought Low Ticket", className: "bg-teal-100 text-teal-800 border-teal-200" },
  won: { label: "Won", className: "bg-green-100 text-green-800 border-green-200" },
  lost: { label: "Lost", className: "bg-red-100 text-red-800 border-red-200" },
  closed: { label: "Closed", className: "bg-gray-100 text-gray-800 border-gray-200" },
};

export const LEAD_STATUSES = Object.keys(STATUS_CONFIG);

export function LeadStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return (
    <Badge variant="outline" className={cn("text-xs font-medium border", config.className)}>
      {config.label}
    </Badge>
  );
}

export function LeadQualificationBadge({ result }: { result: string | undefined | null }) {
  if (!result) return null;
  const isQualified = result === "coaching";
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] font-semibold border gap-1",
        isQualified
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-orange-50 text-orange-700 border-orange-200"
      )}
    >
      {isQualified ? (
        <CheckCircle className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {isQualified ? "Qualified" : "Disqualified"}
    </Badge>
  );
}
