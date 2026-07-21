import { isAuthenticated as isSessionAuthenticated, isLocalAuthBypassActive } from "@/utils/TokenService";

export const isAuthenticated = () => isLocalAuthBypassActive() || isSessionAuthenticated();

export const isLocalAuthBypass = isLocalAuthBypassActive;
