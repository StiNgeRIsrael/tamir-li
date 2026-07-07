import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { adminFetch } from "@/lib/admin-api";
import { useLocale, localePath } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ArrowUpRight } from "lucide-react";
import { AdminOnboardingCard } from "@/components/admin/AdminOnboardingCard";
import { AdminOnboardingResponses } from "@/components/admin/AdminOnboardingResponses";

type AdminStats = {
  users: { total: number; blocked: number; newLast7Days: number };
  usage: { last24Hours: number; last7Days: number; last30Days: number };
  conversionJobs: Record<string, number>;
  topToolsByUsage: { toolId: string; count: number }[];
  recentActivity: {
    id: string;
    toolId: string;
    createdAt: string;
    email: string | null;
    sessionId: string | null;
    fileSizeBytes: string | null;
  }[];
  billing?: {
    activeSubscriptions: number;
    mrrEstimateAgorot: number;
    failedPayments: number;
    currency: string;
  };
};

function formatIls(agorot: number, locale: string): string {
  const value = (agorot / 100).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `₪${value}`;
}

function StatLinkCard({
  to,
  label,
  value,
  sub,
}: {
  to: string;
  label: string;
  value: ReactNode;
  sub?: string;
}) {
  return (
    <Link to={to} className="block group">
      <Card className="transition-colors hover:border-primary/40 hover:bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between gap-2">
            {label}
            <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tabular-nums">{value}</div>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function AdminOverview() {
  const { token } = useAuth();
  const { locale, t } = useLocale();
  const admin = t.admin as Record<string, string>;

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-stats", token],
    queryFn: () => adminFetch<AdminStats>("/api/admin/stats", token),
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-sm text-destructive">{admin.statsLoadError ?? "Could not load statistics."}</p>
    );
  }

  const usersPath = localePath("/admin/users", locale);
  const billingPath = localePath("/admin/billing", locale);
  const toolsPath = localePath("/admin/tools", locale);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatLinkCard to={usersPath} label={admin.statUsers} value={data.users.total} />
        <StatLinkCard to={usersPath} label={admin.statBlocked} value={data.users.blocked} />
        <StatLinkCard to={usersPath} label={admin.statNewWeek} value={data.users.newLast7Days} />
        <StatLinkCard to={toolsPath} label={admin.statUsage24h} value={data.usage.last24Hours} />
      </div>

      {data.billing && (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatLinkCard
            to={billingPath}
            label={admin.statActiveSubs}
            value={data.billing.activeSubscriptions}
          />
          <StatLinkCard
            to={billingPath}
            label={admin.statMrr}
            value={formatIls(data.billing.mrrEstimateAgorot, locale)}
            sub={admin.mrrNote}
          />
          <StatLinkCard
            to={billingPath}
            label={admin.statFailedPayments}
            value={data.billing.failedPayments}
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <StatLinkCard to={toolsPath} label={admin.statUsage7d} value={data.usage.last7Days} />
        <StatLinkCard to={toolsPath} label={admin.statUsage30d} value={data.usage.last30Days} />
      </div>

      <AdminOnboardingCard />

      <AdminOnboardingResponses />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{admin.jobStatuses}</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(data.conversionJobs).length === 0 ? (
            <p className="text-sm text-muted-foreground">{admin.noConversionJobs}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.conversionJobs).map(([k, v]) => (
                <span
                  key={k}
                  className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium"
                >
                  {k}: {v}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{admin.topTools}</CardTitle>
          <Link to={toolsPath} className="text-xs text-primary hover:underline">
            {admin.viewTools}
          </Link>
        </CardHeader>
        <CardContent>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead>{admin.colTool}</TableHead>
                <TableHead className="w-24 text-end">{admin.colUses}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topToolsByUsage.map((row) => (
                <TableRow key={row.toolId}>
                  <TableCell className="font-mono text-xs">{row.toolId}</TableCell>
                  <TableCell className="text-end tabular-nums">{row.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{admin.recentActivity}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{admin.colWhen}</TableHead>
                <TableHead>{admin.colTool}</TableHead>
                <TableHead>{admin.colUser}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentActivity.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(row.createdAt).toLocaleString(locale)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{row.toolId}</TableCell>
                  <TableCell className="text-xs">{row.email ?? row.sessionId ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
