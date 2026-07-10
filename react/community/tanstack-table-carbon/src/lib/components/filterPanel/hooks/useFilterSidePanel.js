import { useState, useCallback } from 'react';

/**
 * Custom hook to manage filter panel state and filter functions.
 *
 * Handles both column-based filters (TanStack state) and custom filters
 * (consumer-owned state). For custom filters it:
 *   - Tracks applied values so FilterTagsSummary can render tag chips
 *   - Intercepts onApply/onReset to keep that tracking in sync
 *   - Provides handleRemoveCustomFilter to remove a single tag and re-apply
 *
 * @param {Object}   table                 - TanStack table instance
 * @param {Function} onColumnFiltersChange - Optional callback when column filters change
 * @param {Object}   customFilters         - Custom filter config from sideFilterPanel feature
 * @returns {Object} Filter panel state, handlers, and filter functions
 */
export const useFilterSidePanel = (
  table,
  onColumnFiltersChange,
  customFilters = null
) => {
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [appliedCustomFilters, setAppliedCustomFilters] = useState({});

  /**
   * Custom filter function for checkbox filters (OR logic within same column)
   * Memoized to maintain stable reference across renders
   */
  const arrayFilterFn = useCallback((row, columnId, filterValue) => {
    if (
      !filterValue ||
      !Array.isArray(filterValue) ||
      filterValue.length === 0
    ) {
      return true;
    }
    const cellValue = row.getValue(columnId);
    return filterValue.includes(cellValue);
  }, []);

  const openFilterPanel = useCallback(() => {
    setShowFilterPanel(true);
  }, []);

  const closeFilterPanel = useCallback(() => {
    setShowFilterPanel(false);
  }, []);

  const toggleFilterPanel = useCallback(() => {
    setShowFilterPanel((prev) => !prev);
  }, []);

  const applyFilters = useCallback(
    (filters) => {
      if (table) {
        table.setColumnFilters(filters);
        if (onColumnFiltersChange) {
          onColumnFiltersChange(filters);
        }
      }
    },
    [table, onColumnFiltersChange]
  );

  const clearFilters = useCallback(() => {
    if (table) {
      table.resetColumnFilters();
      if (onColumnFiltersChange) {
        onColumnFiltersChange([]);
      }
    }
  }, [table, onColumnFiltersChange]);

  // ---------------------------------------------------------------------------
  // Custom filter tag tracking
  // Intercept the consumer's onApply/onReset to keep appliedCustomFilters in sync
  // so FilterTagsSummary can render tag chips for custom filter mode.
  // ---------------------------------------------------------------------------

  // Remove a single custom filter key from the tag strip and re-apply the rest.
  // Calls the consumer's onApply directly to avoid stale closure on wrappedCustomFilters.
  const handleRemoveCustomFilter = useCallback(
    (key) => {
      setAppliedCustomFilters((prev) => {
        const next = { ...prev };
        delete next[key];
        customFilters?.onApply?.(next, { changedFilters: [] });
        return next;
      });
    },
    [customFilters]
  );

  // Clear all custom filters (used by "Clear filters" button and tag × click)
  const clearCustomFilters = useCallback(() => {
    setAppliedCustomFilters({});
    customFilters?.onReset?.({}, { changedFilters: [] });
  }, [customFilters]);

  const wrappedCustomFilters = customFilters
    ? {
        ...customFilters,
        onApply: (filterValues, meta) => {
          setAppliedCustomFilters(filterValues ?? {});
          customFilters.onApply?.(filterValues, meta);
        },
        onReset: (filterValues, meta) => {
          setAppliedCustomFilters({});
          customFilters.onReset?.(filterValues, meta);
        },
      }
    : null;

  return {
    showFilterPanel,
    openFilterPanel,
    closeFilterPanel,
    toggleFilterPanel,
    applyFilters,
    clearFilters,
    arrayFilterFn,
    // Custom filter tag tracking
    wrappedCustomFilters,
    appliedCustomFilters,
    handleRemoveCustomFilter,
    clearCustomFilters,
  };
};

export default useFilterSidePanel;
