import { useState } from 'react';
import { useDebounce } from './useDebounce';

export function useBrowseSearch(initialSearch = '', debounceMs = 500) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchQuery, debounceMs);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  
  return {
    searchQuery,
    setSearchQuery,
    debouncedSearch,
    isFilterVisible,
    setIsFilterVisible
  };
}
