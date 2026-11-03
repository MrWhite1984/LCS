<template>
    <section class="admin-panel">
        <div class="admin-panel-head">
            <div><h3>Серии опросов</h3><p>Серии экземпляров из шаблонов.</p></div>
            <div class="admin-panel-actions">
                <Button v-if="canCreate" label="Создать серию" icon="pi pi-plus" @click="openCreate" />
                <Button label="Обновить" icon="pi pi-refresh" outlined severity="secondary" :loading="loading" @click="loadSeries" />
            </div>
        </div>

        <DataTable :value="series" :loading="loading" dataKey="id">
            <Column field="title" header="Название" />
            <Column field="status" header="Статус" style="width: 8rem" />
            <Column header="Шаблон">
                <template #body="{ data }">{{ templateTitle(data.templateId) }}</template>
            </Column>
            <Column header="Экземпляров" style="width: 9rem">
                <template #body="{ data }">{{ data.surveys?.length || 0 }}</template>
            </Column>
            <Column header="Действия" style="width: 16rem">
                <template #body="{ data }">
                    <div class="admin-row-actions">
                        <Button icon="pi pi-eye" text rounded @click="showDetails(data)" />
                        <Button v-if="canUpdate" icon="pi pi-play" text rounded severity="success" aria-label="Опубликовать" @click="publish(data)" />
                        <Button v-if="canUpdate" icon="pi pi-stop" text rounded severity="warn" aria-label="Закрыть" @click="close(data)" />
                        <Button v-if="canUpdate" icon="pi pi-box" text rounded severity="secondary" aria-label="Архивировать" @click="archive(data)" />
                        <Button v-if="canUpdate" icon="pi pi-pencil" text rounded @click="openEdit(data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="createVisible" header="Новая серия" modal :draggable="false" class="survey-admin-dialog" :style="{ width: '100%', maxWidth: '820px' }">
            <div class="admin-form">
                <label>Название серии</label>
                <InputText v-model="createForm.title" class="w-full" />
                <label>Статус</label>
                <Select v-model="createForm.status" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
                <label>Шаблон вопросов</label>
                <Select v-model="createForm.templateId" :options="templateOptions" optionLabel="label" optionValue="value" filter editable showClear placeholder="Выберите шаблон" class="w-full" />
                <div class="admin-checkbox-row">
                    <Checkbox v-model="createForm.isMandatory" binary inputId="series-mandatory" />
                    <label for="series-mandatory">Опросы обязательные</label>
                </div>
                <label>Сегменты</label>
                <SurveySegmentsEditor v-model="createForm.segments" />
            </div>
            <template #footer>
                <Button label="Отмена" severity="secondary" text @click="createVisible = false" />
                <Button label="Создать" icon="pi pi-check" :loading="saving" @click="createSeries" />
            </template>
        </Dialog>

        <Dialog v-model:visible="editVisible" header="Изменить серию" modal :draggable="false" class="survey-admin-dialog" :style="{ width: '100%', maxWidth: '820px' }">
            <div class="admin-form">
                <label>Название серии</label>
                <InputText v-model="editForm.title" class="w-full" />
                <label>Шаблон вопросов</label>
                <Select v-model="editForm.templateId" :options="templateOptions" optionLabel="label" optionValue="value" filter editable showClear placeholder="Выберите шаблон" class="w-full" />
                <label>Статус</label>
                <Select v-model="editForm.status" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
            </div>
            <template #footer>
                <Button label="Отмена" severity="secondary" text @click="editVisible = false" />
                <Button label="Сохранить" icon="pi pi-check" :loading="saving" @click="saveEdit" />
            </template>
        </Dialog>

        <Dialog v-model:visible="detailsVisible" header="Экземпляры серии" modal :draggable="false" class="survey-admin-dialog" :style="{ width: '100%', maxWidth: '820px' }">
            <DataTable :value="details?.surveys || []" dataKey="id">
                <Column field="title" header="Опрос" />
                <Column field="status" header="Статус" />
                <Column field="startsAt" header="Начало" />
                <Column field="endsAt" header="Окончание" />
            </DataTable>
        </Dialog>
    </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { usePermissionStore } from '@/stores/permissions.js';
import { getApiErrorMessage } from '@/utils/apiErrors.js';
import {
    archiveAdminSeries,
    closeAdminSeries,
    createAdminSeriesFromTemplate,
    getAdminSeries,
    getAdminSeriesById,
    getAdminTemplates,
    publishAdminSeries,
    updateAdminSeries,
} from '@/api/surveysAdmin.js';
import SurveySegmentsEditor from '@/components/SurveysAdmin/SurveySegmentsEditor.vue';

const toast = useToast();
const permissionStore = usePermissionStore();

const series = ref([]);
const templates = ref([]);
const loading = ref(false);
const saving = ref(false);
const createVisible = ref(false);
const editVisible = ref(false);
const detailsVisible = ref(false);
const details = ref(null);
const createForm = reactive({ title: '', templateId: '', status: 'draft', isMandatory: false, segments: [] });
const editForm = reactive({ id: '', title: '', templateId: '', status: 'draft', surveys: [] });

