<template>
    <main class="erb-page">
        <section class="erb-shell">
            <header class="erb-header">
                <div class="erb-copy">
                    <Tag rounded severity="info">Портфолио</Tag>
                    <h2>Электронная зачётка</h2>
                    <p v-if="selectedGroup">
                        {{ selectedGroup.groupName || 'Группа не указана'
                            }}{{ selectedGroup.course ? ` · ${selectedGroup.course} курс` : ''
                            }}{{ selectedGroup.specialtyCode ? ` · ${selectedGroup.specialtyCode}${selectedGroup.specialtyName ? ` ${selectedGroup.specialtyName}` : ''}` : '' }}
                    </p>
                    <p v-else>Успеваемость, оценки и академические результаты по ведомостям.</p>
                </div>

                <div class="erb-actions">
                    <Button
                        icon="pi pi-refresh"
                        label="Обновить"
                        outlined
                        severity="secondary"
                        :loading="gradesLoading"
                        @click="loadGrades"
                    />
                </div>
            </header>

            <!-- Состояния загрузки/ошибки групп -->
            <section v-if="groupsLoading" class="erb-empty-state">
                <ProgressSpinner style="width: 2.5rem; height: 2.5rem;" />
                <h4>Загрузка данных…</h4>
            </section>

            <section v-else-if="groupsError" class="erb-empty-state">
                <i class="pi pi-exclamation-triangle"></i>
                <h4>Не удалось загрузить зачётку</h4>
                <p>{{ groupsErrorDetail || 'Проверьте связь с системой UMU и попробуйте позже.' }}</p>
            </section>

            <section v-else-if="!groups.length" class="erb-empty-state">
                <i class="pi pi-id-card"></i>
                <h4>Записи не найдены</h4>
                <p>В системе UMU не найдено учебных записей для вашего аккаунта.</p>
            </section>

            <template v-else-if="selectedGroup">
                <section class="erb-card">
                    <div class="erb-card-head">
                        <div class="erb-semester-title">
                            <h3>{{ semesterHeading }}</h3>
                            <Tag v-if="yearHeading" severity="contrast" :value="yearHeading" />
                        </div>
                        <div class="erb-card-head-actions">
                            <Button
                                icon="pi pi-filter"
                                label="Фильтры"
                                outlined
                                severity="secondary"
                                :class="{ 'erb-filter-toggle--active': showFilters }"
                                :badge="activeFilterCount ? String(activeFilterCount) : undefined"
                                @click="showFilters = !showFilters"
                            />
                            <Tag :value="`Дисциплин: ${currentGrades.length}`" severity="contrast" />
                        </div>
                    </div>

                    <div v-if="showFilters" class="erb-filters">
                        <div v-if="groups.length > 1" class="erb-filter-field">
                            <label>Группа</label>
                            <Select
                                :modelValue="selectedGroup"
                                :options="groups"
                                optionLabel="groupName"
                                placeholder="Выбрать группу"
                                @update:modelValue="selectGroup"
                            >
                                <template #option="{ option }">
                                    <div class="erb-group-option">
                                        <strong>{{ option.groupName || 'Без названия' }}</strong>
                                        <small>{{
                                            [
                                                option.course ? `${option.course} курс` : null,
                                                option.specialtyCode
                                                    ? `${option.specialtyCode}${option.specialtyName ? ` ${option.specialtyName}` : ''}`
                                                    : null,
                                            ].filter(Boolean).join(' · ') || 'Учебная запись'
                                        }}</small>
                                    </div>
                                </template>
                            </Select>
                        </div>
                        <div class="erb-filter-field">
                            <label>Семестр</label>
                            <Select
                                v-model="selectedSemester"
                                :options="semesterOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Текущий семестр"
                            />
                        </div>
                        <div class="erb-filter-field">
                            <label>Дата экзамена с</label>
                            <DatePicker
                                v-model="fromDate"
                                dateFormat="dd.mm.yy"
                                placeholder="Выбрать"
                                :showButtonBar="true"
                            />
                        </div>
                        <div class="erb-filter-field">
                            <label>Дата экзамена по</label>
                            <DatePicker
                                v-model="toDate"
                                dateFormat="dd.mm.yy"
                                placeholder="Выбрать"
                                :showButtonBar="true"
                            />
                        </div>
                        <div class="erb-filter-field">
                            <label>Дисциплина</label>
                            <InputText
                                v-model="discipline"
                                placeholder="Поиск по названию"
                                @keydown.enter="loadGrades"
                            />
                        </div>
                        <div class="erb-filter-actions">
                            <Button
                                label="Применить"
                                icon="pi pi-check"
                                :loading="gradesLoading"
                                @click="loadGrades"
                            />
                            <Button
                                label="Сбросить"
                                icon="pi pi-filter-slash"
                                severity="secondary"
                                text
                                @click="resetFilters"
                            />
                        </div>
                    </div>

                    <div v-if="gradesLoading" class="erb-empty-state">
                        <ProgressSpinner style="width: 2.5rem; height: 2.5rem;" />
                        <h4>Загрузка оценок…</h4>
                    </div>

                    <div v-else-if="!currentGrades.length" class="erb-empty-state">
                        <i class="pi pi-inbox"></i>
                        <h4>Оценки не найдены</h4>
                        <p>{{ hasActiveFilters ? 'Измените параметры фильтрации.' : 'За текущий семестр оценок пока нет.' }}</p>
                    </div>

                    <div v-else class="erb-subjects-grid">
                        <article
                            v-for="data in currentGrades"
                            :key="data.vedomostId"
                            class="erb-subject-card"
                        >
                            <div class="erb-subject-card-title">
                                <strong>{{ data.discipline || 'Без названия' }}</strong>
                                <small v-if="data.vedomostType">{{ data.vedomostType }}</small>
                            </div>

                            <div class="erb-subject-card-meta">
                                <span><i class="pi pi-user"></i>{{ data.teacher || '—' }}</span>
                                <span><i class="pi pi-calendar"></i>{{ formatDateRuShort(data.examDate) }}</span>
                            </div>

                            <div class="erb-subject-stats">
                                <div class="erb-stat">
                                    <small>Оценка</small>
                                    <Tag
                                        v-if="gradeText(data.gradeValue)"
                                        severity="success"
                                        :value="gradeText(data.gradeValue)"
                                    />
                                    <span v-else>—</span>
                                </div>
                                <div class="erb-stat">
                                    <small>Экзамен</small>
                                    <Tag
                                        v-if="gradeText(data.examGrade)"
                                        severity="info"
                                        :value="gradeText(data.examGrade)"
                                    />
                                    <span v-else>—</span>
                                </div>
                                <div class="erb-stat">
                                    <small>Итог</small>
                                    <Tag
                                        v-if="gradeText(data.total)"
                                        severity="contrast"
                                        :value="gradeText(data.total)"
                                    />
                                    <span v-else>—</span>
                                </div>
                                <div class="erb-stat">
                                    <small>Баллы</small>
                                    <span>{{ data.totalPercent != null ? data.totalPercent : '—' }}</span>
                                </div>
                            </div>

                            <div class="erb-subject-cp">
                                <div class="erb-subject-cp-head">
                                    <h5>Контрольные точки</h5>
                                    <Tag
                                        :value="String(data.controlPoints?.length || 0)"
                                        severity="secondary"
                                    />
                                </div>
                                <div v-if="data.controlPoints?.length" class="erb-cp-list">
                                    <div
                                        v-for="cp in data.controlPoints"
                                        :key="cp.id ?? cp.number"
                                        class="erb-cp-row"
                                    >
                                        <span class="erb-cp-title">
                                            {{ cp.name || `Контрольная точка ${cp.number}` }}<span class="erb-cp-pct"> · {{ cp.weight ?? 0 }}%</span>
                                        </span>
                                        <span class="erb-cp-score">{{ cp.ratingTotal ?? '—' }}</span>
                                        <span class="erb-cp-date">{{ formatDateRuShort(cp.date) }}</span>
                                        <div class="erb-cp-breakdown">
                                            <div class="erb-cp-cat">
                                                <small>Лекции · {{ cp.weightLectures ?? 0 }}%</small>
                                                <span>{{ cp.ratingLectures ?? 0 }}</span>
                                            </div>
                                            <div class="erb-cp-cat">
                                                <small>Лабораторные работы · {{ cp.weightLabs ?? 0 }}%</small>
                                                <span>{{ cp.ratingLabs ?? 0 }}</span>
                                            </div>
                                            <div class="erb-cp-cat">
                                                <small>Практики · {{ cp.weightPractice ?? 0 }}%</small>
                                                <span>{{ cp.ratingPractice ?? 0 }}</span>
                                            </div>
                                            <div class="erb-cp-cat">
                                                <small>Другое · {{ cp.weightOther ?? 0 }}%</small>
                                                <span>{{ cp.ratingOther ?? 0 }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p v-else class="erb-cp-empty">Контрольные точки отсутствуют.</p>
                            </div>
                        </article>
                    </div>
                </section>
            </template>
        </section>
    </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { formatDateRuShort } from '@/utils/date.js';
import { getMyUmuGroups, getMyUmuGrades } from '@/api/umu.js';

const toast = useToast();

const groups = ref([]);
const groupsLoading = ref(false);
const groupsError = ref(false);
const groupsErrorDetail = ref('');

const selectedGroup = ref(null);

const gradesData = ref(null);
const gradesLoading = ref(false);

const showFilters = ref(false);
const selectedSemester = ref(null);
const fromDate = ref(null);
const toDate = ref(null);
const discipline = ref('');

const currentGrades = computed(() => gradesData.value?.grades || []);

const semesterOptions = computed(() => {
    const sems = gradesData.value?.semesters || [];
    return [
        { label: 'Текущий семестр', value: null },
        ...sems.map((s) => ({ label: `Семестр ${s}`, value: s })),
    ];
});

const semesterHeading = computed(() => {
    if (selectedSemester.value != null) return `Семестр ${selectedSemester.value}`;
    if (gradesData.value?.currentSemester) return `Текущий семестр (${gradesData.value.currentSemester})`;
    return 'Текущий семестр';
});

const yearHeading = computed(() => {
    if (selectedSemester.value != null) {
        const match = currentGrades.value.find((g) => g.semester === selectedSemester.value);
        return match?.year || '';
    }
    return gradesData.value?.currentYear || '';
});

const activeFilterCount = computed(() => [
    selectedSemester.value != null ? selectedSemester.value : null,
    fromDate.value,
    toDate.value,
    String(discipline.value || '').trim() || null,
].filter((v) => v !== null && v !== '').length);

const hasActiveFilters = computed(() => activeFilterCount.value > 0);

const gradeText = (gradeValue) => {
    if (!gradeValue) return '';
    return gradeValue.shortText || gradeValue.text || '';
};

const buildGradesParams = () => {
    const params = { studentId: selectedGroup.value.studentId };

    if (selectedSemester.value != null) {
        params.semester = selectedSemester.value;
        params.latestSemester = false;
    } else {
        params.latestSemester = true;
    }

    if (fromDate.value) params.fromDate = fromDate.value.toISOString();
    if (toDate.value) params.toDate = toDate.value.toISOString();
    if (String(discipline.value || '').trim()) params.discipline = String(discipline.value).trim();

    return params;
};

const loadGrades = async () => {
    if (!selectedGroup.value) return;

    gradesLoading.value = true;

    try {
        const response = await getMyUmuGrades(buildGradesParams());
        gradesData.value = Array.isArray(response.data) ? (response.data[0] ?? null) : null;
    } catch (error) {
        gradesData.value = null;
        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить оценки',
            detail: error?.response?.data?.title || error?.response?.data?.message || 'Попробуйте позже.',
            life: 3500,
        });
    } finally {
        gradesLoading.value = false;
    }
};

