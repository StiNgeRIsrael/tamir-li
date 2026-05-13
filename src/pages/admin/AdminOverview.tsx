import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { adminFetch } from "@/lib/admin-api";
import { useLocale } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

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
};

export default function AdminOverview() {
  const { token } = useAuth();
  const { t } = useLocale();
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

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{admin.statUsers}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data.users.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{admin.statBlocked}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data.users.blocked}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{admin.statNewWeek}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data.users.newLast7Days}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{admin.statUsage24h}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data.usage.last24Hours}</CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{admin.statUsage7d}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data.usage.last7Days}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{admin.statUsage30d}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data.usage.last30Days}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{admin.jobStatuses}</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{admin.topTools}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{admin.colTool}</TableHead>
                <TableHead className="text-end">{admin.colUses}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topToolsByUsage.map((row) => (
                <TableRow key={row.toolId}>
                  <TableCell className="font-mono text-xs">{row.toolId}</TableCell>
                  <TableCell className="text-end">{row.count}</TableCell>
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
                    {new Date(row.createdAt).toLocaleString()}
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
