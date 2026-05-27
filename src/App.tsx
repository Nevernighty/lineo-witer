import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import InfoPage from "./pages/InfoPage";
import TurbineAnalysis from "./pages/TurbineAnalysis";

const BladeLab = lazy(() => import("./pages/BladeLab"));

const queryClient = new QueryClient();

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-background text-primary text-sm">Loading…</div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/info" element={<InfoPage />} />
            <Route path="/turbine" element={<TurbineAnalysis />} />
            <Route path="/blade-lab" element={<BladeLab />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;