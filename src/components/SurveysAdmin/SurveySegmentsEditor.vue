<template>
    <div class="segments-editor">
        <div class="segments-editor-head">
            <div>
                <strong>Сегменты серии</strong>
                <p>Каждый сегмент — отдельный опрос для группы.</p>
            </div>
            <Button label="Добавить сегмент" icon="pi pi-plus" size="small" @click="openDialog()" />
        </div>

        <div v-if="!items.length" class="segments-empty">
            Пока нет сегментов. Добавьте сегмент или постройте их в разделе «Элективы».
        </div>

        <div v-else class="segments-list">
            <article v-for="(segment, index) in items" :key="segment.key || index" class="segment-card">
                <div class="segment-card-main">
                    <div class="segment-card-title">
                        <strong>{{ segment.title || segment.key || 'Сегмент' }}</strong>
                        <Tag :value="`${segment.questions?.length || 0} вопр.`" severity="secondary" />
                    </div>
                    <div class="segment-card-meta">
                        <span>Ключ: {{ segment.key || '—' }}</span>
                        <span v-if="segment.startsAt">с {{ formatDate(segment.startsAt) }}</span>
                        <span v-if="segment.endsAt">по {{ formatDate(segment.endsAt) }}</span>
                    </div>
                </div>
                <div class="segment-card-actions">
                    <Button icon="pi pi-pencil" text rounded size="small" aria-label="Изменить" @click="openDialog(segment, index)" />
                    <Button icon="pi pi-trash" text rounded size="small" severity="danger" aria-label="Удалить" @click="removeSegment(index)" />
                </div>
            </article>
        </div>

        <Dialog
            v-model:visible="dialogVisible"
            :header="editingIndex === null ? 'Новый сегмент' : 'Редактировать сегмент'"
            modal
            :draggable="false"
            class="survey-admin-dialog"
            :style="{ width: '100%', maxWidth: '860px' }"
        >
            <div class="admin-form">
                <div class="admin-form-grid">
                    <div>
                        <label>Ключ сегмента</label>
                        <InputText v-model="form.key" class="w-full" placeholder="Например, ИС-21" />
                    </div>
                    <div>
                        <label>Название</label>
                        <InputText v-model="form.title" class="w-full" />
                    </div>
                </div>

                <div class="admin-form-grid">
                    <div>
                        <label>Начало</label>
                        <DatePicker v-model="form.startsAt" dateFormat="dd.mm.yy" showTime class="w-full" />
                    </div>
                    <div>
                        <label>Окончание</label>
                        <DatePicker v-model="form.endsAt" dateFormat="dd.mm.yy" showTime class="w-full" />
                    </div>
                </div>

                <label>Вопросы сегмента</label>
                <SurveyQuestionsEditor v-model="form.questions" />
            </div>

            <template #footer>
                <Button label="Отмена" severity="secondary" text @click="dialogVisible = false" />
                <Button label="Сохранить" icon="pi pi-check" @click="saveSegment" />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import SurveyQuestionsEditor from './SurveyQuestionsEditor.vue';

const props = defineProps({
    modelValue: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:modelValue']);
const toast = useToast();

const items = ref(clone(props.modelValue));
const dialogVisible = ref(false);
const editingIndex = ref(null);

const form = reactive({
    key: '',
    title: '',
    startsAt: null,
    endsAt: null,
    questions: [],
});

function clone(value) {
    return JSON.parse(JSON.stringify(value || []));
}

watch(() => props.modelValue, (value) => {
    if (JSON.stringify(items.value) !== JSON.stringify(value || [])) {
        items.value = clone(value);
    }
}, { deep: true });

const emitItems = () => emit('update:modelValue', clone(items.value));

const openDialog = (segment = null, index = null) => {
    editingIndex.value = index;
    Object.assign(form, {
        key: segment?.key || '',
        title: segment?.title || '',
        startsAt: segment?.startsAt ? new Date(segment.startsAt) : null,
        endsAt: segment?.endsAt ? new Date(segment.endsAt) : null,
        questions: clone(segment?.questions || []),
    });
    dialogVisible.value = true;
};

const saveSegment = () => {
    if (!form.key.trim()) {
        toast.add({ severity: 'error', summary: 'Укажите ключ сегмента', life: 3000 });
        return;
    }

    const payload = {
        key: form.key.trim(),
        title: form.title.trim() || form.key.trim(),
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        optionsOverrides: editingIndex.value !== null
            ? (items.value[editingIndex.value]?.optionsOverrides || [])
            : [],
        questions: clone(form.questions),
    };

    if (editingIndex.value !== null) {
        items.value[editingIndex.value] = payload;
    } else {
        items.value.push(payload);
    }

    emitItems();
    dialogVisible.value = false;
};

const removeSegment = (index) => {
    items.value.splice(index, 1);
    emitItems();
};

const formatDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
};
</script>

<style scoped>
.segments-editor {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.segments-editor-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.segments-editor-head p {
    margin: 0.25rem 0 0;
    color: var(--p-grey-1);
    font-size: 0.8rem;
}

.segments-empty {
    padding: 1rem;
    border: 1px dashed var(--p-content-border-color);
    border-radius: 14px;
    color: var(--p-grey-1);
    text-align: center;
}

.segments-list {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
}

.segment-card {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.8rem;
    border: 1px solid var(--p-content-border-color);
    border-radius: 14px;
    background: var(--p-content-background);
}

.segment-card-title {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex-wrap: wrap;
}

.segment-card-meta {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-top: 0.35rem;
    color: var(--p-grey-1);
    font-size: 0.78rem;
}

.segment-card-actions {
    display: flex;
    gap: 0.1rem;
}

.admin-form {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
}

.admin-form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.65rem;
}

.admin-form label {
    font-size: 0.78rem;
    color: var(--p-grey-1);
}
</style>
