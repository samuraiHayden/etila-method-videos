import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeadStatusBadge, LeadQualificationBadge, LEAD_STATUSES } from "../LeadStatusBadge";
import { User, Mail, Phone, GripVertical, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";


interface Lead {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  created_at: string;
  status: string;
  notes: string | null;
  last_contacted_at: string | null;
  questionnaire?: {
    gender: string;
    fitness_goal: string;
    experience_level: string;
    training_frequency: string;
    budget_range: string;
    coaching_preference: string;
    qualification_result: string;
  } | null;
}

const LABEL_MAP: Record<string, string> = {
  lose_fat: "Lose Fat", build_muscle: "Build Muscle", body_recomp: "Body Recomp",
  compete: "Compete", coaching: "Coaching", course: "Course",
};
const label = (val: string) => LABEL_MAP[val] || val;

const COLUMN_COLORS: Record<string, string> = {
  new: "border-t-blue-400",
  incomplete_application: "border-t-slate-400",
  contacted: "border-t-yellow-400",
  call_scheduled: "border-t-purple-400",
  call_cancelled: "border-t-orange-400",
  disqualified: "border-t-amber-400",
  bought_low_ticket: "border-t-teal-400",
  won: "border-t-green-400",
  lost: "border-t-red-400",
  closed: "border-t-gray-400",
};

interface Props {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onUpdate: () => void;
}

export function LeadKanbanBoard({ leads, onLeadClick, onUpdate }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);

  const columns = LEAD_STATUSES.reduce((acc, status) => {
    acc[status] = leads.filter((l) => l.status === status);
    return acc;
  }, {} as Record<string, Lead[]>);

  async function handleDrop(newStatus: string) {
    if (!draggingId) return;
    const lead = leads.find((l) => l.id === draggingId);
    if (!lead || lead.status === newStatus) {
      setDraggingId(null);
      setDragOverStatus(null);
      return;
    }

    const { error } = await supabase
      .from("leads")
      .update({
        status: newStatus,
        last_contacted_at: new Date().toISOString(),
      } as any)
      .eq("id", draggingId);

    setDraggingId(null);
    setDragOverStatus(null);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Moved to ${newStatus.replace(/_/g, " ")}`);
      onUpdate();
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from("scheduled_emails").delete().eq("lead_id", deleteTarget.id);
    await supabase.from("lead_activities").delete().eq("lead_id", deleteTarget.id);
    await supabase.from("lead_questionnaire_responses").delete().eq("lead_id", deleteTarget.id);
    const { error } = await supabase.from("leads").delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    if (error) {
      toast.error("Failed to delete lead");
    } else {
      toast.success(`Deleted ${deleteTarget.full_name}`);
      onUpdate();
    }
  }

  return (
    <div className="overflow-x-auto pb-4" style={{ minHeight: "500px" }}>
      <div className="flex gap-3" style={{ width: "max-content" }}>
      {LEAD_STATUSES.map((status) => (
        <div
          key={status}
          className={cn(
            "rounded-lg border border-t-4 bg-muted/30 p-2 transition-colors flex-shrink-0 flex flex-col",
            COLUMN_COLORS[status],
            dragOverStatus === status && "bg-primary/5 ring-2 ring-primary/30"
          )}
          style={{ width: "220px" }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverStatus(status);
          }}
          onDragLeave={() => setDragOverStatus(null)}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(status);
          }}
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <LeadStatusBadge status={status} />
            <span className="text-xs font-semibold text-muted-foreground">
              {columns[status]?.length || 0}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto pr-1" style={{ maxHeight: "calc(100vh - 350px)" }}>
            <div className="space-y-2 min-h-[100px]">
              {columns[status]?.map((lead) => (
                <Card
                  key={lead.id}
                  className={cn(
                    "cursor-grab active:cursor-grabbing transition-all hover:shadow-md group",
                    draggingId === lead.id && "opacity-50 rotate-2"
                  )}
                  draggable
                  onDragStart={() => setDraggingId(lead.id)}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragOverStatus(null);
                  }}
                  onClick={() => onLeadClick(lead)}
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <GripVertical className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                      <p className="text-sm font-medium truncate flex-1">{lead.full_name}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(lead); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {lead.email}
                    </p>
                    {lead.questionnaire && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {label(lead.questionnaire.fitness_goal)}
                        </Badge>
                        <LeadQualificationBadge result={lead.questionnaire.qualification_result} />
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(lead.created_at), "MMM d")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ))}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this lead, their questionnaire data, email sequences, and activity history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