const statusOptions = [
    { label: 'Черновик', value: 'draft' },
    { label: 'Активна', value: 'active' },
    { label: 'Закрыта', value: 'closed' },
    { label: 'Архив', value: 'archived' },
];

const templateOptions = computed(() => templates.value.map((template) => ({
    value: template.id,
    label: template.title || template.id,
})));

const templateTitles = computed(() => new Map(
    templates.value.map((template) => [template.id, template.title || template.id]),
));

const templateTitle = (templateId) => (
    templateId ? (templateTitles.value.get(templateId) || templateId) : '—'
);

const canCreate = computed(() => permissionStore.hasPermission('SurveysTemplates', 'Create'));
const canUpdate = computed(() => permissionStore.hasPermission('SurveysTemplates', 'Update'));

const loadSeries = async () => {
    loading.value = true;
    try {
        const response = await getAdminSeries({ page: 1, pageSize: 100 });
        series.value = Array.isArray(response.data?.series) ? response.data.series : [];
    } catch (error) {
        series.value = [];
        toast.add({ severity: 'error', summary: 'Не удалось загрузить серии', detail: getApiErrorMessage(error), life: 4000 });
    } finally {
        loading.value = false;
    }
};

const loadTemplates = async () => {
    try {
        const response = await getAdminTemplates();
        templates.value = Array.isArray(response.data?.templates) ? response.data.templates : [];
    } catch {
        templates.value = [];
    }
};

const openCreate = () => {
    createForm.title = '';
    createForm.templateId = '';
    createForm.status = 'draft';
    createForm.isMandatory = false;
    createForm.segments = [];
    createVisible.value = true;
};

const createSeries = async () => {
    if (!createForm.title.trim()) {
        toast.add({ severity: 'error', summary: 'Укажите название серии', life: 3000 });
        return;
    }

    saving.value = true;
    try {
        await createAdminSeriesFromTemplate({
            series: {
                id: `series-${Date.now()}`,
                title: createForm.title.trim(),
                templateId: String(createForm.templateId || '').trim() || null,
                status: createForm.status,
                surveys: [],
            },
            isMandatory: createForm.isMandatory,
            segments: JSON.parse(JSON.stringify(createForm.segments)),
        });
        toast.add({ severity: 'success', summary: 'Серия создана', life: 3000 });
        createVisible.value = false;
        await loadSeries();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Не удалось создать серию', detail: getApiErrorMessage(error), life: 4000 });
    } finally {
        saving.value = false;
    }
};

const showDetails = async (item) => {
    try {
        const response = await getAdminSeriesById(item.id);
        details.value = response.data;
        detailsVisible.value = true;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Не удалось загрузить серию', detail: getApiErrorMessage(error), life: 4000 });
    }
};

const openEdit = (item) => {
    Object.assign(editForm, {
        id: item.id,
        title: item.title || '',
        templateId: item.templateId || '',
        status: item.status || 'draft',
        surveys: JSON.parse(JSON.stringify(item.surveys || [])),
    });
    editVisible.value = true;
};

const saveEdit = async () => {
    if (!editForm.title.trim()) {
        toast.add({ severity: 'error', summary: 'Укажите название серии', life: 3000 });
        return;
    }

    saving.value = true;
    try {
        await updateAdminSeries({
            id: editForm.id,
            title: editForm.title.trim(),
            templateId: String(editForm.templateId || '').trim() || null,
            status: editForm.status,
            surveys: editForm.surveys,
        });
        toast.add({ severity: 'success', summary: 'Серия сохранена', life: 3000 });
        editVisible.value = false;
        await loadSeries();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Не удалось сохранить серию', detail: getApiErrorMessage(error), life: 4000 });
    } finally {
        saving.value = false;
    }
};

const publish = async (item) => {
    try {
        await publishAdminSeries(item.id, []);
        toast.add({ severity: 'success', summary: 'Серия опубликована', life: 3000 });
        await loadSeries();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Не удалось опубликовать', detail: getApiErrorMessage(error), life: 4000 });
    }
};

const close = async (item) => {
    try {
        await closeAdminSeries(item.id, []);
        toast.add({ severity: 'success', summary: 'Серия закрыта', life: 3000 });
        await loadSeries();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Не удалось закрыть', detail: getApiErrorMessage(error), life: 4000 });
    }
};

const archive = async (item) => {
    try {
        await archiveAdminSeries(item.id);
        toast.add({ severity: 'success', summary: 'Серия архивирована', life: 3000 });
        await loadSeries();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Не удалось архивировать', detail: getApiErrorMessage(error), life: 4000 });
    }
};

onMounted(() => {
    loadSeries();
    loadTemplates();
});
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
.admin-checkbox-row { display: flex; align-items: center; gap: 0.5rem; }
</style>

