const SEARCH_HISTORY_KEY = "recentSearchTerms";
const MAX_SEARCH_TERMS = 5; // Keep up to 5 recent search terms

export const addSearchTerm = (term: string) => {
  try {
    const storedTerms = localStorage.getItem(SEARCH_HISTORY_KEY);
    let searchTerms: string[] = storedTerms ? JSON.parse(storedTerms) : [];

    // Remove if already exists to move it to the front (most recent)
    searchTerms = searchTerms.filter(t => t.toLowerCase() !== term.toLowerCase());

    // Add to the front
    searchTerms.unshift(term);

    // Limit the array size
    searchTerms = searchTerms.slice(0, MAX_SEARCH_TERMS);

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchTerms));
  } catch (error) {
    console.error("Error adding search term to localStorage:", error);
  }
};

export const getRecentSearchTerms = (): string[] => {
  try {
    const storedTerms = localStorage.getItem(SEARCH_HISTORY_KEY);
    return storedTerms ? JSON.parse(storedTerms) : [];
  } catch (error) {
    console.error("Error getting recent search terms from localStorage:", error);
    return [];
  }
};

export const clearSearchHistory = () => {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error("Error clearing search history from localStorage:", error);
  }
};