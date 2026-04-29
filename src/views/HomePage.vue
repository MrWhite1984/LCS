<template>
  <div class="layout" :class="{ 'layout-phone': isPhone }">
    <MobileSpeedDial v-if="authenticated" />

    <aside v-if="authenticated && !isPhone" class="sidebar" :class="{ 'sidebar-collapsed': !isExpanded }">
      <div class="sidebar-shell">
        <SideBar :collapsed="!isExpanded" class="position-relative" />
      </div>
      <Button
        class="expand"
        :icon="isExpanded ? 'pi pi-angle-left' : 'pi pi-angle-right'"
        @click="toggleSidebar"
      />
    </aside>

    <Drawer
      v-if="authenticated && isPhone"
      v-model:visible="isMobileMenuOpen"
      position="left"
      class="mobile-drawer"
    >
      <template #header>
        <div class="mobile-drawer-header">
          <div class="mobile-drawer-title">Навигация</div>
          <div class="mobile-drawer-subtitle">Разделы личного кабинета</div>
        </div>
      </template>
      <SideBar mobile class="position-relative mobile-sidebar" />
    </Drawer>

    <main class="content" :class="{ 'content-phone': authenticated && isPhone }">
      <header v-if="authenticated && isPhone" class="mobile-topbar">
        <Button
          icon="pi pi-bars"
          severity="secondary"
          outlined
          rounded
          aria-label="Открыть меню"
          @click="isMobileMenuOpen = true"
        />
        <div class="mobile-topbar-copy">
          <div class="mobile-topbar-kicker">LCS</div>
          <div class="mobile-topbar-title">{{ currentPageTitle }}</div>
        </div>
        <div class="mobile-topbar-badge" :class="{ 'has-unread': notificationStore.unreadCount > 0 }">
          <i class="pi pi-bell"></i>
          <span>{{ notificationStore.unreadCount }}</span>
        </div>
      </header>
      <section class="content-body">
        <router-view />
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import SideBar from '@/components/SideBar.vue';
import MobileSpeedDial from '@/components/Utils/MobileSpeedDial.vue';
import { isAuthenticated } from '@/utils/auth';
import { useRoute } from 'vue-router';
import { useNotificationStore } from '@/stores/notifications.js';
import { getUnreadNotifications, normalizeNotification } from '@/api/notifications.js';
import { connectNotificationsHub, disconnectNotificationsHub } from '@/utils/notificationHub.js';
import { useResponsiveLayout } from '@/composables/useResponsiveLayout.js';

const SIDEBAR_EXPANDED_STORAGE_KEY = 'sidebarExpanded';

const getSavedSidebarState = () => {
  const saved = localStorage.getItem(SIDEBAR_EXPANDED_STORAGE_KEY);
  if (saved === null) return true;
  return saved === 'true';
};

const isExpanded = ref(getSavedSidebarState());
const isMobileMenuOpen = ref(false);
const toast = useToast();
const route = useRoute();
const notificationStore = useNotificationStore();
const { isPhone } = useResponsiveLayout();
const authenticated = computed(() => isAuthenticated());
const currentPageTitle = computed(() => route.meta?.title || 'Личный кабинет');
let notificationsBootstrapPromise = null;

const showMessage = (message, summary, detail) => {
if (message === 'success') {
  toast.add({ severity: 'success', summary, detail, life: 3000 });
} else if (message === 'error') {
  toast.add({ severity: 'error', summary, detail, life: 3000 });
}
};

const showNotificationError = (detail) => {
  toast.add({
    severity: 'warn',
    summary: 'Уведомления',
    detail,
    life: 4000,
  });
};

const bootstrapNotifications = async () => {
  if (notificationsBootstrapPromise) {
    return notificationsBootstrapPromise;
  }

  notificationsBootstrapPromise = (async () => {
    notificationStore.reset();

    try {
      const unreadNotifications = await getUnreadNotifications();
      notificationStore.setUnreadNotifications(unreadNotifications);
    } catch (error) {
      console.error('Не удалось загрузить непрочитанные уведомления:', error);
      showNotificationError('Не удалось загрузить непрочитанные уведомления. Новые уведомления продолжат поступать онлайн.');
    }

    try {
      await connectNotificationsHub((payload) => {
        const notification = normalizeNotification(payload, { isRead: false });
        notificationStore.addLiveNotification(notification);

        toast.add({
          severity: 'info',
          summary: 'Новое уведомление',
          detail: notification.message || 'Получено новое уведомление',
          life: 5000,
        });
      });
    } catch (error) {
      console.error('Не удалось подключиться к хабу уведомлений:', error);
      showNotificationError('Не удалось подключить онлайн-уведомления.');
    }
  })().finally(() => {
    notificationsBootstrapPromise = null;
  });

  return notificationsBootstrapPromise;
};

