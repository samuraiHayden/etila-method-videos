import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Question {
  key: string;
  title: string;
  subtitle: string;
  options: { value: string; label: string; description: string }[];
}

const questions: Question[] = [
  {
    key: "gender",
    title: "How do you identify?",
    subtitle: "This helps us tailor your training program.",
    options: [
      { value: "male", label: "Male", description: "Male training program" },
      { value: "female", label: "Female", description: "Female training program" },
      { value: "other", label: "Other / Prefer not to say", description: "We'll customize based on your goals" },
    ],
  },
  {
    key: "fitness_goal",
    title: "What's your primary fitness goal?",
    subtitle: "This helps us understand what you're working toward.",
    options: [
      { value: "lose_fat", label: "Lose Fat", description: "Drop body fat while maintaining muscle" },
      { value: "build_muscle", label: "Build Muscle", description: "Gain lean muscle mass and strength" },
      { value: "body_recomp", label: "Body Recomposition", description: "Lose fat and build muscle simultaneously" },
      { value: "compete", label: "Compete", description: "Prepare for a bodybuilding or physique competition" },
    ],
  },
  {
    key: "experience_level",
    title: "What's your training experience?",
    subtitle: "Be honest — this helps us match you with the right approach.",
    options: [
      { value: "beginner", label: "Beginner", description: "Less than 1 year of consistent training" },
      { value: "intermediate", label: "Intermediate", description: "1–3 years of structured training" },
      { value: "advanced", label: "Advanced", description: "3+ years with solid knowledge of form and programming" },
      { value: "elite", label: "Elite / Competitor", description: "Competitive athlete or very experienced lifter" },
    ],
  },
  {
    key: "training_frequency",
    title: "How often can you train per week?",
    subtitle: "We'll build a plan that fits your schedule.",
    options: [
      { value: "2_3", label: "2–3 days", description: "Limited schedule, need maximum efficiency" },
      { value: "4_5", label: "4–5 days", description: "Good availability for a solid program" },
      { value: "6_7", label: "6–7 days", description: "Fully committed, ready to go all in" },
    ],
  },
  {
    key: "budget_range",
    title: "What's your investment comfort level?",
    subtitle: "This helps us recommend the right program for you.",
    options: [
      { value: "under_300", label: "Under $300", description: "Looking for an affordable self-paced option" },
      { value: "300_500", label: "$300 – $500 / month", description: "Open to investing in guided coaching" },
      { value: "500_plus", label: "$500+ / month", description: "Ready for premium, fully personalized coaching" },
    ],
  },
  {
    key: "coaching_preference",
    title: "What type of support are you looking for?",
    subtitle: "Choose the style that matches your needs.",
    options: [
      { value: "self_paced", label: "Self-Paced Learning", description: "I want to learn and apply things on my own" },
      { value: "some_guidance", label: "Some Guidance", description: "I'd like structure with occasional check-ins" },
      { value: "full_coaching", label: "Full 1-on-1 Coaching", description: "I want direct, personalized coaching from Étila" },
    ],
  },
];

function getQualificationResult(answers: Record<string, string>): "coaching" | "course" {
  let coachingScore = 0;

  if (answers.budget_range === "500_plus") coachingScore += 3;
  if (answers.budget_range === "300_500") coachingScore += 2;
  if (answers.coaching_preference === "full_coaching") coachingScore += 3;
  if (answers.coaching_preference === "some_guidance") coachingScore += 1;
  if (answers.fitness_goal === "compete") coachingScore += 2;
  if (answers.experience_level === "advanced" || answers.experience_level === "elite") coachingScore += 1;
  if (answers.training_frequency === "6_7") coachingScore += 1;

  return coachingScore >= 5 ? "coaching" : "course";
}

