import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { adminFetch } from "@/lib/admin-api";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

type OnboardingAdminSettings = {
  onboardingOfferGeneration: number;
  onboardingRepromptedAt: string | null;
};

export function AdminOnboardingCard() {
  const { token } = useAuth();
  const { locale, t } = useLocale();
  const admin = t.admin as Record<string, string>;
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-onboarding", token],
    queryFn: async () => {
      const res = await adminFetch<{ settings: OnboardingAdminSettings }>(
        "/api/admin/onboarding",
        token
      );
      return res.settings;
    },
    enabled: !!token,
  });

  const reprompt = useMutation({
    mutationFn: () =>
      adminFetch<{ settings: OnboardingAdminSettings; message: string }>(
        "/api/admin/onboarding/reprompt-all",
        token,
        { method: "POST" }
      ),
    onSuccess: (body) => {
      queryClient.setQueryData(["admin-onboarding", token], body.settings);
      toast.success(admin.onboardingRepromptSuccess ?? "Offer reprompt scheduled for all app users.");
    },
    onError: (e: Error) => {
      toast.error(e.message || admin.onboardingRepromptError);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden />
          {admin.onboardingTitle ?? "App welcome offer"}
        </CardTitle>
        <CardDescription>
          {admin.onboardingHint ??
            "Show the first-visit premium funnel again for all Android app users on their next open."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error || !data ? (
          <p className="text-sm text-destructive">
            {admin.onboardingLoadError ?? "Could not load onboarding settings."}
          </p>
        ) : (
          <>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
                <dt className="text-xs text-muted-foreground">{admin.onboardingGeneration ?? "Campaign #"}</dt>
                <dd className="font-mono text-lg font-bold tabular-nums">{data.onboardingOfferGeneration}</dd>
              </div>
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
                <dt className="text-xs text-muted-foreground">{admin.onboardingLastReprompt ?? "Last reprompt"}</dt>
                <dd className="text-sm font-medium">
                  {data.onboardingRepromptedAt
                    ? new Date(data.onboardingRepromptedAt).toLocaleString(locale)
                    : (admin.onboardingNever ?? "Never")}
                </dd>
              </div>
            </dl>
            <Button
              type="button"
              variant="default"
              className="font-semibold"
              disabled={reprompt.isPending}
              onClick={() => reprompt.mutate()}
            >
              {reprompt.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin me-2" aria-hidden />
                  {admin.onboardingReprompting ?? "Scheduling…"}
                </>
              ) : (
                (admin.onboardingRepromptCta ?? "Reprompt welcome offer for all users")
              )}
            </Button>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {admin.onboardingRepromptNote ??
                "Premium subscribers are not shown the funnel. Each reprompt starts a fresh 24-hour offer window per device."}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
