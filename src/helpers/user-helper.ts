import type { UserRole } from "@/services/user-service";

export const userHelper = {
	isSuperAdmin(role: UserRole) {
		return role === "ROLE_SUPER_ADMIN";
	},
	isAdmin(role: UserRole) {
		return role === "ROLE_ADMIN";
	},
	isUser(role: UserRole) {
		return role === "ROLE_USER";
	},
	isMember(role: UserRole) {
		return role === "ROLE_MEMBER";
	},

	getRoleLabel(role: UserRole) {
		switch (role) {
			case "ROLE_SUPER_ADMIN":
				return "Quản trị cấp cao";
			case "ROLE_ADMIN":
				return "Quản trị viên";
			case "ROLE_MEMBER":
				return "Thành viên";
			case "ROLE_USER":
				return "Người dùng";
			default:
				return "Không xác định";
		}
	},
};
