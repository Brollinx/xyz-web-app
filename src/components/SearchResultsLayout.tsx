import React from "react";
import LayoutManager from "@/components/LayoutManager";
import SearchResultsMap from "@/components/SearchResultsMap";
import ProductCardList from "@/components/ProductCardList";
import SearchFilterModal from "@/components/SearchFilterModal";
import FloatingControls from "@/components/FloatingControls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useSearchResultsLogic } from "@/hooks/useSearchResultsLogic";

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
  const [isSheetOpen, setIsSheetOpen] = React.useState(true); // Mobile drawer starts open

  const handleMapIconClick = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    props.handleMarkerClick(product);
    if (isMobile) {
      setIsSheetOpen(true);
    }
  };

  const handleProductCardClick = (product: any) => {
    props.setSelectedProductResult(product);
    if (isMobile) {
      // Optionally close drawer or just let it be
      // setIsSheetOpen(false);
    }
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

  const sheetContent = (
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

  const floatingControls = (
    <FloatingControls
      initialSearchQuery={props.initialSearchQuery}
      onSearch={props.handleSearch}
      onOpenFilters={() => props.setIsFilterModalOpen(true)}
      isFilterActive={props.isFilterActive}
      isMobileView={isMobile}
    />
  );

  return (
    <>
      <LayoutManager
        mapContent={mapContent}
        sheetContent={sheetContent}
        floatingControls={floatingControls}
        isSheetOpen={isSheetOpen}
        onSheetOpenChange={setIsSheetOpen}
        sheetSnapPoints={[0.5, 0.9]}
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