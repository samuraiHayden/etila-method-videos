import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import etilaLogoPrimary from "@/assets/etila-logo-primary.png";

export function Header() {
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-4 left-4 right-4 z-50"
    >
      <div className="max-w-6xl mx-auto bg-card/95 backdrop-blur-md rounded-full border border-border shadow-card px-6 py-3 flex items-center justify-between">
        {/* Left: Logo */}
        <motion.a
          href="/"
          className="flex items-center gap-2"
          whileHover={{ opacity: 0.7 }}
          transition={{ duration: 0.2 }}
        >
          <img
            src={etilaLogoPrimary}
            alt="The Étila Method"
            className="h-12 object-contain"
          />
        </motion.a>

        {/* Center-right: Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: "About", id: "about" },
            { label: "Program", id: "results" },
            { label: "Results", id: "testimonials" },
            { label: "Join", id: "faq" },
          ].map((link) => (
            <motion.a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(link.id)?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-sm font-medium tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              style={{ fontFamily: '"Montserrat", sans-serif' }}
              whileHover={{ y: -1 }}
              transition={{ duration: 0.2 }}
            >
              {link.label}
            </motion.a>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-sm font-medium tracking-wide"
            onClick={() => navigate("/login")}
          >
            Log in
          </Button>
          <Button
            size="sm"
            className="text-sm font-semibold rounded-full px-6 tracking-wide uppercase"
            onClick={() => navigate("/questionnaire")}
          >
            Get Started
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
