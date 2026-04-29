<template>
    <Dialog
        :visible="visible"
        modal
        header="Инициация проекта"
        :style="{ width: '920px', maxWidth: '95vw' }"
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

            <div class="project-field">
                <label for="project-grade">Грейд проекта</label>
                <Select
                    id="project-grade"
                    v-model="form.grade"
                    :options="gradeOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-100"
                    placeholder="Выберите грейд"
                />
            </div>

            <div class="project-field project-field-wide">
                <label for="project-department">Кафедра</label>
                <AutoComplete
                    id="project-department"
                    v-model="selectedDepartment"
                    :suggestions="departmentSuggestions"
                    optionLabel="name"
                    class="w-100"
                    forceSelection
                    dropdown
                    dropdownMode="blank"
                    showClear
                    placeholder="Начните вводить название кафедры"
                    :loading="loadingDepartments"
                    @complete="searchDepartments"
                    @item-select="handleDepartmentSelect"
                    @clear="clearDepartmentSelection"
                />
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
                <label>Объект(ы) проекта</label>
                <div class="project-option-grid">
                    <div
                        v-for="option in projectObjectOptions"
                        :key="option.value"
                        :class="[
                            'project-option-card',
                            { 'project-option-card-selected': form.projectObjectSelections.includes(option.value) },
                        ]"
                    >
                        <label
                            :class="[
                                'project-check-item',
                                'project-check-item-start',
                                { 'project-check-item-selected': form.projectObjectSelections.includes(option.value) },
                            ]"
                        >
                            <Checkbox
                                :binary="true"
                                :modelValue="form.projectObjectSelections.includes(option.value)"
                                @update:modelValue="toggleProjectObjectSelection(option.value, $event)"
                            />
                            <span>{{ option.label }}</span>
                        </label>

                        <InputText
                            v-if="option.isOther && form.projectObjectSelections.includes(option.value)"
                            v-model.trim="form.projectObjectOther"
                            class="w-100"
                            placeholder="Укажите свой объект проекта"
                        />
                    </div>
                </div>
            </div>

            <div class="project-field project-field-wide">
                <label for="project-object-statement">Этап жизненного цикла объекта</label>
                <Select
                    id="project-object-statement"
                    v-model="form.objectStatement"
                    :options="objectStatementOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-100"
                    placeholder="Выберите этап"
                />
            </div>

            <div class="project-field project-field-wide">
                <label>Научные направления</label>
                <div v-if="loadingScientificDirections" class="project-inline-loader">
                    <ProgressSpinner style="width: 34px; height: 34px" />
                </div>
                <div v-else-if="scientificDirectionRoots.length" class="scientific-directions-grid">
                    <section
                        v-for="root in scientificDirectionRoots"
                        :key="root.id"
                        class="scientific-direction-card"
                    >
                        <div class="scientific-direction-head">
                            <strong>{{ root.name }}</strong>
                            <small>
                                {{
                                    isScientificDirectionCustomEnabled(root.id)
                                        ? 'Выбран вариант "Другое" — остальные пункты внутри раздела недоступны'
                                        : hasScientificDirectionRegularSelection(root.id)
                                            ? 'Выбраны направления из списка — пункт "Другое" внутри раздела недоступен'
                                        : 'Выберите одно или несколько направлений внутри раздела'
                                }}
                            </small>
                        </div>

                        <div class="scientific-direction-options">
                            <label
                                v-for="direction in root.children"
                                :key="direction.id"
                                :class="[
                                    'project-check-item',
                                    'project-check-item-start',
                                    { 'project-check-item-disabled': isScientificDirectionOptionDisabled(root.id, direction.id) },
                                    { 'project-check-item-selected': isScientificDirectionSelected(root.id, direction.id) },
                                ]"
                            >
                                <Checkbox
                                    :binary="true"
                                    :modelValue="isScientificDirectionSelected(root.id, direction.id)"
                                    :disabled="isScientificDirectionOptionDisabled(root.id)"
                                    @update:modelValue="toggleScientificDirectionSelection(root.id, direction.id, $event)"
                                />
                                <span>{{ direction.name }}</span>
                            </label>

                            <div
                                :class="[
                                    'scientific-direction-other',
                                    { 'scientific-direction-other-disabled': isScientificDirectionCustomDisabled(root.id) },
                                    { 'scientific-direction-other-selected': isScientificDirectionCustomEnabled(root.id) },
                                ]"
                            >
                                <label
                                    :class="[
                                        'project-check-item',
                                        'project-check-item-start',
                                        { 'project-check-item-disabled': isScientificDirectionCustomDisabled(root.id) },
                                        { 'project-check-item-selected': isScientificDirectionCustomEnabled(root.id) },
                                    ]"
                                >
                                    <Checkbox
                                        :binary="true"
                                        :modelValue="isScientificDirectionCustomEnabled(root.id)"
                                        :disabled="isScientificDirectionCustomDisabled(root.id)"
                                        @update:modelValue="toggleScientificDirectionCustom(root.id, $event)"
                                    />
                                    <span>Другое</span>
                                </label>

                                <InputText
                                    v-if="isScientificDirectionCustomEnabled(root.id)"
                                    v-model.trim="scientificDirectionSelections[root.id].customName"
                                    class="w-100"
                                    placeholder="Введите свое направление"
                                />
                            </div>
                        </div>
                    </section>
                </div>
                <p v-else class="project-field-hint">
                    Научные направления пока недоступны. Попробуйте открыть форму еще раз
                </p>
            </div>

            <div class="project-field project-field-wide">
                <label for="project-tasks">Задачи проекта</label>
                <small class="project-field-hint">
                    Эти задачи перейдут в дорожную карту как контрольные точки
                </small>

                <div class="project-list-editor">
                    <div
                        v-for="(task, index) in tasks"
                        :key="`task-${index}`"
                        class="project-list-row"
                    >
                        <InputText
                            :id="index === 0 ? 'project-tasks' : undefined"
                            v-model.trim="tasks[index]"
                            class="w-100"
                            placeholder="Например, подготовить пилотный прототип"
                        />
                        <Button
                            icon="pi pi-trash"
                            severity="danger"
                            text
                            :disabled="tasks.length === 1"
                            @click="removeTask(index)"
                        />
                    </div>

                    <Button
                        label="Добавить задачу"
                        icon="pi pi-plus"
                        outlined
                        class="project-list-add"
                        @click="tasks.push('')"
                    />
                </div>
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
import { debounce } from 'lodash';
import { useToast } from 'primevue/usetoast';
import {
    getInitiatorTypes,
    getProjectShowcaseDepartmentsByPartOfName,
    getScientificDirectionsSystem,
    initiateProject,
} from '@/api/projectShowcase.js';
import {
    buildProjectShowcaseErrorMessage,
    translateProjectShowcaseTypeTitle,
} from '@/utils/projectShowcase.js';

