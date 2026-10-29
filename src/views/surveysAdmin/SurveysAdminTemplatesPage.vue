<template>
    <section class="admin-panel">
        <div class="admin-panel-head">
            <div><h3>Шаблоны опросов</h3><p>Шаблоны и создание опросов по ним.</p></div>
            <div class="admin-panel-actions">
                <Button v-if="canCreate" label="Создать шаблон" icon="pi pi-plus" @click="openDialog()" />
                <Button label="Обновить" icon="pi pi-refresh" outlined severity="secondary" :loading="loading" @click="loadTemplates" />
            </div>
        </div>

        <DataTable :value="templates" :loading="loading" dataKey="id">
            <Column field="title" header="Название" />
            <Column field="description" header="Описание" />
            <Column header="Вопросов" style="width: 8rem">
                <template #body="{ data }">{{ data.questions?.length || 0 }}</template>
            </Column>
            <Column header="Действия" style="width: 14rem">
                <template #body="{ data }">
                    <div class="admin-row-actions">
                        <Button v-if="canUpdate" icon="pi pi-pencil" text rounded @click="openDialog(data)" />
                        <Button v-if="canCreate" icon="pi pi-file-plus" text rounded severity="success" aria-label="Создать опрос" @click="createSurvey(data)" />
                        <Button v-if="canDelete" icon="pi pi-trash" text rounded severity="danger" @click="remove(data)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="dialogVisible" :header="editingId ? 'Изменить шаблон' : 'Новый шаблон'" modal :draggable="false" class="survey-admin-dialog" :style="{ width: '100%', maxWidth: '760px' }">
            <div class="admin-form">
                <label>Название</label>
                <InputText v-model="form.title" class="w-full" />
                <label>Описание</label>
                <Textarea v-model="form.description" rows="3" autoResize class="w-full" />
                <label>Вопросы</label>
                <SurveyQuestionsEditor v-model="form.questions" />
            </div>
            <template #footer>
                <Button label="Отмена" severity="secondary" text @click="dialogVisible = false" />
                <Button label="Сохранить" icon="pi pi-check" :loading="saving" :disabled="Boolean(editingId) && !canUpdate" @click="save" />
            </template>
        </Dialog>
    </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { usePermissionStore } from '@/stores/permissions.js';
import { getApiErrorMessage } from '@/utils/apiErrors.js';
import {
    createAdminSurveyFromTemplate,
    deleteAdminTemplate,
    getAdminTemplates,
    upsertAdminTemplate,
} from '@/api/surveysAdmin.js';
import SurveyQuestionsEditor from '@/components/SurveysAdmin/SurveyQuestionsEditor.vue';

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const permissionStore = usePermissionStore();

const templates = ref([]);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editingId = ref('');
const form = reactive({ title: '', description: '', questions: [] });

const canCreate = computed(() => permissionStore.hasPermission('SurveysTemplates', 'Create'));
const canUpdate = computed(() => permissionStore.hasPermission('SurveysTemplates', 'Update'));
const canDelete = computed(() => permissionStore.hasPermission('SurveysTemplates', 'Delete'));

const loadTemplates = async () => {
    loading.value = true;
    try {
        const response = await getAdminTemplates();
        templates.value = Array.isArray(response.data?.templates) ? response.data.templates : [];
    } catch (error) {
        templates.value = [];
        toast.add({ severity: 'error', summary: 'Не удалось загрузить шаблоны', detail: getApiErrorMessage(error), life: 4000 });
    } finally {
        loading.value = false;
    }
};

const openDialog = (template = null) => {
    editingId.value = template?.id || '';
    form.title = template?.title || '';
    form.description = template?.description || '';
    form.questions = JSON.parse(JSON.stringify(template?.questions || []));
    dialogVisible.value = true;
};

const save = async () => {
    const questions = JSON.parse(JSON.stringify(form.questions || []));

    saving.value = true;
    try {
        await upsertAdminTemplate({
            id: editingId.value,
            title: form.title,
            description: form.description || null,
            questions,
        });
        toast.add({ severity: 'success', summary: 'Шаблон сохранён', life: 3000 });
        dialogVisible.value = false;
        await loadTemplates();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Не удалось сохранить шаблон', detail: getApiErrorMessage(error), life: 4000 });
    } finally {
        saving.value = false;
    }
};

const createSurvey = async (template) => {
    try {
        const response = await createAdminSurveyFromTemplate(template.id, { overrides: null });
        toast.add({ severity: 'success', summary: 'Опрос создан по шаблону', life: 3000 });
        if (response.data?.id) {
            router.push(`/surveys/admin/surveys/${encodeURIComponent(response.data.id)}`);
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Не удалось создать опрос', detail: getApiErrorMessage(error), life: 4000 });
    }
};

const remove = (template) => {
    confirm.require({
        message: `Удалить шаблон «${template.title}»?`,
        header: 'Удаление шаблона',
        icon: 'pi pi-exclamation-triangle',
        acceptProps: { label: 'Удалить', severity: 'danger' },
        rejectProps: { label: 'Отмена', severity: 'secondary', outlined: true },
        accept: async () => {
            try {
                await deleteAdminTemplate(template.id);
                toast.add({ severity: 'success', summary: 'Шаблон удалён', life: 3000 });
                await loadTemplates();
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Не удалось удалить', detail: getApiErrorMessage(error), life: 4000 });
            }
        },
    });
};

onMounted(loadTemplates);
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
</style>

