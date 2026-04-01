import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import etilaLogo from "@/assets/etila-logo-primary.png";

const FANBASIS_URL = "https://www.fanbasis.com/agency-checkout/etilamethod/l76QV";

export default function Checkout() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Redirect immediately to Fanbasis checkout
    window.location.href = FANBASIS_URL;
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
      <img src={etilaLogo} alt="The Étila Method" className="w-14 h-14 rounded-full object-cover" />
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Redirecting to secure checkout…</p>
    </div>
  );
}
