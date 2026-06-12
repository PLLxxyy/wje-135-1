<script setup lang="ts">
import { computed, onMounted, reactive } from "vue";
import EmptyState from "../components/common/EmptyState.vue";
import StockAlert from "../components/common/StockAlert.vue";
import { usePagination } from "../hooks/usePagination";
import { useProductStore } from "../stores/productStore";
import type { Product } from "../types";
import { formatStockNumber } from "../utils/formatStockNumber";

const productStore = useProductStore();
const query = reactive({ keyword: "", categoryId: "" });
const { page, pageSize, total, pagedItems, resetPage } = usePagination(() => productStore.products, 8);
const treeProps = { label: "name", children: "children" };

const selectedProduct = computed(() => productStore.current || productStore.products[0]);

onMounted(async () => {
  await Promise.all([productStore.fetchCategories(), productStore.fetchProducts()]);
  if (productStore.products[0]) {
    await productStore.fetchDetail(productStore.products[0].id);
  }
});

async function search() {
  resetPage();
  await productStore.fetchProducts({ keyword: query.keyword || undefined, categoryId: query.categoryId || undefined });
}

async function selectCategory(data: { id: string }) {
  query.categoryId = data.id;
  await search();
}

async function selectProduct(row: Product) {
  await productStore.fetchDetail(row.id);
}
</script>

<template>
  <section class="product-page">
    <aside class="panel">
      <div class="panel-title"><h2>分类</h2></div>
      <el-tree :data="productStore.categories" :props="treeProps" node-key="id" default-expand-all @node-click="selectCategory" />
    </aside>

    <div class="panel product-main">
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="商品名 / SKU / 条码" clearable @keyup.enter="search" />
        <el-button type="primary" @click="search">搜索</el-button>
        <el-button @click="query.categoryId = ''; search()">重置</el-button>
      </div>
      <el-table :data="pagedItems" v-loading="productStore.loading" @row-click="selectProduct">
        <el-table-column prop="name" label="商品" min-width="170" />
        <el-table-column prop="sku" label="SKU" min-width="140" />
        <el-table-column prop="spec" label="规格" min-width="160" />
        <el-table-column prop="totalStock" label="总库存" width="120">
          <template #default="{ row }">{{ formatStockNumber(row.totalStock, row.unit) }}</template>
        </el-table-column>
        <el-table-column label="预警" width="180">
          <template #default="{ row }">
            <StockAlert :name="row.name" :sku="row.sku" :current="row.totalStock || 0" :min="row.minStock" :unit="row.unit" />
          </template>
        </el-table-column>
      </el-table>
      <EmptyState v-if="!productStore.loading && !productStore.products.length" title="没有匹配商品" />
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" layout="prev, pager, next" :total="total" />
    </div>

    <aside class="panel">
      <div class="panel-title"><h2>库存分布</h2></div>
      <el-table v-if="selectedProduct?.stockRecords?.length" :data="selectedProduct.stockRecords">
        <el-table-column prop="warehouse.name" label="仓库" />
        <el-table-column prop="shelf.shelfCode" label="库位" />
        <el-table-column prop="batchNo" label="批次" />
        <el-table-column prop="quantity" label="数量" />
      </el-table>
      <EmptyState v-else title="暂无库存记录" />
    </aside>
  </section>
</template>
