<template>
    <Dialog
        :visible="visible"
        modal
        header="Инициация проекта"
        :style="{ width: '760px', maxWidth: '95vw' }"
        @update:visible="emit('update:visible', $event)"
    >
        <div class="project-dialog-grid">
            <div class="project-field project-field-wide">
                <label for="project-name">Название проекта</label>
                <InputText id="project-name" v-model.trim="form.projectName" class="w-100" />
            </div>

            <div class="project-field">
                <label for="project-initiator-type">Тип инициатора</label>
                <Select
                    id="project-initiator-type"
                    v-model="form.initiatorTypeId"
                    :options="initiatorTypes"
                    optionLabel="title"
                    optionValue="id"
                    class="w-100"
                    :loading="loadingTypes"
                    placeholder="Выберите тип"
                />
            </div>

            <div class="project-field">
                <label for="project-period">Предполагаемый срок реализации</label>
                <DatePicker
                    id="project-period"
                    v-model="form.estimatedImplementationPeriod"
                    class="w-100"
                    showIcon
                    dateFormat="dd.mm.yy"
                    placeholder="Выберите предполагаемую дату окончания"
                />
            </div>

            <div class="project-field">
                <label for="project-team-size">Планируемое число участников</label>
                <InputNumber id="project-team-size" v-model="form.plannedNumberOfTeamMembers" class="w-100" :min="1" />
            </div>

            <div class="project-field project-field-wide">
                <label for="project-description">Краткое описание</label>
                <Textarea id="project-description" v-model.trim="form.shortDescription" rows="3" class="w-100" autoResize />
            </div>

            <div class="project-field project-field-wide">
                <label for="project-goal">Цель проекта</label>
                <Textarea id="project-goal" v-model.trim="form.goal" rows="3" class="w-100" autoResize />
            </div>

            <div class="project-field project-field-wide">
                <label for="project-results">Ожидаемые результаты</label>
                <Textarea id="project-results" v-model.trim="form.expectedResults" rows="3" class="w-100" autoResize />
            </div>

            <div class="project-field project-field-wide">
                <label for="project-competencies">Необходимые компетенции</label>
                <div class="project-list-editor">
                    <div
                        v-for="(competency, index) in competencies"
                        :key="`competency-${index}`"
                        class="project-list-row"
                    >
                        <InputText
                            :id="index === 0 ? 'project-competencies' : undefined"
                            v-model.trim="competencies[index]"
                            class="w-100"
                            placeholder="Например, аналитика данных"
                        />
                        <Button
                            icon="pi pi-trash"
                            severity="danger"
                            text
                            :disabled="competencies.length === 1"
                            @click="removeCompetency(index)"
                        />
                    </div>
                    <Button
                        label="Добавить компетенцию"
                        icon="pi pi-plus"
                        outlined
                        class="project-list-add"
                        @click="competencies.push('')"
                    />
                </div>
            </div>

            <div class="project-check-grid project-field-wide">
                <label class="project-check-item">
                    <Checkbox v-model="form.isSourceExists" binary />
                    <span>Есть исходные данные / материалы</span>
                </label>
                <label class="project-check-item">
                    <Checkbox v-model="form.isNeedSpecialEquipment" binary />
                    <span>Нужно специальное оборудование</span>
                </label>
                <label class="project-check-item">
                    <Checkbox v-model="form.isInitiatorWillParticipateInEvaluation" binary />
                    <span>Инициатор участвует в оценке</span>
                </label>
                <label class="project-check-item">
                    <Checkbox v-model="form.isNeedConsultations" binary />
                    <span>Потребуются консультации</span>
                </label>
            </div>
        </div>

        <template #footer>
            <Button label="Отмена" severity="secondary" text @click="emit('update:visible', false)" :disabled="saving" />
            <Button label="Инициировать" icon="pi pi-check" :loading="saving" @click="submit" />
        </template>
    </Dialog>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { getInitiatorTypes, initiateProject } from '@/api/projectShowcase.js';
import {
    buildProjectShowcaseErrorMessage,
    translateProjectShowcaseTypeTitle,
} from '@/utils/projectShowcase.js';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false,
    },
    initiatorId: {
        type: Number,
        default: null,
    },
});

const emit = defineEmits(['update:visible', 'created']);

const toast = useToast();

