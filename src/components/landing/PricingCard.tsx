import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PricingCardProps {
  title: string;
  subtitle: string;
  price: string;
  priceLabel?: string;
  priceNote: string;
  features: string[];
  isPrimary?: boolean;
  ctaText: string;
  footnote?: string;
}

export function PricingCard({
  title,
  subtitle,
  price,
  priceLabel,
  priceNote,
  features,
  isPrimary = false,
  ctaText,
  footnote,
}: PricingCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 20px 40px -20px hsla(30, 20%, 20%, 0.15)" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`relative bg-background rounded-sm p-8 ${
        isPrimary ? "border-2 border-primary" : "border border-border"
      }`}
    >
      {isPrimary && (
        <div className="absolute -top-3 left-8">
          <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-sm uppercase tracking-wider">
            Recommended
          </span>
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-xl font-medium mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className={`font-light ${priceLabel ? 'text-4xl' : 'text-2xl'}`}>{price}</span>
          {priceLabel && <span className="text-muted-foreground">{priceLabel}</span>}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{priceNote}</p>
      </div>
      
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            viewport={{ once: true }}
            className="flex items-start gap-3"
          >
            <CheckCircle2
              className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                isPrimary ? "text-primary" : "text-muted-foreground"
              }`}
            />
            <span className="text-sm">{feature}</span>
          </motion.li>
        ))}
      </ul>
      
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          size="lg"
          variant={isPrimary ? "default" : "outline"}
          className="w-full py-6 rounded-sm"
          onClick={() => navigate("/login")}
        >
          {ctaText}
          {isPrimary && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </motion.div>
      
      {footnote && (
        <p className="text-xs text-center text-muted-foreground mt-4">{footnote}</p>
      )}
    </motion.div>
  );
}
