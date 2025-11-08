import React, { useState, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchResultsLogic } from "@/hooks/useSearchResultsLogic"; // Import the custom hook
import SearchResultsHeader from "@/components/SearchResultsHeader";
import SearchResultsMap from "@/components/SearchResultsMap";
import ProductCardList from "@/components/ProductCardList";
import SearchResultsMobileDrawer from "@/components/SearchResultsMobileDrawer";
import SearchFilterModal from "@/components/SearchFilterModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import mapboxgl from "mapbox-gl";

const SearchResultsPage = () => {
  const isMobile = useIsMobile();
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // State for controlling the drawer

  const {
    initialSearchQuery,
    currentSearchQuery, // Keep if needed for debug or future features
    viewState,
    setViewState,
    selectedProductResult,
    setSelectedProductResult,
    filteredProducts,
    isFilterModalOpen,
    setIsFilterModalOpen,
    currentProximityFilter,
    currentMinPriceFilter,
    currentMaxPriceFilter,
    isFilterActive,
    userLocation,
    loadingLocation,
    locationStatus,
    refreshLocation,
    isFavorited,
    handleMarkerClick,
    handleToggleFavorite,
    handleApplyFilters,
    handleSearch,
    uniqueStoresForMarkers,
    mapStyle,
    fitMapToBounds,
  } = useSearchResultsLogic();

  const handleMapIconClick = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    handleMarkerClick(product);
    if (isMobile) {
      setIsDrawerOpen(true); // Open drawer on map icon click for mobile
    }
  };

  const handleProductCardClick = (product: any) => {
    // This function is passed to ProductCardList to handle navigation and potentially close the drawer
    // Navigation is handled inside ProductCardList, so here we just ensure the drawer closes if mobile
    if (isMobile) {
      setIsDrawerOpen(false);
    }
  };

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden">
      {/* Common Header */}
      <div className="absolute top-0 left-0 w-full p-4 z-10 bg-background/80 backdrop-blur-sm">
        <SearchResultsHeader
          initialSearchQuery={initialSearchQuery}
          onSearch={handleSearch}
          onOpenFilters={() => setIsFilterModalOpen(true)}
          isFilterActive={isFilterActive}
          loadingLocation={loadingLocation}
          userLocation={userLocation}
          locationStatus={locationStatus}
          refreshLocation={refreshLocation}
        />
      </div>

      {/* Map Component */}
      <div className={isMobile ? "flex-grow w-full h-full mt-[180px] md:mt-0" : "w-1/2 flex-grow h-full"}>
        <SearchResultsMap
          viewState={viewState}
          setViewState={setViewState}
          mapStyle={mapStyle}
          userLocation={userLocation}
          uniqueStoresForMarkers={uniqueStoresForMarkers}
          selectedProductResult={selectedProductResult}
          onMarkerClick={handleMarkerClick}
          filteredProducts={filteredProducts}
          fitMapToBounds={fitMapToBounds}
        />
      </div>

      {/* Product List / Drawer */}
      {isMobile ? (
        <SearchResultsMobileDrawer
          isDrawerOpen={isDrawerOpen}
          setIsDrawerOpen={setIsDrawerOpen}
          filteredProducts={filteredProducts}
          selectedProductResult={selectedProductResult}
          isFavorited={isFavorited}
          onToggleFavorite={handleToggleFavorite}
          onMapIconClick={handleMapIconClick}
          onProductClick={handleProductCardClick}
        />
      ) : (
        <div className="w-1/2 h-full p-4 bg-card text-card-foreground shadow-lg overflow-y-auto border-l border-border">
          <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
            <CardHeader className="p-2 pb-1">
              <CardTitle className="text-lg">Matching Products & Stores</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow p-0">
              <ProductCardList
                products={filteredProducts}
                selectedProductResult={selectedProductResult}
                isFavorited={isFavorited}
                onToggleFavorite={handleToggleFavorite}
                onMapIconClick={handleMapIconClick}
                isMobileView={false}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Modal */}
      <SearchFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
};

export default SearchResultsPage;