<template>
    <div class="condition-node" :class="`condition-node--${node.type || 'field'}`">
        <template v-if="isGroup">
            <div class="condition-node-head">
                <Select
                    :modelValue="node.type"
                    :options="groupTypes"
                    optionLabel="label"
                    optionValue="value"
                    class="condition-type-select"
                    @update:modelValue="onGroupTypeChange"
                />
                <div class="condition-node-actions">
                    <Button label="Поле" icon="pi pi-plus" size="small" text @click="addField" />
                    <Button label="И" size="small" text @click="addGroup('and')" />
                    <Button label="ИЛИ" size="small" text @click="addGroup('or')" />
                    <Button label="НЕ" size="small" text @click="addNot" />
                    <Button
                        v-if="!isRoot"
                        icon="pi pi-trash"
                        size="small"
                        text
                        rounded
                        severity="danger"
                        aria-label="Удалить условие"
                        @click="removeSelf"
                    />
                </div>
            </div>

            <div v-if="!node.children.length" class="condition-empty">
                Добавьте поле или группу условий.
            </div>

            <div v-else class="condition-children">
                <ConditionNodeItem
                    v-for="(child, index) in node.children"
                    :key="index"
                    :node="child"
                    :allow-answer="allowAnswer"
                    :questions="questions"
                    @change="emit('change')"
                    @remove="removeChild(index)"
                />
            </div>

            <small v-if="groupWarning" class="condition-warning">{{ groupWarning }}</small>
        </template>

        <template v-else-if="node.type === 'not'">
            <div class="condition-node-head">
                <Tag value="НЕ" severity="warn" />
                <Button
                    v-if="!isRoot"
                    icon="pi pi-trash"
                    size="small"
                    text
                    rounded
                    severity="danger"
                    aria-label="Удалить условие"
                    @click="removeSelf"
                />
            </div>
            <ConditionNodeItem
                v-if="node.children?.[0]"
                :node="node.children[0]"
                :allow-answer="allowAnswer"
                :questions="questions"
                @change="emit('change')"
                @remove="emit('remove')"
            />
        </template>

        <template v-else>
            <div class="condition-node-head">
                <Tag value="Поле" severity="contrast" />
                <Button
                    v-if="!isRoot"
                    icon="pi pi-trash"
                    size="small"
                    text
                    rounded
                    severity="danger"
                    aria-label="Удалить условие"
                    @click="removeSelf"
                />
            </div>

            <div class="condition-field-grid">
                <div v-if="allowAnswer" class="condition-field">
                    <label>Объект</label>
                    <Select
                        :modelValue="target"
                        :options="targets"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                        @update:modelValue="onTargetChange"
                    />
                </div>

                <div class="condition-field">
                    <label>{{ target === 'answer' ? 'Вопрос' : 'Поле' }}</label>

                    <Select
                        v-if="target === 'answer' && questions.length"
                        :modelValue="answerQuestionId"
                        :options="questionOptions"
                        optionLabel="label"
                        optionValue="value"
                        filter
                        placeholder="Выберите вопрос"
                        class="w-full"
                        @update:modelValue="onAnswerQuestionChange"
                    />

                    <InputText
                        v-else-if="target === 'answer'"
                        :modelValue="node.field || ''"
                        placeholder="q.<question id>"
                        class="w-full"
                        @update:modelValue="onRawFieldChange"
                    />

                    <Select
                        v-else-if="fieldRegistry.fields.length"
                        :modelValue="node.field || ''"
                        :options="fieldOptions"
                        optionLabel="label"
                        optionValue="value"
                        filter
                        placeholder="Выберите поле"
                        class="w-full"
                        @update:modelValue="onFieldChange"
                    />

                    <InputText
                        v-else
                        :modelValue="node.field || ''"
                        placeholder="Код поля (реестр пуст)"
                        class="w-full"
                        @update:modelValue="onRawFieldChange"
                    />
                </div>

                <div class="condition-field">
                    <label>Оператор</label>
                    <Select
                        :modelValue="node.op || 'eq'"
                        :options="allowedOperators"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full"
                        @update:modelValue="onOperatorChange"
                    />
                </div>
            </div>

            <div v-if="!isValueless" class="condition-value">
                <label>Значение</label>

                <Select
                    v-if="valueType === 'boolean'"
                    :modelValue="boolValue"
                    :options="booleanOptions"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                    @update:modelValue="onBooleanChange"
                />

                <InputText
                    v-else-if="isListOperator"
                    :modelValue="listValue"
                    placeholder="Значения через запятую"
                    class="w-full"
                    @update:modelValue="onListChange"
                />

                <InputNumber
                    v-else-if="valueType === 'number'"
                    :modelValue="numberValue"
                    :useGrouping="false"
                    class="w-full"
                    @update:modelValue="onNumberChange"
                />

                <InputText
                    v-else
                    :modelValue="node.stringValue ?? ''"
                    placeholder="Значение"
                    class="w-full"
                    @update:modelValue="onStringChange"
                />
            </div>

            <small v-if="leafWarning" class="condition-warning">{{ leafWarning }}</small>
        </template>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useSurveyFieldRegistry } from '@/stores/surveyFieldRegistry.js';

