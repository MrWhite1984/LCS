import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';

import { getBaseUrl } from '@/utils/baseUrl.js';
import { getAccessToken } from '@/utils/TokenService.js';

let connection = null;
let startPromise = null;
let receiveNotificationHandler = null;

function createConnection() {
    return new HubConnectionBuilder()
        .withUrl(`${getBaseUrl()}/hubs/notifications`, {
            accessTokenFactory: () => getAccessToken() || '',
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Error)
        .build();
}

export async function connectNotificationsHub(onReceiveNotification) {
    if (typeof onReceiveNotification !== 'function') {
        throw new TypeError('Notification handler must be a function');
    }

    if (!connection) {
        connection = createConnection();
    }

    if (receiveNotificationHandler) {
        connection.off('ReceiveNotification', receiveNotificationHandler);
    }

    receiveNotificationHandler = (payload) => {
        onReceiveNotification(payload);
    };

    connection.on('ReceiveNotification', receiveNotificationHandler);

    if (connection.state === HubConnectionState.Connected) {
        return connection;
    }

    if (!startPromise) {
        startPromise = connection.start().finally(() => {
            startPromise = null;
        });
    }

    await startPromise;

    return connection;
}

export async function disconnectNotificationsHub() {
    if (!connection) {
        return;
    }

    if (receiveNotificationHandler) {
        connection.off('ReceiveNotification', receiveNotificationHandler);
        receiveNotificationHandler = null;
    }

    const activeConnection = connection;
    connection = null;
    startPromise = null;

    if (activeConnection.state === HubConnectionState.Disconnected) {
        return;
    }

    await activeConnection.stop();
}
