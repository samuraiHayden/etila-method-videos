import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadStatusBadge } from "../LeadStatusBadge";
import { TrendingUp, Clock, Users, Target, Mail, CheckCircle, XCircle } from "lucide-react";
import { differenceInDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

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

interface EmailStats {
  pre_call: { total: number; sent: number; pending: number; failed: number };
  dq_abandon: { total: number; sent: number; pending: number; failed: number };
  leadsWithPreCall: number;
  leadsWithDqAbandon: number;
}

interface Props {
  leads: Lead[];
}

export function CrmAnalytics({ leads }: Props) {
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null);

  useEffect(() => {
    async function fetchEmailStats() {
      const { data } = await supabase
        .from("scheduled_emails")
        .select("lead_id, sequence_type, status");

      if (!data) return;

      const stats: EmailStats = {
        pre_call: { total: 0, sent: 0, pending: 0, failed: 0 },
        dq_abandon: { total: 0, sent: 0, pending: 0, failed: 0 },
        leadsWithPreCall: 0,
        leadsWithDqAbandon: 0,
      };

      const preCallLeads = new Set<string>();
      const dqAbandonLeads = new Set<string>();

      for (const row of data) {
        const seq = row.sequence_type === "pre_call" ? stats.pre_call : stats.dq_abandon;
        seq.total++;
        if (row.status === "sent") seq.sent++;
        else if (row.status === "pending") seq.pending++;
        else if (row.status === "failed") seq.failed++;

        if (row.sequence_type === "pre_call") preCallLeads.add(row.lead_id);
        else if (row.sequence_type === "dq_abandon") dqAbandonLeads.add(row.lead_id);
      }

      stats.leadsWithPreCall = preCallLeads.size;
      stats.leadsWithDqAbandon = dqAbandonLeads.size;
      setEmailStats(stats);
    }
    fetchEmailStats();
  }, []);

  const total = leads.length;
  const won = leads.filter((l) => l.status === "won").length;
  const active = leads.filter((l) => !["won", "lost", "closed"].includes(l.status)).length;
  const conversionRate = total > 0 ? ((won / total) * 100).toFixed(1) : "0";

  const closedLeads = leads.filter((l) => ["won", "lost", "closed"].includes(l.status));
  const avgDays = closedLeads.length > 0
    ? Math.round(
        closedLeads.reduce((sum, l) => {
          const days = differenceInDays(
            new Date(l.last_contacted_at || l.created_at),
            new Date(l.created_at)
          );
          return sum + Math.max(days, 0);
        }, 0) / closedLeads.length
      )
    : 0;

  const goalCounts = leads.reduce((acc, l) => {
    const goal = l.questionnaire?.fitness_goal || "unknown";
    acc[goal] = (acc[goal] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const GOAL_LABELS: Record<string, string> = {
    lose_fat: "Lose Fat", build_muscle: "Build Muscle",
    body_recomp: "Body Recomp", compete: "Compete", unknown: "No Data",
  };

  const stages = [
    { status: "new", count: leads.filter((l) => l.status === "new").length },
    { status: "contacted", count: leads.filter((l) => l.status === "contacted").length },
    { status: "call_scheduled", count: leads.filter((l) => l.status === "call_scheduled").length },
    { status: "call_cancelled", count: leads.filter((l) => l.status === "call_cancelled").length },
    { status: "disqualified", count: leads.filter((l) => l.status === "disqualified").length },
    { status: "bought_low_ticket", count: leads.filter((l) => l.status === "bought_low_ticket").length },
    { status: "won", count: leads.filter((l) => l.status === "won").length },
  ];

  const maxStageCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="space-y-4">
      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Users className="h-4 w-4" />} label="Total Leads" value={total} />
        <StatCard icon={<Target className="h-4 w-4" />} label="Active Pipeline" value={active} />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Conversion Rate" value={`${conversionRate}%`} />
        <StatCard icon={<Clock className="h-4 w-4" />} label="Avg Days to Close" value={avgDays} />
      </div>

      {/* Email Sequence Stats */}
      {emailStats && (
        <div className="grid md:grid-cols-2 gap-4">
          <EmailSequenceCard
            title="Pre-Call Nurture Emails"
            leadsCount={emailStats.leadsWithPreCall}
            stats={emailStats.pre_call}
          />
          <EmailSequenceCard
            title="DQ Abandon Cart Emails"
            leadsCount={emailStats.leadsWithDqAbandon}
            stats={emailStats.dq_abandon}
          />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Funnel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Pipeline Funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stages.map((stage) => (
              <div key={stage.status} className="flex items-center gap-3">
                <div className="w-24 shrink-0">
                  <LeadStatusBadge status={stage.status} />
                </div>
                <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-primary/70 rounded-full transition-all flex items-center justify-end pr-2"
                    style={{ width: `${Math.max((stage.count / maxStageCount) * 100, 8)}%` }}
                  >
                    <span className="text-[10px] font-bold text-primary-foreground">{stage.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Goal breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Lead Goals Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(goalCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([goal, count]) => (
                <div key={goal} className="flex items-center justify-between">
                  <span className="text-sm">{GOAL_LABELS[goal] || goal}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${(count / total) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmailSequenceCard({
  title,
  leadsCount,
  stats,
}: {
  title: string;
  leadsCount: number;
  stats: { total: number; sent: number; pending: number; failed: number };
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Mail className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-1 mb-3">
          <span className="text-2xl font-bold">{leadsCount}</span>
          <span className="text-sm text-muted-foreground">leads in sequence</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center gap-1.5 p-2 rounded-md bg-green-50 border border-green-200">
            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
            <div>
              <p className="text-xs text-green-700 font-medium">{stats.sent}</p>
              <p className="text-[10px] text-green-600">Sent</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-md bg-yellow-50 border border-yellow-200">
            <Clock className="h-3.5 w-3.5 text-yellow-600" />
            <div>
              <p className="text-xs text-yellow-700 font-medium">{stats.pending}</p>
              <p className="text-[10px] text-yellow-600">Pending</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-md bg-red-50 border border-red-200">
            <XCircle className="h-3.5 w-3.5 text-red-600" />
            <div>
              <p className="text-xs text-red-700 font-medium">{stats.failed}</p>
              <p className="text-[10px] text-red-600">Failed</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
