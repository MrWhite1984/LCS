import { applyPrimaryPalette, applySeasonPrimaryTheme } from '@/utils/seasonTheme.js';

const ACCENT_STORAGE_KEY = 'accentTheme';
const DEFAULT_LIGHTNESS_MAP = {
    50: 0.97,
    100: 0.93,
    200: 0.86,
    300: 0.75,
    400: 0.64,
    500: 0.53,
    600: 0.45,
    700: 0.38,
    800: 0.31,
    900: 0.25,
    950: 0.18,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeHex = (value) => {
    if (typeof value !== 'string') return null;

    const trimmed = value.trim().replace(/^#/, '');
    const normalized = trimmed.length === 3
        ? trimmed.split('').map((char) => `${char}${char}`).join('')
        : trimmed;

    return /^[0-9a-fA-F]{6}$/.test(normalized) ? `#${normalized.toLowerCase()}` : null;
};

const hexToRgbObject = (hex) => {
    const normalized = normalizeHex(hex);
    if (!normalized) return null;

    const raw = normalized.slice(1);
    const int = Number.parseInt(raw, 16);

    return {
        r: (int >> 16) & 255,
        g: (int >> 8) & 255,
        b: int & 255,
    };
};

const rgbToHex = ({ r, g, b }) => {
    const toHex = (channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const rgbToHsl = ({ r, g, b }) => {
    const red = r / 255;
    const green = g / 255;
    const blue = b / 255;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const delta = max - min;

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (delta !== 0) {
        s = delta / (1 - Math.abs(2 * l - 1));

        switch (max) {
            case red:
                h = 60 * (((green - blue) / delta) % 6);
                break;
            case green:
                h = 60 * (((blue - red) / delta) + 2);
                break;
            default:
                h = 60 * (((red - green) / delta) + 4);
                break;
        }
    }

    return {
        h: (h + 360) % 360,
        s,
        l,
    };
};

const hueToRgb = (p, q, t) => {
    let value = t;

    if (value < 0) value += 1;
    if (value > 1) value -= 1;
    if (value < 1 / 6) return p + (q - p) * 6 * value;
    if (value < 1 / 2) return q;
    if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
    return p;
};

const hslToRgb = ({ h, s, l }) => {
    const hue = ((h % 360) + 360) % 360 / 360;
    const sat = clamp(s, 0, 1);
    const light = clamp(l, 0, 1);

    if (sat === 0) {
        const gray = Math.round(light * 255);
        return { r: gray, g: gray, b: gray };
    }

    const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
    const p = 2 * light - q;

    return {
        r: Math.round(hueToRgb(p, q, hue + 1 / 3) * 255),
        g: Math.round(hueToRgb(p, q, hue) * 255),
        b: Math.round(hueToRgb(p, q, hue - 1 / 3) * 255),
    };
};

export const buildAccentPalette = (hex) => {
    const normalized = normalizeHex(hex);
    const rgb = hexToRgbObject(normalized);

    if (!rgb) return null;

    const baseHsl = rgbToHsl(rgb);
    const palette = {};

    Object.entries(DEFAULT_LIGHTNESS_MAP).forEach(([shade, lightness]) => {
        const saturationBoost = lightness < baseHsl.l ? 0.03 : -0.04;
        const saturation = clamp(baseHsl.s + saturationBoost, 0.18, 0.92);

        palette[shade] = rgbToHex(
            hslToRgb({
                h: baseHsl.h,
                s: saturation,
                l: lightness,
            }),
        );
    });

    palette[500] = normalized;
    return palette;
};

export const getAccentThemePreference = () => {
    if (typeof localStorage === 'undefined') return null;

    try {
        const raw = localStorage.getItem(ACCENT_STORAGE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        const color = normalizeHex(parsed?.color);

        if (!color) return null;

        return {
            color,
        };
    } catch (error) {
        console.debug('Не удалось прочитать пользовательский акцент:', error);
        return null;
    }
};

export const hasCustomAccentTheme = () => Boolean(getAccentThemePreference());

export const applyAccentTheme = (hex) => {
    const palette = buildAccentPalette(hex);
    if (!palette) return null;

    applyPrimaryPalette(palette);
    document.documentElement.style.setProperty('--accent-editor-color', palette[500], 'important');
    return palette[500];
};

export const saveAccentThemePreference = (hex) => {
    const normalized = applyAccentTheme(hex);
    if (!normalized || typeof localStorage === 'undefined') return null;

    localStorage.setItem(
        ACCENT_STORAGE_KEY,
        JSON.stringify({
            color: normalized,
        }),
    );

    return normalized;
};

export const clearAccentThemePreference = () => {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(ACCENT_STORAGE_KEY);
};

export const syncPrimaryTheme = (season) => {
    const accentPreference = getAccentThemePreference();

    if (accentPreference?.color) {
        applyAccentTheme(accentPreference.color);
        return 'accent';
    }

    applySeasonPrimaryTheme(season);
    if (typeof document !== 'undefined') {
        document.documentElement.style.removeProperty('--accent-editor-color');
    }
    return 'season';
};

export const normalizeAccentHex = normalizeHex;
