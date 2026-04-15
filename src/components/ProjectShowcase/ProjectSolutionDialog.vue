<template>
    <Dialog
        :visible="visible"
        modal
        header="Решение проектного офиса"
        :style="{ width: '34rem', maxWidth: '95vw' }"
        @update:visible="emit('update:visible', $event)"
    >
        <div class="project-dialog-grid">
            <div class="project-field">
                <label class="project-check-item">
                    <Checkbox v-model="form.isApproved" binary />
                    <span>Проект одобрен</span>
                </label>
            </div>

            <div class="project-field">
                <label for="solution-description">Описание решения</label>
                <Textarea id="solution-description" v-model.trim="form.solutionDescription" rows="5" class="w-100" autoResize />
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
import { createProjectSolution } from '@/api/projectShowcase.js';
import { buildProjectShowcaseErrorMessage } from '@/utils/projectShowcase.js';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false,
    },
    projectId: {
        type: Number,
        default: null,
    },
    responsibleUserId: {
        type: Number,
        default: null,
    },
});

const emit = defineEmits(['update:visible', 'saved']);

const toast = useToast();

const form = reactive({
    isApproved: true,
    solutionDescription: '',
});

const saving = ref(false);

const reset = () => {
    form.isApproved = true;
    form.solutionDescription = '';
};

const submit = async () => {
    if (!props.projectId || !props.responsibleUserId) {
        toast.add({
            severity: 'warn',
            summary: 'Недостаточно данных',
            detail: 'Не найден пользователь проектной витрины для сохранения решения.',
            life: 3000,
        });
        return;
    }

    saving.value = true;

    try {
        await createProjectSolution({
            projectId: props.projectId,
            responsibleUserId: props.responsibleUserId,
            isApproved: form.isApproved,
            solutionDescription: form.solutionDescription,
        });

        toast.add({
            severity: 'success',
            summary: 'Решение создано',
            detail: 'Решение проектного офиса сохранено.',
            life: 2500,
        });

        emit('saved');
        emit('update:visible', false);
        reset();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Не удалось сохранить решение',
            detail: buildProjectShowcaseErrorMessage(error, 'Повторите попытку немного позже.'),
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
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.project-field {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
}

.project-check-item {
    display: flex;
    gap: 0.65rem;
    align-items: center;
    font-weight: 600;
}
</style>
