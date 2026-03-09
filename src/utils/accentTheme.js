import { applyPrimaryPalette, applySeasonPrimaryTheme } from '@/utils/seasonTheme.js';

const ACCENT_STORAGE_KEY = 'accentTheme';
const DEFAULT_STATE_DELTA = 50;
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
const normalizeStateDelta = (value) => {
    const numeric = Number(value);
    return clamp(Number.isFinite(numeric) ? Math.round(numeric) : DEFAULT_STATE_DELTA, 0, 100);
};

const parseCssColor = (value) => {
    if (typeof value !== 'string') return null;
    const raw = value.trim();
    if (!raw) return null;

    const hex = normalizeHex(raw);
    if (hex) {
        const rgb = hexToRgbObject(hex);
        return rgb ? { ...rgb, a: 1 } : null;
    }

    const rgbMatch = raw.match(/^rgba?\(([^)]+)\)$/i);
    if (!rgbMatch) return null;
    const parts = rgbMatch[1].split(',').map((part) => Number.parseFloat(part.trim()));
    if (parts.length < 3 || parts.some((part, index) => index < 3 && !Number.isFinite(part))) {
        return null;
    }

    return {
        r: clamp(parts[0], 0, 255),
        g: clamp(parts[1], 0, 255),
        b: clamp(parts[2], 0, 255),
        a: clamp(Number.isFinite(parts[3]) ? parts[3] : 1, 0, 1),
    };
};

const relativeLuminance = ({ r, g, b }) => {
    const normalizeChannel = (channel) => {
        const value = clamp(channel, 0, 255) / 255;
        return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    };

    const red = normalizeChannel(r);
    const green = normalizeChannel(g);
    const blue = normalizeChannel(b);
    return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
};

const getContrastRatio = (a, b) => {
    const first = relativeLuminance(a);
    const second = relativeLuminance(b);
    const lighter = Math.max(first, second);
    const darker = Math.min(first, second);
    return (lighter + 0.1) / (darker + 0.1);
};

const resolveCssColor = (styles, value, depth = 0) => {
    if (depth > 6 || typeof value !== 'string') return null;
    const raw = value.trim();
    if (!raw) return null;

    const parsed = parseCssColor(raw);
    if (parsed) return parsed;

    const varMatch = raw.match(/^var\(\s*(--[^,\s)]+)\s*(?:,\s*([^)]+))?\)$/i);
    if (!varMatch) return null;

    const varName = varMatch[1];
    const fallbackRaw = varMatch[2]?.trim() ?? '';
    const fromVar = styles.getPropertyValue(varName).trim();

    if (fromVar) {
        const resolvedFromVar = resolveCssColor(styles, fromVar, depth + 1);
        if (resolvedFromVar) return resolvedFromVar;
    }

    return fallbackRaw ? resolveCssColor(styles, fallbackRaw, depth + 1) : null;
};

const chooseBestTextColor = (background) => {
    const dark = { r: 17, g: 24, b: 39 };
    const light = { r: 245, g: 247, b: 255 };
    const darkContrast = getContrastRatio(background, dark);
    const lightContrast = getContrastRatio(background, light);
    return lightContrast >= darkContrast ? light : dark;
};

const chooseAccessibleBWTextColor = (background, minContrast = 4.5) => {
    const light = { r: 255, g: 255, b: 255 };
    const dark = { r: 0, g: 0, b: 0 };
    const lightContrast = getContrastRatio(background, light);
    const darkContrast = getContrastRatio(background, dark);

    if (lightContrast >= minContrast && darkContrast >= minContrast) {
        return lightContrast >= darkContrast ? light : dark;
    }
    if (lightContrast >= minContrast) return light;
    if (darkContrast >= minContrast) return dark;
    return lightContrast >= darkContrast ? light : dark;
};

const mixRgb = (from, to, amount) => {
    const t = clamp(amount, 0, 1);
    return {
        r: Math.round(from.r + ((to.r - from.r) * t)),
        g: Math.round(from.g + ((to.g - from.g) * t)),
        b: Math.round(from.b + ((to.b - from.b) * t)),
    };
};

const toRgbCss = ({ r, g, b }) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
const toRgbChannels = ({ r, g, b }) => `${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}`;

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

const paletteColorToRgb = (palette, shade, fallbackShade = 500) => {
    const color = hexToRgbObject(palette?.[shade]) ?? hexToRgbObject(palette?.[fallbackShade]);
    return color ?? { r: 68, g: 143, b: 255 };
};

const applyStateDelta = (palette, stateDelta = DEFAULT_STATE_DELTA) => {
    if (typeof document === 'undefined' || !palette) return;
    const root = document.documentElement;
    const isDarkMode = root.classList.contains('p-dark');
    const t = normalizeStateDelta(stateDelta) / 100;

    const primary500 = paletteColorToRgb(palette, 500);
    const primary700 = paletteColorToRgb(palette, 700);
    const primary900 = paletteColorToRgb(palette, 900);
    const primary950 = paletteColorToRgb(palette, 950);

    const hover = mixRgb(primary500, primary700, 0.12 + (0.63 * t));
    const active = mixRgb(primary500, primary900, 0.2 + (0.72 * t));

    const buttonBase = isDarkMode ? primary700 : primary500;
    const buttonHoverTarget = isDarkMode ? primary900 : primary700;
    const buttonActiveTarget = isDarkMode ? primary950 : primary900;
    const buttonHover = mixRgb(buttonBase, buttonHoverTarget, 0.14 + (0.62 * t));
    const buttonActive = mixRgb(buttonBase, buttonActiveTarget, 0.24 + (0.68 * t));

    root.style.setProperty('--p-primary-hover-color', rgbToHex(hover), 'important');
    root.style.setProperty('--p-primary-active-color', rgbToHex(active), 'important');
    root.style.setProperty('--p-button-primary-background', rgbToHex(buttonBase), 'important');
    root.style.setProperty('--p-button-primary-hover-background', rgbToHex(buttonHover), 'important');
    root.style.setProperty('--p-button-primary-active-background', rgbToHex(buttonActive), 'important');
    root.style.setProperty('--accent-state-delta', String(normalizeStateDelta(stateDelta)), 'important');
};

