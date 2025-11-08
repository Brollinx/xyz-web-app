"use client";

import React from "react";
import SearchBar from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useHighPrecisionGeolocation } from "@/hooks/useHighPrecisionGeolocation"; // Import for types
import { cn } from "@/lib/utils";

interface SearchResultsHeaderProps {
  initialSearchQuery: string;
  onSearch: (query: string) => void;
  onOpenFilters: () => void;
  isFilterActive: boolean;
  loadingLocation: boolean;
  userLocation: { lat: number; lng: number; accuracy_meters: number } | null;
  locationStatus: "idle" | "loading" | "success" | "denied";
  refreshLocation: () => void;
}

const SearchResultsHeader: React.FC<SearchResultsHeaderProps> = ({
  initialSearchQuery,
  onSearch,
  onOpenFilters,
  isFilterActive,
  loadingLocation,
  userLocation,
  locationStatus,
  refreshLocation,
}) => {
  return (
    <div className="w-full max-w-4xl text-center space-y-6 mb-4">
      <h1 className="text-4xl font-bold text-foreground">Search Results for "{initialSearchQuery}"</h1>
      <div className="flex w-full items-center space-x-2 mx-auto">
        <SearchBar
          initialQuery={initialSearchQuery}
          onSearch={onSearch}
          onOpenFilters={onOpenFilters}
          isFilterActive={isFilterActive}
          placeholder="Refine your search..."
        />
      </div>
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        {loadingLocation ? (
          <span className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Getting location...</span>
        ) : userLocation ? (
          <span className="flex items-center">
            Location Accuracy: {Math.round(userLocation.accuracy_meters)} m
            <Button variant="ghost" size="sm" onClick={refreshLocation} className="ml-2 h-auto p-1">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </span>
        ) : (
          <span className="text-destructive">Location unavailable.</span>
        )}
      </div>
    </div>
  );
};

export default SearchResultsHeader;