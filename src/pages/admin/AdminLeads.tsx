import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2, Filter, LayoutGrid, Table as TableIcon, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LeadStatusBadge, LEAD_STATUSES } from "@/components/admin/LeadStatusBadge";
import { LeadDetailSheet } from "@/components/admin/LeadDetailSheet";
import { LeadKanbanBoard } from "@/components/admin/crm/LeadKanbanBoard";
import { LeadTableView } from "@/components/admin/crm/LeadTableView";
import { CrmAnalytics } from "@/components/admin/crm/CrmAnalytics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => { fetchLeads(); }, []);

  async function fetchLeads() {
    try {
      const [leadsRes, responsesRes] = await Promise.all([
        supabase.from("leads").select("*").order("created_at", { ascending: false }),
        supabase.from("lead_questionnaire_responses").select("*"),
      ]);
      if (leadsRes.error) throw leadsRes.error;
      const responsesMap = new Map((responsesRes.data || []).map((r) => [r.lead_id, r]));
      const combined: Lead[] = (leadsRes.data || []).map((lead: any) => ({
        ...lead,
        status: lead.status || "new",
        questionnaire: responsesMap.get(lead.id) || null,
      }));
      setLeads(combined);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.phone_number && lead.phone_number.includes(searchQuery));
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = leads.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  function openLead(lead: Lead) {
    setSelectedLead(lead);
    setSheetOpen(true);
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">CRM — Leads</h1>
          <p className="text-muted-foreground">Manage your sales pipeline and lead information</p>
        </div>

        {/* Pipeline stats */}
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {(["new", "incomplete_application", "contacted", "call_scheduled", "call_cancelled", "disqualified", "bought_low_ticket", "won", "lost", "closed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
              className={cn(
                "rounded-lg border p-3 text-center transition-colors hover:bg-muted/50",
                statusFilter === s && "ring-2 ring-primary bg-muted/50"
              )}
            >
              <p className="text-2xl font-bold">{counts[s] || 0}</p>
              <LeadStatusBadge status={s} />
            </button>
          ))}
        </div>

        {/* Search & filter */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {statusFilter !== "all" && (
            <Button variant="ghost" size="sm" onClick={() => setStatusFilter("all")}>
              <Filter className="h-4 w-4 mr-1" /> Clear filter
            </Button>
          )}
          <Badge variant="secondary" className="text-sm ml-auto">
            {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Tabbed views */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="table" className="space-y-4">
            <TabsList>
              <TabsTrigger value="table" className="gap-1.5">
                <TableIcon className="h-4 w-4" /> Table
              </TabsTrigger>
              <TabsTrigger value="kanban" className="gap-1.5">
                <LayoutGrid className="h-4 w-4" /> Kanban
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1.5">
                <BarChart3 className="h-4 w-4" /> Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="table">
              <LeadTableView
                leads={filteredLeads}
                onLeadClick={openLead}
                onUpdate={fetchLeads}
              />
            </TabsContent>

            <TabsContent value="kanban">
              <LeadKanbanBoard
                leads={filteredLeads}
                onLeadClick={openLead}
                onUpdate={fetchLeads}
              />
            </TabsContent>

            <TabsContent value="analytics">
              <CrmAnalytics leads={leads} />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <LeadDetailSheet
        lead={selectedLead}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUpdate={() => {
          fetchLeads();
          setSheetOpen(false);
        }}
      />
    </AdminLayout>
  );
}
