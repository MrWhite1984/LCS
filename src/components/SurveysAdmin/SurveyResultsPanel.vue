<template>
    <div class="results-panel">
        <div class="results-head">
            <div>
                <h4>Результаты</h4>
                <p v-if="!surveyId && !seriesId">Выберите опрос или серию.</p>
            </div>
            <div class="results-actions">
                <Button label="Обновить" icon="pi pi-refresh" outlined severity="secondary" :loading="loading" @click="loadAll" />
                <Button label="Экспорт" icon="pi pi-download" outlined @click="exportResults" />
            </div>
        </div>

        <div class="results-filters">
            <InputText v-model="filters.group" placeholder="Группа" />
            <InputText v-model="filters.userSearch" placeholder="Поиск пользователя" />
            <Select v-model="filters.status" :options="responseStatusOptions" optionLabel="label" optionValue="value" placeholder="Статус" showClear />
            <Select v-model="filters.format" :options="formatOptions" optionLabel="label" optionValue="value" />
            <Button label="Применить" icon="pi pi-filter" @click="applyFilters" />
            <Button label="Сбросить" icon="pi pi-filter-slash" text severity="secondary" @click="resetFilters" />
        </div>

        <div v-if="progress" class="results-progress">
            <article><small>Всего</small><strong>{{ progress.totalAudience }}</strong></article>
            <article><small>Ответили</small><strong>{{ progress.answered }}</strong></article>
            <article><small>Предупреждение</small><strong>{{ progress.warning }}</strong></article>
            <article><small>Просрочено</small><strong>{{ progress.overdue }}</strong></article>
            <article><small>Не ответили</small><strong>{{ progress.notAnswered }}</strong></article>
        </div>

        <DataTable
            :value="tableRows"
            :loading="loading"
            dataKey="userId"
            paginator
            lazy
            :first="(filters.page - 1) * filters.pageSize"
            :rows="filters.pageSize"
            :totalRecords="responsesTotal"
            :rowsPerPageOptions="[10, 20, 50, 100]"
            showGridlines
            stripedRows
            scrollable
            scrollHeight="60vh"
            class="results-table"
            @page="onPage"
        >
            <Column header="#" style="width: 3.5rem; text-align: center">
                <template #body="{ data }">{{ data.rowNumber }}</template>
            </Column>
            <Column header="ФИО" style="min-width: 220px">
                <template #body="{ data }">{{ data.userName || '—' }}</template>
            </Column>
            <Column header="Группа" style="min-width: 130px">
                <template #body="{ data }">{{ data.group || '—' }}</template>
            </Column>
            <Column header="Статус" style="min-width: 130px">
                <template #body="{ data }">
                    <Tag :value="statusLabel(data.status)" :severity="statusSeverity(data.status)" />
                </template>
            </Column>
            <Column header="Отправлено" style="min-width: 170px">
                <template #body="{ data }">{{ formatDateRuLongWithTime(data.submittedAt) }}</template>
            </Column>

            <Column
                v-for="(question, index) in tableQuestions"
                :key="question.id"
                style="min-width: 220px"
            >
                <template #header>
                    <div class="results-question-header">
                        {{ index + 1 }}. {{ question.title || question.id }}
                    </div>
                </template>
                <template #body="{ data }">
                    <span class="results-answer">{{ formatAnswer(data, question) }}</span>
                </template>
            </Column>

            <template #empty>
                Ответов пока нет.
            </template>
        </DataTable>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { formatDateRuLongWithTime, formatDateRuShort } from '@/utils/date.js';
import { getApiErrorMessage } from '@/utils/apiErrors.js';
import { usePermissionStore } from '@/stores/permissions.js';
import {
    exportAdminResults,
    getAdminAllSurvey,
    getAdminProgress,
    getAdminResponses,
    getAdminSeriesById,
    getAdminSurvey,
} from '@/api/surveysAdmin.js';

const props = defineProps({
    surveyId: { type: String, default: '' },
    seriesId: { type: String, default: '' },
    initialQuestions: { type: Array, default: () => [] },
});

const toast = useToast();
const permissionStore = usePermissionStore();
const canManageAll = computed(() => permissionStore.hasPermission('SurveysAdmin', 'ManageAll'));
const loading = ref(false);
const progress = ref(null);
const responses = ref([]);
const responsesTotal = ref(0);
const questions = ref([]);
const loadedQuestionsKey = ref('');

