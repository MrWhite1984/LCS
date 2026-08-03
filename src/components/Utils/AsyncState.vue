<template>
  <section class="async-state" :class="`async-state--${tone}`" role="status">
    <div class="async-state-icon"><i :class="icon"></i></div>
    <div class="async-state-copy">
      <strong>{{ title }}</strong>
      <span>{{ description }}</span>
    </div>
    <Button
      v-if="retry"
      label="Повторить"
      icon="pi pi-refresh"
      outlined
      size="small"
      @click="$emit('retry')"
    />
  </section>
</template>

<script setup>
defineEmits(['retry']);

defineProps({
  tone: { type: String, default: 'empty' },
  icon: { type: String, default: 'pi pi-inbox' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  retry: { type: Boolean, default: false },
});
</script>

<style scoped>
.async-state { display: flex; min-height: 10rem; align-items: center; justify-content: center; gap: 0.85rem; padding: 1.25rem; border: 1px solid rgba(var(--p-blue-500-rgb), 0.12); border-radius: 18px; background: linear-gradient(180deg, rgba(var(--p-blue-500-rgb), 0.04), transparent); color: var(--p-text-color); text-align: left; }
.async-state-icon { display: grid; width: 2.75rem; height: 2.75rem; flex: 0 0 auto; place-items: center; border-radius: 14px; color: var(--p-primary-color); background: color-mix(in srgb, var(--p-primary-color) 12%, transparent); }
.async-state-icon i { font-size: 1.2rem; }
.async-state-copy { display: flex; max-width: 26rem; flex-direction: column; gap: 0.18rem; }
.async-state-copy strong { font-size: 0.95rem; }
.async-state-copy span { color: var(--p-text-muted-color, var(--p-text-color-secondary)); font-size: 0.85rem; line-height: 1.35; }
.async-state--error .async-state-icon { color: var(--p-red-500); background: color-mix(in srgb, var(--p-red-500) 12%, transparent); }
@media (max-width: 640px) { .async-state { min-height: 9rem; flex-direction: column; text-align: center; } .async-state-copy { align-items: center; } }
</style>
