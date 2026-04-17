<template>
    <Dialog
        :visible="visible"
        modal
        :header="dialogTitle"
        :style="{ width: '46rem', maxWidth: '95vw' }"
        @update:visible="emit('update:visible', $event)"
    >
        <div class="project-dialog-grid">
            <div v-if="!isEditMode" class="project-field">
                <label for="roadmap-parent">Родительский шаг</label>
                <Select
                    id="roadmap-parent"
                    v-model="form.parentId"
                    :options="parentOptions"
                    optionLabel="label"
                    optionValue="id"
                    class="w-100"
                    placeholder="Корневая задача"
                    showClear
                />
            </div>

            <div class="project-field">
                <label for="roadmap-order">Порядок</label>
                <InputNumber id="roadmap-order" v-model="form.order" class="w-100" :min="1" :useGrouping="false" />
            </div>

            <div class="project-field project-field-wide">
                <label for="roadmap-title">Название задачи</label>
                <InputText id="roadmap-title" v-model.trim="form.title" class="w-100" />
            </div>

            <div class="project-field">
                <label for="roadmap-start-date">Дата начала</label>
                <DatePicker id="roadmap-start-date" v-model="form.startDate" class="w-100" showIcon dateFormat="dd.mm.yy" />
            </div>

            <div class="project-field">
                <label for="roadmap-end-date">Дата окончания</label>
                <DatePicker id="roadmap-end-date" v-model="form.endDate" class="w-100" showIcon dateFormat="dd.mm.yy" />
            </div>

            <div class="project-field project-field-wide">
                <label for="roadmap-executor">Ответственный</label>
                <Select
                    id="roadmap-executor"
                    v-model="form.executorId"
                    :options="participantOptions"
                    optionLabel="label"
                    optionValue="id"
                    class="w-100"
                    placeholder="Выберите участника проекта"
                />
            </div>

            <div class="project-field project-field-wide">
                <label for="roadmap-expected">Ожидаемый результат</label>
                <Textarea id="roadmap-expected" v-model.trim="form.expectedResults" rows="3" class="w-100" autoResize />
            </div>

            <div class="project-field project-field-wide">
                <label for="roadmap-comment">Комментарий</label>
                <Textarea id="roadmap-comment" v-model.trim="form.comment" rows="3" class="w-100" autoResize />
            </div>

            <div class="project-field project-field-wide">
                <label for="roadmap-confirmation">Формат подтверждения</label>
                <InputText id="roadmap-confirmation" v-model.trim="form.confirmationFormat" class="w-100" />
            </div>

            <div class="project-field project-field-wide project-check-grid">
                <label class="project-check-item" for="roadmap-control-point">
                    <Checkbox id="roadmap-control-point" v-model="form.isControlPoint" binary />
                    <span>Контрольная точка</span>
                </label>

                <label v-if="isEditMode" class="project-check-item" for="roadmap-completed">
                    <Checkbox id="roadmap-completed" v-model="form.isCompleted" binary />
                    <span>Отметка о выполнении</span>
                </label>
            </div>

            <div v-if="isEditMode" class="project-field project-field-wide">
                <label for="roadmap-documents">Документы шага</label>
                <MultiSelect
                    v-if="documentOptions.length"
                    id="roadmap-documents"
                    v-model="form.documentIds"
                    :options="documentOptions"
                    optionLabel="label"
                    optionValue="id"
                    class="w-100"
                    display="chip"
                    filter
                    placeholder="Выберите документы проекта"
                />
                <p v-else class="project-field-hint">
                    Сначала загрузите документы во вкладке "Документы", затем их можно будет привязать к шагу.
                </p>
            </div>
        </div>

        <template #footer>
            <Button label="Отмена" severity="secondary" text :disabled="saving" @click="emit('update:visible', false)" />
            <Button :label="submitLabel" icon="pi pi-check" :loading="saving" @click="submit" />
        </template>
    </Dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import {
    addRoadMapItem,
    updateRoadMapItem,
    updateRoadMapItemDocuments,
} from '@/api/projectShowcase.js';
import { buildProjectShowcaseErrorMessage, toIsoDate } from '@/utils/projectShowcase.js';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false,
    },
    projectId: {
        type: Number,
        default: null,
    },
    participants: {
        type: Array,
        default: () => [],
    },
    roadMapItems: {
        type: Array,
        default: () => [],
    },
    availableDocuments: {
        type: Array,
        default: () => [],
    },
    item: {
        type: Object,
        default: null,
    },
});

const emit = defineEmits(['update:visible', 'saved']);
const toast = useToast();
const saving = ref(false);
const initialDocumentIds = ref([]);

const form = reactive({
    parentId: null,
    order: 1,
    title: '',
    startDate: null,
    endDate: null,
    expectedResults: '',
    executorId: null,
    comment: '',
    confirmationFormat: '',
    isControlPoint: false,
    isCompleted: false,
    documentIds: [],
});

const isEditMode = computed(() => Boolean(props.item?.id));
const dialogTitle = computed(() => (isEditMode.value ? 'Редактировать шаг дорожной карты' : 'Шаг дорожной карты'));
const submitLabel = computed(() => (isEditMode.value ? 'Сохранить изменения' : 'Сохранить шаг'));

const collectDescendantIds = (items = []) => items.flatMap((item) => [
    item.id,
    ...collectDescendantIds(item.roadMapItems || []),
]);

