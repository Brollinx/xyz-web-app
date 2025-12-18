"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Loader2, Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { calculateDistance, formatDistance, cn } from "@/lib/utils";
import { recommendationMapping } from "@/utils/recommendationMapping";
import { useFavorites } from "@/hooks/use-favorites";
import { Button } from "@/components/ui/button";

interface ProductWithStoreInfo {
  productId: string;
  productName: string;
  productPrice: number;
  stockQuantity: number;
  productImageUrl?: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  storeLatitude: number;
  storeLongitude: number;
  currency: string;
  currency_symbol?: string;
  distanceMeters?: number;
  formattedDistance?: string;
}

interface RecommendedProductsSectionProps {
  userLocation: { lat: number; lng: number; accuracy_meters: number } | null;
  proximityFilter: number | null; // In meters
  recentSearchTerms: string[];
}

const RecommendedProductsSection: React.FC<RecommendedProductsSectionProps> = ({
  userLocation,
  proximityFilter,
  recentSearchTerms,
}) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductWithStoreInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionTitle, setSectionTitle] = useState("Suggested Nearby"); // Changed default title
  const { isFavorited, addFavorite, removeFavorite } = useFavorites();

  const fetchProducts = useCallback(async (terms: string[], isFallback: boolean) => {
    setLoading(true);
    try {
      let productQuery = supabase
        .from('products')
        .select(`
          id, name, price, stock_quantity, is_active, image_url, currency, currency_symbol,
          stores (id, store_name, address, latitude, longitude, is_active)
        `)
        .eq('is_active', true);

      if (isFallback) {
        productQuery = productQuery.order('created_at', { ascending: false }).limit(10);
      } else if (terms.length > 0) {
        const recommendedKeywords = new Set<string>();
        terms.forEach(term => {
          const lowerTerm = term.toLowerCase();
          if (recommendationMapping[lowerTerm]) {
            recommendationMapping[lowerTerm].forEach(keyword => recommendedKeywords.add(keyword));
          }
          recommendedKeywords.add(lowerTerm);
        });

        if (recommendedKeywords.size > 0) {
          const keywordArray = Array.from(recommendedKeywords).map(k => `%${k}%`);
          productQuery = productQuery.or(`name.ilike.any.{${keywordArray.join(',')}},category.ilike.any.{${keywordArray.join(',')}}`);
        } else {
          productQuery = productQuery.order('created_at', { ascending: false }).limit(10);
          setSectionTitle("Popular Products Around You");
        }
      } else {
        productQuery = productQuery.order('created_at', { ascending: false }).limit(10);
        setSectionTitle("Popular Products Around You");
      }

      const { data, error } = await productQuery;

      if (error) throw error;

      let fetchedProducts: ProductWithStoreInfo[] = data
        .filter((product: any) => product.stores && product.stores.is_active && product.stores.latitude !== null && product.stores.longitude !== null)
        .map((product: any) => ({
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          stockQuantity: product.stock_quantity,
          productImageUrl: product.image_url,
          currency: product.currency || 'USD',
          currency_symbol: product.currency_symbol || '$',
          storeId: product.stores.id,
          storeName: product.stores.store_name,
          storeAddress: product.stores.address,
          storeLatitude: product.stores.latitude,
          storeLongitude: product.stores.longitude,
        }));

      if (userLocation) {
        fetchedProducts = fetchedProducts
          .map(product => {
            const distanceInMeters = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              product.storeLatitude,
              product.storeLongitude
            );
            return {
              ...product,
              distanceMeters: distanceInMeters,
              formattedDistance: formatDistance(distanceInMeters),
            };
          })
          .filter(product => (proximityFilter === null || (product.distanceMeters ?? Infinity) <= proximityFilter))
          .sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
      } else {
        fetchedProducts = fetchedProducts.sort((a, b) => a.productName.localeCompare(b.productName));
      }

      setProducts(fetchedProducts);
      if (fetchedProducts.length === 0 && !isFallback) {
        setSectionTitle("Popular Products Around You");
        await fetchProducts([], true);
      } else if (fetchedProducts.length === 0 && isFallback) {
        toast.info("No products found for recommendations or popular items.");
      }
    } catch (error) {
      console.error("Error fetching recommended products:", error);
      toast.error("Failed to load recommendations.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [userLocation, proximityFilter, recommendationMapping]);

  useEffect(() => {
    if (recentSearchTerms.length > 0) {
      setSectionTitle("Based on Your Last Searches");
      fetchProducts(recentSearchTerms, false);
    } else {
      setSectionTitle("Suggested Nearby"); // Revert to "Suggested Nearby" for popular
      fetchProducts([], true);
    }
  }, [recentSearchTerms, userLocation, proximityFilter, fetchProducts]);

  const handleToggleFavorite = (e: React.MouseEvent, product: ProductWithStoreInfo) => {
    e.stopPropagation();
    if (isFavorited(product.productId)) {
      removeFavorite(product.productId);
    } else {
      addFavorite({
        product_id: product.productId,
        store_id: product.storeId,
        product_name: product.productName,
        price: product.productPrice,
        image_url: product.productImageUrl,
        store_name: product.storeName,
        currency: product.currency,
        currency_symbol: product.currency_symbol,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="ml-2 text-sm text-gray-600">Loading suggestions...</p>
      </div>
    );
  }

  // Automatically collapse if no products
  if (products.length === 0) {
    return null;
  }

  return (
    <Card className="w-full max-w-4xl border-none shadow-none bg-transparent p-0"> {/* Minimal card styling */}
      <CardHeader className="p-2 pb-1">
        <CardTitle className="text-base font-medium text-gray-700 dark:text-gray-300">{sectionTitle}</CardTitle> {/* Slightly lighter in dark theme */}
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="w-full whitespace-nowrap rounded-md border-none max-h-[180px]"> {/* Reduced height, no border */}
          <div className="flex w-max space-x-3 p-2"> {/* Reduced spacing and padding */}
            {products.map((product) => (
              <div
                key={product.productId}
                className="relative w-[100px] flex-shrink-0 p-1 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors flex flex-col justify-between" // Dark-friendly hover
                onClick={() => navigate(`/store/${product.storeId}?product=${product.productId}`)}
              >
                <img
                  src={product.productImageUrl || "/placeholder.svg"}
                  alt={product.productName}
                  className="w-full h-20 object-cover rounded-md mb-1" // Smaller image
                />
                <div className="flex-grow flex flex-col justify-between">
                  <h4 className="font-medium text-xs truncate mb-1">{product.productName}</h4> {/* Smaller font */}
                  <p className="text-xs font-semibold text-green-600">
                    {product.currency_symbol}{product.productPrice.toFixed(2)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleToggleFavorite(e, product)}
                  className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full bg-white/70 hover:bg-white dark:bg-black/40 dark:hover:bg-black/50" // Subtle, smaller button with dark-friendly background
                >
                  <Heart
                    className={cn(
                      "h-3 w-3", // Smaller icon
                      isFavorited(product.productId) ? "text-red-500 fill-red-500" : "text-gray-400"
                    )}
                  />
                </Button>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecommendedProductsSection;