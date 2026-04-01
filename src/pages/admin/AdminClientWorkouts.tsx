import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Loader2, Dumbbell, Calendar, Trophy, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ClientProfile {
  user_id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface WorkoutLog {
  id: string;
  workout_id: string;
  workout_date: string;
  started_at: string | null;
  completed_at: string | null;
  rating: number | null;
  notes: string | null;
  workout_name?: string;
}

interface SetLogEntry {
  id: string;
  exercise_id: string;
  exercise_name: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  is_pr: boolean | null;
  notes: string | null;
}

export default function AdminClientWorkouts() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<WorkoutLog | null>(null);
  const [setLogs, setSetLogs] = useState<SetLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchClientData(userId);
    }
  }, [userId]);

  async function fetchClients() {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, avatar_url")
      .order("full_name");
    setClients(data || []);
    if (!userId) setLoading(false);
  }

  async function fetchClientData(uid: string) {
    setLoading(true);
    try {
      const [profileRes, logsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, full_name, email, avatar_url")
          .eq("user_id", uid)
          .single(),
        supabase
          .from("workout_logs")
          .select("*")
          .eq("user_id", uid)
          .order("workout_date", { ascending: false })
          .limit(50),
      ]);

      setClient(profileRes.data || null);

      // Fetch workout names
      const workoutIds = [...new Set((logsRes.data || []).map((l) => l.workout_id))];
      const { data: workouts } = await supabase
        .from("workouts")
        .select("id, name")
        .in("id", workoutIds.length > 0 ? workoutIds : ["none"]);

      const workoutMap = new Map((workouts || []).map((w) => [w.id, w.name]));

      setWorkoutLogs(
        (logsRes.data || []).map((log) => ({
          ...log,
          workout_name: workoutMap.get(log.workout_id) || "Unknown Workout",
        }))
      );
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSetLogs(logId: string) {
    setLogsLoading(true);
    try {
      const { data } = await supabase
        .from("set_logs")
        .select(`
          id, exercise_id, set_number, weight, reps, rpe, is_pr, notes,
          exercises (name)
        `)
        .eq("workout_log_id", logId)
        .order("exercise_id")
        .order("set_number");

      setSetLogs(
        (data || []).map((sl) => ({
          ...sl,
          exercise_name: (sl.exercises as any)?.name || "Unknown",
        }))
      );
    } catch (error) {
      console.error("Error fetching set logs:", error);
    } finally {
      setLogsLoading(false);
    }
  }

  function handleSelectLog(log: WorkoutLog) {
    setSelectedLog(log);
    fetchSetLogs(log.id);
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    return email[0].toUpperCase();
  };

  // Group set logs by exercise
  const groupedSets = setLogs.reduce((acc, sl) => {
    if (!acc[sl.exercise_id]) acc[sl.exercise_id] = { name: sl.exercise_name, sets: [] };
    acc[sl.exercise_id].sets.push(sl);
    return acc;
  }, {} as Record<string, { name: string; sets: SetLogEntry[] }>);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  // Client selector if no userId in URL
  if (!userId) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Client Workout Tracking</h1>
            <p className="text-muted-foreground">View workout logs and performance data</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Select a Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {clients
                  .filter((c) => c.full_name)
                  .map((c) => (
                    <button
                      key={c.user_id}
                      onClick={() => navigate(`/admin/client-workouts/${c.user_id}`)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={c.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(c.full_name, c.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{c.full_name}</p>
                        <p className="text-sm text-muted-foreground">{c.email}</p>
                      </div>
                    </button>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/client-workouts")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            {client && (
              <>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={client.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(client.full_name, client.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-xl font-bold">{client.full_name}</h1>
                  <p className="text-sm text-muted-foreground">Workout History</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workout Log List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Sessions ({workoutLogs.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[60vh] overflow-y-auto">
              {workoutLogs.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No workout sessions logged yet
                </div>
              ) : (
                <div className="divide-y">
                  {workoutLogs.map((log) => (
                    <button
                      key={log.id}
                      onClick={() => handleSelectLog(log)}
                      className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                        selectedLog?.id === log.id ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{log.workout_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.workout_date), "MMM d, yyyy")}
                          </p>
                        </div>
                        {log.completed_at ? (
                          <Badge variant="secondary" className="bg-success/10 text-success text-xs">
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">In Progress</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Set Details */}
          <Card className="lg:col-span-2">
            {selectedLog ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedLog.workout_name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(selectedLog.workout_date), "EEEE, MMMM d, yyyy")}
                      </p>
                    </div>
                    {selectedLog.rating && (
                      <Badge variant="outline">Rating: {selectedLog.rating}/5</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {logsLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : Object.keys(groupedSets).length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      No sets logged for this session
                    </div>
                  ) : (
                    <Accordion type="multiple" defaultValue={Object.keys(groupedSets)} className="w-full">
                      {Object.entries(groupedSets).map(([exerciseId, { name, sets }]) => (
                        <AccordionItem key={exerciseId} value={exerciseId}>
                          <AccordionTrigger className="px-4 py-3 hover:no-underline">
                            <div className="flex items-center gap-2">
                              <Dumbbell className="h-4 w-4 text-primary" />
                              <span className="font-medium">{name}</span>
                              <Badge variant="secondary" className="text-xs ml-2">
                                {sets.length} sets
                              </Badge>
                              {sets.some((s) => s.is_pr) && (
                                <Trophy className="h-3.5 w-3.5 text-warning" />
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-16">Set</TableHead>
                                  <TableHead>Weight</TableHead>
                                  <TableHead>Reps</TableHead>
                                  <TableHead>RPE</TableHead>
                                  <TableHead>Notes</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {sets.map((s) => (
                                  <TableRow key={s.id}>
                                    <TableCell className="font-medium">
                                      {s.set_number}
                                      {s.is_pr && (
                                        <Trophy className="h-3 w-3 text-warning inline ml-1" />
                                      )}
                                    </TableCell>
                                    <TableCell>{s.weight != null ? `${s.weight} lbs` : "—"}</TableCell>
                                    <TableCell>{s.reps ?? "—"}</TableCell>
                                    <TableCell>{s.rpe ?? "—"}</TableCell>
                                    <TableCell className="text-muted-foreground text-xs">
                                      {s.notes || "—"}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                  {selectedLog.notes && (
                    <div className="p-4 border-t">
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Session Notes</p>
                      <p className="text-sm">{selectedLog.notes}</p>
                    </div>
                  )}
                </CardContent>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Dumbbell className="h-10 w-10 mb-3 opacity-40" />
                <p>Select a workout session to view details</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
