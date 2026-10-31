import type { BaseQueryParams, IPagination, IpAddress } from "@/types/types";
import { get, patch } from "@/utils/api-request";
import { logError } from "@/utils/exception";

export type IpAddressQueryParams = BaseQueryParams;

export interface PaginatedIpAddressesResponse {
  items: IpAddress[];
  pagination: IPagination;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const ipAddressService = {
  /**
   * Lấy danh sách địa chỉ IP có phân trang và tìm kiếm (hỗ trợ REST API & mock fallback)
   */
  async getIpAddresses(
    params?: IpAddressQueryParams,
  ): Promise<PaginatedIpAddressesResponse> {
    const page = Math.max(0, params?.page ?? 0);
    const limit = Math.max(1, params?.limit ?? 10);
    const search = (params?.search ?? "").trim().toLowerCase();
    const status = params?.status ?? "all";

    const query = new URLSearchParams();
    query.set("page", String(page));
    query.set("size", String(limit));
    query.set("limit", String(limit));
    if (search) {
      query.set("search", search);
      query.set("keyword", search);
    }
    if (status && status !== "all") query.set("status", status);

    try {
      const res = await get(`/ip-addresses?${query.toString()}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = res?.data as any;

      if (res?.pagination) {
        return {
          items: (Array.isArray(d) ? d : d?.items) || [],
          pagination: res.pagination,
          total: res.pagination.totalElements,
          page: res.pagination.pageNo ?? page,
          limit: res.pagination.pageSize ?? limit,
          totalPages: res.pagination.totalPages,
        };
      }

      if (d && Array.isArray(d.items)) {
        const total = d.total ?? d.items.length;
        const totalPages =
          d.totalPages ?? Math.max(1, Math.ceil(total / limit));
        return {
          items: d.items,
          pagination: {
            pageNo: d.page ?? page,
            pageSize: d.limit ?? limit,
            totalElements: total,
            totalPages,
            last: (d.page ?? page) >= totalPages - 1,
          },
          total,
          page: d.page ?? page,
          limit: d.limit ?? limit,
          totalPages,
        };
      }

      throw new Error("Invalid response format");
    } catch (error) {
      logError("Error at getIpAddresses", error);
      throw error;
    }
  },

  async getAllIpAddress(): Promise<Array<IpAddress>> {
    try {
      const res = await get("/ip-addresses");
      return (res.data || []) as IpAddress[];
    } catch (error) {
      logError("Error at getAllIpAddress", error);
      throw error;
    }
  },

  async getStatisticIpAddress() {
    try {
      const res = await get("/ip-addresses/statistics");
      const d = res.data as {
        count_ip_active: number;
        count_ip_inactive: number;
      };
      return {
        active: d.count_ip_active,
        inactive: d.count_ip_inactive,
        total: d.count_ip_active + d.count_ip_inactive,
      };
    } catch (error) {
      logError("Error at getStatisticIpAddress", error);
      throw error;
    }
  },

  async updateStatusIpAddress(id: string, status: string): Promise<boolean> {
    try {
      const res = await patch(`/ip-addresses/update-status`, {
        ip_address: id,
        status,
      });
      return Boolean(res?.data);
    } catch (error) {
      logError("Error at updateIpAddress", error);
      throw error;
    }
  },
};

export default ipAddressService;