const flattenRoadMap = (items, prefix = []) => items.flatMap((item) => {
    const currentPrefix = [...prefix, item.title || `Шаг ${item.order || '—'}`];
    return [
        { id: item.id, label: currentPrefix.join(' / '), nestedIds: collectDescendantIds(item.roadMapItems || []) },
        ...flattenRoadMap(item.roadMapItems || [], currentPrefix),
    ];
});

const parentOptions = computed(() => {
    const options = flattenRoadMap(props.roadMapItems || []);
    if (!props.item?.id) return options;

    const forbiddenIds = new Set([props.item.id, ...collectDescendantIds(props.item.roadMapItems || [])]);
    return options.filter((option) => !forbiddenIds.has(option.id));
});

const participantOptions = computed(() => (props.participants || []).map((item) => ({
    id: item.user?.id,
    label: [item.user?.lastName, item.user?.firstName, item.user?.middleName]
        .filter(Boolean)
        .join(' '),
})).filter((item) => item.id));

const documentOptions = computed(() => (props.availableDocuments || []).map((document) => ({
    id: document.id,
    label: document.name || `Документ #${document.id}`,
})));

const reset = () => {
    form.parentId = null;
    form.order = 1;
    form.title = '';
    form.startDate = null;
    form.endDate = null;
    form.expectedResults = '';
    form.executorId = null;
    form.comment = '';
    form.confirmationFormat = '';
    form.isControlPoint = false;
    form.isCompleted = false;
    form.documentIds = [];
    initialDocumentIds.value = [];
};

const parseDate = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const fillForm = () => {
    if (!isEditMode.value || !props.item) {
        reset();
        return;
    }

    form.parentId = null;
    form.order = props.item.order || 1;
    form.title = props.item.title || '';
    form.startDate = parseDate(props.item.startDate);
    form.endDate = parseDate(props.item.endDate);
    form.expectedResults = props.item.expectedResult || '';
    form.executorId = props.item.executor?.user?.id || props.item.executor?.id || null;
    form.comment = props.item.comment || '';
    form.confirmationFormat = props.item.confirmationFormat || '';
    form.isControlPoint = Boolean(props.item.isControlPoint);
    form.isCompleted = Boolean(props.item.isCompleted);
    form.documentIds = (props.item.projectDocuments || []).map((document) => document.id);
    initialDocumentIds.value = [...form.documentIds];
};

const normalizeRoadMapDate = (value) => {
    const isoDate = toIsoDate(value);
    return isoDate ? new Date(isoDate).toISOString() : null;
};

const validateForm = () => {
    if (!props.projectId) return false;

    if (!form.title.trim() || !form.order || !form.startDate || !form.endDate || !form.expectedResults.trim() || !form.executorId || !form.confirmationFormat.trim()) {
        toast.add({
            severity: 'warn',
            summary: 'Форма заполнена не полностью',
            detail: 'Заполните обязательные поля шага дорожной карты.',
            life: 3000,
        });
        return false;
    }

    return true;
};

const submit = async () => {
    if (!validateForm()) return;

    saving.value = true;

    try {
        const payload = {
            order: Number(form.order),
            title: form.title.trim(),
            startDate: normalizeRoadMapDate(form.startDate),
            endDate: normalizeRoadMapDate(form.endDate),
            expectedResults: form.expectedResults.trim(),
            executorId: Number(form.executorId),
            comment: form.comment.trim() || null,
            confirmationFormat: form.confirmationFormat.trim(),
            isControlPoint: Boolean(form.isControlPoint),
        };

        if (isEditMode.value && props.item?.id) {
            await updateRoadMapItem(props.item.id, {
                ...payload,
                isCompleted: Boolean(form.isCompleted),
            });

            const addedDocsIds = form.documentIds.filter((id) => !initialDocumentIds.value.includes(id));
            const removedDocsIds = initialDocumentIds.value.filter((id) => !form.documentIds.includes(id));

            if (addedDocsIds.length || removedDocsIds.length) {
                await updateRoadMapItemDocuments(props.item.id, {
                    addedDocsIds: addedDocsIds.length ? addedDocsIds : null,
                    removedDocsIds: removedDocsIds.length ? removedDocsIds : null,
                });
            }
        } else {
            await addRoadMapItem(props.projectId, {
                parentId: form.parentId,
                ...payload,
            });
        }

        toast.add({
            severity: 'success',
            summary: isEditMode.value ? 'Шаг обновлён' : 'Шаг добавлен',
            detail: 'Дорожная карта обновлена.',
            life: 2500,
        });

        emit('saved');
        emit('update:visible', false);
        reset();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: isEditMode.value ? 'Не удалось обновить шаг' : 'Не удалось сохранить шаг',
            detail: buildProjectShowcaseErrorMessage(error, 'Проверьте заполнение полей и повторите попытку.'),
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
            fillForm();
            return;
        }

        reset();
    },
);

watch(
    () => props.item,
    () => {
        if (props.visible) {
            fillForm();
        }
    },
    { deep: true },
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
}

.project-check-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0.75rem;
}

.project-check-item {
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.85rem 0.95rem;
    border-radius: 14px;
    background: rgba(var(--p-blue-500-rgb), 0.05);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.08);
    font-weight: 500;
}

.project-field-hint {
    margin: 0;
    color: var(--p-grey-1);
    line-height: 1.5;
}

@media (max-width: 768px) {
    .project-dialog-grid {
        grid-template-columns: 1fr;
    }
}
</style>
