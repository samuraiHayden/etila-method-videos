import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import etilaLogo from "@/assets/etila-logo-primary.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SignupPage = () => {
  const [searchParams] = useSearchParams();
  const gender = searchParams.get("gender") || "other";
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(searchParams.get("name") || "");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [consentTos, setConsentTos] = useState(false);
  const [consentLiability, setConsentLiability] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, user, isAdmin, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!consentTos || !consentLiability) {
      toast({
        title: "Consent required",
        description: "You must agree to both checkboxes to create an account.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Log consent with email, IP, and timestamp
    try {
      // Get IP address
      let ipAddress: string | null = null;
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        ipAddress = ipData.ip;
      } catch {
        // IP fetch failed, proceed without it
      }

      await supabase.from("consent_logs").insert({
        email,
        ip_address: ipAddress,
        consented_tos: consentTos,
        consented_liability: consentLiability,
      });
    } catch (err) {
      console.error("Consent log failed:", err);
    }

    const { error } = await signUp(email, password, fullName);
    setIsLoading(false);

    if (error) {
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Auto-assign default workout program based on gender
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        if (userId) {
          await supabase.functions.invoke("assign-default-program", {
            body: { user_id: userId, gender },
          });
        }
      } catch (err) {
        console.error("Auto-assign program failed:", err);
      }

      // If this signup came from the payment/course offer flow, mark lead as paid in CRM
      const cameFromPayment = searchParams.get("paid") === "1" || searchParams.get("name");
      if (email && cameFromPayment) {
        try {
          await supabase.rpc("mark_lead_paid", {
            p_email: email.trim().toLowerCase(),
            p_full_name: fullName.trim() || null,
            p_purchase_type: "low_ticket",
          });
        } catch (err) {
          console.error("Failed to mark lead paid:", err);
        }
      }
      toast({
        title: "Account created!",
        description: "Welcome to The Étila Method. Check your email to verify your account.",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="bg-gradient-hero text-foreground px-6 pt-14 pb-12 text-center">
        <div className="flex items-center justify-center mb-4">
          <img src={etilaLogo} alt="The Étila Method" className="h-14 object-contain" />
        </div>
        <h1 className="text-3xl font-bold text-center">Create Your Account</h1>
        <p className="text-muted-foreground mt-2 text-center">
          Get instant access to The Étila Method platform
        </p>
      </div>

      <div className="flex-1 px-6 py-8 -mt-4 bg-background rounded-t-3xl">
        <div className="max-w-sm mx-auto">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Consent Checkboxes */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent-tos"
                  checked={consentTos}
                  onCheckedChange={(checked) => setConsentTos(checked === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="consent-tos" className="text-sm text-muted-foreground leading-snug font-normal cursor-pointer">
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary underline hover:text-primary/80" target="_blank">Terms of Service</Link>
                  {" "}and{" "}
                  <Link to="/privacy" className="text-primary underline hover:text-primary/80" target="_blank">Privacy Policy</Link>
                </Label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent-liability"
                  checked={consentLiability}
                  onCheckedChange={(checked) => setConsentLiability(checked === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="consent-liability" className="text-sm text-muted-foreground leading-snug font-normal cursor-pointer">
                  I understand that exercise involves risks and I accept the{" "}
                  <Link to="/liability-waiver" className="text-primary underline hover:text-primary/80" target="_blank">Liability Waiver</Link>
                  {" "}and{" "}
                  <Link to="/medical-disclaimer" className="text-primary underline hover:text-primary/80" target="_blank">Medical Disclaimer</Link>
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 text-base font-semibold rounded-xl"
              disabled={isLoading || !consentTos || !consentLiability}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <button onClick={() => navigate("/login")} className="text-primary hover:underline font-medium">
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
