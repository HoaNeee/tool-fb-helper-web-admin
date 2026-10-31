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
import { toast } from "@/components/ui/toast";
import showToast from "@/helpers/toast-helper";
import { ipAddressService } from "@/services/ip-address-service";
import type {
  BaseQueryParams,
  BaseStatus,
  IPagination,
  IpAddress,
} from "@/types/types";
import { handleExceptionGlobal, logError } from "@/utils/exception";
import { debounce } from "lodash";
import { Globe, Power } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function IpAddressesPage() {
  const [ips, setIps] = useState<IpAddress[]>([]);
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
  const [loadingPage, setLoadingPage] = useState(false);
  const [_actionLoading, setActionLoading] = useState(false);
  const [isFirstCalledApi, setIsFirstCalledApi] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  const [stopping, setStopping] = useState<IpAddress | null>(null);

  const refreshStats = async () => {
    try {
      const data = await ipAddressService.getStatisticIpAddress();
      setStats({
        total: data.total,
        active: data.active,
        inactive: data.inactive,
      });
    } catch {
      // Ignore stats error
    }
  };

  const fetchIps = useCallback(async (query?: BaseQueryParams) => {
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
      const res = await ipAddressService.getIpAddresses(queryFinal);
      setIps(res.items);
      setPagination(res.pagination as IPagination);
      setIsFirstCalledApi(true);
    } catch (err) {
      handleExceptionGlobal(err, "Lỗi khi tải địa chỉ IP");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fn = async () => {
      setLoadingPage(true);
      await fetchIps({
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
      fetchIps({
        page,
        limit,
        search,
        status,
      });
    }, 500),
    [],
  );

  async function handleUpdateStatusIp(
    id: string,
    status: string,
    cb?: () => void,
  ) {
    try {
      setActionLoading(true);
      await ipAddressService.updateStatusIpAddress(id, status);
      showToast({
        description: "Đã cập nhật trạng thái địa chỉ IP thành công.",
        type: "success",
      });
      setIps((prev) =>
        prev.map((ip) =>
          ip.id === id ? { ...ip, status: status as BaseStatus } : ip,
        ),
      );
      cb?.();
    } catch (err) {
      handleExceptionGlobal(err, "Cập nhật địa chỉ IP thất bại", true);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <>
      {loadingPage && <Loading type="cover" blur />}
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
                        variant={
                          ip.status === "ACTIVE" ? "destructive" : "default"
                        }
                        className="min-w-20"
                        onClick={async () => {
                          if (ip.status === "ACTIVE") {
                            setStopping(ip);
                          } else {
                            await handleUpdateStatusIp(ip.id, "ACTIVE");
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
              setStatus("");
              setPage(0);
              fetchIps({
                page: 0,
                limit,
                search: "",
                status: "",
              });
            }}
            searching={Boolean(search || status)}
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
            fetchIps({
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
            fetchIps({
              page: page,
              limit: newLimit,
              search: search,
              status: status,
            });
          }}
          itemName="địa chỉ IP"
        />
      </section>

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
                    if (!stopping?.id) return;
                    await handleUpdateStatusIp(stopping.id, "INACTIVE", () => {
                      refreshStats();
                      setStopping(null);
                    });
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