const filters = ref({
    group: '',
    userSearch: '',
    status: '',
    page: 1,
    pageSize: 20,
    format: 'csv',
});

const responseStatusOptions = [
    { label: 'Не начат', value: 'not_started' },
    { label: 'В процессе', value: 'in_progress' },
    { label: 'Заполнен', value: 'filled' },
];

const responseStatusLabels = {
    not_started: 'Не начат',
    in_progress: 'В процессе',
    filled: 'Заполнен',
    unspecified: 'Неизвестно',
};

const responseStatusSeverities = {
    not_started: 'secondary',
    in_progress: 'info',
    filled: 'success',
    unspecified: 'contrast',
};

const formatOptions = [
    { label: 'CSV', value: 'csv' },
    { label: 'XLSX', value: 'xlsx' },
];

const statusLabel = (status) => responseStatusLabels[status] || status || '—';
const statusSeverity = (status) => responseStatusSeverities[status] || 'secondary';

const tableQuestions = computed(() => (
    questions.value.filter((question) => question.type !== 'heading')
));

const tableRows = computed(() => responses.value.map((row, index) => ({
    ...row,
    rowNumber: (filters.value.page - 1) * filters.value.pageSize + index + 1,
    answersById: Object.fromEntries((row.answers || []).map((answer) => [answer.questionId, answer])),
})));

const buildResponseParams = () => ({
    ...(props.surveyId ? { surveyId: props.surveyId } : { seriesId: props.seriesId }),
    ...(filters.value.group.trim() ? { group: filters.value.group.trim() } : {}),
    ...(filters.value.userSearch.trim() ? { userSearch: filters.value.userSearch.trim() } : {}),
    ...(filters.value.status ? { status: filters.value.status } : {}),
    page: filters.value.page || 1,
    pageSize: filters.value.pageSize || 20,
});

const fetchSurveyQuestions = async (surveyId) => {
    const response = canManageAll.value
        ? await getAdminAllSurvey(surveyId)
        : await getAdminSurvey(surveyId);

    return Array.isArray(response.data?.questions) ? response.data.questions : [];
};

const loadQuestions = async () => {
    const key = props.surveyId || props.seriesId;
    if (!key) {
        questions.value = [];
        loadedQuestionsKey.value = '';
        return;
    }

    if (props.initialQuestions.length) {
        questions.value = [...props.initialQuestions];
        loadedQuestionsKey.value = key;
        return;
    }

    if (loadedQuestionsKey.value === key) return;

    const byId = new Map();
    const addQuestions = (items) => {
        (items || []).forEach((question) => {
            if (question?.id && !byId.has(question.id)) {
                byId.set(question.id, {
                    ...question,
                    title: question.title || `Вопрос ${question.id}`,
                });
            }
        });
    };

    try {
        if (props.surveyId) {
            addQuestions(await fetchSurveyQuestions(props.surveyId));
        } else {
            const seriesResponse = await getAdminSeriesById(props.seriesId);
            const surveys = Array.isArray(seriesResponse.data?.surveys) ? seriesResponse.data.surveys : [];
            const questionResponses = await Promise.allSettled(
                surveys.map((survey) => fetchSurveyQuestions(survey.id)),
            );

            questionResponses.forEach((response) => {
                if (response.status === 'fulfilled') {
                    addQuestions(response.value);
                }
            });
        }
    } catch {
        // Ниже используем fallback по questionId из ответов.
    }

    questions.value = [...byId.values()].sort((a, b) => (a.position || 0) - (b.position || 0));
    loadedQuestionsKey.value = questions.value.length > 0 ? key : '';
};

const collectFallbackQuestions = () => {
    if (questions.value.length > 0) return;

    const byId = new Map();
    responses.value.forEach((row) => {
        (row.answers || []).forEach((answer) => {
            if (answer.questionId && !byId.has(answer.questionId)) {
                byId.set(answer.questionId, {
                    id: answer.questionId,
                    title: `Вопрос ${answer.questionId}`,
                    type: 'text',
                    position: byId.size + 1,
                });
            }
        });
    });

    questions.value = [...byId.values()];
};

const formatAnswerDate = (value) => {
    if (!value) return '';
    const formatted = formatDateRuShort(value, '');
    return formatted || value;
};

