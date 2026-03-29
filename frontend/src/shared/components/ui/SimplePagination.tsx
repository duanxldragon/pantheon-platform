import * as React from "react";

interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  pageSize?: number;
}

const ChevronLeft = ({ className, ...props }: React.ComponentProps<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
)

const ChevronRight = ({ className, ...props }: React.ComponentProps<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
)

const MoreHorizontal = ({ className, ...props }: React.ComponentProps<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
)

import { useLanguageStore } from '../../../stores/languageStore';

export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  className
}: SimplePaginationProps) {
  const { t } = useLanguageStore();
  const pages: (number | string)[] = [];
  
  // Logic to show limited page numbers with ellipsis
  const showMaxPages = 5;
  
  if (totalPages <= showMaxPages) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always show first, last, and pages around current
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
  }

  const baseButtonClass = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all outline-none h-9 min-w-9 px-3";
  const disabledClass = "pointer-events-none opacity-50";
  const activeClass = "bg-accent text-accent-foreground border border-input";
  const inactiveClass = "hover:bg-accent hover:text-accent-foreground";

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={`mx-auto flex w-full justify-center ${className || ''}`}
    >
      <ul className="flex flex-row items-center gap-1">
        {/* Previous Button */}
        <li>
          <button
            aria-label="Go to previous page"
            className={`${baseButtonClass} ${currentPage <= 1 ? disabledClass : inactiveClass}`}
            onClick={() => {
              if (currentPage > 1) onPageChange(currentPage - 1);
            }}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:block">{t.common.back || 'Previous'}</span>
          </button>
        </li>
        
        {/* Page Numbers */}
        {pages.map((page, index) => (
          <li key={index}>
            {page === '...' ? (
              <span 
                aria-hidden
                className="flex size-9 items-center justify-center"
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">More pages</span>
              </span>
            ) : (
              <button
                aria-current={currentPage === page ? "page" : undefined}
                className={`${baseButtonClass} ${
                  currentPage === page ? activeClass : inactiveClass
                }`}
                onClick={() => {
                  if (typeof page === 'number') onPageChange(page);
                }}
              >
                {page}
              </button>
            )}
          </li>
        ))}

        {/* Next Button */}
        <li>
          <button
            aria-label="Go to next page"
            className={`${baseButtonClass} ${currentPage >= totalPages ? disabledClass : inactiveClass}`}
            onClick={() => {
              if (currentPage < totalPages) onPageChange(currentPage + 1);
            }}
            disabled={currentPage >= totalPages}
          >
            <span className="hidden sm:block">{t.common.next || 'Next'}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
