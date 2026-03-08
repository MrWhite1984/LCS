<template>
    <button
        v-if="isSideBarCollapse"
        class="accent-trigger accent-trigger-collapsed"
        type="button"
        @click="togglePopover"
        v-tooltip.right="'Тема оформления'"
        :style="{ '--accent-preview': previewColor, '--accent-preview-gradient': previewGradient }"
    >
        <span class="accent-trigger-ring"></span>
        <i class="pi pi-palette"></i>
    </button>

    <button
        v-else
        class="accent-card"
        type="button"
        @click="togglePopover"
        :style="{ '--accent-preview': previewColor, '--accent-preview-gradient': previewGradient }"
    >
        <div class="accent-card-copy">
            <span class="accent-eyebrow">Accent Lab</span>
        </div>
        <div class="accent-card-preview">
            <span class="accent-card-glow"></span>
            <span class="accent-card-dot"></span>
        </div>
    </button>

    <Popover ref="popoverRef" class="accent-popover">
        <div class="accent-editor">
            <div class="play-field">
                <div class="spectrum-zone">
                    <div ref="spectrumRef" class="spectrum-wheel" @click="jumpSelectedCircleToClick">
                        <div v-if="!circles.length" class="empty-state-hint">
                            Нажмите, чтобы добавить свой цвет
                        </div>
                        <button
                            v-for="circle in circles"
                            :key="circle.id"
                            type="button"
                            class="play-dot"
                            :class="{
                                'is-active': circle.id === selectedCircleId,
                                'is-jumping': circle.id === jumpingCircleId,
                                'is-preset-pulse': circle.id === presetPulseCircleId,
                            }"
                            :style="circleStyle(circle)"
                            @pointerdown.stop="startDragCircle(circle.id, $event)"
                            @click.stop="selectCircle(circle.id)"
                        ></button>
                    </div>
                </div>
            </div>

            <div class="swatch-row">
                <Button
                    icon="pi pi-angle-left"
                    text
                    rounded
                    class="swatch-nav"
                    :disabled="!canPrevPresets"
                    @click="showPrevPresets"
                />

                <div class="swatch-list">
                    <button
                        v-for="preset in visiblePresets"
                        :key="preset.name"
                        class="swatch-dot"
                        :class="{ 'is-active': isPresetActive(preset.color) }"
                        type="button"
                        v-tooltip.top="preset.name"
                        :style="{ '--swatch': preset.color }"
                        @click="applyPreset(preset.color)"
                    ></button>
                </div>

                <Button
                    icon="pi pi-angle-right"
                    text
                    rounded
                    class="swatch-nav"
                    :disabled="!canNextPresets"
                    @click="showNextPresets"
                />
            </div>

            <div class="control-row">
                <div class="wave-control">
                    <div class="wave-layout">
                        <svg class="wave-svg" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
                            <path class="wave-path-main" :d="wavePath"></path>
                        </svg>
                    </div>
                    <input
                        v-model="saturation"
                        type="range"
                        min="0"
                        max="100"
                        class="range-wave"
                        aria-label="Насыщенность"
                    />
                </div>
            </div>

            <div class="mode-row mode-row-bottom">
                <div class="d-flex" style="width: 36px;"/>
                <div class="mode-btn-row">
                    <Button
                        icon="pi pi-sparkles"
                        class="mode-btn"
                        :class="{ 'mode-active': selectedTheme === 'auto' }"
                        v-tooltip.bottom="'Авто'"
                        @click="setTheme('auto')"
                    />
                    <Button
                        icon="pi pi-sun"
                        class="mode-btn"
                        :class="{ 'mode-active': selectedTheme === 'light' }"
                        v-tooltip.bottom="'Светлая'"
                        @click="setTheme('light')"
                    />
                    <Button
                        icon="pi pi-moon"
                        class="mode-btn"
                        :class="{ 'mode-active': selectedTheme === 'dark' }"
                        v-tooltip.bottom="'Тёмная'"
                        @click="setTheme('dark')"
                    />
                </div>

                <Button
                    icon="pi pi-refresh"
                    outlined
                    rounded
                    class="swatch-nav swatch-reset"
                    v-tooltip.bottom="'Сбросить'"
                    @click="resetToSeason"
                />
            </div>
        </div>
    </Popover>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
    applyAccentTheme,
    applySmartTextContrast,
    clearAccentThemePreference,
    getAccentThemePreference,
    normalizeAccentHex,
    saveAccentThemePreference,
    syncPrimaryTheme,
} from '@/utils/accentTheme.js';
import { useAccentColorMath } from '@/components/Utils/composables/useAccentColorMath.js';
import { useAccentCircleStorage } from '@/components/Utils/composables/useAccentCircleStorage.js';

