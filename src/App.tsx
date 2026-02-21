import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ScrollToTop } from "@/components/ScrollToTop";
import { LocaleProvider } from "@/lib/i18n";
import Index from "./pages/Index";
import ToolPage from "./pages/ToolPage";
import InstallPage from "./pages/InstallPage";
import PremiumPage from "./pages/PremiumPage";
import BlogIndex from "./pages/BlogIndex";
import BlogPost from "./pages/BlogPost";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function LocaleRoutes() {
  return (
    <LocaleProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/install" element={<InstallPage />} />
        <Route path="/premium" element={<PremiumPage />} />
        <Route path="/blog" element={<BlogIndex />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/:slug" element={<ToolPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </LocaleProvider>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Locale-prefixed routes */}
            <Route path="/:locale/*" element={<LocaleRoutes />} />
            {/* Hebrew (default, no prefix) */}
            <Route path="/*" element={<LocaleRoutes />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
