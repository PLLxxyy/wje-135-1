import { computed, ref } from "vue";

export function usePagination<T>(source: () => T[], initialPageSize = 10) {
  const page = ref(1);
  const pageSize = ref(initialPageSize);
  const total = computed(() => source().length);
  const pagedItems = computed(() => {
    const start = (page.value - 1) * pageSize.value;
    return source().slice(start, start + pageSize.value);
  });

  function resetPage() {
    page.value = 1;
  }

  return { page, pageSize, total, pagedItems, resetPage };
}
