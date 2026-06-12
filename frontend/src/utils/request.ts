import axios from "axios";
import { ElMessage } from "element-plus";
import type { ApiResponse } from "../types";

export const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  timeout: 10000
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem("warehouse-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || "请求失败";
    ElMessage.error(message);
    return Promise.reject(error);
  }
);

export async function unwrap<T>(promise: Promise<unknown>) {
  const response = (await promise) as ApiResponse<T>;
  return response.data;
}
