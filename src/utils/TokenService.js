import TokenWorker from "@/workers/tokenWorker?worker";
import { getBaseUrl } from "./baseUrl";

let tokenWorker = null;
let refreshPromise = null;
let bootstrapPromise = null;

let isSessionExpired = false;
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_ID_KEY = "userId";
const REFRESH_TOKEN_EXPIRED_KEY = "refreshTokenExpired";

const LOCALHOST_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]'];

export const isLocalAuthBypassActive = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const hostname = window.location.hostname;
  const bypassEnv = import.meta.env.VITE_BYPASS_AUTH === 'true';
  return bypassEnv || LOCALHOST_HOSTNAMES.includes(hostname);
};

// Пользовательские ключи, которые пишут другие модули; чистим их вместе с токенами,
// чтобы после выхода в браузере не оставалось данных предыдущего пользователя
const USER_SCOPED_STORAGE_KEYS = [
    "firstName",
    "InfraStatus",
    "infraManagerUserId",
    "projectShowcaseUserId",
];

const authSession = {
    accessToken: null,
    accessTokenExpired: 0,
    refreshToken: null,
    refreshTokenExpired: 0,
    userId: null,
};

function nowSec() {
    return Math.floor(Date.now() / 1000);
}

function resolveAccessTokenExpired(data = {}) {
    if (Number.isFinite(Number(data.accessTokenExpired))) {
        return Number(data.accessTokenExpired);
    }

    const expiresIn = Number(data.accessTokenExpiresIn);
    if (Number.isFinite(expiresIn) && expiresIn > 0) {
        return nowSec() + expiresIn;
    }

    return nowSec() + 15 * 60;
}

function hydrateRefreshSessionFromStorage() {
    if (!authSession.refreshToken) {
        authSession.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    }

    if (!authSession.userId) {
        authSession.userId = localStorage.getItem(USER_ID_KEY);
    }

    if (!authSession.refreshTokenExpired) {
        authSession.refreshTokenExpired = Number(localStorage.getItem(REFRESH_TOKEN_EXPIRED_KEY)) || 0;
    }
}

export function markSessionExpired() {
    isSessionExpired = true;
}

export function isSessionExpiredFlag() {
    return isSessionExpired;
}

export function resetSessionFlags() {
    isSessionExpired = false;
}

export function saveAuthData({
    accessToken,
    userId,
    refreshToken,
    refreshTokenValue,
    refreshTokenExpired,
    accessTokenExpired,
    accessTokenExpiresIn,
}) {
    if (!accessToken) return;

    resetSessionFlags();

    authSession.accessToken = accessToken;
    authSession.userId = userId ?? authSession.userId;
    authSession.refreshToken = refreshTokenValue ?? refreshToken ?? authSession.refreshToken;
    authSession.refreshTokenExpired = Number(refreshTokenExpired) || authSession.refreshTokenExpired;
    authSession.accessTokenExpired = resolveAccessTokenExpired({
        accessTokenExpired,
        accessTokenExpiresIn,
    });

    if (authSession.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, authSession.refreshToken);
    }
    if (authSession.userId) {
        localStorage.setItem(USER_ID_KEY, String(authSession.userId));
    }
    if (authSession.refreshTokenExpired) {
        localStorage.setItem(REFRESH_TOKEN_EXPIRED_KEY, String(authSession.refreshTokenExpired));
    }

    tokenWorker?.postMessage({
        action: "updateToken",
        userId: authSession.userId,
        refreshToken: authSession.refreshToken,
        accessTokenExpired: authSession.accessTokenExpired,
        apiBase: getBaseUrl(),
    });
}

export function clearAuthData({ redirectToAuth = false } = {}) {
    authSession.accessToken = null;
    authSession.accessTokenExpired = 0;
    authSession.refreshToken = null;
    authSession.refreshTokenExpired = 0;
    authSession.userId = null;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(REFRESH_TOKEN_EXPIRED_KEY);

    for (const key of USER_SCOPED_STORAGE_KEYS) {
        localStorage.removeItem(key);
    }

    sessionStorage.removeItem("codeVerifier");

    stopTokenWorker();
    markSessionExpired();

    if (redirectToAuth && typeof window !== "undefined") {
        window.location.href = "/auth";
    }
}

