<template>
    <Popover
        ref="popover"
        :class="['navigation-catalog-popover', { 'microservices-popover': showMicroservices }]"
        @show="handleShow"
        @hide="handleHide"
    >
        <div class="catalog-shell" :class="{ 'catalog-with-microservices': showMicroservices }">
            <header class="catalog-header">
                <Button
                    v-if="activeParent"
                    type="button"
                    icon="pi pi-arrow-left"
                    text
                    rounded
                    aria-label="Назад"
                    @click="activeParent = null"
                />
                <div class="catalog-header-copy">
                    <span class="catalog-kicker">{{ activeParent ? title : eyebrow }}</span>
                    <h2>{{ activeParent?.name || title }}</h2>
                </div>
                <button
                    v-if="utilityItem && showMicroservices && !activeParent"
                    type="button"
                    class="showcase-link"
                    @click="openItem(utilityItem)"
                >
                    <i :class="utilityItem.icon"></i>
                    <span>{{ utilityItem.name }}</span>
                    <i class="pi pi-arrow-up-right"></i>
                </button>
            </header>

            <div v-if="currentItems.length" class="catalog-grid">
                <button
                    v-for="item in currentItems"
                    :key="item.id || item.path"
                    type="button"
                    class="catalog-card"
                    @click="openItem(item)"
                >
                    <span class="catalog-card-icon">
                        <i :class="item.icon || 'pi pi-arrow-right'"></i>
                    </span>
                    <span class="catalog-card-copy">
                        <span class="catalog-card-title">{{ item.name }}</span>
                        <span v-if="item.description" class="catalog-card-description">{{ item.description }}</span>
                    </span>
                    <i :class="item.children?.length ? 'pi pi-angle-right' : 'pi pi-arrow-up-right'" class="catalog-card-arrow"></i>
                </button>
            </div>

            <div v-else-if="!showMicroservices" class="catalog-empty">Нет доступных разделов</div>

            <section v-if="showMicroservices && !activeParent" class="microservices-showcase">
                <div class="microservice-cards">
                    <InfraManagerMicroService />
                    <RatingService />
                    <MlAnalyticsMicroService />
                    <UmuSiriusMicroService />
                    <NewsMicroService v-if="canManageNews" />
                </div>
            </section>
        </div>
    </Popover>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue';
import { useRouter } from 'vue-router';
import { usePermissionStore } from '@/stores/permissions.js';
import InfraManagerMicroService from '@/components/Microservice/InfraManager/InfraManagerMicroService.vue';
import RatingService from '@/components/Microservice/Rating/RatingMicroService.vue';
import MlAnalyticsMicroService from '@/components/Microservice/MlAnalytics/MlAnalyticsMicroService.vue';
import UmuSiriusMicroService from '@/components/Microservice/UmuSiriusMicroService.vue';
import NewsMicroService from '@/components/News/NewsMicroService.vue';
import { canAccessNewsManagement } from '@/api/news.js';

const props = defineProps({
    title: {
        type: String,
        required: true,
    },
    eyebrow: {
        type: String,
        default: 'Навигация',
    },
    items: {
        type: Array,
        default: () => [],
    },
    showMicroservices: Boolean,
    utilityItem: {
        type: Object,
        default: null,
    },
});

const emit = defineEmits(['show', 'hide']);
const popover = ref(null);
const activeParent = ref(null);
const popoverTarget = ref(null);
const router = useRouter();
const permissionStore = usePermissionStore();
const canManageNews = computed(() => canAccessNewsManagement(permissionStore));
const currentItems = computed(() => activeParent.value?.children || props.items);

const toggle = (event) => {
    popoverTarget.value = event.currentTarget;
    popover.value?.toggle(event);
};

const openItem = (item) => {
    if (item.children?.length) {
        activeParent.value = item;
        return;
    }

    if (!item.path) return;
    popover.value?.hide();
    router.push(item.path);
};

const handleHide = () => {
    activeParent.value = null;
    emit('hide');
};

const handleShow = async () => {
    await nextTick();

    const container = popover.value?.container;
    const target = popoverTarget.value;

    if (container && target) {
        const targetRect = target.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const margin = 12;
        const availableRight = window.innerWidth - targetRect.right - margin;
        const availableLeft = targetRect.left - margin;
        const opensRight = availableRight >= Math.min(containerRect.width, availableLeft);
        const left = (opensRight
            ? Math.min(targetRect.right + margin, window.innerWidth - containerRect.width - margin)
            : Math.max(margin, targetRect.left - containerRect.width - margin));
        const top = Math.max(
            margin,
            Math.min(targetRect.top, window.innerHeight - containerRect.height - margin)
        );

        container.style.position = 'fixed';
        container.style.left = `${left}px`;
        container.style.top = `${top}px`;
        container.style.margin = '0';
        container.removeAttribute('data-p-popover-flipped');
        container.classList.remove('p-popover-flipped');
    }

    emit('show');
};

defineExpose({
    toggle,
    hide: () => popover.value?.hide(),
});
</script>

