<template>
    <section class="admin-panel">
        <div class="admin-panel-head">
            <div><h3>Реестр полей</h3><p>Поля SSO и внешних систем для условий аудитории.</p></div>
            <div class="admin-panel-actions">
                <Button v-if="canUpdate" label="Добавить поле" icon="pi pi-plus" @click="openDialog()" />
                <Button label="Обновить" icon="pi pi-refresh" outlined severity="secondary" :loading="loading" @click="loadFields" />
            </div>
        </div>

        <DataTable :value="fields" :loading="loading" dataKey="id">
            <Column field="code" header="Код" />
            <Column field="label" header="Название" />
            <Column field="fieldType" header="Тип поля" />
            <Column field="sourceKind" header="Источник" />
            <Column field="path" header="Путь" />
            <Column field="systemType" header="Система" />
            <Column header="Операторы">
                <template #body="{ data }">{{ (data.operators || []).join(', ') }}</template>
            </Column>
            <Column header="Действия" style="width: 9rem">
                <template #body="{ data }">
                    <div class="admin-row-actions">
                        <Button icon="pi pi-pencil" text rounded @click="openDialog(data)" />
                        <Button v-if="canDelete" icon="pi pi-trash" text rounded severity="danger" @click="remove(data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="dialogVisible" :header="editingId ? 'Изменить поле' : 'Новое поле'" modal :draggable="false" class="survey-admin-dialog" :style="{ width: '100%', maxWidth: '680px' }">
            <div class="admin-form">
                <label>Код</label>
                <InputText v-model="form.code" class="w-full" />
                <label>Название</label>
                <InputText v-model="form.label" class="w-full" />
                <div class="admin-form-grid">
                    <div><label>Тип поля</label><InputText v-model="form.fieldType" class="w-full" /></div>
                    <div>
                        <label>Вид значения</label>
                        <Select v-model="form.valueType" :options="valueTypeOptions" optionLabel="label" optionValue="value" class="w-full" />
                    </div>
                </div>
                <div class="admin-form-grid">
                    <div>
                        <label>Источник</label>
                        <Select v-model="form.sourceKind" :options="sourceKindOptions" optionLabel="label" optionValue="value" class="w-full" />
                    </div>
                    <div><label>Система</label><InputText v-model="form.systemType" class="w-full" /></div>
                </div>
                <label>Путь</label>
                <InputText v-model="form.path" class="w-full" />
                <label>Операторы</label>
                <MultiSelect
                    v-model="form.operators"
                    :options="operatorOptions"
                    optionLabel="label"
                    optionValue="value"
                    display="chip"
                    filter
                    placeholder="Выберите операторы"
                    class="w-full"
                />
            </div>
            <template #footer>
                <Button label="Отмена" severity="secondary" text @click="dialogVisible = false" />
                <Button label="Сохранить" icon="pi pi-check" :loading="saving" @click="save" />
            </template>
        </Dialog>
    </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { usePermissionStore } from '@/stores/permissions.js';
import { useSurveyFieldRegistry } from '@/stores/surveyFieldRegistry.js';
import { getApiErrorMessage } from '@/utils/apiErrors.js';
import {
    checkAdminFieldUsage,
    deleteAdminField,
    upsertAdminField,
} from '@/api/surveysAdmin.js';

const toast = useToast();
const confirm = useConfirm();
const permissionStore = usePermissionStore();
const fieldRegistry = useSurveyFieldRegistry();

const fields = ref([]);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editingId = ref('');
const form = reactive({
    code: '', label: '', fieldType: '', valueType: '', sourceKind: '', systemType: '', path: '', operators: [],
});

const operatorOptions = [
    { label: 'равно', value: 'eq' },
    { label: 'не равно', value: 'neq' },
    { label: 'больше', value: 'gt' },
    { label: 'больше или равно', value: 'gte' },
    { label: 'меньше', value: 'lt' },
    { label: 'меньше или равно', value: 'lte' },
    { label: 'входит в список', value: 'in' },
    { label: 'не входит в список', value: 'not_in' },
    { label: 'задано', value: 'is_set' },
    { label: 'не задано', value: 'is_not_set' },
];

const valueTypeOptions = [
    { label: 'Строка', value: 'string' },
    { label: 'Число', value: 'number' },
    { label: 'Да / Нет', value: 'boolean' },
    { label: 'Список', value: 'list' },
];

