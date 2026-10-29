<template>
    <section class="admin-panel electives-page">
        <div class="admin-panel-head">
            <div>
                <Tag rounded severity="contrast">Элективы</Tag>
                <h3>Элективы</h3>
                <p>Соберите серию из учебных групп UMU: выберите группы, постройте сегменты и опубликуйте.</p>
            </div>
            <div class="admin-panel-actions">
                <Button label="Обновить группы" icon="pi pi-refresh" outlined severity="secondary" :loading="loadingGroups" @click="loadGroups" />
            </div>
        </div>

        <div class="electives-layout">
            <div class="electives-main">
                <section class="admin-card electives-step">
                    <div class="electives-step-head">
                        <span class="electives-step-number">1</span>
                        <div>
                            <h4>Параметры серии</h4>
                            <p>Название, шаблон вопросов и настройки будущей серии.</p>
                        </div>
                    </div>

                    <div class="admin-form">
                        <div class="admin-form-grid">
                            <div class="admin-field">
                                <label>ID серии</label>
                                <InputText v-model="seriesForm.id" class="w-full" placeholder="Сгенерируется при создании" />
                            </div>
                            <div class="admin-field">
                                <label>Название серии</label>
                                <InputText v-model="seriesForm.title" class="w-full" placeholder="Например, Элективы 2026/2027" />
                            </div>
                        </div>

                        <div class="admin-form-grid">
                            <div class="admin-field">
                                <label>Шаблон вопросов</label>
                                <Select
                                    v-model="seriesForm.templateId"
                                    :options="templateOptions"
                                    optionLabel="label"
                                    optionValue="value"
                                    filter
                                    editable
                                    showClear
                                    placeholder="Выберите шаблон"
                                    class="w-full"
                                />
                            </div>
                            <div class="admin-field">
                                <label>Статус</label>
                                <Select v-model="seriesForm.status" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
                            </div>
                        </div>

                        <div class="admin-form-grid">
                            <div class="admin-field">
                                <label>Заголовок факультативов</label>
                                <InputText v-model="buildForm.facultativeTitle" class="w-full" placeholder="Факультативные дисциплины" />
                            </div>
                            <div class="admin-field">
                                <label>Префикс заголовка элективов</label>
                                <InputText v-model="buildForm.electiveTitlePrefix" class="w-full" placeholder="Электив" />
                            </div>
                        </div>

                        <div class="admin-checkbox-row">
                            <Checkbox v-model="buildForm.includeFacultatives" binary inputId="include-facultatives" />
                            <label for="include-facultatives">Добавить факультативные дисциплины</label>
                        </div>
                    </div>
                </section>

                <section class="admin-card electives-step">
                    <div class="admin-card-head electives-step-head">
                        <div class="electives-step-title">
                            <span class="electives-step-number">2</span>
                            <div>
                                <h4>Группы UMU</h4>
                                <p>Выбрано: {{ selectedGroups.length }} · Доступно: {{ filteredGroups.length }}</p>
                            </div>
                        </div>
                        <div class="group-filters">
                            <InputText v-model="groupSearch" placeholder="Поиск по названию" />
                            <div class="admin-checkbox-row compact">
                                <Checkbox v-model="activeOnly" binary inputId="active-only-groups" @update:modelValue="loadGroups" />
                                <label for="active-only-groups">Только текущий год</label>
                            </div>
                        </div>
                    </div>

                    <div v-if="selectedGroups.length" class="selected-groups">
                        <button
                            v-for="name in selectedGroups"
                            :key="name"
                            type="button"
                            class="selected-group-chip"
                            title="Убрать группу"
                            @click="toggleGroup(name, false)"
                        >
                            <span>{{ name }}</span>
                            <i class="pi pi-times"></i>
                        </button>
                    </div>

                    <div v-if="loadingGroups" class="admin-empty">
                        <i class="pi pi-spin pi-spinner"></i>
                        Загрузка групп…
                    </div>
                    <div v-else-if="!filteredGroups.length" class="admin-empty">
                        Группы не найдены.
                    </div>
                    <div v-else class="group-list">
                        <label
                            v-for="group in filteredGroups"
                            :key="group.id"
                            class="group-item"
                            :class="{ 'group-item--selected': selectedGroups.includes(group.name) }"
                        >
                            <Checkbox
                                :modelValue="selectedGroups.includes(group.name)"
                                binary
                                @update:modelValue="toggleGroup(group.name, $event)"
                            />
                            <span class="group-name">{{ group.name }}</span>
                            <span class="group-meta">{{ groupMeta(group) }}</span>
                        </label>
                    </div>
                </section>

                <section class="admin-card electives-step">
                    <div class="admin-card-head electives-step-head">
                        <div class="electives-step-title">
                            <span class="electives-step-number">3</span>
                            <div>
                                <h4>Сегменты</h4>
                                <p>Проверьте вопросы, которые получились из учебных планов.</p>
                            </div>
                        </div>
                        <Button label="Построить сегменты" icon="pi pi-hammer" :loading="building" :disabled="!selectedGroups.length || !canCreate" @click="buildSegments" />
                    </div>

                    <div v-if="warnings.length" class="warnings">
                        <div v-for="warning in warnings" :key="warning" class="warning-item">
                            <i class="pi pi-exclamation-triangle"></i>
                            {{ warning }}
                        </div>
                    </div>

                    <SurveySegmentsEditor v-model="segments" />
                </section>
            </div>

            <aside class="electives-aside">
                <section class="admin-card electives-summary">
                    <h4>Сводка</h4>

                    <div class="summary-row">
                        <span>Серия</span>
                        <strong>{{ seriesForm.title || 'Без названия' }}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Статус</span>
                        <Tag :value="statusLabel" severity="info" />
                    </div>
                    <div class="summary-row">
                        <span>Групп</span>
                        <strong>{{ selectedGroups.length }}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Сегментов</span>
                        <strong>{{ segments.length }}</strong>
                    </div>

                    <div class="summary-actions">
                        <Button label="Создать серию" icon="pi pi-save" :loading="saving" :disabled="!segments.length || !canCreate" @click="createSeries" />
                        <Button label="Опубликовать" icon="pi pi-play" severity="success" :loading="publishing" :disabled="!seriesForm.id || !canUpdate" @click="publishSeries" />
                        <Button label="Закрыть" icon="pi pi-stop" severity="warn" :loading="closing" :disabled="!seriesForm.id || !canUpdate" @click="closeSeries" />
                    </div>
                </section>

                <section class="admin-card electives-help">
                    <h4>Порядок действий</h4>
                    <ol>
                        <li>Заполните параметры серии.</li>
                        <li>Выберите группы UMU.</li>
                        <li>Постройте сегменты и проверьте вопросы.</li>
                        <li>Создайте серию и опубликуйте её.</li>
                    </ol>
                </section>
            </aside>
        </div>
    </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { usePermissionStore } from '@/stores/permissions.js';
