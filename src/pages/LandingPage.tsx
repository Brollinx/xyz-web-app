import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/SearchBar"; // Corrected import
import SearchFilterModal from "@/components/SearchFilterModal"; // Import the SearchFilterModal
import Logo from "@/assets/Logo.png"; // Import the logo as PNG

const LandingPage = () => {
  const navigate = useNavigate();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [currentProximityFilter, setCurrentProximityFilter] = useState<number | null>(null);
  const [currentMinPriceFilter, setCurrentMinPriceFilter] = useState<number | null>(null);
  const [currentMaxPriceFilter, setCurrentMaxPriceFilter] = useState<number | null>(null);

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
      const params = new URLSearchParams();
      params.set("query", query.trim());
      if (currentProximityFilter !== null) params.set("proximity", String(currentProximityFilter));
      if (currentMinPriceFilter !== null) params.set("minPrice", String(currentMinPriceFilter));
      if (currentMaxPriceFilter !== null) params.set("maxPrice", String(currentMaxPriceFilter));
      navigate(`/search-results?${params.toString()}`);
    }
  }, [navigate, currentProximityFilter, currentMinPriceFilter, currentMaxPriceFilter]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-y-8 bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
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

      {/* Bottom: Three evenly spaced buttons */}
      <div className="w-full max-w-md flex justify-around space-x-4 pb-8">
        <Button
          variant="ghost"
          className="flex-1 text-lg py-6 rounded-lg hover:bg-blue-100 transition-colors"
          onClick={() => navigate("/nearby-stores")}
        >
          Nearby
        </Button>
        <Button
          variant="ghost"
          className="flex-1 text-lg py-6 rounded-lg hover:bg-blue-100 transition-colors"
          onClick={() => navigate("/featured-products")}
        >
          Featured
        </Button>
        <Button
          variant="ghost"
          className="flex-1 text-lg py-6 rounded-lg hover:bg-blue-100 transition-colors"
          onClick={() => navigate("/login")}
        >
          Login
        </Button>
      </div>

      <SearchFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
};

export default LandingPage;