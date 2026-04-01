import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle, ArrowRight, LogIn, BookOpen, Star, Users,
  Dumbbell, Apple, Brain, Trophy, Clock, Shield, Target, Zap,
  MessageCircle, Video, FileText
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const courseModules = [
  {
    icon: Dumbbell,
    title: "Training Fundamentals",
    description: "Master proper exercise form, progressive overload, and program design principles used by IFBB Pros.",
    details: ["Push / Pull / Legs split programming", "Exercise selection & substitutions", "Progressive overload strategies", "Warm-up & cooldown protocols"],
  },
  {
    icon: Apple,
    title: "Nutrition & Diet Setup",
    description: "Learn how to calculate your macros, build a sustainable meal plan, and understand nutrient timing.",
    details: ["Calorie & macro calculations", "Meal prep strategies", "Flexible dieting approach", "Supplement guidance"],
  },
  {
    icon: Brain,
    title: "Mindset & Consistency",
    description: "Develop the mental frameworks that separate those who quit from those who transform.",
    details: ["Goal setting & tracking", "Building unbreakable habits", "Overcoming plateaus", "Managing motivation dips"],
  },
  {
    icon: Target,
    title: "Body Composition",
    description: "Understand how to cut, bulk, or recomp based on your specific goals and body type.",
    details: ["Cutting vs bulking phases", "Body fat percentage targets", "Recomposition strategies", "Progress measurement methods"],
  },
];

const whatYouGet = [
  { icon: Video, text: "Video lessons from an IFBB Pro athlete" },
  { icon: FileText, text: "Complete training programs (push/pull/legs)" },
  { icon: Apple, text: "Diet setup guide with macro calculations" },
  { icon: Dumbbell, text: "Exercise library with coaching cues" },
  { icon: MessageCircle, text: "Community access with like-minded people" },
  { icon: Clock, text: "Self-paced — learn on your own schedule" },
  { icon: Shield, text: "Lifetime access — no recurring fees" },
  { icon: Zap, text: "Regular content updates included" },
];

const nextSteps = [
  {
    icon: BookOpen,
    title: "Create Your Account",
    description: "Sign up in under 60 seconds to unlock the full course library.",
  },
  {
    icon: Star,
    title: "Start Learning",
    description: "Dive into the modules at your own pace — no deadlines, no pressure.",
  },
  {
    icon: Users,
    title: "Join the Community",
    description: "Connect with others on the same journey. You're never doing this alone.",
  },
];

const faqs = [
  {
    q: "Who is this course for?",
    a: "This course is designed for anyone looking to take their fitness seriously — whether you're just starting out or have been training for years but want structured guidance from a professional.",
  },
  {
    q: "How is this different from free YouTube content?",
    a: "Free content is scattered and generic. This course is a structured, step-by-step system built by an IFBB Pro — covering training, nutrition, and mindset in one cohesive program.",
  },
  {
    q: "Do I need a gym membership?",
    a: "A gym with basic equipment (barbell, dumbbells, cables) is recommended, but many exercises include home-friendly alternatives.",
  },
  {
    q: "Is there a refund policy?",
    a: "Yes — if you're not satisfied within 14 days of purchase, reach out and we'll make it right.",
  },
  {
    q: "How long do I have access?",
    a: "Lifetime. Once you purchase, the course is yours forever — including any future updates.",
  },
];

export default function CourseOffer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gender = searchParams.get("gender") || "other";
  const email = searchParams.get("email") || "";
  const name = searchParams.get("name") || "";
  const firstName = name.split(" ")[0] || "";
  const abandonTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abandonTriggeredRef = useRef(false);

  useEffect(() => {
    if (!email) return;
    abandonTimerRef.current = setTimeout(async () => {
      if (abandonTriggeredRef.current) return;
      abandonTriggeredRef.current = true;
      try {
        await supabase.functions.invoke("schedule-precall-emails", {
          body: {
            lead_email: email,
            sequence_type: "dq_abandon",
            checkout_url: `${window.location.origin}/course-offer?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&gender=${encodeURIComponent(gender)}`,
          },
        });
      } catch (err) {
        console.error("Failed to trigger abandon cart emails:", err);
      }
    }, 10 * 60 * 1000);
    return () => {
      if (abandonTimerRef.current) clearTimeout(abandonTimerRef.current);
    };
  }, [email, name, gender]);

  const FANBASIS_BASE_URL = 'https://www.fanbasis.com/agency-checkout/etilamethod/l76QV';
  const signupUrl = `/signup?gender=${encodeURIComponent(gender)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`;

  const handleGetAccess = () => {
    // Fanbasis does not support query params in the success redirect URL.
    // Set success URL in Fanbasis dashboard to: https://etilamethod.com/payment-success
    // The payment-success page will ask the user for their email to link the purchase.
    window.location.href = FANBASIS_BASE_URL;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
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
            {firstName ? `${firstName}, ` : ""}Thank You — <span className="font-medium">Here's Your Path</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-muted-foreground text-lg mb-6"
          >
            Based on your answers, Étila's Standalone Fitness Course is the perfect fit for where you are right now. Here's everything that's waiting for you inside.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Button
              onClick={handleGetAccess}
              className="rounded-sm h-12 px-10 text-base"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Get Instant Access — $249
            </Button>
          </motion.div>
        </div>
      </section>

      {/* What You Get */}
      <section className="px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl font-light tracking-tight text-center mb-8"
          >
            Everything You Get
          </motion.h2>

          <div className="grid sm:grid-cols-2 gap-3">
            {whatYouGet.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Course Modules Deep Dive */}
      <section className="px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl font-light tracking-tight text-center mb-3"
          >
            What You'll Learn
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-muted-foreground text-sm mb-8"
          >
            A structured education built by an IFBB Pro — not random tips from the internet.
          </motion.p>

          <div className="grid md:grid-cols-2 gap-4">
            {courseModules.map((mod, index) => (
              <motion.div
                key={mod.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <mod.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-medium">{mod.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{mod.description}</p>
                    <ul className="space-y-2">
                      {mod.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Authority */}
      <section className="px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <Card className="border-primary/20">
            <CardContent className="p-8 text-center">
              <Trophy className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-3">Built by an IFBB Pro</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-lg mx-auto">
                This isn't a cookie-cutter program from a social media influencer. Étila is an IFBB Professional athlete who has spent years mastering the science and art of physique development. Every lesson in this course is drawn from real competitive experience and proven coaching methods.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Mid-page CTA */}
      <section className="px-6 pb-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-lg mx-auto text-center"
        >
          <p className="text-muted-foreground text-sm mb-4">One-time payment. Lifetime access. No subscriptions.</p>
          <Button
            onClick={handleGetAccess}
            className="rounded-sm h-12 px-10 text-base"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Get Instant Access — $249
          </Button>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl font-light tracking-tight text-center mb-8"
          >
            How It Works
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-4">
            {nextSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
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

      {/* FAQ */}
      <section className="px-6 pb-16">
        <div className="max-w-2xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl font-light tracking-tight text-center mb-8"
          >
            Frequently Asked Questions
          </motion.h2>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left text-sm">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-lg mx-auto text-center"
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-8">
              <h3 className="text-xl font-medium mb-2">Ready to Start Your Transformation?</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Join hundreds of others who've taken control of their fitness with Étila's proven system.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleGetAccess}
                    className="rounded-sm h-12 px-8 text-base w-full sm:w-auto"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign Up — $249
                  </Button>
                </motion.div>

                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="rounded-sm h-12 px-8"
                >
                  Back to Home
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-4">One-time payment · Lifetime access · 14-day satisfaction guarantee</p>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
}
