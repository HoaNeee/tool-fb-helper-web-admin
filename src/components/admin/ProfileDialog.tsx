import { useState } from "react";
import { Dialog as Primitive } from "@base-ui/react/dialog";
import {
  X,
  LogOut,
  Mail,
  User as UserIcon,
  ShieldCheck,
  Calendar,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  onLoggedOut?: () => void;
}

export function ProfileDialog({
  open,
  onOpenChange,
  onLoggedOut,
}: ProfileDialogProps) {
  const { state: authState, logout } = useAuth();
  const user = authState.user;

  const [copied, setCopied] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Compute initials for avatar fallback
  const getInitials = (name?: string, username?: string) => {
    if (name && name.trim().length > 0) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (username && username.trim().length > 0) {
      return username.slice(0, 2).toUpperCase();
    }
    return "AD";
  };

  const displayName = user?.name || user?.username || "Administrator";
  const initials = getInitials(user?.name, user?.username);

  const handleCopyId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setShowConfirmLogout(false);
      onOpenChange(false);
      if (onLoggedOut) {
        onLoggedOut();
      }
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "ACTIVE":
        return {
          label: "Đang hoạt động",
          className:
            "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
          dotColor: "bg-emerald-500",
        };
      case "PENDING":
        return {
          label: "Chờ duyệt",
          className:
            "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
          dotColor: "bg-amber-500",
        };
      case "LOCKED":
        return {
          label: "Đã khóa",
          className:
            "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
          dotColor: "bg-rose-500",
        };
      default:
        return {
          label: "Hoạt động",
          className:
            "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
          dotColor: "bg-emerald-500",
        };
    }
  };

  const statusInfo = getStatusBadge(user?.status);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Chưa cập nhật";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Reset internal states when dialog closes
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setShowConfirmLogout(false);
      setIsLoggingOut(false);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Primitive.Root open={open} onOpenChange={handleOpenChange}>
      <Primitive.Portal>
        <Primitive.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity duration-200" />
        <Primitive.Popup
          className={cn(
            "fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border bg-card p-0 text-card-foreground shadow-2xl outline-none transition-all duration-200",
          )}
        >
          {/* Header Cover Banner */}
          <div className="relative h-28 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-4">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/15 via-transparent to-transparent pointer-events-none" />
            <Primitive.Close
              aria-label="Đóng hộp thoại"
              className="absolute top-3.5 right-3.5 z-10 flex size-8 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition-colors hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X size={16} />
            </Primitive.Close>
          </div>

          {/* Main Body */}
          <div className="relative px-6 pb-6 pt-0">
            {/* Avatar overlay */}
            <div className="relative -mt-14 mb-4 flex items-end justify-between">
              <div className="relative">
                {user?.avatar && !avatarError ? (
                  <img
                    src={user.avatar}
                    alt={displayName}
                    onError={() => setAvatarError(true)}
                    className="size-20 rounded-2xl border-4 border-card bg-muted object-cover shadow-md"
                  />
                ) : (
                  <div className="grid size-20 place-items-center rounded-2xl border-4 border-card bg-primary text-xl font-bold text-primary-foreground shadow-md">
                    {initials}
                  </div>
                )}
                {/* Status indicator dot */}
                <span
                  title={statusInfo.label}
                  className={cn(
                    "absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-card",
                    statusInfo.dotColor,
                  )}
                />
              </div>

              {/* Status Badge */}
              {/* <div
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide",
                  statusInfo.className,
                )}
              >
                <span
                  className={cn("size-1.5 rounded-full", statusInfo.dotColor)}
                />
                {statusInfo.label}
              </div> */}
            </div>

            {!showConfirmLogout ? (
              <>
                {/* User Info Header */}
                <div className="mb-5">
                  <div className="flex items-center gap-2">
                    <Primitive.Title className="text-xl font-bold tracking-tight">
                      {displayName}
                    </Primitive.Title>
                    <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      <ShieldCheck size={13} />
                      ADMIN
                    </span>
                  </div>
                  <Primitive.Description className="mt-0.5 text-xs text-muted-foreground">
                    @{user?.username || "admin"} · Quản trị viên hệ thống
                  </Primitive.Description>
                </div>

                {/* Information Cards List */}
                <div className="mb-6 space-y-2 rounded-xl border bg-muted/40 p-3.5 text-sm">
                  {/* Email */}
                  <div className="flex items-center justify-between gap-2 py-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <Mail size={15} className="shrink-0" />
                      <span>Email</span>
                    </div>
                    <span
                      className="font-medium text-xs truncate max-w-[200px]"
                      title={user?.email}
                    >
                      {user?.email || "Chưa cập nhật"}
                    </span>
                  </div>

                  <div className="h-px bg-border/60" />

                  {/* Username */}
                  <div className="flex items-center justify-between gap-2 py-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <UserIcon size={15} className="shrink-0" />
                      <span>Tên đăng nhập</span>
                    </div>
                    <span className="font-medium text-xs">
                      {user?.username || "—"}
                    </span>
                  </div>

                  <div className="h-px bg-border/60" />

                  {/* Created At */}
                  <div className="flex items-center justify-between gap-2 py-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <Calendar size={15} className="shrink-0" />
                      <span>Ngày tham gia</span>
                    </div>
                    <span className="font-medium text-xs">
                      {formatDate(user?.created_at)}
                    </span>
                  </div>

                  <div className="h-px bg-border/60" />

                  <div className="flex items-center justify-between gap-2 py-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <ShieldCheck size={15} className="shrink-0" />
                      <span>Quyền hạn</span>
                    </div>
                    <span className="font-medium text-xs">{user?.role}</span>
                  </div>

                  {user?.id && (
                    <>
                      <div className="h-px bg-border/60" />
                      {/* User ID with Copy */}
                      <div className="flex items-center justify-between gap-2 py-1">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <span>User ID</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                            {user.id.length > 12
                              ? `${user.id.slice(0, 8)}...${user.id.slice(-4)}`
                              : user.id}
                          </code>
                          <button
                            type="button"
                            onClick={handleCopyId}
                            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            title="Sao chép ID đầy đủ"
                          >
                            {copied ? (
                              <Check size={13} className="text-emerald-500" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Dialog Footer Actions */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenChange(false)}
                  >
                    Đóng
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 gap-1.5 font-medium"
                    onClick={() => setShowConfirmLogout(true)}
                  >
                    <LogOut size={15} />
                    <span>Đăng xuất</span>
                  </Button>
                </div>
              </>
            ) : (
              /* Confirmation Logout View */
              <div className="pt-2 text-center animate-in fade-in-50 duration-200">
                <div className="mx-auto mb-3.5 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-base font-semibold">Xác nhận đăng xuất?</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Bạn có chắc chắn muốn đăng xuất khỏi tài khoản{" "}
                  <strong className="text-foreground">
                    @{user?.username || "admin"}
                  </strong>
                  ? Phiên làm việc sẽ kết thúc và bạn cần đăng nhập lại để tiếp
                  tục.
                </p>

                <div className="mt-6 flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isLoggingOut}
                    className="flex-1"
                    onClick={() => setShowConfirmLogout(false)}
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isLoggingOut}
                    className="flex-1 gap-1.5"
                    onClick={handleLogout}
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Đang đăng xuất...</span>
                      </>
                    ) : (
                      <>
                        <LogOut size={15} />
                        <span>Đăng xuất</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Primitive.Popup>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
