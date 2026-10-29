<template>
    <div class="options-editor">
        <div v-if="!items.length" class="options-empty">
            Вариантов пока нет. Добавьте первый вариант ответа.
        </div>

        <div v-else class="options-list">
            <div v-for="(option, index) in items" :key="index" class="option-row">
                <span class="option-index">{{ index + 1 }}</span>
                <InputText v-model="option.label" placeholder="Подпись" class="option-label" />
                <InputText v-model="option.id" placeholder="id" class="option-id" />
                <InputText v-model="option.semestr" placeholder="семестр" class="option-semestr" />
                <Button icon="pi pi-times" text rounded size="small" severity="danger" aria-label="Удалить вариант" @click="removeOption(index)" />
            </div>
        </div>

        <Button label="Добавить вариант" icon="pi pi-plus" size="small" outlined @click="addOption" />
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';

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
        semestr: option.semestr || '',
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
        ...option,
        position: index + 1,
        enabled: option.enabled !== false,
        semestr: option.semestr || null,
    })));
};

const addOption = () => {
    items.value.push({ id: '', label: '', position: items.value.length + 1, enabled: true, semestr: '' });
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
    grid-template-columns: 1.7rem minmax(0, 2fr) minmax(0, 1fr) minmax(0, 0.8fr) auto;
    align-items: center;
    gap: 0.35rem;
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
        grid-template-columns: 1.7rem 1fr auto;
    }

    .option-id,
    .option-semestr {
        grid-column: span 1;
    }
}
</style>
