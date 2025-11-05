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
import { Button } from "@/components/ui/button"; // Added missing import

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
  const [sectionTitle, setSectionTitle] = useState("Recommended for You");
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
        // For fallback, just get a few active products, maybe ordered by creation date
        productQuery = productQuery.order('created_at', { ascending: false }).limit(10);
      } else if (terms.length > 0) {
        // Build a list of recommended keywords/categories
        const recommendedKeywords = new Set<string>();
        terms.forEach(term => {
          const lowerTerm = term.toLowerCase();
          if (recommendationMapping[lowerTerm]) {
            recommendationMapping[lowerTerm].forEach(keyword => recommendedKeywords.add(keyword));
          }
          // Also consider the original search term itself for recommendations
          recommendedKeywords.add(lowerTerm);
        });

        if (recommendedKeywords.size > 0) {
          // Search for products whose names or categories match recommended keywords
          const keywordArray = Array.from(recommendedKeywords).map(k => `%${k}%`);
          productQuery = productQuery.or(`name.ilike.any.{${keywordArray.join(',')}},category.ilike.any.{${keywordArray.join(',')}}`);
        } else {
          // If no specific recommendations, fall back to popular
          productQuery = productQuery.order('created_at', { ascending: false }).limit(10);
          setSectionTitle("Popular Products Around You");
        }
      } else {
        // If no recent searches, fall back to popular
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

      // Apply proximity filter if user location is available
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
        // If no user location, sort by name or default order
        fetchedProducts = fetchedProducts.sort((a, b) => a.productName.localeCompare(b.productName));
      }

      setProducts(fetchedProducts);
      if (fetchedProducts.length === 0 && !isFallback) {
        // If no recommendations found, try fallback
        setSectionTitle("Popular Products Around You");
        await fetchProducts([], true); // Recursive call for fallback
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
      setSectionTitle("Popular Products Around You");
      fetchProducts([], true); // Fetch popular products if no recent searches
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
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-4">Loading recommendations...</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>{sectionTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <div className="flex w-max space-x-4 p-4">
            {products.length > 0 ? (
              products.map((product) => (
                <div
                  key={product.productId}
                  className="w-[200px] flex-shrink-0 p-3 border rounded-md hover:bg-gray-100 cursor-pointer transition-colors flex flex-col"
                  onClick={() => navigate(`/store/${product.storeId}?product=${product.productId}`)}
                >
                  <img
                    src={product.productImageUrl || "/placeholder.svg"}
                    alt={product.productName}
                    className="w-full h-32 object-cover rounded-md mb-3"
                  />
                  <h4 className="font-semibold text-base flex-grow">{product.productName}</h4>
                  <p className="text-sm text-gray-700">{product.storeName}</p>
                  <p className="text-md font-bold text-green-600">
                    {product.currency_symbol}{product.productPrice.toFixed(2)}
                  </p>
                  {userLocation && product.formattedDistance !== undefined && (
                    <p className="text-xs text-gray-500">Distance: {product.formattedDistance}</p>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleToggleFavorite(e, product)}
                    className="mt-2 self-end"
                  >
                    <Heart
                      className={cn(
                        "h-5 w-5",
                        isFavorited(product.productId) ? "text-red-500 fill-red-500" : "text-gray-400"
                      )}
                    />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 w-full">No recommendations available.</p>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecommendedProductsSection;