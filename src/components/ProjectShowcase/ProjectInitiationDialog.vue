<template>
    <Dialog
        :visible="visible"
        modal
        header="Инициация проекта"
        :style="{ width: '960px', maxWidth: '95vw' }"
        @update:visible="emit('update:visible', $event)"
    >
        <div class="project-dialog-grid">
            <div class="project-field project-field-wide">
                <label for="project-name">Название проекта</label>
                <InputText id="project-name" v-model.trim="form.projectName" class="w-100" />
            </div>

            <div class="project-field">
                <label for="project-object">Объект проекта</label>
                <Select
                    id="project-object"
                    v-model="form.object"
                    :options="projectObjectOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-100"
                    placeholder="Выберите объект"
                />
            </div>

            <div v-if="form.object === PROJECT_OBJECT_OTHER_VALUE" class="project-field">
                <label for="project-object-other">Другой объект</label>
                <InputText id="project-object-other" v-model.trim="form.objectOther" class="w-100" />
            </div>

            <div class="project-field">
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

            <div class="project-field">
                <label for="project-type">Тип проекта</label>
                <Select
                    id="project-type"
                    v-model="form.projectTypeId"
                    :options="projectTypes"
                    optionLabel="title"
                    optionValue="id"
                    class="w-100"
                    :loading="loadingProjectTypes"
                    placeholder="Выберите тип"
                />
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
                    placeholder="Можно заполнить позже"
                    showClear
                />
            </div>

            <div class="project-field">
                <label for="project-start-date">Плановая дата начала</label>
                <DatePicker
                    id="project-start-date"
                    v-model="form.plannedStartDate"
                    class="w-100"
                    showIcon
                    dateFormat="dd.mm.yy"
                />
            </div>

            <div class="project-field">
                <label for="project-end-date">Плановая дата окончания</label>
                <DatePicker
                    id="project-end-date"
                    v-model="form.plannedEndDate"
                    class="w-100"
                    showIcon
                    dateFormat="dd.mm.yy"
                />
            </div>

            <div class="project-field project-field-wide">
                <label for="project-scientific-group">Группа научных направлений</label>
                <Select
                    id="project-scientific-group"
                    v-model="selectedScientificDirectionRootId"
                    :options="scientificDirectionRoots"
                    optionLabel="name"
                    optionValue="id"
                    class="w-100"
                    :loading="loadingScientificDirections"
                    placeholder="Выберите группу"
                    @update:modelValue="resetScientificDirectionSelection"
                />
            </div>

            <div v-if="selectedScientificDirectionRoot" class="project-field project-field-wide">
                <label for="project-scientific-directions">Научные направления</label>
                <MultiSelect
                    id="project-scientific-directions"
                    v-model="scientificDirectionSelectedIds"
                    :options="selectedScientificDirectionRoot.children || []"
                    optionLabel="name"
                    optionValue="id"
                    class="w-100"
                    display="chip"
                    placeholder="Выберите одно или несколько направлений"
                />
                <label class="project-check-item">
                    <Checkbox v-model="scientificDirectionOtherEnabled" binary />
                    <span>Другое</span>
                </label>
                <InputText
                    v-if="scientificDirectionOtherEnabled"
                    v-model.trim="scientificDirectionOtherName"
                    class="w-100"
                    placeholder="Введите свое направление"
                />
            </div>

            <div class="project-field project-field-wide">
                <label for="project-partner">Индустриальный партнёр / заказчик</label>
                <InputText id="project-partner" v-model.trim="form.partner" class="w-100" />
            </div>

            <div class="project-field project-field-wide">
                <label>Преподаватель-консультант</label>
                <ProjectUserPicker
                    v-model="consultantDraft"
                    :saving="saving"
                    placeholder="Выберите консультанта"
                    new-user-label="Новый консультант"
                    :allow-add="false"
                />
            </div>

            <div class="project-field project-field-wide">
                <label>Студенты-участники</label>
                <ProjectUserPicker
                    v-model="participantDraft"
                    :saving="saving"
                    placeholder="Выберите участника"
                    new-user-label="Новый участник"
                    @add="addParticipantDraft"
                />

                <div v-if="participantDrafts.length" class="project-chip-list">
                    <Chip
                        v-for="(participant, index) in participantDrafts"
                        :key="participant.localId"
                        :label="describeUserDraft(participant)"
                        removable
                        @remove="removeParticipantDraft(index)"
                    />
                </div>
            </div>

            <div class="project-field project-field-wide">
                <label for="project-description">Проблема / актуальность</label>
                <Textarea id="project-description" v-model.trim="form.shortDescription" rows="3" class="w-100" autoResize />
            </div>

            <div class="project-field project-field-wide">
                <label for="project-goal">Цель проекта</label>
                <Textarea id="project-goal" v-model.trim="form.goal" rows="3" class="w-100" autoResize />
            </div>

            <div class="project-field project-field-wide">
                <label for="project-tasks">Задачи проекта</label>
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
                <label for="project-results">Ожидаемые результаты</label>
                <MultiSelect
                    id="project-results"
                    v-model="form.expectedResultSelections"
                    :options="expectedResultOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-100"
                    display="chip"
                    placeholder="Выберите ожидаемые результаты"
                />
                <InputText
                    v-if="form.expectedResultSelections.includes(EXPECTED_RESULT_OTHER_VALUE)"
                    v-model.trim="form.expectedResultsOther"
                    class="w-100"
                    placeholder="Укажите иной ожидаемый результат"
                />
            </div>
        </div>

        <template #footer>
            <Button label="Отмена" severity="secondary" text @click="emit('update:visible', false)" :disabled="saving" />
            <Button label="Инициировать" icon="pi pi-check" :loading="saving" @click="submit" />
        </template>
    </Dialog>
</template>

<script setup>
import { computed, defineComponent, h, reactive, ref, watch } from 'vue';
import { debounce } from 'lodash';
import { useToast } from 'primevue/usetoast';
import AutoComplete from 'primevue/autocomplete';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import SelectButton from 'primevue/selectbutton';
import {
    PROJECT_SHOWCASE_LKS_SEARCH_MIN_LENGTH,
    addLksUserToProjectShowcaseSystem,
    addProjectShowcaseUser,
    getProjectShowcaseUserByLksId,
    getProjectTypes,
    getScientificDirectionsSystem,
    initiateProject,
    searchProjectShowcaseLksUsers,
    searchProjectShowcaseUsers,
} from '@/api/projectShowcase.js';
import {
    buildProjectShowcaseErrorMessage,
    buildProjectShowcaseFullName,
    toIsoDate,
    translateProjectShowcaseTypeTitle,
} from '@/utils/projectShowcase.js';

const PROJECT_OBJECT_OTHER_VALUE = '__other__';
const EXPECTED_RESULT_OTHER_VALUE = '__other__';

const projectObjectOptions = [
    { value: 'автомобильная дорога', label: 'автомобильная дорога' },
    { value: 'мост / путепровод', label: 'мост / путепровод' },
    { value: 'аэродром / ВПП', label: 'аэродром / ВПП' },
    { value: 'промышленное здание / сооружение', label: 'промышленное здание / сооружение' },
    { value: 'трубопровод / газопровод', label: 'трубопровод / газопровод' },
    { value: 'нефтебаза / резервуарный парк', label: 'нефтебаза / резервуарный парк' },
    { value: 'битумный терминал', label: 'битумный терминал' },
    { value: 'строительная площадка / вахтовый посёлок', label: 'строительная площадка / вахтовый посёлок' },
    { value: 'мехатронная система / робототехнический комплекс', label: 'мехатронная система / робототехнический комплекс' },
    { value: PROJECT_OBJECT_OTHER_VALUE, label: 'Другое' },
];

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

const expectedResultOptions = [
    { value: 'отчёт с аналитикой', label: 'отчёт с аналитикой' },
    { value: 'технологическая карта / методика', label: 'технологическая карта / методика' },
    { value: 'лабораторный прототип', label: 'лабораторный прототип' },
    { value: 'программный продукт / алгоритм', label: 'программный продукт / алгоритм' },
    { value: 'бизнес-план / ТЭО', label: 'бизнес-план / ТЭО' },
    { value: 'патентная заявка / заявка на грант', label: 'патентная заявка / заявка на грант' },
    { value: EXPECTED_RESULT_OTHER_VALUE, label: 'Иное' },
];

const modeOptions = [
    { label: 'Из ЛКС', value: 'lks' },
    { label: 'Из новой системы', value: 'system' },
    { label: 'Новый пользователь', value: 'new' },
];

