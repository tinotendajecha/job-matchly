'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PageNavigatorProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  containerRef?: React.RefObject<HTMLElement>;
}

export function PageNavigator({
  totalPages,
  currentPage,
  onPageChange,
  containerRef,
}: PageNavigatorProps) {
  const navigatorRef = useRef<HTMLDivElement>(null);

  // Scroll to current page when it changes
  useEffect(() => {
    if (containerRef?.current && currentPage > 0) {
      // Find the page element by data-page-number attribute
      const pageElement = containerRef.current.querySelector(
        `[data-page-number="${currentPage}"]`
      ) as HTMLElement;
      
      if (pageElement) {
        // Scroll the page into view
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [currentPage, containerRef]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input/textarea
      if (
        (e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'TEXTAREA'
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          if (currentPage > 1) {
            onPageChange(currentPage - 1);
          }
          break;
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
          }
          break;
        case 'Home':
          e.preventDefault();
          onPageChange(1);
          break;
        case 'End':
          e.preventDefault();
          onPageChange(totalPages);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPage, totalPages, onPageChange]);

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  if (totalPages <= 1) {
    return null; // Don't show navigator for single page
  }

  return (
    <div
      ref={navigatorRef}
      className="flex items-center justify-center gap-4 p-4 bg-background border-t"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrev}
        disabled={currentPage <= 1}
        className="gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Prev
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {currentPage} / {totalPages}
        </span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleNext}
        disabled={currentPage >= totalPages}
        className="gap-1"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>

      <div className="text-xs text-muted-foreground ml-4">
        Use arrow keys or Page Up/Down to navigate
      </div>
    </div>
  );
}

