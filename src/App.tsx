import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, useParams } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ScrollToTop } from "@/components/ScrollToTop";
import { LocaleProvider, NON_HE_LOCALES, type Locale } from "@/lib/i18n";
import Index from "./pages/Index";
import ToolPage from "./pages/ToolPage";
import InstallPage from "./pages/InstallPage";
import PremiumPage from "./pages/PremiumPage";
import BlogIndex from "./pages/BlogIndex";
import BlogPost from "./pages/BlogPost";
import NotFound from "./pages/NotFound";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import { AnalyticsPageTracker } from "@/components/AnalyticsPageTracker";
import { CookieConsent } from "@/components/CookieConsent";
import { AdVignetteHost } from "@/components/ads/AdVignette";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToolConfigProvider } from "@/contexts/ToolConfigContext";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import AdminOverview from "@/pages/admin/AdminOverview";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminTools from "@/pages/admin/AdminTools";

const queryClient = new QueryClient();

/** Remount tool page when slug changes so SPA navigations reset local state. */
function ToolPageRoute() {
  const { slug } = useParams();
  return <ToolPage key={slug} />;
}

function LocaleLayout({ explicitLocale }: { explicitLocale?: Locale }) {
  return (
    <LocaleProvider explicitLocale={explicitLocale}>
      <Outlet />
    </LocaleProvider>
  );
}

const getAppRoutes = (explicitLocale?: Locale) => (
  <Route element={<LocaleLayout explicitLocale={explicitLocale} />}>
    <Route index element={<Index />} />
    <Route path="install" element={<InstallPage />} />
    <Route path="premium" element={<PremiumPage />} />
    <Route path="blog" element={<BlogIndex />} />
    <Route path="blog/:slug" element={<BlogPost />} />    <Route path="privacy" element={<PrivacyPage />} />
    <Route path="terms" element={<TermsPage />} />
    <Route path="about" element={<AboutPage />} />
    <Route path="contact" element={<ContactPage />} />
    <Route
      path="admin"
      element={
        <AdminGuard>
          <AdminLayout />
        </AdminGuard>
      }
    >
      <Route index element={<AdminOverview />} />
      <Route path="users" element={<AdminUsers />} />
      <Route path="tools" element={<AdminTools />} />    </Route>
    <Route path=":slug" element={<ToolPageRoute />} />
    <Route path="*" element={<NotFound />} />
  </Route>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
          <ToolConfigProvider>
          <ScrollToTop />
          <AnalyticsPageTracker />
          <CookieConsent />
          <AdVignetteHost />
          <Routes>
            {/* Explicitly map over supported locales so it doesn't swallow `:slug` */}
            {NON_HE_LOCALES.map((loc) => (
              <Route key={loc} path={`/${loc}`}>
                {getAppRoutes(loc)}
              </Route>
            ))}

            {/* Hebrew (default, no prefix) */}
            <Route path="/">
              {getAppRoutes("he")}
            </Route>
          </Routes>
          </ToolConfigProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
