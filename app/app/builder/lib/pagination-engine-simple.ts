/**
 * Simplified Pagination Engine - Fallback that works without Paged.js
 * 
 * This version calculates pages based on content height and creates
 * visual page separations without relying on Paged.js.
 */

export interface PaginationResult {
  totalPages: number;
  flow: any;
  elapsedMs: number;
}

export interface PaginationOptions {
  cssUrls?: string[];
  afterPaginate?: (result: PaginationResult) => void;
}

/**
 * Simple pagination based on content height
 * Creates visual page breaks every 11in (A4 height)
 */
export async function paginateSimple(
  containerEl: HTMLElement,
  options: PaginationOptions = {}
): Promise<PaginationResult> {
  const startTime = performance.now();

  // Calculate page count based on content height
  // A4 height: 297mm = 11.69in ≈ 11in for practical purposes
  // At 96 DPI: 11in = 1056px
  const pageHeightPx = 11 * 96; // 11 inches in pixels
  const contentHeight = containerEl.scrollHeight || containerEl.offsetHeight;
  const totalPages = Math.max(1, Math.ceil(contentHeight / pageHeightPx));

  const elapsedMs = performance.now() - startTime;

  // Create visual page separators
  const existingMarkers = containerEl.querySelectorAll('.page-break-marker');
  existingMarkers.forEach(marker => marker.remove());

  // Add page break markers for visual separation
  for (let i = 1; i < totalPages; i++) {
    const marker = document.createElement('div');
    marker.className = 'page-break-marker';
    marker.style.position = 'absolute';
    marker.style.top = `${i * pageHeightPx}px`;
    marker.style.left = '0';
    marker.style.right = '0';
    marker.style.height = '2px';
    marker.style.background = 'repeating-linear-gradient(to right, #e5e7eb 0px, #e5e7eb 20px, transparent 20px, transparent 40px)';
    marker.style.pointerEvents = 'none';
    marker.style.zIndex = '10';
    containerEl.appendChild(marker);
  }

  const result: PaginationResult = {
    totalPages,
    flow: { total: totalPages },
    elapsedMs,
  };

  if (options.afterPaginate) {
    options.afterPaginate(result);
  }

  return result;
}

