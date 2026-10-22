import { initialUsers } from "@/data/admin-data";
import { del, get, patch, post } from "@/utils/api-request";

export type UserStatus = "PENDING" | "ACTIVE" | "INACTIVE" | "LOCKED";
export type UserRole = "SUPER_ADMIN" | "ADMIN" | "MEMBER" | "USER";

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  name: string;
  avatar: string;
  status: UserStatus;
  role: UserRole;
  created_at: string;
}

export type UpdateUserPayload = Partial<
  Pick<User, "username" | "email" | "name" | "avatar" | "role" | "status">
>;

export type ChangePasswordPayload = {
  old_password: string;
  new_password: string;
};

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
}

export interface PaginatedUsersResponse {
  items: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Lưu trữ dữ liệu giả lập trong bộ nhớ để phục vụ phân trang & tìm kiếm khi chưa có backend
let simulatedUsersStore: User[] = [...initialUsers];

function filterAndPaginateUsers(
  list: User[],
  page: number,
  limit: number,
  search: string,
  status: string,
  role: string,
): PaginatedUsersResponse {
  let filtered = [...list];

  if (search) {
    filtered = filtered.filter(
      (u) =>
        u.username.toLowerCase().includes(search) ||
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.id.toLowerCase().includes(search),
    );
  }

  if (status && status !== "all") {
    filtered = filtered.filter((u) => u.status === status);
  }

  if (role && role !== "all") {
    filtered = filtered.filter((u) => u.role === role);
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

export const userService = {
  /**
   * Lấy danh sách người dùng kèm phân trang và tìm kiếm từ API (có fallback giả lập)
   */
  getUsers: async (params?: UserQueryParams): Promise<PaginatedUsersResponse> => {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.max(1, params?.limit ?? 10);
    const search = (params?.search ?? "").trim().toLowerCase();
    const status = params?.status ?? "all";
    const role = params?.role ?? "all";

    const query = new URLSearchParams();
    query.set("page", String(page));
    query.set("limit", String(limit));
    if (search) query.set("search", search);
    if (status && status !== "all") query.set("status", status);
    if (role && role !== "all") query.set("role", role);

    try {
      const res = await get(`/users?${query.toString()}`);
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
        return filterAndPaginateUsers(d, page, limit, search, status, role);
      }
      throw new Error("Invalid response format");
    } catch (error) {
      console.warn(
        "API /users chưa phản hồi, sử dụng dữ liệu giả lập có phân trang & tìm kiếm:",
        error,
      );
      return filterAndPaginateUsers(
        simulatedUsersStore,
        page,
        limit,
        search,
        status,
        role,
      );
    }
  },

  getAllUsers: async (): Promise<Array<User>> => {
    try {
      const res = await get("/users");
      return (res.data || []) as User[];
    } catch (error) {
      console.warn("API getAllUsers chưa kết nối, trả về mock:", error);
      return simulatedUsersStore;
    }
  },

  createUser: async (payload: Partial<User>): Promise<User> => {
    try {
      const res = await post("/users", payload);
      const user = res.data as User;
      simulatedUsersStore = [user, ...simulatedUsersStore];
      return user;
    } catch (error) {
      console.warn("API createUser chưa kết nối, lưu vào store giả lập:", error);
      const newUser: User = {
        id: payload.id || `USR-${crypto.randomUUID().slice(0, 8)}`,
        username: payload.username || "",
        email: payload.email || "",
        password: payload.password || "••••••••",
        name: payload.name || "",
        avatar: payload.avatar || "",
        status: payload.status || "ACTIVE",
        role: payload.role || "MEMBER",
        created_at: payload.created_at || new Date().toISOString(),
      };
      simulatedUsersStore = [newUser, ...simulatedUsersStore];
      return newUser;
    }
  },

  updateUser: async (id: string, payload: Partial<User>): Promise<User> => {
    try {
      const res = await patch(`/users/${id}`, payload);
      const user = res.data as User;
      simulatedUsersStore = simulatedUsersStore.map((u) =>
        u.id === id ? { ...u, ...user } : u,
      );
      return user;
    } catch (error) {
      console.warn("API updateUser chưa kết nối, cập nhật store giả lập:", error);
      simulatedUsersStore = simulatedUsersStore.map((u) =>
        u.id === id ? { ...u, ...payload } : u,
      );
      const updated = simulatedUsersStore.find((u) => u.id === id);
      if (!updated) throw new Error("User not found");
      return updated;
    }
  },

  deleteUser: async (id: string): Promise<void> => {
    try {
      await del(`/users/${id}`);
      simulatedUsersStore = simulatedUsersStore.filter((u) => u.id !== id);
    } catch (error) {
      console.warn("API deleteUser chưa kết nối, xóa khỏi store giả lập:", error);
      simulatedUsersStore = simulatedUsersStore.filter((u) => u.id !== id);
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

  async checkPremium(): Promise<boolean> {
    try {
      const res = await get("/users/is-premium");
      return !!res.data;
    } catch (error) {
      throw error;
    }
  },
};

export default userService;
