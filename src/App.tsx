import { useEffect, useRef, useState } from "react";
import {
	useBlocker,
	useLocation,
	useNavigate,
	Routes,
	Route,
} from "react-router";
import {
	LayoutDashboard,
	Monitor,
	Globe,
	Settings2,
	Wrench,
	FileText,
	MessageSquare,
	ShieldCheck,
	Menu,
	Moon,
	Sun,
	ChevronRight,
	Check,
	X,
	Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { initialSettings } from "@/data/admin-data";
import { settingGroups } from "@/data/setting-fields";
import type { SettingGroup } from "@/data/setting-fields";
import DashboardPage from "@/pages/DashboardPage";
import DevicesPage from "@/pages/DevicesPage";
import IpAddressesPage from "@/pages/IpAddressesPage";
import UsersPage from "@/pages/UsersPage";
import SettingsPage from "@/pages/SettingsPage";
import "./App.css";
import type {
	ActivityItem,
	SystemCommentWalkSetting,
	SystemPostSetting,
	SystemSetting,
	SystemToolSetting,
} from "./types/types";
import { useAuth } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import {
	getValueFromLocalStorage,
	setValueToLocalStorage,
} from "./utils/storage";
import { KEY_AUTH, KEY_THEME } from "./constants/constants";
import { ProfileDialog } from "@/components/admin/ProfileDialog";
import { systemSettingService } from "./services/system-setting-service";
import { handleExceptionGlobal } from "./utils/exception";
import Loading from "./components/admin/Loading";

const navigation = [
	{ path: "/", label: "Dashboard", icon: LayoutDashboard, section: "QUẢN LÝ" },
	{ path: "/users", label: "Người dùng", icon: Users },
	{ path: "/devices", label: "Thiết bị", icon: Monitor },
	{ path: "/ips", label: "Địa chỉ IP", icon: Globe },
	{
		path: "/settings/system",
		label: "Hệ thống",
		icon: Settings2,
		section: "CÀI ĐẶT",
	},
	{ path: "/settings/tool", label: "Tool", icon: Wrench },
	{ path: "/settings/post", label: "Đăng bài", icon: FileText },
	{ path: "/settings/comment", label: "Bình luận dạo", icon: MessageSquare },
];

export default function App() {
	const routerNavigate = useNavigate();
	const { pathname } = useLocation();

	const { state: authState } = useAuth();

	const mainRef = useRef<HTMLElement>(null);

	useEffect(() => {
		mainRef.current?.scrollTo({ top: 0 });
	}, [pathname]);

	const [settings, setSettings] = useState(initialSettings);
	const [loading, setLoading] = useState(false);
	const [activity, setActivity] = useState<ActivityItem[]>([]);
	const [notice, setNotice] = useState("");
	const [navOpen, setNavOpen] = useState(false);
	const [dark, setDark] = useState(() => {
		try {
			return getValueFromLocalStorage(KEY_THEME) === "true";
		} catch {
			return false;
		}
	});

	const [dirty, setDirty] = useState(false);
	const [profileOpen, setProfileOpen] = useState(false);

	const user = authState.user;
	const displayName = user?.name || user?.username || "Administrator";
	const userInitials =
		user?.name
			?.trim()
			.split(/\s+/)
			.slice(0, 2)
			.map((n) => n[0])
			.join("")
			.toUpperCase() ||
		user?.username?.slice(0, 2).toUpperCase() ||
		"AD";
	const blocker = useBlocker(
		({ currentLocation, nextLocation }) =>
			dirty && currentLocation.pathname !== nextLocation.pathname,
	);

	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		document.documentElement.classList.toggle("dark", dark);
		try {
			setValueToLocalStorage(KEY_THEME, String(dark));
		} catch {
			/* Theme still applies without storage. */
		}
	}, [dark]);

	useEffect(
		() => () => {
			if (timer.current) clearTimeout(timer.current);
		},
		[],
	);

	useEffect(() => {
		if (!dirty) return;
		const handler = (e: BeforeUnloadEvent) => e.preventDefault();
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [dirty]);

	useEffect(() => {
		const fn = async () => {
			try {
				setLoading(true);
				const [system, tool, post, comment] = await Promise.all([
					systemSettingService.getSystemSetting(),
					systemSettingService.getSystemToolSetting(),
					systemSettingService.getSystemPostSetting(),
					systemSettingService.getSystemCommentWalkSetting(),
				]);
				setSettings({
					system,
					tool,
					post,
					comment,
				});
			} catch (error) {
				handleExceptionGlobal(error);
			} finally {
				setLoading(false);
			}
		};
		fn();
	}, []);

	function notify(message: string) {
		setNotice(message);
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => setNotice(""), 4500);
	}

	function log(text: string) {
		setActivity((prev) =>
			[
				{
					id: crypto.randomUUID(),
					text,
					time: new Date().toLocaleTimeString("vi-VN", {
						timeZone: "Asia/Bangkok",
						hour: "2-digit",
						minute: "2-digit",
						second: "2-digit",
					}),
				},
				...prev,
			].slice(0, 30),
		);
	}

	function navigate(path: string) {
		setNavOpen(false);
		if (path !== pathname) routerNavigate(path);
	}

	const current = navigation.find((item) => item.path === pathname);

	if (
		!authState.is_authenticated &&
		!getValueFromLocalStorage(KEY_AUTH.TOKEN)
	) {
		return <LoginPage />;
	}

	async function handleUpdateSystemSetting(
		type: SettingGroup,
		value:
			| SystemSetting
			| SystemToolSetting
			| SystemPostSetting
			| SystemCommentWalkSetting,
	) {
		try {
			switch (type) {
				case "system":
					await systemSettingService.updateSystemSetting(
						value as SystemSetting,
					);

					break;
				case "tool":
					await systemSettingService.updateSystemToolSetting(
						value as SystemToolSetting,
					);
					break;
				case "post":
					await systemSettingService.updateSystemPostSetting(
						value as SystemPostSetting,
					);
					break;
				case "comment":
					await systemSettingService.updateSystemCommentWalkSetting(
						value as SystemCommentWalkSetting,
					);
					break;
			}
			setSettings((prev) => ({
				...prev,
				[type]: {
					...prev[type],
					...value,
				},
			}));
			//can log here
		} catch (error) {
			handleExceptionGlobal(error);
		}
	}

	return (
		<div className="flex h-dvh flex-col bg-background text-foreground">
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
						onClick={() => setProfileOpen(true)}
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
								{userInitials}
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
			<div className="relative flex min-h-0 flex-1">
				{navOpen && (
					<button
						className="absolute inset-0 z-20 bg-black/30 md:hidden"
						aria-label="Đóng menu"
						onClick={() => setNavOpen(false)}
					/>
				)}
				<aside
					className={`${navOpen ? "flex" : "hidden"} absolute inset-y-0 left-0 z-30 w-64 shrink-0 flex-col border-r bg-sidebar p-3 md:static md:flex`}
				>
					<div className="flex items-center gap-3 px-3 py-5">
						<span className="grid size-9 place-items-center rounded-lg border bg-card text-muted-foreground">
							<ShieldCheck size={20} />
						</span>
						<div>
							<p className="text-xs font-semibold">Admin workspace</p>
							<p className="mt-1 text-[11px] text-muted-foreground">
								Quản lý toàn hệ thống
							</p>
						</div>
					</div>
					<nav className="flex-1 overflow-y-auto">
						{navigation.map((item) => (
							<div key={item.path}>
								{item.section && (
									<p className="px-4 pt-5 pb-3 text-[10px] font-semibold tracking-widest text-muted-foreground">
										{item.section}
									</p>
								)}
								<button
									aria-current={pathname === item.path ? "page" : undefined}
									className={`mb-1 flex w-full items-center gap-3 rounded-lg border-l-3 px-3 py-2.5 text-left text-sm transition-colors ${pathname === item.path ? "border-primary bg-card font-medium text-primary shadow-xs" : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"}`}
									onClick={() => navigate(item.path)}
								>
									<item.icon size={18} />
									<span>{item.label}</span>
								</button>
							</div>
						))}
					</nav>
					<div className="m-2 mt-6 rounded-lg border p-3">
						<p className="flex items-center gap-2 text-xs font-medium">
							<ShieldCheck size={15} />
							Giao diện quản trị
						</p>
						<p className="mt-2 text-[11px] leading-5 text-muted-foreground">
							Dữ liệu mẫu trong phiên.
							<br />
							Chưa có API hoặc lệnh từ xa.
						</p>
					</div>
					<div className="flex justify-between px-3 py-3 text-[10px] text-muted-foreground">
						<span>FB Helper Admin</span>
						<span>v1.0.0</span>
					</div>
				</aside>
				<main ref={mainRef} className="min-w-0 relative flex-1 overflow-y-auto">
					<div className="mx-auto max-w-7xl p-4 sm:p-7 lg:p-8">
						<div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
							<span>Workspace</span>
							<ChevronRight size={13} />
							<span className="text-foreground">
								{current?.label ?? "Không tìm thấy trang"}
							</span>
						</div>
						<Routes>
							<Route
								path="/"
								element={
									<DashboardPage
										settings={settings}
										activity={activity}
										navigate={navigate}
									/>
								}
							/>
							<Route
								path="/users"
								element={
									<UsersPage
										// onChange={(_items, message) => {
										// 	log(message);
										// }}
										notify={notify}
									/>
								}
							/>
							<Route
								path="/devices"
								element={
									<DevicesPage
										// onChange={(_items, message) => {
										// 	log(message);
										// }}
										notify={notify}
									/>
								}
							/>
							<Route
								path="/ips"
								element={
									<IpAddressesPage
										// onChange={(_items, message) => {
										// 	log(message);
										// }}
										notify={notify}
									/>
								}
							/>
							{(Object.keys(settingGroups) as SettingGroup[]).map((group) => (
								<Route
									key={group}
									path={`/settings/${group}`}
									element={
										<SettingsPage
											key={group}
											group={group}
											settings={settings}
											onDirty={setDirty}
											onSave={(value) => {
												handleUpdateSystemSetting(group, value[group]);
											}}
										/>
									}
								/>
							))}
							<Route
								path="*"
								element={
									<div className="rounded-xl border bg-card p-10 text-center">
										<h1 className="text-xl font-semibold">
											Không tìm thấy trang
										</h1>
										<Button className="mt-5" onClick={() => navigate("/")}>
											Về Dashboard
										</Button>
									</div>
								}
							/>
						</Routes>
						<footer className="mt-9 flex justify-between gap-4 border-t pt-4 text-[10px] text-muted-foreground">
							<span>© {new Date().getFullYear()} FB Helper</span>
							<span>Admin workspace · Tiếng Việt</span>
						</footer>
					</div>
					{loading && <Loading type="cover" />}
				</main>
			</div>
			{notice && (
				<div
					role="status"
					className="fixed right-4 bottom-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl border bg-card p-4 text-sm shadow-lg"
				>
					<Check size={18} className="shrink-0 text-emerald-500" />
					<span>{notice}</span>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Đóng thông báo"
						onClick={() => setNotice("")}
					>
						<X size={16} />
					</Button>
				</div>
			)}
			<Dialog
				open={blocker.state === "blocked"}
				onOpenChange={(open) => {
					if (!open && blocker.state === "blocked") blocker.reset();
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Có thay đổi chưa lưu</DialogTitle>
						<DialogDescription>
							Bạn muốn bỏ các chỉnh sửa hiện tại và chuyển trang?
						</DialogDescription>
					</DialogHeader>
					<div className="dialog-actions">
						<Button
							variant="outline"
							onClick={() => {
								if (blocker.state === "blocked") blocker.reset();
							}}
						>
							Tiếp tục chỉnh sửa
						</Button>
						<Button
							onClick={() => {
								if (blocker.state !== "blocked") return;
								setDirty(false);
								setNavOpen(false);
								blocker.proceed();
							}}
						>
							Bỏ thay đổi
						</Button>
					</div>
				</DialogContent>
			</Dialog>
			<ProfileDialog
				open={profileOpen}
				onOpenChange={setProfileOpen}
				onLoggedOut={() => {
					navigate("/");
				}}
			/>
		</div>
	);
}
