import { reactive } from "vue";
import { useStockStore } from "../stores/stockStore";

export function useStockQuery() {
  const stockStore = useStockStore();
  const query = reactive({
    warehouseId: "",
    productId: "",
    batchNo: ""
  });

  async function search() {
    await stockStore.fetchRecords({
      warehouseId: query.warehouseId || undefined,
      productId: query.productId || undefined,
      batchNo: query.batchNo || undefined
    });
  }

  function reset() {
    query.warehouseId = "";
    query.productId = "";
    query.batchNo = "";
    return search();
  }

  return { query, records: stockStore.records, search, reset };
}
