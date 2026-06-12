import { OrderType } from "../types/enums";

const prefixMap: Record<OrderType, string> = {
  [OrderType.Inbound]: "IN",
  [OrderType.Outbound]: "OUT",
  [OrderType.Transfer]: "TR",
  [OrderType.InventoryCheck]: "CHK"
};

export function generateOrderNumber(type: OrderType) {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefixMap[type]}-${yyyy}${mm}${dd}-${random}`;
}