const props = defineProps({
    isSideBarCollapse: {
        type: Boolean,
        default: false,
    },
    season: {
        type: String,
        required: true,
    },
});

const presets = [
    { name: 'Ivory', color: '#e9e3d6' },
    { name: 'Rose', color: '#dfb0cb' },
    { name: 'Lilac', color: '#d8b5da' },
    { name: 'Coral', color: '#d67583' },
    { name: 'Peach', color: '#ea866f' },
    { name: 'Sand', color: '#d9c977' },
    { name: 'Mint', color: '#5ae0ae' },
    { name: 'Steel', color: '#8e9ab8' },
    { name: 'Ocean', color: '#2f6480' },
    { name: 'Leaf', color: '#357c2b' },
];
const CIRCLES_STORAGE_KEY = 'accentEditorCircles';

const readLivePrimaryColor = () => {
    if (typeof window === 'undefined') return null;
    const value = getComputedStyle(document.documentElement).getPropertyValue('--p-primary-500').trim();
    return normalizeAccentHex(value);
};

const savedAccent = getAccentThemePreference()?.color;
const fallbackColor = savedAccent ?? readLivePrimaryColor() ?? '#d97757';

const popoverRef = ref(null);
const spectrumRef = ref(null);
const workingColor = ref(fallbackColor);
const accentGradient = ref(`linear-gradient(135deg, ${fallbackColor}, ${fallbackColor})`);
const customEnabled = ref(Boolean(savedAccent));
const skipNextSaturationWatch = ref(false);
const supportedThemes = ['light', 'dark', 'auto'];
const selectedTheme = ref('auto');

const circles = ref([]);
const nextCircleId = ref(2);
const selectedCircleId = ref(null);
const draggingCircleId = ref(null);
const jumpingCircleId = ref(null);
const jumpFrameId = ref(null);
const dragFrameId = ref(null);
const pendingDragPoint = ref(null);
const presetPulseCircleId = ref(null);
const presetPulseFrameId = ref(null);
const presetPulseTimeoutId = ref(null);

const {
    hexToHsl,
    hslToHex,
    clampPointToCircle,
    pointToColorData,
    colorDataToPoint,
    buildGradientFromHexes,
} = useAccentColorMath({ normalizeAccentHex, fallbackColor });

const { saveCircleLayout, loadCircleLayout } = useAccentCircleStorage({
    storageKey: CIRCLES_STORAGE_KEY,
    clampPointToCircle,
});

const initialHsl = hexToHsl(fallbackColor);
const saturation = ref(initialHsl.s);

const presetOffset = ref(0);
const visiblePresetCount = 8;
const maxPresetOffset = computed(() => Math.max(0, presets.length - visiblePresetCount));
const canPrevPresets = computed(() => presetOffset.value > 0);
const canNextPresets = computed(() => presetOffset.value < maxPresetOffset.value);
const visiblePresets = computed(() => {
    return presets.slice(presetOffset.value, presetOffset.value + visiblePresetCount);
});
const activePresetColor = computed(() => normalizeAccentHex(workingColor.value));

