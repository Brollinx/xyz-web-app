"use client";

import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger, // Keep Trigger for initial drag handle, but drawer will be open by default
  DrawerOverlay,
  DrawerPortal,
  DrawerDescription,
} from "@/components/ui/drawer";
import ProductCardList from "@/components/ProductCardList";
import { ProductWithStoreInfo } from "@/hooks/useSearchResultsLogic";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchResultsMobileDrawerProps {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  filteredProducts: ProductWithStoreInfo[];
  selectedProductResult: ProductWithStoreInfo | null;
  isFavorited: (productId: string) => boolean;
  onToggleFavorite: (e: React.MouseEvent, product: ProductWithStoreInfo) => void;
  onMapIconClick: (e: React.MouseEvent, product: ProductWithStoreInfo) => void;
  onProductClick: (product: ProductWithStoreInfo) => void;
}

const SearchResultsMobileDrawer: React.FC<SearchResultsMobileDrawerProps> = ({
  isDrawerOpen,
  setIsDrawerOpen,
  filteredProducts,
  selectedProductResult,
  isFavorited,
  onToggleFavorite,
  onMapIconClick,
  onProductClick,
}) => {
  return (
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} snapPoints={[0.5, 0.9]}> {/* Starts at 50% height */}
      <DrawerPortal>
        <DrawerOverlay className="fixed inset-0 bg-black/20" /> {/* Subtle overlay */}
        <DrawerContent className="fixed bottom-0 left-0 right-0 mt-24 flex h-[90%] flex-col rounded-t-[10px] bg-background/90 backdrop-blur-sm"> {/* Semi-transparent background */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/50 mt-3" />
          <DrawerHeader className="text-center">
            <DrawerTitle className="text-foreground">Matching Products & Stores</DrawerTitle>
            <DrawerDescription className="text-muted-foreground">
              Tap a product to see details or a map pin to recenter.
            </DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="h-full w-full">
            <div className="pb-3">
              <ProductCardList
                products={filteredProducts}
                selectedProductResult={selectedProductResult}
                isFavorited={isFavorited}
                onToggleFavorite={onToggleFavorite}
                onMapIconClick={onMapIconClick}
                isMobileView={true}
                onProductClick={onProductClick}
              />
            </div>
          </ScrollArea>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
};

export default SearchResultsMobileDrawer;