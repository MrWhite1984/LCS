import axiosInstance from '@/utils/axios.js';

function createFallbackId() {
    return `notification-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizeNotification(notification = {}, { isRead = false } = {}) {
    const message = typeof notification.message === 'string' ? notification.message.trim() : '';
    const link = typeof notification.link === 'string' ? notification.link.trim() : '';
    const createdAt = notification.createdAt || new Date().toISOString();

    return {
        id: notification.id || createFallbackId(),
        message,
        link: link || null,
        createdAt,
        isRead,
    };
}

export async function getUnreadNotifications() {
    const response = await axiosInstance.get('/api/notification/unread', {
        headers: {
            accept: 'application/json, text/plain, text/json',
        },
    });

    if (!Array.isArray(response.data)) {
        return [];
    }

    return response.data.map((item) => normalizeNotification(item, { isRead: false }));
}

export function markNotificationAsRead(notificationId) {
    return axiosInstance.put(`/api/notification/${notificationId}/mark-read`);
}

export function resolveNotificationRoute(link) {
    if (typeof link !== 'string' || !link.trim()) {
        return null;
    }

    let normalizedUrl = null;

    try {
        normalizedUrl = new URL(link.trim(), window.location.origin);
    } catch (error) {
        return null;
    }

    if (normalizedUrl.origin !== window.location.origin) {
        return null;
    }

    return `${normalizedUrl.pathname}${normalizedUrl.search}${normalizedUrl.hash}` || '/';
}
