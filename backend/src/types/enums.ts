export enum UserRole {
  Admin = "Admin",
  WarehouseManager = "WarehouseManager",
  Operator = "Operator",
  Viewer = "Viewer"
}

export enum WarehouseStatus {
  Active = "Active",
  Inactive = "Inactive",
  Maintenance = "Maintenance"
}

export enum OrderType {
  Inbound = "Inbound",
  Outbound = "Outbound",
  Transfer = "Transfer",
  InventoryCheck = "InventoryCheck"
}

export enum OrderStatus {
  Draft = "Draft",
  Submitted = "Submitted",
  Processing = "Processing",
  Completed = "Completed",
  Cancelled = "Cancelled"
}

export enum OperationType {
  Inbound = "Inbound",
  Outbound = "Outbound",
  Adjust = "Adjust",
  Transfer = "Transfer"
}

export enum ErrorCode {
  Unauthorized = "UNAUTHORIZED",
  Forbidden = "FORBIDDEN",
  NotFound = "NOT_FOUND",
  ValidationError = "VALIDATION_ERROR",
  BusinessError = "BUSINESS_ERROR",
  InternalError = "INTERNAL_ERROR"
}
