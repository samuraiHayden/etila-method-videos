import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Eye, Loader2, Shield, UserCog, Calendar, UserCheck, Trash2, UtensilsCrossed, Crown, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Database } from "@/integrations/supabase/types";
import { NutritionAssignmentDialog } from "@/components/admin/NutritionAssignmentDialog";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  status: string | null;
  experience_level: string | null;
  program_start_date: string | null;
  current_weight: string | null;
  goal_weight: string | null;
  height: string | null;
  goals: string[] | null;
  injuries: string | null;
  assigned_coach_id: string | null;
}

interface ProgramTemplate {
  id: string;
  name: string;
}

interface UserProgram {
  id: string;
  user_id: string;
  program_id: string;
  start_date: string;
  status: string;
}

interface Coach {
  user_id: string;
  full_name: string | null;
  email: string;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { role: currentUserRole, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, AppRole>>({});
  const [userPrograms, setUserPrograms] = useState<Record<string, UserProgram>>({});
  const [userCustomSchedules, setUserCustomSchedules] = useState<Record<string, number>>({});
  const [userTiers, setUserTiers] = useState<Record<string, string>>({});
  const [programs, setPrograms] = useState<ProgramTemplate[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignMode, setAssignMode] = useState<"template" | "custom">("template");
  const [coachDialogOpen, setCoachDialogOpen] = useState(false);
  const [nutritionDialogOpen, setNutritionDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [savingRole, setSavingRole] = useState(false);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [savingCoach, setSavingCoach] = useState(false);

  // Form state for adding user
  const [newUser, setNewUser] = useState({
    email: "",
    fullName: "",
    password: "",
    role: "client" as AppRole,
  });

  // Form state for editing user
  const [editForm, setEditForm] = useState({
    full_name: "",
    height: "",
    current_weight: "",
    goal_weight: "",
    goals: "",
    injuries: "",
    experience_level: "",
    status: "",
    program_start_date: "",
  });

  // Form state for role change
  const [selectedRole, setSelectedRole] = useState<AppRole>("client");

  // Form state for program assignment
  const [assignForm, setAssignForm] = useState({
    program_id: "",
    start_date: new Date().toISOString().split("T")[0],
  });

  // Form state for coach assignment
  const [selectedCoachId, setSelectedCoachId] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [profilesRes, rolesRes, programsRes, userProgramsRes, dayExRes, leadsRes, questionnaireRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("program_templates").select("id, name").eq("is_active", true),
        supabase.from("user_programs").select("*").eq("status", "active"),
        supabase.from("user_day_exercises").select("user_id"),
        supabase.from("leads").select("id, email"),
        supabase.from("lead_questionnaire_responses").select("lead_id, qualification_result"),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      const rolesMap: Record<string, AppRole> = {};
      rolesRes.data?.forEach((r) => {
        rolesMap[r.user_id] = r.role as AppRole;
      });

      const programsMap: Record<string, UserProgram> = {};
      userProgramsRes.data?.forEach((up) => {
        programsMap[up.user_id] = up;
      });

      // Get coaches (users with coach or super_admin role)
      const coachUserIds = Object.entries(rolesMap)
        .filter(([_, role]) => role === "coach" || role === "super_admin")
        .map(([userId]) => userId);

      const coachProfiles = profilesRes.data?.filter((p) =>
        coachUserIds.includes(p.user_id)
      ) || [];

      // Count custom day exercises per user
      const customScheduleMap: Record<string, number> = {};
      (dayExRes.data || []).forEach((de) => {
        customScheduleMap[de.user_id] = (customScheduleMap[de.user_id] || 0) + 1;
      });

      // Build tier map: email -> qualification_result
      const leadEmailMap = new Map<string, string>();
      (leadsRes.data || []).forEach((l) => leadEmailMap.set(l.id, l.email.toLowerCase()));
      const qrMap = new Map<string, string>();
      (questionnaireRes.data || []).forEach((qr) => {
        const email = leadEmailMap.get(qr.lead_id);
        if (email) qrMap.set(email, qr.qualification_result);
      });
      const tierMap: Record<string, string> = {};
      (profilesRes.data || []).forEach((p) => {
        const result = qrMap.get(p.email.toLowerCase());
        if (result) tierMap[p.user_id] = result;
      });

      setUsers(profilesRes.data || []);
      setUserRoles(rolesMap);
      setUserPrograms(programsMap);
      setUserCustomSchedules(customScheduleMap);
      setUserTiers(tierMap);
      setPrograms(programsRes.data || []);
      setCoaches(coachProfiles.map((p) => ({
        user_id: p.user_id,
        full_name: p.full_name,
        email: p.email,
      })));
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  const [addingUser, setAddingUser] = useState(false);

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newUser.email || !newUser.password) {
      toast.error("Email and password are required");
      return;
    }
    if (newUser.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setAddingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: newUser.email,
          password: newUser.password,
          full_name: newUser.fullName || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Account created for ${newUser.email}`);
      setNewUser({ email: "", fullName: "", password: "", role: "client" });
      setAddDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Failed to create user");
    } finally {
      setAddingUser(false);
    }
  }

  async function handleEditUser(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editForm.full_name || null,
          height: editForm.height || null,
          current_weight: editForm.current_weight || null,
          goal_weight: editForm.goal_weight || null,
          goals: editForm.goals ? editForm.goals.split(",").map((g) => g.trim()) : null,
          injuries: editForm.injuries || null,
          experience_level: editForm.experience_level || null,
          status: editForm.status || null,
          program_start_date: editForm.program_start_date || null,
        })
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast.success("User updated successfully");
      setEditDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    }
  }

  async function handleChangeRole() {
    if (!selectedUser || currentUserRole !== "super_admin") {
      toast.error("Only super admins can change roles");
      return;
    }

    setSavingRole(true);
    try {
      // Check if user already has a role entry
      const existingRole = userRoles[selectedUser.user_id];

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: selectedRole })
          .eq("user_id", selectedUser.user_id);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase.from("user_roles").insert({
          user_id: selectedUser.user_id,
          role: selectedRole,
        });

        if (error) throw error;
      }

      toast.success(`Role updated to ${selectedRole}`);
      setRoleDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error changing role:", error);
      toast.error("Failed to change role");
    } finally {
      setSavingRole(false);
    }
  }

  async function handleAssignProgram(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;

    setSavingAssignment(true);
    try {
      // First, deactivate any existing active program
      await supabase
        .from("user_programs")
        .update({ status: "inactive" })
        .eq("user_id", selectedUser.user_id)
        .eq("status", "active");

      if (assignForm.program_id) {
        // Assign new program
        const { error: programError } = await supabase.from("user_programs").insert({
          user_id: selectedUser.user_id,
          program_id: assignForm.program_id,
          start_date: assignForm.start_date,
          status: "active",
          assigned_by: currentUser?.id,
        });

        if (programError) throw programError;

        // Update profile with program start date
        await supabase
          .from("profiles")
          .update({ program_start_date: assignForm.start_date })
          .eq("id", selectedUser.id);
      }

      toast.success("Program assigned successfully");
      setAssignDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error assigning program:", error);
      toast.error("Failed to assign program");
    } finally {
      setSavingAssignment(false);
    }
  }

  async function handleAssignCoach(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;

    setSavingCoach(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ assigned_coach_id: selectedCoachId || null })
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast.success(selectedCoachId ? "Coach assigned successfully" : "Coach removed");
      setCoachDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error assigning coach:", error);
      toast.error("Failed to assign coach");
    } finally {
      setSavingCoach(false);
    }
  }

  function openEditDialog(user: UserProfile) {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || "",
      height: user.height || "",
      current_weight: user.current_weight || "",
      goal_weight: user.goal_weight || "",
      goals: user.goals?.join(", ") || "",
      injuries: user.injuries || "",
      experience_level: user.experience_level || "",
      status: user.status || "active",
      program_start_date: user.program_start_date || "",
    });
    setEditDialogOpen(true);
  }

  function openRoleDialog(user: UserProfile) {
    setSelectedUser(user);
    setSelectedRole(userRoles[user.user_id] || "client");
    setRoleDialogOpen(true);
  }

  function openAssignDialog(user: UserProfile) {
    setSelectedUser(user);
    const existingProgram = userPrograms[user.user_id];
    setAssignForm({
      program_id: existingProgram?.program_id || "",
      start_date: existingProgram?.start_date || new Date().toISOString().split("T")[0],
    });
    setAssignDialogOpen(true);
  }

  function openCoachDialog(user: UserProfile) {
    setSelectedUser(user);
    setSelectedCoachId(user.assigned_coach_id || "");
    setCoachDialogOpen(true);
  }

  async function handleDeleteUser(user: UserProfile) {
    if (user.user_id === currentUser?.id) {
      toast.error("You cannot delete your own account");
      return;
    }
    if (!confirm(`Are you sure you want to delete ${user.full_name || user.email}? This action cannot be undone.`)) return;

    try {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: user.user_id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("User deleted successfully");
      fetchData();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-700";
      case "paused":
        return "bg-yellow-500/10 text-yellow-700";
      case "completed":
        return "bg-blue-500/10 text-blue-700";
      case "cancelled":
        return "bg-red-500/10 text-red-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getRoleBadge = (role: AppRole | undefined) => {
    switch (role) {
      case "super_admin":
        return <Badge variant="destructive">Super Admin</Badge>;
      case "coach":
        return <Badge className="bg-purple-500">Coach</Badge>;
      case "content_admin":
        return <Badge className="bg-blue-500">Content Admin</Badge>;
      default:
        return <Badge variant="secondary">Client</Badge>;
    }
  };

  const getProgramName = (userId: string) => {
    const userProgram = userPrograms[userId];
    if (!userProgram) return null;
    const program = programs.find((p) => p.id === userProgram.program_id);
    return program?.name || null;
  };

  const getCoachName = (coachId: string | null) => {
    if (!coachId) return null;
    const coach = coaches.find((c) => c.user_id === coachId);
    return coach?.full_name || coach?.email || null;
  };

  const isSuperAdmin = currentUserRole === "super_admin";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Users</h1>
            <p className="text-muted-foreground">Manage all users in the program</p>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={addingUser}>
                  {addingUser && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Coach</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {getInitials(user.full_name, user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.full_name || "No name"}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(userRoles[user.user_id])}</TableCell>
                      <TableCell>
                        {userTiers[user.user_id] === "coaching" ? (
                          <Badge className="bg-amber-500/10 text-amber-700 border border-amber-200 gap-1">
                            <Crown className="h-3 w-3" /> High Ticket
                          </Badge>
                        ) : userTiers[user.user_id] === "course" ? (
                          <Badge className="bg-sky-500/10 text-sky-700 border border-sky-200 gap-1">
                            <Tag className="h-3 w-3" /> Low Ticket
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getCoachName(user.assigned_coach_id) || (
                          <span className="text-muted-foreground text-sm">No coach</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getProgramName(user.user_id) && (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-block w-2 h-2 rounded-full bg-primary shrink-0" />
                              <span className="text-sm">{getProgramName(user.user_id)}</span>
                            </div>
                          )}
                          {userCustomSchedules[user.user_id] ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-block w-2 h-2 rounded-full bg-accent-foreground/60 shrink-0" style={{ background: 'hsl(var(--chart-4))' }} />
                              <span className="text-sm text-muted-foreground">
                                Custom · {userCustomSchedules[user.user_id]} exercises
                              </span>
                            </div>
                          ) : null}
                          {!getProgramName(user.user_id) && !userCustomSchedules[user.user_id] && (
                            <span className="text-muted-foreground text-sm">No schedule</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status || "active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/admin/users/${user.user_id}`)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                            title="Edit Profile"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {isSuperAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openRoleDialog(user)}
                              title="Change Role"
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openCoachDialog(user)}
                            title="Assign Coach"
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openAssignDialog(user)}
                            title="Assign Program"
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setSelectedUser(user); setNutritionDialogOpen(true); }}
                            title="Assign Nutrition"
                          >
                            <UtensilsCrossed className="h-4 w-4" />
                          </Button>
                          {isSuperAdmin && user.user_id !== currentUser?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteUser(user)}
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit User Profile</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-height">Height</Label>
                  <Input
                    id="edit-height"
                    value={editForm.height}
                    onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                    placeholder="5'6&quot;"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-weight">Current Weight</Label>
                  <Input
                    id="edit-weight"
                    value={editForm.current_weight}
                    onChange={(e) => setEditForm({ ...editForm, current_weight: e.target.value })}
                    placeholder="145 lbs"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-goal">Goal Weight</Label>
                  <Input
                    id="edit-goal"
                    value={editForm.goal_weight}
                    onChange={(e) => setEditForm({ ...editForm, goal_weight: e.target.value })}
                    placeholder="135 lbs"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-exp">Experience Level</Label>
                  <Select
                    value={editForm.experience_level}
                    onValueChange={(value) => setEditForm({ ...editForm, experience_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-goals">Goals (comma separated)</Label>
                <Input
                  id="edit-goals"
                  value={editForm.goals}
                  onChange={(e) => setEditForm({ ...editForm, goals: e.target.value })}
                  placeholder="Build muscle, Lose fat, Improve energy"
                />
              </div>
              <div>
                <Label htmlFor="edit-injuries">Injuries / Limitations</Label>
                <Textarea
                  id="edit-injuries"
                  value={editForm.injuries}
                  onChange={(e) => setEditForm({ ...editForm, injuries: e.target.value })}
                  placeholder="Any injuries or limitations..."
                />
              </div>
              <Button type="submit" className="w-full">
                Save Changes
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Role Change Dialog - Super Admin Only */}
        <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Change User Role
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">{selectedUser?.full_name || selectedUser?.email}</p>
                <p className="text-sm text-muted-foreground">
                  Current role: {getRoleBadge(userRoles[selectedUser?.user_id || ""])}
                </p>
              </div>
              <div>
                <Label htmlFor="new-role">New Role</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(value) => setSelectedRole(value as AppRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="coach">Coach</SelectItem>
                    <SelectItem value="content_admin">Content Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleChangeRole}
                className="w-full"
                disabled={savingRole}
              >
                {savingRole && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Role
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Assign Program Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Assign Workout Schedule
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">{selectedUser?.full_name || selectedUser?.email}</p>
              </div>

              {/* Toggle */}
              <div className="flex rounded-lg border border-border p-1 gap-1">
                <button
                  type="button"
                  className={`flex-1 text-sm font-medium py-2 px-3 rounded-md transition-colors ${
                    assignMode === "template"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setAssignMode("template")}
                >
                  Program Template
                </button>
                <button
                  type="button"
                  className={`flex-1 text-sm font-medium py-2 px-3 rounded-md transition-colors ${
                    assignMode === "custom"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setAssignMode("custom")}
                >
                  Custom Day-by-Day
                </button>
              </div>

              {assignMode === "template" ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Assign a pre-built program template with predefined workouts for each day.
                  </p>
                  <form onSubmit={handleAssignProgram} className="space-y-3">
                    <Select
                      value={assignForm.program_id || "none"}
                      onValueChange={(value) => setAssignForm({ ...assignForm, program_id: value === "none" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a program" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No program</SelectItem>
                        {programs.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div>
                      <Label htmlFor="assign-start" className="text-xs">Start Date</Label>
                      <Input
                        id="assign-start"
                        type="date"
                        value={assignForm.start_date}
                        onChange={(e) => setAssignForm({ ...assignForm, start_date: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full" size="sm" disabled={savingAssignment}>
                      {savingAssignment && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Save Program
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Build a fully custom weekly schedule by picking individual exercises for each day.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    size="sm"
                    onClick={() => {
                      setAssignDialogOpen(false);
                      navigate("/admin/scheduling", { state: { preselectedUserId: selectedUser?.user_id } });
                    }}
                  >
                    Open Custom Scheduler
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Nutrition Assignment Dialog */}
        <NutritionAssignmentDialog
          open={nutritionDialogOpen}
          onOpenChange={setNutritionDialogOpen}
          userId={selectedUser?.user_id || ""}
          userName={selectedUser?.full_name || selectedUser?.email || ""}
        />

        {/* Assign Coach Dialog */}
        <Dialog open={coachDialogOpen} onOpenChange={setCoachDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Assign Coach
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAssignCoach} className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">{selectedUser?.full_name || selectedUser?.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Coach assignment is membership-based and applies to the entire client relationship
                </p>
              </div>
              <div>
                <Label htmlFor="assign-coach">Select Coach</Label>
                <Select
                  value={selectedCoachId || "none"}
                  onValueChange={(value) => setSelectedCoachId(value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a coach" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No coach assigned</SelectItem>
                    {coaches.map((coach) => (
                      <SelectItem key={coach.user_id} value={coach.user_id}>
                        {coach.full_name || coach.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={savingCoach}>
                {savingCoach && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {selectedCoachId ? "Assign Coach" : "Remove Coach"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
