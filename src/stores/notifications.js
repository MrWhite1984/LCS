import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

function sortNotifications(items = []) {
    return [...items].sort((left, right) => {
        const leftDate = new Date(left.createdAt || 0).getTime();
        const rightDate = new Date(right.createdAt || 0).getTime();

        return rightDate - leftDate;
    });
}

export const useNotificationStore = defineStore('notifications', () => {
    const notifications = ref([]);

    const unreadCount = computed(() => notifications.value.filter((item) => !item.isRead).length);

    function setUnreadNotifications(items = []) {
        notifications.value = sortNotifications(
            items.map((item) => ({
                ...item,
                isRead: false,
            }))
        );
    }

    function addLiveNotification(notification) {
        if (!notification?.id) return;

        const currentIndex = notifications.value.findIndex((item) => item.id === notification.id);

        if (currentIndex === -1) {
            notifications.value = sortNotifications([
                ...notifications.value,
                {
                    ...notification,
                    isRead: false,
                },
            ]);
            return;
        }

        const current = notifications.value[currentIndex];
        const nextNotifications = [...notifications.value];

        nextNotifications[currentIndex] = {
            ...current,
            ...notification,
            isRead: current.isRead,
        };

        notifications.value = sortNotifications(nextNotifications);
    }

    function markAsRead(notificationId) {
        const currentIndex = notifications.value.findIndex((item) => item.id === notificationId);

        if (currentIndex === -1) return;
        if (notifications.value[currentIndex].isRead) return;

        const nextNotifications = [...notifications.value];
        nextNotifications[currentIndex] = {
            ...nextNotifications[currentIndex],
            isRead: true,
        };

        notifications.value = nextNotifications;
    }

    function reset() {
        notifications.value = [];
    }

    return {
        notifications,
        unreadCount,
        setUnreadNotifications,
        addLiveNotification,
        markAsRead,
        reset,
    };
});