const selectGroup = async (group) => {
    selectedGroup.value = group;
    // При смене группы сбрасываем фильтры к текущему семестру.
    selectedSemester.value = null;
    fromDate.value = null;
    toDate.value = null;
    discipline.value = '';
    await loadGrades();
};

const resetFilters = async () => {
    selectedSemester.value = null;
    fromDate.value = null;
    toDate.value = null;
    discipline.value = '';
    await loadGrades();
};

const loadGroups = async () => {
    groupsLoading.value = true;
    groupsError.value = false;
    groupsErrorDetail.value = '';

    try {
        const response = await getMyUmuGroups();
        groups.value = Array.isArray(response.data) ? response.data : [];

        if (groups.value.length > 0) {
            // По умолчанию выбираем запись с наибольшим studentId
            // (как правило, самая свежая учебная запись).
            const defaultGroup = groups.value.reduce((max, g) => (
                (g?.studentId ?? -Infinity) > (max?.studentId ?? -Infinity) ? g : max
            ));
            await selectGroup(defaultGroup);
        }
    } catch (error) {
        groups.value = [];
        groupsError.value = true;
        const status = error?.response?.status;
        groupsErrorDetail.value = status === 403
            ? 'У вашего аккаунта нет связи с системой UMU.'
            : (error?.response?.data?.title || error?.response?.data?.message || '');
        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить группы',
            detail: groupsErrorDetail.value || 'Попробуйте позже.',
            life: 3500,
        });
    } finally {
        groupsLoading.value = false;
    }
};

