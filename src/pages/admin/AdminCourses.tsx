import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Loader2, GraduationCap, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string;
  thumbnail_url: string | null;
  is_published: boolean;
  drip_enabled: boolean;
}

export default function AdminCourses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "fitness" as string,
    thumbnail_url: "",
    is_published: false,
    drip_enabled: false,
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("title");

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }

  function openDialog(course?: Course) {
    if (course) {
      setEditingCourse(course);
      setForm({
        title: course.title,
        description: course.description || "",
        category: course.category,
        thumbnail_url: course.thumbnail_url || "",
        is_published: course.is_published,
        drip_enabled: course.drip_enabled,
      });
    } else {
      setEditingCourse(null);
      setForm({
        title: "",
        description: "",
        category: "fitness",
        thumbnail_url: "",
        is_published: false,
        drip_enabled: false,
      });
    }
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    const data = {
      title: form.title,
      description: form.description || null,
      category: form.category,
      thumbnail_url: form.thumbnail_url || null,
      is_published: form.is_published,
      drip_enabled: form.drip_enabled,
    };

    try {
      if (editingCourse) {
        const { error } = await supabase
          .from("courses")
          .update(data)
          .eq("id", editingCourse.id);
        if (error) throw error;
        toast.success("Course updated");
      } else {
        const { error } = await supabase
          .from("courses")
          .insert({ ...data, created_by: user?.id });
        if (error) throw error;
        toast.success("Course created");
      }

      setDialogOpen(false);
      fetchCourses();
    } catch (error) {
      console.error("Error saving course:", error);
      toast.error("Failed to save course");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
      toast.success("Course deleted");
      fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Failed to delete course");
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "nutrition":
        return "bg-green-500/10 text-green-700";
      case "mental":
        return "bg-purple-500/10 text-purple-700";
      case "fitness":
        return "bg-primary/10 text-primary";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Courses</h1>
            <p className="text-muted-foreground">
              Manage educational content
            </p>
          </div>
          <Button onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Course
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      {course.title}
                    </CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge className={getCategoryColor(course.category)}>
                        {course.category}
                      </Badge>
                      {course.is_published ? (
                        <Badge>Published</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDialog(course)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(course.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {course.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {course.description}
                  </p>
                )}
                {course.drip_enabled && (
                  <p className="text-xs text-muted-foreground">
                    📅 Drip release enabled
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => navigate(`/admin/courses/${course.id}`)}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Manage Modules
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No courses found. Create your first course!
          </div>
        )}

        {/* Course Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCourse ? "Edit Course" : "Add Course"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="cs-title">Title</Label>
                <Input
                  id="cs-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cs-category">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm({ ...form, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fitness">Fitness</SelectItem>
                    <SelectItem value="nutrition">Nutrition</SelectItem>
                    <SelectItem value="mental">Mental</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cs-desc">Description</Label>
                <Textarea
                  id="cs-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="cs-thumb">Thumbnail URL</Label>
                <Input
                  id="cs-thumb"
                  type="url"
                  value={form.thumbnail_url}
                  onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="cs-published">Published</Label>
                <Switch
                  id="cs-published"
                  checked={form.is_published}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, is_published: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="cs-drip">Drip Release</Label>
                <Switch
                  id="cs-drip"
                  checked={form.drip_enabled}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, drip_enabled: checked })
                  }
                />
              </div>
              <Button type="submit" className="w-full">
                {editingCourse ? "Save Changes" : "Create Course"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
