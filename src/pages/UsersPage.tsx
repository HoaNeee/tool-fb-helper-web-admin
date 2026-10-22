import Loading from "@/components/admin/Loading";
import { Pagination } from "@/components/admin/Pagination";
import {
  EmptyState,
  ListToolbar,
  PageHeading,
  StatusBadge,
} from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import fileService from "@/services/file-service";
import {
  userService,
  type User,
  type UserRole,
  type UserStatus,
} from "@/services/user-service";
import {
  Pencil,
  Plus,
  Power,
  Shield,
  ShieldCheck,
  UploadCloud,
  User as UserIcon,
  UserCheck,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const roleLabels: Record<UserRole, { label: string; badgeClass: string }> = {
  SUPER_ADMIN: {
    label: "Quản trị cấp cao",
    badgeClass:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
  },
  ADMIN: {
    label: "Quản trị viên",
    badgeClass:
      "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20",
  },
  MEMBER: {
    label: "Thành viên",
    badgeClass:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  },
  USER: {
    label: "Người dùng",
    badgeClass: "bg-muted text-muted-foreground border border-transparent",
  },
};

export default function UsersPage({
  onChange,
  notify,
}: {
  onChange?: (_items: User[], _message: string) => void;
  notify: (_message: string) => void;
}) {
  const { state: authState } = useAuth();
  const currentUser = authState.user;
  // Người dùng hiện tại có phải là SUPER_ADMIN hay không
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    admins: 0,
  });

  const [editing, setEditing] = useState<User | "new" | null>(null);
  const [stopping, setStopping] = useState<User | null>(null);
  const [error, setError] = useState("");

  // Avatar upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("MEMBER");

  // Load summary statistics across all users
  const refreshStats = async () => {
    try {
      const all = await userService.getAllUsers();
      setStats({
        total: all.length,
        active: all.filter((u) => u.status === "ACTIVE").length,
        pending: all.filter((u) => u.status === "PENDING").length,
        admins: all.filter(
          (u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN",
        ).length,
      });
    } catch {
      // Ignore stats error
    }
  };

  // Fetch paginated data from API (with search and filters combined)
  const fetchUsers = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await userService.getUsers({
        page: targetPage,
        limit,
        search,
        status,
        role: roleFilter,
      });
      setUsers(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch (err) {
      console.error("Lỗi khi tải danh sách người dùng:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when filters or pagination changes with debounce on search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchUsers(page);
    }, 300);

    return () => clearTimeout(handler);
  }, [search, status, roleFilter, page, limit]);

  useEffect(() => {
    refreshStats();
  }, []);

  const handleOpenAdd = () => {
    setError("");
    setAvatarUrl("");
    setSelectedRole("MEMBER");
    setEditing("new");
  };

  const handleOpenEdit = (user: User) => {
    setError("");
    setAvatarUrl(user.avatar || "");
    setSelectedRole(user.role);
    setEditing(user);
  };

  const handleAvatarFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP, GIF).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Dung lượng ảnh tối đa cho phép là 5MB.");
      return;
    }

    try {
      setUploadingAvatar(true);
      setError("");
      const uploadedUrl = await fileService.uploadImage(file);
      setAvatarUrl(uploadedUrl);
    } catch (err) {
      console.error("Lỗi upload ảnh:", err);
      setError("Tải ảnh lên thất bại, vui lòng thử lại.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  async function save(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = new FormData(e.currentTarget);
    const username = String(values.get("username")).trim();
    const name = String(values.get("name")).trim();
    const email = String(values.get("email")).trim();
    const password = String(values.get("password") || "").trim();
    const role = selectedRole;
    const userStatus = String(values.get("status")) as UserStatus;

    if (!username || !name || !email) {
      setError("Tên đăng nhập, họ tên và email không được để trống.");
      return;
    }

    if (editing === "new" && !password) {
      setError("Mật khẩu không được để trống khi tạo người dùng mới.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Địa chỉ email không hợp lệ.");
      return;
    }

    // Role restriction check
    if (!isSuperAdmin && (role === "ADMIN" || role === "SUPER_ADMIN")) {
      setError("Chỉ Super Admin mới có quyền gán vai trò Quản trị viên.");
      return;
    }

    try {
      if (editing === "new") {
        const newUser = await userService.createUser({
          username,
          name,
          email,
          password: password || "••••••••",
          avatar: avatarUrl,
          role,
          status: userStatus,
        });

        notify("Đã thêm người dùng mới thành công.");
        onChange?.([newUser, ...users], `Thêm người dùng ${newUser.username}`);
      } else if (editing) {
        const updated = await userService.updateUser(editing.id, {
          username,
          name,
          email,
          ...(password ? { password } : {}),
          avatar: avatarUrl,
          role,
          status: userStatus,
        });

        notify("Đã lưu thông tin người dùng.");
        onChange?.(
          users.map((u) => (u.id === updated.id ? updated : u)),
          `Cập nhật người dùng ${updated.username}`,
        );
      }

      setEditing(null);
      refreshStats();
      fetchUsers(page);
    } catch (err) {
      console.error(err);
      setError("Lưu người dùng thất bại, vui lòng thử lại.");
    }
  }

  return (
    <>
      <PageHeading
        title="Quản lý người dùng"
        description="Danh sách tài khoản người dùng, phân quyền và trạng thái trong hệ thống."
        action={
          <Button className="h-9 cursor-pointer" onClick={handleOpenAdd}>
            <Plus size={16} />
            Thêm người dùng
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Tổng người dùng", count: stats.total },
          { title: "Đang hoạt động", count: stats.active },
          { title: "Chờ kích hoạt", count: stats.pending },
          { title: "Quản trị viên", count: stats.admins },
        ].map((s) => (
          <div className="rounded-xl border bg-card p-5" key={s.title}>
            <span className="text-sm text-muted-foreground">{s.title}</span>
            <strong className="mt-2 block text-3xl font-semibold">
              {s.count}
            </strong>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <h2 className="font-semibold">Danh sách người dùng</h2>
          <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {total}
          </span>
        </div>

        <ListToolbar
          search={search}
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          status={status}
          onStatus={(v) => {
            setStatus(v);
            setPage(1);
          }}
          placeholder="Tìm kiếm API (username, tên, email, ID)..."
          statusOptions={[
            { value: "all", label: "Tất cả trạng thái" },
            { value: "ACTIVE", label: "Đang hoạt động" },
            { value: "PENDING", label: "Chờ kích hoạt" },
            { value: "INACTIVE", label: "Đã tắt" },
            { value: "LOCKED", label: "Đã khóa" },
          ]}
        >
          <select
            className="select-control"
            aria-label="Lọc vai trò"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Tất cả vai trò</option>
            <option value="SUPER_ADMIN">Quản trị cấp cao</option>
            <option value="ADMIN">Quản trị viên</option>
            <option value="MEMBER">Thành viên</option>
            <option value="USER">Người dùng</option>
          </select>
        </ListToolbar>

        <div className="overflow-x-auto min-h-60 relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-xs">
              <Loading fullScreen={false} title="Đang tải dữ liệu..." />
            </div>
          )}

          <table className="admin-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const initials =
                  u.name
                    ?.trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() ||
                  u.username.slice(0, 2).toUpperCase() ||
                  "US";

                return (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="size-9 rounded-lg border object-cover bg-muted"
                          />
                        ) : (
                          <span className="grid size-9 place-items-center rounded-lg border bg-primary/10 text-xs font-bold text-primary">
                            {initials}
                          </span>
                        )}
                        <div>
                          <span className="font-medium text-foreground">
                            {u.name}
                          </span>
                          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                            @{u.username} · {u.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm font-mono text-muted-foreground">
                      {u.email}
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${roleLabels[u.role]?.badgeClass || "bg-muted"}`}
                      >
                        {u.role === "SUPER_ADMIN" ? (
                          <ShieldCheck size={12} />
                        ) : u.role === "ADMIN" ? (
                          <Shield size={12} />
                        ) : u.role === "MEMBER" ? (
                          <UserCheck size={12} />
                        ) : (
                          <UserIcon size={12} />
                        )}
                        {roleLabels[u.role]?.label || u.role}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="text-xs text-muted-foreground">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString("vi-VN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Sửa ${u.name}`}
                          onClick={() => handleOpenEdit(u)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant={
                            u.status === "ACTIVE" ? "outline" : "secondary"
                          }
                          className="min-w-20"
                          onClick={async () => {
                            if (u.status === "ACTIVE") {
                              setStopping(u);
                            } else {
                              try {
                                await userService.updateUser(u.id, {
                                  status: "ACTIVE",
                                });
                                notify(
                                  `Đã kích hoạt tài khoản ${u.username} thành công.`,
                                );
                                refreshStats();
                                fetchUsers(page);
                              } catch (err) {
                                console.error(err);
                              }
                            }
                          }}
                        >
                          <Power size={14} />
                          {u.status === "ACTIVE" ? "Tắt" : "Bật"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading && users.length === 0 && (
          <EmptyState
            onReset={() => {
              setSearch("");
              setStatus("all");
              setRoleFilter("all");
              setPage(1);
            }}
          />
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          limit={limit}
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          itemName="người dùng"
        />
      </section>

      {/* Dialog Thêm / Sửa người dùng */}
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing === "new"
                ? "Thêm người dùng mới"
                : "Chỉnh sửa người dùng"}
            </DialogTitle>
            <DialogDescription>
              {editing === "new"
                ? "Điền thông tin tài khoản người dùng theo schema User."
                : "Cập nhật thông tin tài khoản theo schema User."}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={save}
            key={editing === "new" ? "new" : editing?.id}
            className="space-y-4"
          >
            {editing !== "new" && editing?.id && (
              <label className="field-label">
                ID người dùng
                <Input value={editing.id} readOnly />
              </label>
            )}

            {/* Chọn ảnh đại diện từ máy tính */}
            <div className="field-label">
              <span>Ảnh đại diện</span>
              <div className="mt-1.5 flex items-center gap-4">
                <div className="relative group size-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted flex items-center justify-center">
                  {uploadingAvatar ? (
                    <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar preview"
                      className="size-full object-cover"
                    />
                  ) : (
                    <UserIcon size={26} className="text-muted-foreground" />
                  )}
                </div>

                <div className="flex flex-col gap-1.5 flex-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingAvatar}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadCloud size={14} />
                      {avatarUrl ? "Đổi ảnh từ máy" : "Chọn ảnh từ máy"}
                    </Button>

                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAvatarUrl("");
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                      >
                        <X size={14} />
                        Gỡ ảnh
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Hỗ trợ PNG, JPG, WEBP tối đa 5MB qua file-service.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field-label">
                Tên đăng nhập
                <Input
                  name="username"
                  required
                  maxLength={50}
                  defaultValue={editing !== "new" ? editing?.username : ""}
                  placeholder="admin_fb"
                />
              </label>
              <label className="field-label">
                Họ và tên
                <Input
                  name="name"
                  required
                  maxLength={100}
                  defaultValue={editing !== "new" ? editing?.name : ""}
                  placeholder="Nguyễn Văn A"
                />
              </label>
            </div>

            <label className="field-label">
              Email
              <Input
                name="email"
                type="email"
                required
                maxLength={120}
                defaultValue={editing !== "new" ? editing?.email : ""}
                placeholder="name@example.com"
              />
            </label>

            <label className="field-label">
              Mật khẩu {editing !== "new" ? "(để trống nếu không đổi)" : ""}
              <Input
                name="password"
                type="password"
                required={editing === "new"}
                maxLength={100}
                placeholder={
                  editing === "new"
                    ? "Nhập mật khẩu..."
                    : "Nhập mật khẩu mới..."
                }
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="field-label">
                <span>Vai trò</span>
                <select
                  className="select-control"
                  name="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                >
                  {isSuperAdmin && (
                    <>
                      <option value="SUPER_ADMIN">
                        Quản trị cấp cao (SUPER_ADMIN)
                      </option>
                      <option value="ADMIN">Quản trị viên (ADMIN)</option>
                    </>
                  )}
                  <option value="MEMBER">Thành viên (MEMBER)</option>
                  <option value="USER">Người dùng (USER)</option>
                </select>
                {!isSuperAdmin && (
                  <span className="mt-1 text-[11px] text-muted-foreground">
                    * Chỉ Super Admin mới có quyền chọn vai trò Quản trị viên.
                  </span>
                )}
              </label>

              <label className="field-label">
                <span>Trạng thái</span>
                <select
                  className="select-control"
                  name="status"
                  defaultValue={editing !== "new" ? editing?.status : "ACTIVE"}
                >
                  <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                  <option value="PENDING">Chờ kích hoạt (PENDING)</option>
                  <option value="INACTIVE">Đã tắt (INACTIVE)</option>
                  <option value="LOCKED">Đã khóa (LOCKED)</option>
                </select>
              </label>
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="dialog-actions">
              <Button
                variant="outline"
                type="button"
                onClick={() => setEditing(null)}
              >
                Hủy
              </Button>
              <Button type="submit">
                {editing === "new" ? "Thêm người dùng" : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận tắt tài khoản */}
      <Dialog
        open={stopping !== null}
        onOpenChange={(open) => {
          if (!open) setStopping(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tắt tài khoản người dùng?</DialogTitle>
            <DialogDescription>
              Trạng thái tài khoản sẽ được chuyển sang INACTIVE trong giao diện.
            </DialogDescription>

            <div>
              <p className="text-sm">
                Tài khoản: <strong>{stopping?.name}</strong> (@
                {stopping?.username})
              </p>
              <div className="dialog-actions">
                <Button variant="outline" onClick={() => setStopping(null)}>
                  Hủy
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (!stopping) return;
                    try {
                      await userService.updateUser(stopping.id, {
                        status: "INACTIVE",
                      });
                      notify("Đã tắt tài khoản người dùng.");
                      setStopping(null);
                      refreshStats();
                      fetchUsers(page);
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  <Power size={14} />
                  Tắt tài khoản
                </Button>
              </div>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
