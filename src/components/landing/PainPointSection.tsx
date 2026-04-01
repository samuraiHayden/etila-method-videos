import { motion } from "framer-motion";
import { AnimatedSection } from "./AnimatedSection";
import { X, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const painPoints = [
  "You've tried coaching or programs before — and none of them stuck",
  "You're convinced you don't have time to work out consistently",
  "You're tired of restrictive diets that leave you miserable",
  "You keep telling yourself you'll start \"when things calm down\"",
  "You've spent hundreds on supplements, apps, and plans that didn't work",
  "You feel like you're doing everything right but your body won't change",
];

const shifts = [
  "A coach who adapts your plan when life gets messy",
  "Workouts designed around YOUR schedule — even if it's only 3 hours a week",
  "Eating in a way that fuels you and doesn't feel like punishment",
  "Starting now, imperfectly, instead of waiting for the \"perfect\" moment",
  "One investment that actually delivers measurable, lasting results",
  "Finally seeing progress because your plan is built for your body",
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -15 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const itemVariantsRight = {
  hidden: { opacity: 0, x: 15 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

interface Props {
  onStartQuestionnaire?: () => void;
}

export function PainPointSection({ onStartQuestionnaire }: Props) {
  return (
    <section className="py-20 md:py-28 bg-card">
      <div className="container mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight max-w-2xl mx-auto text-foreground">
            These Are the Stories You Keep Telling Yourself
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            "I don't have time." "It's too expensive." "I'll start Monday." Sound familiar? Here's how we flip every single one.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <AnimatedSection delay={0.1}>
            <div className="bg-background rounded-2xl p-8 border border-border h-full">
              <p className="text-sm uppercase tracking-widest text-destructive/80 mb-6 font-bold">
                The excuses keeping you stuck
              </p>
              <motion.ul
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-4"
              >
                {painPoints.map((point, i) => (
                  <motion.li key={i} variants={itemVariants} className="flex items-start gap-3">
                    <X className="h-4 w-4 text-destructive/60 mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground leading-relaxed">{point}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="bg-primary/5 border border-primary/15 rounded-2xl p-8 h-full">
              <p className="text-sm uppercase tracking-widest text-primary mb-6 font-bold">
                The reality with the right coach
              </p>
              <motion.ul
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-4"
              >
                {shifts.map((point, i) => (
                  <motion.li key={i} variants={itemVariantsRight} className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground leading-relaxed">{point}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </AnimatedSection>
        </div>

        <AnimatedSection delay={0.3} className="mt-12">
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed italic mb-4">
              "Every client I've ever coached started with at least one of these excuses. Every single one of them is glad they started anyway."
            </p>
            <p className="text-sm text-foreground font-bold">— Étila</p>
          </motion.div>
        </AnimatedSection>

        {onStartQuestionnaire && (
          <AnimatedSection delay={0.4} className="mt-10 text-center">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button size="lg" onClick={onStartQuestionnaire} className="text-sm px-8 h-12 rounded-full font-medium">
                Start Your Transformation Questionnaire
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </AnimatedSection>
        )}
      </div>
    </section>
  );
}
