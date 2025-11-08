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

  // Common Map Component wrapper
  const mapComponent = (
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
  );

  // Common Header Component wrapper
  const commonHeader = (
    <SearchResultsHeader
      initialSearchQuery={initialSearchQuery}
      onSearch={handleSearch}
      onOpenFilters={() => setIsFilterModalOpen(true)}
      isFilterActive={isFilterActive}
      loadingLocation={loadingLocation}
      userLocation={userLocation}
      locationStatus={locationStatus}
      refreshLocation={refreshLocation}
      isMobileView={isMobile} // Pass isMobileView prop
    />
  );

  if (isMobile) {
    return (
      <div className="relative h-screen w-screen overflow-hidden flex flex-col"> {/* Use flex-col for explicit stacking */}
        {/* Map section - takes 70% of viewport height */}
        <div className="relative w-full h-[70vh]"> {/* Explicit height for map container */}
          {mapComponent} {/* Map fills this container */}
          {/* Header overlays the map */}
          <div className="absolute top-0 left-0 w-full p-4 z-10 bg-background/80 backdrop-blur-sm">
            {commonHeader}
          </div>
        </div>

        {/* Mobile Drawer - will overlay the bottom part of the map and the space below it */}
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

        <SearchFilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          onApplyFilters={handleApplyFilters}
        />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <div className="p-4 bg-background/80 backdrop-blur-sm z-10">
        {commonHeader}
      </div>
      <div className="flex-grow w-full h-[60vh]"> {/* Map takes 60% of remaining height */}
        {mapComponent}
      </div>
      <div className="flex-grow w-full p-4 bg-card text-card-foreground shadow-lg overflow-y-auto border-t border-border"> {/* List takes remaining height */}
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
      <SearchFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
};

export default SearchResultsPage;