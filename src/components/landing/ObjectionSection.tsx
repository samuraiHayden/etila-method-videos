import { motion } from "framer-motion";
import { AnimatedSection } from "./AnimatedSection";
import { Shield, Clock, DollarSign, UtensilsCrossed, RefreshCw } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const objections = [
  {
    icon: RefreshCw,
    question: "\"I've tried coaching before and it didn't work.\"",
    answer: "Most coaching programs are cookie-cutter. They hand you a template and check in once a month. My approach is completely different — every program is built from scratch for you, and I'm adjusting it constantly based on your feedback, your body, and your life.",
  },
  {
    icon: UtensilsCrossed,
    question: "\"I can't stick to a diet — I always fail.\"",
    answer: "That's because most diets are designed to fail. They're restrictive, unsustainable, and make you feel guilty. I build your nutrition around the foods you already enjoy, your lifestyle, and your body's needs.",
  },
  {
    icon: DollarSign,
    question: "\"It's too expensive — I can't justify the cost.\"",
    answer: "Think about what you've already spent on supplements that collect dust, gym memberships you don't use, and programs you never finished. This is an investment in actually getting results — with someone in your corner every step of the way.",
  },
  {
    icon: Clock,
    question: "\"I'll start when things calm down.\"",
    answer: "Things never calm down. There's always a vacation, a deadline, a holiday. The clients who get the best results start messy and build from there. I design your program around your real life.",
  },
  {
    icon: Shield,
    question: "\"I'm too busy — I don't have time to work out.\"",
    answer: "You don't need 2 hours a day. Most of my clients train 3–4 times per week for 45–60 minutes. I design your program around your real schedule — including travel, kids, work deadlines, all of it.",
  },
];

const truthBombs = [
  {
    stat: "92%",
    text: "of people who start a fitness program quit within 3 months without accountability.",
  },
  {
    stat: "$1,200+",
    text: "wasted yearly on unused gym memberships and supplements that don't work.",
  },
  {
    stat: "10x",
    text: "more likely to reach your goals with a coach than going it alone.",
  },
];

export function ObjectionSection() {
  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="container mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight max-w-2xl mx-auto text-foreground">
            Let's Talk About What's Really Holding You Back
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            These are the exact things I hear from people who almost didn't start — and now wish they'd started sooner.
          </p>
        </AnimatedSection>

        {/* Truth Bombs */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
          {truthBombs.map((bomb, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.15, duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
              viewport={{ once: true }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-card border border-border rounded-2xl p-6 text-center"
            >
              <motion.p
                initial={{ scale: 0.8 }}
                whileInView={{ scale: 1 }}
                transition={{ delay: 0.2 + index * 0.15, type: "spring", stiffness: 200 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold text-primary mb-2"
              >
                {bomb.stat}
              </motion.p>
              <p className="text-sm text-muted-foreground leading-relaxed">{bomb.text}</p>
            </motion.div>
          ))}
        </div>

        {/* Accordion */}
        <AnimatedSection delay={0.1} className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {objections.map((obj, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="bg-card rounded-2xl border border-border px-6"
                >
                  <AccordionTrigger className="text-left text-sm md:text-base font-bold text-foreground py-5 hover:no-underline gap-3">
                    <span className="flex items-center gap-3">
                      <obj.icon className="h-4 w-4 text-primary shrink-0" />
                      {obj.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5 pl-7">
                    {obj.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </AnimatedSection>

        {/* Bottom reinforcement */}
        <AnimatedSection delay={0.3} className="mt-16 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-primary/5 border border-primary/15 rounded-2xl p-8 max-w-2xl mx-auto"
          >
            <p className="text-lg md:text-xl font-bold text-foreground mb-3">
              "Every week you wait is a week of results you'll never get back."
            </p>
            <p className="text-sm text-muted-foreground">
              Your future self will thank you for starting today.
            </p>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  );
}