const PROJECT_OBJECT_OTHER_VALUE = '__other__';

const projectObjectOptions = [
    { value: 'автомобильная дорога', label: 'автомобильная дорога' },
    { value: 'мост / путепровод', label: 'мост / путепровод' },
    { value: 'аэродром / ВПП', label: 'аэродром / ВПП' },
    { value: 'производственное здание / сооружение', label: 'производственное здание / сооружение' },
    { value: 'трубопровод / газопровод', label: 'трубопровод / газопровод' },
    { value: 'нефтебаза / резервуарный парк', label: 'нефтебаза / резервуарный парк' },
    { value: 'битумный терминал', label: 'битумный терминал' },
    { value: 'модульная площадка / вахтовый поселок', label: 'модульная площадка / вахтовый поселок' },
    { value: 'мехатронная система / робототехнический комплекс', label: 'мехатронная система / робототехнический комплекс' },
    { value: PROJECT_OBJECT_OTHER_VALUE, label: 'Другое', isOther: true },
];

const projectObjectLabelMap = Object.fromEntries(
    projectObjectOptions.map((option) => [option.value, option.label]),
);

const objectStatementOptions = [
    { value: 'изыскания', label: 'изыскания' },
    { value: 'проектирование', label: 'проектирование' },
    { value: 'строительство / монтаж', label: 'строительство / монтаж' },
    { value: 'эксплуатация', label: 'эксплуатация' },
    { value: 'ремонт / реконструкция', label: 'ремонт / реконструкция' },
    { value: 'ликвидация / утилизация', label: 'ликвидация / утилизация' },
];

