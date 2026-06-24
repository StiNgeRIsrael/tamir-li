import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { adminFetch } from "@/lib/admin-api";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Receipt, CreditCard } from "lucide-react";

type BillingStats = {
  activeSubscriptions: number;
  canceledSubscriptions: number;
  failedPayments: number;
  mrrEstimateAgorot: number;
  revenueLast30DaysAgorot: number;
  currency: string;
};

type PaymentRow = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  provider: "STRIPE" | "PAYPAL" | null;
  userEmail: string;
  createdAt: string;
};

type SubscriptionRow = {
  id: string;
  userEmail: string;
  plan: string;
  status: string;
  provider: string;
  isPremium: boolean;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
};

function formatIls(agorot: number, locale: string): string {
  const value = (agorot / 100).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return locale === "he" ? `₪${value}` : `₪${value}`;
}

function statusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "SUCCEEDED" || status === "ACTIVE" || status === "TRIALING") return "default";
  if (status === "PENDING") return "secondary";
  if (status === "FAILED" || status === "CANCELED" || status === "UNPAID") return "destructive";
  return "outline";
}

export default function AdminBilling() {
  const { token } = useAuth();
  const { locale, t } = useLocale();
  const admin = t.admin as Record<string, string>;
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [subsPage, setSubsPage] = useState(1);
  const [subsFilter, setSubsFilter] = useState<"all" | "active" | "canceled">("all");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-billing-stats", token],
    queryFn: () => adminFetch<BillingStats>("/api/admin/billing/stats", token),
    enabled: !!token,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["admin-billing-payments", token, paymentsPage],
    queryFn: () =>
      adminFetch<{ page: number; pageSize: number; total: number; payments: PaymentRow[] }>(
        `/api/admin/billing/payments?page=${paymentsPage}`,
        token
      ),
    enabled: !!token,
  });

  const { data: subs, isLoading: subsLoading } = useQuery({
    queryKey: ["admin-billing-subs", token, subsPage, subsFilter],
    queryFn: () =>
      adminFetch<{ page: number; pageSize: number; total: number; subscriptions: SubscriptionRow[] }>(
        `/api/admin/billing/subscriptions?page=${subsPage}&filter=${subsFilter}`,
        token
      ),
    enabled: !!token,
  });

  if (statsLoading && !stats) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const paymentsTotalPages = payments
    ? Math.max(1, Math.ceil(payments.total / payments.pageSize))
    : 1;
  const subsTotalPages = subs ? Math.max(1, Math.ceil(subs.total / subs.pageSize)) : 1;

  const providerLabel = (p: string | null) => {
    if (p === "STRIPE") return admin.providerStripe ?? "Stripe";
    if (p === "PAYPAL") return admin.providerPaypal ?? "PayPal";
    return "—";
  };

  const typeLabel = (type: string) => {
    if (type === "SUBSCRIPTION") return admin.paymentTypeSubscription ?? "Subscription";
    if (type === "CREDITS") return admin.paymentTypeCredits ?? "Credits";
    return type;
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{admin.billingHint}</p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {admin.statActiveSubs}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold tabular-nums">
            {stats?.activeSubscriptions ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {admin.statMrr}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {formatIls(stats?.mrrEstimateAgorot ?? 0, locale)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{admin.mrrNote}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {admin.statFailedPayments}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold tabular-nums text-destructive">
            {stats?.failedPayments ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              {admin.statRevenue30d}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold tabular-nums">
            {formatIls(stats?.revenueLast30DaysAgorot ?? 0, locale)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{admin.billingPayments}</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentsLoading && !payments ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !payments?.payments.length ? (
            <p className="text-sm text-muted-foreground py-6 text-center">{admin.noPaymentsYet}</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{admin.colDate}</TableHead>
                      <TableHead>{admin.colUser}</TableHead>
                      <TableHead>{admin.colAmount}</TableHead>
                      <TableHead>{admin.colType}</TableHead>
                      <TableHead>{admin.colProvider}</TableHead>
                      <TableHead>{admin.colStatus}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {new Date(p.createdAt).toLocaleString(locale)}
                        </TableCell>
                        <TableCell className="text-xs">{p.userEmail}</TableCell>
                        <TableCell className="text-xs tabular-nums">
                          {formatIls(p.amount, locale)}
                        </TableCell>
                        <TableCell className="text-xs">{typeLabel(p.type)}</TableCell>
                        <TableCell className="text-xs">{providerLabel(p.provider)}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(p.status)} className="text-[10px]">
                            {p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paymentsPage <= 1}
                  onClick={() => setPaymentsPage((p) => p - 1)}
                >
                  {admin.prev}
                </Button>
                <span className="text-muted-foreground">
                  {admin.pageOf
                    ?.replace("{page}", String(paymentsPage))
                    .replace("{total}", String(paymentsTotalPages)) ??
                    `Page ${paymentsPage} / ${paymentsTotalPages}`}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paymentsPage >= paymentsTotalPages}
                  onClick={() => setPaymentsPage((p) => p + 1)}
                >
                  {admin.next}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-lg">{admin.billingSubscriptions}</CardTitle>
          <div className="flex flex-wrap gap-1">
            {(["all", "active", "canceled"] as const).map((f) => (
              <Button
                key={f}
                variant={subsFilter === f ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSubsFilter(f);
                  setSubsPage(1);
                }}
              >
                {f === "all"
                  ? admin.subsFilterAll
                  : f === "active"
                    ? admin.subsFilterActive
                    : admin.subsFilterCanceled}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {subsLoading && !subs ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !subs?.subscriptions.length ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {admin.noSubscriptionsYet}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{admin.colUser}</TableHead>
                      <TableHead>{admin.colPlan}</TableHead>
                      <TableHead>{admin.colStatus}</TableHead>
                      <TableHead>{admin.colProvider}</TableHead>
                      <TableHead>{admin.colPeriodEnd}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subs.subscriptions.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-xs">
                          <div>{s.userEmail}</div>
                          {s.isPremium && (
                            <Badge variant="default" className="mt-1 text-[10px]">
                              {admin.premiumBadge}
                            </Badge>
                          )}
                          {s.cancelAtPeriodEnd && (
                            <span className="block text-[10px] text-muted-foreground mt-0.5">
                              {admin.cancelAtPeriodEnd}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono">{s.plan}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(s.status)} className="text-[10px]">
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{providerLabel(s.provider)}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {s.currentPeriodEnd
                            ? new Date(s.currentPeriodEnd).toLocaleDateString(locale)
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={subsPage <= 1}
                  onClick={() => setSubsPage((p) => p - 1)}
                >
                  {admin.prev}
                </Button>
                <span className="text-muted-foreground">
                  {admin.pageOf
                    ?.replace("{page}", String(subsPage))
                    .replace("{total}", String(subsTotalPages)) ??
                    `Page ${subsPage} / ${subsTotalPages}`}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={subsPage >= subsTotalPages}
                  onClick={() => setSubsPage((p) => p + 1)}
                >
                  {admin.next}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