import { getApiErrorMessage } from '@/utils/apiErrors.js';
import {
    buildAdminElectives,
    closeAdminSeries,
    createAdminSeriesFromTemplate,
    getAdminElectiveGroups,
    getAdminTemplates,
    publishAdminSeries,
} from '@/api/surveysAdmin.js';
import SurveySegmentsEditor from '@/components/SurveysAdmin/SurveySegmentsEditor.vue';

const toast = useToast();
const permissionStore = usePermissionStore();

const groups = ref([]);
const templates = ref([]);
const loadingGroups = ref(false);
const groupSearch = ref('');
const activeOnly = ref(true);
const selectedGroups = ref([]);
const segments = ref([]);
const warnings = ref([]);
const building = ref(false);
const saving = ref(false);
const publishing = ref(false);
const closing = ref(false);

const seriesForm = reactive({
    id: '',
    title: '',
    templateId: '',
    status: 'draft',
});

const buildForm = reactive({
    includeFacultatives: true,
    facultativeTitle: '',
    electiveTitlePrefix: 'Электив',
});

const statusOptions = [
    { label: 'Черновик', value: 'draft' },
    { label: 'Активна', value: 'active' },
    { label: 'Закрыта', value: 'closed' },
    { label: 'Архив', value: 'archived' },
];

const canCreate = computed(() => permissionStore.hasPermission('SurveysTemplates', 'Create'));
const canUpdate = computed(() => permissionStore.hasPermission('SurveysTemplates', 'Update'));

const statusLabel = computed(() => (
    statusOptions.find((option) => option.value === seriesForm.status)?.label || 'Черновик'
));

const templateOptions = computed(() => templates.value.map((template) => ({
    value: template.id,
    label: template.title || template.id,
})));

const filteredGroups = computed(() => {
    const query = groupSearch.value.trim().toLowerCase();
    return groups.value
        .filter((group) => !query || String(group.name || '').toLowerCase().includes(query))
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ru'));
});

