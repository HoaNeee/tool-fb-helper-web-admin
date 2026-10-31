import type { BaseQueryParams, IPagination } from "@/types/types";
import { del, get, patch, post } from "@/utils/api-request";
import { logError } from "@/utils/exception";

export type UserStatus = "PENDING" | "ACTIVE" | "INACTIVE" | "LOCKED";
export type UserRole =
  | "ROLE_SUPER_ADMIN"
  | "ROLE_ADMIN"
  | "ROLE_MEMBER"
  | "ROLE_USER";

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  name: string;
  avatar: string;
  status: UserStatus;
  role: UserRole;
  is_premium?: boolean;
  created_at: string;
}

export type UpdateUserPayload = Partial<
  Pick<User, "username" | "email" | "name" | "avatar" | "role" | "status">
>;

export type ChangePasswordPayload = {
  old_password: string;
  new_password: string;
};

export type UserQueryParams = BaseQueryParams;

export interface PaginatedUsersResponse {
  items: User[];
  pagination: IPagination;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const userService = {
  /**
   * Lấy danh sách người dùng kèm phân trang và tìm kiếm từ API (có fallback giả lập)
   */
  getUsers: async (
    params?: UserQueryParams,
  ): Promise<PaginatedUsersResponse> => {
    const page = Math.max(0, params?.page ?? 0);
    const limit = Math.max(1, params?.limit ?? 10);
    const search = (params?.search ?? "").trim().toLowerCase();
    const status = params?.status ?? "all";
    const role = params?.role ?? "all";

    const query = new URLSearchParams();
    query.set("page", String(page));
    query.set("size", String(limit));
    query.set("limit", String(limit));
    if (search) {
      query.set("search", search);
      query.set("keyword", search);
    }
    if (status && status !== "all") query.set("status", status);
    if (role && role !== "all") query.set("role", role);

    try {
      const res = await get(`/users?${query.toString()}`);
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
      logError("Error at getUsers: ", error);
      throw error;
    }
  },

  getAllUsers: async (): Promise<Array<User>> => {
    try {
      const res = await get("/users");
      return (res.data || []) as User[];
    } catch (error) {
      logError("Error at getAllUsers: ", error);
      throw error;
    }
  },

  getStatistics: async () => {
    try {
      const res = await get("/users/admin/statistics");
      return res.data as {
        count_user_active: number;
        count_user_inactive: number;
        count_user_locked: number;
        count_user_pending: number;
      };
    } catch (error) {
      logError("Error at getStatistics: ", error);
      throw error;
    }
  },

  createUser: async (payload: Partial<User>): Promise<User> => {
    try {
      const res = await post("/users/admin/create-user", payload);
      const user = res.data as User;
      return user;
    } catch (error) {
      logError("Error at createUser: ", error);
      throw error;
    }
  },

  updateUser: async (id: string, payload: Partial<User>): Promise<User> => {
    try {
      const res = await patch(`/users/admin/update-user/${id}`, payload);
      const user = res.data as User;
      return user;
    } catch (error) {
      logError("Error at updateUser: ", error);
      throw error;
    }
  },

  updateStatusUser: async (id: string, status: UserStatus): Promise<void> => {
    try {
      await patch(`/users/admin/change-status`, { user_id: id, status });
    } catch (error) {
      logError("Error at updateStatusUser: ", error);
      throw error;
    }
  },

  updateRoleUser: async (id: string, role: UserRole): Promise<void> => {
    try {
      await patch(`/users/admin/change-role`, { user_id: id, role });
    } catch (error) {
      logError("Error at updateRoleUser: ", error);
      throw error;
    }
  },

  deleteUser: async (id: string): Promise<void> => {
    try {
      await del(`/users/admin/delete-user/${id}`);
    } catch (error) {
      logError("Error at deleteUser: ", error);
      throw error;
    }
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<void> => {
    await patch("/users/change-password", payload);
  },

  updateMe: async (payload: UpdateUserPayload): Promise<Partial<User>> => {
    const res = await patch("/users/me", payload);
    return (res.data ?? {}) as Partial<User>;
  },

  getMe: async (): Promise<User> => {
    try {
      const res = await get("/users/me");
      return res.data as User;
    } catch (error) {
      throw error;
    }
  },
};

export default userService;
