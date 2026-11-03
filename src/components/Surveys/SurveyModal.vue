<template>
    <Dialog
        :visible="visible"
        header="Прохождение опроса"
        modal
        dismissableMask
        :style="{ width: 'min(96vw, 900px)' }"
        class="survey-modal"
        @update:visible="handleVisibleChange"
        @hide="resetState"
    >
        <div class="survey-modal-body">
            <section v-if="loading" class="survey-modal-empty">
                <ProgressSpinner style="width: 2.5rem; height: 2.5rem;" />
                <h4>Загрузка опроса…</h4>
            </section>

            <section v-else-if="error" class="survey-modal-empty">
                <i class="pi pi-exclamation-triangle"></i>
                <h4>Не удалось загрузить опрос</h4>
                <p>{{ errorDetail || 'Попробуйте позже.' }}</p>
                <div class="survey-modal-empty-actions">
                    <Button label="Повторить" icon="pi pi-refresh" outlined @click="loadSurvey" />
                    <Button label="Закрыть" severity="secondary" text @click="requestClose" />
                </div>
            </section>

            <template v-else-if="survey">
                <header class="survey-modal-header">
                    <div class="survey-modal-copy">
                        <div class="survey-modal-tags">
                            <Tag rounded severity="info">Опрос</Tag>
                            <Tag v-if="survey.isMandatory" value="Обязательный" severity="danger" />
                            <Tag v-if="anonymousLabel" :value="anonymousLabel" :severity="anonymousSeverity" />
                        </div>
                        <h3>{{ survey.title || 'Опрос' }}</h3>
                        <p v-if="survey.description">{{ survey.description }}</p>
                    </div>

                    <Button
                        icon="pi pi-refresh"
                        label="Обновить"
                        outlined
                        severity="secondary"
                        :loading="loading"
                        @click="loadSurvey"
                    />
                </header>

                <section v-if="!visibleQuestions.length" class="survey-modal-empty">
                    <i class="pi pi-inbox"></i>
                    <h4>В опросе нет вопросов</h4>
                    <p>Обратитесь к ответственному за опросы.</p>
                </section>

                <template v-else>
                    <div class="survey-modal-progress">
                        <span>Вопросов: {{ answerableQuestions.length }}</span>
                        <Tag :value="`Заполнено: ${answeredCount}`" severity="contrast" />
                    </div>

                    <div class="survey-modal-questions">
                        <SurveyQuestionField
                            v-for="question in visibleQuestions"
                            :key="question.id"
                            :question="question"
                            :modelValue="answers[question.id]"
                            :error="errors[question.id]"
                            @update:modelValue="setAnswer(question.id, $event)"
                        />
                    </div>

                    <div class="survey-modal-footer">
                        <Button
                            label="Сохранить черновик"
                            icon="pi pi-save"
                            outlined
                            severity="secondary"
                            :loading="savingDraft"
                            :disabled="submitting"
                            @click="save(false)"
                        />
                        <Button
                            label="Отправить"
                            icon="pi pi-send"
                            :loading="submitting"
                            :disabled="savingDraft"
                            @click="save(true)"
                        />
                    </div>
                </template>
            </template>
        </div>
    </Dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { getSurveyForUser, submitSurvey } from '@/api/surveys.js';
import { isSurveyQuestionVisible } from '@/utils/surveyConditions.js';
import { isEmptySurveyAnswer, validateSurveyQuestion } from '@/utils/surveyValidation.js';
import SurveyQuestionField from '@/components/Surveys/SurveyQuestionField.vue';

const props = defineProps({
    visible: Boolean,
    surveyId: { type: String, default: '' },
});

const emit = defineEmits(['update:visible', 'submitted']);
const toast = useToast();

const survey = ref(null);
const answers = reactive({});
const errors = reactive({});
const loading = ref(false);
const submitting = ref(false);
const savingDraft = ref(false);
const closing = ref(false);
const dirty = ref(false);
const error = ref(false);
const errorDetail = ref('');

const visibleQuestions = computed(() => (
    (survey.value?.questions || [])
        .slice()
        .sort((left, right) => (left.position || 0) - (right.position || 0))
        .filter((question) => isSurveyQuestionVisible(question, answers))
));

const answerableQuestions = computed(() => (
    visibleQuestions.value.filter((question) => question.type !== 'heading')
));

const answeredCount = computed(() => (
    answerableQuestions.value.filter((question) => !isEmptySurveyAnswer(question, answers[question.id])).length
));

