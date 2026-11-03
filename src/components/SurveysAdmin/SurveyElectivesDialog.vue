<template>
    <Dialog
        v-model:visible="visibleModel"
        header="Элективы"
        modal
        :draggable="false"
        class="survey-admin-dialog electives-dialog"
        :style="{ width: '100%', maxWidth: '900px' }"
    >
        <div class="admin-form electives-dialog-body">
            <p class="electives-hint">
                Соберите сегменты из учебных групп UMU: выберите группы, задайте параметры и постройте сегменты.
            </p>

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
                <Checkbox v-model="buildForm.includeFacultatives" binary inputId="electives-include-facultatives" />
                <label for="electives-include-facultatives">Добавить факультативные дисциплины</label>
            </div>

            <div class="admin-form-grid">
                <div class="admin-field">
                    <label>Начало</label>
                    <DatePicker v-model="datesForm.startsAt" dateFormat="dd.mm.yy" showTime class="w-full" />
                </div>
                <div class="admin-field">
                    <label>Окончание</label>
                    <DatePicker v-model="datesForm.endsAt" dateFormat="dd.mm.yy" showTime class="w-full" />
                </div>
            </div>

            <div class="electives-groups-head">
                <div>
                    <strong>Группы UMU</strong>
                    <p>Выбрано: {{ selectedGroups.length }} · Доступно: {{ filteredGroups.length }}</p>
                </div>
                <div class="group-filters">
                    <InputText v-model="groupSearch" placeholder="Поиск по названию" />
                    <Select v-model="facultyFilter" :options="facultyOptions" placeholder="Факультет" showClear class="filter-select" />
                    <Select v-model="courseFilter" :options="courseOptions" optionLabel="label" optionValue="value" placeholder="Курс" showClear class="filter-select" />
                    <div class="admin-checkbox-row compact">
                        <Checkbox v-model="activeOnly" binary inputId="electives-active-only" @update:modelValue="loadGroups" />
                        <label for="electives-active-only">Только текущий год</label>
                    </div>
                    <Button icon="pi pi-refresh" text rounded aria-label="Обновить группы" :loading="loadingGroups" @click="loadGroups" />
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

            <div class="electives-build">
                <Button
                    label="Построить сегменты"
                    icon="pi pi-hammer"
                    :loading="building"
                    :disabled="!selectedGroups.length"
                    @click="buildSegments"
                />
                <span v-if="segments.length" class="electives-built-count">Готово сегментов: {{ segments.length }}</span>
            </div>

            <div v-if="warnings.length" class="warnings">
                <div v-for="warning in warnings" :key="warning" class="warning-item">
                    <i class="pi pi-exclamation-triangle"></i>
                    {{ warning }}
                </div>
            </div>

            <div v-if="segments.length" class="electives-preview">
                <strong>Построенные сегменты</strong>
                <div class="electives-preview-list">
                    <div v-for="segment in segments" :key="segment.key" class="electives-preview-item">
                        <span>{{ segment.title || segment.key }}</span>
                        <Tag :value="`${segment.questions?.length || 0} вопр.`" severity="secondary" />
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Отмена" severity="secondary" text @click="visibleModel = false" />
            <Button label="Применить" icon="pi pi-check" :disabled="!segments.length" @click="applySegments" />
        </template>
    </Dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { getApiErrorMessage } from '@/utils/apiErrors.js';
import { buildAdminElectives, getAdminElectiveGroups } from '@/api/surveysAdmin.js';

const props = defineProps({
    visible: { type: Boolean, default: false },
});

const emit = defineEmits(['update:visible', 'apply']);
const toast = useToast();

const groups = ref([]);
const loadingGroups = ref(false);
const groupsLoaded = ref(false);
const groupSearch = ref('');
const facultyFilter = ref(null);
const courseFilter = ref(null);
const activeOnly = ref(true);
const selectedGroups = ref([]);
const segments = ref([]);
const warnings = ref([]);
const building = ref(false);

const buildForm = reactive({
    includeFacultatives: true,
    facultativeTitle: '',
    electiveTitlePrefix: 'Электив',
});

const datesForm = reactive({
    startsAt: null,
    endsAt: null,
});

const visibleModel = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value),
});

const facultyOptions = computed(() => {
    const values = new Set();
    groups.value.forEach((group) => {
        if (group.faculty) values.add(group.faculty);
    });
    return [...values].sort((a, b) => String(a).localeCompare(String(b), 'ru'));
});

const courseOptions = computed(() => {
    const values = new Set();
    groups.value.forEach((group) => {
        const course = Number(group.course);
        if (Number.isFinite(course) && course > 0) values.add(course);
    });
    return [...values]
        .sort((a, b) => a - b)
        .map((course) => ({ label: `${course} курс`, value: course }));
});

const filteredGroups = computed(() => {
    const query = groupSearch.value.trim().toLowerCase();
    return groups.value
        .filter((group) => !query || String(group.name || '').toLowerCase().includes(query))
        .filter((group) => !facultyFilter.value || group.faculty === facultyFilter.value)
        .filter((group) => courseFilter.value == null || Number(group.course) === courseFilter.value)
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'ru'));
});