const previewColor = computed(() => workingColor.value);
const previewGradient = computed(() => accentGradient.value);
const wavePath = computed(() => {
    const value = Number(saturation.value);
    const amplitude = 1.6 + ((value - 20) / 80) * 6.2;
    const segments = 72;
    const baseline = 12;
    const cycles = 6;
    const xStart = 2;
    const xEnd = 98;
    const span = xEnd - xStart;
    const omega = -Math.PI * 2 * cycles;

    const pointAt = (t) => ({
        x: xStart + span * t,
        y: baseline + Math.sin(omega * t) * amplitude,
    });

    const slopeAt = (t) => (amplitude * omega * Math.cos(omega * t)) / span;

    let path = '';
    for (let i = 0; i < segments; i += 1) {
        const t0 = i / segments;
        const t1 = (i + 1) / segments;
        const p0 = pointAt(t0);
        const p1 = pointAt(t1);
        const dx = p1.x - p0.x;
        const c1x = p0.x + dx / 3;
        const c1y = p0.y + (slopeAt(t0) * dx) / 3;
        const c2x = p1.x - dx / 3;
        const c2y = p1.y - (slopeAt(t1) * dx) / 3;

        if (i === 0) {
            path += `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} `;
        }
        path += `C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} `;
    }

    return path.trim();
});
const selectedCircle = computed(() => circles.value.find((circle) => circle.id === selectedCircleId.value) ?? circles.value[0]);

const applyFromHsl = () => {
    const current = selectedCircle.value;
    if (!current) return;
    const mapped = pointToColorData(current);
    const nextHex = hslToHex({
        h: Number(mapped.h),
        s: Number(saturation.value),
        l: Number(mapped.l),
    });

    accentGradient.value = buildGradientFromHexes([nextHex], workingColor.value);

    workingColor.value = nextHex;
    applyAndPersistAccent(nextHex);
};

const syncFromSelectedCircle = () => {
    applyFromHsl();
};

const ensureSelectedCircle = () => {
    if (selectedCircleId.value && circles.value.some((circle) => circle.id === selectedCircleId.value)) {
        return;
    }
    selectedCircleId.value = circles.value[0]?.id ?? null;
};

const syncCustomEnabled = () => {
    customEnabled.value = Boolean(getAccentThemePreference()?.color);
};

const updateDerivedState = (hex, { apply = false } = {}) => {
    const normalized = normalizeAccentHex(hex);
    if (!normalized) return;

    const hsl = hexToHsl(normalized);
    workingColor.value = normalized;
    accentGradient.value = buildGradientFromHexes([normalized], workingColor.value);
    skipNextSaturationWatch.value = true;
    saturation.value = hsl.s;

    ensureSelectedCircle();
    if (selectedCircle.value) {
        const point = colorDataToPoint(Number(hsl.h), Number(hsl.l));
        selectedCircle.value.x = point.x;
        selectedCircle.value.y = point.y;
    }

    if (apply) {
        applyAndPersistAccent(normalized);
    }
};

const syncPreviewFromTheme = () => {
    updateDerivedState(readLivePrimaryColor() ?? fallbackColor);
};

const switchToSeasonMode = () => {
    clearAccentThemePreference();
    syncCustomEnabled();
    syncPrimaryTheme(props.season);
    syncPreviewFromTheme();
};

const getSavedTheme = () => {
    if (typeof window === 'undefined') return 'auto';
    const stored = localStorage.getItem('theme');
    return supportedThemes.includes(stored) ? stored : 'auto';
};

const getAutoTheme = () => {
    const hour = new Date().getHours();
    return (hour >= 18 || hour < 6) ? 'dark' : 'light';
};

const applyThemeMode = (theme) => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const resolved = theme === 'auto' ? getAutoTheme() : theme;
    root.classList.toggle('p-dark', resolved === 'dark');
    applySmartTextContrast();
};

const setTheme = (theme) => {
    if (!supportedThemes.includes(theme)) return;
    selectedTheme.value = theme;
    if (typeof window !== 'undefined') {
        localStorage.setItem('theme', theme);
    }
    applyThemeMode(theme);
};

const applyAndPersistAccent = (hex) => {
    applyAccentTheme(hex);
    saveAccentThemePreference(hex);
    customEnabled.value = true;
};

