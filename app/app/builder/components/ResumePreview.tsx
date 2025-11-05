'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { useCreateResumeStore } from '@/lib/zustand/store';
import { PageNavigator } from './PageNavigator';
import { useTemplate } from '../lib/template-registry';
import '../styles/print.css';
import '../styles/resume-preview.css';
import '../lib/register-templates'; // Register templates on import

interface ResumePreviewProps {
  zoom: number;
  activeTemplate: 'classic' | 'modern';
}

export function ResumePreview({ zoom, activeTemplate }: ResumePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isPaginating, setIsPaginating] = useState(false);

  // Get resume data from store
  const header = useCreateResumeStore((state) => state.header);
  const professionalSummary = useCreateResumeStore((state) => state.professionalSummary);
  const skills = useCreateResumeStore((state) => state.skills);
  const experience = useCreateResumeStore((state) => state.experience);
  const education = useCreateResumeStore((state) => state.education);
  const projects = useCreateResumeStore((state) => state.projects);
  const certifications = useCreateResumeStore((state) => state.certifications);
  const references = useCreateResumeStore((state) => state.references);
  const changesSummary = useCreateResumeStore((state) => state.changesSummary);

  // Get template
  const { template } = useTemplate(activeTemplate);

  // Prepare data for template
  const resumeData = useMemo(() => ({
    header,
    professionalSummary,
    skills,
    experience,
    education,
    projects,
    certifications,
    references,
    changesSummary,
  }), [header, professionalSummary, skills, experience, education, projects, certifications, references, changesSummary]);

  // Split content into pages
  // useEffect(() => {
  //   if (!contentRef.current || !containerRef.current || !template) return;

  //   setIsPaginating(true);

  //   // Use a timeout to ensure DOM is updated
  //   const timeoutId = setTimeout(() => {
  //     try {
  //       const pageHeightPx = 11 * 96; // 1056px (11 inches at 96 DPI)
  //       const paddingPx = 18 * 3.779527559 * 2; // 18mm top + 18mm bottom in pixels
  //       const availableHeight = pageHeightPx - paddingPx;

  //       // Clear existing pages
  //       if (!containerRef.current) return;
  //       containerRef.current.innerHTML = '';

  //       // Create page containers - start with just one, create more as needed
  //       const pages: HTMLDivElement[] = [];
        
  //       const createPage = (pageNumber: number): HTMLDivElement => {
  //         const page = document.createElement('div');
  //         page.className = 'resume-page';
  //         page.setAttribute('data-page-number', String(pageNumber));
  //         page.style.cssText = `
  //           width: 210mm;
  //           height: 1056px;
  //           max-height: 1056px;
  //           box-sizing: border-box;
  //           position: relative;
  //           background: white;
  //           border: 1px solid #e5e7eb;
  //           box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  //           border-radius: 4px;
  //           overflow: hidden;
  //           margin-bottom: 1rem;
  //           padding: 18mm;
  //           page-break-after: always;
  //           break-after: page;
  //           display: flex;
  //           flex-direction: column;
  //         `;
  //         return page;
  //       };
        
  //       // Create first page
  //       const firstPage = createPage(1);
  //       pages.push(firstPage);
  //       containerRef.current.appendChild(firstPage);

  //       // Split content across pages - fill pages efficiently
  //       if (contentRef.current && pages.length > 0 && containerRef.current) {
  //         // Create a temporary container to measure actual rendered heights
  //         const tempContainer = document.createElement('div');
  //         tempContainer.style.cssText = `
  //           position: absolute;
  //           visibility: hidden;
  //           width: 210mm;
  //           padding: 18mm;
  //           box-sizing: border-box;
  //           top: -9999px;
  //           left: -9999px;
  //           display: flex;
  //           flex-direction: column;
  //         `;
          
  //         // Clone the full content
  //         const fullContentClone = contentRef.current.cloneNode(true) as HTMLElement;
  //         tempContainer.appendChild(fullContentClone);
  //         document.body.appendChild(tempContainer);
          
  //         // Force layout
  //         void tempContainer.offsetHeight;
          
  //         // Get all section elements (or top-level children if no .section class)
  //         let sections = Array.from(tempContainer.querySelectorAll('.section'));
          
  //         // If no sections found, use direct children
  //         if (sections.length === 0) {
  //           sections = Array.from(tempContainer.children);
  //         }
          
  //         // Now distribute sections across pages by actually placing them and measuring
  //         let currentPageIndex = 0;
          
  //         // Create a test page to measure content as we add it
  //         const testPage = document.createElement('div');
  //         testPage.style.cssText = `
  //           position: absolute;
  //           visibility: hidden;
  //           width: 210mm;
  //           padding: 18mm;
  //           box-sizing: border-box;
  //           top: -9999px;
  //           left: -9999px;
  //           display: flex;
  //           flex-direction: column;
  //         `;
  //         document.body.appendChild(testPage);
          
  //         sections.forEach((section) => {
  //           // Clone the section
  //           const sectionClone = section.cloneNode(true) as HTMLElement;
  //           testPage.appendChild(sectionClone);
            
  //           // Force layout and measure
  //           void testPage.offsetHeight;
  //           const testPageHeight = testPage.scrollHeight;
            
  //           // Check if adding this section would exceed available height
  //           // Only move to next page if it truly won't fit
  //           if (testPageHeight > availableHeight && testPage.children.length > 1) {
  //             // Remove the last section from test page (it doesn't fit)
  //             testPage.removeChild(sectionClone);
              
  //             // Move to next page
  //             currentPageIndex++;
              
  //             // Create additional page if needed
  //             if (currentPageIndex >= pages.length && containerRef.current) {
  //               const newPage = createPage(pages.length + 1);
  //               pages.push(newPage);
  //               containerRef.current.appendChild(newPage);
  //               setTotalPages(pages.length);
  //             }
              
  //             // Clear test page and add this section to it (start new page)
  //             testPage.innerHTML = '';
  //             testPage.appendChild(sectionClone);
  //             void testPage.offsetHeight;
  //           }
            
  //           // Add section to current page
  //           if (pages[currentPageIndex]) {
  //             const sectionElement = section.cloneNode(true) as HTMLElement;
  //             pages[currentPageIndex].appendChild(sectionElement);
  //           }
  //         });
          
  //         // Clean up
  //         document.body.removeChild(tempContainer);
  //         document.body.removeChild(testPage);
          
  //         // Update total pages count
  //         setTotalPages(pages.length);
          
  //         // If no sections found, add all content to first page
  //         if (sections.length === 0 && pages[0]) {
  //           const allContent = contentRef.current.cloneNode(true) as HTMLElement;
  //           pages[0].appendChild(allContent);
  //         }
  //       }

  //       setIsPaginating(false);
  //     } catch (error) {
  //       console.error('Pagination error:', error);
  //       setIsPaginating(false);
  //     }
  //   }, 200); // Increased delay for better stability

  //   return () => clearTimeout(timeoutId);
  // }, [resumeData, template, activeTemplate]);

  // Split content into pages