const createUserDraft = () => ({
    localId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    mode: 'lks',
    lksId: '',
    selectedLksUser: null,
    selectedUser: null,
    manualUser: {
        firstName: '',
        lastName: '',
        middleName: '',
        email: '',
        phone: '',
        userLksId: '',
    },
});

const buildLksUserLabel = (user) => [user?.lastName, user?.firstName, user?.middleName].filter(Boolean).join(' ');

const ProjectUserPicker = defineComponent({
    name: 'ProjectUserPicker',
    props: {
        modelValue: {
            type: Object,
            required: true,
        },
        saving: {
            type: Boolean,
            default: false,
        },
        placeholder: {
            type: String,
            default: 'Выберите пользователя',
        },
        newUserLabel: {
            type: String,
            default: 'Новый пользователь',
        },
        allowAdd: {
            type: Boolean,
            default: true,
        },
    },
    emits: ['update:modelValue', 'add'],
    setup(componentProps, { emit: componentEmit }) {
        const toast = useToast();
        const userSuggestions = ref([]);
        const lksSuggestions = ref([]);
        const searchLoading = ref(false);
        const lksLoading = ref(false);

        const updateDraft = (patch) => {
            componentEmit('update:modelValue', {
                ...componentProps.modelValue,
                ...patch,
            });
        };

        const updateManualUser = (field, value) => {
            updateDraft({
                manualUser: {
                    ...componentProps.modelValue.manualUser,
                    [field]: value,
                },
            });
        };

        const doSearchUsers = debounce(async (query) => {
            if (!query || query.length < 2) {
                userSuggestions.value = [];
                return;
            }

            searchLoading.value = true;

            try {
                const response = await searchProjectShowcaseUsers(query);
                userSuggestions.value = (Array.isArray(response.data) ? response.data : []).map((user) => ({
                    ...user,
                    label: buildProjectShowcaseFullName(user),
                }));
            } catch (error) {
                toast.add({
                    severity: 'error',
                    summary: 'Поиск недоступен',
                    detail: buildProjectShowcaseErrorMessage(error, 'Не удалось найти пользователя.'),
                    life: 3000,
                });
            } finally {
                searchLoading.value = false;
            }
        }, 350);

        const doSearchLksUsers = debounce(async (query) => {
            const normalizedQuery = query?.trim() || '';
            const maxPartLength = Math.max(
                0,
                ...normalizedQuery.split(/\s+/).filter(Boolean).map((part) => part.length),
            );

            if (!normalizedQuery || maxPartLength < PROJECT_SHOWCASE_LKS_SEARCH_MIN_LENGTH) {
                lksSuggestions.value = [];
                return;
            }

            lksLoading.value = true;

            try {
                const response = await searchProjectShowcaseLksUsers(normalizedQuery);
                lksSuggestions.value = (Array.isArray(response.data) ? response.data : response.data?.entities || [])
                    .map((user) => ({
                        ...user,
                        fullName: buildLksUserLabel(user),
                    }));
            } catch (error) {
                toast.add({
                    severity: 'error',
                    summary: 'Поиск недоступен',
                    detail: buildProjectShowcaseErrorMessage(error, 'Не удалось загрузить пользователей ЛКС.'),
                    life: 3000,
                });
                lksSuggestions.value = [];
            } finally {
                lksLoading.value = false;
            }
        }, 300);

        return () => h('div', { class: 'project-user-picker' }, [
            h(SelectButton, {
                modelValue: componentProps.modelValue.mode,
                'onUpdate:modelValue': (value) => updateDraft({
                    mode: value,
                    lksId: '',
                    selectedLksUser: null,
                    selectedUser: null,
                }),
                options: modeOptions,
                optionLabel: 'label',
                optionValue: 'value',
                disabled: componentProps.saving,
            }),

            componentProps.modelValue.mode === 'lks' && h(AutoComplete, {
                modelValue: componentProps.modelValue.selectedLksUser,
                suggestions: lksSuggestions.value,
                optionLabel: 'fullName',
                class: 'w-100',
                dropdown: true,
                dropdownMode: 'blank',
                showClear: true,
                forceSelection: true,
                placeholder: componentProps.placeholder,
                loading: lksLoading.value,
                disabled: componentProps.saving,
                onComplete: (event) => doSearchLksUsers(event.query),
                onItemSelect: (event) => updateDraft({
                    selectedLksUser: event.value,
                    lksId: event.value?.id || '',
                }),
                onClear: () => updateDraft({ selectedLksUser: null, lksId: '' }),
            }),

            componentProps.modelValue.mode === 'system' && h(AutoComplete, {
                modelValue: componentProps.modelValue.selectedUser,
                suggestions: userSuggestions.value,
                optionLabel: 'label',
                class: 'w-100',
                forceSelection: true,
                dropdown: true,
                dropdownMode: 'blank',
                showClear: true,
                loading: searchLoading.value,
                placeholder: 'Начните вводить ФИО',
                disabled: componentProps.saving,
                onComplete: (event) => doSearchUsers(event.query),
                onItemSelect: (event) => updateDraft({ selectedUser: event.value }),
                onClear: () => updateDraft({ selectedUser: null }),
            }),

            componentProps.modelValue.mode === 'new' && h('div', { class: 'project-dialog-grid project-user-picker-manual' }, [
                h('div', { class: 'project-field' }, [
                    h('label', { for: `${componentProps.modelValue.localId}-last-name` }, 'Фамилия'),
                    h(InputText, {
                        id: `${componentProps.modelValue.localId}-last-name`,
                        modelValue: componentProps.modelValue.manualUser.lastName,
                        class: 'w-100',
                        disabled: componentProps.saving,
                        'onUpdate:modelValue': (value) => updateManualUser('lastName', value),
                    }),
                ]),
                h('div', { class: 'project-field' }, [
                    h('label', { for: `${componentProps.modelValue.localId}-first-name` }, 'Имя'),
                    h(InputText, {
                        id: `${componentProps.modelValue.localId}-first-name`,
                        modelValue: componentProps.modelValue.manualUser.firstName,
                        class: 'w-100',
                        disabled: componentProps.saving,
                        'onUpdate:modelValue': (value) => updateManualUser('firstName', value),
                    }),
                ]),
                h('div', { class: 'project-field' }, [
                    h('label', { for: `${componentProps.modelValue.localId}-middle-name` }, 'Отчество'),
                    h(InputText, {
                        id: `${componentProps.modelValue.localId}-middle-name`,
                        modelValue: componentProps.modelValue.manualUser.middleName,
                        class: 'w-100',
                        disabled: componentProps.saving,
                        'onUpdate:modelValue': (value) => updateManualUser('middleName', value),
                    }),
                ]),
                h('div', { class: 'project-field' }, [
                    h('label', { for: `${componentProps.modelValue.localId}-email` }, 'E-mail'),
                    h(InputText, {
                        id: `${componentProps.modelValue.localId}-email`,
                        modelValue: componentProps.modelValue.manualUser.email,
                        class: 'w-100',
                        disabled: componentProps.saving,
                        'onUpdate:modelValue': (value) => updateManualUser('email', value),
                    }),
                ]),
                h('div', { class: 'project-field' }, [
                    h('label', { for: `${componentProps.modelValue.localId}-phone` }, 'Телефон'),
                    h(InputText, {
                        id: `${componentProps.modelValue.localId}-phone`,
                        modelValue: componentProps.modelValue.manualUser.phone,
                        class: 'w-100',
                        disabled: componentProps.saving,
                        'onUpdate:modelValue': (value) => updateManualUser('phone', value),
                    }),
                ]),
            ]),

            componentProps.allowAdd && h(Button, {
                label: 'Добавить',
                icon: 'pi pi-plus',
                outlined: true,
                class: 'project-user-picker-add',
                disabled: componentProps.saving,
                onClick: () => componentEmit('add', componentProps.modelValue),
            }),
        ]);
    },
});

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

