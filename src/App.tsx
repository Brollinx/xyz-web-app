import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import StoreDetailsPage from "./pages/StoreDetailsPage";
import RoutePage from "./pages/RoutePage";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import { GeolocationProvider } from "@/hooks/useGeolocation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <GeolocationProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/search-results" element={<SearchResultsPage />} />
              <Route path="/store/:storeId" element={<StoreDetailsPage />} />
              <Route path="/route" element={<RoutePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </GeolocationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;