const initiatorTypes = ref([]);
const loadingTypes = ref(false);
const saving = ref(false);
const competencies = ref(['']);

const createInitialForm = () => ({
    initiatorTypeId: null,
    projectName: '',
    shortDescription: '',
    goal: '',
    expectedResults: '',
    estimatedImplementationPeriod: null,
    plannedNumberOfTeamMembers: null,
    isSourceExists: false,
    isNeedSpecialEquipment: false,
    isInitiatorWillParticipateInEvaluation: false,
    isNeedConsultations: false,
});

const form = reactive(createInitialForm());

const resetForm = () => {
    Object.assign(form, createInitialForm());
    competencies.value = [''];
};

const removeCompetency = (index) => {
    competencies.value.splice(index, 1);
};

const loadInitiatorTypes = async () => {
    if (initiatorTypes.value.length) return;

    loadingTypes.value = true;

    try {
        const response = await getInitiatorTypes();
        initiatorTypes.value = Array.isArray(response.data)
            ? response.data.map((item) => ({
                ...item,
                title: translateProjectShowcaseTypeTitle(item.title),
            }))
            : [];
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить справочник',
            detail: buildProjectShowcaseErrorMessage(error, 'Типы инициатора пока недоступны.'),
            life: 3500,
        });
    } finally {
        loadingTypes.value = false;
    }
};

const validate = () => {
    if (!props.initiatorId) return 'Не найден идентификатор инициатора в новой системе.';
    if (!form.projectName) return 'Укажите название проекта.';
    if (form.initiatorTypeId === null || form.initiatorTypeId === undefined) return 'Выберите тип инициатора.';
    if (!form.shortDescription) return 'Добавьте краткое описание проекта.';
    if (!form.goal) return 'Укажите цель проекта.';
    if (!form.expectedResults) return 'Укажите ожидаемые результаты.';
    return '';
};

const submit = async () => {
    const validationError = validate();
    if (validationError) {
        toast.add({
            severity: 'warn',
            summary: 'Форма заполнена не полностью',
            detail: validationError,
            life: 3000,
        });
        return;
    }

    saving.value = true;

    try {
        await initiateProject({
            initiatorId: props.initiatorId,
            initiatorTypeId: form.initiatorTypeId,
            projectName: form.projectName,
            shortDescription: form.shortDescription,
            goal: form.goal,
            expectedResults: form.expectedResults,
            requiredCompetenciesOfProjectParticipiants: competencies.value
                .map((item) => item.trim())
                .filter(Boolean),
            estimatedImplementationPeriod: form.estimatedImplementationPeriod
                ? new Date(form.estimatedImplementationPeriod).toISOString()
                : null,
            plannedNumberOfTeamMembers: form.plannedNumberOfTeamMembers || 0,
            isSourceExists: form.isSourceExists,
            isNeedSpecialEquipment: form.isNeedSpecialEquipment,
            isInitiatorWillParticipateInEvaluation: form.isInitiatorWillParticipateInEvaluation,
            isNeedConsultations: form.isNeedConsultations,
        });

        toast.add({
            severity: 'success',
            summary: 'Проект инициирован',
            detail: 'Черновик проекта успешно создан.',
            life: 2500,
        });

        emit('created');
        emit('update:visible', false);
        resetForm();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Не удалось инициировать проект',
            detail: buildProjectShowcaseErrorMessage(error, 'Проверьте поля формы и повторите попытку.'),
            life: 3500,
        });
    } finally {
        saving.value = false;
    }
};

watch(
    () => props.visible,
    (visible) => {
        if (visible) {
            loadInitiatorTypes();
            return;
        }

        resetForm();
    }
);
</script>

<style scoped>
.project-dialog-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
}

.project-field {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
}

.project-field-wide {
    grid-column: 1 / -1;
}

.project-field label {
    font-weight: 600;
    color: var(--p-text-color);
}

.project-list-editor {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.project-list-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.project-list-add {
    align-self: flex-start;
}

.project-check-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.9rem 1rem;
}

.project-check-item {
    display: flex;
    gap: 0.65rem;
    align-items: center;
    color: var(--p-text-color);
}

@media (max-width: 768px) {
    .project-dialog-grid,
    .project-check-grid {
        grid-template-columns: 1fr;
    }
}
</style>
