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
import type { Device } from "@/types/types";
import { Monitor, Pencil, Power } from "lucide-react";
import { useEffect, useState } from "react";

export default function DevicesPage({
  onChange,
  notify,
}: {
  onChange: (_items: Device[], _message: string) => void;
  notify: (_message: string) => void;
}) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  const [editing, setEditing] = useState<Device | null>(null);
  const [stopping, setStopping] = useState<Device | null>(null);
  const [error, setError] = useState("");

  const refreshStats = async () => {
    try {
      const all = await deviceService.getAllDevices();
      setStats({
        total: all.length,
        active: all.filter((d) => d.status === "ACTIVE").length,
        inactive: all.filter((d) => d.status === "INACTIVE").length,
      });
    } catch {
      // Ignore stats error
    }
  };

  const fetchDevices = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await deviceService.getDevices({
        page: targetPage,
        limit,
        search,
        status,
      });
      setDevices(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch (err) {
      console.error("Lỗi khi tải thiết bị:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchDevices(page);
    }, 300);

    return () => clearTimeout(handler);
  }, [search, status, page, limit]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshStats();
  }, []);

  async function save(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;

    const values = new FormData(e.currentTarget);
    const name = String(values.get("device_name")).trim();
    const type = String(values.get("device_type")).trim();
    if (!name || !type) {
      setError("Tên và loại thiết bị không được để trống.");
      return;
    }

    try {
      const updated = await deviceService.updateDevice(editing.id, {
        device_name: name,
        device_type: type,
        status: values.get("status") === "ACTIVE" ? "ACTIVE" : "INACTIVE",
      });

      onChange(
        devices.map((d) => (d.id === updated.id ? updated : d)),
        `Cập nhật thiết bị ${name}`,
      );
      setEditing(null);
      notify("Đã lưu thiết bị trong phiên hiện tại.");
      refreshStats();
      fetchDevices(page);
    } catch (err) {
      console.error(err);
      setError("Lỗi khi lưu thiết bị, vui lòng thử lại.");
    }
  }

  return (
    <>
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
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-lg border bg-muted/50 text-muted-foreground">
                        <Monitor size={18} />
                      </span>
                      <div>
                        <span className="font-medium text-foreground">
                          {d.device_name}
                        </span>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          {d.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>{d.device_type}</td>
                  <td>
                    <StatusBadge status={d.status} />
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Sửa ${d.device_name}`}
                        onClick={() => {
                          setError("");
                          setEditing(d);
                        }}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant={
                          d.status === "ACTIVE" ? "outline" : "secondary"
                        }
                        className="min-w-20"
                        onClick={async () => {
                          if (d.status === "ACTIVE") {
                            setStopping(d);
                          } else {
                            try {
                              const updated = await deviceService.updateDevice(
                                d.id,
                                { status: "ACTIVE" },
                              );
                              onChange(
                                devices.map((item) =>
                                  item.id === d.id ? updated : item,
                                ),
                                `Bật thiết bị ${d.device_name}`,
                              );
                              notify("Đã bật thiết bị trong giao diện.");
                              refreshStats();
                              fetchDevices(page);
                            } catch (err) {
                              console.error(err);
                            }
                          }
                        }}
                      >
                        <Power size={14} />
                        {d.status === "ACTIVE" ? "Tắt" : "Bật"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && devices.length === 0 && (
          <EmptyState
            onReset={() => {
              setSearch("");
              setStatus("all");
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
            <DialogDescription>Thông tin theo schema Device.</DialogDescription>
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
            <label className="field-label">
              Trạng thái
              <select
                className="select-control"
                name="status"
                defaultValue={editing?.status}
              >
                <option value="ACTIVE">Đang bật</option>
                <option value="INACTIVE">Đã tắt</option>
              </select>
            </label>
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
                      const updated = await deviceService.updateDevice(
                        stopping.id,
                        { status: "INACTIVE" },
                      );
                      onChange(
                        devices.map((d) =>
                          d.id === stopping.id ? updated : d,
                        ),
                        `Tắt thiết bị ${stopping.device_name}`,
                      );
                      setStopping(null);
                      notify("Đã tắt thiết bị trong giao diện.");
                      refreshStats();
                      fetchDevices(page);
                    } catch (err) {
                      console.error(err);
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
    </>
  );
}
