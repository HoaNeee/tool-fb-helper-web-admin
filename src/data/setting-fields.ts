import type { SettingsBundle } from "./admin-data";

export type SettingGroup = keyof SettingsBundle;
export type Field = {
  key: string;
  label: string;
  kind: "text" | "email" | "number" | "boolean" | "lines" | "status";
  description?: string;
  min?: number;
  max?: number;
  required?: boolean;
  urls?: boolean;
  regex?: boolean;
};

type GroupDefinition<T> = {
  title: string;
  type: string;
  description: string;
  fields: (Field & { key: Extract<keyof T, string> })[];
};

export const settingGroups = {
  system: {
    title: "Cài đặt hệ thống",
    type: "SystemSetting",
    description: "Thông tin ứng dụng, email hỗ trợ và trạng thái hệ thống.",
    fields: [
      {
        key: "app_name",
        label: "Tên ứng dụng",
        kind: "text",
        required: true,
        description: "Tên ứng dụng hiển thị trên các tab của trình duyệt.",
      },
      {
        key: "mail_support",
        label: "Email hỗ trợ",
        kind: "email",
        required: true,
        description: "Email dùng cho việc hỗ trợ người dùng.",
      },
      {
        key: "status",
        label: "Trạng thái hệ thống",
        kind: "status",
        description:
          "ACTIVE: đang bật · INACTIVE: đã tắt · MAINTAINING: bảo trì.",
      },
    ],
  },
  tool: {
    title: "Cài đặt tool",
    type: "SystemToolSetting",
    description:
      "Thời gian dùng premium miễn phí và tỷ lệ nghỉ giữa các batch.",
    fields: [
      {
        key: "day_free_premium_for_new_user",
        label: "Số ngày premium miễn phí cho người dùng mới",
        kind: "number",
        min: 0,
        description: "Đơn vị: ngày. Giá trị phải là số nguyên không âm.",
      },
      {
        key: "break_per_batch_percent",
        label: "Tỷ lệ nghỉ giữa các batch",
        kind: "number",
        min: 0,
        max: 100,
        description: "Đơn vị: %. Giá trị từ 0 đến 100.",
      },
    ],
  },
  post: {
    title: "Cài đặt đăng bài",
    type: "SystemPostSetting",
    description: "Quy tắc thay thế ảnh, số điện thoại và đường dẫn đăng bài.",
    fields: [
      {
        key: "is_replace_image",
        label: "Bật thay thế ảnh",
        kind: "boolean",
        description: "Cho phép thay ảnh trong nội dung đăng bài.",
      },
      {
        key: "replace_image_percent",
        label: "Tỷ lệ thay thế ảnh",
        kind: "number",
        min: 0,
        max: 100,
        description: "Đơn vị: %.",
      },
      {
        key: "replace_image_value",
        label: "Giá trị ảnh thay thế",
        kind: "text",
        description: "Nhập giá trị ảnh theo cấu hình của hệ thống.",
      },
      {
        key: "is_replace_phone",
        label: "Bật thay thế số điện thoại",
        kind: "boolean",
        description: "Cho phép thay số điện thoại trong nội dung đăng bài.",
      },
      {
        key: "replace_phone_percent",
        label: "Tỷ lệ thay thế số điện thoại",
        kind: "number",
        min: 0,
        max: 100,
        description: "Đơn vị: %.",
      },
      {
        key: "replace_phone_value",
        label: "Số điện thoại thay thế",
        kind: "text",
        description: "Lưu dạng chuỗi để giữ số 0 ở đầu.",
      },
      {
        key: "url_get_list_groups",
        label: "URL lấy danh sách nhóm",
        kind: "lines",
        urls: true,
        description:
          "Mỗi dòng một URL HTTP/HTTPS; được lưu dưới dạng string[].",
      },
      {
        key: "pattern_url_post_in_groups",
        label: "Pattern URL bài viết trong nhóm",
        kind: "lines",
        regex: true,
        description:
          "Mỗi dòng một pattern, ví dụ /groups/{group_id}/posts/{post_id}.",
      },
    ],
  },
  comment: {
    title: "Cài đặt bình luận dạo",
    type: "SystemCommentWalkSetting",
    description: "Danh sách URL và pattern dùng cho bình luận dạo.",
    fields: [
      {
        key: "url_comment_walk_homes",
        label: "URL bình luận dạo trang chủ",
        kind: "lines",
        urls: true,
        description: "Mỗi dòng một URL HTTP/HTTPS.",
      },
      {
        key: "url_comment_walk_searches",
        label: "URL bình luận dạo tìm kiếm",
        kind: "lines",
        urls: true,
        description: "Mỗi dòng một URL HTTP/HTTPS.",
      },
      {
        key: "pattern_url_post_comment_walks",
        label: "Pattern URL bài viết bình luận dạo",
        kind: "lines",
        regex: true,
        description: "Mỗi dòng một pattern. Được lưu dưới dạng string[].",
      },
    ],
  },
} satisfies { [K in SettingGroup]: GroupDefinition<SettingsBundle[K]> };
