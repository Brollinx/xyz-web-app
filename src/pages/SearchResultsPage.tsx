import React from "react";
import { useSearchResultsLogic } from "@/hooks/useSearchResultsLogic";
import SearchFilterModal from "@/components/SearchFilterModal";
import SearchResultsLayout from "@/components/SearchResultsLayout";

const SearchResultsPage = () => {
  const searchResultsLogicProps = useSearchResultsLogic();

  return (
    <>
      <SearchResultsLayout {...searchResultsLogicProps} />
      <SearchFilterModal
        isOpen={searchResultsLogicProps.isFilterModalOpen}
        onClose={() => searchResultsLogicProps.setIsFilterModalOpen(false)}
        onApplyFilters={searchResultsLogicProps.handleApplyFilters}
      />
    </>
  );
};

export default SearchResultsPage;