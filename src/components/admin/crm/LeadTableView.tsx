import { useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeadStatusBadge, LeadQualificationBadge } from "../LeadStatusBadge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { User, Mail, Phone, Trash2, Download, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LEAD_STATUSES } from "../LeadStatusBadge";
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

interface Props {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onUpdate: () => void;
}

export function LeadTableView({ leads, onLeadClick, onUpdate }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const allSelected = leads.length > 0 && selected.size === leads.length;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(leads.map((l) => l.id)));
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function handleBulkStatusChange(newStatus: string) {
    if (selected.size === 0) return;
    setBulkUpdating(true);
    const ids = Array.from(selected);
    const { error } = await supabase
      .from("leads")
      .update({ status: newStatus, last_contacted_at: new Date().toISOString() } as any)
      .in("id", ids);
    setBulkUpdating(false);
    if (error) {
      toast.error("Bulk update failed");
    } else {
      toast.success(`Updated ${ids.length} leads to ${newStatus.replace("_", " ")}`);
      setSelected(new Set());
      setBulkStatus("");
      onUpdate();
    }
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected);
    // Delete activities first, then questionnaire responses, then leads
    await supabase.from("lead_activities").delete().in("lead_id", ids);
    await supabase.from("lead_questionnaire_responses").delete().in("lead_id", ids);
    const { error } = await supabase.from("leads").delete().in("id", ids);
    setShowDeleteDialog(false);
    if (error) {
      toast.error("Delete failed — check permissions");
    } else {
      toast.success(`Deleted ${ids.length} leads`);
      setSelected(new Set());
      onUpdate();
    }
  }

  function exportCSV() {
    const rows = leads.filter((l) => selected.size === 0 || selected.has(l.id));
    const headers = ["Name", "Email", "Phone", "Status", "Goal", "Result", "Date"];
    const csv = [
      headers.join(","),
      ...rows.map((l) =>
        [
          `"${l.full_name}"`,
          l.email,
          l.phone_number || "",
          l.status,
          l.questionnaire?.fitness_goal || "",
          l.questionnaire?.qualification_result || "",
          format(new Date(l.created_at), "yyyy-MM-dd"),
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} leads`);
  }

  return (
    <div className="space-y-3">
      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50 flex-wrap">
          <span className="text-sm font-medium">
            {selected.size} selected
          </span>
          <Select value={bulkStatus} onValueChange={handleBulkStatusChange}>
            <SelectTrigger className="w-[160px] h-8">
              <SelectValue placeholder="Change status..." />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  <LeadStatusBadge status={s} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-3.5 w-3.5 mr-1" /> Export
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())} className="ml-auto">
            Clear
          </Button>
        </div>
      )}

      {/* Export button when nothing selected */}
      {selected.size === 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Goal</TableHead>
              <TableHead>Qualification</TableHead>
              <TableHead>Call Booked</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  No leads found.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer"
                  data-state={selected.has(lead.id) ? "selected" : undefined}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.has(lead.id)}
                      onCheckedChange={() => toggleOne(lead.id)}
                    />
                  </TableCell>
                  <TableCell onClick={() => onLeadClick(lead)}>
                    <LeadStatusBadge status={lead.status} />
                  </TableCell>
                  <TableCell onClick={() => onLeadClick(lead)} className="font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {lead.full_name}
                    </div>
                  </TableCell>
                  <TableCell onClick={() => onLeadClick(lead)}>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{lead.email}</span>
                    </div>
                  </TableCell>
                  <TableCell onClick={() => onLeadClick(lead)}>
                    {lead.phone_number ? (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{lead.phone_number}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell onClick={() => onLeadClick(lead)}>
                    {lead.questionnaire ? (
                      <Badge variant="outline" className="text-xs">
                        {label(lead.questionnaire.fitness_goal)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell onClick={() => onLeadClick(lead)}>
                    <LeadQualificationBadge result={lead.questionnaire?.qualification_result} />
                    {!lead.questionnaire && <span className="text-muted-foreground text-sm">—</span>}
                  </TableCell>
                  <TableCell onClick={() => onLeadClick(lead)}>
                    {lead.last_contacted_at && lead.status === "call_scheduled" ? (
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(lead.last_contacted_at), "MMM d, yyyy")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell onClick={() => onLeadClick(lead)}>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(lead.created_at), "MMM d, yyyy")}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} lead{selected.size !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected leads and their activity history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
