import { toast } from "@/components/ui/toast";
import showToast from "@/helpers/toast-helper";

export type ApiResponseCode =
  | "CLIENT"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "INTERNAL_ERROR"
  | "UNKNOWN"
  | "BAD_CREDENTIAL"
  | "TOKEN_EXPIRED";

export class CustomError extends Error {
  code: ApiResponseCode;
  name: string;
  constructor(
    code: ApiResponseCode = "CLIENT",
    message: string,
    name?: string,
  ) {
    super(message);
    this.code = code || "CLIENT"; // CLIENT is FE not from API
    this.name = name || "CustomError";
  }
}

export class ValidateException extends CustomError {
  constructor(message: string) {
    super("CLIENT", message, "ValidateException");
  }
}

export function handleExceptionGlobal(
  error: CustomError,
  msg: string,
  toast = true,
) {
  if (toast) {
    showToast({
      description: msg || error.message,
      type: "error",
    });
  }

  console.error(error);
}

export function logError(...agrs: unknown[]) {
  console.log(...agrs);
}
