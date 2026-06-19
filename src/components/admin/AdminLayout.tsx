import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Users, Wrench, ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useLocale, localePath } from "@/lib/i18n";

const navCls = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
  }`;

export function AdminLayout() {
  const { locale, t } = useLocale();
  const admin = t.admin as Record<string, string>;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{admin.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{admin.subtitle}</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <NavLink to={localePath("/", locale)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {admin.backSite}
            </NavLink>
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          <nav className="flex lg:flex-col gap-1 lg:w-52 shrink-0 border border-border rounded-xl p-2 bg-card/50">
            <NavLink to={localePath("/admin", locale)} end className={navCls}>
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {admin.navOverview}
            </NavLink>
            <NavLink to={localePath("/admin/users", locale)} className={navCls}>
              <Users className="h-4 w-4 shrink-0" />
              {admin.navUsers}
            </NavLink>
            <NavLink to={localePath("/admin/tools", locale)} className={navCls}>
              <Wrench className="h-4 w-4 shrink-0" />
              {admin.navTools}
            </NavLink>
          </nav>

          <div className="flex-1 min-w-0 space-y-4">
            <Outlet />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
