import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Dumbbell, BookOpen, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import etilaCoach from "@/assets/etila-coach.jpg";
import etilaCoach2 from "@/assets/etila-coach-2.jpg";
import { Link } from "react-router-dom";
import { Header } from "@/components/landing/Header";
import { AnimatedSection } from "@/components/landing/AnimatedSection";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { HeroLeadCapture } from "@/components/landing/HeroLeadCapture";
import { BeforeAfterSection } from "@/components/landing/BeforeAfterSection";
import { TestimonialSection } from "@/components/landing/TestimonialSection";
import { ObjectionSection } from "@/components/landing/ObjectionSection";
import { FinalCtaSection } from "@/components/landing/FinalCtaSection";
import { CelebrityTestimonial } from "@/components/landing/CelebrityTestimonial";
import { QuestionnaireDialog } from "@/components/landing/QuestionnaireDialog";

export default function Landing() {
  const [questionnaireOpen, setQuestionnaireOpen] = useState(false);
  const [capturedLeadId, setCapturedLeadId] = useState<string | null>(null);

  const results = [
    { metric: "500+", label: "Clients Transformed" },
    { metric: "10+ Years", label: "Coaching Experience" },
    { metric: "98%", label: "Client Satisfaction" },
  ];

  const features = [
    {
      icon: Dumbbell,
      title: "Custom Training Programs",
      description: "Programs built around YOUR real schedule, even if that's 3 sessions a week. No cookie-cutter templates.",
    },
    {
      icon: BookOpen,
      title: "Nutrition That Fits Your Life",
      description: "Eat the foods you love, structured in a way that actually gets results. No restriction, no guilt.",
    },
    {
      icon: MessageCircle,
      title: "A Real Coach in Your Corner",
      description: "A real partnership with weekly check-ins and constant adjustments. Not a PDF you download.",
    },
  ];

  return (
    <div className="min-h-screen bg-background landing-theme">
      <Header />

      {/* Hero Section — Full-width with coach photo */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={etilaCoach}
            alt="Coach Étila"
            className="w-full h-full object-cover object-[center_15%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 via-foreground/30 to-transparent" />
        </div>

        <div className="relative container mx-auto px-6 py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
            className="max-w-2xl"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-xs md:text-sm uppercase tracking-widest text-white/70 mb-4"
            >
              IFBB Pro · Bikini Olympia Top 3 · 4x Pro Champion
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="text-4xl md:text-5xl lg:text-6xl tracking-tight text-white mb-4 leading-[1.1]"
            >
              <span className="font-light">Women everywhere are building strength, confidence, and results with</span>
              <br />
              <span className="font-bold">The Étila Method.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-xl md:text-2xl font-bold text-white mt-6 mb-8"
            >
              Now it's your turn.
            </motion.p>
            <HeroLeadCapture onStartQuestionnaire={() => setQuestionnaireOpen(true)} />
          </motion.div>
        </div>
      </section>

      {/* Results Banner */}
      <AnimatedSection className="py-16 bg-card border-b border-border">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
            {results.map((result, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <p className="text-3xl md:text-5xl font-bold text-foreground">{result.metric}</p>
                <p className="text-sm text-muted-foreground mt-2">{result.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Testimonials — right after stats like the reference */}
      <TestimonialSection onStartQuestionnaire={() => setQuestionnaireOpen(true)} />

      {/* VSL Video Section */}
      <section className="py-14 md:py-20 bg-card">
        <div className="container mx-auto px-6">
          <AnimatedSection className="text-center mb-8">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight max-w-2xl mx-auto text-foreground">
              Watch How Coaching Works
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              See the exact process that's helped 500+ women transform their bodies and mindset.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={0.1} className="max-w-5xl mx-auto">
            <div
              className="rounded-2xl overflow-hidden shadow-elevated border border-border"
              dangerouslySetInnerHTML={{
                __html: `<style>wistia-player[media-id='kehcvz66po']:not(:defined){background:center/contain no-repeat url('https://fast.wistia.com/embed/medias/kehcvz66po/swatch');display:block;filter:blur(5px);padding-top:56.25%}</style><wistia-player media-id="kehcvz66po" aspect="1.7777777777777777"></wistia-player>`
              }}
            />
          </AnimatedSection>
          <AnimatedSection delay={0.2} className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Find out if you qualify for personalized coaching — it only takes 2 minutes.
            </p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex justify-center">
              <Button
                size="lg"
                onClick={() => setQuestionnaireOpen(true)}
                className="rounded-full px-8 h-14 text-base font-medium"
              >
                Start Your Transformation Questionnaire
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* Celebrity Endorsement */}
      <CelebrityTestimonial />

      {/* What's Included — Features */}
      <section id="features" className="py-20 md:py-28">
        <div className="container mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              What You Get with Coaching
            </h2>
            <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
              No guesswork. Just expert-designed programs that help you build strength, confidence, and lasting results.
            </p>
          </AnimatedSection>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Meet Your Coach — Full-width split like reference */}
      <section id="about" className="min-h-[80vh] relative">
        <div className="grid md:grid-cols-2 min-h-[80vh]">
          {/* Left — Text on beige bg */}
          <div className="bg-secondary flex items-center">
            <AnimatedSection className="px-8 md:px-16 lg:px-24 py-20">
              <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
                Meet Your Coach
              </p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-2">
                Étila Santiago
              </h2>
              <p className="text-2xl md:text-3xl font-light text-muted-foreground italic mb-8">
                IFBB Pro Athlete
              </p>
              <div className="space-y-4 text-muted-foreground leading-relaxed text-base">
                <p>
                  For Étila, fitness isn't just about looking good — it's about feeling unstoppable. What started as her personal journey to build strength and confidence turned into a passion for helping women everywhere do the same.
                </p>
                <p>
                  With a 3rd place finish at the Bikini Olympia and four IFBB Pro wins, she brings elite-level knowledge to every client. Her approach is realistic, disciplined, and built for long-term results.
                </p>
                <p>
                  Whether you're just starting or leveling up, she's here to help you every step of the way.
                </p>
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-8">
                <Button
                  size="lg"
                  onClick={() => setQuestionnaireOpen(true)}
                  className="rounded-full px-8 h-12 font-medium"
                >
                  I'm Ready!
                </Button>
              </motion.div>
            </AnimatedSection>
          </div>
          {/* Right — Edge-to-edge photo */}
          <div className="relative min-h-[400px] md:min-h-0">
            <img
              src={etilaCoach2}
              alt="Coach Étila Santiago"
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
          </div>
        </div>
      </section>

      {/* Before & After Section — Results */}
      <BeforeAfterSection onStartQuestionnaire={() => setQuestionnaireOpen(true)} />

      {/* Objection Handling FAQ */}
      <ObjectionSection />

      {/* Final Emotional CTA */}
      <FinalCtaSection onStartQuestionnaire={() => setQuestionnaireOpen(true)} />

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="py-10 border-t border-border bg-card"
      >
        <div className="container mx-auto px-6">
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>© {new Date().getFullYear()} Étila Fitness. All rights reserved.</p>
            <div className="flex items-center justify-center gap-3">
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <span>·</span>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </motion.footer>

      {/* Questionnaire Dialog */}
      <QuestionnaireDialog
        open={questionnaireOpen}
        onOpenChange={setQuestionnaireOpen}
        existingLeadId={capturedLeadId}
      />
    </div>
  );
}
