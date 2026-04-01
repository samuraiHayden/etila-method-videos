import { motion } from "framer-motion";
import { AnimatedSection } from "./AnimatedSection";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import transformation1 from "@/assets/transformation-1.jpg";
import transformation2 from "@/assets/transformation-2.jpg";
import transformation3 from "@/assets/transformation-3.jpg";

const transformations = [
  { name: "Body Toning", duration: "12 weeks", caption: "Complete body toning transformation", image: transformation1 },
  { name: "Competition Prep", duration: "16 weeks", caption: "Stage-ready body recomposition", image: transformation2 },
  { name: "Lean Bulk", duration: "20 weeks", caption: "Clean muscle gain transformation", image: transformation3 },
];

interface Props {
  onStartQuestionnaire?: () => void;
}

export function BeforeAfterSection({ onStartQuestionnaire }: Props) {
  return (
    <section id="results" className="py-20 md:py-28">
      <div className="container mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            Client Transformations
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
            Real results from real women who committed to the process.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {transformations.map((item, index) => (
            <AnimatedSection key={index} delay={index * 0.1}>
              <div className="bg-card rounded-2xl overflow-hidden border border-border">
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={item.image}
                    alt={`${item.name} transformation`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-baseline justify-between mb-1">
                    <p className="font-bold text-sm text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.duration}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.caption}</p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {onStartQuestionnaire && (
          <AnimatedSection delay={0.3} className="mt-12 text-center">
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
