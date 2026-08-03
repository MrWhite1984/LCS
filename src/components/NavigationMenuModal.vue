<template>
    <Dialog
        :visible="visible"
        modal
        :style="{ width: 'min(92vw, 980px)' }"
        class="navigation-modal"
        @update:visible="emit('update:visible', $event)"
        @hide="emit('update:visible', false)"
    >
        <template #header>
            <div class="navigation-modal-header">
                <Button
                    v-if="activeParent"
                    type="button"
                    icon="pi pi-arrow-left"
                    text
                    rounded
                    aria-label="Назад"
                    @click="activeParent = null"
                />
                <span>{{ activeParent?.name || title }}</span>
            </div>
        </template>
        <div class="navigation-modal-body">
            <p v-if="subtitle && !activeParent" class="navigation-modal-subtitle">{{ subtitle }}</p>

            <div v-if="currentItems.length" class="navigation-modal-grid">
                <button
                    v-for="item in currentItems"
                    :key="item.id || item.path"
                    type="button"
                    class="navigation-card"
                    @click="openItem(item)"
                >
                    <span class="navigation-card-icon">
                        <i :class="item.icon || 'pi pi-arrow-right'"></i>
                    </span>
                    <span class="navigation-card-copy">
                        <span class="navigation-card-title">{{ item.name }}</span>
                        <span v-if="item.description" class="navigation-card-description">{{ item.description }}</span>
                    </span>
                    <i class="pi pi-arrow-up-right navigation-card-arrow"></i>
                </button>
            </div>

            <div v-else class="navigation-modal-empty">Нет доступных разделов</div>
        </div>
    </Dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
    visible: Boolean,
    title: {
        type: String,
        default: 'Разделы',
    },
    subtitle: {
        type: String,
        default: '',
    },
    items: {
        type: Array,
        default: () => [],
    },
});

const emit = defineEmits(['update:visible']);
const router = useRouter();
const activeParent = ref(null);
const currentItems = computed(() => activeParent.value?.children || props.items);

watch(() => props.visible, (visible) => {
    if (!visible) activeParent.value = null;
});

const openItem = (item) => {
    if (!item?.path) return;

    if (item.children?.length) {
        activeParent.value = item;
        return;
    }

    emit('update:visible', false);
    router.push(item.path);
};
</script>

<style scoped>
.navigation-modal :deep(.p-dialog-content) {
    padding: 1.35rem;
}

.navigation-modal :deep(.p-dialog-header) {
    padding: 1.35rem 1.35rem 0.9rem;
}

.navigation-modal-body {
    color: var(--p-text-color);
}

.navigation-modal-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--p-text-color);
    font-size: clamp(1.35rem, 2vw, 1.7rem);
    font-weight: 850;
    letter-spacing: -0.035em;
}

.navigation-modal-subtitle {
    max-width: 58ch;
    margin: 0 0 1.2rem;
    color: var(--p-text-muted-color, var(--p-grey-1));
    font-size: 0.94rem;
    line-height: 1.5;
}

.navigation-modal-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1rem;
}

.navigation-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.9rem;
    min-height: 126px;
    padding: 1.1rem;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--p-primary-color) 18%, var(--p-grey-4));
    border-radius: 16px;
    color: var(--p-text-color);
    background: linear-gradient(135deg, color-mix(in srgb, var(--p-primary-color) 11%, transparent), var(--p-bg-color-1) 72%);
    text-align: left;
    cursor: pointer;
    isolation: isolate;
    animation: navigation-card-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
    transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.28s ease, border-color 0.28s ease;
}

.navigation-card:nth-child(2) { animation-delay: 55ms; }
.navigation-card:nth-child(3) { animation-delay: 110ms; }
.navigation-card:nth-child(4) { animation-delay: 165ms; }
.navigation-card:nth-child(5) { animation-delay: 220ms; }
.navigation-card:nth-child(6) { animation-delay: 275ms; }

.navigation-card::after {
    content: '';
    position: absolute;
    right: -2rem;
    bottom: -3rem;
    width: 7rem;
    height: 7rem;
    border-radius: 50%;
    background: color-mix(in srgb, var(--p-primary-color) 12%, transparent);
    pointer-events: none;
    transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), background 0.3s ease;
}

.navigation-card:hover,
.navigation-card:focus-visible {
    border-color: color-mix(in srgb, var(--p-primary-color) 42%, var(--p-grey-4));
    box-shadow: 0 18px 36px rgba(15, 23, 42, 0.14);
    transform: translateY(-6px) scale(1.012);
    outline: none;
}

.navigation-card:hover::after,
.navigation-card:focus-visible::after {
    background: color-mix(in srgb, var(--p-primary-color) 20%, transparent);
    transform: scale(1.22);
}

.navigation-card-icon {
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 44px;
    width: 48px;
    height: 48px;
    border-radius: 13px;
    color: var(--p-primary-color);
    background: color-mix(in srgb, var(--p-primary-color) 13%, transparent);
    font-size: 1.28rem;
    transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), background 0.28s ease;
}

.navigation-card:hover .navigation-card-icon,
.navigation-card:focus-visible .navigation-card-icon {
    background: color-mix(in srgb, var(--p-primary-color) 20%, transparent);
    transform: rotate(-7deg) scale(1.08);
}

.navigation-card-copy {
    z-index: 1;
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.3rem;
    min-width: 0;
}

.navigation-card-title {
    font-size: 1.08rem;
    font-weight: 850;
    letter-spacing: -0.015em;
    line-height: 1.2;
}

.navigation-card-description {
    color: var(--p-text-muted-color, var(--p-grey-1));
    font-size: 0.82rem;
    line-height: 1.35;
}

.navigation-card-arrow {
    z-index: 1;
    color: var(--p-primary-color);
    transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.navigation-card:hover .navigation-card-arrow,
.navigation-card:focus-visible .navigation-card-arrow {
    transform: translate(3px, -3px);
}

.navigation-modal-empty {
    padding: 2rem 1rem;
    color: var(--p-text-muted-color, var(--p-grey-1));
    text-align: center;
}

@media (max-width: 640px) {
    .navigation-modal-grid {
        grid-template-columns: 1fr;
    }
}

@keyframes navigation-card-in {
    from {
        opacity: 0;
        transform: translateY(16px) scale(0.98);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@media (prefers-reduced-motion: reduce) {
    .navigation-card {
        animation: none;
        transition: none;
    }
}
</style>
