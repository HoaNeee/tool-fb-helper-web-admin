import { post } from "@/utils/api-request";
import type { UserRole, UserStatus } from "./user-service";

type LoginResponse = {
  token: string;
  user_id: string;
  username: string;
  status: UserStatus;
  role: UserRole;
};

const authService = {
  login: async ({
    username,
    password,
  }: {
    username: string;
    password: string;
  }): Promise<LoginResponse> => {
    try {
      const res = await post("/auth/login", {
        username,
        password,
      });
      return res.data as LoginResponse;
    } catch (error) {
      throw error;
    }
  },
};

export default authService;
