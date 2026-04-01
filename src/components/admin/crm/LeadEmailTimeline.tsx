import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle, Clock, XCircle, Ban, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ScheduledEmail {
  id: string;
  sequence_type: string;
  email_number: number;
  subject: string;
  html_body: string;
  send_at: string;
  sent_at: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; label: string; className: string }> = {
  sent: { icon: CheckCircle, label: "Sent", className: "text-green-600 bg-green-50 border-green-200" },
  pending: { icon: Clock, label: "Pending", className: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  failed: { icon: XCircle, label: "Failed", className: "text-red-600 bg-red-50 border-red-200" },
  cancelled: { icon: Ban, label: "Cancelled", className: "text-muted-foreground bg-muted border-border" },
};

const SEQUENCE_LABELS: Record<string, string> = {
  pre_call: "Pre-Call Nurture",
  dq_abandon: "DQ Abandon Cart",
};

export function LeadEmailTimeline({ leadId }: { leadId: string }) {
  const [emails, setEmails] = useState<ScheduledEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("scheduled_emails")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true })
        .order("email_number", { ascending: true });
      setEmails((data as ScheduledEmail[]) || []);
      setLoading(false);
    }
    fetch();
  }, [leadId]);

  if (loading) return null;
  if (emails.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No email sequences triggered for this lead.
      </div>
    );
  }

  // Group by sequence type
  const grouped = emails.reduce((acc, e) => {
    if (!acc[e.sequence_type]) acc[e.sequence_type] = [];
    acc[e.sequence_type].push(e);
    return acc;
  }, {} as Record<string, ScheduledEmail[]>);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([seqType, seqEmails]) => (
        <div key={seqType}>
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {SEQUENCE_LABELS[seqType] || seqType}
            </span>
            <Badge variant="outline" className="text-[10px] ml-auto">
              {seqEmails.filter(e => e.status === "sent").length}/{seqEmails.filter(e => e.status !== "cancelled").length} sent
            </Badge>
          </div>

          <div className="space-y-1.5">
            {seqEmails.map((email) => {
              const config = STATUS_CONFIG[email.status] || STATUS_CONFIG.pending;
              const Icon = config.icon;
              const isExpanded = expandedId === email.id;
              return (
                <div key={email.id} className="space-y-0">
                  <div
                    className={`flex items-start gap-2.5 p-2.5 rounded-md border text-sm ${config.className} ${isExpanded ? "rounded-b-none" : ""}`}
                  >
                    <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-xs truncate">
                        #{email.email_number}: {email.subject}
                      </p>
                      <p className="text-[11px] mt-0.5">
                        {email.status === "sent" && email.sent_at
                          ? `Sent ${format(new Date(email.sent_at), "MMM d, yyyy 'at' h:mm:ss a")}`
                          : email.status === "pending"
                          ? `Scheduled for ${format(new Date(email.send_at), "MMM d, yyyy 'at' h:mm a")}`
                          : email.status === "failed"
                          ? `Failed — ${email.error_message?.slice(0, 60) || "Unknown error"}`
                          : "Cancelled"}
                      </p>
                      {email.status === "pending" && (
                        <p className="text-[10px] mt-0.5 opacity-70">
                          Created {format(new Date(email.created_at), "MMM d, h:mm a")}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 shrink-0"
                      onClick={() => setExpandedId(isExpanded ? null : email.id)}
                      title="View email content"
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  {isExpanded && (
                    <div className="border border-t-0 rounded-b-md bg-background">
                      <ScrollArea className="max-h-[300px]">
                        <div
                          className="p-3 text-xs"
                          dangerouslySetInnerHTML={{ __html: email.html_body }}
                        />
                      </ScrollArea>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
