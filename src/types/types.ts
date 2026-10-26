import type { User } from "@/services/user-service";

type BaseStatus = "ACTIVE" | "INACTIVE";

interface Device {
	id: string;
	device_name: string;
	device_type: string;
	status: BaseStatus;
}

interface AdminDeviceResponse {
	device: Device;
	count_device_active: number;
	count_device_inactive: number;
}

interface IpAddress {
	id: string;
	address: string;
	status: BaseStatus;
}

interface SystemSetting {
	id: string;
	app_name: string;
	mail_support: string;
	status: BaseStatus | "MAINTAINING";
}

interface SystemToolSetting {
	id: string;
	day_free_premium_for_new_user: number;
	break_per_batch_percent: number;
}

interface SystemPostSetting {
	id: string;

	is_replace_image: boolean;
	is_replace_phone: boolean;

	replace_image_percent: number;
	replace_phone_percent: number;

	replace_phone_value: string;
	replace_image_value: string;

	url_get_list_groups: string[];
	pattern_url_post_in_groups: string[];
}

interface SystemCommentWalkSetting {
	id: string;
	url_comment_walk_homes: string[];
	url_comment_walk_searches: string[];
	pattern_url_post_comment_walks: string[];
}

export type ActivityItem = { id: string; text: string; time: string };

export interface IPagination {
	pageNo?: number;
	pageSize: number;
	totalElements: number;
	totalPages: number;
	last: boolean;
}

export interface IDeviceSetting {
	id: number;
	is_comment_when_post: boolean;
	is_execute_priority_task: boolean;
	is_fix_steal_all_focus: boolean;
	is_fix_steal_focus: boolean;
	is_interact_batch: boolean;
	is_random_break_batch: boolean;
	is_random_time_task: boolean;
	is_remote_control: boolean;
	is_scheduler: boolean;
	is_special_frame_hours: boolean;
	is_stop_task: boolean;
	priority_task: PriorityTask;
	status: string;
	strictly_title_match_groups: string[];
	time_break_when_spammed: number;
	user: User;
}

export interface PriorityTask {
	priority_task_post: number;
	priority_task_comment_walk: number;
}

export interface BaseQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	status?: string;
	role?: string;
	sortBy?: string;
	direction?: string;
}

export type {
	BaseStatus,
	Device,
	AdminDeviceResponse,
	IpAddress,
	SystemSetting,
	SystemToolSetting,
	SystemPostSetting,
	SystemCommentWalkSetting,
};
