export function formatStockNumber(value: number | undefined, unit = "") {
  const amount = Number(value || 0).toLocaleString("zh-CN");
  return unit ? `${amount} ${unit}` : amount;
}