const sourceKindOptions = [
    { label: 'Пользователь', value: 'user' },
    { label: 'Метаданные', value: 'meta' },
    { label: 'Роли', value: 'roles' },
    { label: 'Связь', value: 'link' },
    { label: 'Информация о связи', value: 'link_information' },
];

const canUpdate = computed(() => permissionStore.hasPermission('SurveysAudience', 'Update'));
const canDelete = computed(() => permissionStore.hasPermission('SurveysAudience', 'Delete'));

const loadFields = async () => {
    loading.value = true;
    try {
        await fieldRegistry.refresh();
        fields.value = fieldRegistry.fields;
    } catch (error) {
        fields.value = [];
        toast.add({ severity: 'error', summary: 'Не удалось загрузить поля', detail: getApiErrorMessage(error), life: 4000 });
    } finally {
        loading.value = false;
    }
};

const openDialog = (field = null) => {
    editingId.value = field?.id || '';
    Object.assign(form, {
        code: field?.code || '',
        label: field?.label || '',
        fieldType: field?.fieldType || '',
        valueType: field?.valueType || '',
        sourceKind: field?.sourceKind || '',
        systemType: field?.systemType || '',
        path: field?.path || '',
        operators: [...(field?.operators || [])],
    });
    dialogVisible.value = true;
};

const payload = () => ({
    id: editingId.value,
    code: form.code,
    label: form.label,
    fieldType: form.fieldType,
    valueType: form.valueType,
    sourceKind: form.sourceKind,
    systemType: form.systemType,
    path: form.path,
    operators: [...form.operators],
});

const performSave = async () => {
    saving.value = true;
    try {
        await upsertAdminField(payload());
        toast.add({ severity: 'success', summary: 'Поле сохранено', life: 3000 });
        dialogVisible.value = false;
        await loadFields();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Не удалось сохранить поле', detail: getApiErrorMessage(error), life: 4000 });
    } finally {
        saving.value = false;
    }
};

const save = async () => {
    if (!editingId.value) {
        await performSave();
        return;
    }

    try {
        const response = await checkAdminFieldUsage(editingId.value);
        const usage = response.data;
        if (usage?.inActiveSurvey || usage?.usages?.length) {
            confirm.require({
                message: 'Поле используется в опросах. Изменение может повлиять на аудиторию. Продолжить?',
                header: 'Поле используется',
                icon: 'pi pi-exclamation-triangle',
                acceptProps: { label: 'Продолжить', severity: 'warn' },
                rejectProps: { label: 'Отмена', severity: 'secondary', outlined: true },
                accept: performSave,
            });
            return;
        }
    } catch {
        // Если проверка недоступна, не блокируем сохранение.
    }

    await performSave();
};

const remove = async (field) => {
    let used = false;
    try {
        const response = await checkAdminFieldUsage(field.id);
        used = Boolean(response.data?.inActiveSurvey || response.data?.usages?.length);
    } catch {
        // Проверка использования недоступна — не блокируем удаление.
    }

    if (used) {
        toast.add({
            severity: 'warn',
            summary: 'Поле используется',
            detail: 'Оно встречается в активных опросах или пресетах. Проверьте условия после удаления.',
            life: 5000,
        });
    }

    const doDelete = async () => {
        try {
            await deleteAdminField(field.id);
            toast.add({ severity: 'success', summary: 'Поле удалено', life: 3000 });
            await loadFields();
        } catch (error) {
            toast.add({ severity: 'error', summary: 'Не удалось удалить поле', detail: getApiErrorMessage(error), life: 4000 });
        }
    };

    confirm.require({
        message: 'Удалить поле реестра?',
        header: 'Удаление поля',
        icon: 'pi pi-exclamation-triangle',
        acceptProps: { label: 'Удалить', severity: 'danger' },
        rejectProps: { label: 'Отмена', severity: 'secondary', outlined: true },
        accept: doDelete,
    });
};

onMounted(loadFields);
</script>

<style scoped>
.admin-panel { display: flex; flex-direction: column; gap: 1rem; }
.admin-panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.admin-panel-head h3 { margin: 0; }
.admin-panel-head p { margin: 0.35rem 0 0; color: var(--p-grey-1); }
.admin-panel-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.admin-row-actions { display: flex; gap: 0.15rem; }
.admin-form { display: flex; flex-direction: column; gap: 0.55rem; }
.admin-form label { font-size: 0.78rem; color: var(--p-grey-1); }
.admin-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }
@media (max-width: 700px) { .admin-form-grid { grid-template-columns: 1fr; } }
</style>