const clearStateDeltaOverrides = () => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.removeProperty('--p-button-primary-background');
    root.style.removeProperty('--p-button-primary-hover-background');
    root.style.removeProperty('--p-button-primary-active-background');
    root.style.removeProperty('--accent-state-delta');
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
            stateDelta: normalizeStateDelta(parsed?.stateDelta),
        };
    } catch (error) {
        console.debug('Не удалось прочитать пользовательский акцент:', error);
        return null;
    }
};

export const hasCustomAccentTheme = () => Boolean(getAccentThemePreference());

export const applySmartTextContrast = () => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    const isDarkMode = root.classList.contains('p-dark');

    const bg = resolveCssColor(styles, styles.getPropertyValue('--p-bg-color-1')) ?? { r: 255, g: 255, b: 255, a: 1 };
    const primary = resolveCssColor(styles, styles.getPropertyValue('--p-primary-500')) ?? { r: 68, g: 143, b: 255, a: 1 };
    const primaryButtonBg = resolveCssColor(styles, styles.getPropertyValue('--p-button-primary-background')) ?? primary;
    const primaryButtonHoverBg = resolveCssColor(styles, styles.getPropertyValue('--p-button-primary-hover-background'))
        ?? resolveCssColor(styles, styles.getPropertyValue('--p-primary-hover-color'))
        ?? primaryButtonBg;
    const primaryButtonActiveBg = resolveCssColor(styles, styles.getPropertyValue('--p-button-primary-active-background'))
        ?? resolveCssColor(styles, styles.getPropertyValue('--p-primary-active-color'))
        ?? primaryButtonHoverBg;

    const autoText = chooseBestTextColor(bg);
    const text = isDarkMode
        ? mixRgb(autoText, { r: 245, g: 247, b: 255 }, 0.88)
        : autoText;
    const secondary = isDarkMode ? mixRgb(text, bg, 0.28) : mixRgb(text, bg, 0.34);
    const muted = isDarkMode ? mixRgb(text, bg, 0.44) : mixRgb(text, bg, 0.52);
    const primaryContrast = chooseBestTextColor(primary);
    const primaryButtonContrast = chooseAccessibleBWTextColor(primaryButtonBg);
    const primaryButtonHoverContrast = chooseAccessibleBWTextColor(primaryButtonHoverBg);
    const primaryButtonActiveContrast = chooseAccessibleBWTextColor(primaryButtonActiveBg);

    root.style.setProperty('--p-text-color', toRgbCss(text), 'important');
    root.style.setProperty('--p-text-color-secondary', toRgbCss(secondary), 'important');
    root.style.setProperty('--p-text-secondary-color', toRgbCss(secondary), 'important');
    root.style.setProperty('--p-text-secondary', toRgbCss(secondary), 'important');
    root.style.setProperty('--p-text-muted-color', toRgbCss(muted), 'important');
    root.style.setProperty('--p-dialog-color', toRgbCss(text), 'important');
    root.style.setProperty('--p-color-icon-menu', toRgbChannels(text), 'important');
    root.style.setProperty('--p-primary-contrast-color', toRgbCss(primaryContrast), 'important');
    root.style.setProperty('--p-button-primary-color', toRgbCss(primaryButtonContrast), 'important');
    root.style.setProperty('--p-button-primary-hover-color', toRgbCss(primaryButtonHoverContrast), 'important');
    root.style.setProperty('--p-button-primary-active-color', toRgbCss(primaryButtonActiveContrast), 'important');
};

export const applyAccentTheme = (hex, options = {}) => {
    const stateDelta = normalizeStateDelta(options?.stateDelta);
    const palette = buildAccentPalette(hex);
    if (!palette) return null;

    applyPrimaryPalette(palette);
    applyStateDelta(palette, stateDelta);
    document.documentElement.style.setProperty('--accent-editor-color', palette[500], 'important');
    applySmartTextContrast();
    return palette[500];
};

export const saveAccentThemePreference = (hex, options = {}) => {
    const stateDelta = normalizeStateDelta(options?.stateDelta);
    const normalized = applyAccentTheme(hex, { stateDelta });
    if (!normalized || typeof localStorage === 'undefined') return null;

    localStorage.setItem(
        ACCENT_STORAGE_KEY,
        JSON.stringify({
            color: normalized,
            stateDelta,
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
        applyAccentTheme(accentPreference.color, { stateDelta: accentPreference.stateDelta });
        applySmartTextContrast();
        return 'accent';
    }

    applySeasonPrimaryTheme(season);
    if (typeof document !== 'undefined') {
        document.documentElement.style.removeProperty('--accent-editor-color');
    }
    clearStateDeltaOverrides();
    applySmartTextContrast();
    return 'season';
};

export const refreshAccentForThemeChange = () => {
    const accentPreference = getAccentThemePreference();
    if (accentPreference?.color) {
        applyAccentTheme(accentPreference.color, { stateDelta: accentPreference.stateDelta });
        return 'accent';
    }
    applySmartTextContrast();
    return 'season';
};

export const normalizeAccentHex = normalizeHex;
