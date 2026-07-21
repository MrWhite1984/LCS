import axios from "axios";
import router from "../router";
import {
    refreshTokenThroughWorker,
    getAccessToken,
    markSessionExpired,
    clearAuthData,
    isLocalAuthBypassActive,
} from "@/utils/TokenService";
import { getBaseUrl } from './baseUrl';
import { isSessionExpiredFlag } from "./TokenService";

const axiosInstance = axios.create({
    baseURL: getBaseUrl(),
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
        accept: "application/json",
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = getAccessToken();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

let isRefreshing = false;
let refreshQueue = [];

function enqueueRequest(cb) {
    refreshQueue.push(cb);
}

function resolveQueue(token) {
    refreshQueue.forEach((cb) => cb(token));
    refreshQueue = [];
}

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !isSessionExpiredFlag()
        ) {
            if (isLocalAuthBypassActive()) {
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    enqueueRequest((token) => {
                        if (!token) {
                            reject(error);
                            return;
                        }

                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(axiosInstance(originalRequest));
                    });
                });
            }

            isRefreshing = true;

            try {
                console.debug("[Axios] 401 received → refreshing token");
                const newAccessToken = await refreshTokenThroughWorker();

                if (!newAccessToken) throw new Error("No token");

                resolveQueue(newAccessToken);

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                console.error("[Axios] Token refresh failed", refreshError);
                markSessionExpired();
                clearAuthData();
                resolveQueue(null);
                isRefreshing = false;
                if (router.currentRoute.value.path !== "/auth") {
                    router.replace("/auth");
                }

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
