<template>
    <article class="survey-card">
        <div class="survey-card-head">
            <span class="survey-card-icon">
                <i class="pi pi-clipboard"></i>
            </span>
            <div class="survey-card-tags">
                <Tag v-if="survey.isMandatory" value="Обязательный" severity="danger" />
                <Tag v-if="anonymousLabel" :value="anonymousLabel" :severity="anonymousSeverity" />
            </div>
        </div>

        <div class="survey-card-body">
            <h4 class="survey-card-title" :title="survey.title">{{ survey.title }}</h4>

            <div class="survey-card-meta">
                <span>
                    <i class="pi pi-circle-fill"></i>
                    {{ statusLabel }}
                </span>
                <span v-if="graceLabel">
                    <i class="pi pi-clock"></i>
                    {{ graceLabel }}
                </span>
            </div>

            <div v-if="survey.isBlocked" class="survey-card-blocked">
                <i class="pi pi-lock"></i>
                Опрос заблокирован
            </div>
        </div>

        <Button
            label="Пройти"
            icon="pi pi-arrow-right"
            iconPos="right"
            :disabled="survey.isBlocked"
            class="survey-card-action"
            @click="emit('open', survey)"
        />
    </article>
</template>

<script setup>
import { computed } from 'vue';
import { formatDateRuLong } from '@/utils/date.js';

const props = defineProps({
    survey: { type: Object, required: true },
});

const emit = defineEmits(['open']);

const anonymousLabel = computed(() => {
    if (props.survey.anonymousMode === 'semi') return 'Анонимный';
    if (props.survey.anonymousMode === 'open') return '';
    return 'Ошибка';
});

const anonymousSeverity = computed(() => (
    props.survey.anonymousMode === 'open' || props.survey.anonymousMode === 'semi' ? 'info' : 'danger'
));

const statusLabel = computed(() => {
    const labels = {
        draft: 'Черновик',
        active: 'Активен',
        closed: 'Закрыт',
        archived: 'Архив',
    };
    return labels[props.survey.status] || 'Опрос';
});

const graceLabel = computed(() => {
    const survey = props.survey;

    if (survey.graceExpiresAt) {
        return `Блокировка с ${formatDateRuLong(survey.graceExpiresAt)}`;
    }

    if (survey.graceExpiresDays) {
        return `${survey.graceExpiresDays} дн. до блокировки`;
    }

    if (survey.graceExpiresAuths) {
        return `${survey.graceExpiresAuths} входов до блокировки`;
    }

    return '';
});
</script>

<style scoped>
.survey-card {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding: 1rem;
    border-radius: 16px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
    background: color-mix(in srgb, var(--p-content-background) 94%, var(--p-primary-color) 6%);
    transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.survey-card:hover {
    border-color: rgba(var(--p-blue-500-rgb), 0.28);
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.survey-card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
}

.survey-card-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.6rem;
    height: 2.6rem;
    flex: 0 0 2.6rem;
    border-radius: 12px;
    color: var(--p-primary-color);
    background: rgba(var(--p-blue-500-rgb), 0.12);
    font-size: 1.15rem;
}

.survey-card-tags {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.35rem;
}

.survey-card-body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
}

.survey-card-title {
    margin: 0;
    line-height: 1.3;
    font-size: 1.02rem;
}

.survey-card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem 0.9rem;
    color: var(--p-grey-1);
    font-size: 0.8rem;
}

.survey-card-meta span {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
}

.survey-card-meta i {
    font-size: 0.55rem;
    color: var(--p-primary-color);
}

.survey-card-blocked {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--p-red-500);
    font-size: 0.8rem;
    font-weight: 600;
}

.survey-card-action {
    align-self: flex-start;
    margin-top: auto;
}
</style>
