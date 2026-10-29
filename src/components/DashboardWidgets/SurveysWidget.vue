<template>
    <div class="panel-card surveys-overview-card">
        <div class="panel-header">
            <div class="panel-header-main">
                <h3>Опросы</h3>
                <span v-if="!loading && !error" class="surveys-widget-count">
                    {{ surveys.length ? `Доступно: ${surveys.length}` : 'Нет доступных' }}
                </span>
            </div>
            <router-link
                class="panel-header-action"
                to="/surveys"
                aria-label="Перейти к опросам"
                v-tooltip.top="'Перейти к опросам'"
            >
                <i class="pi pi-arrow-up-right"></i>
            </router-link>
        </div>

        <div class="panel-content">
            <div v-if="loading" class="schedule-skeleton">
                <Skeleton v-for="item in 3" :key="`survey-skeleton-${item}`" width="100%" height="2.8rem" borderRadius="10px" />
            </div>

            <AsyncState
                v-else-if="error"
                tone="error"
                icon="pi pi-exclamation-triangle"
                title="Не удалось загрузить опросы"
                description="Попробуйте обновить позже."
                retry
                @retry="fetchSurveys"
            />

            <div v-else-if="!surveys.length" class="activity-item muted">
                Нет опросов для прохождения.
            </div>

            <div v-else class="surveys-widget-list">
                <router-link
                    v-for="survey in surveys"
                    :key="survey.surveyId"
                    :to="surveyLink(survey)"
                    class="surveys-widget-item"
                >
                    <div class="surveys-widget-item-main">
                        <strong>{{ survey.title || 'Без названия' }}</strong>
                        <span v-if="deadlineLabel(survey)">{{ deadlineLabel(survey) }}</span>
                    </div>
                    <Tag v-if="survey.isMandatory" value="Обязательный" severity="danger" />
                    <i class="pi pi-arrow-right surveys-widget-arrow"></i>
                </router-link>

                <router-link to="/surveys" class="surveys-widget-all">
                    <span>Все опросы</span>
                    <i class="pi pi-arrow-right"></i>
                </router-link>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import AsyncState from '@/components/Utils/AsyncState.vue';
import { formatDateRuLong } from '@/utils/date.js';
import { getPendingSurveys } from '@/api/surveys.js';

const surveys = ref([]);
const loading = ref(false);
const error = ref(false);

const surveyLink = (survey) => `/surveys/${encodeURIComponent(survey.surveyId)}`;

const deadlineLabel = (survey) => {
    if (survey.graceExpiresAt) {
        return `Льготный период до ${formatDateRuLong(survey.graceExpiresAt)}`;
    }
    if (survey.graceExpiresDays) {
        return `Льготный период: ${survey.graceExpiresDays} дн.`;
    }
    if (survey.graceExpiresAuths) {
        return `Льготный период: ${survey.graceExpiresAuths} вход.`;
    }
    return '';
};

const fetchSurveys = async () => {
    loading.value = true;
    error.value = false;

    try {
        const response = await getPendingSurveys();
        const items = Array.isArray(response.data?.surveys) ? response.data.surveys : [];

        surveys.value = items
            .filter((survey) => !survey.isBlocked)
            .sort((left, right) => Number(right.isMandatory) - Number(left.isMandatory))
            .slice(0, 3);
    } catch (requestError) {
        console.debug('Не удалось загрузить опросы для виджета:', requestError);
        surveys.value = [];
        error.value = true;
    } finally {
        loading.value = false;
    }
};

onMounted(fetchSurveys);

defineExpose({ refetch: fetchSurveys });
</script>

<style scoped src="./dashboardWidget.css"></style>

<style scoped>
.surveys-widget-count {
    color: var(--p-grey-2);
    font-size: 0.78rem;
    white-space: nowrap;
}

.surveys-widget-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.surveys-widget-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid rgba(var(--p-primary-500-rgb), 0.14);
    border-radius: 12px;
    color: inherit;
    text-decoration: none;
    transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.surveys-widget-item:hover {
    background: rgba(var(--p-primary-500-rgb), 0.06);
    border-color: rgba(var(--p-primary-500-rgb), 0.28);
    transform: translateX(2px);
}

.surveys-widget-item-main {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
    gap: 2px;
}

.surveys-widget-item-main strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--p-text-color);
}

.surveys-widget-item-main span {
    color: var(--p-grey-2);
    font-size: 0.76rem;
}

.surveys-widget-arrow {
    flex: 0 0 auto;
    color: var(--p-primary-color);
    font-size: 0.8rem;
}

.surveys-widget-all {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    gap: 0.4rem;
    margin-top: 0.2rem;
    padding: 0.45rem 0.8rem;
    border-radius: 0.72rem;
    border: 1px solid color-mix(in srgb, var(--p-primary-color) 18%, transparent);
    background: color-mix(in srgb, var(--p-primary-color) 8%, transparent);
    color: var(--p-primary-color);
    font-weight: 700;
    font-size: 0.82rem;
    text-decoration: none;
    transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.surveys-widget-all:hover {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--p-primary-color) 36%, transparent);
    background: color-mix(in srgb, var(--p-primary-color) 16%, transparent);
}

.surveys-widget-all .pi {
    font-size: 0.78rem;
    transition: transform 0.2s ease;
}

.surveys-widget-all:hover .pi {
    transform: translateX(3px);
}
</style>