const gradeOptions = [
    { value: '1', label: '1 (минимальная сложность)' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5' },
    { value: '6', label: '6 (максимальная сложность, стратегический)' },
];

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
const loadingScientificDirections = ref(false);
const saving = ref(false);
const competencies = ref(['']);
const tasks = ref(['']);
const selectedDepartment = ref(null);
const departmentSuggestions = ref([]);
const loadingDepartments = ref(false);
const scientificDirectionRoots = ref([]);
const scientificDirectionSelections = reactive({});

const createInitialForm = () => ({
    initiatorTypeId: null,
    departmentId: null,
    projectName: '',
    shortDescription: '',
    goal: '',
    expectedResults: '',
    estimatedImplementationPeriod: null,
    plannedNumberOfTeamMembers: null,
    projectObjectSelections: [],
    projectObjectOther: '',
    objectStatement: '',
    grade: '',
    isSourceExists: false,
    isNeedSpecialEquipment: false,
    isInitiatorWillParticipateInEvaluation: false,
    isNeedConsultations: false,
});

const form = reactive(createInitialForm());

const createScientificDirectionSelection = () => ({
    selectedIds: [],
    customEnabled: false,
    customName: '',
});

const ensureScientificDirectionSelection = (rootId) => {
    if (!scientificDirectionSelections[rootId]) {
        scientificDirectionSelections[rootId] = createScientificDirectionSelection();
    }

    return scientificDirectionSelections[rootId];
};

const initializeScientificDirectionSelections = () => {
    Object.keys(scientificDirectionSelections).forEach((key) => {
        delete scientificDirectionSelections[key];
    });

    scientificDirectionRoots.value.forEach((root) => {
        scientificDirectionSelections[root.id] = createScientificDirectionSelection();
    });
};

const normalizeStringList = (items = []) => Array.from(new Set(
    items.map((item) => item.trim()).filter(Boolean),
));

const resetForm = () => {
    Object.assign(form, createInitialForm());
    competencies.value = [''];
    tasks.value = [''];
    selectedDepartment.value = null;
    departmentSuggestions.value = [];
    initializeScientificDirectionSelections();
};

const removeCompetency = (index) => {
    competencies.value.splice(index, 1);
};

const removeTask = (index) => {
    tasks.value.splice(index, 1);
};

const toggleProjectObjectSelection = (value, checked) => {
    const nextSelections = [...form.projectObjectSelections];
    const index = nextSelections.indexOf(value);

    if (checked && index === -1) {
        nextSelections.push(value);
    }

    if (!checked && index !== -1) {
        nextSelections.splice(index, 1);
    }

    form.projectObjectSelections = nextSelections;

    if (value === PROJECT_OBJECT_OTHER_VALUE && !checked) {
        form.projectObjectOther = '';
    }
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

const loadScientificDirections = async () => {
    if (scientificDirectionRoots.value.length) {
        initializeScientificDirectionSelections();
        return;
    }

    loadingScientificDirections.value = true;

    try {
        const response = await getScientificDirectionsSystem();
        scientificDirectionRoots.value = Array.isArray(response.data) ? response.data : [];
        initializeScientificDirectionSelections();
    } catch (error) {
        scientificDirectionRoots.value = [];
        initializeScientificDirectionSelections();
        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить научные направления',
            detail: buildProjectShowcaseErrorMessage(error, 'Справочник научных направлений временно недоступен.'),
            life: 3500,
        });
    } finally {
        loadingScientificDirections.value = false;
    }
};

