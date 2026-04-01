import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import etilaLogo from "@/assets/etila-logo-primary.png";
import { supabase } from "@/integrations/supabase/client";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Fanbasis may pass these as query params (configure in Fanbasis dashboard)
  // e.g. success URL: https://yoursite.com/payment-success?email={EMAIL}&name={FIRST_NAME}
  const [email, setEmail] = useState(
    searchParams.get("email") || searchParams.get("customer_email") || ""
  );
  const [name, setName] = useState(
    searchParams.get("name") || searchParams.get("first_name") || searchParams.get("customer_name") || ""
  );

  const [status, setStatus] = useState<"marking" | "done" | "error">("marking");
  const [needsInfo, setNeedsInfo] = useState(false);

  // Mark the lead as paid as soon as we have their email
  useEffect(() => {
    if (email) {
      markPaid(email, name || undefined);
    } else {
      // Fanbasis didn't pass email — show a form to collect it
      setNeedsInfo(true);
      setStatus("done");
    }
  }, []); // run once on mount

  const markPaid = async (customerEmail: string, customerName?: string) => {
    setStatus("marking");
    try {
      // Mark lead as paid in CRM
      await supabase.rpc("mark_lead_paid", {
        p_email: customerEmail,
        p_full_name: customerName || null,
        p_purchase_type: "low_ticket", // status will be set to "bought_low_ticket"
      });

      // Trigger post-purchase welcome email sequence
      supabase.functions.invoke("schedule-precall-emails", {
        body: {
          lead_email: customerEmail,
          sequence_type: "post_purchase",
        },
      }).catch((err) => console.error("Failed to schedule welcome emails:", err));

      setStatus("done");
    } catch (err) {
      console.error("Failed to mark lead paid:", err);
      setStatus("done"); // still let them proceed — don't block access
    }
  };

  const handleSubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setNeedsInfo(false);
    await markPaid(email, name || undefined);
  };

  const handleCreateAccount = () => {
    const params = new URLSearchParams();
    if (email) params.set("email", email);
    if (name) params.set("name", name);
    params.set("paid", "1");
    navigate(`/signup?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm text-center space-y-6"
      >
        {/* Logo */}
        <img
          src={etilaLogo}
          alt="The Étila Method"
          className="h-14 object-contain mx-auto"
        />

        {needsInfo ? (
          // Fanbasis didn't pass email — collect it
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Payment Confirmed!</h1>
            <p className="text-muted-foreground text-sm">
              Enter the email you used during checkout to unlock your account.
            </p>
            <form onSubmit={handleSubmitInfo} className="space-y-3 text-left">
              <div className="space-y-1">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="name">Your name (optional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="First name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12"
                />
              </div>
              <Button type="submit" className="w-full h-12 text-base font-semibold rounded-xl">
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </div>
        ) : status === "marking" ? (
          // Briefly show loading while we update the CRM
          <div className="space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground text-sm">Confirming your purchase…</p>
          </div>
        ) : (
          // Success state — show confirmation and "Create Account" CTA
          <div className="space-y-5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 14 }}
              className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto"
            >
              <CheckCircle className="h-10 w-10 text-primary" />
            </motion.div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold">
                {name ? `You're in, ${name.split(" ")[0]}! 🎉` : "You're in! 🎉"}
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Your purchase is confirmed. Create your account below to get instant access to The Étila Method.
              </p>
            </div>

            {/* What they unlocked */}
            <div className="bg-muted/50 rounded-xl p-4 text-left space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What's included</p>
              {[
                "Full access to The Étila Method platform",
                "Complete training programs (push/pull/legs)",
                "Exercise library with coaching cues",
                "Nutrition & meal planning guides",
                "Progress tracking tools",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={handleCreateAccount}
              size="lg"
              className="w-full h-12 text-base font-semibold rounded-xl"
            >
              Create My Account <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            <p className="text-xs text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-primary underline hover:text-primary/80"
              >
                Sign in
              </button>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
