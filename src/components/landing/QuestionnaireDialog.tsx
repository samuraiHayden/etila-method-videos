import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight, ArrowLeft, CheckCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

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
];

function getQualificationResult(answers: Record<string, string>): "coaching" | "course" {
  let coachingScore = 0;
  if (answers.budget_range === "500_plus") coachingScore += 3;
  if (answers.budget_range === "300_500") coachingScore += 2;
  if (answers.fitness_goal === "compete") coachingScore += 2;
  if (answers.experience_level === "advanced" || answers.experience_level === "elite") coachingScore += 1;
  if (answers.training_frequency === "6_7") coachingScore += 1;
  return coachingScore >= 4 ? "coaching" : "course";
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If a lead was already captured (e.g. from LeadCaptureSection), pass the ID */
  existingLeadId?: string | null;
}

export function QuestionnaireDialog({ open, onOpenChange, existingLeadId }: Props) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contactInfo, setContactInfo] = useState({ firstName: "", email: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedLeadId, setSavedLeadId] = useState<string | null>(existingLeadId || null);

  const totalSteps = questions.length + 1;
  const displayStep = currentStep + 1;
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

  // Save lead immediately when contact info is submitted
  const saveLeadEarly = async () => {
    try {
      const leadPayload = {
        full_name: contactInfo.firstName.trim(),
        email: contactInfo.email.trim().toLowerCase(),
        phone_number: contactInfo.phone.trim(),
        status: "incomplete_application",
      };

      if (savedLeadId) {
        await supabase.from("leads").update(leadPayload).eq("id", savedLeadId);
      } else {
        const { data, error } = await supabase
          .from("leads")
          .insert(leadPayload)
          .select("id")
          .single();
        if (error) throw error;
        setSavedLeadId(data.id);
      }
    } catch (err) {
      console.error("Error saving lead early:", err);
      // Don't block the user — continue even if early save fails
    }
  };

  const handleNext = async () => {
    if (isContactStep) {
      if (!isContactValid()) {
        toast.error("Please fill in all contact fields correctly.");
        return;
      }
      // Save lead immediately so we never lose contact info
      await saveLeadEarly();
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
      let leadId = savedLeadId;

      const leadPayload = {
        full_name: contactInfo.firstName.trim(),
        email: contactInfo.email.trim().toLowerCase(),
        phone_number: contactInfo.phone.trim(),
        status: "new",
      };

      if (leadId) {
        await supabase.from("leads").update(leadPayload).eq("id", leadId);
      } else {
        const { data: leadData, error: leadError } = await supabase
          .from("leads")
          .insert(leadPayload)
          .select("id")
          .single();
        if (leadError) throw leadError;
        leadId = leadData.id;
        setSavedLeadId(leadId);
      }

      const { error } = await supabase.from("lead_questionnaire_responses").insert({
        lead_id: leadId,
        gender: answers.gender || "other",
        fitness_goal: answers.fitness_goal,
        experience_level: answers.experience_level,
        training_frequency: answers.training_frequency,
        budget_range: answers.budget_range,
        coaching_preference: "not_specified",
        qualification_result: qualificationResult,
      });

      if (error) throw error;

      onOpenChange(false);

      if (qualificationResult === "coaching") {
        // Schedule no-book nurture sequence (will auto-cancel if they book)
        try {
          await supabase.functions.invoke("schedule-precall-emails", {
            body: {
              lead_email: contactInfo.email.trim().toLowerCase(),
              sequence_type: "no_book",
            },
          });
        } catch (err) {
          console.error("Failed to schedule no-book emails:", err);
        }

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

  // Reset state when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setCurrentStep(-1);
      setAnswers({});
      setContactInfo({ firstName: "", email: "", phone: "" });
      setSavedLeadId(existingLeadId || null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <VisuallyHidden>
          <DialogTitle>Qualification Questionnaire</DialogTitle>
        </VisuallyHidden>

        {/* Progress bar */}
        <div className="w-full bg-muted h-1.5">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        <div className="px-6 py-8 md:px-10 md:py-10">
          <p className="text-sm text-muted-foreground text-center mb-2">
            Step {displayStep + 1} of {totalSteps}
          </p>

          <AnimatePresence mode="wait">
            {isContactStep ? (
              <motion.div
                key="contact"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl md:text-2xl font-light tracking-tight mb-2">
                    Let's get to know you
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    We'll use this info to personalize your experience.
                  </p>
                </div>

                <div className="space-y-4 max-w-sm mx-auto">
                  <div>
                    <Label htmlFor="q-firstName">First Name</Label>
                    <Input
                      id="q-firstName"
                      placeholder="Your first name"
                      value={contactInfo.firstName}
                      onChange={(e) => setContactInfo({ ...contactInfo, firstName: e.target.value })}
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label htmlFor="q-email">Email</Label>
                    <Input
                      id="q-email"
                      type="email"
                      placeholder="you@example.com"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                      maxLength={255}
                    />
                  </div>
                  <div>
                    <Label htmlFor="q-phone">Phone Number</Label>
                    <Input
                      id="q-phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
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
                <div className="text-center mb-6">
                  <h2 className="text-xl md:text-2xl font-light tracking-tight mb-2">
                    {currentQuestion.title}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {currentQuestion.subtitle}
                  </p>
                </div>

                <div className="space-y-2.5">
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
                          <CardContent className="p-3.5 flex items-center gap-3">
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

          <div className="flex items-center justify-between mt-8">
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
      </DialogContent>
    </Dialog>
  );
}
