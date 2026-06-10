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
import { addProjectGeneralInformation } from '@/api/projectShowcase.js';
import {
    buildProjectShowcaseErrorMessage,
    toIsoDate,
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
const saving = ref(false);

const form = reactive({
    startDate: null,
    endDate: null,
    laborIntensity: '',
});

const assignInitialData = () => {
    form.startDate = props.initialData?.startDate ? new Date(props.initialData.startDate) : null;
    form.endDate = props.initialData?.endDate ? new Date(props.initialData.endDate) : null;
    form.laborIntensity = props.initialData?.laborIntensity || '';
};

const submit = async () => {
    if (!props.projectId) return;

    saving.value = true;

    try {
        await addProjectGeneralInformation(props.projectId, {
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
