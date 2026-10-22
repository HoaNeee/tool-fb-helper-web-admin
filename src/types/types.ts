type BaseStatus = "ACTIVE" | "INACTIVE";

interface Device {
  id: string;
  device_name: string;
  device_type: string;
  status: BaseStatus;
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

export type {
  BaseStatus,
  Device,
  IpAddress,
  SystemSetting,
  SystemToolSetting,
  SystemPostSetting,
  SystemCommentWalkSetting,
};
