"use client";

import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerOverlay,
  DrawerPortal,
  DrawerDescription,
} from "@/components/ui/drawer";
import ProductCardList from "@/components/ProductCardList"; // Corrected import to default
import { ProductWithStoreInfo } from "@/hooks/useSearchResultsLogic"; // Import the interface

interface SearchResultsMobileDrawerProps {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  filteredProducts: ProductWithStoreInfo[];
  selectedProductResult: ProductWithStoreInfo | null;
  isFavorited: (productId: string) => boolean;
  onToggleFavorite: (e: React.MouseEvent, product: ProductWithStoreInfo) => void;
  onMapIconClick: (e: React.MouseEvent, product: ProductWithStoreInfo) => void;
  onProductClick: (product: ProductWithStoreInfo) => void; // To close drawer on product click
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
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} snapPoints={[0.3, 0.9]}>
      <DrawerTrigger asChild>
        <div className="absolute bottom-0 left-0 right-0 h-[30vh] bg-background rounded-t-2xl shadow-lg flex flex-col items-center pt-2 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-muted-foreground/50 rounded-full mb-2" />
          <h2 className="text-lg font-semibold text-foreground">
            {filteredProducts.length} Products Found
          </h2>
        </div>
      </DrawerTrigger>
      <DrawerPortal>
        <DrawerOverlay className="fixed inset-0 bg-black/40" />
        <DrawerContent className="fixed bottom-0 left-0 right-0 mt-24 flex h-[90%] flex-col rounded-t-[10px] bg-background">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/50 mt-3" />
          <DrawerHeader className="text-center">
            <DrawerTitle className="text-foreground">Matching Products & Stores</DrawerTitle>
            <DrawerDescription className="text-muted-foreground">
              Tap a product to see details or a map pin to recenter.
            </DrawerDescription>
          </DrawerHeader>
          <ProductCardList
            products={filteredProducts}
            selectedProductResult={selectedProductResult}
            isFavorited={isFavorited}
            onToggleFavorite={onToggleFavorite}
            onMapIconClick={onMapIconClick}
            isMobileView={true}
            onProductClick={() => setIsDrawerOpen(false)} // Close drawer on product click
          />
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
};

export default SearchResultsMobileDrawer;