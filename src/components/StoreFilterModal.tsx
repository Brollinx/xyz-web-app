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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useFavorites } from "@/hooks/use-favorites"; // To check if user is logged in for profile saving

interface StoreFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (proximity: number | null) => void;
  initialProximity: number | null;
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

const LOCAL_STORAGE_KEY_PROXIMITY = "xyz_store_search_proximity";

const StoreFilterModal: React.FC<StoreFilterModalProps> = ({ isOpen, onClose, onApplyFilters, initialProximity }) => {
  const { userId } = useFavorites();
  const [selectedProximity, setSelectedProximity] = useState<number | null>(initialProximity);
  const [loading, setLoading] = useState(false);

  // Initialize state with initialProximity prop
  useEffect(() => {
    setSelectedProximity(initialProximity);
  }, [initialProximity]);

  // Load filters from localStorage or Supabase on mount
  useEffect(() => {
    const loadFilters = async () => {
      setLoading(true);
      let proximity: number | null = null;

      if (userId) {
        // Logged-in user: try to load from Supabase profile
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("search_proximity") // Reusing search_proximity for stores
            .eq("auth_id", userId)
            .single();

          if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no row found

          if (profile) {
            proximity = profile.search_proximity;
          }
        } catch (error) {
          console.error("Error loading store filters from Supabase:", error);
          toast.error("Failed to load saved store filter preferences.");
        }
      }

      // Fallback to localStorage if not logged in or no Supabase profile data
      if (proximity === null) {
        const storedProximity = localStorage.getItem(LOCAL_STORAGE_KEY_PROXIMITY);
        proximity = storedProximity ? parseInt(storedProximity) : null;
      }
      
      setSelectedProximity(proximity);
      setLoading(false);
    };

    if (isOpen) {
      loadFilters();
    }
  }, [isOpen, userId]);

  // Save filters to localStorage and Supabase
  const saveFilters = useCallback(async (proximity: number | null) => {
    localStorage.setItem(LOCAL_STORAGE_KEY_PROXIMITY, proximity !== null ? String(proximity) : "");

    if (userId) {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            search_proximity: proximity, // Reusing search_proximity for stores
          })
          .eq("auth_id", userId);

        if (error) throw error;
      } catch (error) {
        console.error("Error saving store filters to Supabase:", error);
        toast.error("Failed to save store filter preferences to your profile.");
      }
    }
  }, [userId]);

  const handleApply = useCallback(() => {
    saveFilters(selectedProximity);
    onApplyFilters(selectedProximity);
    onClose();
  }, [selectedProximity, saveFilters, onApplyFilters, onClose]);

  const handleReset = useCallback(() => {
    setSelectedProximity(null);
    saveFilters(null);
    onApplyFilters(null);
    onClose();
    toast.info("Store proximity filter has been reset.");
  }, [saveFilters, onApplyFilters, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] z-[700]">
        <DialogHeader>
          <DialogTitle>Store Filters</DialogTitle>
          <DialogDescription>
            Filter nearby stores by proximity to your current location.
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
                    <SelectItem key={String(option.value)} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={handleReset} disabled={loading}>
            Reset Filter
          </Button>
          <Button onClick={handleApply} disabled={loading}>
            Apply Filter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StoreFilterModal;