import React, { useRef, useCallback } from "react";
import { useSearchResultsLogic } from "@/hooks/useSearchResultsLogic";
import SearchFilterModal from "@/components/SearchFilterModal";
import mapboxgl from "mapbox-gl"; // Import mapboxgl for mapRef type
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"; // Corrected import
import SearchResultsMap from "@/components/SearchResultsMap"; // Corrected import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Corrected import
import ProductCardList from "@/components/ProductCardList"; // Corrected import
import { ThemeToggle } from "@/components/ThemeToggle"; // Corrected import
import SearchBar from "@/components/SearchBar"; // Corrected import
import LayoutManager from "@/components/LayoutManager"; // Corrected import
import FavoritesButton from "@/components/FavoritesButton"; // Import FavoritesButton
// Removed: import { useMapLayout } from "@/contexts/MapLayoutContext"; // New import

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
  mapRef: React.MutableRefObject<mapboxgl.Map | null>;
}

const SearchResultsLayout: React.FC<SearchResultsLayoutProps> = (props) => {
  const layout = useResponsiveLayout();
  const isMobileLayout = layout === "mobile"; // Renamed to avoid conflict with render prop 'isMobile'

  const handleMapIconClick = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    props.handleMarkerClick(product);
  };

  const handleProductCardClick = (product: any) => {
    props.setSelectedProductResult(product);
  };

  // Define fitMapToBounds here, as it needs mapRef and layout info
  const fitMapToBounds = useCallback((mapInstance: mapboxgl.Map | null, paddingBottom: number, isMobile: boolean) => {
    if (!mapInstance || props.filteredProducts.length === 0) return;

    const points = props.filteredProducts.map(p => ({
      lat: p.storeLatitude,
      lng: p.storeLongitude,
    }));

    if (props.userLocation) {
      points.push({ lat: props.userLocation.lat, lng: props.userLocation.lng });
    }

    if (points.length === 0) return;

    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;

    for (const point of points) {
      minLng = Math.min(minLng, point.lng);
      minLat = Math.min(minLat, point.lat);
      maxLng = Math.max(maxLng, point.lng);
      maxLat = Math.max(maxLat, point.lat);
    }

    const bounds = [[minLng, minLat], [maxLng, maxLat]] as [[number, number], [number, number]];

    const mapPadding = { top: 50, bottom: 50, left: 50, right: 50 };
    if (isMobile) {
      mapPadding.bottom = paddingBottom + 50; // Add sheet height + extra padding
    }

    mapInstance.fitBounds(bounds, {
      padding: mapPadding,
      duration: 1000,
    });
  }, [props.filteredProducts, props.userLocation]);


  const mapContentRender = useCallback(({ paddingBottom, isMobile }: { paddingBottom: number; isMobile: boolean }) => (
    <SearchResultsMap
      viewState={props.viewState}
      setViewState={props.setViewState}
      mapStyle={props.mapStyle}
      userLocation={props.userLocation}
      uniqueStoresForMarkers={props.uniqueStoresForMarkers}
      selectedProductResult={props.selectedProductResult}
      onMarkerClick={props.handleMarkerClick}
      filteredProducts={props.filteredProducts}
      fitMapToBounds={(mapInstance) => fitMapToBounds(mapInstance, paddingBottom, isMobile)} // Pass layout info
      mapRef={props.mapRef}
    />
  ), [props.viewState, props.setViewState, props.mapStyle, props.userLocation, props.uniqueStoresForMarkers, props.selectedProductResult, props.handleMarkerClick, props.filteredProducts, fitMapToBounds, props.mapRef]);

  // Mobile sheet content will now ONLY contain the product list
  const mobileSheetContentRender = useCallback(({ paddingBottom, isMobile }: { paddingBottom: number; isMobile: boolean }) => (
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
  ), [props.filteredProducts, props.selectedProductResult, props.isFavorited, props.handleToggleFavorite, handleMapIconClick, isMobileLayout, handleProductCardClick]); // Changed isMobile to isMobileLayout

  // Desktop sheet content remains the same
  const desktopSheetContentRender = useCallback(({ paddingBottom, isMobile }: { paddingBottom: number; isMobile: boolean }) => (
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
  ), [props.filteredProducts, props.selectedProductResult, props.isFavorited, props.handleToggleFavorite, handleMapIconClick, isMobileLayout, handleProductCardClick]); // Changed isMobile to isMobileLayout

  return (
    <>
      {isMobileLayout && (
        <>
          {/* Floating Back Button removed for mobile on SearchResultsPage */}
          {/* Floating Favorites Button for mobile, above the map (z-40) */} {/* Changed z-30 to z-40 */}
          <div className="fixed top-4 right-4 z-40">
            <FavoritesButton />
          </div>
          {/* Floating Search Bar for mobile, above the map (z-30) */}
          <div className="fixed top-4 left-0 right-0 z-30">
            <div className="mx-auto max-w-md px-16"> {/* Added px-16 for spacing from FloatingMenu and FavoritesButton */}
              <SearchBar
                initialQuery={props.initialSearchQuery}
                onSearch={props.handleSearch}
                onOpenFilters={() => props.setIsFilterModalOpen(true)}
                isFilterActive={props.isFilterActive}
                placeholder="Search for products..."
              />
            </div>
          </div>
        </>
      )}
      {/* Desktop Search Bar - Rendered for desktop view */}
      {!isMobileLayout && (
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
        mapContent={mapContentRender}
        sheetContent={isMobileLayout ? mobileSheetContentRender : desktopSheetContentRender}
        mapRef={props.mapRef}
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