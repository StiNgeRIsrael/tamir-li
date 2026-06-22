import { Crown, Sparkles, Zap, Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { useSubscription, type CheckoutPlan } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CreditPackage {
  id: string;
  plan: CheckoutPlan;
  amount: number;
  price: number;
  pricePerImage: number;
  popular?: boolean;
  savings?: string;
}

const packages: CreditPackage[] = [
  { id: "small", plan: "credits_10", amount: 10, price: 8, pricePerImage: 0.80 },
  { id: "medium", plan: "credits_30", amount: 30, price: 21, pricePerImage: 0.70, popular: true, savings: "12%" },
  { id: "large", plan: "credits_60", amount: 60, price: 39, pricePerImage: 0.65, savings: "19%" },
  { id: "xl", plan: "credits_120", amount: 120, price: 72, pricePerImage: 0.60, savings: "25%" },
];

export function CreditsDisplay({ credits, isPremium }: { credits: number; isPremium: boolean }) {
  const t = useT();
  const p = t.premium;
  const { openPortal, portalLoading } = useSubscription();
  const { user } = useAuth();

  const handleManage = async () => {
    if (!user) {
      toast.error(t.auth?.signInRequired ?? "Sign in first");
      return;
    }
    try {
      await openPortal();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open billing portal");
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-premium/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-premium" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-foreground">{credits}</span>
            <span className="text-sm text-muted-foreground">{p.credits}</span>
          </div>
          {isPremium && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Crown className="w-3 h-3 text-premium" />{p.premiumSub}
            </p>
          )}
        </div>
      </div>
      {isPremium ? (
        <Button
          variant="outline"
          size="sm"
          className="font-medium border-premium/30 text-premium hover:bg-premium/5"
          onClick={handleManage}
          disabled={portalLoading}
        >
          <Package className="w-3.5 h-3.5 me-1" />{p.manageBilling ?? p.buyCredits}
        </Button>
      ) : (
        <Button variant="outline" size="sm" className="font-medium border-premium/30 text-premium hover:bg-premium/5">
          <Package className="w-3.5 h-3.5 me-1" />{p.buyCredits}
        </Button>
      )}
    </div>
  );
}

export function CreditPackages({ onClose }: { onClose?: () => void }) {
  const t = useT();
  const p = t.premium;
  const { checkout, checkoutLoading } = useSubscription();
  const { user } = useAuth();

  const purchase = async (plan: CheckoutPlan) => {
    if (!user) {
      toast.error(t.auth?.signInRequired ?? "Sign in to purchase credits");
      return;
    }
    try {
      await checkout(plan);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg text-foreground">{p.creditPackages}</h3>
          <p className="text-xs text-muted-foreground">{p.creditPerImage}</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X className="w-4 h-4" /></Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {packages.map((pkg) => (
          <div key={pkg.id} className={`relative border rounded-xl p-4 space-y-3 transition-all hover:shadow-md ${pkg.popular ? "border-premium bg-premium/5 shadow-sm" : "border-border bg-card"}`}>
            {pkg.popular && (
              <div className="absolute -top-2.5 end-3 bg-premium text-premium-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full">{p.mostPopular}</div>
            )}
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-foreground">{pkg.amount}</span>
                <span className="text-sm text-muted-foreground">{p.images}</span>
              </div>
              {pkg.savings && (
                <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">{p.saving(pkg.savings)}</span>
              )}
            </div>
            <div className="space-y-1">
              <span className="text-xl font-extrabold text-foreground">₪{pkg.price}</span>
              <p className="text-xs text-muted-foreground">{p.perImage(`₪${pkg.pricePerImage.toFixed(2)}`)}</p>
            </div>
            <Button
              className={`w-full font-bold ${pkg.popular ? "bg-premium text-premium-foreground hover:bg-premium/90" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
              size="sm"
              onClick={() => purchase(pkg.plan)}
              disabled={checkoutLoading}
            >
              <Zap className="w-3.5 h-3.5 me-1" />{p.purchasePackage}
            </Button>
          </div>
        ))}
      </div>
      <div className="bg-muted/50 rounded-lg p-3 text-center space-y-1">
        <p className="text-xs text-muted-foreground">
          <Crown className="w-3 h-3 inline me-1 text-premium" />{p.premiumNote(p.price)}
        </p>
      </div>
    </div>
  );
}
