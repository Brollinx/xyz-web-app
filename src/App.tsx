import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import StoreDetailsPage from "./pages/StoreDetailsPage";
import RoutePage from "./pages/RoutePage";
import ShoppingCartPage from "./pages/ShoppingCartPage"; // Import the new page
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import { CartProvider } from "@/context/CartContext"; // Updated import to use alias

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CartProvider> {/* Wrap the entire app with CartProvider */}
          <Layout>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/search-results" element={<SearchResultsPage />} />
              <Route path="/store/:storeId" element={<StoreDetailsPage />} />
              <Route path="/route" element={<RoutePage />} />
              <Route path="/shopping-list" element={<ShoppingCartPage />} /> {/* Add the new route */}
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </CartProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;