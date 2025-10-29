const VIEWED_STORES_KEY = "recentlyViewedStoreIds";
const MAX_VIEWED_STORES = 10; // Limit to 10 recently viewed stores

export const addViewedStore = (storeId: string) => {
  try {
    const storedIds = localStorage.getItem(VIEWED_STORES_KEY);
    let viewedStoreIds: string[] = storedIds ? JSON.parse(storedIds) : [];

    // Remove if already exists to move it to the front (most recent)
    viewedStoreIds = viewedStoreIds.filter(id => id !== storeId);

    // Add to the front
    viewedStoreIds.unshift(storeId);

    // Limit the array size
    viewedStoreIds = viewedStoreIds.slice(0, MAX_VIEWED_STORES);

    localStorage.setItem(VIEWED_STORES_KEY, JSON.stringify(viewedStoreIds));
  } catch (error) {
    console.error("Error adding viewed store to localStorage:", error);
  }
};

export const getRecentlyViewedStoreIds = (): string[] => {
  try {
    const storedIds = localStorage.getItem(VIEWED_STORES_KEY);
    return storedIds ? JSON.parse(storedIds) : [];
  } catch (error) {
    console.error("Error getting recently viewed store IDs from localStorage:", error);
    return [];
  }
};