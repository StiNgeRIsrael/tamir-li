import { lazy, Suspense, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, useParams } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ScrollToTop } from "@/components/ScrollToTop";
import { LocaleProvider, NON_HE_LOCALES, type Locale } from "@/lib/i18n";
import Index from "./pages/Index";
import {
  ROOT_USE_CASE_PATHS,
  type UseCaseSlug,
} from "./lib/use-case-pages-data";
import {
  ROOT_ALTERNATIVE_PATHS,
  type AlternativeSlug,
} from "./lib/alternative-pages-data";
import { AnalyticsPageTracker } from "@/components/AnalyticsPageTracker";
import { CookieConsent } from "@/components/CookieConsent";
import { PwaUpdatePrompt } from "@/components/PwaUpdatePrompt";
import { AdVignetteHost } from "@/components/ads/AdVignette";
import { OnboardingHost } from "@/components/OnboardingHost";
import { NativeDailyLimitHost } from "@/components/NativeDailyLimitHost";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToolConfigProvider } from "@/contexts/ToolConfigContext";
import { AdConfigProvider } from "@/contexts/AdConfigContext";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";

const ToolPage = lazy(() => import("./pages/ToolPage"));
const InstallPage = lazy(() => import("./pages/InstallPage"));
const PremiumPage = lazy(() => import("./pages/PremiumPage"));
const BlogIndex = lazy(() => import("./pages/BlogIndex"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const CategoryHubPage = lazy(() => import("./pages/CategoryHubPage"));
const AlternativePage = lazy(() => import("./pages/AlternativePage"));
const UseCasePage = lazy(() => import("./pages/UseCasePage"));
const WidgetPage = lazy(() => import("./pages/WidgetPage"));
const PressPage = lazy(() => import("./pages/PressPage"));
const AdminOverview = lazy(() => import("@/pages/admin/AdminOverview"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminTools = lazy(() => import("@/pages/admin/AdminTools"));
const AdminAds = lazy(() => import("@/pages/admin/AdminAds"));
const AdminAi = lazy(() => import("@/pages/admin/AdminAi"));
const AdminBilling = lazy(() => import("@/pages/admin/AdminBilling"));

const queryClient = new QueryClient();

function RouteFallback() {
  return (
    <div className="flex min-h-[30vh] items-center justify-center" role="status" aria-live="polite">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

/** Remount tool page when slug changes so SPA navigations reset local state. */
function ToolPageRoute() {
  const { slug } = useParams();
  return (
    <Suspense fallback={<RouteFallback />}>
      <ToolPage key={slug} />
    </Suspense>
  );
}

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
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
    <Route path="install" element={<LazyPage><InstallPage /></LazyPage>} />
    <Route path="premium" element={<LazyPage><PremiumPage /></LazyPage>} />
    <Route path="blog" element={<LazyPage><BlogIndex /></LazyPage>} />
    <Route path="blog/:slug" element={<LazyPage><BlogPost /></LazyPage>} />
    <Route path="privacy" element={<LazyPage><PrivacyPage /></LazyPage>} />
    <Route path="terms" element={<LazyPage><TermsPage /></LazyPage>} />
    <Route path="about" element={<LazyPage><AboutPage /></LazyPage>} />
    <Route path="contact" element={<LazyPage><ContactPage /></LazyPage>} />
    <Route path="alternatives/:slug" element={<LazyPage><AlternativePage /></LazyPage>} />
    <Route path="use-cases/:slug" element={<LazyPage><UseCasePage /></LazyPage>} />
    <Route path="widget" element={<LazyPage><WidgetPage /></LazyPage>} />
    <Route path="press" element={<LazyPage><PressPage /></LazyPage>} />
    <Route path="tools/:category" element={<LazyPage><CategoryHubPage /></LazyPage>} />
    {Object.entries(ROOT_USE_CASE_PATHS).map(([path, slug]) => (
      <Route
        key={path}
        path={path}
        element={
          <LazyPage>
            <UseCasePage slugOverride={slug as UseCaseSlug} />
          </LazyPage>
        }
      />
    ))}
    {Object.entries(ROOT_ALTERNATIVE_PATHS).map(([path, slug]) => (
      <Route
        key={path}
        path={path}
        element={
          <LazyPage>
            <AlternativePage slugOverride={slug as AlternativeSlug} />
          </LazyPage>
        }
      />
    ))}
    <Route
      path="admin"
      element={
        <AdminGuard>
          <AdminLayout />
        </AdminGuard>
      }
    >
      <Route index element={<LazyPage><AdminOverview /></LazyPage>} />
      <Route path="users" element={<LazyPage><AdminUsers /></LazyPage>} />
      <Route path="tools" element={<LazyPage><AdminTools /></LazyPage>} />
      <Route path="billing" element={<LazyPage><AdminBilling /></LazyPage>} />
      <Route path="ads" element={<LazyPage><AdminAds /></LazyPage>} />
      <Route path="ai" element={<LazyPage><AdminAi /></LazyPage>} />
    </Route>
    <Route path=":slug" element={<ToolPageRoute />} />
    <Route path="*" element={<LazyPage><NotFound /></LazyPage>} />
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
          <AdConfigProvider>
          <ScrollToTop />
          <AnalyticsPageTracker />
          <CookieConsent />
          <PwaUpdatePrompt />
          <OnboardingHost />
          <NativeDailyLimitHost />
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
          </AdConfigProvider>
          </ToolConfigProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