const teardownNotifications = async () => {
  try {
    await disconnectNotificationsHub();
  } catch (error) {
    console.error('Не удалось отключить хаб уведомлений:', error);
  } finally {
    notificationStore.reset();
  }
};
const toggleSidebar = () => {
  isExpanded.value = !isExpanded.value;
};

watch(isExpanded, (value) => {
  localStorage.setItem(SIDEBAR_EXPANDED_STORAGE_KEY, String(value));
});

watch(
  () => route.fullPath,
  () => {
    isMobileMenuOpen.value = false;
  }
);

watch(isPhone, (value) => {
  if (!value) {
    isMobileMenuOpen.value = false;
  }
});

onMounted(() => {
const query = route.query;
if (query.message) {
  showMessage(query.message, query.summary, query.detail);
}

if (isAuthenticated()) {
  bootstrapNotifications();
}
});

onBeforeUnmount(() => {
  void teardownNotifications();
});
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100dvh;
  background: linear-gradient(
    180deg,
    rgba(var(--p-blue-500-rgb), 0.02),
    rgba(255, 255, 255, 0)
  );
}

.layout-phone {
  min-height: 100dvh;
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
  flex-shrink: 0;
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  width: 280px;
  display: flex;
  flex-direction: column;
  padding: 10px;
  background: transparent;
  box-sizing: border-box;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
  width: none;
}

.sidebar-collapsed {
  width: 90px;
}

.sidebar-shell {
  flex: 1;
  height: 100%;
  min-height: 0;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
}

.sidebar-shell :deep(.sidebar-container) {
  height: 100%;
}

.content {
  flex-grow: 1;
  overflow: auto;
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  min-width: 0;
  min-height: 100dvh;
}

.content-phone {
  display: flex;
  flex-direction: column;
}

.content-body {
  min-width: 0;
  flex: 1 1 auto;
}

.mobile-topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.9rem 1rem 0.8rem;
  border-bottom: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
  background: color-mix(in srgb, var(--p-bg-color-1) 90%, transparent);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.mobile-topbar-copy {
  flex: 1;
  min-width: 0;
}

.mobile-topbar-kicker {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--p-text-muted-color, var(--p-grey-2));
}

.mobile-topbar-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--p-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-topbar-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.7rem;
  border-radius: 999px;
  background: rgba(var(--p-blue-500-rgb), 0.08);
  color: var(--p-text-color);
  font-size: 0.85rem;
  font-weight: 600;
}

.mobile-topbar-badge.has-unread {
  background: rgba(var(--p-blue-500-rgb), 0.14);
}

.mobile-drawer-header {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.mobile-drawer-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--p-text-color);
}

.mobile-drawer-subtitle {
  font-size: 0.85rem;
  color: var(--p-text-muted-color, var(--p-grey-2));
}

.mobile-sidebar {
  height: 100%;
}

.expand {
  position: relative;
  height: 40px;
  width: 100%;
  border-radius: 12px;
  z-index: 1000;
  border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
  background: rgba(var(--p-blue-500-rgb), 0.05);
  color: var(--p-text-color);
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 10px;
}

.expand:hover {
  background: rgba(var(--p-blue-500-rgb), 0.1);
  border-color: rgba(var(--p-blue-500-rgb), 0.22);
}

.p-dark .expand {
  background: rgba(255, 255, 255, 0.06);
}

.p-dark .expand:hover {
  background: rgba(255, 255, 255, 0.1);
}

.p-dark .content-shell {
  background: linear-gradient(
    180deg,
    rgba(25, 25, 35, 0.85),
    rgba(18, 18, 28, 0.75)
  );
  border-color: rgba(255, 255, 255, 0.06);
}

.p-dark .sidebar-shell {
  background: linear-gradient(
    180deg,
    rgba(25, 25, 35, 0.6),
    rgba(18, 18, 28, 0.4)
  );
  border-color: rgba(255, 255, 255, 0.06);
}

:deep(.mobile-drawer) {
  width: min(88vw, 22rem);
  max-width: 22rem;
}

:deep(.mobile-drawer .p-drawer-content) {
  padding: 0;
}

:deep(.mobile-drawer .p-drawer-header) {
  padding: 1rem 1rem 0.75rem;
  border-bottom: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
}

@media (max-width: 768px) {
  .layout {
    display: block;
  }

  .content-body {
    padding-bottom: var(--app-mobile-bottom-offset);
  }
}
</style>