const togglePopover = (event) => {
    syncCustomEnabled();
    if (circles.value.length > 0) {
        ensureSelectedCircle();
        syncFromSelectedCircle();
    } else {
        updateDerivedState(getAccentThemePreference()?.color ?? readLivePrimaryColor() ?? fallbackColor);
    }
    selectedTheme.value = getSavedTheme();
    const target = event?.currentTarget ?? event?.target;
    popoverRef.value?.toggle(event, target);
};

watch(() => saturation.value, () => {
    if (skipNextSaturationWatch.value) {
        skipNextSaturationWatch.value = false;
        return;
    }
    applyFromHsl();
});

watch(() => props.season, () => {
    if (!customEnabled.value) {
        syncPreviewFromTheme();
    }
    syncCustomEnabled();
});

watch(
    [circles, selectedCircleId],
    () => {
        saveCircleLayout({
            circles: circles.value,
            selectedCircleId: selectedCircleId.value,
            nextCircleId: nextCircleId.value,
        });
    },
    { deep: true },
);

const isPresetActive = (color) => normalizeAccentHex(color) === activePresetColor.value;

const triggerPresetPulse = () => {
    const id = selectedCircleId.value;
    if (id == null) return;

    if (presetPulseFrameId.value != null) {
        cancelAnimationFrame(presetPulseFrameId.value);
        presetPulseFrameId.value = null;
    }
    if (presetPulseTimeoutId.value != null) {
        clearTimeout(presetPulseTimeoutId.value);
        presetPulseTimeoutId.value = null;
    }

    presetPulseCircleId.value = null;
    presetPulseFrameId.value = requestAnimationFrame(() => {
        presetPulseCircleId.value = id;
        presetPulseFrameId.value = null;
    });
    presetPulseTimeoutId.value = setTimeout(() => {
        if (presetPulseCircleId.value === id) {
            presetPulseCircleId.value = null;
        }
        presetPulseTimeoutId.value = null;
    }, 420);
};

const applyPreset = (color) => {
    updateDerivedState(color, { apply: true });
    triggerPresetPulse();
};

const selectCircle = (id) => {
    selectedCircleId.value = id;
    syncFromSelectedCircle();
};

const showNextPresets = () => {
    presetOffset.value = Math.min(presetOffset.value + 1, maxPresetOffset.value);
};

const showPrevPresets = () => {
    presetOffset.value = Math.max(presetOffset.value - 1, 0);
};

const getPointFromEvent = (event) => {
    const rect = spectrumRef.value?.getBoundingClientRect();
    if (!rect) return null;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rawX = (event.clientX - centerX) / (rect.width / 2);
    const rawY = (event.clientY - centerY) / (rect.height / 2);

    return clampPointToCircle(rawX, rawY);
};

const setCirclePosition = (id, point) => {
    const circle = circles.value.find((item) => item.id === id);
    if (!circle || !point) return;

    circle.x = point.x;
    circle.y = point.y;
};

const flushPendingDragPoint = () => {
    if (draggingCircleId.value == null || !pendingDragPoint.value) return;
    setCirclePosition(draggingCircleId.value, pendingDragPoint.value);
    pendingDragPoint.value = null;
    syncFromSelectedCircle();
};

const addCircleAtPoint = (point) => {
    if (!point) return null;
    const normalizedPoint = clampPointToCircle(point.x, point.y);
    const newCircle = {
        id: nextCircleId.value,
        x: normalizedPoint.x,
        y: normalizedPoint.y,
    };

    nextCircleId.value += 1;
    circles.value = [newCircle];
    selectedCircleId.value = newCircle.id;
    syncFromSelectedCircle();
    return newCircle.id;
};

const cancelJumpAnimation = () => {
    if (jumpFrameId.value != null) {
        cancelAnimationFrame(jumpFrameId.value);
        jumpFrameId.value = null;
    }
    jumpingCircleId.value = null;
};