const projectTypes = ref([]);
const loadingProjectTypes = ref(false);
const loadingScientificDirections = ref(false);
const saving = ref(false);
const tasks = ref(['']);
const scientificDirectionRoots = ref([]);
const selectedScientificDirectionRootId = ref(null);
const scientificDirectionSelectedIds = ref([]);
const scientificDirectionOtherEnabled = ref(false);
const scientificDirectionOtherName = ref('');
const consultantDraft = ref(createUserDraft());
const participantDraft = ref(createUserDraft());
const participantDrafts = ref([]);

const createInitialForm = () => ({
    projectTypeId: null,
    projectName: '',
    shortDescription: '',
    goal: '',
    expectedResultSelections: [],
    expectedResultsOther: '',
    plannedStartDate: null,
    plannedEndDate: null,
    object: '',
    objectOther: '',
    objectStatement: '',
    grade: '',
    partner: '',
});

const form = reactive(createInitialForm());

const selectedScientificDirectionRoot = computed(() => (
    scientificDirectionRoots.value.find((root) => root.id === selectedScientificDirectionRootId.value) || null
));

const normalizeStringList = (items = []) => Array.from(new Set(
    items.map((item) => item.trim()).filter(Boolean),
));

const resetScientificDirectionSelection = () => {
    scientificDirectionSelectedIds.value = [];
    scientificDirectionOtherEnabled.value = false;
    scientificDirectionOtherName.value = '';
};

