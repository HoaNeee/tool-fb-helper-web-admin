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
import { ipAddressService } from "@/services/ip-address-service";
import type { IpAddress } from "@/types/types";
import { Globe, Pencil, Power } from "lucide-react";
import { useEffect, useState } from "react";

export default function IpAddressesPage({
  onChange,
  notify,
}: {
  onChange: (_items: IpAddress[], _message: string) => void;
  notify: (_message: string) => void;
}) {
  const [ips, setIps] = useState<IpAddress[]>([]);
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

  const [editing, setEditing] = useState<IpAddress | null>(null);
  const [stopping, setStopping] = useState<IpAddress | null>(null);
  const [error, setError] = useState("");

  const refreshStats = async () => {
    try {
      const all = await ipAddressService.getAllIpAddress();
      setStats({
        total: all.length,
        active: all.filter((i) => i.status === "ACTIVE").length,
        inactive: all.filter((i) => i.status === "INACTIVE").length,
      });
    } catch {
      // Ignore stats error
    }
  };

  const fetchIps = async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await ipAddressService.getIpAddresses({
        page: targetPage,
        limit,
        search,
        status,
      });
      setIps(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch (err) {
      console.error("Lỗi khi tải địa chỉ IP:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchIps(page);
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
    const address = String(values.get("address")).trim();

    if (!address) {
      setError("Địa chỉ IP không được để trống.");
      return;
    }

    let normalized: string;
    try {
      const host = address.includes(":")
        ? `[${address.replace(/^\[|\]$/g, "")}]`
        : address;
      if (
        !address.includes(":") &&
        (!/^(\d{1,3}\.){3}\d{1,3}$/.test(address) ||
          address.split(".").some((n) => Number(n) > 255))
      ) {
        throw new Error();
      }
      normalized = new URL(`http://${host}`).hostname.replace(/^\[|\]$/g, "");
    } catch {
      setError("Nhập địa chỉ IPv4 hoặc IPv6 hợp lệ.");
      return;
    }

    try {
      const all = await ipAddressService.getAllIpAddress();
      if (all.some((ip) => ip.address === normalized && ip.id !== editing.id)) {
        setError("Địa chỉ IP này đã tồn tại.");
        return;
      }

      const updated = await ipAddressService.updateIpAddress(editing.id, {
        address: normalized,
        status: values.get("status") === "ACTIVE" ? "ACTIVE" : "INACTIVE",
      });

      onChange(
        ips.map((ip) => (ip.id === updated.id ? updated : ip)),
        `Cập nhật địa chỉ IP ${normalized}`,
      );
      setEditing(null);
      notify("Đã lưu địa chỉ IP trong phiên hiện tại.");
      refreshStats();
      fetchIps(page);
    } catch (err) {
      console.error(err);
      setError("Lỗi khi lưu địa chỉ IP, vui lòng thử lại.");
    }
  }

  return (
    <>
      <PageHeading
        title="Quản lý địa chỉ IP"
        description="Danh sách địa chỉ IP, thông tin và trạng thái kích hoạt."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { title: "Tổng địa chỉ IP", count: stats.total },
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
          <h2 className="font-semibold">Danh sách địa chỉ IP</h2>
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
          placeholder="Tìm ID hoặc địa chỉ IP..."
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
                <th>Địa chỉ IP</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {ips.map((ip) => (
                <tr key={ip.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-lg border bg-muted/50 text-muted-foreground">
                        <Globe size={18} />
                      </span>
                      <div>
                        <span className="font-mono font-medium text-foreground">
                          {ip.address}
                        </span>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          {ip.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={ip.status} />
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Sửa ${ip.address}`}
                        onClick={() => {
                          setError("");
                          setEditing(ip);
                        }}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant={
                          ip.status === "ACTIVE" ? "outline" : "secondary"
                        }
                        className="min-w-20"
                        onClick={async () => {
                          if (ip.status === "ACTIVE") {
                            setStopping(ip);
                          } else {
                            try {
                              const updated =
                                await ipAddressService.updateIpAddress(ip.id, {
                                  status: "ACTIVE",
                                });
                              onChange(
                                ips.map((item) =>
                                  item.id === ip.id ? updated : item,
                                ),
                                `Bật địa chỉ IP ${ip.address}`,
                              );
                              notify("Đã bật địa chỉ IP trong giao diện.");
                              refreshStats();
                              fetchIps(page);
                            } catch (err) {
                              console.error(err);
                            }
                          }
                        }}
                      >
                        <Power size={14} />
                        {ip.status === "ACTIVE" ? "Tắt" : "Bật"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && ips.length === 0 && (
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
          itemName="địa chỉ IP"
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
            <DialogTitle>Chỉnh sửa địa chỉ IP</DialogTitle>
            <DialogDescription>
              Thông tin theo schema IpAddress.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} key={editing?.id}>
            <label className="field-label">
              ID
              <Input value={editing?.id} readOnly />
            </label>

            <label className="field-label">
              Địa chỉ IP
              <Input
                name="address"
                required
                defaultValue={editing?.address}
                placeholder="192.168.1.10 hoặc 2001:db8::1"
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
              <Button type="submit">Lưu địa chỉ IP</Button>
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
            <DialogTitle>Tắt địa chỉ IP?</DialogTitle>
            <DialogDescription>
              Trạng thái sẽ được chuyển từ ACTIVE sang INACTIVE trong giao diện.
            </DialogDescription>

            <div>
              <p className="text-sm">
                Địa chỉ IP: <strong>{stopping?.address}</strong>
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
                      const updated = await ipAddressService.updateIpAddress(
                        stopping.id,
                        { status: "INACTIVE" },
                      );
                      onChange(
                        ips.map((d) => (d.id === stopping.id ? updated : d)),
                        `Tắt địa chỉ IP ${stopping.address}`,
                      );
                      setStopping(null);
                      notify("Đã tắt địa chỉ IP trong giao diện.");
                      refreshStats();
                      fetchIps(page);
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  <Power size={14} />
                  Tắt địa chỉ IP
                </Button>
              </div>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
