<template>
    <div class="questions-editor">
        <div class="questions-editor-head">
            <div>
                <strong>Вопросы шаблона</strong>
                <p>Добавьте вопросы в нужном порядке и настройте условия показа.</p>
            </div>
            <Button label="Добавить вопрос" icon="pi pi-plus" size="small" @click="openDialog()" />
        </div>

        <div v-if="!items.length" class="questions-empty">
            Пока нет вопросов. Добавьте первый вопрос.
        </div>

        <div v-else class="questions-list">
            <article v-for="(question, index) in items" :key="question.id" class="question-card">
                <div class="question-card-index">{{ index + 1 }}</div>
                <div class="question-card-body">
                    <div class="question-card-title">
                        <span>{{ question.title || 'Без названия' }}</span>
                        <Tag :value="typeLabel(question.type)" severity="secondary" />
                        <Tag v-if="question.isRequired" value="Обязательный" severity="warn" />
                        <Tag v-if="question.showWhen" value="С условием" severity="info" />
                    </div>
                    <div v-if="question.options?.length" class="question-card-options">
                        {{ question.options.map((option) => option.label).join(' · ') }}
                    </div>
                </div>
                <div class="question-card-actions">
                    <Button icon="pi pi-arrow-up" text rounded size="small" :disabled="index === 0" aria-label="Выше" @click="move(index, -1)" />
                    <Button icon="pi pi-arrow-down" text rounded size="small" :disabled="index === items.length - 1" aria-label="Ниже" @click="move(index, 1)" />
                    <Button icon="pi pi-pencil" text rounded size="small" aria-label="Изменить" @click="openDialog(question)" />
                    <Button icon="pi pi-trash" text rounded size="small" severity="danger" aria-label="Удалить" @click="removeQuestion(index)" />
                </div>
            </article>
        </div>

        <Dialog
            v-model:visible="dialogVisible"
            :header="editingId ? 'Редактировать вопрос' : 'Новый вопрос'"
            modal
            :draggable="false"
            class="survey-admin-dialog"
            :style="{ width: '100%', maxWidth: '820px' }"
        >
            <div class="admin-form">
                <div class="admin-form-grid">
                    <div>
                        <label>Тип</label>
                        <Select v-model="form.type" :options="questionTypeOptions" optionLabel="label" optionValue="value" class="w-full" />
                    </div>
                    <div>
                        <label>Заголовок</label>
                        <InputText v-model="form.title" class="w-full" />
                    </div>
                </div>

                <label>Подсказка</label>
                <InputText v-model="form.helpText" class="w-full" />

                <div class="admin-checkbox-row">
                    <Checkbox v-model="form.isRequired" binary inputId="template-question-required" />
                    <label for="template-question-required">Обязательный</label>
                </div>

                <div v-if="['single', 'multi', 'select'].includes(form.type)">
                    <label>Варианты ответа</label>
                    <SurveyOptionsEditor v-model="form.options" />
                </div>

                <div v-if="['scale', 'rating'].includes(form.type)" class="admin-form-grid">
                    <div><label>Минимум</label><InputNumber v-model="form.scaleMin" :useGrouping="false" class="w-full" /></div>
                    <div><label>Максимум</label><InputNumber v-model="form.scaleMax" :useGrouping="false" class="w-full" /></div>
                </div>

                <label>Показывать при условии</label>
                <ConditionNodeEditor v-model="form.showWhen" allow-answer :questions="items" />
            </div>

            <template #footer>
                <Button label="Отмена" severity="secondary" text @click="dialogVisible = false" />
                <Button label="Сохранить" icon="pi pi-check" @click="saveQuestion" />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import ConditionNodeEditor from './ConditionNodeEditor.vue';
import SurveyOptionsEditor from './SurveyOptionsEditor.vue';