onMounted(loadGroups);
</script>

<style scoped>
.erb-page {
    --erb-border: rgba(var(--p-blue-500-rgb), 0.14);
    min-height: 100%;
    padding: 10px;
}

.erb-shell {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 100%;
    padding: 1.25rem;
    border-radius: 20px;
    border: 1px solid var(--erb-border);
    background:
        radial-gradient(1000px 220px at 0% 0%, rgba(var(--p-blue-500-rgb), 0.08), transparent 60%),
        linear-gradient(180deg, var(--p-bg-color-2) 0%, var(--p-bg-color-1) 100%);
    box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
}

.erb-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
}

.erb-copy h2 { margin: 0.75rem 0 0; }
.erb-copy p {
    margin: 0.65rem 0 0;
    max-width: 70ch;
    color: var(--p-grey-1);
    line-height: 1.5;
}

.erb-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.erb-card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.15rem;
    border-radius: 18px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.1);
    background:
        linear-gradient(180deg,
            color-mix(in srgb, var(--p-content-background) 96%, var(--p-primary-color) 4%),
            color-mix(in srgb, var(--p-content-background) 90%, var(--p-primary-color) 10%));
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}

.erb-card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.erb-semester-title {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.erb-semester-title h3 { margin: 0; }

.erb-card-head-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.erb-filter-toggle--active {
    border-color: var(--p-primary-color);
    color: var(--p-primary-color);
}

.erb-filters {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.85rem;
    align-items: end;
    padding: 0.85rem;
    border-radius: 14px;
    border: 1px dashed var(--erb-border);
    background: rgba(var(--p-blue-500-rgb), 0.03);
}

/* Анти-overflow: grid-элементы не растягивают контейнер */
.erb-filters > * {
    min-width: 0;
}

.erb-filters :deep(.p-select),
.erb-filters :deep(.p-datepicker),
.erb-filters :deep(.p-inputtext) {
    width: 100%;
}

.erb-filter-field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.erb-filter-field label {
    font-size: 0.78rem;
    color: var(--p-grey-1);
}

.erb-group-option {
    display: flex;
    flex-direction: column;
    gap: 0.12rem;
}

.erb-group-option small {
    color: var(--p-text-muted-color, var(--p-grey-2));
    font-size: 0.74rem;
}

.erb-filter-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
}