const formatAnswer = (row, question) => {
    const answer = row.answersById?.[question.id];
    if (!answer) return '—';

    const choiceLabels = (answer.valueChoices || [])
        .map((choice) => choice.label || choice.optionId)
        .filter(Boolean);

    const optionLabel = (value) => (
        question.options?.find((option) => option.id === value)?.label || value
    );

    if (question.type === 'multi') {
        return choiceLabels.length ? choiceLabels.join(', ') : (answer.valueText || '—');
    }

    if (['single', 'select', 'yes_no'].includes(question.type)) {
        return choiceLabels[0] || (answer.valueText ? optionLabel(answer.valueText) : '—');
    }

    if (['scale', 'rating', 'number', 'integer'].includes(question.type)) {
        return answer.valueNumeric !== null && answer.valueNumeric !== undefined
            ? answer.valueNumeric
            : (answer.valueText || '—');
    }

    if (question.type === 'date') {
        return formatAnswerDate(answer.valueText) || '—';
    }

    return answer.valueText || choiceLabels.join(', ') || '—';
};

const loadAll = async () => {
    if (!props.surveyId && !props.seriesId) return;

    loading.value = true;

    try {
        const [responsesResponse, progressResponse] = await Promise.all([
            getAdminResponses(buildResponseParams()),
            props.surveyId
                ? getAdminProgress(props.surveyId).catch(() => null)
                : Promise.resolve(null),
        ]);

        responses.value = Array.isArray(responsesResponse.data?.responses)
            ? responsesResponse.data.responses
            : [];
        responsesTotal.value = Number(responsesResponse.data?.total || 0);
        progress.value = progressResponse?.data || null;

        await loadQuestions();
        collectFallbackQuestions();
    } catch (error) {
        progress.value = null;
        responses.value = [];
        responsesTotal.value = 0;
        questions.value = [];
        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить результаты',
            detail: getApiErrorMessage(error),
            life: 4000,
        });
    } finally {
        loading.value = false;
    }
};

const applyFilters = () => {
    filters.value.page = 1;
    loadAll();
};

const onPage = (event) => {
    filters.value.page = event.page + 1;
    filters.value.pageSize = event.rows;
    loadAll();
};

const resetFilters = () => {
    filters.value = {
        group: '',
        userSearch: '',
        status: '',
        page: 1,
        pageSize: 20,
        format: 'csv',
    };
    loadAll();
};

const exportResults = async () => {
    if (!props.surveyId && !props.seriesId) return;

    try {
        const response = await exportAdminResults({
            ...buildResponseParams(),
            format: filters.value.format,
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.download = `survey-results-${props.surveyId || props.seriesId}.${filters.value.format}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Не удалось выгрузить результаты',
            detail: getApiErrorMessage(error),
            life: 4000,
        });
    }
};

watch(() => [props.surveyId, props.seriesId], () => {
    loadedQuestionsKey.value = '';
    questions.value = [];
    filters.value.page = 1;
    loadAll();
});

onMounted(loadAll);
</script>

<style scoped>
.results-panel { display: flex; flex-direction: column; gap: 1rem; }
.results-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; }
.results-head h4 { margin: 0; }
.results-head p { margin: 0.25rem 0 0; color: var(--p-grey-1); }
.results-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.results-filters { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; padding: 0.65rem; border: 1px dashed rgba(var(--p-blue-500-rgb), 0.16); border-radius: 12px; background: rgba(var(--p-blue-500-rgb), 0.03); }
.results-filters .p-inputtext,
.results-filters .p-select { min-width: 9rem; }
.results-progress { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 0.6rem; }
.results-progress article { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.75rem; border-radius: 12px; background: rgba(var(--p-blue-500-rgb), 0.06); }
.results-progress small { color: var(--p-grey-1); font-size: 0.72rem; }
.results-progress strong { font-size: 1.1rem; }
.results-table { width: 100%; }
.results-question-header { min-width: 180px; max-width: 260px; white-space: normal; line-height: 1.3; font-weight: 650; }
.results-answer { display: block; min-width: 180px; max-width: 360px; white-space: pre-wrap; word-break: break-word; line-height: 1.4; }
.results-table :deep(.p-datatable-tbody > tr > td) { vertical-align: top; }
@media (max-width: 900px) { .results-progress { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
