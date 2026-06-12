export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  sort: number;
  icon?: string;
  productCount?: number;
  children?: Category[];
}

export interface PermissionState {
  role: string;
  canWrite: boolean;
  canManageWarehouse: boolean;
}

export * from "./enums";
export * from "./warehouse";
export * from "./product";
export * from "./stock";
export * from "./order";
