import React, { useRef } from "react";
import { useSearchResultsLogic } from "@/hooks/useSearchResultsLogic";
import SearchFilterModal from "@/components/SearchFilterModal";
import mapboxgl from "mapbox-gl"; // Import mapboxgl for mapRef type
import SearchResultsLayout from "@/components/SearchResultsLayout"; // Corrected import

const SearchResultsPage = () => {
  const searchResultsLogicProps = useSearchResultsLogic();
  const mapRef = useRef<mapboxgl.Map | null>(null); // Create mapRef here

  return (
    <div className="min-h-screen flex flex-col bg-background"> {/* Added bg-background */}
      <SearchResultsLayout {...searchResultsLogicProps} mapRef={mapRef} /> {/* Pass mapRef */}
      <SearchFilterModal
        isOpen={searchResultsLogicProps.isFilterModalOpen}
        onClose={() => searchResultsLogicProps.setIsFilterModalOpen(false)}
        onApplyFilters={searchResultsLogicProps.handleApplyFilters}
      />
    </div>
  );
};

export default SearchResultsPage;