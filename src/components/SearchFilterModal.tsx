"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useFavorites } from "@/hooks/use-favorites";
import { Loader2 } from "lucide-react";

interface SearchFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (proximity: number | null, minPrice: number | null, maxPrice: number | null) => void;
}

const PROXIMITY_OPTIONS = [
  { label: "Any Distance", value: null },
  { label: "500 m", value: 500 },
  { label: "1 km", value: 1000 },
  { label: "2 km", value: 2000 },
  { label: "5 km", value: 5000 },
  { label: "10 km", value: 10000 },
  { label: "20 km", value: 20000 },
  { label: "50 km", value: 50000 },
];

const LOCAL_STORAGE_KEYS = {
  proximity: "xyz_search_proximity",
  minPrice: "xyz_search_price_min",
  maxPrice: "xyz_search_price_max",
};

const SearchFilterModal: React.FC<SearchFilterModalProps> = ({ isOpen, onClose, onApplyFilters }) => {
  const { userId } = useFavorites();
  const [selectedProximity, setSelectedProximity] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Load filters from localStorage or Supabase on mount
  useEffect(() => {
    const loadFilters = async () => {
      setLoading(true);
      let proximity: number | null = null;
      let priceMin: string = "";
      let priceMax: string = "";

      if (userId) {
        // Logged-in user: try to load from Supabase profile
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("search_proximity, price_min, price_max")
            .eq("auth_id", userId)
            .single();

          if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no row found

          if (profile) {
            proximity = profile.search_proximity;
            priceMin = profile.price_min !== null ? String(profile.price_min) : "";
            priceMax = profile.price_max !== null ? String(profile.price_max) : "";
          }
        } catch (error) {
          console.error("Error loading filters from Supabase:", error);
          toast.error("Failed to load saved filter preferences.");
        }
      }

      // Fallback to localStorage if not logged in or no Supabase profile data
      if (proximity === null) {
        const storedProximity = localStorage.getItem(LOCAL_STORAGE_KEYS.proximity);
        proximity = storedProximity ? parseInt(storedProximity) : null;
      }
      if (!priceMin) {
        priceMin = localStorage.getItem(LOCAL_STORAGE_KEYS.minPrice) || "";
      }
      if (!priceMax) {
        priceMax = localStorage.getItem(LOCAL_STORAGE_KEYS.maxPrice) || "";
      }

      setSelectedProximity(proximity);
      setMinPrice(priceMin);
      setMaxPrice(maxPrice);
      setLoading(false);
      // Removed: onApplyFilters(proximity, priceMin ? parseFloat(priceMin) : null, priceMax ? parseFloat(maxPrice) : null);
    };

    if (isOpen) {
      loadFilters();
    }
  }, [isOpen, userId]);

  // Save filters to localStorage and Supabase
  const saveFilters = useCallback(async (proximity: number | null, minP: string, maxP: string) => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.proximity, proximity !== null ? String(proximity) : "");
    localStorage.setItem(LOCAL_STORAGE_KEYS.minPrice, minP);
    localStorage.setItem(LOCAL_STORAGE_KEYS.maxPrice, maxP);

    if (userId) {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            search_proximity: proximity,
            price_min: minP ? parseFloat(minP) : null,
            price_max: maxP ? parseFloat(maxP) : null,
          })
          .eq("auth_id", userId);

        if (error) throw error;
      } catch (error) {
        console.error("Error saving filters to Supabase:", error);
        toast.error("Failed to save filter preferences to your profile.");
      }
    }
  }, [userId]);

  const handleApply = useCallback(() => {
    const parsedMinPrice = minPrice ? parseFloat(minPrice) : null;
    const parsedMaxPrice = maxPrice ? parseFloat(maxPrice) : null;

    if (parsedMinPrice !== null && parsedMaxPrice !== null && parsedMinPrice > parsedMaxPrice) {
      toast.error("Minimum price cannot be greater than maximum price.");
      return;
    }

    saveFilters(selectedProximity, minPrice, maxPrice);
    onApplyFilters(selectedProximity, parsedMinPrice, parsedMaxPrice);
    onClose();
  }, [selectedProximity, minPrice, maxPrice, saveFilters, onApplyFilters, onClose]);

  const handleReset = useCallback(() => {
    setSelectedProximity(null);
    setMinPrice("");
    setMaxPrice("");
    saveFilters(null, "", "");
    onApplyFilters(null, null, null);
    onClose();
    toast.info("Filters have been reset.");
  }, [saveFilters, onApplyFilters, onClose]);

  // Apply filters whenever local state changes (debounced for inputs)
  useEffect(() => {
    const handler = setTimeout(() => {
      const parsedMinPrice = minPrice ? parseFloat(minPrice) : null;
      const parsedMaxPrice = maxPrice ? parseFloat(maxPrice) : null;
      if (parsedMinPrice !== null && parsedMaxPrice !== null && parsedMinPrice > parsedMaxPrice) {
        return;
      }
      saveFilters(selectedProximity, minPrice, maxPrice);
      // Removed: onApplyFilters(selectedProximity, parsedMinPrice, parsedMaxPrice);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [selectedProximity, minPrice, maxPrice, saveFilters]);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] z-[700]">
        <DialogHeader>
          <DialogTitle>Search Filters</DialogTitle>
          <DialogDescription>
            Refine your product search by proximity and price range.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="proximity" className="text-right">
                Proximity
              </Label>
              <Select
                value={selectedProximity !== null ? String(selectedProximity) : ""}
                onValueChange={(value) => setSelectedProximity(value ? parseInt(value) : null)}
              >
                <SelectTrigger id="proximity" className="col-span-3">
                  <SelectValue placeholder="Select proximity" />
                </SelectTrigger>
                <SelectContent>
                  {PROXIMITY_OPTIONS.map((option) => (
                    <SelectItem key={option.label} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="min-price" className="text-right">
                Min Price
              </Label>
              <Input
                id="min-price"
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="col-span-3"
                placeholder="e.g., 10"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="max-price" className="text-right">
                Max Price
              </Label>
              <Input
                id="max-price"
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="col-span-3"
                placeholder="e.g., 100"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={handleReset} disabled={loading}>
            Reset Filters
          </Button>
          <Button onClick={handleApply} disabled={loading}>
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SearchFilterModal;