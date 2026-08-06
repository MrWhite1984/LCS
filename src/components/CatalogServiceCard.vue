<template>
    <button
        type="button"
        class="catalog-service-card"
        :style="cardStyle"
        @click="$emit('select', item)"
    >
        <span class="catalog-service-card-top">
            <span class="catalog-service-icon"><i :class="item.icon || 'pi pi-box'"></i></span>
            <span class="catalog-service-badge">{{ item.badge || 'Сервис' }}</span>
        </span>
        <span class="catalog-service-card-body">
            <strong>{{ item.name }}</strong>
            <small>{{ item.description || 'Открыть раздел и продолжить работу.' }}</small>
        </span>
        <span class="catalog-service-card-footer">
            <span>{{ item.children?.length ? 'Открыть раздел' : 'Открыть сервис' }}</span>
            <i :class="item.children?.length ? 'pi pi-angle-right' : 'pi pi-arrow-right'"></i>
        </span>
    </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    item: { type: Object, required: true },
    index: { type: Number, default: 0 },
});

defineEmits(['select']);

const themes = [
    { accent: '#2563eb', soft: 'rgba(59, 130, 246, 0.14)' },
    { accent: '#b45309', soft: 'rgba(245, 158, 11, 0.15)' },
    { accent: '#15803d', soft: 'rgba(34, 197, 94, 0.14)' },
    { accent: '#0f766e', soft: 'rgba(20, 184, 166, 0.14)' },
    { accent: '#be185d', soft: 'rgba(236, 72, 153, 0.14)' },
    { accent: '#7c3aed', soft: 'rgba(139, 92, 246, 0.14)' },
    { accent: '#dc2626', soft: 'rgba(239, 68, 68, 0.14)' },
    { accent: '#4f46e5', soft: 'rgba(99, 102, 241, 0.14)' },
    { accent: '#0891b2', soft: 'rgba(34, 211, 238, 0.14)' },
    { accent: '#65a30d', soft: 'rgba(163, 230, 53, 0.15)' },
    { accent: '#c026d3', soft: 'rgba(232, 121, 249, 0.14)' },
];

const cardStyle = computed(() => {
    const theme = themes[props.item.theme ?? props.index % themes.length];
    return {
        '--catalog-card-accent': theme.accent,
        '--catalog-card-soft': theme.soft,
        '--catalog-card-delay': `${props.index * 55}ms`,
    };
});
</script>

<style scoped>
.catalog-service-card {
    position: relative;
    display: flex;
    min-height: 178px;
    width: 100%;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    padding: 1.1rem;
    border: 1px solid color-mix(in srgb, var(--catalog-card-accent) 24%, var(--p-grey-4));
    border-radius: 15px;
    color: var(--p-text-color);
    background: linear-gradient(145deg, var(--catalog-card-soft), transparent 48%), var(--p-bg-color-1);
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.07);
    cursor: pointer;
    isolation: isolate;
    text-align: left;
    animation: catalog-card-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) var(--catalog-card-delay) both;
    transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s ease, box-shadow 0.3s ease;
}

.catalog-service-card::before {
    position: absolute;
    z-index: -1;
    right: -2rem;
    bottom: -2.7rem;
    width: 7rem;
    height: 7rem;
    border-radius: 50%;
    content: '';
    background: var(--catalog-card-soft);
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.catalog-service-card::after {
    position: absolute;
    z-index: -1;
    inset: 0;
    content: '';
    background: linear-gradient(115deg, transparent 28%, rgba(255, 255, 255, 0.42) 49%, transparent 70%);
    opacity: 0;
    transform: translateX(-125%);
    transition: transform 0.75s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease;
}

.catalog-service-card:hover,
.catalog-service-card:focus-visible {
    border-color: color-mix(in srgb, var(--catalog-card-accent) 58%, var(--p-grey-4));
    box-shadow: 0 22px 42px color-mix(in srgb, var(--catalog-card-accent) 18%, transparent);
    outline: none;
    transform: translateY(-7px) rotate(-0.35deg);
}

.catalog-service-card:hover::before,
.catalog-service-card:focus-visible::before { transform: scale(1.28); }
.catalog-service-card:hover::after,
.catalog-service-card:focus-visible::after { opacity: 1; transform: translateX(125%); }

.catalog-service-card-top,
.catalog-service-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.85rem;
}

.catalog-service-icon {
    display: grid;
    width: 46px;
    height: 46px;
    place-items: center;
    border-radius: 12px;
    color: var(--catalog-card-accent);
    background: var(--catalog-card-soft);
    transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.catalog-service-icon i { font-size: 1.35rem; }
.catalog-service-badge { padding: 0.28rem 0.58rem; border-radius: 999px; color: var(--catalog-card-accent); background: var(--catalog-card-soft); font-size: 0.68rem; font-weight: 850; letter-spacing: 0.05em; text-transform: uppercase; }
.catalog-service-card-body { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; }
.catalog-service-card-body strong { font-size: 1.13rem; font-weight: 850; letter-spacing: -0.02em; }
.catalog-service-card-body small { color: var(--p-text-muted-color, var(--p-grey-1)); font-size: 0.8rem; line-height: 1.42; }
.catalog-service-card-footer { margin-top: 1rem; color: var(--catalog-card-accent); font-size: 0.84rem; font-weight: 850; }
.catalog-service-card-footer i { transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
.catalog-service-card:hover .catalog-service-icon, .catalog-service-card:focus-visible .catalog-service-icon { transform: rotate(-9deg) scale(1.12); }
.catalog-service-card:hover .catalog-service-card-footer i, .catalog-service-card:focus-visible .catalog-service-card-footer i { transform: translateX(6px); }

@keyframes catalog-card-in {
    from { opacity: 0; transform: translateY(18px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
    .catalog-service-card { animation: none; transition: none; }
}
</style>
