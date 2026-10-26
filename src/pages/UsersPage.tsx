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
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { userHelper } from "@/helpers/user-helper";
import {
	userService,
	type User,
	type UserRole,
	type UserStatus,
} from "@/services/user-service";
import type { BaseQueryParams, IPagination } from "@/types/types";
import { handleExceptionGlobal, logError } from "@/utils/exception";
import { debounce } from "lodash";
import {
	Pencil,
	Plus,
	Power,
	Shield,
	ShieldCheck,
	UserCheck,
	User as UserIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const roleLabels: Record<UserRole, { label: string; badgeClass: string }> = {
	ROLE_SUPER_ADMIN: {
		label: "Quản trị cấp cao",
		badgeClass:
			"bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
	},
	ROLE_ADMIN: {
		label: "Quản trị viên",
		badgeClass:
			"bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20",
	},
	ROLE_MEMBER: {
		label: "Thành viên",
		badgeClass:
			"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
	},
	ROLE_USER: {
		label: "Người dùng",
		badgeClass: "bg-muted text-muted-foreground border border-transparent",
	},
};

export default function UsersPage({
	notify,
}: {
	notify: (_message: string) => void;
}) {
	const { state: authState } = useAuth();
	const currentUser = authState.user;
	// Người dùng hiện tại có phải là SUPER_ADMIN hay không
	const isSuperAdmin = userHelper.isSuperAdmin(currentUser?.role);

	const [users, setUsers] = useState<User[]>([]);
	const [pagination, setPagination] = useState<IPagination>({
		pageNo: 0,
		pageSize: 5,
		totalPages: 1,
		totalElements: 0,
		last: true,
	});
	const [page, setPage] = useState(0);
	const [limit, setLimit] = useState(5);
	const [loading, setLoading] = useState(true);
	const [isFirstCalledApi, setIsFirstCalledApi] = useState(false);

	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("");
	const [roleFilter, setRoleFilter] = useState("");

	const [selecting, setSelecting] = useState<User | null>(null);
	const [actionChange, setActionChange] = useState<"status" | "role" | null>(
		null,
	);
	const [roleValue, setRoleValue] = useState<UserRole>();
	const [statusValue, setStatusValue] = useState<UserStatus>();

	const [stats, setStats] = useState({
		total: 0,
		active: 0,
		pending: 0,
		locked: 0,
		admins: 0,
	});

	const [editing, setEditing] = useState<User | "new" | null>(null);
	const [error, setError] = useState("");

	const [selectedRole, setSelectedRole] = useState<UserRole>("ROLE_MEMBER");

	// Load summary statistics across all users
	const refreshStats = async () => {
		try {
			const data = await userService.getStatistics();
			setStats({
				total:
					data.count_user_active +
					data.count_user_inactive +
					data.count_user_locked +
					data.count_user_pending,
				active: data.count_user_active,
				pending: data.count_user_pending,
				locked: data.count_user_locked,
				admins: 0,
			});
		} catch {
			// Ignore stats error
		}
	};

	// Fetch paginated data from API (with search and filters combined)
	const fetchUsers = useCallback(async (query?: BaseQueryParams) => {
		setLoading(true);
		try {
			const queryFinal: BaseQueryParams = {
				page: query?.page ?? 0,
				limit: query?.limit ?? 5,
				search: query?.search ?? "",
				status: query?.status ?? "",
				role: query?.role ?? "",
				sortBy: query?.sortBy ?? "",
				direction: query?.direction ?? "",
			};
			const res = await userService.getUsers(queryFinal);
			setUsers(res.items);
			setPagination(res.pagination as IPagination);
			setIsFirstCalledApi(true);
		} catch (err) {
			logError("Lỗi khi tải danh sách người dùng:", err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		const fn = () => {
			fetchUsers({
				page: 0,
				limit: 5,
				search: "",
				status: "",
				role: "",
			});
		};

		if (!isFirstCalledApi) {
			fn();
		}

		return () => setIsFirstCalledApi(false);
	}, []);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		refreshStats();
	}, []);

	const debounceSearch = useCallback(
		// eslint-disable-next-line react-hooks/use-memo
		debounce(
			(
				search: string,
				page: number,
				limit: number,
				status: string,
				role: string,
			) => {
				fetchUsers({
					page,
					limit,
					search,
					status,
					role,
				});
			},
			500,
		),
		[],
	);

	const handleOpenAdd = () => {
		setError("");
		setSelectedRole("ROLE_MEMBER");
		setEditing("new");
	};

	const handleOpenEdit = (user: User) => {
		setError("");
		setSelectedRole(user.role);
		setEditing(user);
	};

	async function save(e: React.SubmitEvent<HTMLFormElement>) {
		e.preventDefault();
		const values = new FormData(e.currentTarget);

		const payload: Partial<User> = {};

		values.forEach((v, k) => {
			payload[k] = v;
		});

		const username = String(values.get("username")).trim();
		const email = String(values.get("email")).trim();
		const password = String(values.get("password") || "").trim();
		const role = selectedRole;
		payload.role = role;

		if (!username || !email) {
			setError("Tên đăng nhập, email không được để trống.");
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

		if (!isSuperAdmin && role === "ROLE_SUPER_ADMIN") {
			setError("Chỉ Super Admin mới có quyền gán vai trò Quản trị viên.");
			return;
		}

		try {
			if (editing === "new") {
				const newUser = await userService.createUser(payload);

				notify("Đã thêm người dùng mới thành công.");
				setUsers((prev) => [newUser, ...prev]);
			} else if (editing) {
				const updated = await userService.updateUser(editing.id, payload);
				setUsers((prev) =>
					prev.map((u) => (u.id === updated.id ? updated : u)),
				);

				notify("Đã lưu thông tin người dùng.");
			}

			setEditing(null);
			refreshStats();
		} catch (err) {
			logError("Error update or create user:", err);
			setError(err.message || "Lưu người dùng thất bại, vui lòng thử lại.");
		}
	}

	function getRoleLabelHtml(role: UserRole) {
		return (
			<span
				className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${roleLabels[role]?.badgeClass || "bg-muted"}`}
			>
				{userHelper.isSuperAdmin(role) ? (
					<ShieldCheck size={12} className="not-hidden" />
				) : userHelper.isAdmin(role) ? (
					<Shield size={12} className="not-hidden" />
				) : userHelper.isMember(role) ? (
					<UserCheck size={12} className="not-hidden" />
				) : (
					<UserIcon size={12} className="not-hidden" />
				)}
				{roleLabels[role]?.label || role}
			</span>
		);
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
						{pagination.totalElements}
					</span>
				</div>

				<ListToolbar
					search={search}
					onSearch={async (v) => {
						setPage(0);
						debounceSearch(v, 0, limit, status, roleFilter);
						setSearch(v);
					}}
					status={status}
					onStatus={(v) => {
						setPage(0);
						debounceSearch(search, 0, limit, v, roleFilter);
						setStatus(v);
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
							const val = e.target.value;
							setRoleFilter(val);
							setPage(0);
							debounceSearch(search, 0, limit, status, val);
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
											<Select
												value={u.role}
												onValueChange={(value) => {
													setRoleValue(value as UserRole);
													setActionChange("role");
													setSelecting(u);
												}}
											>
												<SelectTrigger
													className={
														"outline-0 border-0 [&_svg:not([class*='not-hidden'])]:hidden"
													}
												>
													<SelectValue placeholder="Chọn vai trò">
														{getRoleLabelHtml(u.role)}
													</SelectValue>
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="ROLE_SUPER_ADMIN">
														Quản trị cấp cao
													</SelectItem>
													<SelectItem value="ROLE_ADMIN">
														Quản trị viên
													</SelectItem>
													<SelectItem value="ROLE_MEMBER">
														Thành viên
													</SelectItem>
													<SelectItem value="ROLE_USER">Người dùng</SelectItem>
												</SelectContent>
											</Select>
										</td>
										<td>
											<Select
												value={u.status}
												onValueChange={(value) => {
													setStatusValue(value as UserStatus);
													setActionChange("status");
													setSelecting(u);
												}}
											>
												<SelectTrigger
													className={"outline-0 border-0 [&_svg]:hidden"}
												>
													<SelectValue placeholder="Chọn trạng thái">
														<StatusBadge status={u.status} />
													</SelectValue>
												</SelectTrigger>
												<SelectContent>
													<SelectGroup>
														<SelectItem value="ACTIVE">ACTIVE</SelectItem>
														<SelectItem value="PENDING">PENDING</SelectItem>
														<SelectItem value="INACTIVE">INACTIVE</SelectItem>
														<SelectItem value="LOCKED">LOCKED</SelectItem>
													</SelectGroup>
												</SelectContent>
											</Select>
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
							setStatus("");
							setRoleFilter("");
							setPage(0);
							fetchUsers({
								page: 0,
								limit,
								search: "",
								status: "",
								role: "",
							});
						}}
						searching={Boolean(search || status || roleFilter)}
					/>
				)}

				<Pagination
					page={pagination.pageNo}
					totalPages={pagination.totalPages}
					totalItems={pagination.totalElements}
					limit={pagination.pageSize}
					onPageChange={(newPage) => {
						setPagination((prev) => ({
							...prev,
							pageNo: newPage,
						}));
						setPage(newPage);
						fetchUsers({
							page: newPage,
							limit: limit,
							search: search,
							status: status,
							role: roleFilter,
						});
					}}
					onLimitChange={(newLimit) => {
						setPagination((prev) => ({
							...prev,
							pageSize: newLimit,
						}));
						setLimit(newLimit);
						fetchUsers({
							page: page,
							limit: newLimit,
							search: search,
							status: status,
							role: roleFilter,
						});
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
								? "Điền thông tin tài khoản người dùng"
								: "Cập nhật thông tin tài khoản"}
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

						<div className="grid gap-3">
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

						{editing === "new" && (
							<label className="field-label">
								Mật khẩu
								<Input
									name="password"
									type="password"
									required={true}
									maxLength={100}
									placeholder={"Nhập mật khẩu..."}
									autoComplete="new-password"
								/>
							</label>
						)}

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
											<option value="ROLE_SUPER_ADMIN">
												Quản trị cấp cao (SUPER_ADMIN)
											</option>
											<option value="ROLE_ADMIN">Quản trị viên (ADMIN)</option>
										</>
									)}
									<option value="ROLE_MEMBER">Thành viên (MEMBER)</option>
									<option value="ROLE_USER">Người dùng (USER)</option>
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
				open={selecting !== null}
				onOpenChange={(open) => {
					if (!open) setSelecting(null);
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Xác nhận thay đổi</DialogTitle>
						<DialogDescription>
							Xác nhận thay đổi{" "}
							{actionChange === "status" ? "trạng thái" : "vai trò"}
							về tài khoản người dùng thành{" "}
							{actionChange === "status"
								? statusValue
								: userHelper.getRoleLabel(roleValue)}
							{". Bạn có chắc chắn?"}
						</DialogDescription>

						<div>
							<p className="text-sm">
								Tài khoản: <strong>{selecting?.name || "Không có tên"}</strong>{" "}
								(@
								{selecting?.username})
							</p>
							<div className="dialog-actions">
								<Button variant="outline" onClick={() => setSelecting(null)}>
									Hủy
								</Button>
								<Button
									variant="destructive"
									onClick={async () => {
										if (!selecting) return;
										try {
											if (actionChange === "role") {
												await userService.updateRoleUser(
													selecting.id,
													roleValue,
												);
												setUsers((prev) =>
													prev.map((u) =>
														u.id === selecting.id
															? { ...u, role: roleValue }
															: u,
													),
												);
											} else {
												await userService.updateStatusUser(
													selecting.id,
													statusValue,
												);
												setUsers((prev) =>
													prev.map((u) =>
														u.id === selecting.id
															? { ...u, status: statusValue }
															: u,
													),
												);
											}

											setSelecting(null);
											refreshStats();
										} catch (err) {
											handleExceptionGlobal(err);
										}
									}}
								>
									{actionChange === "status"
										? "Thay đổi trạng thái"
										: "Thay đổi vai trò"}
								</Button>
							</div>
						</div>
					</DialogHeader>
				</DialogContent>
			</Dialog>
		</>
	);
}
