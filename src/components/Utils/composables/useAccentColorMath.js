export const useAccentColorMath = ({ normalizeAccentHex, fallbackColor }) => {
    const hexToHsl = (hex) => {
        const normalized = normalizeAccentHex(hex) ?? fallbackColor;
        const value = normalized.slice(1);
        const int = Number.parseInt(value, 16);
        const r = (int >> 16) & 255;
        const g = (int >> 8) & 255;
        const b = int & 255;

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
            h: Math.round((h + 360) % 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100),
        };
    };

    const hslToHex = ({ h, s, l }) => {
        const hue = (((h % 360) + 360) % 360) / 360;
        const sat = Math.max(0, Math.min(s / 100, 1));
        const light = Math.max(0, Math.min(l / 100, 1));

        if (sat === 0) {
            const gray = Math.round(light * 255).toString(16).padStart(2, '0');
            return `#${gray}${gray}${gray}`;
        }

        const hueToRgb = (p, q, t) => {
            let value = t;
            if (value < 0) value += 1;
            if (value > 1) value -= 1;
            if (value < 1 / 6) return p + (q - p) * 6 * value;
            if (value < 1 / 2) return q;
            if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
            return p;
        };

        const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
        const p = 2 * light - q;

        const red = Math.round(hueToRgb(p, q, hue + 1 / 3) * 255).toString(16).padStart(2, '0');
        const green = Math.round(hueToRgb(p, q, hue) * 255).toString(16).padStart(2, '0');
        const blue = Math.round(hueToRgb(p, q, hue - 1 / 3) * 255).toString(16).padStart(2, '0');

        return `#${red}${green}${blue}`;
    };

    const clampPointToCircle = (x, y, limit = 0.94) => {
        const radius = Math.hypot(x, y);
        if (radius <= limit || radius === 0) return { x, y };
        const factor = limit / radius;
        return { x: x * factor, y: y * factor };
    };

    const pointToColorData = (point) => {
        const radius = Math.min(Math.hypot(point.x, point.y), 1);
        const angle = Math.atan2(point.y, point.x);
        const nextHue = Math.round(((angle * 180) / Math.PI + 360) % 360);
        const nextLightness = Math.round(72 - radius * 42);
        return {
            h: nextHue,
            l: Math.max(30, Math.min(72, nextLightness)),
        };
    };

    const colorDataToPoint = (h, l) => {
        const angle = ((h % 360) * Math.PI) / 180;
        const radius = Math.max(0, Math.min((72 - l) / 42, 0.94));
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
        };
    };

    const buildGradientFromHexes = (hexes, fallbackHex) => {
        const normalized = hexes.map(normalizeAccentHex).filter(Boolean);
        const fallback = normalizeAccentHex(fallbackHex) ?? fallbackColor;

        if (!normalized.length) {
            return `linear-gradient(135deg, ${fallback}, ${fallback})`;
        }
        if (normalized.length === 1) {
            return `linear-gradient(135deg, ${normalized[0]}, ${normalized[0]})`;
        }

        const ordered = normalized
            .map((hex) => ({ hex, h: hexToHsl(hex).h }))
            .sort((a, b) => a.h - b.h)
            .map((item) => item.hex);

        const step = 100 / (ordered.length - 1);
        const stops = ordered.map((hex, index) => `${hex} ${(index * step).toFixed(1)}%`);
        return `linear-gradient(135deg, ${stops.join(', ')})`;
    };

    return {
        hexToHsl,
        hslToHex,
        clampPointToCircle,
        pointToColorData,
        colorDataToPoint,
        buildGradientFromHexes,
    };
};
