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
import { Loader2 } from "lucide-react";

type Role = "ADMIN" | "MODERATOR" | "USER";

type AdminUserRow = {
  id: string;
  email: string;
  blocked: boolean;
  displayName: string | null;
  roles: Role[];
  createdAt: string;
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{admin.colEmail}</TableHead>
              <TableHead>{admin.colRoles}</TableHead>
              <TableHead>{admin.colBlocked}</TableHead>
              <TableHead className="text-end">{admin.colActions}</TableHead>
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
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map((r) => (
                      <Badge key={r} variant="secondary" className="text-[10px]">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={u.blocked}
                    disabled={u.id === currentUser?.id || patchMutation.isPending}
                    onCheckedChange={(checked) =>
                      patchMutation.mutate({ id: u.id, body: { blocked: checked } })
                    }
                  />
                </TableCell>
                <TableCell className="text-end">
                  <Button variant="outline" size="sm" onClick={() => openRoles(u)}>
                    {admin.editRoles ?? "Roles"}
                  </Button>
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
    </div>
  );
}
