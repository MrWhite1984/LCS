<template>
  <div class="layout">
    <MobileSpeedDial />
    <aside class="sidebar" :class="{ 'sidebar-collapsed': !isExpanded }">
      <div class="sidebar-shell">
        <SideBar v-if="isAuthenticated" :collapsed="!isExpanded" class="position-relative"/>
      </div>
      <Button 
        class="expand" 
        :icon="isExpanded ? 'pi pi-angle-left' : 'pi pi-angle-right'" 
        @click="toggleSidebar"
      />
    </aside>
    <main class="content">
      <!-- <div class="content-shell"> -->
        <router-view />
      <!-- </div> -->
    </main>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import SideBar from '@/components/SideBar.vue';
import MobileSpeedDial from '@/components/Utils/MobileSpeedDial.vue';
import { isAuthenticated } from '@/utils/auth';
import { useRoute } from 'vue-router';
import { useNotificationStore } from '@/stores/notifications.js';
import { getUnreadNotifications, normalizeNotification } from '@/api/notifications.js';
import { connectNotificationsHub, disconnectNotificationsHub } from '@/utils/notificationHub.js';

const SIDEBAR_EXPANDED_STORAGE_KEY = 'sidebarExpanded';

const getSavedSidebarState = () => {
  const saved = localStorage.getItem(SIDEBAR_EXPANDED_STORAGE_KEY);
  if (saved === null) return true;
  return saved === 'true';
};

const isExpanded = ref(getSavedSidebarState());
const toast = useToast();
const route = useRoute();
const notificationStore = useNotificationStore();
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
  min-height: 100vh;
  background: linear-gradient(
    180deg,
    rgba(var(--p-blue-500-rgb), 0.02),
    rgba(255, 255, 255, 0)
  );
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
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
</style>
