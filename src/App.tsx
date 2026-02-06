import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import SetupPage from "./pages/SetupPage";
import AdminPanel from "./pages/AdminPanel";
import OverlayPage from "./pages/OverlayPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

import { useSupabaseSync } from "./hooks/useSupabaseSync";

const App = () => {
  useSupabaseSync();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/admin/:matchId" element={<AdminPanel />} />
            <Route path="/overlay/:matchId" element={<OverlayPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
