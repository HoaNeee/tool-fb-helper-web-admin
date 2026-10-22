import { initialIps } from "@/data/admin-data";
import type { IpAddress } from "@/types/types";
import { get, patch } from "@/utils/api-request";

export interface IpAddressQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface PaginatedIpAddressesResponse {
  items: IpAddress[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

let simulatedIpsStore: IpAddress[] = [...initialIps];

function filterAndPaginateIps(
  list: IpAddress[],
  page: number,
  limit: number,
  search: string,
  status: string,
): PaginatedIpAddressesResponse {
  let filtered = [...list];

  if (search) {
    filtered = filtered.filter(
      (ip) =>
        ip.address.toLowerCase().includes(search) ||
        ip.id.toLowerCase().includes(search),
    );
  }

  if (status && status !== "all") {
    filtered = filtered.filter((ip) => ip.status === status);
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

export const ipAddressService = {
  /**
   * Lấy danh sách địa chỉ IP có phân trang và tìm kiếm (hỗ trợ REST API & mock fallback)
   */
  async getIpAddresses(
    params?: IpAddressQueryParams,
  ): Promise<PaginatedIpAddressesResponse> {
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
      const res = await get(`/ip-addresses?${query.toString()}`);
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
        return filterAndPaginateIps(d, page, limit, search, status);
      }
      throw new Error("Invalid response format");
    } catch (error) {
      console.warn(
        "API /ip-addresses chưa phản hồi, sử dụng dữ liệu giả lập phân trang & tìm kiếm:",
        error,
      );
      return filterAndPaginateIps(
        simulatedIpsStore,
        page,
        limit,
        search,
        status,
      );
    }
  },

  async getAllIpAddress(): Promise<Array<IpAddress>> {
    try {
      const res = await get("/ip-addresses");
      return (res.data || []) as IpAddress[];
    } catch (error) {
      console.warn("API getAllIpAddress chưa kết nối, trả về mock:", error);
      return simulatedIpsStore;
    }
  },

  async updateIpAddress(
    id: string,
    payload: Partial<IpAddress>,
  ): Promise<IpAddress> {
    try {
      const res = await patch(`/ip-addresses/${id}`, payload);
      const updated = res.data as IpAddress;
      simulatedIpsStore = simulatedIpsStore.map((ip) =>
        ip.id === id ? { ...ip, ...updated } : ip,
      );
      return updated;
    } catch (error) {
      console.warn("API updateIpAddress chưa kết nối, cập nhật store giả lập:", error);
      simulatedIpsStore = simulatedIpsStore.map((ip) =>
        ip.id === id ? { ...ip, ...payload } : ip,
      );
      const updated = simulatedIpsStore.find((ip) => ip.id === id);
      if (!updated) throw new Error("IP Address not found");
      return updated;
    }
  },
};

export default ipAddressService;
