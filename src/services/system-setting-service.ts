import type {
	SystemCommentWalkSetting,
	SystemPostSetting,
	SystemSetting,
	SystemToolSetting,
} from "@/types/types";
import { get, patch } from "@/utils/api-request";
import { logError } from "@/utils/exception";

export const systemSettingService = {
	async getSystemSetting() {
		try {
			const res = await get("/system-setting");
			return res.data as SystemSetting;
		} catch (error) {
			logError("Error at getSystemSetting: ", error);
			throw error;
		}
	},

	async getSystemToolSetting() {
		try {
			const res = await get("/system-setting/tool");
			return res.data as SystemToolSetting;
		} catch (error) {
			logError("Error at getSystemToolSetting: ", error);
			throw error;
		}
	},

	async getSystemPostSetting() {
		try {
			const res = await get("/system-setting/post");
			return res.data as SystemPostSetting;
		} catch (error) {
			logError("Error at getSystemPostSetting: ", error);
			throw error;
		}
	},

	async getSystemCommentWalkSetting() {
		try {
			const res = await get("/system-setting/comment-walk");
			return res.data as SystemCommentWalkSetting;
		} catch (error) {
			logError("Error at getSystemCommentWalkSetting: ", error);
			throw error;
		}
	},

	async updateSystemSetting(data: SystemSetting) {
		try {
			const res = await patch("/system-setting", data);
			return res.data as SystemSetting;
		} catch (error) {
			logError("Error at updateSystemSetting: ", error);
			throw error;
		}
	},

	async updateSystemToolSetting(data: SystemToolSetting) {
		try {
			const res = await patch("/system-setting/tool", data);
			return res.data as SystemToolSetting;
		} catch (error) {
			logError("Error at updateSystemToolSetting: ", error);
			throw error;
		}
	},

	async updateSystemPostSetting(data: SystemPostSetting) {
		try {
			const res = await patch("/system-setting/post", data);
			return res.data as SystemPostSetting;
		} catch (error) {
			logError("Error at updateSystemPostSetting: ", error);
			throw error;
		}
	},

	async updateSystemCommentWalkSetting(data: SystemCommentWalkSetting) {
		try {
			const res = await patch("/system-setting/comment-walk", data);
			return res.data as SystemCommentWalkSetting;
		} catch (error) {
			logError("Error at updateSystemCommentWalkSetting: ", error);
			throw error;
		}
	},
};
