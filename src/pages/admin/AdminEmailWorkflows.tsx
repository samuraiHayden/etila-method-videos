import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Copy, Trash2, Eye, Plus, Send, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const TRIGGER_EVENTS = [
  { value: "manual", label: "Manual Only", description: "No auto-trigger — manually enroll leads" },
  { value: "call_booked", label: "Call Booked", description: "When a qualified lead books a discovery call" },
  { value: "no_action_timeout", label: "No Action Timeout", description: "When a lead doesn't take action within a time window" },
  { value: "page_visit_no_conversion", label: "Page Visit Without Conversion", description: "Visits a page but doesn't convert within a timeout" },
  { value: "purchase_completed", label: "Purchase Completed", description: "When a lead completes a low-ticket purchase" },
  { value: "lead_created", label: "Lead Created", description: "When a new lead is captured" },
  { value: "lead_status_changed", label: "Lead Status Changed", description: "When a lead's status changes to a specific value" },
] as const;

const LEAD_STATUSES = ["new", "contacted", "qualified", "disqualified", "booked", "enrolled", "lost"];
const QUALIFICATION_RESULTS = ["coaching", "course"];

interface Workflow {
  id: string;
  name: string;
  sequence_type: string;
  description: string | null;
  is_active: boolean;
  trigger_event: string;
  trigger_conditions: Record<string, any>;
  cancel_conditions: Record<string, any>;
}

interface WorkflowStep {
  id: string;
  workflow_id: string;
  email_number: number;
  delay_hours: number;
  subject: string;
  html_body: string;
  is_active: boolean;
}

function getSequenceTag(type: string) {
  switch (type) {
    case "pre_call":
      return { label: "PC", color: "bg-blue-500 text-white" };
    case "dq_abandon":
      return { label: "DQ", color: "bg-orange-500 text-white" };
    case "no_book":
      return { label: "NB", color: "bg-purple-500 text-white" };
    case "post_purchase":
      return { label: "PP", color: "bg-green-600 text-white" };
    default:
      return { label: "??", color: "bg-muted text-muted-foreground" };
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function plainTextToHtml(text: string): string {
  const lines = text.split("\n");
  let html = "";
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("• ") || trimmed.startsWith("- ")) {
      if (!inList) {
        html += '<ul style="color:#333;font-size:15px;line-height:1.9;">';
        inList = true;
      }
      html += `<li>${trimmed.slice(2)}</li>`;
    } else {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      if (trimmed === "") continue;
      html += `<p style="color:#333;font-size:15px;line-height:1.7;">${trimmed}</p>`;
    }
  }
  if (inList) html += "</ul>";
  return html;
}

