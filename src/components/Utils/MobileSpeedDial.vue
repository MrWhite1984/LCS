<template>
    <div class="mobile-speed-dial">
        <SpeedDial 
            v-if="isMobile"
            :model="items"
            direction="up"
            :hideOnClickOutside="true"
            buttonClass="p-button-rounded p-button-primary"
            :showIcon="'pi pi-ellipsis-v'"
            :hideIcon="'pi pi-times'"
            :tooltipOptions="{ position: 'right' }"
        />
    </div>
    
</template>
  
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { usePermissionStore } from '@/stores/permissions.js';
import { useNotificationStore } from '@/stores/notifications.js';
import { useRouter } from 'vue-router';
import { clearAuthData } from '@/utils/TokenService.js';
import { resetRequestAccessCache } from '@/utils/requestAccess.js';
import { resetCurrentUserCache } from '@/utils/currentUser.js';
import { disconnectNotificationsHub } from '@/utils/notificationHub.js';

const permissionStore = usePermissionStore();
const notificationStore = useNotificationStore();
const isMobile = ref(false);
const router = useRouter();
  
// Массив для элементов SpeedDial
const items = [
    { label: 'Выход', icon: 'pi pi-sign-out', command: () => logout() },
    { label: 'Профиль', icon: 'pi pi-user', command: () => console.debug('Profile clicked') },
    { label: 'Пользователи', icon: 'pi pi-users', command: () => console.debug('Settings clicked') },
    { label: 'Роли', icon: 'pi pi-sitemap', command: () => router.push('/rbac') },
    { label: 'Микросервисы', icon: 'pi pi-desktop', command: () => router.push('/services') },
    { label: 'Заявки', icon: 'pi pi-pen-to-square', command: () => router.push('/requests') },
    { label: 'Уведомления', icon: 'pi pi-bell', command: () => router.push('/notif') },
    { label: 'Главная', icon: 'pi pi-home', command: () => router.push('/overview') },
];

const logout = async () => {
    await disconnectNotificationsHub();
    notificationStore.reset();
    clearAuthData();
    await permissionStore.clearPermissions();
    await permissionStore.$reset();
    resetRequestAccessCache();
    resetCurrentUserCache();
    
    router.push('/auth');
};
  
// Функция для проверки мобильного устройства
const checkIsMobile = () => {
isMobile.value = window.innerWidth < 768; // Ширина для мобильных устройств
};

// Слушатель для изменения размера окна
onMounted(() => {
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
});

// Удаляем слушатель при размонтировании
onBeforeUnmount(() => {
    window.removeEventListener('resize', checkIsMobile);
});
</script>

<style scoped>
.mobile-speed-dial {
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 1000;
}
</style>
  
