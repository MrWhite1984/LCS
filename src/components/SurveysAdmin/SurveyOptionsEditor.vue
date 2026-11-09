<template>
    <div class="options-editor">
        <div v-if="!items.length" class="options-empty">
            Вариантов пока нет. Добавьте первый вариант ответа.
        </div>

        <VueDraggable
            v-else
            :model-value="items"
            :animation="180"
            handle=".option-drag"
            ghost-class="option-ghost"
            class="options-list"
            @update:modelValue="onReorder"
        >
            <div v-for="(option, index) in items" :key="option.id || index" class="option-row">
                <span class="option-drag" title="Перетащить вариант">
                    <i class="pi pi-bars"></i>
                </span>
                <span class="option-index">{{ index + 1 }}</span>
                <InputText :modelValue="option.label" placeholder="Вариант ответа" class="option-label" @update:modelValue="(value) => updateOption(index, 'label', value)" />
                <Button icon="pi pi-times" text rounded size="small" severity="danger" aria-label="Удалить вариант" @click="removeOption(index)" />
            </div>
        </VueDraggable>

        <Button label="Добавить вариант" icon="pi pi-plus" size="small" outlined @click="addOption" />
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

const props = defineProps({
    modelValue: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:modelValue']);
const items = ref(normalize(props.modelValue));

function normalize(options) {
    return (options || []).map((option) => ({
        id: option.id || '',
        label: option.label || '',
        position: option.position || 0,
        enabled: option.enabled !== false,
    }));
}

function clone(value) {
    return JSON.parse(JSON.stringify(value || []));
}

watch(() => props.modelValue, (value) => {
    if (JSON.stringify(items.value) !== JSON.stringify(normalize(value))) {
        items.value = normalize(value);
    }
}, { deep: true });

const emitItems = () => {
    emit('update:modelValue', clone(items.value).map((option, index) => ({
        id: option.id || '',
        label: option.label,
        position: index + 1,
        enabled: option.enabled !== false,
    })));
};

const updateOption = (index, field, value) => {
    const option = items.value[index];
    if (!option) return;
    option[field] = value;
    emitItems();
};

const onReorder = (value) => {
    items.value = Array.isArray(value) ? value : [];
    emitItems();
};

const addOption = () => {
    items.value.push({ id: '', label: '', position: items.value.length + 1, enabled: true });
    emitItems();
};

const removeOption = (index) => {
    items.value.splice(index, 1);
    emitItems();
};
</script>

<style scoped>
.options-editor {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.options-empty {
    padding: 0.65rem;
    border: 1px dashed var(--p-content-border-color);
    border-radius: 10px;
    color: var(--p-grey-1);
    font-size: 0.8rem;
}

.options-list {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.option-row {
    display: grid;
    grid-template-columns: 1.6rem 1.7rem minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.35rem;
}

.option-drag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.6rem;
    height: 1.7rem;
    border-radius: 8px;
    color: var(--p-grey-1);
    cursor: grab;
}

.option-drag:hover {
    background: rgba(var(--p-blue-500-rgb), 0.1);
    color: var(--p-primary-color);
}

.option-drag:active {
    cursor: grabbing;
}

.option-ghost {
    opacity: 0.35;
}

.option-index {
    display: grid;
    place-items: center;
    width: 1.7rem;
    height: 1.7rem;
    border-radius: 50%;
    background: rgba(var(--p-blue-500-rgb), 0.1);
    color: var(--p-primary-color);
    font-size: 0.72rem;
    font-weight: 700;
}

@media (max-width: 720px) {
    .option-row {
        grid-template-columns: 1.4rem 1.5rem minmax(0, 1fr) auto;
    }
}
</style>
