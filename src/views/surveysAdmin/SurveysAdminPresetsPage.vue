<template>
    <section class="admin-panel">
        <div class="admin-panel-head">
            <div><h3>Пресеты аудитории</h3><p>Сохранённые поддеревья условий.</p></div>
            <div class="admin-panel-actions">
                <Button v-if="canUpdate" label="Добавить пресет" icon="pi pi-plus" @click="openDialog()" />
                <Button label="Обновить" icon="pi pi-refresh" outlined severity="secondary" :loading="loading" @click="loadPresets" />
            </div>
        </div>

        <DataTable :value="presets" :loading="loading" dataKey="id">
            <Column field="name" header="Название" />
            <Column header="Условие">
                <template #body="{ data }">
                    <Tag :value="data.conditionSubtree ? 'Условие задано' : 'Без условия'" :severity="data.conditionSubtree ? 'success' : 'secondary'" />
                </template>
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

        <Dialog v-model:visible="dialogVisible" :header="editingId ? 'Изменить пресет' : 'Новый пресет'" modal :draggable="false" class="survey-admin-dialog" :style="{ width: '100%', maxWidth: '720px' }">
            <div class="admin-form">
                <label>Название</label>
                <InputText v-model="form.name" class="w-full" />
                <label>Условие пресета</label>
                <ConditionNodeEditor v-model="form.condition" />
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
import { getApiErrorMessage } from '@/utils/apiErrors.js';
import {
    deleteAdminPreset,
    getAdminPresets,
    upsertAdminPreset,
} from '@/api/surveysAdmin.js';
import ConditionNodeEditor from '@/components/SurveysAdmin/ConditionNodeEditor.vue';

const toast = useToast();
const confirm = useConfirm();
const permissionStore = usePermissionStore();

const presets = ref([]);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editingId = ref('');
const form = reactive({ name: '', condition: null });

const canUpdate = computed(() => permissionStore.hasPermission('SurveysAudience', 'Update'));
const canDelete = computed(() => permissionStore.hasPermission('SurveysAudience', 'Delete'));

const loadPresets = async () => {
    loading.value = true;
    try {
        const response = await getAdminPresets();
        presets.value = Array.isArray(response.data?.presets) ? response.data.presets : [];
    } catch (error) {
        presets.value = [];
        toast.add({ severity: 'error', summary: 'Не удалось загрузить пресеты', detail: getApiErrorMessage(error), life: 4000 });
    } finally {
        loading.value = false;
    }
};

const openDialog = (preset = null) => {
    editingId.value = preset?.id || '';
    form.name = preset?.name || '';
    form.condition = preset?.conditionSubtree ? JSON.parse(JSON.stringify(preset.conditionSubtree)) : null;
    dialogVisible.value = true;
};

const save = async () => {
    if (!form.name.trim()) {
        toast.add({ severity: 'error', summary: 'Укажите название пресета', life: 3500 });
        return;
    }

    const condition = form.condition
        ? JSON.parse(JSON.stringify(form.condition))
        : null;

    saving.value = true;
    try {
        await upsertAdminPreset({
            id: editingId.value,
            name: form.name,
            conditionSubtree: condition,
        });
        toast.add({ severity: 'success', summary: 'Пресет сохранён', life: 3000 });
        dialogVisible.value = false;
        await loadPresets();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Не удалось сохранить пресет', detail: getApiErrorMessage(error), life: 4000 });
    } finally {
        saving.value = false;
    }
};

const remove = (preset) => {
    confirm.require({
        message: `Удалить пресет «${preset.name}»?`,
        header: 'Удаление пресета',
        icon: 'pi pi-exclamation-triangle',
        acceptProps: { label: 'Удалить', severity: 'danger' },
        rejectProps: { label: 'Отмена', severity: 'secondary', outlined: true },
        accept: async () => {
            try {
                await deleteAdminPreset(preset.id);
                toast.add({ severity: 'success', summary: 'Пресет удалён', life: 3000 });
                await loadPresets();
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Не удалось удалить', detail: getApiErrorMessage(error), life: 4000 });
            }
        },
    });
};

onMounted(loadPresets);
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
.admin-code { font-size: 0.72rem; color: var(--p-grey-1); }
</style>

