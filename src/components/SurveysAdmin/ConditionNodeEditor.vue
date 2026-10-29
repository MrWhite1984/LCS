<template>
    <div class="condition-editor">
        <div v-if="fieldRegistry.isLoading" class="condition-editor-loading">
            <i class="pi pi-spin pi-spinner"></i>
            Загрузка полей…
        </div>

        <ConditionNodeItem
            :node="root"
            :allow-answer="allowAnswer"
            :questions="questions"
            is-root
            @change="onChange"
        />
    </div>
</template>

<script setup>
import { onMounted, reactive, watch } from 'vue';
import { useSurveyFieldRegistry } from '@/stores/surveyFieldRegistry.js';
import ConditionNodeItem from './ConditionNodeItem.vue';

const props = defineProps({
    modelValue: { type: Object, default: null },
    allowAnswer: { type: Boolean, default: false },
    questions: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:modelValue']);
const fieldRegistry = useSurveyFieldRegistry();

const root = reactive({ type: 'and', children: [] });

const clone = (value) => JSON.parse(JSON.stringify(value));

const getValue = () => {
    if (root.children.length === 0) return null;
    if (root.children.length === 1) return clone(root.children[0]);
    return clone({ type: root.type, children: root.children });
};

const applyValue = (node) => {
    if (node && ['and', 'or'].includes(node.type)) {
        root.type = node.type;
        root.children = clone(node.children || []);
        return;
    }

    if (node) {
        root.type = 'and';
        root.children = [clone(node)];
        return;
    }

    root.type = 'and';
    root.children = [];
};

const onChange = () => {
    emit('update:modelValue', getValue());
};

watch(() => props.modelValue, (value) => {
    if (JSON.stringify(getValue()) === JSON.stringify(value)) return;
    applyValue(value);
}, { immediate: true, deep: true });

onMounted(() => {
    fieldRegistry.load().catch(() => {});
});
</script>

<style scoped>
.condition-editor {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.condition-editor-loading {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--p-grey-1);
    font-size: 0.78rem;
}
</style>
