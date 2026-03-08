export const SEASON_PALETTES = {
    winter: {
        50: '#eef6ff',
        100: '#d8eaff',
        200: '#b8d8ff',
        300: '#8fc0ff',
        400: '#64a5ff',
        500: '#448fff',
        600: '#3272db',
        700: '#285ab0',
        800: '#244f91',
        900: '#23457a',
        950: '#172b4c',
    },
    spring: {
        50: '#edfcf4',
        100: '#d4f7e3',
        200: '#aeeccc',
        300: '#7fddb0',
        400: '#4dc791',
        500: '#2ead79',
        600: '#228f63',
        700: '#1d7251',
        800: '#1a5b43',
        900: '#174c38',
        950: '#0a2c20',
    },
    summer: {
        50: '#fff8e8',
        100: '#ffefc2',
        200: '#ffe08a',
        300: '#ffd24f',
        400: '#ffc027',
        500: '#f0aa12',
        600: '#d58b0b',
        700: '#ad6a0e',
        800: '#8d5413',
        900: '#744614',
        950: '#422507',
    },
    autumn: {
        50: '#fff5ec',
        100: '#ffe8d3',
        200: '#ffd0a6',
        300: '#ffb16e',
        400: '#ff8a3d',
        500: '#f46b1e',
        600: '#e55314',
        700: '#be3f13',
        800: '#973417',
        900: '#7a2d16',
        950: '#421407',
    },
};

export const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

export const sanitizeSeason = (season) => {
    if (season && Object.prototype.hasOwnProperty.call(SEASON_PALETTES, season)) {
        return season;
    }
    return 'winter';
};

export const hexToRgb = (hex) => {
    const normalized = hex.replace('#', '');
    const value = normalized.length === 3
        ? normalized.split('').map((char) => char + char).join('')
        : normalized;

    const int = Number.parseInt(value, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `${r}, ${g}, ${b}`;
};

export const applyPrimaryPalette = (palette) => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    SHADES.forEach((shade) => {
        const color = palette[shade];
        root.style.setProperty(`--p-primary-${shade}`, color, 'important');
        root.style.setProperty(`--p-primary-${shade}-rgb`, hexToRgb(color), 'important');
        root.style.setProperty(`--p-blue-${shade}`, color, 'important');
    });

    root.style.setProperty('--p-primary-color', palette[500], 'important');
    root.style.setProperty('--p-primary-color-rgb', hexToRgb(palette[500]), 'important');
    root.style.setProperty('--p-primary-hover-color', palette[600], 'important');
    root.style.setProperty('--p-primary-active-color', palette[700], 'important');
    root.style.setProperty('--p-primary-contrast-color', '#ffffff', 'important');

    root.style.setProperty('--p-blue-500-rgb', hexToRgb(palette[500]), 'important');
    root.style.setProperty(
        '--p-blue-500-low-op',
        `color-mix(in srgb, ${palette[500]} 22%, transparent)`,
        'important',
    );
};

export const getSeasonPalette = (season) => {
    const safeSeason = sanitizeSeason(season);
    return SEASON_PALETTES[safeSeason];
};

export const applySeasonPrimaryTheme = (season) => {
    const palette = getSeasonPalette(season);
    applyPrimaryPalette(palette);
};