const loadGroups = async () => {
    loadingGroups.value = true;
    try {
        const response = await getAdminElectiveGroups({ activeOnly: activeOnly.value });
        groups.value = Array.isArray(response.data) ? response.data : [];
        const available = new Set(groups.value.map((group) => group.name));
        selectedGroups.value = selectedGroups.value.filter((name) => available.has(name));
    } catch (error) {
        groups.value = [];
        toast.add({ severity: 'error', summary: 'Не удалось загрузить группы UMU', detail: getApiErrorMessage(error), life: 4000 });
    } finally {
        loadingGroups.value = false;
    }
};

const loadTemplates = async () => {
    try {
        const response = await getAdminTemplates();
        templates.value = Array.isArray(response.data?.templates) ? response.data.templates : [];
    } catch {
        templates.value = [];
    }
};

const toggleGroup = (name, checked) => {
    if (checked) {
        if (!selectedGroups.value.includes(name)) selectedGroups.value.push(name);
        return;
    }

    selectedGroups.value = selectedGroups.value.filter((item) => item !== name);
};

const groupMeta = (group) => {
    const parts = [];
    if (group.course) parts.push(`${group.course} курс`);
    if (group.yearName) parts.push(group.yearName);
    if (group.faculty) parts.push(group.faculty);
    if (activeOnly.value && group.isActive === false) parts.push('неактивна');
    return parts.join(' · ');
};

const buildSegments = async () => {
    building.value = true;
    warnings.value = [];
    try {
        const response = await buildAdminElectives({
            groups: selectedGroups.value,
            includeFacultatives: buildForm.includeFacultatives,
            facultativeTitle: buildForm.facultativeTitle || null,
            electiveTitlePrefix: buildForm.electiveTitlePrefix || null,
        });
        segments.value = Array.isArray(response.data?.segments) ? response.data.segments : [];
        warnings.value = Array.isArray(response.data?.warnings) ? response.data.warnings : [];
        toast.add({
            severity: 'success',
            summary: `Построено сегментов: ${segments.value.length}`,
            life: 3000,
        });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Не удалось построить сегменты', detail: getApiErrorMessage(error), life: 5000 });
    } finally {
        building.value = false;
    }
};

