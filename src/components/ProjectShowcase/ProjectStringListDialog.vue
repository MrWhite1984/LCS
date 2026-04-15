<template>
    <Dialog
        :visible="visible"
        modal
        :header="config.header"
        :style="{ width: '38rem', maxWidth: '95vw' }"
        @update:visible="emit('update:visible', $event)"
    >
        <div class="project-list-dialog">
            <div
                v-for="(item, index) in items"
                :key="`list-item-${index}`"
                class="project-list-row"
            >
                <InputText v-model.trim="items[index]" class="w-100" :placeholder="config.placeholder" />
                <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    :disabled="items.length === 1"
                    @click="removeItem(index)"
                />
            </div>

            <Button label="Добавить строку" icon="pi pi-plus" outlined @click="items.push('')" />
        </div>

        <template #footer>
            <Button label="Отмена" severity="secondary" text @click="emit('update:visible', false)" :disabled="saving" />
            <Button :label="config.submitLabel" icon="pi pi-check" :loading="saving" @click="submit" />
        </template>
    </Dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { addProjectCriterias, addProjectTasks } from '@/api/projectShowcase.js';
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
    kind: {
        type: String,
        default: 'tasks',
    },
});

const emit = defineEmits(['update:visible', 'saved']);
const toast = useToast();

const items = ref(['']);
const saving = ref(false);

const config = computed(() => {
    if (props.kind === 'criteria') {
        return {
            header: 'Критерии выполнения проекта',
            placeholder: 'Введите критерий',
            submitLabel: 'Сохранить критерии',
            summary: 'Критерии сохранены',
        };
    }

    return {
        header: 'Задачи проекта',
        placeholder: 'Введите задачу',
        submitLabel: 'Сохранить задачи',
        summary: 'Задачи сохранены',
    };
});

const reset = () => {
    items.value = [''];
};

const removeItem = (index) => {
    items.value.splice(index, 1);
};

const submit = async () => {
    const normalizedItems = [...new Set(items.value.map((item) => item.trim()).filter(Boolean))];
    if (!normalizedItems.length || !props.projectId) {
        toast.add({
            severity: 'warn',
            summary: 'Нет данных для сохранения',
            detail: 'Добавьте хотя бы одну строку.',
            life: 3000,
        });
        return;
    }

    saving.value = true;

    try {
        if (props.kind === 'criteria') {
            await addProjectCriterias(props.projectId, normalizedItems);
        } else {
            await addProjectTasks(props.projectId, normalizedItems);
        }

        toast.add({
            severity: 'success',
            summary: config.value.summary,
            detail: 'Изменения сохранены.',
            life: 2500,
        });

        emit('saved');
        emit('update:visible', false);
        reset();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Не удалось сохранить список',
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
        if (!visible) reset();
    }
);
</script>

<style scoped>
.project-list-dialog {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
}

.project-list-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}
</style>
