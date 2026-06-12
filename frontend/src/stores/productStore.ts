import { defineStore } from "pinia";
import { categoryApi } from "../api/category";
import { productApi } from "../api/product";
import type { Category, Product } from "../types";

export const useProductStore = defineStore("product", {
  state: () => ({
    products: [] as Product[],
    categories: [] as Category[],
    current: null as Product | null,
    loading: false
  }),
  actions: {
    async fetchProducts(params?: { keyword?: string; categoryId?: string }) {
      this.loading = true;
      try {
        this.products = await productApi.list(params);
      } finally {
        this.loading = false;
      }
    },
    async fetchCategories() {
      this.categories = await categoryApi.list();
    },
    async fetchDetail(id: string) {
      this.current = await productApi.detail(id);
    }
  }
});