const resetForm = () => {
    Object.assign(form, createInitialForm());
    tasks.value = [''];
    selectedScientificDirectionRootId.value = null;
    resetScientificDirectionSelection();
    consultantDraft.value = createUserDraft();
    participantDraft.value = createUserDraft();
    participantDrafts.value = [];
};

const removeTask = (index) => {
    tasks.value.splice(index, 1);
};

const addParticipantDraft = (draft) => {
    participantDrafts.value.push({
        ...draft,
        localId: createUserDraft().localId,
        manualUser: { ...draft.manualUser },
    });
    participantDraft.value = createUserDraft();
};

const removeParticipantDraft = (index) => {
    participantDrafts.value.splice(index, 1);
};

const describeUserDraft = (draft) => {
    if (draft.mode === 'system') return buildProjectShowcaseFullName(draft.selectedUser);
    if (draft.mode === 'lks') return draft.selectedLksUser?.fullName || 'Пользователь ЛКС';
    return [draft.manualUser.lastName, draft.manualUser.firstName, draft.manualUser.middleName].filter(Boolean).join(' ') || 'Новый пользователь';
};

const loadProjectTypes = async () => {
    if (projectTypes.value.length) return;
    loadingProjectTypes.value = true;

    try {
        const response = await getProjectTypes();
        projectTypes.value = Array.isArray(response.data)
            ? response.data.map((item) => ({
                ...item,
                title: translateProjectShowcaseTypeTitle(item.title),
            }))
            : [];
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить типы проектов',
            detail: buildProjectShowcaseErrorMessage(error, 'Справочник типов проектов временно недоступен.'),
            life: 3500,
        });
    } finally {
        loadingProjectTypes.value = false;
    }
};

