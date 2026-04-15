<template>
    <Dialog
        :visible="visible"
        modal
        header="Общая информация о проекте"
        :style="{ width: '42rem', maxWidth: '95vw' }"
        @update:visible="emit('update:visible', $event)"
    >
        <div class="project-dialog-grid">
            <div class="project-field">
                <label for="project-type">Тип проекта</label>
                <Select
                    id="project-type"
                    v-model="form.projectTypeId"
                    :options="projectTypes"
                    optionLabel="title"
                    optionValue="id"
                    class="w-100"
                    :loading="loadingTypes"
                    placeholder="Выберите тип"
                />
            </div>

            <div class="project-field">
                <label for="project-customer">Заказчик</label>
                <InputText id="project-customer" v-model.trim="form.customer" class="w-100" />
            </div>

            <div class="project-field">
                <label for="project-start-date">Дата начала</label>
                <DatePicker id="project-start-date" v-model="form.startDate" class="w-100" showIcon />
            </div>

            <div class="project-field">
                <label for="project-end-date">Дата завершения</label>
                <DatePicker id="project-end-date" v-model="form.endDate" class="w-100" showIcon />
            </div>

            <div class="project-field project-field-wide">
                <label for="project-labor-intensity">Трудоёмкость</label>
                <InputText id="project-labor-intensity" v-model.trim="form.laborIntensity" class="w-100" placeholder="Например, 120 чел./часов" />
            </div>
        </div>

        <template #footer>
            <Button label="Отмена" severity="secondary" text @click="emit('update:visible', false)" :disabled="saving" />
            <Button label="Сохранить" icon="pi pi-check" :loading="saving" @click="submit" />
        </template>
    </Dialog>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { addProjectGeneralInformation, getProjectTypes } from '@/api/projectShowcase.js';
import {
    buildProjectShowcaseErrorMessage,
    toIsoDate,
    translateProjectShowcaseTypeTitle,
} from '@/utils/projectShowcase.js';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false,
    },
    projectId: {
        type: Number,
        default: null,
    },
    initialData: {
        type: Object,
        default: () => ({}),
    },
});

const emit = defineEmits(['update:visible', 'saved']);

const toast = useToast();
const projectTypes = ref([]);
const loadingTypes = ref(false);
const saving = ref(false);

const form = reactive({
    projectTypeId: null,
    customer: '',
    startDate: null,
    endDate: null,
    laborIntensity: '',
});

const assignInitialData = () => {
    form.projectTypeId = props.initialData?.projectType?.id || null;
    form.customer = props.initialData?.customer || '';
    form.startDate = props.initialData?.startDate ? new Date(props.initialData.startDate) : null;
    form.endDate = props.initialData?.endDate ? new Date(props.initialData.endDate) : null;
    form.laborIntensity = props.initialData?.laborIntensity || '';
};

const loadProjectTypes = async () => {
    if (projectTypes.value.length) return;

    loadingTypes.value = true;

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
            detail: buildProjectShowcaseErrorMessage(error, 'Попробуйте открыть форму ещё раз.'),
            life: 3500,
        });
    } finally {
        loadingTypes.value = false;
    }
};

const submit = async () => {
    if (!props.projectId) return;

    saving.value = true;

    try {
        await addProjectGeneralInformation(props.projectId, {
            projectTypeId: form.projectTypeId,
            customer: form.customer,
            startDate: toIsoDate(form.startDate),
            endDate: toIsoDate(form.endDate),
            laborIntensity: form.laborIntensity,
        });

        toast.add({
            severity: 'success',
            summary: 'Информация сохранена',
            detail: 'Общая информация о проекте обновлена.',
            life: 2500,
        });

        emit('saved');
        emit('update:visible', false);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Не удалось сохранить блок',
            detail: buildProjectShowcaseErrorMessage(error, 'Проверьте заполнение полей.'),
            life: 3500,
        });
    } finally {
        saving.value = false;
    }
};

watch(
    () => props.visible,
    (visible) => {
        if (!visible) return;
        assignInitialData();
        loadProjectTypes();
    },
    { immediate: true }
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
