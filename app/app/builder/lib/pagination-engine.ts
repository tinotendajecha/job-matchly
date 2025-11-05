/**
 * Pagination Engine - Creates separate page containers
 * 
 * This engine splits content into separate page containers, each exactly 11 inches tall.
 * Each page is displayed as a separate visual container.
 */

export interface PaginationResult {
  totalPages: number;
  flow: any;
  elapsedMs: number;
  pages: HTMLElement[];
}

export interface PaginationOptions {
  cssUrls?: string[];
  afterPaginate?: (result: PaginationResult) => void;
}

/**
 * Paginate content into separate page containers
 * Each page is exactly 11 inches (1056px) tall
 */
export async function paginate(
  containerEl: HTMLElement,
  options: PaginationOptions = {}
): Promise<PaginationResult> {
  const startTime = performance.now();

  // Calculate page count based on content height
  // A4 height: 297mm = 11.69in ≈ 11in = 1056px at 96 DPI
  const pageHeightPx = 11 * 96; // 1056px
  
  // Create a temporary container to measure content
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.visibility = 'hidden';
  tempContainer.style.width = containerEl.offsetWidth + 'px';
  tempContainer.innerHTML = containerEl.innerHTML;
  document.body.appendChild(tempContainer);
  
  const contentHeight = tempContainer.scrollHeight;
  const totalPages = Math.max(1, Math.ceil(contentHeight / pageHeightPx));
  
  // Clean up temp container
  document.body.removeChild(tempContainer);
  
  // Clear existing content
  containerEl.innerHTML = '';
  
  // Create page containers
  const pages: HTMLElement[] = [];
  const content = containerEl.innerHTML || containerEl.textContent || '';
  
  // Get the original content from the container's children
  const originalContent = Array.from(containerEl.children).length > 0 
    ? Array.from(containerEl.children) 
    : [];
  
  // If we have children, we need to split them across pages
  if (originalContent.length > 0) {
    // Restore original content temporarily to measure
    const restoreContainer = document.createElement('div');
    restoreContainer.style.position = 'absolute';
    restoreContainer.style.visibility = 'hidden';
    restoreContainer.style.width = containerEl.offsetWidth + 'px';
    
    // Clone all children
    originalContent.forEach((child) => {
      restoreContainer.appendChild(child.cloneNode(true));
    });
    
    document.body.appendChild(restoreContainer);
    
    // Split content across pages
    let currentPageHeight = 0;
    let currentPage: HTMLElement | null = null;
    let pageIndex = 0;
    
    const processElement = (element: Element, page: HTMLElement) => {
      const clone = element.cloneNode(true) as HTMLElement;
      const elementHeight = clone.offsetHeight || 0;
      
      // If element would exceed page height, start a new page
      if (currentPageHeight + elementHeight > pageHeightPx && currentPageHeight > 0) {
        pageIndex++;
        currentPageHeight = 0;
        currentPage = null;
      }
      
      if (!currentPage) {
        currentPage = createPageContainer(pageIndex + 1, containerEl.offsetWidth);
        pages.push(currentPage);
        containerEl.appendChild(currentPage);
      }
      
      currentPage.appendChild(clone);
      currentPageHeight += elementHeight;
    };
    
    // Process all children
    Array.from(restoreContainer.children).forEach((child) => {
      processElement(child, currentPage || createPageContainer(1, containerEl.offsetWidth));
    });
    
    document.body.removeChild(restoreContainer);
  } else {
    // If no children, create pages with empty content (will be filled by template)
    for (let i = 0; i < totalPages; i++) {
      const page = createPageContainer(i + 1, containerEl.offsetWidth);
      pages.push(page);
      containerEl.appendChild(page);
    }
  }
  
  const elapsedMs = performance.now() - startTime;
  const result: PaginationResult = {
    totalPages,
    flow: { total: totalPages },
    elapsedMs,
    pages,
  };

  if (options.afterPaginate) {
    options.afterPaginate(result);
  }

  return result;
}

/**
 * Create a page container element
 */
function createPageContainer(pageNumber: number, width: number): HTMLElement {
  const page = document.createElement('div');
  page.className = 'resume-page';
  page.setAttribute('data-page-number', String(pageNumber));
  page.style.cssText = `
    width: ${width}px;
    height: 1056px;
    max-height: 1056px;
    box-sizing: border-box;
    position: relative;
    background: white;
    border: 1px solid #e5e7eb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 1rem;
    padding: 18mm;
    page-break-after: always;
    break-after: page;
  `;
  return page;
}

/**
 * Fallback pagination - creates pages based on content height
 */
export function fallbackPagination(
  containerEl: HTMLElement,
  startTime: number,
  options: PaginationOptions
): PaginationResult {
  const pageHeightPx = 11 * 96; // 1056px
  const contentHeight = containerEl.scrollHeight || containerEl.offsetHeight;
  const totalPages = Math.max(1, Math.ceil(contentHeight / pageHeightPx));
  
  // Don't modify the container - let the component handle page creation
  const elapsedMs = performance.now() - startTime;
  const result: PaginationResult = {
    totalPages,
    flow: { total: totalPages },
    elapsedMs,
    pages: [],
  };
  
  if (options.afterPaginate) {
    options.afterPaginate(result);
  }
  return result;
}