const anonymousLabel = computed(() => {
    if (survey.value?.anonymousMode === 'semi') return 'Анонимный';
    if (survey.value?.anonymousMode === 'open') return '';
    return 'Ошибка';
});

const anonymousSeverity = computed(() => (
    survey.value?.anonymousMode === 'open' || survey.value?.anonymousMode === 'semi' ? 'info' : 'danger'
));

const getErrorMessage = (requestError, fallback) => {
    const data = requestError?.response?.data;
    const validationErrors = data?.errors && typeof data.errors === 'object'
        ? Object.values(data.errors).flat().find(Boolean)
        : null;

    return validationErrors || data?.title || data?.message || fallback;
};

const close = () => emit('update:visible', false);

const requestClose = async () => {
    if (closing.value || submitting.value || savingDraft.value) return;

    closing.value = true;

    try {
        if (dirty.value && survey.value) {
            await submitSurvey(props.surveyId, {
                answers: buildAnswers(),
                draft: true,
            });
        }
    } catch (requestError) {
        toast.add({
            severity: 'error',
            summary: 'Не удалось сохранить черновик',
            detail: getErrorMessage(requestError, 'Ответы не сохранены.'),
            life: 4000,
        });
    } finally {
        dirty.value = false;
        closing.value = false;
        close();
    }
};

const handleVisibleChange = (nextVisible) => {
    if (!nextVisible) {
        requestClose();
    }
};

const resetState = () => {
    survey.value = null;
    error.value = false;
    errorDetail.value = '';
    loading.value = false;
    submitting.value = false;
    savingDraft.value = false;
    closing.value = false;
    dirty.value = false;
    Object.keys(answers).forEach((key) => delete answers[key]);
    Object.keys(errors).forEach((key) => delete errors[key]);
};

const setAnswer = (questionId, value) => {
    answers[questionId] = value;
    dirty.value = true;
    delete errors[questionId];
};

const mapExistingAnswer = (question, answer) => {
    const choices = Array.isArray(answer.valueChoices) ? answer.valueChoices : [];

    if (question?.type === 'yes_no') {
        const choiceId = String(choices[0]?.optionId ?? '').trim().toLowerCase();
        if (['true', 'yes', '1', 'да'].includes(choiceId)) return 'Да';
        if (['false', 'no', '0', 'нет'].includes(choiceId)) return 'Нет';

        if (answer.valueNumeric === 1) return 'Да';
        if (answer.valueNumeric === 0) return 'Нет';

        const text = String(answer.valueText ?? '').trim().toLowerCase();
        if (['true', 'yes', '1', 'да'].includes(text)) return 'Да';
        if (['false', 'no', '0', 'нет'].includes(text)) return 'Нет';
    }

    if (choices.length > 0) {
        if (question?.type === 'multi') {
            return choices.map((choice) => choice.optionId);
        }
        return choices[0].optionId;
    }

    if (answer.valueNumeric !== null && answer.valueNumeric !== undefined) {
        return Number(answer.valueNumeric);
    }

    if (question?.type === 'date' && answer.valueText) {
        const date = new Date(answer.valueText);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    return answer.valueText ?? null;
};

const loadSurvey = async () => {
    if (!props.surveyId) {
        error.value = true;
        errorDetail.value = 'Не указан опрос.';
        return;
    }

    loading.value = true;
    error.value = false;
    errorDetail.value = '';

    try {
        const response = await getSurveyForUser(props.surveyId);
        survey.value = response.data;

        Object.keys(answers).forEach((key) => delete answers[key]);
        Object.keys(errors).forEach((key) => delete errors[key]);

        for (const answer of survey.value?.existingAnswers || []) {
            const question = survey.value?.questions?.find((item) => item.id === answer.questionId);
            answers[answer.questionId] = mapExistingAnswer(question, answer);
        }

        dirty.value = false;
    } catch (requestError) {
        survey.value = null;
        error.value = true;
        errorDetail.value = getErrorMessage(
            requestError,
            'Проверьте связь с сервисом опросов и попробуйте позже.',
        );

        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить опрос',
            detail: errorDetail.value,
            life: 3500,
        });
    } finally {
        loading.value = false;
    }
};

const optionLabel = (question, optionId) => (
    (question.options || []).find((option) => option.id === optionId)?.label || String(optionId)
);