const createSeries = async () => {
    if (!seriesForm.title.trim()) {
        toast.add({ severity: 'error', summary: 'Укажите название серии', life: 3000 });
        return;
    }

    if (!canCreate.value) {
        toast.add({ severity: 'error', summary: 'Нет права на создание серий', life: 3000 });
        return;
    }

    saving.value = true;
    try {
        const id = seriesForm.id.trim() || `series-${Date.now()}`;
        await createAdminSeriesFromTemplate({
            series: {
                id,
                title: seriesForm.title.trim(),
                templateId: String(seriesForm.templateId || '').trim() || null,
                status: seriesForm.status,
                createdBy: null,
                surveys: [],
            },
            segments: JSON.parse(JSON.stringify(segments.value)),
        });
        seriesForm.id = id;
        toast.add({ severity: 'success', summary: 'Серия создана', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Не удалось создать серию', detail: getApiErrorMessage(error), life: 5000 });
    } finally {
        saving.value = false;
    }
};

const publishSeries = async () => {
    if (!canUpdate.value) {
        toast.add({ severity: 'error', summary: 'Нет права на публикацию серий', life: 3000 });
        return;
    }

    publishing.value = true;
    try {
        await publishAdminSeries(seriesForm.id.trim(), []);
        toast.add({ severity: 'success', summary: 'Серия опубликована', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Не удалось опубликовать серию', detail: getApiErrorMessage(error), life: 5000 });
    } finally {
        publishing.value = false;
    }
};

const closeSeries = async () => {
    if (!canUpdate.value) {
        toast.add({ severity: 'error', summary: 'Нет права на закрытие серий', life: 3000 });
        return;
    }

    closing.value = true;
    try {
        await closeAdminSeries(seriesForm.id.trim(), []);
        toast.add({ severity: 'success', summary: 'Серия закрыта', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Не удалось закрыть серию', detail: getApiErrorMessage(error), life: 5000 });
    } finally {
        closing.value = false;
    }
};

onMounted(() => {
    loadGroups();
    loadTemplates();
});
</script>

<style scoped>
.electives-page { display: flex; flex-direction: column; gap: 1rem; }
.admin-panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.admin-panel-head h3 { margin: 0.55rem 0 0; }
.admin-panel-head p { margin: 0.35rem 0 0; color: var(--p-grey-1); max-width: 720px; }
.admin-panel-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.electives-layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 1rem; align-items: start; }
.electives-main { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
.electives-aside { display: flex; flex-direction: column; gap: 1rem; position: sticky; top: 1rem; }
.admin-card { display: flex; flex-direction: column; gap: 1rem; padding: 1.15rem; border: 1px solid rgba(var(--p-blue-500-rgb), 0.12); border-radius: 16px; background: color-mix(in srgb, var(--p-content-background) 94%, var(--p-primary-color) 6%); }
.admin-card h4 { margin: 0; font-size: 1.02rem; line-height: 1.3; }
.admin-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; }
.admin-card-head p { margin: 0.25rem 0 0; color: var(--p-grey-1); font-size: 0.8rem; }
.electives-step-head { display: flex; align-items: flex-start; gap: 0.7rem; }
.electives-step-title { display: flex; align-items: flex-start; gap: 0.7rem; }
.electives-step-number { display: grid; place-items: center; flex: 0 0 2rem; width: 2rem; height: 2rem; border-radius: 50%; background: rgba(var(--p-blue-500-rgb), 0.12); color: var(--p-primary-color); font-weight: 800; font-size: 0.85rem; }
.admin-form { display: flex; flex-direction: column; gap: 1rem; }
.admin-field { display: flex; flex-direction: column; gap: 0.35rem; min-width: 0; }
.admin-form label, .admin-field label { font-size: 0.86rem; font-weight: 600; line-height: 1.3; color: var(--p-text-color); }
.admin-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem 1.15rem; }
.admin-checkbox-row { display: flex; align-items: center; gap: 0.55rem; padding: 0.65rem 0.75rem; border-radius: 12px; background: rgba(var(--p-blue-500-rgb), 0.04); }
.admin-checkbox-row label { font-size: 0.85rem; font-weight: 500; cursor: pointer; }
.admin-checkbox-row.compact { padding: 0; background: transparent; }
.group-filters { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }
.group-filters .p-inputtext { min-width: 220px; }
.selected-groups { display: flex; flex-wrap: wrap; gap: 0.4rem; padding: 0.65rem; border-radius: 12px; background: rgba(var(--p-blue-500-rgb), 0.04); }
.selected-group-chip { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.6rem; border: 1px solid rgba(var(--p-blue-500-rgb), 0.2); border-radius: 999px; background: var(--p-content-background); color: var(--p-primary-color); font-size: 0.78rem; font-weight: 600; cursor: pointer; }
.selected-group-chip:hover { background: rgba(var(--p-blue-500-rgb), 0.1); }
.selected-group-chip .pi { font-size: 0.65rem; }
.group-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 0.4rem; max-height: 360px; overflow-y: auto; padding: 0.15rem; }
.group-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.55rem 0.65rem; border-radius: 10px; border: 1px solid transparent; cursor: pointer; }
.group-item:hover { background: rgba(var(--p-blue-500-rgb), 0.05); border-color: rgba(var(--p-blue-500-rgb), 0.12); }
.group-item--selected { background: rgba(var(--p-blue-500-rgb), 0.09); border-color: rgba(var(--p-blue-500-rgb), 0.2); }
.group-name { font-weight: 600; font-size: 0.84rem; }
.group-meta { margin-left: auto; color: var(--p-grey-1); font-size: 0.72rem; text-align: right; }
.admin-empty { display: flex; align-items: center; justify-content: center; gap: 0.45rem; padding: 1.25rem; color: var(--p-grey-1); }
.warnings { display: flex; flex-direction: column; gap: 0.35rem; }
.warning-item { display: flex; align-items: center; gap: 0.45rem; padding: 0.55rem 0.7rem; border-radius: 10px; background: rgba(var(--p-orange-500-rgb, 245, 158, 11), 0.08); color: var(--p-orange-500); font-size: 0.8rem; }
.electives-summary { gap: 0.65rem; }
.electives-summary h4 { padding-bottom: 0.6rem; border-bottom: 1px solid rgba(var(--p-blue-500-rgb), 0.12); }
.summary-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; font-size: 0.84rem; }
.summary-row > span { color: var(--p-grey-1); }
.summary-row > strong { text-align: right; word-break: break-word; }
.summary-actions { display: flex; flex-direction: column; gap: 0.5rem; padding-top: 0.75rem; border-top: 1px dashed var(--p-grey-4); }
.summary-actions .p-button { width: 100%; }
.electives-help ol { margin: 0; padding-left: 1.2rem; display: flex; flex-direction: column; gap: 0.45rem; color: var(--p-grey-1); font-size: 0.82rem; }
@media (max-width: 1100px) {
    .electives-layout { grid-template-columns: 1fr; }
    .electives-aside { position: static; order: -1; }
    .summary-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
}
@media (max-width: 700px) {
    .admin-form-grid { grid-template-columns: 1fr; }
}
</style>
