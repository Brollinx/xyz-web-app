import React, { useRef } from "react";
import { useSearchResultsLogic } from "@/hooks/useSearchResultsLogic";
import SearchFilterModal from "@/components/SearchFilterModal";
import SearchResultsLayout from "@/components/SearchResultsLayout";
import mapboxgl from "mapbox-gl"; // Import mapboxgl for mapRef type

const SearchResultsPage = () => {
  const searchResultsLogicProps = useSearchResultsLogic();
  const mapRef = useRef<mapboxgl.Map | null>(null); // Create mapRef here

  return (
    <>
      <SearchResultsLayout {...searchResultsLogicProps} mapRef={mapRef} /> {/* Pass mapRef */}
      <SearchFilterModal
        isOpen={searchResultsLogicProps.isFilterModalOpen}
        onClose={() => searchResultsLogicProps.setIsFilterModalOpen(false)}
        onApplyFilters={searchResultsLogicProps.handleApplyFilters}
      />
    </>
  );
};

export default SearchResultsPage;