import DialogUserDevice from "@/components/admin/DialogUserDevice";
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
import { deviceService } from "@/services/device-service";
import type {
  AdminDeviceResponse,
  BaseQueryParams,
  Device,
  IPagination,
} from "@/types/types";
import { handleExceptionGlobal, logError } from "@/utils/exception";
import { Eye, Monitor, Pencil, Power } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { debounce } from "lodash";
import showToast from "@/helpers/toast-helper";

export default function DevicesPage() {
  const [devices, setDevices] = useState<AdminDeviceResponse[]>([]);
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
  const [loadingPage, setLoadingPage] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  const [userDevice, setUserDevice] = useState<Device | null>(null);
  const [editing, setEditing] = useState<Device | null>(null);
  const [stopping, setStopping] = useState<Device | null>(null);
  const [error, setError] = useState("");

  const refreshStats = async () => {
    try {
      const data = await deviceService.getStatistics();
      setStats({
        total: data.count_device_active + data.count_device_inactive,
        active: data.count_device_active,
        inactive: data.count_device_inactive,
      });
    } catch (err) {
      handleExceptionGlobal(err, "Không thể lấy thông tin thống kê thiết bị");
    }
  };

  const fetchDevices = useCallback(async (query?: BaseQueryParams) => {
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
      const res = await deviceService.getDevices(queryFinal);
      setDevices(res.devices);
      setPagination(res.pagination as IPagination);
      setIsFirstCalledApi(true);
    } catch (err) {
      handleExceptionGlobal(err, "Không thể lấy danh sách thiết bị");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fn = async () => {
      setLoadingPage(true);
      await fetchDevices({
        page: 0,
        limit: 5,
        search: "",
        status: "",
      });
      setLoadingPage(false);
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
    debounce((search: string, page: number, limit: number, status: string) => {
      fetchDevices({
        page,
        limit,
        search,
        status,
      });
    }, 500),
    [],
  );

  async function save(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!editing) return;

    const values = new FormData(e.currentTarget);

    const payload: Partial<Device> = {};

    values.forEach((v, k) => {
      if (editing[k] !== v) {
        payload[k] = v;
      }
    });

    if (Object.keys(payload).length === 0) {
      setEditing(null);
      return;
    }

    const name = String(values.get("device_name")).trim();
    const type = String(values.get("device_type")).trim();
    if (!name || !type) {
      setError("Tên và loại thiết bị không được để trống.");
      return;
    }

    try {
      await deviceService.updateDevice(editing.id, {
        device_name: name,
        device_type: type,
        status: values.get("status") === "ACTIVE" ? "ACTIVE" : "INACTIVE",
      });

      setEditing(null);
      refreshStats();
      setDevices((prev) =>
        prev.map((d) =>
          d.device?.id === editing.id ? { ...d, ...payload } : d,
        ),
      );
      showToast({
        description: "Cập nhật thiết bị thành công",
        type: "success",
      });
    } catch (err) {
      handleExceptionGlobal(err, "Không thể cập nhật thiết bị");
    }
  }

  return (
    <>
      {loadingPage && <Loading type="cover" blur />}
      <PageHeading
        title="Quản lý thiết bị"
        description="Danh sách thiết bị, thông tin và trạng thái kích hoạt."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { title: "Tổng thiết bị", count: stats.total },
          {
            title: "Đang bật",
            count: stats.active,
          },
          {
            title: "Đã tắt",
            count: stats.inactive,
          },
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
          <h2 className="font-semibold">Danh sách thiết bị</h2>
          <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {pagination.totalElements}
          </span>
        </div>

        <ListToolbar
          search={search}
          onSearch={async (value) => {
            if (search && !value) {
              setLoading(true);
            }
            setPage(0);
            debounceSearch(value, 0, limit, status);
            setSearch(value);
          }}
          status={status}
          onStatus={(value) => {
            setLoading(true);
            setPage(0);
            debounceSearch(search, 0, limit, value);
            setStatus(value);
          }}
          placeholder="Tìm ID, tên hoặc loại thiết bị..."
        />

        <div className="overflow-x-auto min-h-60 relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-xs">
              <Loading fullScreen={false} title="Đang tải dữ liệu..." />
            </div>
          )}

          <table className="admin-table">
            <thead>
              <tr>
                <th>Thiết bị</th>
                <th>Loại thiết bị</th>
                <th>Trạng thái</th>
                <th>Số người dùng</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.device.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-lg border bg-muted/50 text-muted-foreground">
                        <Monitor size={18} />
                      </span>
                      <div>
                        <span className="font-medium text-foreground">
                          {d.device.device_name}
                        </span>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          {d.device.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>{d.device.device_type}</td>
                  <td>
                    <StatusBadge status={d.device.status} />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <b>{d.count_device_active + d.count_device_inactive}</b>{" "}
                      người dùng
                      <button
                        className="cursor-pointer rounded-sm p-1 hover:bg-gray-100"
                        title="Xem danh sách người dùng"
                        onClick={() => {
                          setError("");
                          setUserDevice(d.device);
                        }}
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Sửa ${d.device.device_name}`}
                        onClick={() => {
                          setError("");
                          setEditing(d.device);
                        }}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant={
                          d.device.status === "ACTIVE"
                            ? "destructive"
                            : "default"
                        }
                        className="min-w-20"
                        onClick={async () => {
                          if (d.device.status === "ACTIVE") {
                            setStopping(d.device);
                          } else {
                            try {
                              await deviceService.updateStatusDevice(
                                d.device.id,
                                "ACTIVE",
                              );
                              refreshStats();
                              setDevices((prev) => {
                                return prev.map((d) => {
                                  if (d.device.id === d.device.id) {
                                    return {
                                      ...d,
                                      device: {
                                        ...d.device,
                                        status: "ACTIVE",
                                      },
                                    };
                                  }
                                  return d;
                                });
                              });
                            } catch (err) {
                              handleExceptionGlobal(
                                err,
                                "Không thể bật thiết bị",
                              );
                            }
                          }
                        }}
                      >
                        <Power size={14} />
                        {d.device.status === "ACTIVE" ? "Tắt" : "Bật"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && devices.length === 0 && (
            <div className="flex items-center justify-center min-h-50">
              <EmptyState
                onReset={() => {
                  setSearch("");
                  setStatus("");
                  setPage(0);
                  fetchDevices({
                    page: 0,
                    limit,
                    search: "",
                    status: "",
                  });
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
            fetchDevices({
              page: newPage,
              limit: limit,
              search: search,
              status: status,
            });
          }}
          onLimitChange={(newLimit) => {
            setPagination((prev) => ({
              ...prev,
              pageSize: newLimit,
            }));
            setLimit(newLimit);
            fetchDevices({
              page: page,
              limit: newLimit,
              search: search,
              status: status,
            });
          }}
          itemName="thiết bị"
        />
      </section>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{"Chỉnh sửa thiết bị"}</DialogTitle>
            <DialogDescription>Cập nhật thông tin device.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} key={editing?.id}>
            <label className="field-label">
              ID
              <Input value={editing?.id} readOnly />
            </label>

            <label className="field-label">
              Tên thiết bị
              <Input
                name="device_name"
                required
                maxLength={120}
                defaultValue={editing?.device_name}
                placeholder="Marketing · Chrome 03"
              />
            </label>
            <label className="field-label">
              Loại thiết bị
              <Input
                name="device_type"
                required
                maxLength={80}
                defaultValue={editing?.device_type}
                placeholder="Chrome, Edge, Firefox..."
              />
            </label>
            {/* <label className="field-label">
							Trạng thái
							<select
								className="select-control"
								name="status"
								defaultValue={editing?.status}
							>
								<option value="ACTIVE">Đang bật</option>
								<option value="INACTIVE">Đã tắt</option>
							</select>
						</label> */}
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
              <Button type="submit">Lưu thiết bị</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={stopping !== null}
        onOpenChange={(open) => {
          if (!open) setStopping(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tắt thiết bị?</DialogTitle>
            <DialogDescription>
              Trạng thái sẽ được chuyển từ ACTIVE sang INACTIVE trong giao diện.
            </DialogDescription>

            <div>
              <p className="text-sm">
                Thiết bị: <strong>{stopping?.device_name}</strong>
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
                      await deviceService.updateStatusDevice(
                        stopping.id,
                        "INACTIVE",
                      );
                      setStopping(null);
                      refreshStats();
                      setDevices((prev) => {
                        return prev.map((d) => {
                          if (d.device.id === stopping.id) {
                            return {
                              ...d,
                              device: {
                                ...d.device,
                                status: "INACTIVE",
                              },
                            };
                          }
                          return d;
                        });
                      });
                    } catch (err) {
                      handleExceptionGlobal(err, "Không thể tắt thiết bị");
                    }
                  }}
                >
                  <Power size={14} />
                  Tắt thiết bị
                </Button>
              </div>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <DialogUserDevice
        open={userDevice !== null}
        onOpenChange={(open) => {
          if (!open) setUserDevice(null);
        }}
        device={userDevice}
      />
    </>
  );
}