export default function AdminEmailWorkflows() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [editingFields, setEditingFields] = useState<Record<string, { subject?: string; body?: string; delay?: number }>>({});
  const [sendingTestId, setSendingTestId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const { data: workflows = [] } = useQuery({
    queryKey: ["email-workflows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_workflows")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return data as Workflow[];
    },
  });

  const selectedWorkflow = workflows.find((w) => w.id === selectedWorkflowId) || workflows[0] || null;

  const { data: steps = [] } = useQuery({
    queryKey: ["email-workflow-steps", selectedWorkflow?.id],
    queryFn: async () => {
      if (!selectedWorkflow) return [];
      const { data, error } = await supabase
        .from("email_workflow_steps")
        .select("*")
        .eq("workflow_id", selectedWorkflow.id)
        .order("email_number");
      if (error) throw error;
      return data as WorkflowStep[];
    },
    enabled: !!selectedWorkflow,
  });

  // Count active leads per workflow (scheduled_emails with status=pending)
  const { data: activeCounts = {} } = useQuery({
    queryKey: ["workflow-active-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_emails")
        .select("sequence_type")
        .eq("status", "pending");
      if (error) throw error;
      const counts: Record<string, number> = {};
      const uniqueLeads: Record<string, Set<string>> = {};
      // We only have sequence_type, count unique entries
      data?.forEach((row: any) => {
        counts[row.sequence_type] = (counts[row.sequence_type] || 0) + 1;
      });
      return counts;
    },
  });

  const toggleWorkflow = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("email_workflows")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-workflows"] });
      toast.success("Workflow updated");
    },
  });

  const updateTriggerConfig = useMutation({
    mutationFn: async ({ id, trigger_event, trigger_conditions, cancel_conditions }: {
      id: string;
      trigger_event: string;
      trigger_conditions: Record<string, any>;
      cancel_conditions: Record<string, any>;
    }) => {
      const { error } = await supabase
        .from("email_workflows")
        .update({ trigger_event, trigger_conditions, cancel_conditions } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-workflows"] });
      toast.success("Trigger rules saved");
    },
  });

  const updateStep = useMutation({
    mutationFn: async ({ id, subject, html_body, delay_hours }: { id: string; subject: string; html_body: string; delay_hours: number }) => {
      const { error } = await supabase
        .from("email_workflow_steps")
        .update({ subject, html_body, delay_hours })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["email-workflow-steps"] });
      setEditingFields((prev) => {
        const next = { ...prev };
        delete next[vars.id];
        return next;
      });
      toast.success("Email saved");
    },
  });

  const deleteStep = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("email_workflow_steps")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-workflow-steps"] });
      toast.success("Step deleted");
    },
  });

  const duplicateStep = useMutation({
    mutationFn: async (step: WorkflowStep) => {
      const maxNum = steps.length > 0 ? Math.max(...steps.map((s) => s.email_number)) : 0;
      const { error } = await supabase.from("email_workflow_steps").insert({
        workflow_id: step.workflow_id,
        email_number: maxNum + 1,
        delay_hours: step.delay_hours + 24,
        subject: step.subject,
        html_body: step.html_body,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-workflow-steps"] });
      toast.success("Step duplicated");
    },
  });

  const addStep = useMutation({
    mutationFn: async (workflowId: string) => {
      const maxNum = steps.length > 0 ? Math.max(...steps.map((s) => s.email_number)) : 0;
      const lastDelay = steps.length > 0 ? steps[steps.length - 1].delay_hours : 0;
      const { error } = await supabase.from("email_workflow_steps").insert({
        workflow_id: workflowId,
        email_number: maxNum + 1,
        delay_hours: lastDelay + 24,
        subject: "New email subject",
        html_body: '<p style="color:#333;font-size:15px;line-height:1.7;">Hi {{firstName}},</p><p style="color:#333;font-size:15px;line-height:1.7;">Your email content here.</p><p style="color:#333;font-size:15px;line-height:1.7;">— The Étila Team</p>',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-workflow-steps"] });
      toast.success("Step added");
    },
  });

  const deleteWorkflow = useMutation({
    mutationFn: async (id: string) => {
      // Delete steps first, then the workflow
      const { error: stepsError } = await supabase
        .from("email_workflow_steps")
        .delete()
        .eq("workflow_id", id);
      if (stepsError) throw stepsError;
      const { error } = await supabase
        .from("email_workflows")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-workflows"] });
      queryClient.invalidateQueries({ queryKey: ["email-workflow-steps"] });
      if (selectedWorkflowId) setSelectedWorkflowId(null);
      toast.success("Sequence deleted");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete sequence");
    },
  });

  const createWorkflow = useMutation({
    mutationFn: async () => {
      const slug = newType.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      if (!newName.trim() || !slug) throw new Error("Name and type are required");
      const { data, error } = await supabase
        .from("email_workflows")
        .insert({
          name: newName.trim(),
          sequence_type: slug,
          description: newDesc.trim() || null,
          is_active: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["email-workflows"] });
      setSelectedWorkflowId(data.id);
      setShowCreateDialog(false);
      setNewName("");
      setNewType("");
      setNewDesc("");
      toast.success("Sequence created");
    },
    onError: (err: any) => {
      if (err.message?.includes("duplicate key")) {
        toast.error("A sequence with that type already exists");
      } else {
        toast.error(err.message || "Failed to create sequence");
      }
    },
  });

  const buildPreviewHtml = (body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Étila Method</title>
  <style>
    body { margin:0; padding:0; background:#f0ede8; -webkit-font-smoothing:antialiased; }
    a { color:#8f2435; text-decoration:none; }
    a:hover { text-decoration:underline; }
    .cta-btn { display:inline-block; background:#8f2435; color:#ffffff !important; font-size:15px; font-weight:600; padding:14px 32px; border-radius:6px; text-decoration:none !important; letter-spacing:0.3px; }
  </style>
</head>
<body style="margin:0;padding:0;background:#f0ede8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:36px 16px 48px;">
    <div style="background:#0f0f0f;border-radius:10px 10px 0 0;padding:26px 36px 22px;">
      <span style="display:block;color:rgba(255,255,255,0.45);font-size:10px;font-weight:700;letter-spacing:3.5px;text-transform:uppercase;margin-bottom:6px;">The</span>
      <span style="display:block;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:3px;text-transform:uppercase;line-height:1;">ÉTILA METHOD</span>
    </div>
    <div style="height:3px;background:linear-gradient(90deg,#6b1a27 0%,#8f2435 40%,#b83050 70%,#8f2435 100%);"></div>
    <div style="background:#ffffff;padding:40px 36px 36px;">${body}</div>
    <div style="background:#0f0f0f;border-radius:0 0 10px 10px;padding:22px 36px;text-align:center;">
      <p style="margin:0 0 4px;color:rgba(255,255,255,0.35);font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">ÉTILA FITNESS</p>
      <p style="margin:0;color:rgba(255,255,255,0.2);font-size:11px;line-height:1.6;">© 2026 The Étila Method. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  const getFieldValue = (stepId: string, field: "subject" | "body" | "delay", original: any) => {
    const edit = editingFields[stepId];
    if (!edit) return original;
    if (field === "subject") return edit.subject ?? original;
    if (field === "body") return edit.body ?? original;
    if (field === "delay") return edit.delay ?? original;
    return original;
  };

  const setField = (stepId: string, field: "subject" | "body" | "delay", value: any) => {
    setEditingFields((prev) => ({
      ...prev,
      [stepId]: { ...prev[stepId], [field]: value },
    }));
  };

  const hasChanges = (stepId: string) => !!editingFields[stepId];

  const templateVars = ["{{firstName}}", "{{bookCallUrl}}", "{{checkoutUrl}}"];

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-3rem)] -m-6">
        {/* Sidebar */}
        <div className="w-64 border-r bg-card flex flex-col">
          <div className="p-4">
            <Button
              className="w-full"
              size="sm"
              variant="default"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> Create Sequence
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto">
            {workflows.map((wf) => {
              const tag = getSequenceTag(wf.sequence_type);
              const isSelected = selectedWorkflow?.id === wf.id;
              const pendingCount = activeCounts[wf.sequence_type] || 0;

              return (
                <button
                  key={wf.id}
                  onClick={() => setSelectedWorkflowId(wf.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b transition-colors group",
                    isSelected ? "bg-muted" : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate flex-1">{wf.name}</span>
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", tag.color)}>
                      {tag.label}
                    </span>
                    <button
                      className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity p-0.5"
                      title="Delete sequence"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${wf.name}" and all its steps?`)) {
                          deleteWorkflow.mutate(wf.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{steps.length} steps</span>
                    <span>{pendingCount} active</span>
                    <span className={wf.is_active ? "text-green-600" : "text-muted-foreground"}>
                      {wf.is_active ? "Active" : "Paused"}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          {selectedWorkflow ? (
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold">{selectedWorkflow.name}</h1>
                  <span className={cn("text-xs font-bold px-2 py-0.5 rounded", getSequenceTag(selectedWorkflow.sequence_type).color)}>
                    {getSequenceTag(selectedWorkflow.sequence_type).label}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {activeCounts[selectedWorkflow.sequence_type] || 0} active leads
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toggleWorkflow.mutate({
                      id: selectedWorkflow.id,
                      is_active: !selectedWorkflow.is_active,
                    })
                  }
                >
                  {selectedWorkflow.is_active ? "Pause" : "Activate"}
                </Button>
              </div>

              {/* Trigger Configuration */}
              <div className="border rounded-lg bg-card p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">Trigger Rules</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Trigger Event */}
                  <div className="space-y-2">
                    <Label className="text-xs">Trigger Event</Label>
                    <Select
                      value={(selectedWorkflow as any).trigger_event || "manual"}
                      onValueChange={(val) => {
                        const wf = selectedWorkflow as any;
                        updateTriggerConfig.mutate({
                          id: wf.id,
                          trigger_event: val,
                          trigger_conditions: val !== wf.trigger_event ? {} : wf.trigger_conditions,
                          cancel_conditions: wf.cancel_conditions || {},
                        });
                      }}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRIGGER_EVENTS.map((evt) => (
                          <SelectItem key={evt.value} value={evt.value}>
                            <div>
                              <span>{evt.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      {TRIGGER_EVENTS.find((e) => e.value === ((selectedWorkflow as any).trigger_event || "manual"))?.description}
                    </p>
                  </div>

                  {/* Conditions based on trigger type */}
                  <div className="space-y-2">
                    <Label className="text-xs">Conditions</Label>
                    {(() => {
                      const wf = selectedWorkflow as any;
                      const triggerEvent = wf.trigger_event || "manual";
                      const conditions = wf.trigger_conditions || {};

                      if (triggerEvent === "manual") {
                        return <p className="text-xs text-muted-foreground pt-2">No conditions — enroll leads manually.</p>;
                      }

                      return (
                        <div className="space-y-3">
                          {/* Lead status filter */}
                          {["call_booked", "no_action_timeout", "lead_created", "lead_status_changed"].includes(triggerEvent) && (
                            <div className="space-y-1">
                              <Label className="text-[11px] text-muted-foreground">Lead Status</Label>
                              <Select
                                value={conditions.lead_status || "any"}
                                onValueChange={(val) => {
                                  const newConditions = { ...conditions, lead_status: val === "any" ? undefined : val };
                                  if (val === "any") delete newConditions.lead_status;
                                  updateTriggerConfig.mutate({
                                    id: wf.id,
                                    trigger_event: triggerEvent,
                                    trigger_conditions: newConditions,
                                    cancel_conditions: wf.cancel_conditions || {},
                                  });
                                }}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Any status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="any">Any status</SelectItem>
                                  {LEAD_STATUSES.map((s) => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Qualification result filter */}
                          {["call_booked", "no_action_timeout", "page_visit_no_conversion", "lead_created"].includes(triggerEvent) && (
                            <div className="space-y-1">
                              <Label className="text-[11px] text-muted-foreground">Qualification Result</Label>
                              <Select
                                value={conditions.qualification_result || "any"}
                                onValueChange={(val) => {
                                  const newConditions = { ...conditions, qualification_result: val === "any" ? undefined : val };
                                  if (val === "any") delete newConditions.qualification_result;
                                  updateTriggerConfig.mutate({
                                    id: wf.id,
                                    trigger_event: triggerEvent,
                                    trigger_conditions: newConditions,
                                    cancel_conditions: wf.cancel_conditions || {},
                                  });
                                }}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Any result" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="any">Any result</SelectItem>
                                  {QUALIFICATION_RESULTS.map((r) => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Timeout */}
                          {["no_action_timeout", "page_visit_no_conversion"].includes(triggerEvent) && (
                            <div className="space-y-1">
                              <Label className="text-[11px] text-muted-foreground">
                                {triggerEvent === "page_visit_no_conversion" ? "Timeout (minutes)" : "Timeout (hours)"}
                              </Label>
                              <Input
                                type="number"
                                min="1"
                                className="h-8 text-xs w-24"
                                value={triggerEvent === "page_visit_no_conversion"
                                  ? (conditions.timeout_minutes || 10)
                                  : (conditions.timeout_hours || 48)}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  const key = triggerEvent === "page_visit_no_conversion" ? "timeout_minutes" : "timeout_hours";
                                  updateTriggerConfig.mutate({
                                    id: wf.id,
                                    trigger_event: triggerEvent,
                                    trigger_conditions: { ...conditions, [key]: val },
                                    cancel_conditions: wf.cancel_conditions || {},
                                  });
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Cancellation rules */}
                {((selectedWorkflow as any).trigger_event || "manual") !== "manual" && (
                  <div className="mt-4 pt-4 border-t">
                    <Label className="text-xs mb-2 block">Auto-Cancel When</Label>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <Switch
                          checked={!!(selectedWorkflow as any).cancel_conditions?.on_call_booked}
                          onCheckedChange={(checked) => {
                            const wf = selectedWorkflow as any;
                            updateTriggerConfig.mutate({
                              id: wf.id,
                              trigger_event: wf.trigger_event,
                              trigger_conditions: wf.trigger_conditions || {},
                              cancel_conditions: { ...(wf.cancel_conditions || {}), on_call_booked: checked || undefined },
                            });
                          }}
                          className="scale-75"
                        />
                        Lead books a call
                      </label>
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <Switch
                          checked={!!(selectedWorkflow as any).cancel_conditions?.on_purchase}
                          onCheckedChange={(checked) => {
                            const wf = selectedWorkflow as any;
                            updateTriggerConfig.mutate({
                              id: wf.id,
                              trigger_event: wf.trigger_event,
                              trigger_conditions: wf.trigger_conditions || {},
                              cancel_conditions: { ...(wf.cancel_conditions || {}), on_purchase: checked || undefined },
                            });
                          }}
                          className="scale-75"
                        />
                        Lead makes a purchase
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Steps timeline */}
              <div className="space-y-6 relative">
                {steps.map((step, idx) => {
                  const subjectVal = getFieldValue(step.id, "subject", step.subject);
                  const bodyPlain = getFieldValue(step.id, "body", stripHtml(step.html_body));
                  const delayVal = getFieldValue(step.id, "delay", step.delay_hours);
                  const changed = hasChanges(step.id);

                  return (
                    <div key={step.id} className="relative flex gap-4">
                      {/* Timeline dot + line */}
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-primary mt-2 flex-shrink-0" />
                        {idx < steps.length - 1 && (
                          <div className="w-px flex-1 bg-border mt-1" />
                        )}
                      </div>

                      {/* Step card */}
                      <div className="flex-1 border rounded-lg bg-card p-5 space-y-3">
                        {/* Step header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-primary">
                              Step {step.email_number}
                            </span>
                            <span className="text-sm text-muted-foreground">Send</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              className="w-16 h-8 text-center text-sm"
                              value={delayVal}
                              onChange={(e) =>
                                setField(step.id, "delay", parseFloat(e.target.value) || 0)
                              }
                            />
                            <span className="text-sm text-muted-foreground">hours after trigger</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Duplicate"
                              onClick={() => duplicateStep.mutate(step)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              title="Delete"
                              onClick={() => {
                                if (confirm("Delete this step?")) deleteStep.mutate(step.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Subject */}
                        <Input
                          className="text-sm"
                          placeholder="Subject line..."
                          value={subjectVal}
                          onChange={(e) => setField(step.id, "subject", e.target.value)}
                        />

                        {/* Body - plain text */}
                        <Textarea
                          className="text-sm min-h-[120px] resize-y"
                          placeholder="Email body..."
                          value={bodyPlain}
                          onChange={(e) => setField(step.id, "body", e.target.value)}
                        />

                        {/* Tokens + actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Tokens:</span>
                            {templateVars.map((v) => (
                              <Badge
                                key={v}
                                variant="outline"
                                className="text-[10px] font-mono cursor-pointer hover:bg-muted"
                                onClick={() => {
                                  navigator.clipboard.writeText(v);
                                  toast.success(`Copied ${v}`);
                                }}
                              >
                                {v}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                const html = changed ? plainTextToHtml(bodyPlain) : step.html_body;
                                setPreviewHtml(buildPreviewHtml(html));
                              }}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              disabled={sendingTestId === step.id}
                              onClick={async () => {
                                if (!profile?.email) {
                                  toast.error("No admin email found");
                                  return;
                                }
                                setSendingTestId(step.id);
                                try {
                                  const htmlBody = changed ? plainTextToHtml(bodyPlain) : step.html_body;
                                  const { data, error } = await supabase.functions.invoke("send-test-email", {
                                    body: {
                                      subject: subjectVal,
                                      html_body: htmlBody,
                                      to_email: profile.email,
                                    },
                                  });
                                  if (error) throw error;
                                  if (data?.error) throw new Error(data.error);
                                  toast.success(`Test email sent to ${profile.email}`);
                                } catch (err: any) {
                                  toast.error(err.message || "Failed to send test email");
                                } finally {
                                  setSendingTestId(null);
                                }
                              }}
                            >
                              <Send className="h-3.5 w-3.5 mr-1" />
                              {sendingTestId === step.id ? "Sending..." : "Send Test"}
                            </Button>
                            {changed && (
                              <Button
                                size="sm"
                                className="text-xs"
                                onClick={() => {
                                  const edit = editingFields[step.id];
                                  updateStep.mutate({
                                    id: step.id,
                                    subject: edit?.subject ?? step.subject,
                                    html_body: edit?.body ? plainTextToHtml(edit.body) : step.html_body,
                                    delay_hours: edit?.delay ?? step.delay_hours,
                                  });
                                }}
                                disabled={updateStep.isPending}
                              >
                                Save
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add step */}
                {selectedWorkflow && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full border-2 border-dashed border-muted-foreground mt-2" />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => addStep.mutate(selectedWorkflow.id)}
                      disabled={addStep.isPending}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Step
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a workflow to edit
            </div>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewHtml} onOpenChange={() => setPreviewHtml(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          {previewHtml && (
            <iframe
              srcDoc={previewHtml}
              className="w-full h-[500px] border rounded-lg"
              title="Email Preview"
              sandbox=""
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Sequence Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Sequence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sequence Name</Label>
              <Input
                placeholder="e.g. Post-Purchase Follow-up"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Sequence Type (unique slug)</Label>
              <Input
                placeholder="e.g. post_purchase"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Used internally to trigger this sequence. Lowercase, underscores only.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Describe when this sequence triggers and its purpose..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createWorkflow.mutate()}
              disabled={!newName.trim() || !newType.trim() || createWorkflow.isPending}
            >
              {createWorkflow.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
