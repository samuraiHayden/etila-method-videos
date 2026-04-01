import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Send, Loader2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface ProfileInfo {
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface MessageThread {
  id: string;
  client_id: string;
  coach_id: string | null;
  subject: string | null;
  last_message_at: string | null;
  client_profile?: ProfileInfo;
  coach_profile?: ProfileInfo;
  last_message_preview?: string;
  last_message_sender_id?: string;
}

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminMessages() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [coachFilter, setCoachFilter] = useState<string>("all");

  useEffect(() => {
    fetchThreads();

    // Realtime: refresh threads when new messages arrive
    const channel = supabase
      .channel("admin-messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as Message;
          // If viewing this thread, add the message inline
          if (selectedThread && msg.thread_id === selectedThread.id) {
            setMessages((prev) =>
              prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]
            );
            // Mark as read immediately
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", msg.id)
              .neq("sender_id", user?.id)
              .then();
          }
          // Refresh thread list for updated timestamps
          fetchThreads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedThread?.id]);

  async function fetchThreads() {
    try {
      const { data: threadData, error } = await supabase
        .from("message_threads")
        .select("*")
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      // Gather all unique user IDs (clients + coaches)
      const allUserIds = new Set<string>();
      threadData?.forEach((t) => {
        allUserIds.add(t.client_id);
        if (t.coach_id) allUserIds.add(t.coach_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, avatar_url")
        .in("user_id", [...allUserIds]);

      const profileMap: Record<string, ProfileInfo> = {};
      profiles?.forEach((p) => {
        profileMap[p.user_id] = p;
      });

      // Fetch last message for each thread
      const threadIds = threadData?.map((t) => t.id) || [];
      const lastMessages: Record<string, { content: string; sender_id: string }> = {};
      if (threadIds.length > 0) {
        // Get latest message per thread
        for (const tid of threadIds) {
          const { data: msgData } = await supabase
            .from("messages")
            .select("content, sender_id")
            .eq("thread_id", tid)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (msgData) {
            lastMessages[tid] = msgData;
          }
        }
      }

      const threadsWithProfiles = threadData?.map((thread) => ({
        ...thread,
        client_profile: profileMap[thread.client_id],
        coach_profile: thread.coach_id ? profileMap[thread.coach_id] : undefined,
        last_message_preview: lastMessages[thread.id]?.content,
        last_message_sender_id: lastMessages[thread.id]?.sender_id,
      }));

      setThreads(threadsWithProfiles || []);
    } catch (error) {
      console.error("Error fetching threads:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }

  async function selectThread(thread: MessageThread) {
    setSelectedThread(thread);

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("thread_id", thread.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("thread_id", thread.id)
        .neq("sender_id", user?.id);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedThread || !newMessage.trim()) return;

    try {
      const { error } = await supabase.from("messages").insert({
        thread_id: selectedThread.id,
        sender_id: user?.id,
        content: newMessage.trim(),
      });

      if (error) throw error;

      await supabase
        .from("message_threads")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selectedThread.id);

      setNewMessage("");
      selectThread(selectedThread);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email?.[0]?.toUpperCase() || "?";
  };

  // Build unique coach list for filter
  const coaches = Array.from(
    new Map(
      threads
        .filter((t) => t.coach_id && t.coach_profile)
        .map((t) => [t.coach_id!, t.coach_profile!])
    )
  );

  const filteredThreads = threads.filter((thread) => {
    const name = thread.client_profile?.full_name || "";
    const email = thread.client_profile?.email || "";
    const coachName = thread.coach_profile?.full_name || "";
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coachName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCoach = coachFilter === "all" || thread.coach_id === coachFilter;
    return matchesSearch && matchesCoach;
  });

  // Helper to get sender label in chat
  const getSenderLabel = (senderId: string): string => {
    if (senderId === selectedThread?.client_id) {
      return selectedThread?.client_profile?.full_name || "Client";
    }
    if (senderId === selectedThread?.coach_id) {
      return selectedThread?.coach_profile?.full_name || "Coach";
    }
    return "Admin";
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
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground">View all coach–client conversations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Thread List */}
          <Card className="lg:col-span-1 flex flex-col">
            <CardHeader className="pb-2 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {coaches.length > 1 && (
                <Select value={coachFilter} onValueChange={setCoachFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by coach" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Coaches</SelectItem>
                    {coaches.map(([id, profile]) => (
                      <SelectItem key={id} value={id}>
                        {profile.full_name || profile.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {filteredThreads.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No conversations yet
                </div>
              ) : (
                <div className="divide-y">
                  {filteredThreads.map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => selectThread(thread)}
                      className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                        selectedThread?.id === thread.id ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={thread.client_profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(thread.client_profile?.full_name || null, thread.client_profile?.email || "")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {thread.client_profile?.full_name || thread.client_profile?.email || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            Coach: {thread.coach_profile?.full_name || thread.coach_profile?.email || "Unassigned"}
                          </p>
                          {thread.last_message_preview && (
                            <p className="text-xs text-muted-foreground/80 truncate mt-0.5">
                              <span className="font-medium">
                                {thread.last_message_sender_id === thread.client_id
                                  ? (thread.client_profile?.full_name?.split(" ")[0] || "Client")
                                  : thread.last_message_sender_id === thread.coach_id
                                    ? (thread.coach_profile?.full_name?.split(" ")[0] || "Coach")
                                    : "Admin"}
                                :
                              </span>{" "}
                              {thread.last_message_preview}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                            {thread.last_message_at
                              ? format(new Date(thread.last_message_at), "MMM d, h:mm a")
                              : "No messages"}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat View */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedThread ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedThread.client_profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(selectedThread.client_profile?.full_name || null, selectedThread.client_profile?.email || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {selectedThread.client_profile?.full_name || selectedThread.client_profile?.email}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Coach: {selectedThread.coach_profile?.full_name || selectedThread.coach_profile?.email || "Unassigned"}
                      </p>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Eye className="h-3 w-3" />
                      Read-only
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => {
                    const isCoach = message.sender_id === selectedThread.coach_id;
                    const isClient = message.sender_id === selectedThread.client_id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isCoach ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            isCoach
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className={`text-[10px] font-medium mb-0.5 ${
                            isCoach ? "text-primary-foreground/80" : "text-muted-foreground"
                          }`}>
                            {getSenderLabel(message.sender_id)}
                          </p>
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isCoach ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {format(new Date(message.created_at), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
                <div className="p-4 border-t">
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Send a message as admin..."
                      className="min-h-[44px] max-h-32 resize-none"
                      rows={1}
                    />
                    <Button type="submit" size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a conversation to view
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
