import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { adminFetch } from "@/lib/admin-api";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Loader2,
  MoreHorizontal,
  Sparkles,
  Crown,
  Coins,
  Repeat,
  BarChart3,
  Shield,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Role = "ADMIN" | "MODERATOR" | "USER";

type PremiumDuration = "30d" | "90d" | "1y" | "lifetime";

type AdminUserRow = {
  id: string;
  email: string;
  blocked: boolean;
  displayName: string | null;
  roles: Role[];
  createdAt: string;
  aiCreditsBalance: number;
  bonusConversions: number;
  subscription: {
    status: string;
    plan: string;
    isPremium: boolean;
    cancelAtPeriodEnd: boolean;
  } | null;
};

export default function AdminUsers() {
  const { token, user: currentUser } = useAuth();
  const { t } = useLocale();
  const admin = t.admin as Record<string, string>;
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [rolesDialog, setRolesDialog] = useState<AdminUserRow | null>(null);
  const [draftRoles, setDraftRoles] = useState<Role[]>([]);
  const [premiumDialog, setPremiumDialog] = useState<AdminUserRow | null>(null);
  const [premiumDuration, setPremiumDuration] = useState<PremiumDuration>("30d");
  const [creditsDialog, setCreditsDialog] = useState<AdminUserRow | null>(null);
  const [creditsAmount, setCreditsAmount] = useState("10");
  const [conversionsDialog, setConversionsDialog] = useState<AdminUserRow | null>(null);
  const [conversionsAmount, setConversionsAmount] = useState("5");
  const [conversionsNote, setConversionsNote] = useState("");
  const [aiStatsDialog, setAiStatsDialog] = useState<AdminUserRow | null>(null);

  const { data: aiStats, isLoading: aiStatsLoading } = useQuery({
    queryKey: ["admin-user-ai-stats", token, aiStatsDialog?.id],
    queryFn: () =>
      adminFetch<{
        generationCount: number;
        totalCostUsd: number;
        totalCreditsCharged: number;
        recent: Array<{
          id: string;
          toolId: string;
          status: string;
          creditsCharged: number;
          estimatedCostUsd: number | null;
          promptPreview: string | null;
          createdAt: string;
        }>;
      }>(`/api/admin/users/${aiStatsDialog!.id}/ai-stats`, token),
    enabled: !!token && !!aiStatsDialog,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", token, page, searchDebounced],
    queryFn: () =>
      adminFetch<{
        page: number;
        pageSize: number;
        total: number;
        users: AdminUserRow[];
      }>(`/api/admin/users?page=${page}&search=${encodeURIComponent(searchDebounced)}`, token),
    enabled: !!token,
  });

  const grantPremiumMutation = useMutation({
    mutationFn: async ({ id, duration }: { id: string; duration: PremiumDuration }) => {
      await adminFetch(`/api/admin/users/${id}/grant-premium`, token, {
        method: "PATCH",
        body: JSON.stringify({ duration }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(admin.grantPremiumSuccess ?? "Premium granted");
      setPremiumDialog(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const grantCreditsMutation = useMutation({
    mutationFn: async ({ id, credits }: { id: string; credits: number }) => {
      await adminFetch(`/api/admin/users/${id}/grant-credits`, token, {
        method: "PATCH",
        body: JSON.stringify({ credits }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(admin.grantCreditsSuccess ?? "Credits granted");
      setCreditsDialog(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const grantConversionsMutation = useMutation({
    mutationFn: async ({
      id,
      amount,
      note,
    }: {
      id: string;
      amount: number;
      note?: string;
    }) => {
      await adminFetch(`/api/admin/users/${id}/grant-conversions`, token, {
        method: "POST",
        body: JSON.stringify({ amount, ...(note ? { note } : {}) }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(admin.grantConversionsSuccess ?? "Bonus conversions granted");
      setConversionsDialog(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patchMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: { blocked?: boolean; roles?: Role[] } }) => {
      await adminFetch(`/api/admin/users/${id}`, token, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(admin.saved ?? "Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const applySearch = () => {
    setSearchDebounced(search.trim());
    setPage(1);
  };

  const openRoles = (u: AdminUserRow) => {
    setRolesDialog(u);
    setDraftRoles([...u.roles]);
  };

  const saveRoles = () => {
    if (!rolesDialog) return;
    if (draftRoles.length === 0) {
      toast.error(admin.rolesRequired ?? "Select at least one role");
      return;
    }
    patchMutation.mutate({ id: rolesDialog.id, body: { roles: draftRoles } });
    setRolesDialog(null);
  };

  const toggleRole = (role: Role, checked: boolean) => {
    setDraftRoles((prev) => {
      if (checked) return prev.includes(role) ? prev : [...prev, role];
      return prev.filter((r) => r !== role);
    });
  };

  const saveCredits = () => {
    if (!creditsDialog) return;
    const credits = Number.parseInt(creditsAmount, 10);
    if (!Number.isInteger(credits) || credits < 1 || credits > 500) {
      toast.error(admin.grantCreditsInvalid ?? "Enter a valid amount (1–500)");
      return;
    }
    grantCreditsMutation.mutate({ id: creditsDialog.id, credits });
  };

  const saveConversions = () => {
    if (!conversionsDialog) return;
    const amount = Number.parseInt(conversionsAmount, 10);
    if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
      toast.error(admin.grantConversionsInvalid ?? "Enter a valid amount (1–100)");
      return;
    }
    const note = conversionsNote.trim();
    grantConversionsMutation.mutate({
      id: conversionsDialog.id,
      amount,
      note: note || undefined,
    });
  };

  const savePremium = () => {
    if (!premiumDialog) return;
    grantPremiumMutation.mutate({ id: premiumDialog.id, duration: premiumDuration });
  };

  const openPremium = (u: AdminUserRow) => {
    setPremiumDialog(u);
    setPremiumDuration("30d");
  };

  const openCredits = (u: AdminUserRow) => {
    setCreditsDialog(u);
    setCreditsAmount("10");
  };

  const openConversions = (u: AdminUserRow) => {
    setConversionsDialog(u);
    setConversionsAmount("5");
    setConversionsNote("");
  };

  if (isLoading && !data) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <Input
          placeholder={admin.searchPlaceholder ?? "Search email or name…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applySearch()}
          className="max-w-md h-9 text-sm"
        />
        <Button type="button" variant="secondary" size="sm" onClick={applySearch}>
          {admin.search ?? "Search"}
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-9 text-xs font-semibold">{admin.colEmail}</TableHead>
              <TableHead className="h-9 text-xs font-semibold">{admin.colSubscription}</TableHead>
              <TableHead className="h-9 text-xs font-semibold hidden md:table-cell">
                {admin.colRoles}
              </TableHead>
              <TableHead className="h-9 text-xs font-semibold w-16 text-center">
                {admin.colBlocked}
              </TableHead>
              <TableHead className="h-9 text-xs font-semibold w-24 text-end">
                {admin.colActions}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.users.map((u) => (
              <TableRow key={u.id} className="hover:bg-muted/40 transition-colors">
                <TableCell className="py-2">
                  <div className="font-medium text-sm leading-tight">{u.email}</div>
                  {u.displayName && (
                    <div className="text-xs text-muted-foreground mt-0.5">{u.displayName}</div>
                  )}
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex flex-wrap items-center gap-1">
                    {u.subscription?.isPremium ? (
                      <Badge className="text-[10px] px-1.5 py-0">{admin.premiumBadge}</Badge>
                    ) : u.subscription ? (
                      <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                        {u.subscription.status}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                    {u.bonusConversions > 0 && !u.subscription?.isPremium && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                        {admin.colBonusConversions?.replace("{n}", String(u.bonusConversions)) ??
                          `+${u.bonusConversions}`}
                      </Badge>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 font-mono tabular-nums">
                    {admin.colCreditsBalance?.replace("{n}", String(u.aiCreditsBalance)) ??
                      `AI: ${u.aiCreditsBalance}`}
                  </div>
                </TableCell>
                <TableCell className="py-2 hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map((r) => (
                      <Badge key={r} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="py-2 text-center">
                  <div className="flex justify-center">
                    <Switch
                      checked={u.blocked}
                      disabled={u.id === currentUser?.id || patchMutation.isPending}
                      onCheckedChange={(checked) =>
                        patchMutation.mutate({ id: u.id, body: { blocked: checked } })
                      }
                      className="scale-90"
                    />
                  </div>
                </TableCell>
                <TableCell className="py-2 text-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">{admin.moreActions ?? "More"}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onClick={() => openRoles(u)} className="gap-2 text-sm">
                        <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                        {admin.actionEditRoles ?? admin.editRoles ?? "Roles"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => openPremium(u)} className="gap-2 text-sm">
                        <Crown className="h-3.5 w-3.5 text-muted-foreground" />
                        {admin.actionGrantPremium ?? admin.grantPremium ?? "Grant Premium"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openCredits(u)} className="gap-2 text-sm">
                        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                        {admin.actionGrantCredits ?? admin.grantCredits ?? "Grant Credits"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openConversions(u)} className="gap-2 text-sm">
                        <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
                        {admin.actionGrantConversions ?? admin.grantConversions ?? "Grant conversions"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setAiStatsDialog(u)}
                        className="gap-2 text-sm"
                      >
                        <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                        {admin.actionAiUsage ?? admin.aiViewUsage ?? "AI usage"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          {admin.prev ?? "Previous"}
        </Button>
        <span>
          {admin.pageOf?.replace("{page}", String(page)).replace("{total}", String(totalPages)) ??
            `Page ${page} / ${totalPages}`}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          {admin.next ?? "Next"}
        </Button>
      </div>

      <Dialog open={!!rolesDialog} onOpenChange={(o) => !o && setRolesDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{admin.editRolesTitle ?? "Edit roles"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(["ADMIN", "MODERATOR", "USER"] as const).map((role) => (
              <div key={role} className="flex items-center gap-2">
                <Checkbox
                  id={`role-${role}`}
                  checked={draftRoles.includes(role)}
                  onCheckedChange={(c) => toggleRole(role, c === true)}
                />
                <Label htmlFor={`role-${role}`}>{role}</Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRolesDialog(null)}>
              {admin.cancel ?? "Cancel"}
            </Button>
            <Button onClick={saveRoles}>{admin.save ?? "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!premiumDialog} onOpenChange={(o) => !o && setPremiumDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{admin.grantPremiumTitle ?? "Grant premium access"}</DialogTitle>
          </DialogHeader>
          {premiumDialog && (
            <p className="text-sm text-muted-foreground">{premiumDialog.email}</p>
          )}
          <div className="space-y-2 py-2">
            <Label htmlFor="grant-duration">{admin.grantDuration ?? "Duration"}</Label>
            <Select
              value={premiumDuration}
              onValueChange={(v) => setPremiumDuration(v as PremiumDuration)}
            >
              <SelectTrigger id="grant-duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">{admin.grantDuration30d ?? "30 days"}</SelectItem>
                <SelectItem value="90d">{admin.grantDuration90d ?? "90 days"}</SelectItem>
                <SelectItem value="1y">{admin.grantDuration1y ?? "1 year"}</SelectItem>
                <SelectItem value="lifetime">
                  {admin.grantDurationLifetime ?? "Lifetime"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPremiumDialog(null)}>
              {admin.cancel ?? "Cancel"}
            </Button>
            <Button onClick={savePremium} disabled={grantPremiumMutation.isPending}>
              {admin.grantConfirm ?? "Grant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!creditsDialog} onOpenChange={(o) => !o && setCreditsDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {admin.grantCreditsTitle ?? "Grant AI credits"}
            </DialogTitle>
          </DialogHeader>
          {creditsDialog && (
            <p className="text-sm text-muted-foreground">{creditsDialog.email}</p>
          )}
          <div className="space-y-2 py-2">
            <Label htmlFor="grant-credits">{admin.grantCreditsAmount ?? "Credits to add"}</Label>
            <Input
              id="grant-credits"
              type="number"
              min={1}
              max={500}
              value={creditsAmount}
              onChange={(e) => setCreditsAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {admin.grantCreditsHint ?? "Added to the user's AI credit balance"}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditsDialog(null)}>
              {admin.cancel ?? "Cancel"}
            </Button>
            <Button onClick={saveCredits} disabled={grantCreditsMutation.isPending}>
              {admin.grantConfirm ?? "Grant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!conversionsDialog} onOpenChange={(o) => !o && setConversionsDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-primary" />
              {admin.grantConversionsTitle ?? "Grant bonus conversions"}
            </DialogTitle>
          </DialogHeader>
          {conversionsDialog && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>{conversionsDialog.email}</p>
              {conversionsDialog.bonusConversions > 0 && (
                <p className="text-xs font-mono">
                  {admin.colBonusConversions?.replace(
                    "{n}",
                    String(conversionsDialog.bonusConversions)
                  ) ?? `Current bonus: ${conversionsDialog.bonusConversions}`}
                </p>
              )}
            </div>
          )}
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="grant-conversions">{admin.grantConversionsAmount ?? "Conversions"}</Label>
              <Input
                id="grant-conversions"
                type="number"
                min={1}
                max={100}
                value={conversionsAmount}
                onChange={(e) => setConversionsAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {admin.grantConversionsHint ??
                  "Added to bonus pool beyond the daily free limit (5/day)"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grant-conversions-note">
                {admin.grantConversionsNote ?? "Note (optional)"}
              </Label>
              <Textarea
                id="grant-conversions-note"
                rows={2}
                value={conversionsNote}
                onChange={(e) => setConversionsNote(e.target.value)}
                className="resize-none text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConversionsDialog(null)}>
              {admin.cancel ?? "Cancel"}
            </Button>
            <Button onClick={saveConversions} disabled={grantConversionsMutation.isPending}>
              {admin.grantConfirm ?? "Grant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!aiStatsDialog} onOpenChange={(o) => !o && setAiStatsDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{admin.aiViewUsage ?? "AI usage"}</DialogTitle>
          </DialogHeader>
          {aiStatsDialog && (
            <p className="text-sm text-muted-foreground">{aiStatsDialog.email}</p>
          )}
          {aiStatsLoading && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {aiStats && (
            <div className="space-y-4">
              <p className="text-sm">
                {(admin.aiUserSpend ?? "Total AI spend: ${amount}").replace(
                  "${amount}",
                  `$${aiStats.totalCostUsd.toFixed(4)}`
                )}{" "}
                · {aiStats.generationCount} gens · {aiStats.totalCreditsCharged}{" "}
                {admin.aiColCredits?.toLowerCase() ?? "credits"}
              </p>
              <div>
                <h4 className="text-sm font-medium mb-2">
                  {admin.aiRecentGenerations ?? "Recent generations"}
                </h4>
                {aiStats.recent.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{admin.aiNoGenerations}</p>
                ) : (
                  <ul className="space-y-2 max-h-48 overflow-y-auto text-xs">
                    {aiStats.recent.map((g) => (
                      <li key={g.id} className="border-b border-border/50 pb-2">
                        <div className="flex justify-between gap-2">
                          <Badge variant={g.status === "SUCCESS" ? "default" : "destructive"} className="text-[10px]">
                            {g.status === "SUCCESS" ? admin.aiStatusSuccess : admin.aiStatusFailed}
                          </Badge>
                          <span className="text-muted-foreground">
                            {new Date(g.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="truncate text-muted-foreground mt-1">{g.promptPreview ?? g.toolId}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiStatsDialog(null)}>
              {admin.cancel ?? "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
