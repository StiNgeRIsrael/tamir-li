import { Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PremiumBanner() {
  return (
    <div className="premium-banner flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[hsl(var(--premium-foreground)/0.15)] flex items-center justify-center">
          <Crown className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-base">שדרג לפרימיום</h3>
          <p className="text-sm opacity-90">המרות ללא הגבלה, ללא מודעות, ועיבוד מהיר יותר</p>
        </div>
      </div>
      <Button className="bg-[hsl(var(--premium-foreground))] text-[hsl(var(--premium))] hover:bg-[hsl(var(--premium-foreground)/0.9)] font-bold whitespace-nowrap">
        <Zap className="w-4 h-4 ml-1" />
        ₪4.90 / חודש
      </Button>
    </div>
  );
}

export function PremiumLock() {
  return (
    <div className="text-center py-6 px-4 bg-muted/50 rounded-xl border border-border">
      <Crown className="w-10 h-10 text-premium mx-auto mb-3" />
      <h3 className="font-bold text-lg mb-1">כלי פרימיום</h3>
      <p className="text-sm text-muted-foreground mb-4">
        כלי זה זמין למנויי פרימיום בלבד. שדרג כדי ליהנות מכל הכלים ללא הגבלה.
      </p>
      <Button className="bg-premium text-premium-foreground hover:bg-premium/90 font-bold">
        <Zap className="w-4 h-4 ml-1" />
        שדרג עכשיו — ₪4.90/חודש
      </Button>
    </div>
  );
}

export function UsageLimitNotice({ used, max }: { used: number; max: number }) {
  const remaining = max - used;
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">שימוש יומי</span>
        <span className="text-sm text-muted-foreground">נותרו {remaining} המרות להיום</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${Math.min((used / max) * 100, 100)}%` }}
        />
      </div>
      {remaining <= 2 && (
        <p className="text-xs text-accent font-medium">
          <Zap className="w-3 h-3 inline ml-1" />
          כמעט סיימת? שדרג לפרימיום ב-₪4.90/חודש להמרות ללא הגבלה
        </p>
      )}
    </div>
  );
}

export function ConversionSuccessUsage({ used, max }: { used: number; max: number }) {
  const remaining = max - used;
  return (
    <div className="bg-muted/50 border border-border rounded-xl p-4 text-center space-y-2 animate-fade-in">
      <p className="text-sm text-muted-foreground">
        נותרו לך עוד <span className="font-bold text-foreground">{remaining}</span> המרות להיום
      </p>
      {remaining <= 2 ? (
        <Button className="bg-premium text-premium-foreground hover:bg-premium/90 font-bold text-sm">
          <Zap className="w-3.5 h-3.5 ml-1" />
          שדרג עכשיו — ₪4.90/חודש
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">שדרג לפרימיום להמרות ללא הגבלה</p>
      )}
    </div>
  );
}
