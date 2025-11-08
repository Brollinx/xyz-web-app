import React, { useState, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchResultsLogic } from "@/hooks/useSearchResultsLogic";
import SearchResultsMap from "@/components/SearchResultsMap";
import ProductCardList from "@/components/ProductCardList";
import SearchResultsMobileDrawer from "@/components/SearchResultsMobileDrawer";
import SearchFilterModal from "@/components/SearchFilterModal";
import FloatingControls from "@/components/FloatingControls"; // New floating controls component
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"; // For desktop layout
import mapboxgl from "mapbox-gl";

const SearchResultsPage = () => {
  const isMobile = useIsMobile();
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const {
    initialSearchQuery,
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
      setIsDrawerOpen(true);
    }
  };

  const handleProductCardClick = (product: any) => {
    if (isMobile) {
      setIsDrawerOpen(false);
    }
  };

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

  const floatingControls = (
    <FloatingControls
      initialSearchQuery={initialSearchQuery}
      onSearch={handleSearch}
      onOpenFilters={() => setIsFilterModalOpen(true)}
      isFilterActive={isFilterActive}
      isMobileView={isMobile}
    />
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {isMobile ? (
        <>
          {/* Mobile: Full-screen map as background */}
          <div className="absolute inset-0">
            {mapComponent}
          </div>

          {/* Floating controls */}
          {floatingControls}

          {/* Mobile Drawer for product list */}
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
        </>
      ) : (
        <>
          {/* Desktop: Resizable panels */}
          <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            <ResizablePanel defaultSize={60} minSize={40}>
              <div className="relative h-full w-full">
                {mapComponent}
                {floatingControls} {/* Floating controls over map panel */}
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={40} minSize={30}>
              <div className="h-full w-full p-4 bg-card text-card-foreground shadow-lg overflow-y-auto border-l border-border">
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
            </ResizablePanel>
          </ResizablePanelGroup>
        </>
      )}

      {/* Filter Modal (common for both views) */}
      <SearchFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
};

export default SearchResultsPage;