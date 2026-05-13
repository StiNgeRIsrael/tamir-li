import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { adminFetch } from "@/lib/admin-api";
import { useLocale } from "@/lib/i18n";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type AdminToolRow = {
  toolId: string;
  label: string;
  category: string;
  defaultPremium: boolean;
  enabled: boolean;
  featured: boolean;
  sortOrder: number;
  notes: string | null;
  usageLast30Days: number;
};

export default function AdminTools() {
  const { token } = useAuth();
  const { t } = useLocale();
  const admin = t.admin as Record<string, string>;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tools", token],
    queryFn: () => adminFetch<{ tools: AdminToolRow[] }>("/api/admin/tools", token),
    enabled: !!token,
  });

  const patchMutation = useMutation({
    mutationFn: async ({
      toolId,
      body,
    }: {
      toolId: string;
      body: Partial<{ enabled: boolean; featured: boolean; sortOrder: number }>;
    }) => {
      await adminFetch(`/api/admin/tools/${toolId}`, token, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tools"] });
      qc.invalidateQueries({ queryKey: ["tool-config"] });
      toast.success(admin.saved ?? "Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading && !data) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{admin.toolsHint}</p>

      <div className="rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{admin.colTool}</TableHead>
              <TableHead>{admin.colCategory}</TableHead>
              <TableHead className="text-center">{admin.colEnabled}</TableHead>
              <TableHead className="text-center">{admin.colFeatured}</TableHead>
              <TableHead>{admin.colSort}</TableHead>
              <TableHead className="text-end">{admin.colUses}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.tools.map((row) => (
              <TableRow key={row.toolId}>
                <TableCell>
                  <div className="font-medium text-sm">{row.label}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{row.toolId}</div>
                  {row.defaultPremium && (
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      Premium
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm capitalize">{row.category}</TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={row.enabled}
                    disabled={patchMutation.isPending}
                    onCheckedChange={(checked) =>
                      patchMutation.mutate({ toolId: row.toolId, body: { enabled: checked } })
                    }
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={row.featured}
                    disabled={patchMutation.isPending}
                    onCheckedChange={(checked) =>
                      patchMutation.mutate({ toolId: row.toolId, body: { featured: checked } })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    className="h-8 w-20 font-mono text-xs"
                    defaultValue={row.sortOrder}
                    key={`${row.toolId}-${row.sortOrder}`}
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (Number.isFinite(v) && v !== row.sortOrder) {
                        patchMutation.mutate({ toolId: row.toolId, body: { sortOrder: v } });
                      }
                    }}
                  />
                </TableCell>
                <TableCell className="text-end text-sm">{row.usageLast30Days}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
