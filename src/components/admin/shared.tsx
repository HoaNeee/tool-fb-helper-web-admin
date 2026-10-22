import { Search, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const statusLabels: Record<string, string> = {
  ACTIVE: "Đang bật",
  INACTIVE: "Đã tắt",
  MAINTAINING: "Bảo trì",
  PENDING: "Chờ kích hoạt",
  LOCKED: "Đã khóa",
};

export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  const colorClass =
    status === "ACTIVE"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : status === "MAINTAINING" || status === "PENDING"
        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : status === "LOCKED"
          ? "bg-destructive/10 text-destructive dark:text-destructive"
          : "bg-muted text-muted-foreground";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${colorClass}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label ?? statusLabels[status] ?? status}
    </span>
  );
}

export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function ListToolbar({
  search,
  onSearch,
  status,
  onStatus,
  placeholder,
  statusOptions,
  children,
}: {
  search: string;
  onSearch: (v: string) => void;
  status: string;
  onStatus: (v: string) => void;
  placeholder: string;
  statusOptions?: { value: string; label: string }[];
  children?: ReactNode;
}) {
  const options = statusOptions ?? [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "ACTIVE", label: "Đang bật" },
    { value: "INACTIVE", label: "Đã tắt" },
  ];

  return (
    <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-md">
        <Search
          className="absolute top-2.5 left-3 text-muted-foreground"
          size={16}
        />
        <Input
          className="h-9 pl-9"
          aria-label="Tìm kiếm"
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
        {children}
        <select
          className="select-control"
          aria-label="Lọc trạng thái"
          value={status}
          onChange={(e) => onStatus(e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 p-12 text-center">
      <Search size={30} className="text-muted-foreground" />
      <h3 className="font-medium">Không tìm thấy kết quả</h3>
      <p className="text-sm text-muted-foreground">
        Thử từ khóa khác hoặc thay đổi bộ lọc.
      </p>
      <Button variant="outline" onClick={onReset}>
        Xóa bộ lọc
      </Button>
    </div>
  );
}

export function LocalNote() {
  return (
    <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
      <ShieldCheck size={15} className="mt-0.5 shrink-0" />
      Dữ liệu giao diện mẫu. Thay đổi chỉ áp dụng trong phiên này; chưa gửi lệnh
      tới thiết bị hoặc backend.
    </p>
  );
}

export { Pagination } from "./Pagination";
