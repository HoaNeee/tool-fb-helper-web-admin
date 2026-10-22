import { postImage } from "@/utils/api-request";

export interface FileUploadResult {
  url: string;
  name?: string;
  size?: number;
}

export const fileService = {
  /**
   * Uploads an image file to the backend or falls back to a simulated DataURL.
   * Modify the endpoint or response parsing below as needed.
   */
  async uploadImage(file: File): Promise<string> {
    try {
      // Real API request to backend (e.g. POST /files/upload)
      const res = await postImage({
        params: "/files/upload",
        files: [file],
        isMultiple: false,
      });

      const data = res?.data as
        | { url?: string; file_url?: string; path?: string }
        | string;

      if (typeof data === "string") {
        return data;
      }
      if (data?.url) return data.url;
      if (data?.file_url) return data.file_url;
      if (data?.path) return data.path;

      return URL.createObjectURL(file);
    } catch (error) {
      console.warn(
        "API upload /files/upload chưa kết nối hoặc có lỗi. Sử dụng giả lập DataURL:",
        error,
      );

      // Giả lập API: Chuyển đổi file sang DataURL để hiển thị ảnh ngay lập tức
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    }
  },
};

export default fileService;
