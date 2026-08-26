<template>
    <nav v-if="isPhone && !servicesVisible" class="mobile-dock" aria-label="Навигация">
        <button
            v-for="item in dockItems"
            :key="item.id"
            type="button"
            class="dock-action"
            :class="{
                'dock-action--active': isActionActive(item),
                'dock-action--services': item.id === 'services',
            }"
            :aria-current="isActionActive(item) ? 'page' : undefined"
            @click="handleAction(item)"
        >
            <OverlayBadge
                v-if="item.id === 'notifications' && notificationStore.unreadCount > 0"
                :value="notificationStore.unreadCount"
                severity="danger"
                class="dock-action-badge"
            >
                <i :class="item.icon"></i>
            </OverlayBadge>
            <i v-else :class="item.icon"></i>
            <span>{{ item.name }}</span>
        </button>
    </nav>

    <ServicesCatalogModal
        v-model:visible="servicesVisible"
        :items="servicesCatalogItems"
        :admin-items="adminCatalogItems"
        show-theme-editor
    />
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotificationStore } from '@/stores/notifications.js';
import { useResponsiveLayout } from '@/composables/useResponsiveLayout.js';
import { useAppNavigation } from '@/composables/useAppNavigation.js';
import ServicesCatalogModal from '@/components/ServicesCatalogModal.vue';

const router = useRouter();
const route = useRoute();
const notificationStore = useNotificationStore();
const { isPhone } = useResponsiveLayout();
const servicesVisible = ref(false);
const {
    topItems,
    serviceItems,
    adminItems,
    ticketsItems,
    idoItems,
    umuSiriusItems,
    projectOfficeItems,
    showTicketsMenu,
    showIdoMenu,
    showUmuSiriusMenu,
    showProjectOfficeMenu,
} = useAppNavigation();

const scheduleItem = computed(() => serviceItems.value.find((item) => item.id === 'schedule'));
const servicesCatalogItems = computed(() => {
    const items = serviceItems.value.filter((item) => item.id !== 'schedule');

    if (showTicketsMenu.value) {
        items.push({ id: 'tickets', name: 'Справки', icon: 'pi pi-ticket', children: ticketsItems.value });
    }

    if (showIdoMenu.value) {
        items.push({ id: 'ido', name: 'ИДО', icon: 'pi pi-building-columns', children: idoItems.value });
    }

    if (showUmuSiriusMenu.value) {
        items.push({ id: 'umu-sirius', name: 'СибАДИ - Управление', icon: 'pi pi-briefcase', children: umuSiriusItems.value, badge: 'Скоро' });
    }

    if (showProjectOfficeMenu.value) {
        items.push({ id: 'project-office', name: 'Проектный офис', icon: 'pi pi-paperclip', children: projectOfficeItems.value, badge: 'Скоро' });
    }

    return items;
});
const adminCatalogItems = computed(() => adminItems.value);
const dockItems = computed(() => [
    topItems.value.find((item) => item.id === 'overview') || { id: 'overview', name: 'Главная', path: '/overview', icon: 'pi pi-home' },
    scheduleItem.value || { id: 'schedule', name: 'Расписание', path: '/schedule', icon: 'pi pi-calendar' },
    { id: 'services', name: 'Сервисы', icon: 'pi pi-th-large' },
    topItems.value.find((item) => item.id === 'notifications') || { id: 'notifications', name: 'Уведомления', path: '/notif', icon: 'pi pi-bell' },
    { id: 'profile', name: 'Профиль', path: '/profile', icon: 'pi pi-user' },
]);

const isActionActive = (item) => (
    item.id === 'services'
        ? servicesVisible.value || !dockItems.value.some((dockItem) => dockItem.path === route.path)
        : route.path === item.path
);

const handleAction = async (item) => {
    if (item.id === 'services') {
        servicesVisible.value = true;
        return;
    }

    if (route.path !== item.path) {
        await router.push(item.path);
    }
};
</script>

<style scoped>
.mobile-dock {
    position: fixed;
    left: 50%;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 10px);
    z-index: 1200;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    align-items: end;
    width: min(calc(100vw - 1rem), 32rem);
    min-height: 4.4rem;
    padding: 0.45rem;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.16);
    border-radius: 1.5rem;
    background: color-mix(in srgb, var(--p-bg-color-1) 90%, transparent);
    box-shadow: 0 18px 42px rgba(15, 23, 42, 0.16);
    backdrop-filter: blur(22px) saturate(145%);
    -webkit-backdrop-filter: blur(22px) saturate(145%);
    transform: translateX(-50%);
}

.dock-action {
    display: flex;
    min-width: 0;
    min-height: 3.5rem;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.28rem;
    border: 0;
    border-radius: 1rem;
    background: transparent;
    color: var(--p-text-color);
    cursor: pointer;
    font-size: 0.63rem;
    font-weight: 650;
    line-height: 1.05;
    transition: background 0.2s ease, color 0.2s ease, transform 0.24s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.24s ease;
}

.dock-action > .pi,
.dock-action :deep(.p-overlaybadge .pi) {
    font-size: 1.15rem;
}

.dock-action--active:not(.dock-action--services) {
    background: rgba(var(--p-blue-500-rgb), 0.13);
    color: var(--p-primary-color);
}

.dock-action--services {
    min-height: 3.85rem;
    margin: -1.1rem 0 0;
    border: 4px solid var(--p-bg-color-1);
    border-radius: 1.2rem;
    background: linear-gradient(145deg, var(--p-primary-color), color-mix(in srgb, var(--p-primary-color) 70%, #6d8fff));
    box-shadow: 0 10px 20px rgba(var(--p-blue-500-rgb), 0.34);
    color: #fff;
}

.dock-action--services > .pi {
    font-size: 1.25rem;
}

.dock-action:active {
    transform: translateY(1px);
}

.dock-action--services:active {
    transform: translateY(2px) scale(0.98);
}

.dock-action:focus-visible {
    outline: 2px solid var(--p-primary-color);
    outline-offset: 2px;
}

.dock-action-badge :deep(.p-badge) {
    min-width: 1rem;
    height: 1rem;
    line-height: 1rem;
    font-size: 0.62rem;
}

@media (max-width: 360px) {
    .mobile-dock {
        width: calc(100vw - 0.75rem);
        padding: 0.35rem;
    }

    .dock-action {
        min-height: 3.35rem;
        font-size: 0.58rem;
    }
}
</style>