const animateCircleToPoint = (id, targetPoint) => {
    const circle = circles.value.find((item) => item.id === id);
    if (!circle || !targetPoint) return;

    cancelJumpAnimation();
    jumpingCircleId.value = id;

    const startX = circle.x;
    const startY = circle.y;
    const target = clampPointToCircle(targetPoint.x, targetPoint.y);
    const duration = 300;
    const startedAt = performance.now();
    const dx = target.x - startX;
    const dy = target.y - startY;
    const len = Math.hypot(dx, dy) || 1;
    const dirX = dx / len;
    const dirY = dy / len;
    const overshootDistance = Math.min(0.1, len * 0.35);
    const overshootPoint = clampPointToCircle(target.x + dirX * overshootDistance, target.y + dirY * overshootDistance);

    const tick = (now) => {
        const elapsed = now - startedAt;
        const t = Math.min(elapsed / duration, 1);
        const split = 0.72;

        let nextX;
        let nextY;
        if (t < split) {
            const p = t / split;
            const eased = 1 - Math.pow(1 - p, 3);
            nextX = startX + (overshootPoint.x - startX) * eased;
            nextY = startY + (overshootPoint.y - startY) * eased;
        } else {
            const p = (t - split) / (1 - split);
            const eased = 1 - Math.pow(1 - p, 2.4);
            nextX = overshootPoint.x + (target.x - overshootPoint.x) * eased;
            nextY = overshootPoint.y + (target.y - overshootPoint.y) * eased;
        }

        const nextPoint = clampPointToCircle(nextX, nextY);

        circle.x = nextPoint.x;
        circle.y = nextPoint.y;
        syncFromSelectedCircle();

        if (t < 1) {
            jumpFrameId.value = requestAnimationFrame(tick);
            return;
        }

        circle.x = target.x;
        circle.y = target.y;
        syncFromSelectedCircle();
        jumpingCircleId.value = null;
        jumpFrameId.value = null;
    };

    jumpFrameId.value = requestAnimationFrame(tick);
};

const onPointerMove = (event) => {
    if (draggingCircleId.value == null) return;
    const point = getPointFromEvent(event);
    if (!point) return;
    pendingDragPoint.value = point;
    if (dragFrameId.value != null) return;

    dragFrameId.value = requestAnimationFrame(() => {
        dragFrameId.value = null;
        flushPendingDragPoint();
    });
};

const stopDragging = () => {
    if (dragFrameId.value != null) {
        cancelAnimationFrame(dragFrameId.value);
        dragFrameId.value = null;
    }
    flushPendingDragPoint();
    draggingCircleId.value = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', stopDragging);
};

const startDragging = (id, event) => {
    if (event.button !== 0) return;
    cancelJumpAnimation();
    draggingCircleId.value = id;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stopDragging);
};

const jumpSelectedCircleToClick = (event) => {
    const point = getPointFromEvent(event);
    if (!point) return;

    if (!circles.value.length || selectedCircleId.value == null) {
        addCircleAtPoint(point);
        return;
    }

    ensureSelectedCircle();
    const id = selectedCircleId.value;
    animateCircleToPoint(id, point);
};

const startDragCircle = (id, event) => {
    selectedCircleId.value = id;
    startDragging(id, event);
};

const circleColor = (circle) => {
    const mapped = pointToColorData(circle);
    return hslToHex({ h: mapped.h, s: Number(saturation.value), l: mapped.l });
};

const circleStyle = (circle) => ({
    '--dot-color': circleColor(circle),
    '--dot-size': circle.id === selectedCircleId.value ? '52px' : '36px',
    '--dot-x': `${(circle.x + 1) * 50}%`,
    '--dot-y': `${(circle.y + 1) * 50}%`,
});

const resetToSeason = () => {
    switchToSeasonMode();
    cancelJumpAnimation();
    circles.value = [];
    selectedCircleId.value = null;
};

onBeforeUnmount(() => {
    if (dragFrameId.value != null) {
        cancelAnimationFrame(dragFrameId.value);
    }
    if (presetPulseFrameId.value != null) {
        cancelAnimationFrame(presetPulseFrameId.value);
    }
    if (presetPulseTimeoutId.value != null) {
        clearTimeout(presetPulseTimeoutId.value);
    }
    cancelJumpAnimation();
    stopDragging();
});

