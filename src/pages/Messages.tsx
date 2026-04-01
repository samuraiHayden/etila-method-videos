import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, ArrowLeft, MessageSquare, UserX } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Coach {
  user_id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && profile) initializeChat();
  }, [user, profile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!threadId) return;
    const channel = supabase
      .channel(`messages-${threadId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => prev.find((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]);
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [threadId]);

  async function initializeChat() {
    if (!user || !profile?.assigned_coach_id) { setLoading(false); return; }
    try {
      const { data: coachData } = await supabase
        .from("profiles").select("user_id, full_name, email, avatar_url").eq("user_id", profile.assigned_coach_id).single();
      if (coachData) setCoach(coachData);
      const { data: existingThread } = await supabase
        .from("message_threads").select("*").eq("client_id", user.id).eq("coach_id", profile.assigned_coach_id).single();
      if (existingThread) {
        setThreadId(existingThread.id);
        await fetchMessages(existingThread.id);
      }
    } catch (error) {
      console.error("Error initializing chat:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(tid: string) {
    try {
      const { data, error } = await supabase.from("messages").select("*").eq("thread_id", tid).order("created_at", { ascending: true });
      if (error) throw error;
      setMessages(data || []);
      await supabase.from("messages").update({ is_read: true }).eq("thread_id", tid).neq("sender_id", user?.id);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !user || !profile?.assigned_coach_id) return;
    setSending(true);
    try {
      let currentThreadId = threadId;
      if (!currentThreadId) {
        const { data: newThread, error: threadError } = await supabase
          .from("message_threads").insert({ client_id: user.id, coach_id: profile.assigned_coach_id, last_message_at: new Date().toISOString() }).select().single();
        if (threadError) throw threadError;
        currentThreadId = newThread.id;
        setThreadId(newThread.id);
      }
      const { error: messageError } = await supabase.from("messages").insert({ thread_id: currentThreadId, sender_id: user.id, content: newMessage.trim() });
      if (messageError) throw messageError;
      await supabase.from("message_threads").update({ last_message_at: new Date().toISOString() }).eq("id", currentThreadId);
      setNewMessage("");
      await fetchMessages(currentThreadId);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    return email[0].toUpperCase();
  };

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!profile?.assigned_coach_id || !coach) {
    return (
      <AppShell>
        <div className="px-5 pt-14 pb-2 safe-top">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-[34px] font-bold tracking-tight">Messages</motion.h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/60 flex items-center justify-center">
            <UserX className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <h2 className="text-lg font-semibold mb-1">No Coach Assigned</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            You haven't been assigned a coach yet. Once your coach is assigned, you'll be able to message them here.
          </p>
          <Button variant="outline" className="mt-6 rounded-xl" onClick={() => navigate("/profile")}>
            Back to Profile
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell hideNav>
      <div className="flex flex-col h-[100dvh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-background/80 backdrop-blur-xl safe-top">
          <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} className="h-9 w-9 rounded-xl hover:bg-muted/60 -ml-1">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-9 w-9">
            <AvatarImage src={coach.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {getInitials(coach.full_name, coach.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold truncate">{coach.full_name || "Your Coach"}</h1>
            <p className="text-[11px] text-muted-foreground truncate">{coach.email}</p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-secondary/50 flex items-center justify-center">
                <MessageSquare className="h-7 w-7 text-muted-foreground/25" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Send a message to start the conversation
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const isMe = message.sender_id === user?.id;
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn("flex", isMe ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5",
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-lg"
                          : "bg-card border border-border/40 rounded-bl-lg"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      <p
                        className={cn(
                          "text-[10px] mt-1",
                          isMe ? "text-primary-foreground/50" : "text-muted-foreground/60"
                        )}
                      >
                        {format(new Date(message.created_at), "h:mm a")}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="min-h-[44px] max-h-32 resize-none rounded-xl border-border/50 bg-secondary/30"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newMessage.trim() || sending}
              className="h-11 w-11 rounded-xl shrink-0"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
