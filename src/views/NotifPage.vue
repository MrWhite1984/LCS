<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

import { useNotificationStore } from '@/stores/notifications.js';
import { markNotificationAsRead, resolveNotificationRoute } from '@/api/notifications.js';
import { formatDateRuLongWithTime as formatDate } from '@/utils/date.js';

const notificationStore = useNotificationStore();
const router = useRouter();
const toast = useToast();
const pendingIds = ref([]);

function isPending(notificationId) {
    return pendingIds.value.includes(notificationId);
}

function setPending(notificationId, value) {
    if (value) {
        if (!isPending(notificationId)) {
            pendingIds.value = [...pendingIds.value, notificationId];
        }
        return;
    }

    pendingIds.value = pendingIds.value.filter((item) => item !== notificationId);
}

async function handleNotificationClick(notification) {
    if (!notification?.id || isPending(notification.id)) {
        return;
    }

    const targetRoute = notification.link ? resolveNotificationRoute(notification.link) : null;

    if (!notification.isRead) {
        setPending(notification.id, true);

        try {
            await markNotificationAsRead(notification.id);
            notificationStore.markAsRead(notification.id);
        } catch (error) {
            console.error('Не удалось отметить уведомление прочитанным:', error);
            toast.add({
                severity: 'error',
                summary: 'Уведомления',
                detail: 'Не удалось отметить уведомление прочитанным.',
                life: 4000,
            });
            setPending(notification.id, false);
            return;
        }

        setPending(notification.id, false);
    }

    if (targetRoute) {
        await router.push(targetRoute);
    }
}
</script>

<template>
    <main>
        <div class="content-wrap">
            <h2>Уведомления</h2>

            <div v-if="notificationStore.notifications.length === 0" class="empty-state">
                Уведомлений пока нет.
            </div>

            <div v-else class="notifications-list">
                <article
                    v-for="notification in notificationStore.notifications"
                    :key="notification.id"
                    class="notification-card"
                    :class="{
                        unread: !notification.isRead,
                        pending: isPending(notification.id),
                        clickable: !isPending(notification.id),
                    }"
                    role="button"
                    tabindex="0"
                    @click="handleNotificationClick(notification)"
                    @keydown.enter.prevent="handleNotificationClick(notification)"
                    @keydown.space.prevent="handleNotificationClick(notification)"
                >
                    <div class="notification-header">
                        <span class="notification-status">
                            {{ notification.isRead ? 'Прочитано' : 'Новое' }}
                        </span>
                        <span class="notification-timestamp">
                            {{ formatDate(notification.createdAt) }}
                        </span>
                    </div>

                    <p class="notification-message">
                        {{ notification.message }}
                    </p>

                    <div class="notification-actions">
                        <span v-if="notification.link" class="notification-link">
                            {{ notification.link }}
                        </span>

                        <Button
                            v-if="notification.link"
                            label="Перейти"
                            text
                            size="small"
                            :loading="isPending(notification.id)"
                            @click.stop="handleNotificationClick(notification)"
                        />
                    </div>
                </article>
            </div>
        </div>
    </main>
</template>

<style scoped>
main {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
}

.content-wrap {
    flex-grow: 1;
    padding: 20px 8rem;
    color: var(--p-text-color);
    transition: all 0.5s;
}

h2 {
    margin-bottom: 20px;
    font-size: 2rem;
    color: var(--p-text-color);
    transition: all 0.5s;
}

.empty-state {
    padding: 24px;
    border-radius: 16px;
    background: rgba(var(--p-blue-500-rgb), 0.06);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
    color: var(--p-text-color);
}

.notifications-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.notification-card {
    background-color: var(--p-grey-7);
    border-radius: 12px;
    padding: 18px;
    border: 1px solid transparent;
    transition: all 0.3s ease;
}

.notification-card.clickable {
    cursor: pointer;
}

.notification-card.clickable:hover {
    transform: translateY(-1px);
    border-color: rgba(var(--p-blue-500-rgb), 0.22);
}

.notification-card.unread {
    border-color: rgba(var(--p-blue-500-rgb), 0.35);
    box-shadow: 0 0 0 1px rgba(var(--p-blue-500-rgb), 0.12);
}

.notification-card.pending {
    opacity: 0.7;
}

.notification-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
    margin-bottom: 12px;
}

.notification-status {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(var(--p-blue-500-rgb), 0.1);
    color: var(--p-blue-400);
    font-weight: 600;
    font-size: 0.9rem;
}

.notification-timestamp {
    font-size: 0.9rem;
    color: var(--p-grey-1);
    transition: all 0.5s;
}

.notification-message {
    margin: 0;
    font-size: 1rem;
    color: var(--p-text-color);
    line-height: 1.5;
}

.notification-actions {
    margin-top: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.notification-link {
    color: var(--p-blue-400);
    font-size: 0.95rem;
    word-break: break-word;
}

@media (max-width: 1024px) {
    .content-wrap {
        padding: 20px 2rem;
    }
}

@media (max-width: 640px) {
    .content-wrap {
        padding: 16px 1rem;
    }

    .notification-header,
    .notification-actions {
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>
