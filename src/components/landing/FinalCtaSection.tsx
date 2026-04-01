import { motion } from "framer-motion";
import { AnimatedSection } from "./AnimatedSection";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Heart } from "lucide-react";

interface Props {
  onStartQuestionnaire: () => void;
}

export function FinalCtaSection({ onStartQuestionnaire }: Props) {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-primary">
      <div className="relative container mx-auto px-6">
        <AnimatedSection className="max-w-2xl mx-auto text-center">
          <Heart className="h-8 w-8 text-primary-foreground/40 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-light tracking-tight text-primary-foreground mb-4">
            You Deserve to Feel <span className="font-medium">Strong</span>
          </h2>
          <p className="text-primary-foreground/80 leading-relaxed mb-3 text-sm md:text-base">
            Not "someday." Not "when things calm down." Right now.
            The version of you that feels confident, energized, and proud of what she sees
            in the mirror — she's not far away. She just needs the right support.
          </p>
          <p className="text-primary-foreground/60 text-sm mb-8">
            Take the 2-minute questionnaire and find out if you qualify for personalized coaching.
          </p>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex justify-center">
            <Button
              size="lg"
              onClick={onStartQuestionnaire}
              className="text-base px-8 h-14 rounded-full bg-card text-foreground hover:bg-card/90 shadow-elevated font-medium"
            >
              Start Your Transformation Questionnaire
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  );
}
