import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
  itemName?: string;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  onLimitChange,
  limitOptions = [5, 10, 20, 50],
  itemName = "mục",
  className = "",
}: PaginationProps) {
  if (totalItems <= 0 && totalPages <= 1) {
    return null;
  }

  const from = Math.min((page - 1) * limit + 1, totalItems);
  const to = Math.min(page * limit, totalItems);

  // Generate page numbers to display with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
      }
    }

    return pages;
  };

  return (
    <div
      className={`flex flex-col gap-3 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span>
          Hiển thị{" "}
          <strong className="font-semibold text-foreground">
            {from} - {to}
          </strong>{" "}
          trong số{" "}
          <strong className="font-semibold text-foreground">
            {totalItems}
          </strong>{" "}
          {itemName}
        </span>

        {onLimitChange && (
          <div className="ml-2 flex items-center gap-1.5">
            <span>· Số dòng:</span>
            <select
              className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              aria-label="Chọn số dòng mỗi trang"
            >
              {limitOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / trang
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 self-end sm:self-auto">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          aria-label="Trang đầu"
          title="Trang đầu"
        >
          <ChevronsLeft size={14} />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Trang trước"
          title="Trang trước"
        >
          <ChevronLeft size={14} />
        </Button>

        <div className="flex items-center gap-1 px-1">
          {getPageNumbers().map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1 text-muted-foreground select-none"
                >
                  …
                </span>
              );
            }

            const pageNum = Number(p);
            const isCurrent = pageNum === page;

            return (
              <Button
                key={pageNum}
                variant={isCurrent ? "default" : "outline"}
                size="icon-sm"
                className={`size-7 text-xs ${
                  isCurrent ? "font-bold shadow-xs" : ""
                }`}
                onClick={() => onPageChange(pageNum)}
                aria-current={isCurrent ? "page" : undefined}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="icon-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Trang sau"
          title="Trang sau"
        >
          <ChevronRight size={14} />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          aria-label="Trang cuối"
          title="Trang cuối"
        >
          <ChevronsRight size={14} />
        </Button>
      </div>
    </div>
  );
}

export default Pagination;