const executeDepartmentSearch = async (query = '') => {
    loadingDepartments.value = true;

    try {
        const response = await getProjectShowcaseDepartmentsByPartOfName(query);
        departmentSuggestions.value = Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        departmentSuggestions.value = [];
        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить кафедры',
            detail: buildProjectShowcaseErrorMessage(error, 'Справочник кафедр временно недоступен.'),
            life: 3500,
        });
    } finally {
        loadingDepartments.value = false;
    }
};

const searchDepartments = debounce(async (event) => {
    await executeDepartmentSearch(event?.query || '');
}, 250);

const handleDepartmentSelect = (event) => {
    form.departmentId = event?.value?.id ?? null;
};

const clearDepartmentSelection = () => {
    selectedDepartment.value = null;
    form.departmentId = null;
};

const isScientificDirectionSelected = (rootId, directionId) => {
    const selection = ensureScientificDirectionSelection(rootId);
    return selection.selectedIds.includes(directionId);
};

const hasScientificDirectionRegularSelection = (rootId) => ensureScientificDirectionSelection(rootId).selectedIds.length > 0;

const isScientificDirectionOptionDisabled = (rootId) => {
    const selection = ensureScientificDirectionSelection(rootId);
    return selection.customEnabled;
};

const isScientificDirectionCustomDisabled = (rootId) => {
    const selection = ensureScientificDirectionSelection(rootId);
    return selection.selectedIds.length > 0 && !selection.customEnabled;
};

const toggleScientificDirectionSelection = (rootId, directionId, checked) => {
    const selection = ensureScientificDirectionSelection(rootId);
    const nextSelectedIds = [...selection.selectedIds];
    const index = nextSelectedIds.indexOf(directionId);

    if (checked && selection.customEnabled) {
        selection.customEnabled = false;
        selection.customName = '';
    }

    if (checked && index === -1) {
        nextSelectedIds.push(directionId);
    }

    if (!checked && index !== -1) {
        nextSelectedIds.splice(index, 1);
    }

    selection.selectedIds = nextSelectedIds;
};

const isScientificDirectionCustomEnabled = (rootId) => ensureScientificDirectionSelection(rootId).customEnabled;

const toggleScientificDirectionCustom = (rootId, enabled) => {
    const selection = ensureScientificDirectionSelection(rootId);
    selection.customEnabled = Boolean(enabled);

    if (enabled) {
        selection.selectedIds = [];
    } else {
        selection.customName = '';
    }
};

const buildObjectValue = () => form.projectObjectSelections
    .map((value) => {
        if (value === PROJECT_OBJECT_OTHER_VALUE) {
            return form.projectObjectOther.trim();
        }

        return projectObjectLabelMap[value] || '';
    })
    .filter(Boolean)
    .join(', ');

const buildScientificDirectionsPayload = () => scientificDirectionRoots.value.flatMap((root) => {
    const selection = ensureScientificDirectionSelection(root.id);
    const childrenMap = new Map((root.children || []).map((direction) => [direction.id, direction]));

    const selectedSystemDirections = selection.selectedIds
        .map((directionId) => childrenMap.get(directionId))
        .filter(Boolean)
        .map((direction) => ({
            id: direction.id,
            rootId: direction.rootId,
        }));

    if (!selection.customEnabled || !selection.customName.trim()) {
        return selectedSystemDirections;
    }

    return [
        ...selectedSystemDirections,
        {
            name: selection.customName.trim(),
            rootId: root.id,
        },
    ];
});

