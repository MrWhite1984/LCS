<template>
    <section class="admin-panel">
        <div class="admin-panel-head">
            <div><h3>Результаты опросов</h3><p>Прогресс, агрегаты, ответы и экспорт.</p></div>
        </div>

        <div class="admin-filters">
            <Select v-model="surveyIdInput" :options="surveyOptions" optionLabel="label" optionValue="value" filter editable showClear placeholder="Опрос" />
            <Select v-model="seriesIdInput" :options="seriesOptions" optionLabel="label" optionValue="value" filter editable showClear placeholder="Серия" />
            <Button label="Показать" icon="pi pi-search" @click="applySelection" />
            <Button label="Сбросить" icon="pi pi-filter-slash" severity="secondary" text @click="resetSelection" />
        </div>

        <div v-if="!surveyId && !seriesId" class="admin-empty">
            <i class="pi pi-chart-bar"></i>
            <h4>Выберите опрос или серию</h4>
            <p>После выбора здесь появятся прогресс, агрегаты и ответы.</p>
        </div>

        <SurveyResultsPanel v-else :survey-id="surveyId" :series-id="seriesId" />
    </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import SurveyResultsPanel from '@/components/SurveysAdmin/SurveyResultsPanel.vue';
import { usePermissionStore } from '@/stores/permissions.js';
import { getAdminAllSurveys, getAdminMySurveys, getAdminSeries } from '@/api/surveysAdmin.js';

const permissionStore = usePermissionStore();
const canManageAll = computed(() => permissionStore.hasPermission('SurveysAdmin', 'ManageAll'));

const surveyOptions = ref([]);
const seriesOptions = ref([]);
const surveyIdInput = ref('');
const seriesIdInput = ref('');
const surveyId = ref('');
const seriesId = ref('');

const readId = (value) => {
    if (value && typeof value === 'object') {
        return String(value.value || value.id || '').trim();
    }
    return String(value || '').trim();
};

const applySelection = () => {
    surveyId.value = readId(surveyIdInput.value);
    seriesId.value = surveyId.value ? '' : readId(seriesIdInput.value);
};

const resetSelection = () => {
    surveyIdInput.value = '';
    seriesIdInput.value = '';
    surveyId.value = '';
    seriesId.value = '';
};

const loadOptions = async () => {
    const [surveysResult, seriesResult] = await Promise.allSettled([
        canManageAll.value
            ? getAdminAllSurveys({ page: 1, pageSize: 100 })
            : getAdminMySurveys({ page: 1, pageSize: 100 }),
        getAdminSeries({ page: 1, pageSize: 100 }),
    ]);

    surveyOptions.value = surveysResult.status === 'fulfilled'
        ? (surveysResult.value.data?.surveys || []).map((survey) => ({
            value: survey.id,
            label: survey.title || survey.id,
        }))
        : [];
    seriesOptions.value = seriesResult.status === 'fulfilled'
        ? (seriesResult.value.data?.series || []).map((item) => ({
            value: item.id,
            label: item.title || item.id,
        }))
        : [];
};

onMounted(loadOptions);
</script>

<style scoped>
.admin-panel { display: flex; flex-direction: column; gap: 1rem; }
.admin-panel-head h3 { margin: 0; }
.admin-panel-head p { margin: 0.35rem 0 0; color: var(--p-grey-1); }
.admin-filters { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.75rem; padding: 0.85rem; border-radius: 14px; border: 1px dashed rgba(var(--p-blue-500-rgb), 0.16); background: rgba(var(--p-blue-500-rgb), 0.03); }
.admin-filters > * { min-width: 0; }
.admin-empty { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 2rem; color: var(--p-grey-1); text-align: center; }
.admin-empty i { font-size: 1.8rem; color: var(--p-primary-color); }
@media (max-width: 800px) { .admin-filters { grid-template-columns: 1fr; } }
</style>

