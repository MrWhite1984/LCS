<template>
  <div class="layout" :class="{ 'layout-phone': isPhone }">
    <MobileSpeedDial v-if="authenticated" />

    <aside
      v-if="authenticated && !isPhone"
      class="sidebar sidebar-collapsed"
      :class="{ 'sidebar-hovered': isSidebarOpen }"
      @mouseenter="handleSidebarMouseEnter"
      @mouseleave="handleSidebarMouseLeave"
      @focusin="openSidebarImmediately"
      @focusout="closeSidebarAfterFocus"
    >
      <div class="sidebar-shell">
        <SideBar
          :collapsed="!isSidebarOpen"
          class="position-relative"
          @overlay-open="lockSidebarForOverlay"
          @overlay-close="lockSidebarForOverlay"
          @request-expand="openSidebarForSearch"
        />
      </div>
    </aside>

    <main class="content" :class="{ 'content-phone': authenticated && isPhone }">
      <header v-if="authenticated && isPhone" class="mobile-topbar">
        <div class="mobile-topbar-mark" aria-hidden="true">L</div>
        <div class="mobile-topbar-copy">
          <div class="mobile-topbar-kicker">LCS</div>
          <div class="mobile-topbar-title">{{ currentPageTitle }}</div>
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
import { isAuthenticated, isLocalAuthBypass } from '@/utils/auth';
import { useRoute } from 'vue-router';
import { useNotificationStore } from '@/stores/notifications.js';
import { getUnreadNotifications, normalizeNotification } from '@/api/notifications.js';
import { connectNotificationsHub, disconnectNotificationsHub } from '@/utils/notificationHub.js';
import { useResponsiveLayout } from '@/composables/useResponsiveLayout.js';

const isSidebarOpen = ref(false);
const toast = useToast();
const route = useRoute();
const notificationStore = useNotificationStore();
const { isPhone } = useResponsiveLayout();
const authenticated = computed(() => isAuthenticated());
const currentPageTitle = computed(() => route.meta?.title || 'Личный кабинет');
let notificationsBootstrapPromise = null;
let sidebarHoverTimer = null;
let sidebarOverlayObserver = null;
let isSidebarInteractionLocked = false;
let isPointerOverSidebar = false;
let hasTrackedOpenModal = false;

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
const closeSidebarAfterFocus = (event) => {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    closeSidebar();
  }
};

const closeSidebar = () => {
  clearTimeout(sidebarHoverTimer);
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement && activeElement.id === 'searchQuery') {
    activeElement.blur();
  }
  isSidebarOpen.value = false;
};

const scheduleSidebarOpen = () => {
  if (isSidebarInteractionLocked) return;

  clearTimeout(sidebarHoverTimer);
  sidebarHoverTimer = setTimeout(() => {
    isSidebarOpen.value = true;
  }, 140);
};

const openSidebarImmediately = () => {
  if (isSidebarInteractionLocked) return;

  clearTimeout(sidebarHoverTimer);
  isSidebarOpen.value = true;
};

const openSidebarForSearch = async () => {
  openSidebarImmediately();
  await nextTick();
  window.setTimeout(() => document.getElementById('searchQuery')?.focus(), 120);
};

const handleSidebarMouseLeave = () => {
  isPointerOverSidebar = false;
  isSidebarInteractionLocked = false;
  closeSidebar();
};

const handleSidebarMouseEnter = () => {
  isPointerOverSidebar = true;
  scheduleSidebarOpen();
};

const lockSidebarForOverlay = () => {
  isSidebarInteractionLocked = true;
  closeSidebar();
};

const handleOverlayMutation = () => {
  const hasOpenModal = document.querySelector('.p-dialog-mask, .p-confirm-dialog, .p-drawer-mask');

  if (hasOpenModal) {
    hasTrackedOpenModal = true;
    lockSidebarForOverlay();
    return;
  }

  if (hasTrackedOpenModal) {
    hasTrackedOpenModal = false;
    isSidebarInteractionLocked = false;

    if (isPointerOverSidebar) {
      scheduleSidebarOpen();
    }
  }
};

const handleGlobalFocus = (event) => {
  if (event.target instanceof Element && event.target.closest('.p-dialog, .p-confirm-dialog, .p-drawer')) {
    hasTrackedOpenModal = true;
    lockSidebarForOverlay();
  }
};