const loadScientificDirections = async () => {
    if (scientificDirectionRoots.value.length) return;
    loadingScientificDirections.value = true;

    try {
        const response = await getScientificDirectionsSystem();
        scientificDirectionRoots.value = Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        scientificDirectionRoots.value = [];
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

const buildObjectValue = () => (
    form.object === PROJECT_OBJECT_OTHER_VALUE ? form.objectOther.trim() : form.object
);

const buildExpectedResultsValue = () => form.expectedResultSelections
    .map((value) => (value === EXPECTED_RESULT_OTHER_VALUE ? form.expectedResultsOther.trim() : value))
    .filter(Boolean)
    .join(', ');

const buildScientificDirectionsPayload = () => {
    const root = selectedScientificDirectionRoot.value;
    if (!root) return [];
    const childrenMap = new Map((root.children || []).map((direction) => [direction.id, direction]));

    const selectedSystemDirections = scientificDirectionSelectedIds.value
        .map((directionId) => childrenMap.get(directionId))
        .filter(Boolean)
        .map((direction) => ({
            id: direction.id,
            rootId: direction.rootId ?? root.id,
        }));

    if (!scientificDirectionOtherEnabled.value || !scientificDirectionOtherName.value.trim()) {
        return selectedSystemDirections;
    }

    return [
        ...selectedSystemDirections,
        {
            name: scientificDirectionOtherName.value.trim(),
            rootId: root.id,
        },
    ];
};

const resolveUserDraftId = async (draft, optional = false) => {
    if (draft.mode === 'lks') {
        const normalizedLksId = draft.lksId?.trim() || '';
        if (!normalizedLksId) {
            if (optional) return null;
            throw new Error('Выберите пользователя ЛКС.');
        }

        try {
            const existingResponse = await getProjectShowcaseUserByLksId(normalizedLksId);
            const existingId = existingResponse.data?.userResponse?.id;
            if (existingId) return Number(existingId);
        } catch (error) {
            if (error?.response?.status !== 404) throw error;
        }

        const response = await addLksUserToProjectShowcaseSystem(normalizedLksId);
        return Number(response.data);
    }

    if (draft.mode === 'system') {
        if (!draft.selectedUser?.id) {
            if (optional) return null;
            throw new Error('Выберите пользователя новой системы.');
        }
        return Number(draft.selectedUser.id);
    }

    const manualUser = draft.manualUser || {};
    if (!manualUser.lastName && !manualUser.firstName && !manualUser.email && optional) return null;
    if (!manualUser.lastName || !manualUser.firstName || !manualUser.email) {
        throw new Error('Заполните как минимум фамилию, имя и e-mail нового пользователя.');
    }

    const response = await addProjectShowcaseUser({ ...manualUser });
    return Number(response.data);
};

const validate = () => {
    if (!props.initiatorId) return 'Не найден идентификатор инициатора в новой системе.';
    if (!form.projectName) return 'Укажите название проекта.';
    if (!buildObjectValue()) return 'Выберите объект проекта.';
    if (!form.objectStatement) return 'Выберите этап жизненного цикла объекта.';
    if (!selectedScientificDirectionRoot.value) return 'Выберите группу научных направлений.';
    if (!buildScientificDirectionsPayload().length) return 'Выберите хотя бы одно научное направление.';
    if (scientificDirectionOtherEnabled.value && !scientificDirectionOtherName.value.trim()) {
        return 'Заполните свой вариант научного направления.';
    }
    if (form.projectTypeId === null || form.projectTypeId === undefined) return 'Выберите тип проекта.';
    if (!form.plannedStartDate) return 'Укажите плановую дату начала.';
    if (!form.plannedEndDate) return 'Укажите плановую дату окончания.';
    if (new Date(form.plannedStartDate) > new Date(form.plannedEndDate)) return 'Дата начала не может быть позже даты окончания.';
    if (!form.shortDescription) return 'Добавьте проблему / актуальность проекта.';
    if (!form.goal) return 'Укажите цель проекта.';
    if (!normalizeStringList(tasks.value).length) return 'Добавьте хотя бы одну задачу проекта.';
    if (!buildExpectedResultsValue()) return 'Укажите ожидаемые результаты.';
    if (
        form.expectedResultSelections.includes(EXPECTED_RESULT_OTHER_VALUE)
        && !form.expectedResultsOther.trim()
    ) {
        return 'Заполните иной ожидаемый результат.';
    }

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
        const consultantId = await resolveUserDraftId(consultantDraft.value, true);
        const participantIds = [];

        for (const participant of participantDrafts.value) {
            const participantId = await resolveUserDraftId(participant);
            if (participantId) participantIds.push(participantId);
        }

        await initiateProject({
            initiatorId: props.initiatorId,
            projectName: form.projectName,
            object: buildObjectValue(),
            objectStatement: form.objectStatement,
            scientificDirections: buildScientificDirectionsPayload(),
            projectTypeId: form.projectTypeId,
            grade: form.grade || null,
            projectContests: [],
            plannedStartDate: toIsoDate(form.plannedStartDate),
            plannedEndDate: toIsoDate(form.plannedEndDate),
            plannedMilestones: [],
            consultantId,
            consulterId: consultantId,
            partner: form.partner,
            participantIds,
            participiantsIds: participantIds,
            shortDescription: form.shortDescription,
            goal: form.goal,
            tasks: normalizeStringList(tasks.value),
            expectedResults: buildExpectedResultsValue(),
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
            detail: error instanceof Error
                ? error.message
                : buildProjectShowcaseErrorMessage(error, 'Проверьте поля формы и повторите попытку.'),
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
            loadProjectTypes();
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

.project-list-editor,
.project-user-picker {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.project-list-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.project-list-add,
.project-user-picker-add {
    align-self: flex-start;
}

.project-check-item {
    display: flex;
    gap: 0.65rem;
    align-items: center;
    color: var(--p-text-color);
}

.project-chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.project-user-picker-manual {
    width: 100%;
}

@media (max-width: 768px) {
    .project-dialog-grid {
        grid-template-columns: 1fr;
    }
}
</style>
