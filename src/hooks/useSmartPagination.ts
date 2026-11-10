import { useState, useMemo, useEffect, useCallback } from 'react';

export interface UseSmartPaginationOptions<T> {
  items: T[];
  initialPageSize?: number;
  initialPage?: number;
  resetDependencies?: any[];
}

export interface UseSmartPaginationResult<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  paginatedItems: T[];
  startIndex: number; // 1-based index (e.g. 1)
  endIndex: number;   // 1-based index (e.g. 15)
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  setPageSize: (size: number) => void;
  canPrev: boolean;
  canNext: boolean;
  pageNumbers: (number | 'ellipsis')[];
}

/**
 * Hook phân trang thông minh (0ms memory slice, tự động reset về trang 1 khi lọc)
 * Chuẩn y tế cho Phòng Khám BS. Trần Văn Diệu
 */
export function useSmartPagination<T>({
  items,
  initialPageSize = 15,
  initialPage = 1,
  resetDependencies = [],
}: UseSmartPaginationOptions<T>): UseSmartPaginationResult<T> {
  const [pageSize, setPageSizeState] = useState<number>(initialPageSize);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);

  // Tự động reset về trang 1 khi danh sách hoặc các bộ lọc thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length, ...resetDependencies]);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Giữ currentPage luôn hợp lệ trong [1, totalPages]
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (currentPage < 1) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage((prev) => {
      const target = Math.max(1, Math.min(page, totalPages));
      return target;
    });
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const firstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const lastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const setPageSize = useCallback((newSize: number) => {
    if (newSize > 0) {
      setPageSizeState(newSize);
      setCurrentPage(1); // Reset về trang 1 khi đổi số dòng
    }
  }, []);

  // Cắt lát (Slice) phần tử của trang hiện tại (0ms DOM rendering)
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  // Tạo mảng số trang hiển thị thông minh với dấu ...
  const pageNumbers = useMemo<(number | 'ellipsis')[]>(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [];
    pages.push(1);

    const leftBoundary = Math.max(2, currentPage - 1);
    const rightBoundary = Math.min(totalPages - 1, currentPage + 1);

    if (leftBoundary > 2) {
      pages.push('ellipsis');
    }

    for (let i = leftBoundary; i <= rightBoundary; i++) {
      pages.push(i);
    }

    if (rightBoundary < totalPages - 1) {
      pages.push('ellipsis');
    }

    pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages]);

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setPageSize,
    canPrev: currentPage > 1,
    canNext: currentPage < totalPages,
    pageNumbers,
  };
}
