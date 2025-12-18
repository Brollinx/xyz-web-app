import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/SearchBar";
import SearchFilterModal from "@/components/SearchFilterModal";
import RecommendedProductsSection from "@/components/RecommendedProductsSection"; // Import new component
import { useHighPrecisionGeolocation } from "@/hooks/useHighPrecisionGeolocation"; // Import geolocation hook
import { addSearchTerm, getRecentSearchTerms, clearSearchHistory } from "@/utils/searchHistory"; // Import search history utilities
import Logo from "@/assets/Logo.png"; // Import the logo as PNG
import { toast } from "sonner";
import { Trash2 } from "lucide-react"; // Import Trash2 icon

const LandingPage = () => {
  const navigate = useNavigate();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [currentProximityFilter, setCurrentProximityFilter] = useState<number | null>(null);
  const [currentMinPriceFilter, setCurrentMinPriceFilter] = useState<number | null>(null);
  const [currentMaxPriceFilter, setCurrentMaxPriceFilter] = useState<number | null>(null);
  const [recentSearchTerms, setRecentSearchTerms] = useState<string[]>([]);

  const { userLocation, loading: loadingLocation, locationStatus } = useHighPrecisionGeolocation();

  // Load recent search terms on component mount
  useEffect(() => {
    setRecentSearchTerms(getRecentSearchTerms());
  }, []);

  // Determine if any filter is active for visual highlighting
  const isFilterActive = useMemo(() => {
    return currentProximityFilter !== null || currentMinPriceFilter !== null || currentMaxPriceFilter !== null;
  }, [currentProximityFilter, currentMinPriceFilter, currentMaxPriceFilter]);

  const handleApplyFilters = useCallback((proximity: number | null, minPrice: number | null, maxPrice: number | null) => {
    setCurrentProximityFilter(proximity);
    setCurrentMinPriceFilter(minPrice);
    setCurrentMaxPriceFilter(maxPrice);
  }, []);

  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      addSearchTerm(query.trim()); // Save search term
      setRecentSearchTerms(getRecentSearchTerms()); // Update recent searches state
      const params = new URLSearchParams();
      params.set("query", query.trim());
      if (currentProximityFilter !== null) params.set("proximity", String(currentProximityFilter));
      if (currentMinPriceFilter !== null) params.set("minPrice", String(currentMinPriceFilter));
      if (currentMaxPriceFilter !== null) params.set("maxPrice", String(currentMaxPriceFilter));
      navigate(`/search-results?${params.toString()}`);
    }
  }, [navigate, currentProximityFilter, currentMinPriceFilter, currentMaxPriceFilter]);

  const handleClearSearchHistory = useCallback(() => {
    clearSearchHistory();
    setRecentSearchTerms([]);
    toast.info("Search history cleared!");
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-y-8 p-4 bg-background"> {/* Added bg-background */}
      {/* Top: Logo */}
      <div className="flex items-center justify-center">
        <img src={Logo} alt="Company Logo" className="h-24 w-24 object-contain" />
      </div>

      {/* Middle: Google-like Search Bar with integrated filter */}
      <div className="flex flex-col items-center justify-center w-full max-w-2xl px-4">
        <SearchBar
          onSearch={handleSearch}
          onOpenFilters={() => setIsFilterModalOpen(true)}
          isFilterActive={isFilterActive}
          placeholder="Search for products..."
        />
      </div>

      {/* Removed the three navigation buttons from here */}

      {/* Recommended Products Section - Moved below buttons */}
      <RecommendedProductsSection
        userLocation={userLocation}
        proximityFilter={currentProximityFilter}
        recentSearchTerms={recentSearchTerms}
      />

      {recentSearchTerms.length > 0 && (
        <Button
          variant="outline"
          className="mt-4"
          onClick={handleClearSearchHistory}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Clear Search History
        </Button>
      )}

      <SearchFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
      />

      {/* Footer Text - Adjusted position and size */}
      <div className="mt-8 w-full text-center text-gray-600 dark:text-gray-400 text-sm font-medium pb-4">
        Search for products from nearby stores in real-time
      </div>
    </div>
  );
};

export default LandingPage;