watch(
  () => route.fullPath,
  () => {
    closeSidebar();
  }
);

onMounted(() => {
sidebarOverlayObserver = new MutationObserver(handleOverlayMutation);
sidebarOverlayObserver.observe(document.body, { childList: true, subtree: true });
document.addEventListener('focusin', handleGlobalFocus, true);
const query = route.query;
if (query.message) {
  showMessage(query.message, query.summary, query.detail);
}

if (isAuthenticated() && !isLocalAuthBypass()) {
  bootstrapNotifications();
}
});

onBeforeUnmount(() => {
  clearTimeout(sidebarHoverTimer);
  sidebarOverlayObserver?.disconnect();
  document.removeEventListener('focusin', handleGlobalFocus, true);
  void teardownNotifications();
});
</script>

<style scoped>
.layout {
  display: flex;
  height: 100dvh;
  min-height: 100dvh;
  overflow: hidden;
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
  position: relative;
  height: 100dvh;
  overflow: visible;
  flex-shrink: 0;
  width: 90px;
  display: flex;
  flex-direction: column;
  padding: 10px;
  background: transparent;
  box-sizing: border-box;
  z-index: 30;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
  width: none;
}

.sidebar-collapsed {
  width: 90px;
}

.sidebar-shell {
  position: absolute;
  inset: 14px auto 14px 10px;
  width: 70px;
  min-height: 0;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
  background: rgba(var(--p-bg-color-rgb), 0.16);
  backdrop-filter: blur(28px) saturate(150%);
  -webkit-backdrop-filter: blur(28px) saturate(150%);
  transition:
    width 0.42s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.42s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.42s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.28s ease;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  will-change: width, transform, box-shadow;
}

.sidebar-shell::after {
  content: '';
  position: absolute;
  inset: 18px 0 18px auto;
  width: 1px;
  opacity: 0;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    transparent,
    rgba(var(--p-blue-500-rgb), 0.5) 24%,
    rgba(var(--p-blue-500-rgb), 0.22) 76%,
    transparent
  );
  transition: opacity 0.35s ease 0.1s;
}

.sidebar-hovered .sidebar-shell {
  width: 280px;
  z-index: 2;
  transform: translateY(-1px);
  border-color: rgba(var(--p-blue-500-rgb), 0.28);
  box-shadow:
    0 24px 56px rgba(17, 24, 39, 0.19),
    0 8px 24px rgba(var(--p-blue-500-rgb), 0.14);
}

.sidebar-hovered .sidebar-shell::after {
  opacity: 1;
}

.sidebar-hovered::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  background: radial-gradient(circle at 0 50%, rgba(var(--p-blue-500-rgb), 0.08), transparent 31%);
  animation: sidebar-overlay-in 0.38s ease both;
}

@keyframes sidebar-overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.sidebar-shell :deep(.sidebar-container) {
  height: 100%;
}

.content {
  flex-grow: 1;
  height: 100dvh;
  overflow-y: auto;
  overflow-x: hidden;
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

.mobile-topbar-mark {
  display: grid;
  width: 2.35rem;
  height: 2.35rem;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid rgba(var(--p-blue-500-rgb), 0.14);
  border-radius: 0.85rem;
  background: linear-gradient(145deg, rgba(var(--p-blue-500-rgb), 0.18), rgba(var(--p-blue-500-rgb), 0.05));
  color: var(--p-primary-color);
  font-size: 1.1rem;
  font-weight: 800;
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

@media (max-width: 767px) {
  .layout {
    display: block;
    height: auto;
    overflow: visible;
  }

  .content {
    height: auto;
    overflow: visible;
  }

  .content-body {
    padding-bottom: var(--app-mobile-bottom-offset);
  }
}

@media (min-width: 769px) and (max-width: 1100px) {
  .sidebar,
  .sidebar-collapsed {
    width: 82px;
    padding: 8px;
  }

  .sidebar-shell {
    inset: 12px auto 12px 8px;
    width: 66px;
  }

  .sidebar-hovered .sidebar-shell {
    width: min(260px, calc(100vw - 2rem));
  }
}

@media (max-width: 420px) {
  .mobile-topbar {
    gap: 0.65rem;
    padding: calc(env(safe-area-inset-top, 0px) + 0.7rem) 0.75rem 0.7rem;
  }

}
</style>
