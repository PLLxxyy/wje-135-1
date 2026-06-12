import { API_PATHS } from "../constants/apiPaths";
import type { Category } from "../types";
import { request, unwrap } from "../utils/request";

export const categoryApi = {
  list: () => unwrap<Category[]>(request.get(API_PATHS.categories)),
  create: (payload: Partial<Category>) => unwrap<Category>(request.post(API_PATHS.categories, payload))
};
