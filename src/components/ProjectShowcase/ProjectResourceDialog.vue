<template>
    <Dialog
        :visible="visible"
        modal
        header="Ресурсы проекта"
        :style="{ width: '38rem', maxWidth: '95vw' }"
        @update:visible="emit('update:visible', $event)"
    >
        <div class="project-dialog-grid">
            <div class="project-field">
                <label for="resource-type">Тип ресурса</label>
                <Select
                    id="resource-type"
                    v-model="form.resourceTypeId"
                    :options="resourceTypes"
                    optionLabel="title"
                    optionValue="id"
                    class="w-100"
                    :loading="loadingTypes"
                    placeholder="Выберите тип"
                />
            </div>
            <div class="project-field">
                <label for="resource-need">Потребность</label>
                <InputText id="resource-need" v-model.trim="form.need" class="w-100" />
            </div>
            <div class="project-field project-field-wide">
                <label for="resource-source">Источник / комментарий</label>
                <Textarea id="resource-source" v-model.trim="form.source" rows="4" class="w-100" autoResize />
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
import { addProjectResource, getResourceTypes } from '@/api/projectShowcase.js';
import {
    buildProjectShowcaseErrorMessage,
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
});

const emit = defineEmits(['update:visible', 'saved']);
const toast = useToast();

const form = reactive({
    resourceTypeId: null,
    need: '',
    source: '',
});

const resourceTypes = ref([]);
const loadingTypes = ref(false);
const saving = ref(false);

const normalizeResourceTypeId = (value) => {
    const rawValue = typeof value === 'object' && value !== null
        ? value.id
        : value;

    const normalizedValue = Number(rawValue);
    return Number.isFinite(normalizedValue) ? normalizedValue : null;
};

const reset = () => {
    form.resourceTypeId = null;
    form.need = '';
    form.source = '';
};

const loadResourceTypes = async () => {
    if (resourceTypes.value.length) return;

    loadingTypes.value = true;

    try {
        const response = await getResourceTypes();
        resourceTypes.value = Array.isArray(response.data)
            ? response.data.map((item) => ({
                ...item,
                title: translateProjectShowcaseTypeTitle(item.title),
            }))
            : [];
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить типы ресурсов',
            detail: buildProjectShowcaseErrorMessage(error, 'Откройте форму ещё раз.'),
            life: 3500,
        });
    } finally {
        loadingTypes.value = false;
    }
};

const submit = async () => {
    if (!props.projectId) {
        toast.add({
            severity: 'warn',
            summary: 'Не найден проект',
            detail: 'Обновите страницу проекта и попробуйте ещё раз.',
            life: 3000,
        });
        return;
    }

    const resourceTypeId = normalizeResourceTypeId(form.resourceTypeId);
    const normalizedNeed = form.need.trim();

    if (resourceTypeId === null || !normalizedNeed) {
        toast.add({
            severity: 'warn',
            summary: 'Форма заполнена не полностью',
            detail: 'Выберите тип ресурса и опишите потребность.',
            life: 3000,
        });
        return;
    }

    saving.value = true;

    try {
        await addProjectResource(props.projectId, {
            need: normalizedNeed,
            source: form.source,
            resourceTypeId,
        });

        toast.add({
            severity: 'success',
            summary: 'Ресурс добавлен',
            detail: 'Информация о ресурсе сохранена.',
            life: 2500,
        });

        emit('saved');
        emit('update:visible', false);
        reset();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Не удалось сохранить ресурс',
            detail: buildProjectShowcaseErrorMessage(error, 'Проверьте введённые данные.'),
            life: 3500,
        });
    } finally {
        saving.value = false;
    }
};

watch(
    () => props.visible,
    (visible) => {
        if (visible) {
            loadResourceTypes();
            return;
        }

        reset();
    }
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