const buildAnswers = () => (survey.value?.questions || [])
    .slice()
    .sort((left, right) => (left.position || 0) - (right.position || 0))
    .filter((question) => question.type !== 'heading')
    .map((question) => {
        const value = answers[question.id];

        if (isEmptySurveyAnswer(question, value)) return null;

        if (question.type === 'multi') {
            return {
                questionId: question.id,
                valueText: null,
                valueNumeric: null,
                valueChoices: value.map((optionId) => ({
                    optionId,
                    label: optionLabel(question, optionId),
                })),
            };
        }

        if (['single', 'select'].includes(question.type)) {
            return {
                questionId: question.id,
                valueText: optionLabel(question, value),
                valueNumeric: null,
                valueChoices: [{
                    optionId: value,
                    label: optionLabel(question, value),
                }],
            };
        }

        if (question.type === 'yes_no') {
            const isYes = value === 'Да';

            return {
                questionId: question.id,
                valueText: null,
                valueNumeric: null,
                valueChoices: [{
                    optionId: isYes ? 'yes' : 'no',
                    label: value,
                }],
            };
        }

        if (['scale', 'rating', 'number', 'integer'].includes(question.type)) {
            return {
                questionId: question.id,
                valueText: String(value),
                valueNumeric: Number(value),
                valueChoices: [],
            };
        }

        return {
            questionId: question.id,
            valueText: value instanceof Date ? value.toISOString() : String(value),
            valueNumeric: null,
            valueChoices: [],
        };
    })
    .filter(Boolean);

const validate = () => {
    Object.keys(errors).forEach((key) => delete errors[key]);

    let firstInvalid = null;

    for (const question of answerableQuestions.value) {
        const message = validateSurveyQuestion(question, answers[question.id]);
        if (!message) continue;

        errors[question.id] = message;
        if (!firstInvalid) {
            firstInvalid = { question, message };
        }
    }

    if (!firstInvalid) return true;

    toast.add({
        severity: 'warn',
        summary: 'Проверьте ответы',
        detail: `${firstInvalid.question.title}: ${firstInvalid.message}`,
        life: 4000,
    });

    return false;
};

const save = async (submit) => {
    if (!survey.value) return;
    if (submit && !validate()) return;

    const flag = submit ? submitting : savingDraft;
    flag.value = true;

    try {
        await submitSurvey(props.surveyId, {
            answers: buildAnswers(),
            draft: !submit,
        });

        toast.add({
            severity: 'success',
            summary: submit ? 'Опрос отправлен' : 'Черновик сохранён',
            detail: survey.value.title,
            life: 3000,
        });

        dirty.value = false;

        if (submit) {
            emit('submitted');
            close();
        }
    } catch (requestError) {
        toast.add({
            severity: 'error',
            summary: submit ? 'Не удалось отправить опрос' : 'Не удалось сохранить черновик',
            detail: getErrorMessage(requestError, 'Попробуйте позже.'),
            life: 4000,
        });
    } finally {
        flag.value = false;
    }
};

watch(() => [props.visible, props.surveyId], ([visible, surveyId]) => {
    if (visible && surveyId) {
        loadSurvey();
    } else if (!visible) {
        resetState();
    }
}, { immediate: true });
</script>

<style>
.survey-modal .p-dialog-content {
    max-height: 78vh;
    overflow-y: auto;
    scrollbar-color: color-mix(in srgb, var(--p-primary-color) 55%, transparent) transparent;
    scrollbar-width: thin;
}

.survey-modal-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.survey-modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
}

.survey-modal-copy {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
}

.survey-modal-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
}

.survey-modal-copy h3 {
    margin: 0;
}

.survey-modal-copy p {
    margin: 0;
    color: var(--p-grey-1);
    line-height: 1.5;
}

.survey-modal-progress {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    color: var(--p-grey-1);
    font-size: 0.84rem;
}

.survey-modal-questions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.survey-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
    flex-wrap: wrap;
    padding-top: 0.65rem;
    border-top: 1px dashed var(--p-grey-4);
}

.survey-modal-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    padding: 2rem 1.5rem;
    color: var(--p-grey-1);
    text-align: center;
}

.survey-modal-empty i {
    font-size: 1.8rem;
    color: var(--p-primary-color);
}

.survey-modal-empty h4,
.survey-modal-empty p {
    margin: 0;
}

.survey-modal-empty-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: center;
}

@media (max-width: 760px) {
    .survey-modal-footer {
        justify-content: stretch;
    }

    .survey-modal-footer .p-button {
        flex: 1;
    }
}
</style>
