"use client";

import { useState, useMemo, useCallback } from "react";

interface UsePaginationOptions {
  totalItems: number;
  itemsPerPage?: number;
  initialPage?: number;
  siblingCount?: number;
}

interface UsePaginationResult {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  pages: (number | "...")[];
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isFirstPage: boolean;
  isLastPage: boolean;
  setItemsPerPage: (items: number) => void;
}

export function usePagination({
  totalItems,
  itemsPerPage: initialItemsPerPage = 10,
  initialPage = 1,
  siblingCount = 1,
}: UsePaginationOptions): UsePaginationResult {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPageState] = useState(initialItemsPerPage);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / itemsPerPage)),
    [totalItems, itemsPerPage]
  );

  const startIndex = useMemo(
    () => (currentPage - 1) * itemsPerPage,
    [currentPage, itemsPerPage]
  );

  const endIndex = useMemo(
    () => Math.min(startIndex + itemsPerPage - 1, totalItems - 1),
    [startIndex, itemsPerPage, totalItems]
  );

  const pages = useMemo(() => {
    const totalPageNumbers = siblingCount * 2 + 5;
    if (totalPages <= totalPageNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const showLeftEllipsis = leftSiblingIndex > 2;
    const showRightEllipsis = rightSiblingIndex < totalPages - 1;

    const result: (number | "...")[] = [1];

    if (showLeftEllipsis) {
      result.push("...");
    } else {
      for (let i = 2; i < leftSiblingIndex; i++) result.push(i);
    }

    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i !== 1 && i !== totalPages) result.push(i);
    }

    if (showRightEllipsis) {
      result.push("...");
    } else {
      for (let i = rightSiblingIndex + 1; i < totalPages; i++) result.push(i);
    }

    if (totalPages > 1) result.push(totalPages);

    return result;
  }, [currentPage, totalPages, siblingCount]);

  const goToPage = useCallback(
    (page: number) => {
      const p = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(p);
    },
    [totalPages]
  );

  const goToNextPage = useCallback(
    () => goToPage(currentPage + 1),
    [currentPage, goToPage]
  );

  const goToPreviousPage = useCallback(
    () => goToPage(currentPage - 1),
    [currentPage, goToPage]
  );

  const goToFirstPage = useCallback(() => goToPage(1), [goToPage]);
  const goToLastPage = useCallback(
    () => goToPage(totalPages),
    [goToPage, totalPages]
  );

  const setItemsPerPage = useCallback((items: number) => {
    setItemsPerPageState(items);
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    startIndex,
    endIndex,
    pages,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    canGoNext: currentPage < totalPages,
    canGoPrevious: currentPage > 1,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
    setItemsPerPage,
  };
}
