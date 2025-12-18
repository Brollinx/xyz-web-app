"use client";

import React from "react";
import { MapPin, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    storeName: string;
    storeAddress: string;
    distance: number;
  };
  isSelected: boolean;
  isFavorited: boolean;
  onToggleFavorite: (e: React.MouseEvent, product: any) => void;
  onMapIconClick: (e: React.MouseEvent, product: any) => void;
  isMobileView: boolean;
  onProductClick: (product: any) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isSelected,
  isFavorited,
  onToggleFavorite,
  onMapIconClick,
  isMobileView,
  onProductClick,
}) => {
  const handleCardClick = () => {
    onProductClick(product);
  };

  return (
    <Card
      className={cn(
        "relative flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-3 p-3 cursor-pointer transition-all duration-200",
        isSelected
          ? "border-2 border-primary shadow-lg"
          : "border border-gray-200 dark:border-gray-700",
        "bg-card text-card-foreground hover:bg-accent/50 dark:hover:bg-accent/20"
      )}
      onClick={handleCardClick}
    >
      <div className="relative w-full h-48 md:w-32 md:h-32 flex-shrink-0 rounded-md overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover rounded-md" // Replaced Next.js Image props with standard img attributes
        />
      </div>
      <CardContent className="flex-grow p-0 text-center md:text-left">
        <h3 className="text-lg font-semibold">{product.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {product.description}
        </p>
        <p className="text-md font-bold mt-1">${product.price.toFixed(2)}</p>
        <div className="flex items-center justify-center md:justify-start text-sm text-muted-foreground mt-1">
          <span className="truncate">{product.storeName}</span>
          {product.distance !== undefined && (
            <>
              <span className="mx-1">•</span>
              <span>{product.distance.toFixed(1)} miles</span>
            </>
          )}
        </div>
      </CardContent>
      <div className="flex flex-row md:flex-col items-center space-x-2 md:space-x-0 md:space-y-2 mt-2 md:mt-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => onMapIconClick(e, product)}
          className="flex-shrink-0 text-primary hover:bg-accent dark:hover:bg-accent/20"
        >
          <MapPin className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => onToggleFavorite(e, product)}
          className={cn(
            "flex-shrink-0",
            isFavorited
              ? "text-red-500 hover:text-red-600"
              : "text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
          )}
        >
          <Heart className={cn("h-5 w-5", isFavorited && "fill-current")} />
        </Button>
      </div>
    </Card>
  );
};

export default ProductCard;