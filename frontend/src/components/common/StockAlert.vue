<script setup lang="ts">
defineProps<{
  name: string;
  sku: string;
  current: number;
  min: number;
  unit?: string;
}>();
</script>

<template>
  <div class="stock-alert" :class="{ danger: current < min }">
    <div>
      <strong>{{ name }}</strong>
      <span>{{ sku }}</span>
    </div>
    <b>{{ current }}{{ unit || "" }}</b>
    <small>下限 {{ min }}{{ unit || "" }}</small>
  </div>
</template>

<style scoped>
.stock-alert {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border: 1px solid #d9e3e7;
  border-radius: 8px;
  background: #f8fbfb;
}
.stock-alert span,
.stock-alert small {
  color: #64747a;
}
.stock-alert strong {
  display: block;
}
.stock-alert.danger {
  border-color: #f0b3a8;
  background: #fff4f1;
  color: #9b2d20;
}
</style>
