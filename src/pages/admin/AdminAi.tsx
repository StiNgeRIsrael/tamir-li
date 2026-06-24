import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { adminFetch } from "@/lib/admin-api";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type AiSettingsAdmin = {
  googleApiKeyMasked: string | null;
  hasGoogleApiKey: boolean;
  modelName: string;
  enabled: boolean;
};

type AiGenerationRow = {
  id: string;
  userId: string | null;
  userEmail: string | null;
  toolId: string;
  status: "SUCCESS" | "FAILED";
  creditsCharged: number;
  estimatedCostUsd: number | null;
  model: string | null;
  promptPreview: string | null;
  createdAt: string;
};

export default function AdminAi() {
  const { token } = useAuth();
  const { t } = useLocale();
  const admin = t.admin as Record<string, string>;
  const qc = useQueryClient();

  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState("imagen-3.0-generate-002");
  const [enabled, setEnabled] = useState(false);
  const [genPage, setGenPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const { data: settingsData, isLoading: settingsLoading, isError: settingsError, error } = useQuery({
    queryKey: ["admin-ai-settings", token],
    queryFn: () => adminFetch<{ settings: AiSettingsAdmin }>("/api/admin/ai/settings", token),
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (settingsData?.settings) {
      setModelName(settingsData.settings.modelName);
      setEnabled(settingsData.settings.enabled);
      setApiKey("");
    }
  }, [settingsData?.settings]);

  const { data: gensData, isLoading: gensLoading } = useQuery({
    queryKey: ["admin-ai-generations", token, genPage, statusFilter, userSearch],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(genPage), pageSize: "25" });
      if (statusFilter) params.set("status", statusFilter);
      if (userSearch.trim()) params.set("search", userSearch.trim());
      return adminFetch<{
        page: number;
        total: number;
        summary: { successCount: number; totalCreditsCharged: number; totalCostUsd: number };
        generations: AiGenerationRow[];
      }>(`/api/admin/ai/generations?${params}`, token);
    },
    enabled: !!token,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = { modelName, enabled };
      if (apiKey.trim()) {
        body.googleApiKey = apiKey.trim();
      }
      await adminFetch("/api/admin/ai/settings", token, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ai-settings"] });
      setApiKey("");
      toast.success(admin.saved ?? "Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (settingsLoading && !settingsData) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const loadError = settingsError && error instanceof Error ? error.message : null;
  const settings = settingsData?.settings;
  const totalPages = gensData ? Math.max(1, Math.ceil(gensData.total / 25)) : 1;

  return (
    <div className="space-y-10 max-w-4xl">
      {loadError && (
        <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
          {loadError}
        </p>
      )}

      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold">{admin.navAi ?? "AI"}</h2>
          <p className="text-sm text-muted-foreground mt-1">{admin.aiHint}</p>
        </div>

        <div className="space-y-4 rounded-xl border border-border p-4 bg-card/40">
          <div className="space-y-1.5">
            <Label htmlFor="ai-api-key">{admin.aiFieldApiKey}</Label>
            <p className="text-xs text-muted-foreground">{admin.aiFieldApiKeyHint}</p>
            {settings?.hasGoogleApiKey && settings.googleApiKeyMasked && (
              <p className="text-xs font-mono text-muted-foreground">
                {admin.aiApiKeyMasked}: {settings.googleApiKeyMasked}
              </p>
            )}
            <Input
              id="ai-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={admin.aiApiKeyPlaceholder}
              className="font-mono text-xs"
              dir="ltr"
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ai-model">{admin.aiFieldModel}</Label>
            <p className="text-xs text-muted-foreground">{admin.aiFieldModelHint}</p>
            <Input
              id="ai-model"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="font-mono text-xs"
              dir="ltr"
              spellCheck={false}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="ai-enabled">{admin.aiFieldEnabled}</Label>
            </div>
            <Switch id="ai-enabled" checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin me-2" />}
            {admin.save}
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{admin.aiGenerationsTitle}</h2>
            {gensData?.summary && (
              <p className="text-sm text-muted-foreground mt-1">
                {admin.aiTotalSpend}: ${gensData.summary.totalCostUsd.toFixed(4)} ·{" "}
                {gensData.summary.successCount} OK · {gensData.summary.totalCreditsCharged}{" "}
                {admin.aiColCredits?.toLowerCase() ?? "credits"}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setGenPage(1);
              }}
              placeholder={admin.aiFilterUser}
              className="h-9 w-44 text-xs"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setGenPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="">{admin.subsFilterAll ?? "All"}</option>
              <option value="SUCCESS">{admin.aiStatusSuccess}</option>
              <option value="FAILED">{admin.aiStatusFailed}</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{admin.aiColUser}</TableHead>
                <TableHead>{admin.aiColTool}</TableHead>
                <TableHead>{admin.aiColStatus}</TableHead>
                <TableHead>{admin.aiColCredits}</TableHead>
                <TableHead>{admin.aiColCost}</TableHead>
                <TableHead>{admin.aiColModel}</TableHead>
                <TableHead>{admin.aiColWhen}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gensLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              )}
              {!gensLoading && (!gensData?.generations.length) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                    {admin.aiNoGenerations}
                  </TableCell>
                </TableRow>
              )}
              {gensData?.generations.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="text-xs font-mono">{g.userEmail ?? "—"}</TableCell>
                  <TableCell className="text-xs">{g.toolId}</TableCell>
                  <TableCell>
                    <Badge variant={g.status === "SUCCESS" ? "default" : "destructive"}>
                      {g.status === "SUCCESS" ? admin.aiStatusSuccess : admin.aiStatusFailed}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{g.creditsCharged}</TableCell>
                  <TableCell className="text-xs font-mono">
                    {g.estimatedCostUsd != null ? `$${g.estimatedCostUsd.toFixed(4)}` : "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono max-w-[120px] truncate">{g.model ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(g.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              disabled={genPage <= 1}
              onClick={() => setGenPage((p) => p - 1)}
            >
              {admin.prev}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={genPage >= totalPages}
              onClick={() => setGenPage((p) => p + 1)}
            >
              {admin.next}
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