onMounted(() => {
    const layout = loadCircleLayout();
    if (layout) {
        circles.value = layout.circles;
        selectedCircleId.value = layout.selectedCircleId;
        nextCircleId.value = layout.nextCircleId;
    }
    selectedTheme.value = getSavedTheme();
    applyThemeMode(selectedTheme.value);
});
</script>

<style scoped>
.accent-trigger,
.accent-card {
    border: 0;
    cursor: pointer;
}

.accent-trigger {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--p-text-color);
    background: rgba(255, 255, 255, 0.14);
    transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
}

.accent-trigger:hover,
.accent-card:hover {
    transform: translateY(-1px);
}

.accent-trigger-collapsed {
    width: 44px;
    height: 44px;
    border-radius: 16px;
}

.accent-trigger-ring {
    position: absolute;
    inset: 5px;
    border-radius: 12px;
    background: var(--accent-preview-gradient);
    opacity: 0.9;
}

.accent-trigger .pi {
    position: relative;
    color: #fff;
    z-index: 1;
    font-size: 1.1rem;
    text-shadow: 0 1px 8px rgba(255, 255, 255, 0.25);
}

.accent-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 1rem;
    width: 100%;
    padding: 0.25rem 1rem;
    border-radius: 12px;
    text-align: left;
    color: var(--p-text-color);
    background:
        linear-gradient(160deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.08)),
        linear-gradient(135deg, rgba(8, 15, 28, 0.08), transparent 55%);
    /* box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.25),
        0 14px 35px rgba(12, 18, 28, 0.12); */
}

.accent-card-copy {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
}

.accent-card-copy small,
.accent-eyebrow {
    opacity: 0.72;
}

.accent-eyebrow {
    font-size: 0.7rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
}

.accent-card-preview {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.25rem 0.5rem;
    border-radius: 999px;
    overflow: hidden;
}

.accent-card-glow {
    position: absolute;
    inset: 0;
    background: var(--accent-preview-gradient);
    opacity: 0.32;
}

.accent-card-dot {
    position: relative;
    width: 0.95rem;
    height: 0.95rem;
    border-radius: 999px;
    background: var(--accent-preview);
    box-shadow: 0 0 18px color-mix(in srgb, var(--accent-preview) 48%, transparent);
}

.accent-editor {
    width: min(23rem, calc(100vw - 1.25rem));
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    color: var(--p-text-color);
}

.mode-row {
    display: flex;
    justify-content: space-between;
}

.mode-row-bottom {
    margin-top: 0.2rem;
}

.mode-btn-row {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
}

.mode-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid var(--p-grey-3);
    background: var(--p-grey-4);
    color: var(--p-text-color);
    cursor: pointer;
}

.mode-active {
    background: var(--p-primary-color);
    color: #fff;
}

.play-field {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
}

.spectrum-zone {
    width: min(100%, 22rem);
    aspect-ratio: 1 / 1;
    border-radius: 14px;
    border: 1px solid rgba(133, 154, 190, 0.3);
    display: grid;
    place-items: center;
    background:
        radial-gradient(circle, rgba(142, 142, 147, 0.24) 1px, transparent 1px),
        linear-gradient(
            155deg,
            rgba(255, 255, 255, 0.46),
            rgba(242, 242, 247, 0.76) 34%,
            rgba(229, 229, 234, 0.7)
        );
    background-size: 10px 10px, auto;
}

.spectrum-wheel {
    position: relative;
    width: 95%;
    aspect-ratio: 1 / 1;
    border-radius: 999px;
}

.empty-state-hint {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    text-align: center;
    padding: 0 1rem;
    font-size: 0.78rem;
    line-height: 1.25;
    color: var(--p-text-muted-color, rgba(255, 255, 255, 0.72));
    pointer-events: none;
}

.play-dot {
    position: absolute;
    width: var(--dot-size);
    height: var(--dot-size);
    left: var(--dot-x);
    top: var(--dot-y);
    border-radius: 999px;
    border: 6px solid #f6f8fb;
    background: var(--dot-color);
    transform: translate(-50%, -50%);
    cursor: grab;
    transition: left 0.12s linear, top 0.12s linear, transform 0.18s ease, width 0.18s ease, height 0.18s ease, box-shadow 0.18s ease;
}