export function setSessionUserId(userId) {
    authSession.userId = userId || null;
    if (authSession.userId) {
        localStorage.setItem(USER_ID_KEY, String(authSession.userId));
    }
}

export function getSessionUserId() {
    hydrateRefreshSessionFromStorage();
    return authSession.userId;
}

export function startTokenWorker() {
    hydrateRefreshSessionFromStorage();

    if (tokenWorker) return;
    if (!authSession.accessToken || !authSession.accessTokenExpired) return;
    if (!authSession.refreshToken || !authSession.userId) return;

    resetSessionFlags();

    tokenWorker = new TokenWorker();

    tokenWorker.postMessage({
        action: "start",
        userId: authSession.userId,
        refreshToken: authSession.refreshToken,
        accessTokenExpired: authSession.accessTokenExpired,
        apiBase: getBaseUrl(),
    });

    tokenWorker.onmessage = (event) => {
        const { action } = event.data;

        if (action === "updateToken") {
            saveAuthData(event.data);

            if (refreshPromise) {
                refreshPromise.resolve(event.data.accessToken);
                refreshPromise = null;
            }
        }

        if (action === "refreshFailed") {
            console.error("[TokenService] refreshFailed:", event.data);
            clearAuthData({ redirectToAuth: true });

            refreshPromise?.reject(new Error("Refresh failed"));
            refreshPromise = null;
        }

        if (action === "refreshError") {
            console.warn("[TokenService] refreshError:", event.data);
            refreshPromise?.reject(
                new Error(event.data.reason || "Refresh error")
            );
            refreshPromise = null;
        }
    };

    tokenWorker.onerror = (err) => {
        console.error("[TokenService] Worker crashed:", err);
        clearAuthData({ redirectToAuth: true });
    };
}

export function stopTokenWorker() {
    if (!tokenWorker) return;
    tokenWorker.postMessage({ action: "stop" });
    tokenWorker.terminate();
    tokenWorker = null;
}

export function getAccessToken() {
    const token = authSession.accessToken;
    const expired = Number(authSession.accessTokenExpired);

    if (!token || !expired) return null;
    if (nowSec() >= expired - 60) return null;

    return token;
}

export function isAuthenticated() {
    return !!getAccessToken() && !isSessionExpiredFlag();
}

export function refreshTokenThroughWorker() {
    hydrateRefreshSessionFromStorage();

    if (refreshPromise) return refreshPromise.promise;

    refreshPromise = {};
    refreshPromise.promise = new Promise((resolve, reject) => {
        refreshPromise.resolve = resolve;
        refreshPromise.reject = reject;
    });

    if (!authSession.refreshToken || !authSession.userId) {
        refreshPromise.reject(new Error("No refresh token"));
        refreshPromise = null;
        return Promise.reject(new Error("No refresh token"));
    }

    const tempWorker = new TokenWorker();

    const timeout = setTimeout(() => {
        tempWorker.terminate();
        refreshPromise?.reject(new Error("Refresh timeout"));
        refreshPromise = null;
    }, 15_000);

    tempWorker.onmessage = (event) => {
        clearTimeout(timeout);

        if (event.data.action === "updateToken" && event.data.accessToken) {
            saveAuthData(event.data);
            refreshPromise.resolve(event.data.accessToken);
        } else {
            refreshPromise.reject(new Error("Refresh failed"));
        }

        refreshPromise = null;
        tempWorker.terminate();
    };

    tempWorker.onerror = () => {
        clearTimeout(timeout);
        refreshPromise?.reject(new Error("Worker error"));
        refreshPromise = null;
        tempWorker.terminate();
    };

    tempWorker.postMessage({
        action: "refreshOnce",
        refreshToken: authSession.refreshToken,
        userId: authSession.userId,
        apiBase: getBaseUrl(),
    });

    return refreshPromise.promise;
}

export async function ensureAuthSession() {
    hydrateRefreshSessionFromStorage();

    if (isAuthenticated()) return true;
    if (isSessionExpiredFlag()) return false;
    if (!authSession.refreshToken || !authSession.userId) return false;

    if (!bootstrapPromise) {
        bootstrapPromise = refreshTokenThroughWorker()
            .then(() => {
                startTokenWorker();
                return true;
            })
            .catch(() => {
                markSessionExpired();
                return false;
            })
            .finally(() => {
                bootstrapPromise = null;
            });
    }

    return bootstrapPromise;
}
