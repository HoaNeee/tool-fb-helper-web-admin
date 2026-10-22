import { KEY_AUTH } from "@/constants/constants";
import { CustomError, type ApiResponseCode } from "./exception";
import { deleteValueFromStorage, getValueFromLocalStorage } from "./storage";

const DOMAIN = "http://localhost:8080";
const BASE_URL = DOMAIN + "/api/v1";

export interface ApiResponse {
  status: number;
  data: object;
  message: string;
  success: boolean;
  errors: object;
  code: ApiResponseCode;
}

async function get(params: string): Promise<ApiResponse> {
  try {
    const header = await getAuthHeader();

    const response = await fetch(BASE_URL + params, {
      method: "GET",
      headers: header,
    });

    const res = await response.json();

    console.log("get response for " + params + ":", res);

    if (!res?.success) {
      throw new CustomError(res?.code, res?.message);
    }

    return res;
  } catch (error) {
    handleError(error);
    throw error;
  }
}

async function post(
  params: string,
  options?: object | null,
): Promise<ApiResponse> {
  try {
    const header = await getAuthHeader();
    header["Content-Type"] = "application/json";

    const response = await fetch(BASE_URL + params, {
      method: "POST",
      headers: header,
      body: JSON.stringify(options),
    });

    const res = await response.json();

    console.log("post response for " + params + ":", res);

    if (!res?.success) {
      throw new CustomError(res?.code, res?.message);
    }
    return res;
  } catch (error) {
    handleError(error);
    throw error;
  }
}

async function patch(
  params: string,
  options?: object | null,
): Promise<ApiResponse> {
  try {
    const header = await getAuthHeader();
    header["Content-Type"] = "application/json";

    const response = await fetch(BASE_URL + params, {
      method: "PATCH",
      headers: header,
      body: JSON.stringify(options),
    });

    const res = await response.json();

    console.log("patch response for " + params + ":", res);

    if (!res?.success) {
      throw new CustomError(res?.code, res?.message);
    }
    return res;
  } catch (error) {
    handleError(error);
    throw error;
  }
}

async function del(params: string): Promise<ApiResponse> {
  try {
    const header = await getAuthHeader();
    header["Content-Type"] = "application/json";

    const response = await fetch(BASE_URL + params, {
      method: "DELETE",
      headers: header,
    });

    const res = await response.json();

    console.log("del response for " + params + ":", res);

    if (!res?.success) {
      throw new CustomError(res?.code, res?.message);
    }
    return res;
  } catch (error) {
    handleError(error);
    throw error;
  }
}

async function postImage({
  params,
  files,
  isMultiple = false,
}: {
  params: string;
  files: File[];
  isMultiple: boolean;
}): Promise<ApiResponse> {
  try {
    const formData = new FormData();

    if (isMultiple) {
      files.forEach((file) => {
        formData.append("files", file);
      });
    } else {
      formData.append("file", files[0]);
    }

    const header = await getAuthHeader();

    const response = await fetch(BASE_URL + params, {
      method: "POST",
      headers: header,
      body: formData,
    });

    const res = await response.json();

    if (!res?.success) {
      throw new CustomError(res?.code, res?.message);
    }
    return res;
  } catch (error) {
    handleError(error);
    throw error;
  }
}

async function getAuthHeader() {
  const token = getValueFromLocalStorage(KEY_AUTH.TOKEN);
  let header = {};
  if (token) {
    header = {
      Authorization: `Bearer ${token}`,
    };
  }

  return header;
}

async function clearAuth() {
  deleteValueFromStorage(KEY_AUTH.TOKEN);
  location.reload();
}

function handleError(error: CustomError) {
  if (error.code) {
    const code = error.code as ApiResponseCode;
    if (code === "TOKEN_EXPIRED") {
      clearAuth();
    }
  }
}

export { get, post, patch, del, postImage };
