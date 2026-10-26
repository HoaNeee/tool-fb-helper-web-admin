import type {
	AdminDeviceResponse,
	Device,
	IDeviceSetting,
	IPagination,
} from "@/types/types";
import { get, patch } from "@/utils/api-request";
import { logError } from "@/utils/exception";

export interface DeviceQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	status?: string;
	sortBy?: string;
	direction?: string;
}

export const deviceService = {
	/**
	 * Lấy danh sách thiết bị có phân trang và tìm kiếm (hỗ trợ REST API & mock fallback)
	 */
	async getDevices(
		params?: DeviceQueryParams,
	): Promise<{ devices: Array<AdminDeviceResponse>; pagination: IPagination }> {
		const page = Math.max(0, params?.page ?? 0);
		const limit = Math.max(1, params?.limit ?? 10);
		const search = (params?.search ?? "").trim().toLowerCase();
		const status = params?.status ?? "all";

		const query = new URLSearchParams();
		query.set("page", String(page));
		query.set("size", String(limit));
		if (search) query.set("keyword", search);
		if (status && status !== "all") query.set("status", status);

		try {
			const res = await get(`/devices/admin/list-device?${query.toString()}`);
			const d = res?.data as AdminDeviceResponse[];
			const pagination = res?.pagination;

			if (d && Array.isArray(d)) {
				if (pagination) {
					return {
						devices: d,
						pagination: pagination,
					};
				}
				throw new Error("Invalid response format");
			}
			throw new Error("Invalid response format");
		} catch (error) {
			console.warn("Error at getDevices: ", error);
			throw error;
		}
	},

	async getAllDevices(): Promise<AdminDeviceResponse[]> {
		try {
			const res = await get("/devices/admin/list-device");
			return (res.data || []) as AdminDeviceResponse[];
		} catch (error) {
			console.warn("Error at getAllDevices: ", error);
			throw error;
		}
	},

	async getStatistics() {
		try {
			const res = await get("/devices/admin/statistics");
			return res.data as {
				count_device_active: number;
				count_device_inactive: number;
			};
		} catch (error) {
			console.warn("Error at getAllDevices: ", error);
			throw error;
		}
	},

	async getListDeviceSetting(deviceId: string, params?: DeviceQueryParams) {
		try {
			const query = new URLSearchParams();
			query.set("page", String(params?.page || 0));
			query.set("size", String(params?.limit || 5));
			if (params?.search) query.set("keyword", params.search);
			if (params?.status && params.status !== "all")
				query.set("status", params.status);
			if (params?.sortBy) query.set("sortBy", params.sortBy);
			if (params?.direction) query.set("direction", params.direction);
			const res = await get(
				`/devices/admin/list-device-setting/${deviceId}?${query.toString()}`,
			);
			return {
				list_device_setting: res.data as IDeviceSetting[],
				pagination: res.pagination,
			};
		} catch (error) {
			logError("Error at getListDeviceSetting: ", error);
			throw error;
		}
	},

	async updateDevice(
		id: string,
		payload: Partial<Device>,
	): Promise<AdminDeviceResponse> {
		try {
			const res = await patch(`/devices/${id}`, payload);
			const updated = res.data as AdminDeviceResponse;
			return updated;
		} catch (error) {
			console.warn("Error at updateDevice: ", error);
			throw error;
		}
	},

	async updateStatusDevice(deviceId: string, status: string) {
		try {
			const res = await patch(`/devices/update-status/${deviceId}`, { status });
			return !!res.data;
		} catch (error) {
			logError("Error at updateStatusDevice: ", error);
			throw error;
		}
	},

	async updateStatusDeviceSetting(
		deviceId: string,
		userId: string,
		status: string,
	) {
		try {
			const res = await patch(`/devices/admin/change-status-device-setting`, {
				status,
				device_id: deviceId,
				user_id: userId,
			});
			return !!res.data;
		} catch (error) {
			logError("Error at updateStatusDeviceSetting: ", error);
			throw error;
		}
	},
};

export default deviceService;