const hasAnyScientificDirection = () => scientificDirectionRoots.value.some((root) => {
    const selection = ensureScientificDirectionSelection(root.id);
    return Boolean(selection.selectedIds.length || (selection.customEnabled && selection.customName.trim()));
});

const validate = () => {
    if (!props.initiatorId) return 'Не найден идентификатор инициатора в новой системе.';
    if (!form.projectName) return 'Укажите название проекта.';
    if (form.initiatorTypeId === null || form.initiatorTypeId === undefined) return 'Выберите тип инициатора.';
    if (form.departmentId === null || form.departmentId === undefined) return 'Выберите кафедру.';
    if (!form.shortDescription) return 'Добавьте краткое описание проекта.';
    if (!form.goal) return 'Укажите цель проекта.';
    if (!form.expectedResults) return 'Укажите ожидаемые результаты.';
    if (!form.projectObjectSelections.length) return 'Выберите хотя бы один объект проекта.';
    if (
        form.projectObjectSelections.includes(PROJECT_OBJECT_OTHER_VALUE)
        && !form.projectObjectOther.trim()
    ) {
        return 'Заполните свой вариант для поля "Объект(ы) проекта".';
    }
    if (!form.objectStatement) return 'Выберите этап жизненного цикла объекта.';
    if (!hasAnyScientificDirection()) return 'Выберите хотя бы одно научное направление.';

    const scientificDirectionWithEmptyCustom = scientificDirectionRoots.value.find((root) => {
        const selection = ensureScientificDirectionSelection(root.id);
        return selection.customEnabled && !selection.customName.trim();
    });

    if (scientificDirectionWithEmptyCustom) {
        return `Заполните свой вариант для раздела "${scientificDirectionWithEmptyCustom.name}".`;
    }

    if (!form.grade) return 'Выберите грейд проекта.';
    if (!normalizeStringList(tasks.value).length) return 'Добавьте хотя бы одну задачу проекта.';

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
            departmentId: form.departmentId,
            projectName: form.projectName,
            shortDescription: form.shortDescription,
            goal: form.goal,
            expectedResults: form.expectedResults,
            object: buildObjectValue(),
            objectStatement: form.objectStatement,
            scientificDirections: buildScientificDirectionsPayload(),
            grade: form.grade,
            tasks: normalizeStringList(tasks.value),
            requiredCompetenciesOfProjectParticipiants: normalizeStringList(competencies.value),
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
            loadScientificDirections();
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

.project-field-hint {
    color: var(--p-text-muted-color);
    margin: 0;
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
    transition: color 0.2s ease;
}

.project-check-item-start {
    align-items: flex-start;
}

.project-check-item-selected {
    color: color-mix(in srgb, var(--p-text-color) 84%, var(--p-primary-color) 16%);
}

.project-option-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.85rem;
}

