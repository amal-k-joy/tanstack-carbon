import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTableSearch } from '../useTableSearch';

describe('useTableSearch', () => {
  it('updates immediateSearchValue, debounces globalFilter, triggers callback, and clears search', async () => {
    const onSearchChange = vi.fn();

    const { result } = renderHook(() =>
      useTableSearch({
        onSearchChange,
        debounceDelay: 10,
      })
    );

    act(() => {
      result.current.handleSearchChange('john');
    });
    expect(result.current.immediateSearchValue).toBe('john');
    expect(result.current.isSearching).toBe(true);

    await waitFor(() => {
      expect(result.current.debouncedSearchValue).toBe('john');
      expect(result.current.globalFilter).toBe('john');
    });

    expect(onSearchChange).toHaveBeenLastCalledWith('john');

    act(() => {
      result.current.clearSearch();
    });

    await waitFor(() => {
      expect(result.current.immediateSearchValue).toBe('');
      expect(result.current.debouncedSearchValue).toBe('');
      expect(result.current.globalFilter).toBe('');
    });

    expect(onSearchChange).toHaveBeenLastCalledWith('');
  });
});