export default function Questionnaire() {
  const navigate = useNavigate();
  // Step -1 = contact info, steps 0..4 = quiz questions
  const [currentStep, setCurrentStep] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contactInfo, setContactInfo] = useState({ firstName: "", email: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const existingLeadId = searchParams.get("lead");

  const totalSteps = questions.length + 1; // +1 for contact info
  const displayStep = currentStep + 1; // 0-indexed display (contact=0, q1=1, etc.)
  const progress = ((displayStep + 1) / totalSteps) * 100;

  const isContactStep = currentStep === -1;
  const currentQuestion = !isContactStep ? questions[currentStep] : null;
  const isLastQuestion = currentStep === questions.length - 1;

  const handleSelect = (value: string) => {
    if (currentQuestion) {
      setAnswers((prev) => ({ ...prev, [currentQuestion.key]: value }));
    }
  };

  const isContactValid = () => {
    return (
      contactInfo.firstName.trim().length > 0 &&
      contactInfo.email.trim().length > 0 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email.trim()) &&
      contactInfo.phone.trim().length >= 7
    );
  };

  const handleNext = async () => {
    if (isContactStep) {
      if (!isContactValid()) {
        toast.error("Please fill in all contact fields correctly.");
        return;
      }
      setCurrentStep(0);
      return;
    }

    if (currentQuestion && !answers[currentQuestion.key]) {
      toast.error("Please select an option to continue.");
      return;
    }

    if (isLastQuestion) {
      await handleSubmit();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const qualificationResult = getQualificationResult(answers);

    try {
      let leadId = existingLeadId;

      if (!leadId) {
        const { data: newLeadId, error: leadError } = await supabase.rpc("submit_lead", {
          p_full_name: contactInfo.firstName.trim(),
          p_email: contactInfo.email.trim().toLowerCase(),
          p_phone_number: contactInfo.phone.trim(),
        });

        if (leadError) throw leadError;
        leadId = newLeadId;
      } else {
        // Update existing lead with contact info (authenticated update via RPC or direct)
        await supabase
          .from("leads")
          .update({
            full_name: contactInfo.firstName.trim(),
            email: contactInfo.email.trim().toLowerCase(),
            phone_number: contactInfo.phone.trim(),
          })
          .eq("id", leadId);
      }

      const { error } = await supabase.rpc("submit_questionnaire_response", {
        p_lead_id: leadId,
        p_gender: answers.gender || "other",
        p_fitness_goal: answers.fitness_goal,
        p_experience_level: answers.experience_level,
        p_training_frequency: answers.training_frequency,
        p_budget_range: answers.budget_range,
        p_coaching_preference: answers.coaching_preference,
        p_qualification_result: qualificationResult,
      });

      if (error) throw error;

      if (qualificationResult === "coaching") {
        const params = new URLSearchParams({
          name: contactInfo.firstName.trim(),
          email: contactInfo.email.trim().toLowerCase(),
          phone: contactInfo.phone.trim(),
        });
        navigate(`/book-call?${params.toString()}`);
      } else {
        const params = new URLSearchParams({
          name: contactInfo.firstName.trim(),
          email: contactInfo.email.trim().toLowerCase(),
          gender: answers.gender || "other",
        });
        navigate(`/course-offer?${params.toString()}`);
      }
    } catch (error: any) {
      console.error("Questionnaire submission error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="w-full bg-muted h-1.5">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <motion.p
            key={`step-${currentStep}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground text-center mb-2"
          >
            Step {displayStep + 1} of {totalSteps}
          </motion.p>

          <AnimatePresence mode="wait">
            {isContactStep ? (
              <motion.div
                key="contact"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-2xl md:text-3xl font-light tracking-tight mb-2">
                    Let's get to know you
                  </h1>
                  <p className="text-muted-foreground">
                    We'll use this info to personalize your experience.
                  </p>
                </div>

                <div className="space-y-4 max-w-md mx-auto">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="Your first name"
                      value={contactInfo.firstName}
                      onChange={(e) =>
                        setContactInfo({ ...contactInfo, firstName: e.target.value })
                      }
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={contactInfo.email}
                      onChange={(e) =>
                        setContactInfo({ ...contactInfo, email: e.target.value })
                      }
                      maxLength={255}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={contactInfo.phone}
                      onChange={(e) =>
                        setContactInfo({ ...contactInfo, phone: e.target.value })
                      }
                      maxLength={20}
                    />
                  </div>
                </div>
              </motion.div>
            ) : currentQuestion ? (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-2xl md:text-3xl font-light tracking-tight mb-2">
                    {currentQuestion.title}
                  </h1>
                  <p className="text-muted-foreground">
                    {currentQuestion.subtitle}
                  </p>
                </div>

                <div className="space-y-3">
                  {currentQuestion.options.map((option) => {
                    const isSelected = answers[currentQuestion.key] === option.value;
                    return (
                      <motion.div
                        key={option.value}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <Card
                          className={`cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "hover:border-primary/40"
                          }`}
                          onClick={() => handleSelect(option.value)}
                        >
                          <CardContent className="p-4 flex items-center gap-4">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                isSelected
                                  ? "border-primary bg-primary"
                                  : "border-muted-foreground/30"
                              }`}
                            >
                              {isSelected && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{option.label}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {option.description}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-10">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === -1}
              className="text-muted-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleNext}
                disabled={
                  isContactStep
                    ? !isContactValid()
                    : (!currentQuestion || !answers[currentQuestion.key] || isSubmitting)
                }
                className="rounded-sm px-8"
              >
                {isSubmitting
                  ? "Submitting..."
                  : isLastQuestion
                  ? "See My Recommendation"
                  : "Continue"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
