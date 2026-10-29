<template>
    <main class="surveys-page">
        <section class="surveys-shell">
            <header class="surveys-header">
                <div class="surveys-copy">
                    <Tag rounded severity="info">Опросы</Tag>
                    <h2>Опросы</h2>
                    <p>Анкеты и опросы, которые необходимо пройти.</p>
                </div>

                <div class="surveys-actions">
                    <Button
                        icon="pi pi-refresh"
                        label="Обновить"
                        outlined
                        severity="secondary"
                        :loading="loading"
                        @click="loadSurveys"
                    />
                    <Button
                        v-if="canManageSurveys"
                        icon="pi pi-cog"
                        text
                        rounded
                        severity="secondary"
                        aria-label="Управление опросами"
                        v-tooltip.top="'Управление опросами'"
                        @click="router.push('/surveys/admin')"
                    />
                </div>
            </header>

            <section v-if="loading" class="surveys-empty">
                <ProgressSpinner style="width: 2.5rem; height: 2.5rem;" />
                <h4>Загрузка опросов…</h4>
            </section>

            <section v-else-if="error" class="surveys-empty">
                <i class="pi pi-exclamation-triangle"></i>
                <h4>Не удалось загрузить опросы</h4>
                <p>{{ errorDetail || 'Попробуйте позже.' }}</p>
                <Button label="Повторить" icon="pi pi-refresh" outlined @click="loadSurveys" />
            </section>

            <section v-else-if="!surveys.length" class="surveys-empty">
                <i class="pi pi-check-circle"></i>
                <h4>Все доступные опросы пройдены</h4>
                <p>Новые опросы появятся здесь, когда будут назначены.</p>
            </section>

            <section v-else class="surveys-grid">
                <SurveyCard
                    v-for="survey in surveys"
                    :key="survey.surveyId"
                    :survey="survey"
                    @open="openSurvey"
                />
            </section>
        </section>

        <SurveyModal
            v-model:visible="surveyModalVisible"
            :survey-id="selectedSurveyId"
            @submitted="handleSurveySubmitted"
        />
    </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { usePermissionStore } from '@/stores/permissions.js';
import { canManageSurveys as hasSurveyManagementAccess } from '@/utils/surveyPermissions.js';
import { getPendingSurveys } from '@/api/surveys.js';
import SurveyCard from '@/components/Surveys/SurveyCard.vue';
import SurveyModal from '@/components/Surveys/SurveyModal.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const permissionStore = usePermissionStore();

const surveys = ref([]);
const loading = ref(false);
const error = ref(false);
const errorDetail = ref('');

const canManageSurveys = computed(() => hasSurveyManagementAccess(permissionStore));
const selectedSurveyId = computed(() => String(route.params.surveyId || ''));
const surveyModalVisible = computed({
    get: () => Boolean(route.params.surveyId),
    set: (visible) => {
        if (!visible && route.params.surveyId) {
            router.replace('/surveys');
        }
    },
});

const getErrorMessage = (requestError, fallback) => (
    requestError?.response?.data?.title
    || requestError?.response?.data?.message
    || fallback
);

const loadSurveys = async () => {
    loading.value = true;
    error.value = false;
    errorDetail.value = '';

    try {
        const response = await getPendingSurveys();
        const items = Array.isArray(response.data?.surveys) ? response.data.surveys : [];

        surveys.value = [...items].sort((left, right) => (
            Number(right.isMandatory) - Number(left.isMandatory)
        ));
    } catch (requestError) {
        surveys.value = [];
        error.value = true;
        errorDetail.value = getErrorMessage(
            requestError,
            'Проверьте связь с сервисом опросов и попробуйте позже.',
        );

        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить опросы',
            detail: errorDetail.value,
            life: 3500,
        });
    } finally {
        loading.value = false;
    }
};

const openSurvey = (survey) => {
    if (!survey?.surveyId || survey.isBlocked) return;

    router.push(`/surveys/${encodeURIComponent(survey.surveyId)}`);
};

const handleSurveySubmitted = async () => {
    await router.replace('/surveys');
    await loadSurveys();
};

onMounted(loadSurveys);
</script>

<style scoped>
.surveys-page {
    --survey-border: rgba(var(--p-blue-500-rgb), 0.14);
    min-height: 100%;
    padding: 10px;
}

.surveys-shell {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 100%;
    padding: 1.25rem;
    border-radius: 20px;
    border: 1px solid var(--survey-border);
    background:
        radial-gradient(1000px 220px at 0% 0%, rgba(var(--p-blue-500-rgb), 0.08), transparent 60%),
        linear-gradient(180deg, var(--p-bg-color-2) 0%, var(--p-bg-color-1) 100%);
    box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
}

.surveys-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    flex-wrap: wrap;
}

.surveys-copy h2 {
    margin: 0.75rem 0 0;
}

.surveys-copy p {
    margin: 0.65rem 0 0;
    max-width: 70ch;
    color: var(--p-grey-1);
    line-height: 1.5;
}

.surveys-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.surveys-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 0.9rem;
}

.surveys-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    padding: 2rem 1.5rem;
    color: var(--p-grey-1);
    text-align: center;
}

.surveys-empty i {
    font-size: 1.8rem;
    color: var(--p-primary-color);
}

.surveys-empty h4,
.surveys-empty p {
    margin: 0;
}

@media (max-width: 760px) {
    .surveys-shell {
        padding: 1rem;
    }

    .surveys-header {
        flex-direction: column;
        align-items: stretch;
    }

    .surveys-actions {
        justify-content: flex-start;
    }

    .surveys-grid {
        grid-template-columns: 1fr;
    }
}
</style>
