import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { getInterfaceSettings, saveInterfaceSettings } from '@/api/interfaceSettings.js';
import {
    DEFAULT_LAYOUT,
    KNOWN_WIDGET_IDS,
    WIDGETS_BY_ID,
    isWidgetAvailable,
    availableWidgets,
} from '@/config/dashboardWidgets.js';
import { applyThemeMode, getSavedThemeMode } from '@/utils/themeMode.js';
import { getSessionUserId } from '@/utils/TokenService';
import {
    applyAccentTheme,
    saveAccentThemePreference,
    clearAccentThemePreference,
    syncPrimaryTheme,
    getAccentThemePreference,
} from '@/utils/accentTheme.js';
import { usePermissionStore } from '@/stores/permissions.js';

const SAVE_DEBOUNCE_MS = 400;

const cloneColumns = (columns) => columns.map((col) => [...(col || [])]);

const normalizeAccent = (accentColor) => {
    if (!accentColor || typeof accentColor !== 'object') return null;
    const color = typeof accentColor.color === 'string' ? accentColor.color : null;
    if (!color) return null;
    const stateDelta = Number.isFinite(Number(accentColor.stateDelta)) ? Number(accentColor.stateDelta) : undefined;
    return { color, stateDelta };
};

export const useDashboardStore = defineStore('dashboard', () => {
    const permissionStore = usePermissionStore();

    const columns = ref(cloneColumns(DEFAULT_LAYOUT.columns));
    const themeMode = ref('auto');
    const accent = ref(null);
    const loaded = ref(false);
    const editing = ref(false);
    const paletteIds = ref([]);

    let saveTimer = null;
    let saveInFlight = null;
    let loadPromise = null;

    const placedIds = computed(() => {
        const set = new Set();
        for (const col of columns.value) {
            for (const id of col) set.add(id);
        }
        return set;
    });

    /**
     * Доступные виджету-дескрипторы для текущего пользователя (по permissionFilter).
     */
    const availableWidgetDescriptors = computed(() => availableWidgets(permissionStore));
    const availableIds = computed(() => availableWidgetDescriptors.value.map((w) => w.id));

    function applyTheme() {
        applyThemeMode(themeMode.value);
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', themeMode.value);
        }
    }

    function applyAccent() {
        if (accent.value) {
            saveAccentThemePreference(accent.value.color, { stateDelta: accent.value.stateDelta });
        } else {
            clearAccentThemePreference();
            syncPrimaryTheme();
        }
    }

    /**
     * Превратить серверные/дефолтные колонки в валидные: отбросить неизвестные id
     * и недоступные по правам, дедуплицировать между колонками (первое вхождение выигрывает),
     * гарантировать ровно 3 колонки.
     */
    function pruneColumns(rawColumns) {
        const seen = new Set();
        const result = [[], [], []];
        if (!Array.isArray(rawColumns)) return result;

        for (let i = 0; i < 3; i += 1) {
            const col = Array.isArray(rawColumns[i]) ? rawColumns[i] : [];
            for (const id of col) {
                if (typeof id !== 'string') continue;
                if (!KNOWN_WIDGET_IDS.has(id)) {
                    console.debug(`[dashboard] неизвестный id виджета в сохранённой раскладке: ${id}`);
                    continue;
                }
                if (!isWidgetAvailable(id, permissionStore)) continue;
                if (seen.has(id)) continue;
                seen.add(id);
                result[i].push(id);
            }
        }
        return result;
    }

    async function load() {
        if (loaded.value || loadPromise) return loadPromise;
        loadPromise = (async () => {
            // Правки раскладки (pruning) зависят от прав пользователя, поэтому
            // дождёмся их загрузки — иначе виджеты с permissionFilter будут
            // ошибочно отброшены при первой отрисовке.
            try {
                await permissionStore.fetchPermissions();
            } catch (error) {
                console.debug('Права не загружены — pruning по правам пропущен:', error);
            }
            let serverSettings = null;
            try {
                serverSettings = await getInterfaceSettings();
            } catch (error) {
                console.debug('Не удалось загрузить настройки интерфейса:', error);
            }

            if (serverSettings && serverSettings.columns) {
                columns.value = pruneColumns(serverSettings.columns);
                const mode = serverSettings.themeMode;
                themeMode.value = ['light', 'dark', 'auto'].includes(mode) ? mode : 'auto';
                accent.value = normalizeAccent(serverSettings.accentColor);
            } else {
                // Нет строки — дефолтная раскладка, тема/акцент из localStorage (как было).
                columns.value = pruneColumns(DEFAULT_LAYOUT.columns);
                themeMode.value = getSavedThemeMode();
                accent.value = getAccentThemePreference();
            }

            ensureSurveysWidget();
            applyTheme();
            applyAccent();
            loaded.value = true;
        })();
        return loadPromise;
    }

    function ensureSurveysWidget() {
        if (typeof window === 'undefined') return;
        if (!isWidgetAvailable('surveys', permissionStore)) return;

        const storageKey = `dashboard:surveys-widget-added:${getSessionUserId() || 'anonymous'}`;
        const alreadyPlaced = columns.value.some((column) => column.includes('surveys'));

        if (alreadyPlaced) {
            localStorage.setItem(storageKey, '1');
            return;
        }

        if (localStorage.getItem(storageKey) === '1') return;

        const targetColumn = Math.min(WIDGETS_BY_ID.surveys?.defaultColumn ?? 0, columns.value.length - 1);
        columns.value[targetColumn].push('surveys');
        localStorage.setItem(storageKey, '1');
        scheduleSave();
    }

    function setColumn(index, arr) {
        if (index < 0 || index > 2) return;
        columns.value[index] = [...(arr || [])];
        scheduleSave();
    }

    function setPalette(arr) {
        paletteIds.value = [...(arr || [])];
    }

    function setThemeMode(mode) {
        if (!['light', 'dark', 'auto'].includes(mode)) return;
        themeMode.value = mode;
        applyTheme();
        scheduleSave();
    }

    function setAccent(payload) {
        accent.value = payload ? { color: payload.color, stateDelta: payload.stateDelta } : null;
        applyAccent();
        scheduleSave();
    }

    function startEdit() {
        editing.value = true;
        const placed = placedIds.value;
        paletteIds.value = availableIds.value.filter((id) => !placed.has(id));
    }

    function endEdit() {
        if (!editing.value) return;
        editing.value = false;
        paletteIds.value = [];
        flushSave();
    }

    function buildPayload() {
        return {
            columns: columns.value.map((col) => [...col]),
            themeMode: themeMode.value,
            accentColor: accent.value
                ? { color: accent.value.color, stateDelta: accent.value.stateDelta }
                : null,
        };
    }

    async function performSave() {
        // Не сохраняем, пока раскладка не загружена с сервера — иначе можно
        // затереть пользовательскую раскладку дефолтной.
        if (!loaded.value && loadPromise) {
            await loadPromise;
        }
        if (!loaded.value) return;
        const payload = buildPayload();
        // Коалесинг: если уже идёт запрос — перезапишем payload после его завершения.
        saveInFlight = saveInterfaceSettings(payload)
            .catch((error) => {
                console.debug('Не удалось сохранить настройки интерфейса:', error);
            })
            .finally(() => {
                saveInFlight = null;
            });
        return saveInFlight;
    }

    function scheduleSave() {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            saveTimer = null;
            performSave();
        }, SAVE_DEBOUNCE_MS);
    }

    async function flushSave() {
        if (saveTimer) {
            clearTimeout(saveTimer);
            saveTimer = null;
        }
        await performSave();
    }

    /**
     * Триггер сохранения после операций DnD (vue-draggable-plus мутирует массивы
     * на месте, поэтому надёжнее дёргать сохранение явно из @end-обработчиков).
     */
    function touch() {
        scheduleSave();
    }

    return {
        columns,
        themeMode,
        accent,
        loaded,
        editing,
        paletteIds,
        placedIds,
        availableIds,
        availableWidgetDescriptors,
        load,
        setColumn,
        setPalette,
        setThemeMode,
        setAccent,
        startEdit,
        endEdit,
        applyTheme,
        applyAccent,
        flushSave,
        touch,
    };
});