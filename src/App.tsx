import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import StoreDetailsPage from "./pages/StoreDetailsPage";
import RoutePage from "./pages/RoutePage";
import NearbyStoresPage from "./pages/NearbyStoresPage";
import FeaturedProductsPage from "./pages/FeaturedProductsPage";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup"; // Import new Signup page
import ProfilePage from "./pages/ProfilePage";
import AppSettings from "./pages/AppSettings";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/search-results" element={<SearchResultsPage />} />
            <Route path="/store/:storeId" element={<StoreDetailsPage />} />
            <Route path="/route" element={<RoutePage />} />
            <Route path="/nearby-stores" element={<NearbyStoresPage />} />
            <Route path="/featured-products" element={<FeaturedProductsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} /> {/* New route for signup */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<AppSettings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;