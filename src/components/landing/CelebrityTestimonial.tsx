import { motion } from "framer-motion";
import { AnimatedSection } from "./AnimatedSection";
import { Star, Play } from "lucide-react";
import { useState, useRef } from "react";

export function CelebrityTestimonial() {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <section className="py-20 md:py-28 bg-card">
      <div className="container mx-auto px-6">
        <AnimatedSection className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Featured Endorsement
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            Trusted by the Best
          </h2>
        </AnimatedSection>

        <AnimatedSection delay={0.1} className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-5 gap-0 rounded-2xl overflow-hidden border border-border shadow-elevated bg-background">
            {/* Video — takes 3 columns */}
            <div className="md:col-span-3 relative aspect-video md:aspect-auto">
              <video
                ref={videoRef}
                src="/videos/arod-testimonial.mp4"
                className="w-full h-full object-cover"
                playsInline
                controls={isPlaying}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                preload="metadata"
              />
              {!isPlaying && (
                <motion.button
                  onClick={handlePlay}
                  className="absolute inset-0 flex items-center justify-center bg-foreground/20 hover:bg-foreground/30 transition-colors cursor-pointer"
                  whileHover={{ scale: 1.0 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <motion.div
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-card/95 backdrop-blur-sm flex items-center justify-center shadow-elevated"
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Play className="h-7 w-7 md:h-8 md:w-8 text-primary fill-primary ml-1" />
                  </motion.div>
                </motion.button>
              )}
            </div>

            {/* Quote — takes 2 columns */}
            <div className="md:col-span-2 p-8 md:p-10 flex flex-col justify-center">
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <blockquote className="text-base md:text-lg leading-relaxed text-foreground mb-6 font-medium">
                "Étila is the real deal — her knowledge, dedication, and passion for what she does is truly inspiring."
              </blockquote>
              <div>
                <p className="font-bold text-foreground text-lg">Alex Rodriguez</p>
                <p className="text-sm text-muted-foreground">
                  MLB Hall of Famer · 14× All-Star
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