const loadGroups = async () => {
    loadingGroups.value = true;
    try {
        const response = await getAdminElectiveGroups({ activeOnly: activeOnly.value });
        groups.value = Array.isArray(response.data) ? response.data : [];
        groupsLoaded.value = true;
        const available = new Set(groups.value.map((group) => group.name));
        selectedGroups.value = selectedGroups.value.filter((name) => available.has(name));

        const availableFaculties = new Set(groups.value.map((group) => group.faculty).filter(Boolean));
        if (facultyFilter.value && !availableFaculties.has(facultyFilter.value)) facultyFilter.value = null;

        const availableCourses = new Set(groups.value.map((group) => Number(group.course)));
        if (courseFilter.value != null && !availableCourses.has(courseFilter.value)) courseFilter.value = null;
    } catch (error) {
        groups.value = [];
        toast.add({ severity: 'error', summary: 'Не удалось загрузить группы UMU', detail: getApiErrorMessage(error), life: 4000 });
    } finally {
        loadingGroups.value = false;
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
    if (datesForm.startsAt && datesForm.endsAt && new Date(datesForm.endsAt) <= new Date(datesForm.startsAt)) {
        toast.add({ severity: 'error', summary: 'Окончание должно быть позже начала', life: 3000 });
        return;
    }

    building.value = true;
    warnings.value = [];
    try {
        const response = await buildAdminElectives({
            groups: selectedGroups.value,
            includeFacultatives: buildForm.includeFacultatives,
            facultativeTitle: buildForm.facultativeTitle || null,
            electiveTitlePrefix: buildForm.electiveTitlePrefix || null,
            startsAt: datesForm.startsAt ? new Date(datesForm.startsAt).toISOString() : null,
            endsAt: datesForm.endsAt ? new Date(datesForm.endsAt).toISOString() : null,
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

const applySegments = () => {
    if (!segments.value.length) return;
    emit('apply', JSON.parse(JSON.stringify(segments.value)));
    visibleModel.value = false;
};

watch(() => props.visible, (visible) => {
    if (!visible) return;
    segments.value = [];
    warnings.value = [];
    datesForm.startsAt = null;
    datesForm.endsAt = null;
    if (!groupsLoaded.value && !loadingGroups.value) loadGroups();
});
</script>

<style scoped>
.electives-dialog-body {
    gap: 0.9rem;
}

.electives-hint {
    margin: 0;
    color: var(--p-grey-1);
    font-size: 0.82rem;
}

.electives-groups-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-top: 0.5rem;
}

.electives-groups-head p {
    margin: 0.25rem 0 0;
    color: var(--p-grey-1);
    font-size: 0.78rem;
}

.group-filters {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
}

.group-filters .p-inputtext {
    min-width: 200px;
}

.group-filters .filter-select {
    min-width: 160px;
}

.admin-checkbox-row {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.65rem 0;
    border-radius: 12px;
    background: rgba(var(--p-blue-500-rgb), 0.04);
}

.admin-checkbox-row label {
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
}

.admin-checkbox-row.compact {
    padding: 0;
    background: transparent;
}

.selected-groups {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    padding: 0.65rem;
    border-radius: 12px;
    background: rgba(var(--p-blue-500-rgb), 0.04);
}

.selected-group-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.6rem;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.2);
    border-radius: 999px;
    background: var(--p-content-background);
    color: var(--p-primary-color);
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
}

.selected-group-chip:hover {
    background: rgba(var(--p-blue-500-rgb), 0.1);
}

.selected-group-chip .pi {
    font-size: 0.65rem;
}

.group-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 0.4rem;
    max-height: 300px;
    overflow-y: auto;
    padding: 0.15rem;
}

.group-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 0.65rem;
    border-radius: 10px;
    border: 1px solid transparent;
    cursor: pointer;
}

.group-item:hover {
    background: rgba(var(--p-blue-500-rgb), 0.05);
    border-color: rgba(var(--p-blue-500-rgb), 0.12);
}

.group-item--selected {
    background: rgba(var(--p-blue-500-rgb), 0.09);
    border-color: rgba(var(--p-blue-500-rgb), 0.2);
}

.group-name {
    font-weight: 600;
    font-size: 0.84rem;
}

.group-meta {
    margin-left: auto;
    color: var(--p-grey-1);
    font-size: 0.72rem;
    text-align: right;
}

.admin-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    padding: 1.25rem;
    color: var(--p-grey-1);
}

.electives-build {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
}

.electives-built-count {
    color: var(--p-grey-1);
    font-size: 0.8rem;
}

.warnings {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.warning-item {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.55rem 0.7rem;
    border-radius: 10px;
    background: rgba(var(--p-orange-500-rgb, 245, 158, 11), 0.08);
    color: var(--p-orange-500);
    font-size: 0.8rem;
}

.electives-preview {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
}

.electives-preview-list {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    max-height: 220px;
    overflow-y: auto;
}

.electives-preview-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.65rem;
    padding: 0.5rem 0.65rem;
    border: 1px solid var(--p-content-border-color);
    border-radius: 10px;
    font-size: 0.82rem;
}

@media (max-width: 700px) {
    .group-filters .p-inputtext,
    .group-filters .filter-select {
        min-width: 0;
    }
}
</style>
