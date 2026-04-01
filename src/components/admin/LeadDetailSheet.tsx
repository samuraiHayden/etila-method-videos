import { useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { LeadStatusBadge, LeadQualificationBadge, LEAD_STATUSES } from "./LeadStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Calendar, User, Target, Dumbbell, DollarSign, Award } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LeadActivityTimeline } from "./crm/LeadActivityTimeline";
import { LeadEmailTimeline } from "./crm/LeadEmailTimeline";

const LABEL_MAP: Record<string, string> = {
  lose_fat: "Lose Fat", build_muscle: "Build Muscle", body_recomp: "Body Recomp",
  compete: "Compete", beginner: "Beginner", intermediate: "Intermediate",
  advanced: "Advanced", elite: "Elite", "2_3": "2–3 days", "4_5": "4–5 days",
  "6_7": "6–7 days", under_300: "Under $300", "300_500": "$300–$500",
  "500_plus": "$500+", self_paced: "Self-Paced", some_guidance: "Some Guidance",
  full_coaching: "Full Coaching", coaching: "Coaching", course: "Course",
  male: "Male", female: "Female", other: "Other",
};
const label = (val: string) => LABEL_MAP[val] || val;

interface Lead {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  created_at: string;
  status: string;
  notes: string | null;
  last_contacted_at: string | null;
  purchased_at?: string | null;
  purchase_type?: string | null;
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

interface Props {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function LeadDetailSheet({ lead, open, onOpenChange, onUpdate }: Props) {
  const [status, setStatus] = useState(lead?.status || "new");
  const [notes, setNotes] = useState(lead?.notes || "");
  const [saving, setSaving] = useState(false);

  // Sync state when lead changes
  if (lead && status !== lead.status && !saving) {
    setStatus(lead.status);
    setNotes(lead.notes || "");
  }

  async function handleSave() {
    if (!lead) return;
    setSaving(true);
    const { error } = await supabase
      .from("leads")
      .update({
        status,
        notes,
        last_contacted_at: status !== lead.status ? new Date().toISOString() : lead.last_contacted_at,
      } as any)
      .eq("id", lead.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update lead");
      console.error(error);
    } else {
      toast.success("Lead updated");
      onUpdate();
    }
  }

  if (!lead) return null;

  const q = lead.questionnaire;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> {lead.full_name}
            <LeadQualificationBadge result={q?.qualification_result} />
          </SheetTitle>
          <SheetDescription>Lead details & CRM management</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a>
              </div>
              {lead.phone_number && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${lead.phone_number}`} className="text-primary hover:underline">{lead.phone_number}</a>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Submitted {format(new Date(lead.created_at), "MMM d, yyyy 'at' h:mm a")}
              </div>
              {lead.last_contacted_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Last contacted {format(new Date(lead.last_contacted_at), "MMM d, yyyy")}
                </div>
              )}
              {lead.purchased_at && (
                <div className="flex items-center gap-2 text-sm font-medium text-teal-600">
                  <DollarSign className="h-4 w-4" />
                  Purchased {lead.purchase_type === "low_ticket" ? "Low Ticket" : lead.purchase_type || "Course"} on {format(new Date(lead.purchased_at), "MMM d, yyyy 'at' h:mm a")}
                </div>
              )}
            </div>
          </div>

          {/* Questionnaire */}
          {q && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Questionnaire</h3>
              <div className="grid grid-cols-2 gap-3">
                <InfoItem icon={<User className="h-4 w-4" />} label="Gender" value={label(q.gender)} />
                <InfoItem icon={<Target className="h-4 w-4" />} label="Goal" value={label(q.fitness_goal)} />
                <InfoItem icon={<Dumbbell className="h-4 w-4" />} label="Experience" value={label(q.experience_level)} />
                <InfoItem icon={<Calendar className="h-4 w-4" />} label="Frequency" value={label(q.training_frequency)} />
                <InfoItem icon={<DollarSign className="h-4 w-4" />} label="Budget" value={label(q.budget_range)} />
                <InfoItem icon={<User className="h-4 w-4" />} label="Preference" value={label(q.coaching_preference)} />
                <InfoItem icon={<Award className="h-4 w-4" />} label="Result" value={label(q.qualification_result)} />
              </div>
            </div>
          )}

          {/* CRM Status */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pipeline Status</h3>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    <div className="flex items-center gap-2">
                      <LeadStatusBadge status={s} />
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Notes</h3>
            <Textarea
              placeholder="Add notes about this lead..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Changes"}
          </Button>

          {/* Email Sequences */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Email Sequences</h3>
            <LeadEmailTimeline leadId={lead.id} />
          </div>

          {/* Activity Timeline */}
          <LeadActivityTimeline leadId={lead.id} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
