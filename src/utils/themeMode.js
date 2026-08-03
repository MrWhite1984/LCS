import { refreshAccentForThemeChange } from '@/utils/accentTheme.js';

export const supportedThemeModes = ['light', 'dark', 'auto'];

export const getAutoThemeMode = () => {
    const hour = new Date().getHours();
    return hour >= 18 || hour < 6 ? 'dark' : 'light';
};

export const getSavedThemeMode = () => {
    if (typeof window === 'undefined') return 'auto';

    const savedTheme = localStorage.getItem('theme');
    return supportedThemeModes.includes(savedTheme) ? savedTheme : 'auto';
};

export const applyThemeMode = (theme = getSavedThemeMode()) => {
    if (typeof document === 'undefined') return;

    const resolvedTheme = theme === 'auto' ? getAutoThemeMode() : theme;
    document.documentElement.classList.toggle('p-dark', resolvedTheme === 'dark');
    refreshAccentForThemeChange();
};

export const initializeThemeMode = () => applyThemeMode(getSavedThemeMode());