<style scoped>
.navigation-catalog-popover :deep(.p-popover-content) {
    width: min(760px, calc(100vw - 1.5rem));
    max-height: calc(100vh - 1.5rem);
    padding: 0;
    overflow: auto;
    overscroll-behavior: contain;
}

:global(.navigation-catalog-popover.p-popover) {
    overflow: hidden;
    border: 0;
    border-radius: 20px;
    background: var(--p-bg-color-1);
    box-shadow: 0 20px 48px rgba(15, 23, 42, 0.2);
}

:global(.navigation-catalog-popover.p-popover::before),
:global(.navigation-catalog-popover.p-popover::after) {
    display: none;
}

.navigation-catalog-popover.microservices-popover :deep(.p-popover-content) {
    width: min(630px, calc(100vw - 1.5rem));
    max-height: calc(100vh - 1.5rem);
}

.catalog-shell {
    padding: 0.9rem;
    background: var(--p-bg-color-1);
}

.catalog-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 0.75rem;
}

.catalog-kicker,
.showcase-heading > span {
    display: block;
    color: var(--p-primary-color);
    font-size: 0.69rem;
    font-weight: 850;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

.catalog-header h2,
.showcase-heading h3 {
    margin: 0.16rem 0 0;
    color: var(--p-text-color);
    font-weight: 850;
    letter-spacing: -0.035em;
}

.catalog-header h2 {
    font-size: clamp(1.2rem, 2vw, 1.45rem);
}

.showcase-heading h3 {
    font-size: 1.05rem;
}

.catalog-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.6rem;
    align-items: stretch;
}

.catalog-card {
    position: relative;
    display: flex;
    align-items: center;
    min-height: 82px;
    width: 100%;
    height: 100%;
    gap: 0.7rem;
    padding: 0.75rem;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--p-primary-color) 15%, var(--p-grey-4));
    border-radius: 16px;
    color: var(--p-text-color);
    background: linear-gradient(135deg, color-mix(in srgb, var(--p-primary-color) 10%, transparent), var(--p-bg-color-1) 70%);
    text-align: left;
    cursor: pointer;
    animation: catalog-card-enter 0.48s cubic-bezier(0.22, 1, 0.36, 1) both;
    transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.28s ease, box-shadow 0.28s ease;
}

.catalog-card:nth-child(2) { animation-delay: 45ms; }
.catalog-card:nth-child(3) { animation-delay: 90ms; }
.catalog-card:nth-child(4) { animation-delay: 135ms; }
.catalog-card:nth-child(5) { animation-delay: 180ms; }
.catalog-card:nth-child(6) { animation-delay: 225ms; }

.catalog-card::after {
    position: absolute;
    right: -2.4rem;
    bottom: -3.4rem;
    width: 7.6rem;
    height: 7.6rem;
    border-radius: 50%;
    content: '';
    background: color-mix(in srgb, var(--p-primary-color) 12%, transparent);
    transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), background 0.28s ease;
}

.catalog-card:hover,
.catalog-card:focus-visible {
    border-color: color-mix(in srgb, var(--p-primary-color) 48%, var(--p-grey-4));
    box-shadow: 0 17px 30px rgba(15, 23, 42, 0.14);
    transform: translateY(-5px) scale(1.012);
    outline: none;
}

.catalog-card:hover::after,
.catalog-card:focus-visible::after {
    background: color-mix(in srgb, var(--p-primary-color) 21%, transparent);
    transform: scale(1.2);
}

.catalog-card-icon {
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 40px;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    color: var(--p-primary-color);
    background: color-mix(in srgb, var(--p-primary-color) 14%, transparent);
    font-size: 1.08rem;
    transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), background 0.28s ease;
}

.catalog-card:hover .catalog-card-icon,
.catalog-card:focus-visible .catalog-card-icon {
    background: color-mix(in srgb, var(--p-primary-color) 22%, transparent);
    transform: rotate(-7deg) scale(1.08);
}

.catalog-card-copy {
    z-index: 1;
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.26rem;
    min-width: 0;
}

.catalog-card-title {
    font-size: 0.94rem;
    font-weight: 850;
    letter-spacing: -0.015em;
    line-height: 1.16;
}

.catalog-card-description {
    color: var(--p-text-muted-color, var(--p-grey-1));
    font-size: 0.8rem;
    line-height: 1.35;
}