useEffect(() => {
  if (!contentRef.current || !containerRef.current || !template) return;

  setIsPaginating(true);

  const timeoutId = setTimeout(() => {
    try {
      const pageHeightPx = 11 * 96; // 1056px (11 inches at 96 DPI)
      const paddingPx = 1 * 3.779527559 * 2; // 18mm top + 18mm bottom in pixels
      const availableHeight = pageHeightPx - paddingPx;

      // Clear existing pages
      if (!containerRef.current) return;
      containerRef.current.innerHTML = '';

      const pages: HTMLDivElement[] = [];
      
      const createPage = (pageNumber: number): HTMLDivElement => {
        const page = document.createElement('div');
        page.className = 'resume-page';
        page.setAttribute('data-page-number', String(pageNumber));
        page.style.cssText = `
          width: 210mm;
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
          display: block;
        `;
        return page;
      };
      
      // Create first page
      const firstPage = createPage(1);
      pages.push(firstPage);
      containerRef.current.appendChild(firstPage);

      // Split content across pages
      if (contentRef.current && pages.length > 0 && containerRef.current) {
        // Create temporary container to measure heights
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `
          position: absolute;
          visibility: hidden;
          width: 210mm;
          padding: 18mm;
          box-sizing: border-box;
          top: -9999px;
          left: -9999px;
          display: block;
        `;
        
        const fullContentClone = contentRef.current.cloneNode(true) as HTMLElement;
        tempContainer.appendChild(fullContentClone);
        document.body.appendChild(tempContainer);
        
        void tempContainer.offsetHeight;
        
        // Get all sections
        const sections = Array.from(tempContainer.querySelectorAll('.section'));
        
        let currentPageIndex = 0;
        
        // Create test page to measure as we add content
        const testPage = document.createElement('div');
        testPage.style.cssText = `
          position: absolute;
          visibility: hidden;
          width: 210mm;
          padding: 18mm;
          box-sizing: border-box;
          top: -9999px;
          left: -9999px;
          display: block;
        `;
        document.body.appendChild(testPage);
        
        sections.forEach((section) => {
          const sectionClone = section.cloneNode(true) as HTMLElement;
          
          // Find atomic items within this section
          const atomicItems = Array.from(sectionClone.querySelectorAll(
            '.experience-item, .education-item, .project-item, .certification-item, .reference-item'
          ));
          
          // If no atomic items found, treat section as a whole (for simple sections like summary)
          if (atomicItems.length === 0) {
            testPage.appendChild(sectionClone.cloneNode(true));
            void testPage.offsetHeight;
            const testPageHeight = testPage.scrollHeight;
            
            if (testPageHeight > availableHeight && testPage.children.length > 1) {
              // Move to next page
              testPage.removeChild(testPage.lastChild!);
              currentPageIndex++;
              
              if (currentPageIndex >= pages.length && containerRef.current) {
                const newPage = createPage(pages.length + 1);
                pages.push(newPage);
                containerRef.current.appendChild(newPage);
              }
              
              testPage.innerHTML = '';
              testPage.appendChild(sectionClone.cloneNode(true));
              void testPage.offsetHeight;
            }
            
            if (pages[currentPageIndex]) {
              pages[currentPageIndex].appendChild(sectionClone.cloneNode(true));
            }
            return;
          }
          
          // Section has atomic items - split at item level
          // Get section header (h2)
          const sectionHeader = sectionClone.querySelector('h2');
          let currentSectionContainer: HTMLElement | null = null;
          
          const createSectionContainer = (): HTMLElement => {
            const container = document.createElement('div');
            container.className = 'section';
            if (sectionHeader) {
              container.appendChild(sectionHeader.cloneNode(true));
            }
            // Add the wrapping div that holds items (space-y-4, space-y-3, grid, etc.)
            const itemsWrapper = sectionClone.querySelector('.space-y-4, .space-y-3, .grid');
            if (itemsWrapper) {
              const wrapperClone = itemsWrapper.cloneNode(false) as HTMLElement;
              container.appendChild(wrapperClone);
            }
            return container;
          };
          
          // Process each atomic item
          atomicItems.forEach((item, itemIndex) => {
            // Create section container if needed
            if (!currentSectionContainer) {
              currentSectionContainer = createSectionContainer();
            }
            
            // Find the items wrapper in current section container
            const itemsWrapper = currentSectionContainer.querySelector('.space-y-4, .space-y-3, .grid') || currentSectionContainer;
            
            // Clone and add item to test page's section
            const itemClone = item.cloneNode(true) as HTMLElement;
            const testSectionContainer = currentSectionContainer.cloneNode(true) as HTMLElement;
            const testItemsWrapper = testSectionContainer.querySelector('.space-y-4, .space-y-3, .grid') || testSectionContainer;
            testItemsWrapper.appendChild(itemClone);
            
            // Clear test page and add current page content + new item
            testPage.innerHTML = '';
            Array.from(pages[currentPageIndex].children).forEach(child => {
              testPage.appendChild(child.cloneNode(true));
            });
            testPage.appendChild(testSectionContainer);
            
            void testPage.offsetHeight;
            const testPageHeight = testPage.scrollHeight;
            
            if (testPageHeight > availableHeight) {
              // Item doesn't fit - move to next page
              
              // Add current section to current page if it has items
              if (itemsWrapper && itemsWrapper.children.length > 0) {
                pages[currentPageIndex].appendChild(currentSectionContainer.cloneNode(true));
              }
              
              // Move to next page
              currentPageIndex++;
              
              if (currentPageIndex >= pages.length && containerRef.current) {
                const newPage = createPage(pages.length + 1);
                pages.push(newPage);
                containerRef.current.appendChild(newPage);
              }
              
              // Create new section container for next page
              currentSectionContainer = createSectionContainer();
              const newItemsWrapper = currentSectionContainer.querySelector('.space-y-4, .space-y-3, .grid') || currentSectionContainer;
              newItemsWrapper.appendChild(itemClone);
              
              // Clear test page
              testPage.innerHTML = '';
            } else {
              // Item fits - add to current section
              itemsWrapper.appendChild(itemClone);
            }
            
            // If last item, add section to page
            if (itemIndex === atomicItems.length - 1 && currentSectionContainer) {
              const finalItemsWrapper = currentSectionContainer.querySelector('.space-y-4, .space-y-3, .grid');
              if (finalItemsWrapper && finalItemsWrapper.children.length > 0) {
                pages[currentPageIndex].appendChild(currentSectionContainer);
              }
              currentSectionContainer = null;
            }
          });
        });
        
        // Clean up
        document.body.removeChild(tempContainer);
        document.body.removeChild(testPage);
        
        setTotalPages(pages.length);
      }

      setIsPaginating(false);
    } catch (error) {
      console.error('Pagination error:', error);
      setIsPaginating(false);
    }
  }, 200);

  return () => clearTimeout(timeoutId);
}, [resumeData, template, activeTemplate]);


  // Scroll to current page when it changes
  useEffect(() => {
    if (!containerRef.current) return;

    const pageElement = containerRef.current.querySelector(
      `[data-page-number="${currentPage}"]`
    ) as HTMLElement;

    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  // Ensure current page doesn't exceed total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!template) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Template not found</p>
      </div>
    );
  }

  const ActiveTemplate = template.component;

  return (
    <>
      <div className="flex-1 overflow-auto p-6 relative">
        {/* Pagination spinner */}
        {isPaginating && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>Paginating...</span>
            </div>
          </div>
        )}

        {/* Hidden content for measurement */}
        <div
          ref={contentRef}
          style={{
            position: 'absolute',
            visibility: 'hidden',
            width: '210mm',
            padding: '18mm',
            boxSizing: 'border-box',
            top: 0,
            left: 0,
          }}
        >
          <ActiveTemplate data={resumeData} />
        </div>

        {/* Visible page containers */}
        <div
          ref={containerRef}
          className="mx-auto pages-container"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            width: '210mm',
            position: 'relative',
          }}
        >
          {/* Pages will be created by the useEffect */}
        </div>
      </div>

      {/* Page Navigator */}
      <PageNavigator
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        containerRef={containerRef}
      />
    </>
  );
}
