<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

import { useNotificationStore } from '@/stores/notifications.js';
import { markNotificationAsRead, resolveNotificationRoute } from '@/api/notifications.js';
import { formatDateRuLongWithTime as formatDate } from '@/utils/date.js';

const emit = defineEmits(['navigate']);

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

function getTargetRoute(notification) {
    return notification?.link ? resolveNotificationRoute(notification.link) : null;
}

function isInteractive(notification) {
    if (!notification?.id || isPending(notification.id)) {
        return false;
    }

    return !notification.isRead || Boolean(getTargetRoute(notification));
}

async function handleNotificationClick(notification) {
    if (!notification?.id || isPending(notification.id)) {
        return;
    }

    const targetRoute = getTargetRoute(notification);

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
        emit('navigate', notification);
    }
}
</script>

<template>
    <section class="notifications-panel" aria-label="Уведомления">
        <header class="notifications-panel-header">
            <div class="notifications-panel-copy">
                <div class="notifications-panel-pill">
                    <i class="pi pi-bell"></i>
                    <span>Центр уведомлений</span>
                </div>
            </div>

            <Badge
                v-if="notificationStore.unreadCount > 0"
                :value="notificationStore.unreadCount"
                severity="danger"
                class="notifications-panel-badge"
            />
        </header>

        <div v-if="notificationStore.notifications.length === 0" class="notifications-empty-state">
            <div class="notifications-empty-icon">
                <i class="pi pi-inbox"></i>
            </div>
            <div class="notifications-empty-copy">
                <strong>Пока тихо</strong>
                <span>Новые уведомления появятся здесь.</span>
            </div>
        </div>

        <div v-else class="notifications-stack">
            <article
                v-for="notification in notificationStore.notifications"
                :key="notification.id"
                class="notification-card"
                :class="{
                    unread: !notification.isRead,
                    pending: isPending(notification.id),
                    clickable: isInteractive(notification),
                }"
                :role="isInteractive(notification) ? 'button' : undefined"
                :tabindex="isInteractive(notification) ? 0 : -1"
                @click="handleNotificationClick(notification)"
                @keydown.enter.prevent="handleNotificationClick(notification)"
                @keydown.space.prevent="handleNotificationClick(notification)"
            >
                <div class="notification-card-glow"></div>

                <div class="notification-card-header">
                    <span class="notification-status">
                        <span class="notification-status-dot"></span>
                        {{ notification.isRead ? 'Прочитано' : 'Новое' }}
                    </span>

                    <span class="notification-timestamp">
                        {{ formatDate(notification.createdAt) }}
                    </span>
                </div>

                <p class="notification-message">
                    {{ notification.message || 'Получено новое уведомление.' }}
                </p>

                <div class="notification-meta">
                    <span v-if="getTargetRoute(notification)" class="notification-chip">
                        Открыть
                        <i class="pi pi-arrow-up-right"></i>
                    </span>
                    <span v-else-if="!notification.isRead" class="notification-chip notification-chip-muted">
                        Нажмите, чтобы отметить
                    </span>
                </div>
            </article>
        </div>
    </section>
</template>

<style scoped>
.notifications-panel {
    --notification-card-height: 10.75rem;
    --notification-card-gap: 0.75rem;
    width: min(26rem, calc(100vw - 1.5rem));
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    background: transparent;
}

.notifications-panel-header {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 0 0.15rem;
}

.notifications-panel-copy {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    align-items: center;
}

.notifications-panel-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.16);
    background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.86), rgba(242, 246, 255, 0.72));
    color: rgb(57, 88, 138);
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    box-shadow:
        0 12px 28px rgba(15, 23, 42, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.notifications-panel-pill .pi {
    font-size: 0.78rem;
}

.p-dark .notifications-panel-pill {
    border-color: rgba(255, 255, 255, 0.1);
    background:
        linear-gradient(180deg, rgba(54, 62, 79, 0.9), rgba(36, 41, 53, 0.82));
    color: rgba(230, 239, 255, 0.96);
    box-shadow:
        0 14px 30px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.notifications-panel-copy h3 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--p-text-color);
}

.notifications-panel-badge {
    position: absolute;
    right: 0.15rem;
    top: 50%;
    transform: translateY(-50%);
    flex-shrink: 0;
    margin-left: 0;
}

