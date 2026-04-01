import { motion } from "framer-motion";
import { AnimatedSection } from "./AnimatedSection";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    quote: "This coaching is literal perfection! There is everything. A place to track your workouts, personalized meal plans, and the constant adjustments based on your progress. I'm obsessed. I literally look forward to training now!",
    name: "Maria S.",
  },
  {
    quote: "You literally feel as if you have a personal trainer with you! Very well organized layout and detailed information about each exercise, accompanied by check-ins and constant adjustments. 100% recommended.",
    name: "Danielle K.",
  },
  {
    quote: "Étila is so caring & helps with anything you need an answer to, the workouts are killer too, so happy to have joined. Definitely worth it!!! 🤍🤍🤍",
    name: "Rachel T.",
  },
  {
    quote: "I was terrified of another restrictive diet. Étila taught me how to eat in a way that fits my life — I still eat out with friends, enjoy my food, and I've lost 20 lbs without feeling deprived.",
    name: "Jessica P.",
  },
];

interface Props {
  onStartQuestionnaire?: () => void;
}

export function TestimonialSection({ onStartQuestionnaire }: Props) {
  return (
    <section id="testimonials" className="py-20 md:py-28">
      <div className="container mx-auto px-6">
        <AnimatedSection className="mb-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
                Stronger. Healthier.<br />
                More Confident.
              </h2>
            </div>
            {onStartQuestionnaire && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" onClick={onStartQuestionnaire} className="rounded-full px-8">
                  Join the Community
                </Button>
              </motion.div>
            )}
          </div>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {testimonials.map((t, index) => (
            <AnimatedSection key={index} delay={index * 0.08}>
              <div className="bg-card rounded-2xl p-6 border border-border h-full flex flex-col">
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  "{t.quote}"
                </p>
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-sm font-bold text-foreground">{t.name}</p>
                  <div className="flex gap-0.5 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