const props = defineProps({
    modelValue: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:modelValue']);
const toast = useToast();

const items = ref(clone(props.modelValue));
const dialogVisible = ref(false);
const editingId = ref('');

const questionTypeOptions = [
    { label: 'Один вариант', value: 'single' },
    { label: 'Несколько вариантов', value: 'multi' },
    { label: 'Шкала', value: 'scale' },
    { label: 'Короткий текст', value: 'text' },
    { label: 'Длинный текст', value: 'longtext' },
    { label: 'Дата', value: 'date' },
    { label: 'Выпадающий список', value: 'select' },
    { label: 'Число', value: 'number' },
    { label: 'Целое число', value: 'integer' },
    { label: 'Email', value: 'email' },
    { label: 'ИНН', value: 'inn' },
    { label: 'Ссылка', value: 'url' },
    { label: 'Рейтинг', value: 'rating' },
    { label: 'Да / Нет', value: 'yes_no' },
    { label: 'Заголовок', value: 'heading' },
    { label: 'Город / страна', value: 'city_country' },
];

const typeLabels = Object.fromEntries(questionTypeOptions.map((type) => [type.value, type.label]));
const typeLabel = (value) => typeLabels[value] || value || '—';

const form = reactive({
    type: 'text',
    title: '',
    helpText: '',
    isRequired: false,
    options: [],
    scaleMin: 1,
    scaleMax: 5,
    showWhen: null,
});

function clone(value) {
    return JSON.parse(JSON.stringify(value || []));
}

watch(() => props.modelValue, (value) => {
    if (JSON.stringify(items.value) !== JSON.stringify(value || [])) {
        items.value = clone(value);
    }
}, { deep: true });

const emitItems = () => {
    emit('update:modelValue', clone(items.value));
};

const openDialog = (question = null) => {
    editingId.value = question?.id || '';
    Object.assign(form, {
        type: question?.type || 'text',
        title: question?.title || '',
        helpText: question?.helpText || '',
        isRequired: Boolean(question?.isRequired),
        options: clone(question?.options || []),
        scaleMin: question?.scaleMin ?? 1,
        scaleMax: question?.scaleMax ?? 5,
        showWhen: question?.showWhen ? clone(question.showWhen) : null,
    });
    dialogVisible.value = true;
};

const saveQuestion = () => {
    if (!form.title.trim() && form.type !== 'heading') {
        toast.add({ severity: 'error', summary: 'Укажите заголовок вопроса', life: 3000 });
        return;
    }

    const questionId = editingId.value || `q-${Date.now()}`;
    const payload = {
        id: questionId,
        type: form.type,
        title: form.title.trim(),
        helpText: form.helpText.trim() || null,
        isRequired: form.isRequired,
        position: editingId.value
            ? (items.value.find((item) => item.id === editingId.value)?.position || items.value.length + 1)
            : items.value.length + 1,
        options: ['single', 'multi', 'select'].includes(form.type)
            ? form.options.map((option, index) => ({
                ...option,
                id: String(option.id || '').trim() || `${questionId}-opt-${index + 1}`,
                label: String(option.label || '').trim(),
                position: index + 1,
                enabled: option.enabled !== false,
                semestr: option.semestr || null,
            })).filter((option) => option.label)
            : [],
        scaleMin: ['scale', 'rating'].includes(form.type) ? form.scaleMin : null,
        scaleMax: ['scale', 'rating'].includes(form.type) ? form.scaleMax : null,
        showWhen: form.showWhen ? clone(form.showWhen) : null,
    };

    if (editingId.value) {
        const index = items.value.findIndex((item) => item.id === editingId.value);
        if (index >= 0) items.value[index] = payload;
    } else {
        items.value.push(payload);
    }

    emitItems();
    dialogVisible.value = false;
};

const move = (index, offset) => {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= items.value.length) return;
    const next = [...items.value];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    items.value = next.map((question, position) => ({ ...question, position: position + 1 }));
    emitItems();
};

const removeQuestion = (index) => {
    items.value.splice(index, 1);
    items.value = items.value.map((question, position) => ({ ...question, position: position + 1 }));
    emitItems();
};

</script>

<style scoped>
.questions-editor {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.questions-editor-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.questions-editor-head p {
    margin: 0.25rem 0 0;
    color: var(--p-grey-1);
    font-size: 0.8rem;
}

.questions-empty {
    padding: 1rem;
    border: 1px dashed var(--p-content-border-color);
    border-radius: 14px;
    color: var(--p-grey-1);
    text-align: center;
}

.questions-list {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
}

.question-card {
    display: flex;
    align-items: flex-start;
    gap: 0.7rem;
    padding: 0.75rem;
    border: 1px solid var(--p-content-border-color);
    border-radius: 14px;
    background: var(--p-content-background);
}

.question-card-index {
    flex: 0 0 1.8rem;
    height: 1.8rem;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: rgba(var(--p-blue-500-rgb), 0.1);
    color: var(--p-primary-color);
    font-weight: 700;
    font-size: 0.8rem;
}

.question-card-body {
    flex: 1;
    min-width: 0;
}

.question-card-title {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
    font-weight: 600;
}

.question-card-options {
    margin-top: 0.3rem;
    color: var(--p-grey-1);
    font-size: 0.78rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.question-card-actions {
    display: flex;
    gap: 0.1rem;
    flex-wrap: wrap;
}

.admin-form {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
}

.admin-form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.55rem;
}

.admin-form label {
    font-size: 0.78rem;
    color: var(--p-grey-1);
}

.admin-checkbox-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.admin-hint {
    color: var(--p-grey-1);
}
</style>
