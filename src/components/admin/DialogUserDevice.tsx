import type {
	BaseQueryParams,
	Device,
	IDeviceSetting,
	IPagination,
} from "@/types/types";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { useCallback, useEffect, useState } from "react";
import deviceService from "@/services/device-service";
import Loading from "./Loading";
import { EmptyState, ListToolbar, Pagination, StatusBadge } from "./shared";
import { Monitor, Power } from "lucide-react";
import { Button } from "../ui/button";
import { handleExceptionGlobal, logError } from "@/utils/exception";
import { debounce } from "lodash";

interface Props {
	open: boolean;
	onOpenChange: (_open: boolean) => void;
	device?: Device | null;
}

export default function DialogUserDevice({
	open,
	onOpenChange,
	device,
}: Props) {
	const [listDeviceSetting, setListDeviceSetting] = useState<IDeviceSetting[]>(
		[],
	);

	const [pagination, setPagination] = useState<IPagination>({
		pageNo: 0,
		pageSize: 5,
		totalPages: 1,
		totalElements: 0,
		last: true,
	});
	const [page, setPage] = useState(0);
	const [limit, setLimit] = useState(5);
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("");
	const [loading, setLoading] = useState(true);
	const [isFirstCalledApi, setIsFirstCalledApi] = useState(false);

	const [editting, setEditing] = useState<IDeviceSetting | null>(null);

	const fetch = useCallback(
		async (deviceId: string, query?: BaseQueryParams) => {
			setLoading(true);
			try {
				const queryFinal: BaseQueryParams = {
					page: query?.page ?? 0,
					limit: query?.limit ?? 5,
					search: query?.search ?? "",
					status: query?.status ?? "",
					sortBy: query?.sortBy ?? "",
					direction: query?.direction ?? "",
				};

				const pageDeviceSetting = await deviceService.getListDeviceSetting(
					deviceId,
					queryFinal,
				);
				setListDeviceSetting(pageDeviceSetting.list_device_setting);
				setPagination(pageDeviceSetting.pagination as IPagination);

				setIsFirstCalledApi(true);
			} catch (error) {
				logError("Error at fetch: ", error);
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	useEffect(() => {
		if (!device?.id) return;
		const fn = () => {
			fetch(device.id, {
				page: 0,
				limit: 5,
				search: "",
				status: "",
			});
		};

		if (!isFirstCalledApi) {
			fn();
		}

		return () => setIsFirstCalledApi(false);
	}, [device]);

	const debounceSearch = useCallback(
		// eslint-disable-next-line react-hooks/use-memo
		debounce(
			(
				deviceId: string | undefined,
				search: string,
				page: number,
				limit: number,
				status: string,
			) => {
				if (!deviceId) return;
				fetch(deviceId, {
					page,
					limit,
					search,
					status,
				});
			},
			500,
		),
		[],
	);

	const handleUpdateStatus = useCallback(
		async (userId: string, status: string) => {
			setLoading(true);
			try {
				await deviceService.updateStatusDeviceSetting(
					device?.id,
					userId,
					status,
				);
				setListDeviceSetting((prev) =>
					prev.map((item) =>
						item.user.id === userId ? { ...item, status } : item,
					),
				);
				setEditing(null);
			} catch (error) {
				logError("Error at handleUpdateStatus: ", error);
			} finally {
				setLoading(false);
			}
		},
		[device],
	);

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-2xl!">
					<DialogHeader>
						<DialogTitle>
							Danh sách người dùng của thiết bị {device?.device_name}
						</DialogTitle>
						<DialogDescription>{device?.id}</DialogDescription>
					</DialogHeader>

					<div className="w-full">
						<ListToolbar
							search={search}
							onSearch={async (value) => {
								if (search && !value && !value.trim()) {
									setLoading(true);
								}
								setPage(0);
								debounceSearch(device?.id, value, 0, limit, status);
								setSearch(value);
							}}
							status={status}
							onStatus={(value) => {
								setLoading(true);
								setPage(0);
								debounceSearch(device?.id, search, 0, limit, value);
								setStatus(value);
							}}
							className="px-0 py-4"
							placeholder="Tìm username..."
						/>
						<div className="overflow-x-auto min-h-40 relative">
							{loading && (
								<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-xs">
									<Loading fullScreen={false} title="Đang tải dữ liệu..." />
								</div>
							)}
							<table className="admin-table">
								<thead>
									<tr>
										<th>Tên người dùng</th>
										<th>Username</th>
										<th>Trạng thái</th>
										<th className="text-right">Thao tác</th>
									</tr>
								</thead>
								<tbody>
									{listDeviceSetting.map((ds, idx) => (
										<tr key={idx}>
											<td>
												<div className="flex items-center gap-3">
													<span className="grid size-9 place-items-center rounded-lg border bg-muted/50 text-muted-foreground">
														<Monitor size={18} />
													</span>
													<div>
														<span className="font-medium text-foreground">
															{ds.user.name || "Không có tên"}
														</span>
														<p className="mt-1 font-mono text-xs text-muted-foreground">
															{ds.user.id}
														</p>
													</div>
												</div>
											</td>
											<td>{ds.user.username}</td>
											<td>
												<StatusBadge status={ds.status} />
											</td>

											<td>
												<div className="flex justify-end gap-2">
													<Button
														variant={
															ds.status === "ACTIVE" ? "destructive" : "default"
														}
														className="min-w-20"
														onClick={() => {
															if (ds.status === "ACTIVE") {
																setEditing(ds);
															} else {
																handleUpdateStatus(ds.user.id, "ACTIVE");
															}
														}}
													>
														<Power size={14} />
														{ds.status === "ACTIVE" ? "Tắt" : "Bật"}
													</Button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>

							{listDeviceSetting.length === 0 && (
								<div className="w-full min-h-40 flex items-center justify-center">
									<EmptyState
										onReset={() => {
											setSearch("");
											setStatus("");
											setPage(0);
											if (device?.id) {
												fetch(device.id, {
													page: 0,
													limit,
													search: "",
													status: "",
												});
											}
										}}
										searching={Boolean(search || status)}
									/>
								</div>
							)}
						</div>

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
								if (device?.id) {
									fetch(device.id, {
										page: newPage,
										limit: limit,
										search: search,
										status: status,
									});
								}
							}}
							onLimitChange={(newLimit) => {
								setPagination((prev) => ({
									...prev,
									pageSize: newLimit,
								}));
								setLimit(newLimit);
								if (device?.id) {
									fetch(device.id, {
										page: page,
										limit: newLimit,
										search: search,
										status: status,
									});
								}
							}}
							itemName="thiết bị của người dùng"
						/>
					</div>
				</DialogContent>
			</Dialog>
			<Dialog open={!!editting} onOpenChange={(_value) => setEditing(null)}>
				<DialogContent>
					<DialogHeader>
						Tắt thiết bị của người dùng{" "}
						{editting?.user.name || editting?.user.username || "Không có tên"}
					</DialogHeader>
					<DialogDescription>
						Bạn có chắc chắn muốn tắt thiết bị này không?
					</DialogDescription>
					<DialogFooter>
						<Button variant="outline" onClick={() => setEditing(null)}>
							Huỷ
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								handleUpdateStatus(editting?.user.id || "", "INACTIVE");
							}}
						>
							Xác nhận
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
