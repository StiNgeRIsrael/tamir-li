import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale, localePath } from "@/lib/i18n";
import { Loader2 } from "lucide-react";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading, apiAvailable } = useAuth();
  const { locale, t } = useLocale();
  const admin = t.admin as Record<string, string> | undefined;

  if (!apiAvailable) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-muted-foreground max-w-md">{admin?.needApi ?? "API URL is not configured."}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={localePath("/", locale)} replace />;
  }

  if (!user.roles?.includes("ADMIN")) {
    return <Navigate to={localePath("/", locale)} replace />;
  }

  return <>{children}</>;
}
