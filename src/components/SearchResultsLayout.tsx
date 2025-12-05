"use client";

import React from "react";
import LayoutManager from "@/components/LayoutManager";
import SearchResultsMap from "@/components/SearchResultsMap";
import ProductCardList from "@/components/ProductCardList";
import SearchFilterModal from "@/components/SearchFilterModal";
import SearchBar from "@/components/SearchBar"; // Use SearchBar directly
import FloatingBackButton from "@/components/FloatingBackButton"; // Import FloatingBackButton
import { ThemeToggle } from "@/components/ThemeToggle"; // Import ThemeToggle
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useSearchResultsLogic } from "@/hooks/useSearchResultsLogic";
import { cn } from "@/lib/utils"; // For z-index

interface SearchResultsLayoutProps {
  // All props from useSearchResultsLogic
  initialSearchQuery: string;
  currentSearchQuery: string;
  viewState: any;
  setViewState: (viewState: any) => void;
  selectedProductResult: any;
  setSelectedProductResult: (product: any) => void;
  filteredProducts: any[];
  isFilterModalOpen: boolean;
  setIsFilterModalOpen: (open: boolean) => void;
  currentProximityFilter: number | null;
  currentMinPriceFilter: number | null;
  currentMaxPriceFilter: number | null;
  isFilterActive: boolean;
  userLocation: any;
  loadingLocation: boolean;
  locationStatus: string;
  refreshLocation: () => void;
  isFavorited: (productId: string) => boolean;
  handleMarkerClick: (product: any) => void;
  handleToggleFavorite: (e: React.MouseEvent, product: any) => void;
  handleApplyFilters: (proximity: number | null, minPrice: number | null, maxPrice: number | null) => void;
  handleSearch: (query: string) => void;
  uniqueStoresForMarkers: any[];
  mapStyle: string;
  fitMapToBounds: (mapInstance: any) => void;
}

const SearchResultsLayout: React.FC<SearchResultsLayoutProps> = (props) => {
  const layout = useResponsiveLayout();
  const isMobile = layout === "mobile";

  const handleMapIconClick = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    props.handleMarkerClick(product);
  };

  const handleProductCardClick = (product: any) => {
    props.setSelectedProductResult(product);
  };

  const mapContent = (
    <SearchResultsMap
      viewState={props.viewState}
      setViewState={props.setViewState}
      mapStyle={props.mapStyle}
      userLocation={props.userLocation}
      uniqueStoresForMarkers={props.uniqueStoresForMarkers}
      selectedProductResult={props.selectedProductResult}
      onMarkerClick={props.handleMarkerClick}
      filteredProducts={props.filteredProducts}
      fitMapToBounds={props.fitMapToBounds}
    />
  );

  // Mobile sheet content will now ONLY contain the product list
  const mobileSheetContent = (
    <div className="p-4 space-y-4 bg-background text-foreground"> {/* Ensure theme-adaptive background */}
      <Card className="flex flex-col border-none shadow-none bg-transparent">
        <CardHeader className="p-2 pb-1">
          <CardTitle className="text-lg">Matching Products & Stores</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow p-0">
          <ProductCardList
            products={props.filteredProducts}
            selectedProductResult={props.selectedProductResult}
            isFavorited={props.isFavorited}
            onToggleFavorite={props.handleToggleFavorite}
            onMapIconClick={handleMapIconClick}
            isMobileView={isMobile}
            onProductClick={handleProductCardClick}
          />
        </CardContent>
      </Card>
    </div>
  );

  // Desktop sheet content remains the same
  const desktopSheetContent = (
    <div className="h-full w-full p-4">
      <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
        <CardHeader className="p-2 pb-1">
          <CardTitle className="text-lg">Matching Products & Stores</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow p-0">
          <ProductCardList
            products={props.filteredProducts}
            selectedProductResult={props.selectedProductResult}
            isFavorited={props.isFavorited}
            onToggleFavorite={props.handleToggleFavorite}
            onMapIconClick={handleMapIconClick}
            isMobileView={isMobile}
            onProductClick={handleProductCardClick}
          />
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      {isMobile && (
        <>
          {/* Floating Back Button removed for mobile on SearchResultsPage */}
          {/* Floating Theme Toggle for mobile, above the map (z-30) */}
          <div className="fixed top-4 right-4 z-30">
            <ThemeToggle />
          </div>
          {/* Floating Search Bar for mobile, above the map (z-30) */}
          <div className="fixed top-4 left-[64px] right-[56px] z-30"> {/* Adjusted left for more spacing */}
            <SearchBar
              initialQuery={props.initialSearchQuery}
              onSearch={props.handleSearch}
              onOpenFilters={() => props.setIsFilterModalOpen(true)}
              isFilterActive={props.isFilterActive}
              placeholder="Search for products..."
            />
          </div>
        </>
      )}
      {/* Desktop Search Bar - Rendered for desktop view */}
      {!isMobile && (
        <div className="fixed top-4 left-[25%] -translate-x-1/2 z-30 w-full max-w-md">
          <SearchBar
            initialQuery={props.initialSearchQuery}
            onSearch={props.handleSearch}
            onOpenFilters={() => props.setIsFilterModalOpen(true)}
            isFilterActive={props.isFilterActive}
            placeholder="Search for products..."
          />
        </div>
      )}
      <LayoutManager
        mapContent={mapContent}
        sheetContent={isMobile ? mobileSheetContent : desktopSheetContent}
      />
      <SearchFilterModal
        isOpen={props.isFilterModalOpen}
        onClose={() => props.setIsFilterModalOpen(false)}
        onApplyFilters={props.handleApplyFilters}
      />
    </>
  );
};

export default SearchResultsLayout;