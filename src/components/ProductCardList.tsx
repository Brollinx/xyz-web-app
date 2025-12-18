"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Phone } from "lucide-react";
import { cn, getStoreStatus } from "@/lib/utils";
import { ProductWithStoreInfo } from "@/hooks/useSearchResultsLogic"; // Import the interface

interface ProductCardListProps {
  products: ProductWithStoreInfo[];
  selectedProductResult: ProductWithStoreInfo | null;
  isFavorited: (productId: string) => boolean;
  onToggleFavorite: (e: React.MouseEvent, product: ProductWithStoreInfo) => void;
  onMapIconClick: (e: React.MouseEvent, product: ProductWithStoreInfo) => void;
  isMobileView: boolean;
  onProductClick?: (product: ProductWithStoreInfo) => void; // Optional for mobile drawer to close
}

const ProductCardList: React.FC<ProductCardListProps> = ({
  products,
  selectedProductResult,
  isFavorited,
  onToggleFavorite,
  onMapIconClick,
  isMobileView,
  onProductClick,
}) => {
  const navigate = useNavigate();

  const handleProductCardClick = (product: ProductWithStoreInfo) => {
    navigate(`/store/${product.storeId}?product=${product.productId}`);
    if (onProductClick) {
      onProductClick(product);
    }
  };

  return (
    <div className="h-full w-full"> {/* This div now acts as the scrollable container */}
      <div className="p-4 space-y-0">
        {products.length > 0 ? (
          products.map((product) => {
            const { statusText: storeStatusText, isOpen: isStoreOpen } = getStoreStatus(product.storeOpeningHours);
            return (
              <div
                key={product.productId}
                className={cn(
                  "flex items-center py-2 px-3 cursor-pointer transition-colors hover:bg-accent/50",
                  selectedProductResult?.productId === product.productId && "bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500",
                  !isMobileView && "border-b border-border"
                )}
                onClick={() => handleProductCardClick(product)}
              >
                {/* Product Image */}
                <img
                  src={product.productImageUrl || "/placeholder.svg"}
                  alt={product.productName}
                  className="h-16 w-16 object-cover rounded-md flex-shrink-0 mr-3"
                />

                {/* Right-side info block */}
                <div className="flex-grow min-w-0">
                  <h4 className="font-bold text-base truncate">{product.productName}</h4>
                  <p className="text-sm text-muted-foreground truncate">{product.storeName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {product.storeAddress.split(' ').slice(0, 2).join(' ')}{product.storeAddress.split(' ').length > 2 ? '...' : ''}
                  </p>
                  <div className="flex items-center flex-wrap gap-x-2 text-xs mt-1">
                    <span className={cn("font-semibold", product.stockQuantity > 0 ? "text-green-500" : "text-red-500")}>
                      {product.stockQuantity > 0 ? "🟢 In Stock" : "🔴 Out of Stock"}
                    </span>
                    <span className="font-bold text-brand-accent">
                      {product.currency_symbol}{product.productPrice.toFixed(2)}
                    </span>
                    {product.formattedDistance !== undefined && (
                      <span className="text-muted-foreground">{product.formattedDistance}</span>
                    )}
                    <span className={cn("font-semibold", isStoreOpen ? "text-green-500" : "text-muted-foreground")}>
                      {storeStatusText}
                    </span>
                  </div>
                </div>

                {/* Icons on far right */}
                <div className="flex flex-col items-end ml-auto pl-2 space-y-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => onToggleFavorite(e, product)}
                    className="h-8 w-8 p-0"
                  >
                    <Heart
                      className={cn(
                        "h-5 w-5",
                        isFavorited(product.productId) ? "text-red-500 fill-red-500" : "text-muted-foreground"
                      )}
                    />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={(e) => onMapIconClick(e, product)} className="h-8 w-8 p-0">
                    <MapPin className="h-5 w-5 text-blue-600" /> {/* Restored MapPin icon */}
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-muted-foreground mt-8 p-4">No matching products or stores found.</p>
        )}
      </div>
    </div>
  );
};

export default ProductCardList;