.project-option-card {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    padding: 0.85rem 0.95rem;
    border: 1px solid color-mix(in srgb, var(--p-primary-color) 14%, transparent);
    border-radius: 1rem;
    background:
        linear-gradient(180deg, color-mix(in srgb, var(--p-content-background) 96%, var(--p-primary-color) 4%), color-mix(in srgb, var(--p-content-background) 92%, var(--p-primary-color) 8%));
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.project-option-card-selected {
    border-color: color-mix(in srgb, var(--p-primary-color) 28%, transparent);
    background:
        radial-gradient(circle at top right, color-mix(in srgb, var(--p-primary-color) 10%, transparent), transparent 45%),
        linear-gradient(180deg, color-mix(in srgb, var(--p-content-background) 94%, var(--p-primary-color) 6%), color-mix(in srgb, var(--p-content-background) 88%, var(--p-primary-color) 12%));
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.scientific-directions-grid {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
}

.scientific-direction-card {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding: 1rem;
    border: 1px solid color-mix(in srgb, var(--p-primary-color) 14%, transparent);
    border-radius: 1rem;
    background:
        linear-gradient(180deg, color-mix(in srgb, var(--p-content-background) 96%, var(--p-primary-color) 4%), color-mix(in srgb, var(--p-content-background) 92%, var(--p-primary-color) 8%));
}

.scientific-direction-head {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.scientific-direction-head small {
    color: var(--p-text-muted-color);
}

.scientific-direction-options {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.scientific-direction-other {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    transition: color 0.2s ease;
}

.scientific-direction-other-disabled {
    opacity: 0.55;
}

.scientific-direction-other-selected {
    color: color-mix(in srgb, var(--p-text-color) 84%, var(--p-amber-500) 16%);
}

.project-inline-loader {
    display: flex;
    justify-content: center;
    padding: 1rem 0;
}

.project-check-item :deep(.p-checkbox) {
    flex: 0 0 auto;
}

.project-check-item-disabled {
    cursor: not-allowed;
    opacity: 0.48;
}

.project-check-item-disabled span {
    color: color-mix(in srgb, var(--p-text-muted-color) 82%, var(--p-surface-500) 18%);
    text-decoration: line-through;
    text-decoration-thickness: 1px;
    text-decoration-color: color-mix(in srgb, var(--p-surface-500) 45%, transparent);
}

.project-check-item :deep(.p-checkbox .p-checkbox-box) {
    width: 1.3rem;
    height: 1.3rem;
    border-radius: 0.45rem;
    border-color: color-mix(in srgb, var(--p-primary-color) 38%, var(--p-surface-300) 62%);
    background: color-mix(in srgb, var(--p-content-background) 84%, var(--p-primary-color) 16%);
    box-shadow: inset 0 1px 0 color-mix(in srgb, var(--p-primary-color) 8%, transparent);
    transition: background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.project-check-item:hover :deep(.p-checkbox .p-checkbox-box) {
    border-color: color-mix(in srgb, var(--p-primary-color) 58%, transparent);
    box-shadow:
        0 0 0 0.2rem color-mix(in srgb, var(--p-primary-color) 8%, transparent),
        inset 0 1px 0 color-mix(in srgb, var(--p-primary-color) 10%, transparent);
}

.project-check-item :deep(.p-checkbox.p-checkbox-checked .p-checkbox-box) {
    border-color: color-mix(in srgb, var(--p-emerald-600) 68%, var(--p-primary-color) 32%);
    background:
        linear-gradient(135deg, color-mix(in srgb, var(--p-emerald-500) 88%, var(--p-primary-color) 12%), color-mix(in srgb, var(--p-primary-color) 78%, var(--p-emerald-500) 22%));
    box-shadow:
        0 0 0 0.22rem color-mix(in srgb, var(--p-emerald-500) 16%, transparent),
        0 8px 18px rgba(16, 185, 129, 0.18);
}

.project-check-item :deep(.p-checkbox.p-checkbox-checked .p-checkbox-icon) {
    color: #fff;
    font-size: 0.82rem;
}

.project-check-item :deep(.p-checkbox.p-focus .p-checkbox-box) {
    box-shadow:
        0 0 0 0.22rem color-mix(in srgb, var(--p-primary-color) 16%, transparent),
        inset 0 1px 0 color-mix(in srgb, var(--p-primary-color) 10%, transparent);
}

.project-check-item-disabled :deep(.p-checkbox.p-disabled) {
    opacity: 1;
}

.project-check-item-disabled :deep(.p-checkbox.p-disabled .p-checkbox-box) {
    border-color: color-mix(in srgb, var(--p-surface-400) 55%, transparent);
    background: color-mix(in srgb, var(--p-content-background) 90%, var(--p-surface-400) 10%);
    box-shadow: none;
}

@media (max-width: 768px) {
    .project-dialog-grid,
    .project-check-grid,
    .project-option-grid {
        grid-template-columns: 1fr;
    }
}
</style>
