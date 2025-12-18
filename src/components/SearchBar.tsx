"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  initialQuery?: string;
  onSearch: (query: string) => void;
  onOpenFilters: () => void;
  isFilterActive: boolean;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  initialQuery = "",
  onSearch,
  onOpenFilters,
  isFilterActive,
  placeholder = "Type your search here...",
}) => {
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim());
  };

  return (
    <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full max-w-2xl mx-auto">
      <div className="relative flex items-center w-full rounded-full shadow-md border border-gray-200 bg-card/80 backdrop-blur-sm dark:border-gray-700"> {/* Changed bg-background/80 to bg-card/80 */}
        <Button type="submit" variant="ghost" size="icon" className="absolute left-2 text-gray-500 hover:bg-transparent">
          <Search className="h-5 w-5" />
        </Button>
        <Input
          type="text"
          placeholder={placeholder}
          className="flex-grow h-10 pl-12 pr-12 rounded-full border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent" // Changed h-12 to h-10
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOpenFilters}
          className={cn(
            "absolute right-2 text-gray-500 hover:bg-transparent",
            isFilterActive && "text-blue-600 hover:text-blue-700" // Highlight if filters are active
          )}
        >
          <SlidersHorizontal className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
};

export default SearchBar;