/* Сетка карточек предметов — в стиле расписания */
.erb-subjects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(clamp(260px, 45vw, 340px), 1fr));
    gap: 0.75rem;
    margin-top: 0.75rem;
}

.erb-subject-card {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 1rem;
    border: 1px solid var(--p-grey-4);
    border-radius: 1rem;
    background: var(--p-bg-color-1);
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.erb-subject-card:hover {
    border-color: color-mix(in srgb, var(--p-primary-color) 48%, transparent);
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.erb-subject-card-title {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
}

.erb-subject-card-title strong {
    font-size: 1.02rem;
    font-weight: 750;
    line-height: 1.25;
}

.erb-subject-card-title small {
    color: var(--p-text-muted-color, var(--p-grey-2));
    font-size: 0.76rem;
}

.erb-subject-card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1rem;
    color: var(--p-text-muted-color, var(--p-grey-2));
    font-size: 0.82rem;
}

.erb-subject-card-meta span {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-width: 0;
}

.erb-subject-card-meta i {
    font-size: 0.8rem;
    color: var(--p-primary-color);
}

.erb-subject-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.5rem;
    padding-top: 0.55rem;
    border-top: 1px solid var(--p-grey-4);
}

.erb-stat {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    align-items: flex-start;
    min-width: 0;
}

