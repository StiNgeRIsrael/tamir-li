import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { adminFetch } from "@/lib/admin-api";
import { useLocale } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ClipboardList } from "lucide-react";

type OnboardingResponseRow = {
  id: string;
  email: string | null;
  category: string;
  frequency: string;
  pain: string;
  attribution: string;
  offerDecision: string;
  selectedPlan: string | null;
  createdAt: string;
};

type OnboardingResponsesPayload = {
  total: number;
  responses: OnboardingResponseRow[];
  summary: {
    attribution: { key: string; count: number }[];
    decision: { key: string; count: number }[];
  };
};

const ATTRIBUTION_LABELS: Record<string, string> = {
  play_store: "Play Store",
  google_search: "Google",
  friend: "Friend",
  social: "Social",
  other: "Other",
};

export function AdminOnboardingResponses() {
  const { token } = useAuth();
  const { locale, t } = useLocale();
  const admin = t.admin as Record<string, string>;

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-onboarding-responses", token],
    queryFn: () =>
      adminFetch<OnboardingResponsesPayload>("/api/admin/onboarding/responses?pageSize=50", token),
    enabled: !!token,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="h-5 w-5 text-primary" aria-hidden />
          {admin.onboardingResponsesTitle ?? "Onboarding responses"}
        </CardTitle>
        <CardDescription>
          {admin.onboardingResponsesHint ??
            "Quiz answers and attribution collected from the app welcome funnel."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error || !data ? (
          <p className="text-sm text-destructive">
            {admin.onboardingResponsesError ?? "Could not load responses."}
          </p>
        ) : data.total === 0 ? (
          <p className="text-sm text-muted-foreground">
            {admin.onboardingResponsesEmpty ?? "No responses collected yet."}
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {data.summary.attribution.map((s) => (
                <span
                  key={s.key}
                  className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium"
                >
                  {ATTRIBUTION_LABELS[s.key] ?? s.key}:{" "}
                  {Math.round((s.count / data.total) * 100)}% ({s.count})
                </span>
              ))}
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{admin.colWhen ?? "When"}</TableHead>
                    <TableHead>{admin.colUser ?? "User"}</TableHead>
                    <TableHead>{admin.onboardingColCategory ?? "Category"}</TableHead>
                    <TableHead>{admin.onboardingColFrequency ?? "Frequency"}</TableHead>
                    <TableHead>{admin.onboardingColPain ?? "Pain"}</TableHead>
                    <TableHead>{admin.onboardingColAttribution ?? "Source"}</TableHead>
                    <TableHead>{admin.onboardingColDecision ?? "Decision"}</TableHead>
                    <TableHead>{admin.onboardingColPlan ?? "Plan"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.responses.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(row.createdAt).toLocaleString(locale)}
                      </TableCell>
                      <TableCell className="text-xs">{row.email ?? "—"}</TableCell>
                      <TableCell className="text-xs">{row.category}</TableCell>
                      <TableCell className="text-xs">{row.frequency}</TableCell>
                      <TableCell className="text-xs">{row.pain}</TableCell>
                      <TableCell className="text-xs">
                        {ATTRIBUTION_LABELS[row.attribution] ?? row.attribution}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span
                          className={
                            row.offerDecision === "accepted"
                              ? "font-semibold text-primary"
                              : "text-muted-foreground"
                          }
                        >
                          {row.offerDecision}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{row.selectedPlan ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
