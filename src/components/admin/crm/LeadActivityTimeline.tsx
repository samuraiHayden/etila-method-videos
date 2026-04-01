import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Phone, Mail, FileText, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  lead_id: string;
  activity_type: string;
  content: string;
  created_by: string | null;
  created_at: string;
}

const ACTIVITY_TYPES = [
  { value: "note", label: "Note", icon: FileText },
  { value: "call", label: "Call", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  { value: "meeting", label: "Meeting", icon: MessageSquare },
];

const ICON_MAP: Record<string, typeof FileText> = {
  note: FileText,
  call: Phone,
  email: Mail,
  meeting: MessageSquare,
};

const COLOR_MAP: Record<string, string> = {
  note: "bg-muted text-muted-foreground",
  call: "bg-blue-100 text-blue-700",
  email: "bg-green-100 text-green-700",
  meeting: "bg-purple-100 text-purple-700",
};

interface Props {
  leadId: string;
}

export function LeadActivityTimeline({ leadId }: Props) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState("note");
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [leadId]);

  async function fetchActivities() {
    const { data, error } = await supabase
      .from("lead_activities")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    if (!error) setActivities((data as Activity[]) || []);
    setLoading(false);
  }

  async function handleAdd() {
    if (!newContent.trim()) return;
    setAdding(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("lead_activities").insert({
      lead_id: leadId,
      activity_type: newType,
      content: newContent.trim(),
      created_by: userData?.user?.id || null,
    } as any);
    setAdding(false);
    if (error) {
      toast.error("Failed to add activity");
    } else {
      setNewContent("");
      setShowForm(false);
      fetchActivities();
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Activity Log
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
      </div>

      {showForm && (
        <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
          <Select value={newType} onValueChange={setNewType}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  <div className="flex items-center gap-2">
                    <t.icon className="h-3.5 w-3.5" />
                    {t.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="What happened?"
            rows={2}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={adding || !newContent.trim()}>
              {adding ? "Saving..." : "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : activities.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          No activities yet
        </p>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = ICON_MAP[activity.activity_type] || FileText;
              const colorClass = COLOR_MAP[activity.activity_type] || COLOR_MAP.note;
              return (
                <div key={activity.id} className="flex items-start gap-3 relative">
                  <div className={cn("z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0", colorClass)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium capitalize">
                        {activity.activity_type}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(activity.created_at), "MMM d, h:mm a")}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{activity.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
