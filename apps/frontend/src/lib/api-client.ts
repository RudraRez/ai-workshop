import axios, { AxiosError } from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
  timeout: 20_000,
  headers: { "content-type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const requestId = crypto.randomUUID();
    config.headers.set("x-request-id", requestId);
  }
  return config;
});

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta: { requestId: string; timestamp: string };
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: { requestId: string; timestamp: string };
};

export class ApiException extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiException";
  }
}

export function unwrap<T>(res: { data: ApiSuccess<T> | ApiError }): T {
  if (!res.data.success) {
    throw new ApiException(
      res.data.error.code,
      0,
      res.data.error.message,
      res.data.error.details,
    );
  }
  return res.data.data;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.data?.success === false) {
      const { code, message, details } = error.response.data.error;
      return Promise.reject(
        new ApiException(code, error.response.status, message, details),
      );
    }
    return Promise.reject(error);
  },
);