const props = defineProps({
    node: { type: Object, required: true },
    allowAnswer: { type: Boolean, default: false },
    questions: { type: Array, default: () => [] },
    isRoot: { type: Boolean, default: false },
});

const emit = defineEmits(['change', 'remove']);
const fieldRegistry = useSurveyFieldRegistry();

const groupTypes = [
    { label: 'И', value: 'and' },
    { label: 'ИЛИ', value: 'or' },
];

const targets = [
    { label: 'Поле пользователя', value: 'user' },
    { label: 'Ответ на вопрос', value: 'answer' },
];

const allOperators = [
    { label: 'равно', value: 'eq' },
    { label: 'не равно', value: 'neq' },
    { label: 'больше', value: 'gt' },
    { label: 'больше или равно', value: 'gte' },
    { label: 'меньше', value: 'lt' },
    { label: 'меньше или равно', value: 'lte' },
    { label: 'входит в список', value: 'in' },
    { label: 'не входит в список', value: 'not_in' },
    { label: 'задано', value: 'is_set' },
    { label: 'не задано', value: 'is_not_set' },
];

const operatorLabels = Object.fromEntries(allOperators.map((op) => [op.value, op.label]));
const numericOps = new Set(['gt', 'gte', 'lt', 'lte']);
const listOps = new Set(['in', 'not_in']);
const valuelessOps = new Set(['is_set', 'is_not_set']);
const comparingOps = new Set(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in']);

const isGroup = computed(() => ['and', 'or'].includes(props.node.type));
const target = computed(() => props.node.target || (props.allowAnswer ? 'answer' : 'user'));
const isListOperator = computed(() => listOps.has(props.node.op));
const isValueless = computed(() => valuelessOps.has(props.node.op));

const fieldOptions = computed(() => fieldRegistry.fields.map((field) => ({
    value: field.code,
    label: field.label || field.code,
})));

const questionOptions = computed(() => props.questions
    .filter((question) => question.type !== 'heading')
    .map((question) => ({ value: question.id, label: question.title || question.id })));

const answerQuestionId = computed(() => String(props.node.field || '').replace(/^q\./, ''));

const selectedField = computed(() => (
    target.value === 'user' ? fieldRegistry.getField(props.node.field) : null
));

const allowedOperators = computed(() => {
    if (target.value === 'user' && selectedField.value?.operators?.length) {
        return allOperators.filter((op) => selectedField.value.operators.includes(op.value));
    }
    return allOperators;
});

const valueType = computed(() => {
    if (numericOps.has(props.node.op)) return 'number';

    if (target.value === 'user') {
        const type = String(selectedField.value?.valueType || '').toLowerCase();
        if (['number', 'integer', 'int', 'decimal', 'double', 'float'].includes(type)) return 'number';
        if (['boolean', 'bool'].includes(type)) return 'boolean';
    }

    return 'string';
});

const boolValue = computed(() => {
    if (props.node.boolValue === true) return 'true';
    if (props.node.boolValue === false) return 'false';
    return '';
});

const booleanOptions = [
    { label: 'Да', value: 'true' },
    { label: 'Нет', value: 'false' },
];

const listValue = computed(() => (Array.isArray(props.node.listValue) ? props.node.listValue.join(', ') : ''));

const numberValue = computed(() => {
    if (props.node.intValue !== null && props.node.intValue !== undefined) return Number(props.node.intValue);
    if (props.node.doubleValue !== null && props.node.doubleValue !== undefined) return Number(props.node.doubleValue);
    return null;
});

const groupWarning = computed(() => {
    if (!isGroup.value) return '';
    const count = (props.node.children || []).length;
    return count > 0 && count < 2
        ? 'Для группы И/ИЛИ нужно минимум два условия.'
        : '';
});

const leafWarning = computed(() => {
    if (target.value === 'user') {
        if (!props.node.field) return 'Выберите поле из реестра.';
        if (!fieldRegistry.getField(props.node.field)) {
            return `Поле «${props.node.field}» отсутствует в реестре.`;
        }
    } else if (!props.node.field) {
        return 'Выберите вопрос.';
    }

    if (comparingOps.has(props.node.op) && isValueEmpty()) {
        return 'Для выбранного оператора нужно значение.';
    }

    return '';
});

const isValueEmpty = () => {
    if (props.node.listValue && props.node.listValue.length) return false;
    if (props.node.boolValue !== null && props.node.boolValue !== undefined) return false;
    if (props.node.intValue !== null && props.node.intValue !== undefined) return false;
    if (props.node.doubleValue !== null && props.node.doubleValue !== undefined) return false;
    return props.node.stringValue === null || props.node.stringValue === undefined || props.node.stringValue === '';
};

const clearValue = () => {
    delete props.node.stringValue;
    delete props.node.intValue;
    delete props.node.doubleValue;
    delete props.node.boolValue;
    delete props.node.listValue;
};

const syncOperator = () => {
    if (!allowedOperators.value.some((op) => op.value === props.node.op)) {
        props.node.op = allowedOperators.value[0]?.value || 'eq';
    }
};

const onGroupTypeChange = (value) => {
    props.node.type = value;
    emit('change');
};

const addField = () => {
    props.node.children.push({
        type: 'field',
        target: props.allowAnswer ? 'answer' : 'user',
        field: props.allowAnswer ? '' : (fieldRegistry.getCodes()[0] || ''),
        op: 'eq',
    });
    emit('change');
};

const addGroup = (type) => {
    props.node.children.push({ type, children: [] });
    emit('change');
};

const addNot = () => {
    props.node.children.push({
        type: 'not',
        children: [{
            type: 'field',
            target: props.allowAnswer ? 'answer' : 'user',
            field: '',
            op: 'eq',
        }],
    });
    emit('change');
};

const removeChild = (index) => {
    props.node.children.splice(index, 1);
    emit('change');
};

const removeSelf = () => emit('remove');

const onTargetChange = (value) => {
    props.node.target = value;
    props.node.field = value === 'user' ? (fieldRegistry.getCodes()[0] || '') : '';
    syncOperator();
    clearValue();
    emit('change');
};

const onFieldChange = (value) => {
    props.node.field = value;
    syncOperator();
    clearValue();
    emit('change');
};

const onRawFieldChange = (value) => {
    props.node.field = value;
    emit('change');
};

const onAnswerQuestionChange = (questionId) => {
    props.node.field = `q.${questionId}`;
    clearValue();
    emit('change');
};

const onOperatorChange = (value) => {
    props.node.op = value;
    clearValue();
    emit('change');
};

const onBooleanChange = (value) => {
    clearValue();
    props.node.boolValue = value === 'true';
    emit('change');
};

const onListChange = (value) => {
    clearValue();
    props.node.listValue = String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    emit('change');
};

const onNumberChange = (value) => {
    clearValue();
    if (value === null || value === undefined || value === '') {
        emit('change');
        return;
    }

    if (Number.isInteger(Number(value))) {
        props.node.intValue = Number(value);
    } else {
        props.node.doubleValue = Number(value);
    }

    emit('change');
};

const onStringChange = (value) => {
    clearValue();
    if (String(value || '').trim() !== '') {
        props.node.stringValue = value;
    }
    emit('change');
};
</script>

<style scoped>
.condition-node {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 0.75rem;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.14);
    border-radius: 14px;
    background: color-mix(in srgb, var(--p-content-background) 96%, var(--p-primary-color) 4%);
}

.condition-node--and,
.condition-node--or,
.condition-node--not {
    border-style: dashed;
    background: rgba(var(--p-blue-500-rgb), 0.035);
}

.condition-node-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.condition-node-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.15rem;
}

.condition-type-select {
    min-width: 7rem;
}

.condition-children {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    padding-left: 0.75rem;
    border-left: 2px solid rgba(var(--p-blue-500-rgb), 0.16);
}

.condition-field-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.55rem;
}

.condition-field,
.condition-value {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
}

.condition-field label,
.condition-value label {
    font-size: 0.74rem;
    color: var(--p-grey-1);
    font-weight: 600;
}

.condition-empty {
    color: var(--p-grey-1);
    font-size: 0.82rem;
}

.condition-warning {
    color: var(--p-orange-500);
    font-size: 0.76rem;
}
</style>