.notifications-empty-state {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    padding: 1rem 1.1rem;
    border-radius: 22px;
    background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.58));
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.14);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 16px 34px rgba(15, 23, 42, 0.12);
}

.p-dark .notifications-empty-state {
    background:
        linear-gradient(180deg, rgba(28, 28, 30, 0.88), rgba(44, 44, 46, 0.74));
    box-shadow: 0 18px 36px rgba(0, 0, 0, 0.28);
}

.notifications-empty-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.9rem;
    height: 2.9rem;
    border-radius: 18px;
    background: rgba(var(--p-blue-500-rgb), 0.12);
    color: var(--p-blue-400);
    font-size: 1.05rem;
}

.notifications-empty-copy {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.notifications-empty-copy strong {
    color: var(--p-text-color);
    font-size: 0.98rem;
}

.notifications-empty-copy span {
    color: var(--p-grey-1);
    font-size: 0.9rem;
}

.notifications-stack {
    position: relative;
    z-index: 1;
    max-height: calc((var(--notification-card-height) * 2) + 1rem);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--notification-card-gap);
    padding: 0.2rem;
    overscroll-behavior: contain;
    scrollbar-width: none;
}

.notifications-stack::-webkit-scrollbar {
    display: none;
}

.notification-card {
    position: relative;
    overflow: hidden;
    min-height: var(--notification-card-height);
    padding: 1rem 1.05rem;
    border-radius: 22px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.1);
    background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(246, 247, 251, 0.72));
    box-shadow:
        0 14px 30px rgba(15, 23, 42, 0.12),
        inset 0 1px 0 rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    transition:
        border-color 0.22s ease,
        box-shadow 0.22s ease,
        opacity 0.22s ease,
        transform 0.22s ease;
}

.p-dark .notification-card {
    background:
        linear-gradient(180deg, rgba(28, 28, 30, 0.92), rgba(44, 44, 46, 0.82));
    box-shadow:
        0 18px 36px rgba(0, 0, 0, 0.28),
        inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.notification-card.clickable {
    cursor: pointer;
}

.notification-card.clickable:hover {
    z-index: 3;
    transform: translateY(-2px);
    border-color: rgba(var(--p-blue-500-rgb), 0.26);
    box-shadow:
        0 20px 42px rgba(15, 23, 42, 0.16),
        inset 0 1px 0 rgba(255, 255, 255, 0.55);
}

.p-dark .notification-card.clickable:hover {
    box-shadow:
        0 22px 42px rgba(0, 0, 0, 0.36),
        inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.notification-card.unread {
    border-color: rgba(var(--p-blue-500-rgb), 0.26);
}

.notification-card.pending {
    opacity: 0.72;
}

.notification-card-glow {
    position: absolute;
    inset: auto -2rem -3rem auto;
    width: 7rem;
    height: 7rem;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(var(--p-blue-500-rgb), 0.18) 0%, rgba(var(--p-blue-500-rgb), 0) 72%);
    pointer-events: none;
}

.notification-card-header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    margin-bottom: 0.7rem;
}

.notification-status {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    min-height: 1.9rem;
    padding: 0.38rem 0.72rem;
    border-radius: 999px;
    background: rgba(var(--p-blue-500-rgb), 0.1);
    color: var(--p-blue-400);
    font-size: 0.84rem;
    font-weight: 700;
}

.notification-status-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 0 0.2rem rgba(var(--p-blue-500-rgb), 0.12);
}

.notification-timestamp {
    flex-shrink: 0;
    color: var(--p-grey-1);
    font-size: 0.82rem;
    text-align: right;
}

.notification-message {
    position: relative;
    margin: 0;
    color: var(--p-text-color);
    font-size: 0.96rem;
    line-height: 1.55;
    word-break: break-word;
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
}

.notification-meta {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-top: 0.85rem;
}

.notification-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.34rem 0.68rem;
    border-radius: 999px;
    background: rgba(var(--p-blue-500-rgb), 0.1);
    color: var(--p-blue-400);
    font-size: 0.8rem;
    font-weight: 600;
}

.notification-chip-muted {
    color: var(--p-grey-1);
    background: rgba(142, 142, 147, 0.1);
}

@media (max-width: 640px) {
    .notifications-panel {
        width: min(100vw - 1rem, 24rem);
        --notification-card-height: 11.5rem;
    }

    .notification-card-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .notification-timestamp {
        text-align: left;
    }
}
</style>