.play-dot:active {
    cursor: grabbing;
}

.play-dot.is-jumping {
    transition: none;
}

.play-dot.is-preset-pulse {
    animation: dot-pulse 0.42s ease-out;
}

.swatch-row {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr) 36px;
    align-items: center;
    gap: 0.65rem;
    padding: 0 0.2rem;
}

.swatch-nav {
    border: 1px solid transparent;
    background: transparent;
    color: var(--p-text-color);
    font-size: 1.15rem;
    cursor: pointer;
}

.swatch-nav:disabled {
    opacity: 0.35;
    cursor: default;
}

.swatch-reset {
    font-size: 1rem;
}

.swatch-list {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 1rem;
}

.swatch-dot {
    width: 1.78rem;
    height: 1.78rem;
    border-radius: 999px;
    border: 2px solid transparent;
    justify-self: center;
    background: var(--swatch);
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.swatch-dot.is-active {
    border-color: color-mix(in srgb, var(--p-text-color) 72%, transparent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--swatch) 30%, transparent);
    transform: translateY(-1px);
}

.control-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: center;
    gap: 0.55rem;
    padding: 0 0.2rem;
}

.wave-layout {
    position: relative;
    width: 100%;
    overflow: hidden;
    height: 4rem;
}

.wave-control {
    position: relative;
    height: 1rem;
    margin-block: 2rem;
    border-radius: 14px;
    background: var(--p-grey-7);

    display: flex;
    align-items: center;
}

.p-dark .accent-editor {
    color: rgba(236, 240, 247, 0.95);
}

.p-dark .spectrum-zone {
    border: 1px solid rgba(142, 142, 147, 0.2);
    background:
        radial-gradient(circle, rgba(142, 142, 147, 0.28) 1px, transparent 1px),
        linear-gradient(
            155deg,
            rgba(72, 72, 74, 0.36),
            rgba(44, 44, 46, 0.88) 30%,
            rgba(28, 28, 30, 0.92)
        );
    background-size: 10px 10px, auto;
}

.wave-svg {
    position: absolute;
    inset: 0 6px;
    width: calc(100% - 12px);
    height: 100%;
    pointer-events: none;
}

.wave-svg .wave-path-main {
    fill: none;
    stroke: var(--p-grey-1);
    stroke-width: 2.75;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.range-wave {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    appearance: none;
    background: transparent;
    margin: 0;
}

.range-wave::-webkit-slider-runnable-track {
    height: 100%;
    background: transparent;
}

.range-wave::-webkit-slider-thumb {
    appearance: none;
    width: 1.25rem;
    height: 3.2rem;
    border-radius: 10px;
    background: var(--p-text-color);
    border: 0;
}

.range-wave::-moz-range-track {
    height: 100%;
    background: transparent;
    border: 0;
}

.range-wave::-moz-range-thumb {
    width: 1.25rem;
    height: 3.2rem;
    border-radius: 10px;
    background: var(--p-text-color);
    border: 0;
}

:deep(.accent-popover) {
    margin-left: 0.5rem;
}

@keyframes dot-pulse {
    0% {
        transform: translate(-50%, -50%) scale(1);
        box-shadow: 0 0 0 0 color-mix(in srgb, var(--dot-color) 55%, transparent);
    }
    45% {
        transform: translate(-50%, -50%) scale(1.1);
        box-shadow: 0 0 0 10px color-mix(in srgb, var(--dot-color) 18%, transparent);
    }
    100% {
        transform: translate(-50%, -50%) scale(1);
        box-shadow: 0 0 0 0 color-mix(in srgb, var(--dot-color) 0%, transparent);
    }
}

@media (max-width: 768px) {
    .accent-editor {
        width: min(96vw, 22rem);
    }

    .spectrum-zone {
        width: min(100%, 12rem);
    }

    .spectrum-wheel {
        width: 86%;
    }

    .swatch-list {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }

}
</style>
