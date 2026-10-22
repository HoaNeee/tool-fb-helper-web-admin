import { Menu, Moon, Sun } from "lucide-react";
import { Button } from "../ui/button";
import type { User } from "@/services/user-service";

interface HeaderProps {
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
  dark: boolean;
  setDark: (dark: boolean) => void;
  navigate: (path: string) => void;
  user?: User | null;
  onOpenProfile?: () => void;
}

export default function Header({
  navOpen,
  setNavOpen,
  dark,
  setDark,
  navigate,
  user,
  onOpenProfile,
}: HeaderProps) {
  const displayName = user?.name || user?.username || "Administrator";
  const initials =
    user?.name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() ||
    user?.username?.slice(0, 2).toUpperCase() ||
    "AD";

  return (
    <header className="flex h-17 shrink-0 items-center justify-between gap-3 border-b bg-card px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Mở menu"
          onClick={() => setNavOpen(!navOpen)}
        >
          <Menu size={20} />
        </Button>
        <button
          className="flex items-center gap-3"
          onClick={() => navigate("/")}
        >
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            FB
          </span>
          <span className="text-base font-semibold tracking-tight">
            FB Helper{" "}
            <span className="hidden font-normal sm:inline">Web Admin</span>
          </span>
        </button>
        <span className="hidden rounded bg-primary/10 px-2 py-1 text-[10px] font-semibold tracking-wider text-primary sm:inline">
          ADMIN
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
          <span className="size-1.5 rounded-full bg-amber-500" />
          Chưa kết nối backend
        </span>
        <Button
          size="icon"
          variant="ghost"
          aria-label={dark ? "Chuyển giao diện sáng" : "Chuyển giao diện tối"}
          onClick={() => setDark(!dark)}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
        <div className="hidden h-6 border-l sm:block" />
        <button
          type="button"
          onClick={onOpenProfile}
          className="group flex items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer text-left"
          title="Hồ sơ tài khoản & Đăng xuất"
          aria-label="Xem hồ sơ và đăng xuất"
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={displayName}
              className="size-8 rounded-full border border-border bg-muted object-cover"
            />
          ) : (
            <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary transition-transform group-hover:scale-105">
              {initials}
            </span>
          )}
          <div className="hidden sm:block">
            <p className="text-xs font-semibold leading-tight line-clamp-1 group-hover:text-primary transition-colors">
              {displayName}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1">
              {user?.email || "Quản trị hệ thống"}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}
