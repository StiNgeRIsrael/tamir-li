import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";

export function UserAuthSection({ compact }: { compact?: boolean }) {
  const { user, loading, apiAvailable, googleConfigured, signOut } = useAuth();
  const { t } = useLocale();
  const auth = t.auth as { signOut?: string; account?: string } | undefined;

  if (!apiAvailable || !googleConfigured) return null;

  if (loading) {
    return <Skeleton className="h-9 w-[160px] rounded-full hidden sm:block shrink-0" />;
  }

  if (user) {
    const initial = (user.displayName?.[0] ?? user.email?.[0] ?? "?").toUpperCase();
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 px-2 h-9 shrink-0">
            <Avatar className="h-7 w-7">
              {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
              <AvatarFallback className="text-xs">{initial}</AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline max-w-[120px] truncate text-sm font-medium">
              {user.displayName ?? user.email}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[200px]">
          <DropdownMenuItem disabled className="flex flex-col items-start gap-0 py-2">
            <span className="text-xs text-muted-foreground">{auth?.account ?? "Account"}</span>
            <span className="text-sm font-medium truncate max-w-[220px]">{user.email}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => signOut()} className="gap-2 cursor-pointer">
            <LogOut className="h-4 w-4" />
            {auth?.signOut ?? "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return <GoogleLoginButton compact={compact} native={compact} />;
}
