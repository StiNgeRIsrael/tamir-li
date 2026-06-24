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
import { toast } from "sonner";
import { Loader2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

  if (isLoading && !data) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <Input
          placeholder={admin.searchPlaceholder ?? "Search email or name…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applySearch()}
          className="max-w-md"
        />
        <Button type="button" variant="secondary" onClick={applySearch}>
          {admin.search ?? "Search"}
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[32%]">{admin.colEmail}</TableHead>
              <TableHead className="w-[18%]">{admin.colSubscription}</TableHead>
              <TableHead className="w-[22%]">{admin.colRoles}</TableHead>
              <TableHead className="w-20 text-center">{admin.colBlocked}</TableHead>
              <TableHead className="w-28 text-end">{admin.colActions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="font-medium text-sm">{u.email}</div>
                  {u.displayName && (
                    <div className="text-xs text-muted-foreground">{u.displayName}</div>
                  )}
                </TableCell>
                <TableCell>
                  {u.subscription?.isPremium ? (
                    <Badge className="text-[10px]">{admin.premiumBadge}</Badge>
                  ) : u.subscription ? (
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {u.subscription.status}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {admin.colCreditsBalance?.replace("{n}", String(u.aiCreditsBalance)) ??
                      `AI: ${u.aiCreditsBalance}`}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map((r) => (
                      <Badge key={r} variant="secondary" className="text-[10px]">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <Switch
                      checked={u.blocked}
                      disabled={u.id === currentUser?.id || patchMutation.isPending}
                      onCheckedChange={(checked) =>
                        patchMutation.mutate({ id: u.id, body: { blocked: checked } })
                      }
                    />
                  </div>
                </TableCell>
                <TableCell className="text-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">{admin.moreActions ?? "More"}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openRoles(u)}>
                        {admin.editRoles ?? "Roles"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openPremium(u)}>
                        {admin.grantPremium ?? "Grant Premium"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openCredits(u)}>
                        {admin.grantCredits ?? "Grant Credits"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-2 text-sm">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          {admin.prev ?? "Previous"}
        </Button>
        <span className="text-muted-foreground">
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
            <DialogTitle>{admin.grantCreditsTitle ?? "Grant AI credits"}</DialogTitle>
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
    </div>
  );
}