.catalog-card-arrow {
    z-index: 1;
    color: var(--p-primary-color);
    transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.catalog-card:hover .catalog-card-arrow,
.catalog-card:focus-visible .catalog-card-arrow {
    transform: translate(3px, -3px);
}

.catalog-empty {
    padding: 1.5rem;
    color: var(--p-text-muted-color, var(--p-grey-1));
    text-align: center;
}

.microservices-showcase {
    margin-top: 1rem;
    padding-top: 0.9rem;
    border-top: 1px solid color-mix(in srgb, var(--p-primary-color) 16%, var(--p-grey-4));
}

.microservice-cards {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.65rem;
    margin-top: 0.65rem;
}

.showcase-link {
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
    padding: 0.42rem 0.55rem;
    border: 1px solid color-mix(in srgb, var(--p-primary-color) 20%, var(--p-grey-4));
    border-radius: 10px;
    color: var(--p-primary-color);
    background: color-mix(in srgb, var(--p-primary-color) 8%, transparent);
    font-size: 0.72rem;
    font-weight: 800;
    cursor: pointer;
    transition: transform 0.22s ease, background 0.22s ease, border-color 0.22s ease;
}

.catalog-header .showcase-link {
    margin-left: auto;
}

.showcase-link:hover,
.showcase-link:focus-visible {
    border-color: var(--p-primary-color);
    background: color-mix(in srgb, var(--p-primary-color) 15%, transparent);
    transform: translateY(-2px);
    outline: none;
}

.showcase-link .pi:last-child {
    font-size: 0.7rem;
}

.microservice-cards > * {
    animation: catalog-card-enter 0.56s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.microservice-cards > *:nth-child(2) { animation-delay: 70ms; }
.microservice-cards > *:nth-child(3) { animation-delay: 140ms; }
.microservice-cards > *:nth-child(4) { animation-delay: 210ms; }
.microservice-cards > *:nth-child(5) { animation-delay: 280ms; }

.microservice-cards :deep(.service-card) {
    min-height: 150px;
    will-change: transform, box-shadow;
    transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s ease, box-shadow 0.3s ease;
}

.catalog-with-microservices .microservice-cards {
    grid-template-columns: repeat(5, minmax(0, 1fr));
}

.catalog-with-microservices .microservice-cards :deep(.service-card) {
    min-height: 112px;
    padding: 0.7rem;
}

.catalog-with-microservices .microservice-cards :deep(.service-card-body) {
    margin-top: 0.55rem;
}

.catalog-with-microservices .microservice-cards :deep(.service-card-body h3) {
    font-size: 0.95rem;
    font-weight: 900;
    line-height: 1.12;
    letter-spacing: -0.025em;
}

.catalog-with-microservices .microservice-cards :deep(.service-card-body p) {
    display: none;
}

.catalog-with-microservices .microservice-cards :deep(.service-card-footer) {
    display: none;
}

.catalog-with-microservices .microservice-cards :deep(.service-icon-wrap) {
    width: 38px;
    height: 38px;
    border-radius: 11px;
}

.catalog-with-microservices .microservice-cards :deep(.service-icon-wrap i) {
    font-size: 1.08rem;
}

.catalog-with-microservices .microservice-cards :deep(.service-badge) {
    padding: 0.22rem 0.42rem;
    font-size: 0.62rem;
}

.microservice-cards :deep(.service-card)::before {
    position: absolute;
    inset: 0;
    z-index: 0;
    content: '';
    background: linear-gradient(112deg, transparent 28%, rgba(255, 255, 255, 0.42) 48%, transparent 68%);
    opacity: 0;
    transform: translateX(-110%);
    transition: transform 0.72s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.18s ease;
    pointer-events: none;
}

.microservice-cards :deep(.service-card:hover),
.microservice-cards :deep(.service-card:focus-within) {
    box-shadow: 0 21px 38px rgba(15, 23, 42, 0.16);
    transform: translateY(-6px) scale(1.012);
}

.microservice-cards :deep(.service-card:hover)::before,
.microservice-cards :deep(.service-card:focus-within)::before {
    opacity: 1;
    transform: translateX(110%);
}

.microservice-cards :deep(.service-card:hover)::after,
.microservice-cards :deep(.service-card:focus-within)::after {
    transform: scale(1.18);
    transition: transform 0.48s cubic-bezier(0.22, 1, 0.36, 1);
}

.microservice-cards :deep(.service-icon-wrap),
.microservice-cards :deep(.service-badge),
.microservice-cards :deep(.service-card-footer i) {
    transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), background 0.28s ease;
}

.microservice-cards :deep(.service-card:hover .service-icon-wrap),
.microservice-cards :deep(.service-card:focus-within .service-icon-wrap) {
    transform: rotate(-8deg) scale(1.1);
}

.microservice-cards :deep(.service-card:hover .service-badge),
.microservice-cards :deep(.service-card:focus-within .service-badge) {
    transform: translateY(-2px) scale(1.04);
}

.microservice-cards :deep(.service-card:hover .service-card-footer i),
.microservice-cards :deep(.service-card:focus-within .service-card-footer i) {
    transform: translateX(5px);
}

@keyframes catalog-card-enter {
    from {
        opacity: 0;
        transform: translateY(14px) scale(0.985);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@media (max-width: 820px) {
    .catalog-grid,
    .microservice-cards {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 760px) {
    .catalog-with-microservices .microservice-cards {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (max-width: 640px) {
    .navigation-catalog-popover :deep(.p-popover-content) {
        width: calc(100vw - 1rem);
    }

    .catalog-shell {
        padding: 1rem;
    }

    .catalog-grid,
    .microservice-cards {
        grid-template-columns: 1fr;
    }

    .catalog-with-microservices .microservice-cards {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 420px) {
    .catalog-with-microservices .microservice-cards {
        grid-template-columns: 1fr;
    }
}

@media (prefers-reduced-motion: reduce) {
    .catalog-card,
    .microservice-cards > * {
        animation: none;
        transition: none;
    }
}
</style>
