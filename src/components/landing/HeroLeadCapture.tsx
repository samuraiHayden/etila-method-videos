import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface Props {
  onStartQuestionnaire: () => void;
}

export function HeroLeadCapture({ onStartQuestionnaire }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.6 }}
      className="flex justify-start"
    >
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          size="lg"
          onClick={onStartQuestionnaire}
          className="text-base px-8 h-14 rounded-full bg-card text-foreground hover:bg-card/90 shadow-elevated font-medium"
        >
          Start Your Transformation Questionnaire
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
