import { initialDevices } from "@/data/admin-data";
import type { Device } from "@/types/types";
import { get, patch } from "@/utils/api-request";

export interface DeviceQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface PaginatedDevicesResponse {
  items: Device[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

let simulatedDevicesStore: Device[] = [...initialDevices];

function filterAndPaginateDevices(
  list: Device[],
  page: number,
  limit: number,
  search: string,
  status: string,
): PaginatedDevicesResponse {
  let filtered = [...list];

  if (search) {
    filtered = filtered.filter(
      (d) =>
        d.device_name.toLowerCase().includes(search) ||
        d.device_type.toLowerCase().includes(search) ||
        d.id.toLowerCase().includes(search),
    );
  }

  if (status && status !== "all") {
    filtered = filtered.filter((d) => d.status === status);
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * limit;
  const items = filtered.slice(startIndex, startIndex + limit);

  return {
    items,
    total,
    page: safePage,
    limit,
    totalPages,
  };
}

export const deviceService = {
  /**
   * Lấy danh sách thiết bị có phân trang và tìm kiếm (hỗ trợ REST API & mock fallback)
   */
  async getDevices(params?: DeviceQueryParams): Promise<PaginatedDevicesResponse> {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.max(1, params?.limit ?? 10);
    const search = (params?.search ?? "").trim().toLowerCase();
    const status = params?.status ?? "all";

    const query = new URLSearchParams();
    query.set("page", String(page));
    query.set("limit", String(limit));
    if (search) query.set("search", search);
    if (status && status !== "all") query.set("status", status);

    try {
      const res = await get(`/devices?${query.toString()}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = res?.data as any;

      if (d && Array.isArray(d.items)) {
        return {
          items: d.items,
          total: d.total ?? d.items.length,
          page: d.page ?? page,
          limit: d.limit ?? limit,
          totalPages:
            d.totalPages ?? Math.ceil((d.total ?? d.items.length) / limit),
        };
      }
      if (Array.isArray(d)) {
        return filterAndPaginateDevices(d, page, limit, search, status);
      }
      throw new Error("Invalid response format");
    } catch (error) {
      console.warn(
        "API /devices chưa phản hồi, sử dụng dữ liệu giả lập phân trang & tìm kiếm:",
        error,
      );
      return filterAndPaginateDevices(
        simulatedDevicesStore,
        page,
        limit,
        search,
        status,
      );
    }
  },

  async getAllDevices(): Promise<Array<Device>> {
    try {
      const res = await get("/devices");
      return (res.data || []) as Device[];
    } catch (error) {
      console.warn("API getAllDevices chưa kết nối, trả về mock:", error);
      return simulatedDevicesStore;
    }
  },

  async updateDevice(
    id: string,
    payload: Partial<Device>,
  ): Promise<Device> {
    try {
      const res = await patch(`/devices/${id}`, payload);
      const updated = res.data as Device;
      simulatedDevicesStore = simulatedDevicesStore.map((d) =>
        d.id === id ? { ...d, ...updated } : d,
      );
      return updated;
    } catch (error) {
      console.warn("API updateDevice chưa kết nối, cập nhật store giả lập:", error);
      simulatedDevicesStore = simulatedDevicesStore.map((d) =>
        d.id === id ? { ...d, ...payload } : d,
      );
      const updated = simulatedDevicesStore.find((d) => d.id === id);
      if (!updated) throw new Error("Device not found");
      return updated;
    }
  },
};

export default deviceService;
