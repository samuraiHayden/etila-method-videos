import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight, LogIn, Calendar, MessageSquare, Dumbbell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InlineWidget, useCalendlyEventListener } from "react-calendly";

const nextSteps = [
  {
    icon: Calendar,
    title: "Discovery Call",
    description: "Étila will reach out within 24 hours to schedule your free 15-minute call.",
  },
  {
    icon: MessageSquare,
    title: "Custom Game Plan",
    description: "After your call, you'll receive a personalized training and nutrition roadmap.",
  },
  {
    icon: Dumbbell,
    title: "Start Training",
    description: "Access your workouts, meal plans, and direct coaching through the platform.",
  },
];

export default function BookCall() {
  const navigate = useNavigate();
  const [hasBooked, setHasBooked] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const prefillName = searchParams.get("name") || "";
  const prefillEmail = searchParams.get("email") || "";
  const prefillPhone = searchParams.get("phone") || "";

  useCalendlyEventListener({
    onEventScheduled: async () => {
      setHasBooked(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (prefillEmail) {
        try {
          // Update lead status
          await supabase
            .from("leads")
            .update({ status: "call_scheduled", last_contacted_at: new Date().toISOString() } as any)
            .eq("email", prefillEmail);

          // Cancel any pending no-book nurture emails
          const { data: leadData } = await supabase
            .from("leads")
            .select("id")
            .eq("email", prefillEmail)
            .limit(1)
            .single();

          if (leadData) {
            await supabase
              .from("scheduled_emails")
              .update({ status: "cancelled" } as any)
              .eq("lead_id", leadData.id)
              .eq("sequence_type", "no_book")
              .eq("status", "pending");
          }

          // Trigger pre-call email sequence
          await supabase.functions.invoke("schedule-precall-emails", {
            body: {
              lead_email: prefillEmail,
              sequence_type: "pre_call",
            },
          });
        } catch (err) {
          console.error("Failed to update lead or schedule emails:", err);
        }
      }
    },
  });

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (
        e.data?.event === "calendly.event_scheduled" ||
        (typeof e.data === "string" && e.data.includes("calendly") && e.data.includes("scheduled"))
      ) {
        setHasBooked(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-6" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-3xl md:text-4xl font-light tracking-tight mb-4"
          >
            You're In — <span className="font-medium">Welcome!</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-muted-foreground text-lg mb-3"
          >
            {hasBooked
              ? "You're booked! Watch the video below to learn what happens next."
              : "You've qualified for personalized 1-on-1 coaching with Étila. Book your free discovery call below."}
          </motion.p>
        </div>
      </section>

      {/* Thank You VSL — only after booking */}
      {hasBooked && (
        <section className="px-6 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <div
              className="rounded-lg overflow-hidden border border-border"
              dangerouslySetInnerHTML={{
                __html: `<style>wistia-player[media-id='nojnufyrcb']:not(:defined){background:center/contain no-repeat url('https://fast.wistia.com/embed/medias/nojnufyrcb/swatch');display:block;filter:blur(5px);padding-top:56.25%}</style><wistia-player media-id="nojnufyrcb" aspect="1.7777777777777777"></wistia-player>`
              }}
            />
          </motion.div>
        </section>
      )}

      {/* Book a Call — Calendly (hidden after booking) */}
      {!hasBooked && (
        <section className="px-6 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-2xl font-light tracking-tight text-center mb-6">
              Schedule Your <span className="font-medium">Free Discovery Call</span>
            </h2>
            <div className="rounded-lg overflow-hidden border border-border">
              <InlineWidget
                url="https://calendly.com/etila/30min?hide_event_type_details=1&hide_gdpr_banner=1"
                styles={{ height: '1100px', minWidth: '320px' }}
                prefill={{
                  name: prefillName,
                  email: prefillEmail,
                }}
              />
            </div>
          </motion.div>
        </section>
      )}

      {/* Next Steps */}
      <section className="px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="text-2xl font-light tracking-tight text-center mb-8"
          >
            Here's What Happens Next
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-4">
            {nextSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
              >
                <Card className="h-full text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <step.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Step {index + 1}
                    </div>
                    <h3 className="font-medium mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Back to Home */}
      <section className="px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          className="max-w-lg mx-auto text-center"
        >
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="rounded-sm h-12 px-8"
          >
            Back to Home
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
