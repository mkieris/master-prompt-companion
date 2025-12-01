import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import Index from "./pages/Index";
import BasicVersion from "./pages/BasicVersion";
import ProVersion from "./pages/ProVersion";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import SEOCheck from "./pages/SEOCheck";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import DomainLearning from "./pages/DomainLearning";
import Projects from "./pages/Projects";
import ContentPlanner from "./pages/ContentPlanner";
import AIContentCreator from "./pages/AIContentCreator";
import SEOTraining from "./pages/SEOTraining";
import GenerationHistory from "./pages/GenerationHistory";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index session={session} />} />
            <Route path="/basic" element={<BasicVersion session={session} />} />
            <Route path="/pro" element={<ProVersion session={session} />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/seo-check" element={<SEOCheck session={session} />} />
            <Route path="/onboarding" element={<Onboarding session={session} />} />
            <Route path="/dashboard" element={<Dashboard session={session} />}>
              <Route path="domain" element={<DomainLearning session={session} />} />
              <Route path="projects" element={<Projects session={session} />} />
              <Route path="planner" element={<ContentPlanner session={session} />} />
              <Route path="ai-content" element={<AIContentCreator session={session} />} />
              <Route path="seo-training" element={<SEOTraining session={session} />} />
              <Route path="history" element={<GenerationHistory />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
