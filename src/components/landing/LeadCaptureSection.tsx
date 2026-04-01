import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const leadSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Please enter a valid email").max(255, "Email must be less than 255 characters"),
});

interface Props {
  onLeadCaptured: (leadId: string) => void;
}

export function LeadCaptureSection({ onLeadCaptured }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = leadSchema.safeParse({ fullName, email });
    if (!result.success) {
      const fieldErrors: { fullName?: string; email?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "fullName") fieldErrors.fullName = err.message;
        if (err.path[0] === "email") fieldErrors.email = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("leads")
        .insert({ full_name: result.data.fullName, email: result.data.email })
        .select("id")
        .single();

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("You're in! Let's find your perfect program.");

      // Open questionnaire dialog after brief moment
      setTimeout(() => {
        onLeadCaptured(data.id);
      }, 1000);
    } catch (error: any) {
      console.error("Lead capture error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <section className="py-20 md:py-28 bg-primary">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center"
          >
            <CheckCircle className="h-16 w-16 text-primary-foreground mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-light text-primary-foreground mb-4 tracking-tight">
              You're In!
            </h2>
            <p className="text-primary-foreground/90 text-lg">
              Opening your quick questionnaire to find your perfect program...
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 md:py-28 bg-primary">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <BookOpen className="h-5 w-5 text-primary-foreground/80" />
            <span className="text-sm uppercase tracking-widest text-primary-foreground/80">
              Free Guide
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-light text-primary-foreground mb-4 tracking-tight"
          >
            Get Your Free <span className="font-medium">Training Kickstart Guide</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            viewport={{ once: true }}
            className="text-primary-foreground/90 mb-10 text-lg max-w-xl mx-auto"
          >
            Learn the exact framework Étila uses with her clients to build sustainable fitness habits. Enter your info below and we'll send it straight to your inbox.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
          >
            <div className="flex-1 space-y-1">
              <Input
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 h-12 rounded-sm"
                disabled={isSubmitting}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive-foreground text-left">{errors.fullName}</p>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <Input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 h-12 rounded-sm"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-destructive-foreground text-left">{errors.email}</p>
              )}
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                size="lg"
                variant="secondary"
                className="text-base px-8 h-12 rounded-sm w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Get the Guide"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </motion.form>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            viewport={{ once: true }}
            className="text-primary-foreground/60 text-xs mt-4"
          >
            By submitting, you agree to our{" "}
            <Link to="/terms" className="underline hover:text-primary-foreground/90">Terms of Service</Link>
            {" "}and{" "}
            <Link to="/privacy" className="underline hover:text-primary-foreground/90">Privacy Policy</Link>.
            {" "}No spam, ever. Unsubscribe anytime.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
