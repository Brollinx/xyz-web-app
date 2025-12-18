"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react"; // Removed ChevronLeft
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import FavoritesButton from "@/components/FavoritesButton";

interface FloatingControlsProps {
  initialSearchQuery?: string;
  onSearch: (query: string) => void;
  onOpenFilters: () => void;
  isFilterActive: boolean;
  placeholder?: string;
  isMobileView: boolean;
}

const FloatingControls: React.FC<FloatingControlsProps> = ({
  initialSearchQuery = "",
  onSearch,
  onOpenFilters,
  isFilterActive,
  placeholder = "Search for products...",
  isMobileView,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState(initialSearchQuery);

  React.useEffect(() => {
    setQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim());
  };

  return (
    <div className={cn(
      "absolute z-20 w-full flex flex-col items-center p-4 space-y-3", // Added space-y-3 for vertical spacing
      isMobileView ? "top-0" : "top-4" // Adjust top position for mobile/desktop
    )}>
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className={cn(
        "relative flex items-center w-full mx-auto",
        isMobileView ? "max-w-sm" : "max-w-md" // Narrower on mobile
      )}>
        <div className={cn(
          "relative flex items-center w-full rounded-full shadow-lg border",
          "bg-card/80 backdrop-blur-sm dark:bg-background/60", // Changed bg-background/80 to bg-card/80
          "border-border dark:border-muted"
        )}>
          {/* Removed ChevronLeft button from here */}
          <Input
            type="text"
            placeholder={placeholder}
            className={cn(
              "flex-grow h-12 pl-4 pr-12 rounded-full border-none focus-visible:ring-0 focus-visible:ring-offset-0", // Adjusted pl-12 to pl-4
              "bg-transparent text-foreground placeholder:text-muted-foreground"
            )}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onOpenFilters}
            className={cn(
              "absolute right-2 text-muted-foreground hover:bg-transparent",
              isFilterActive && "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500" // Highlight if filters are active
            )}
          >
            <SlidersHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </form>

      {/* Floating action buttons (Favorites and Theme Toggle) */}
      <div className="flex space-x-3"> {/* Centered below search bar */}
        <FavoritesButton />
        <ThemeToggle
          className={cn(
            "rounded-full shadow-md hover:shadow-lg transition-all duration-200",
            "bg-card/80 backdrop-blur-sm dark:bg-background/60" // Changed bg-background/80 to bg-card/80
          )}
          iconClassName="text-primary dark:text-primary-foreground"
        />
      </div>
    </div>
  );
};

export default FloatingControls;