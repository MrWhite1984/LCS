<template>
    <Dialog
        :visible="visible"
        modal
        header="Шаг дорожной карты"
        :style="{ width: '44rem', maxWidth: '95vw' }"
        @update:visible="emit('update:visible', $event)"
    >
        <div class="project-dialog-grid">
            <div class="project-field">
                <label for="roadmap-parent">Родительский шаг</label>
                <Select
                    id="roadmap-parent"
                    v-model="form.parentId"
                    :options="parentOptions"
                    optionLabel="label"
                    optionValue="id"
                    class="w-100"
                    placeholder="Корневой шаг"
                    showClear
                />
            </div>
            <div class="project-field">
                <label for="roadmap-order">Порядок</label>
                <InputNumber id="roadmap-order" v-model="form.order" class="w-100" :min="1" :useGrouping="false" />
            </div>

            <div class="project-field project-field-wide">
                <label for="roadmap-title">Название</label>
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
                <label for="roadmap-executor">Исполнитель</label>
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
        </div>

        <template #footer>
            <Button label="Отмена" severity="secondary" text @click="emit('update:visible', false)" :disabled="saving" />
            <Button label="Сохранить" icon="pi pi-check" :loading="saving" @click="submit" />
        </template>
    </Dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { addRoadMapItem } from '@/api/projectShowcase.js';
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
});

const emit = defineEmits(['update:visible', 'saved']);
const toast = useToast();
const saving = ref(false);

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
});

const flattenRoadMap = (items, prefix = []) => items.flatMap((item) => {
    const currentPrefix = [...prefix, item.title || `Шаг ${item.order || '—'}`];
    return [
        { id: item.id, label: currentPrefix.join(' / ') },
        ...flattenRoadMap(item.roadMapItems || [], currentPrefix),
    ];
});

const parentOptions = computed(() => flattenRoadMap(props.roadMapItems || []));

const participantOptions = computed(() => (props.participants || []).map((item) => ({
    id: item.user?.id,
    label: [item.user?.lastName, item.user?.firstName, item.user?.middleName]
        .filter(Boolean)
        .join(' '),
})).filter((item) => item.id));

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
};

const submit = async () => {
    if (!props.projectId) return;

    if (!form.title.trim() || !form.order || !form.startDate || !form.endDate || !form.expectedResults.trim() || !form.executorId || !form.confirmationFormat.trim()) {
        toast.add({
            severity: 'warn',
            summary: 'Форма заполнена не полностью',
            detail: 'Заполните обязательные поля шага дорожной карты.',
            life: 3000,
        });
        return;
    }

    saving.value = true;

    try {
        await addRoadMapItem(props.projectId, {
            parentId: form.parentId,
            order: Number(form.order),
            title: form.title.trim(),
            startDate: new Date(toIsoDate(form.startDate)).toISOString(),
            endDate: new Date(toIsoDate(form.endDate)).toISOString(),
            expectedResults: form.expectedResults.trim(),
            executorId: Number(form.executorId),
            comment: form.comment.trim() || null,
            confirmationFormat: form.confirmationFormat.trim(),
        });

        toast.add({
            severity: 'success',
            summary: 'Шаг добавлен',
            detail: 'Дорожная карта обновлена.',
            life: 2500,
        });

        emit('saved');
        emit('update:visible', false);
        reset();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Не удалось сохранить шаг',
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
        if (!visible) reset();
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
}

@media (max-width: 768px) {
    .project-dialog-grid {
        grid-template-columns: 1fr;
    }
}
</style>
