import { API_PATHS } from "../constants/apiPaths";
import type { Product } from "../types";
import { request, unwrap } from "../utils/request";

export const productApi = {
  list: (params?: { keyword?: string; categoryId?: string }) => unwrap<Product[]>(request.get(API_PATHS.products, { params })),
  detail: (id: string) => unwrap<Product>(request.get(`${API_PATHS.products}/${id}`)),
  create: (payload: Partial<Product>) => unwrap<Product>(request.post(API_PATHS.products, payload)),
  update: (id: string, payload: Partial<Product>) => unwrap<Product>(request.put(`${API_PATHS.products}/${id}`, payload))
};
