/**
 * React Hook for Paged.js Pagination
 * 
 * Automatically paginates content when dependencies change (debounced).
 * Returns pagination state including total pages and loading status.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { paginate, PaginationResult, PaginationOptions } from './pagination-engine';

export interface UsePaginationOptions {
  containerRef: React.RefObject<HTMLElement>;
  cssUrls?: string[];
  deps?: React.DependencyList;
  debounceMs?: number;
  afterPaginate?: (result: PaginationResult) => void;
}

export interface UsePaginationResult {
  totalPages: number;
  isPaginating: boolean;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  error: Error | null;
}

export function usePagination({
  containerRef,
  cssUrls,
  deps = [],
  debounceMs = 150,
  afterPaginate,
}: UsePaginationOptions): UsePaginationResult {
  const [totalPages, setTotalPages] = useState(1);
  const [isPaginating, setIsPaginating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<Error | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const performPagination = useCallback(async () => {
    if (!containerRef.current) {
      return;
    }

    setIsPaginating(true);
    setError(null);

    try {
      const result = await paginate(containerRef.current, {
        cssUrls,
        afterPaginate: (res) => {
          setTotalPages(res.totalPages);
          if (afterPaginate) {
            afterPaginate(res);
          }
        },
      });

      setTotalPages(result.totalPages);
      // Ensure current page doesn't exceed total pages
      if (currentPage > result.totalPages && result.totalPages > 0) {
        setCurrentPage(result.totalPages);
      }
    } catch (err) {
      console.error('Pagination error:', err);
      setError(err instanceof Error ? err : new Error('Pagination failed'));
    } finally {
      setIsPaginating(false);
    }
  }, [containerRef, cssUrls, afterPaginate, currentPage]);

  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set up debounced pagination
    debounceTimerRef.current = setTimeout(() => {
      performPagination();
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounceMs, ...deps]);

  return {
    totalPages,
    isPaginating,
    currentPage,
    setCurrentPage,
    error,
  };
}

