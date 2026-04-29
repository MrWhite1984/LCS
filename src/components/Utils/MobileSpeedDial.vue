<template>
    <nav v-if="isPhone" class="mobile-speed-dial" aria-label="Быстрые действия">
        <button
            v-for="item in quickActions"
            :key="item.id"
            type="button"
            class="quick-action"
            :class="{ 'quick-action-active': isActionActive(item.path) }"
            @click="navigateTo(item.path)"
        >
            <OverlayBadge
                v-if="item.path === '/notif' && notificationStore.unreadCount > 0"
                :value="notificationStore.unreadCount"
                severity="danger"
                class="quick-action-badge"
            >
                <i :class="item.icon"></i>
            </OverlayBadge>
            <i v-else :class="item.icon"></i>
            <span>{{ item.name }}</span>
        </button>
    </nav>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { useNotificationStore } from '@/stores/notifications.js';
import { useResponsiveLayout } from '@/composables/useResponsiveLayout.js';
import { useAppNavigation } from '@/composables/useAppNavigation.js';

const router = useRouter();
const route = useRoute();
const notificationStore = useNotificationStore();
const { isPhone } = useResponsiveLayout();
const { quickActions } = useAppNavigation();

const isActionActive = (path) => {
    if (path === '/profile') return route.path === '/profile';
    return route.path === path;
};

const navigateTo = async (path) => {
    if (route.path === path) return;
    await router.push(path);
};
</script>

<style scoped>
.mobile-speed-dial {
    position: fixed;
    left: 50%;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
    z-index: 1200;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.45rem;
    width: min(calc(100vw - 1.25rem), 30rem);
    padding: 0.55rem;
    border-radius: 22px;
    transform: translateX(-50%);
    background: color-mix(in srgb, var(--p-bg-color-1) 88%, transparent);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.16);
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
}

.quick-action {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.38rem;
    min-height: 58px;
    border: 0;
    border-radius: 16px;
    background: transparent;
    color: var(--p-text-color);
    font-size: 0.72rem;
    font-weight: 600;
    transition: background 0.2s ease, transform 0.2s ease, color 0.2s ease;
}

.quick-action i {
    font-size: 1.1rem;
}

.quick-action-active {
    background: rgba(var(--p-blue-500-rgb), 0.12);
    color: rgb(var(--p-color-icon-menu));
}

.quick-action:active {
    transform: translateY(1px);
}

.quick-action-badge :deep(.p-badge) {
    min-width: 1rem;
    height: 1rem;
    line-height: 1rem;
    font-size: 0.62rem;
}

@media (max-width: 420px) {
    .mobile-speed-dial {
        width: calc(100vw - 1rem);
        gap: 0.3rem;
        padding: 0.45rem;
    }

    .quick-action {
        min-height: 54px;
        font-size: 0.68rem;
    }
}
</style>