.erb-stat small {
    color: var(--p-text-muted-color, var(--p-grey-2));
    font-size: 0.68rem;
}

.erb-stat span {
    font-weight: 700;
    font-size: 0.9rem;
}

.erb-subject-cp {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 0.6rem;
    border-top: 1px dashed var(--p-grey-4);
}

.erb-subject-cp-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.erb-subject-cp-head h5 {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 750;
}

.erb-cp-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.erb-cp-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem 0.6rem;
    padding: 0.5rem 0.65rem;
    border-radius: 0.6rem;
    background: color-mix(in srgb, var(--p-primary-color) 4%, var(--p-bg-color-2));
    font-size: 0.8rem;
}

.erb-cp-title {
    flex: 1 1 60%;
    min-width: 0;
    overflow: hidden;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.erb-cp-pct {
    color: var(--p-text-muted-color, var(--p-grey-2));
    font-weight: 500;
}

.erb-cp-date,
.erb-cp-score {
    flex: 0 0 auto;
    color: var(--p-text-muted-color, var(--p-grey-2));
    white-space: nowrap;
}

.erb-cp-score {
    font-weight: 700;
    color: var(--p-primary-color);
}

.erb-cp-empty { color: var(--p-grey-1); margin: 0; }

.erb-cp-breakdown {
    flex: 1 1 100%;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.4rem;
    margin-top: 0.45rem;
    padding-top: 0.45rem;
    border-top: 1px dashed color-mix(in srgb, var(--p-grey-4) 80%, transparent);
}

.erb-cp-cat {
    display: flex;
    flex-direction: column;
    gap: 0.18rem;
    min-width: 0;
}

.erb-cp-cat small {
    color: var(--p-text-muted-color, var(--p-grey-2));
    font-size: 0.66rem;
}

.erb-cp-cat span {
    font-size: 0.76rem;
    font-weight: 600;
}

.erb-empty-state {
    min-height: 240px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
}

.erb-empty-state i { font-size: 2rem; color: var(--p-grey-1); }
.erb-empty-state h4, .erb-empty-state p { margin: 0; }
.erb-empty-state p { max-width: 48ch; color: var(--p-grey-1); }

@media (max-width: 1100px) {
    .erb-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 768px) {
    .erb-shell { padding: 1rem; }
    .erb-header { flex-direction: column; align-items: stretch; }
    .erb-actions { justify-content: flex-start; }
    .erb-filters { grid-template-columns: minmax(0, 1fr); }

    /* Карточки предметов в одну колонку — как расписание на мобильном */
    .erb-subjects-grid { grid-template-columns: 1fr; }
    .erb-subject-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .erb-cp-breakdown { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .erb-cp-title { flex: 1 1 100%; }
}
</style>