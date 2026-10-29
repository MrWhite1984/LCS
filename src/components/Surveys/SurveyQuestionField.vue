<template>
    <div
        class="survey-question"
        :class="{
            'survey-question--heading': question.type === 'heading',
            'survey-question--invalid': Boolean(error),
        }"
    >
        <template v-if="question.type === 'heading'">
            <h4 class="survey-question-heading">{{ question.title }}</h4>
            <p v-if="question.helpText" class="survey-question-help">{{ question.helpText }}</p>
        </template>

        <template v-else>
            <div class="survey-question-head">
                <label class="survey-question-label">
                    {{ question.title }}
                    <span v-if="question.isRequired" class="survey-question-required">*</span>
                </label>
                <small v-if="question.helpText" class="survey-question-help">{{ question.helpText }}</small>
            </div>

            <div v-if="['single', 'yes_no'].includes(question.type)" class="survey-options">
                <div v-for="option in optionList" :key="option.id" class="survey-option">
                    <RadioButton
                        v-model="radioValue"
                        :value="option.id"
                        :name="radioName"
                        :inputId="optionInputId(option)"
                    />
                    <label :for="optionInputId(option)">{{ option.label }}</label>
                </div>
            </div>

            <div v-else-if="question.type === 'multi'" class="survey-options">
                <div v-for="option in optionList" :key="option.id" class="survey-option">
                    <Checkbox
                        v-model="multiValue"
                        :value="option.id"
                        :name="radioName"
                        :inputId="optionInputId(option)"
                    />
                    <label :for="optionInputId(option)">{{ option.label }}</label>
                </div>
            </div>

            <Select
                v-else-if="question.type === 'select'"
                v-model="radioValue"
                :options="optionList"
                optionLabel="label"
                optionValue="id"
                :placeholder="question.isRequired ? 'Выберите вариант' : 'Не выбрано'"
                :showClear="!question.isRequired"
                class="w-full"
            />

            <div v-else-if="question.type === 'rating'" class="survey-rating">
                <Rating v-model="numberValue" :cancel="false" :stars="ratingStars" />
                <span class="survey-rating-value">{{ numberValue ?? '—' }}</span>
            </div>

            <div v-else-if="question.type === 'scale'" class="survey-scale">
                <Slider
                    v-model="numberValue"
                    :min="scaleMin"
                    :max="scaleMax"
                    :step="1"
                    class="survey-scale-slider"
                />
                <div class="survey-scale-meta">
                    <span>{{ scaleMin }}</span>
                    <Tag :value="String(numberValue ?? '—')" severity="contrast" />
                    <span>{{ scaleMax }}</span>
                </div>
            </div>

            <InputNumber
                v-else-if="['number', 'integer'].includes(question.type)"
                v-model="numberValue"
                :useGrouping="false"
                :mode="question.type === 'number' ? 'decimal' : 'decimal'"
                :minFractionDigits="question.type === 'integer' ? 0 : 0"
                :maxFractionDigits="question.type === 'integer' ? 0 : 6"
                :step="question.type === 'number' ? 0.01 : 1"
                :placeholder="question.isRequired ? 'Введите значение' : 'Необязательно'"
                class="w-full"
            />

            <DatePicker
                v-else-if="question.type === 'date'"
                v-model="dateValue"
                dateFormat="dd.mm.yy"
                :showButtonBar="true"
                :placeholder="question.isRequired ? 'Выберите дату' : 'Необязательно'"
                class="w-full"
            />

            <Textarea
                v-else-if="question.type === 'longtext'"
                v-model="textValue"
                rows="4"
                autoResize
                :placeholder="textPlaceholder"
                class="w-full"
            />

            <InputText
                v-else-if="question.type === 'inn'"
                :modelValue="textValue"
                inputmode="numeric"
                maxlength="12"
                :placeholder="textPlaceholder"
                class="w-full"
                @update:modelValue="handleInnInput"
            />

            <InputText
                v-else
                v-model="textValue"
                :type="textInputType"
                :placeholder="textPlaceholder"
                class="w-full"
            />

            <p v-if="error" class="survey-question-error">{{ error }}</p>
        </template>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    question: { type: Object, required: true },
    modelValue: { type: [String, Number, Boolean, Array, Date], default: null },
    error: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue']);

const yesNoOptions = [
    { id: 'Да', label: 'Да' },
    { id: 'Нет', label: 'Нет' },
];

const optionList = computed(() => (
    props.question.type === 'yes_no' ? yesNoOptions : (props.question.options || [])
));

const radioName = computed(() => `survey-${props.question.id}`);

const radioValue = computed({
    get: () => props.modelValue ?? null,
    set: (value) => emit('update:modelValue', value),
});

const multiValue = computed({
    get: () => (Array.isArray(props.modelValue) ? props.modelValue : []),
    set: (value) => emit('update:modelValue', value),
});

const numberValue = computed({
    get: () => {
        if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '') {
            return null;
        }
        return Number(props.modelValue);
    },
    set: (value) => emit('update:modelValue', value),
});

const dateValue = computed({
    get: () => {
        if (props.modelValue instanceof Date) return props.modelValue;
        if (!props.modelValue) return null;
        const date = new Date(props.modelValue);
        return Number.isNaN(date.getTime()) ? null : date;
    },
    set: (value) => emit('update:modelValue', value),
});

const textValue = computed({
    get: () => (props.modelValue === null || props.modelValue === undefined ? '' : String(props.modelValue)),
    set: (value) => emit('update:modelValue', value),
});

const scaleMin = computed(() => props.question.scaleMin ?? 1);
const scaleMax = computed(() => props.question.scaleMax ?? 10);
const ratingStars = computed(() => props.question.scaleMax ?? 5);

const textInputType = computed(() => {
    if (props.question.type === 'email') return 'email';
    if (props.question.type === 'url') return 'url';
    return 'text';
});

const textPlaceholder = computed(() => {
    if (props.question.type === 'email') return 'name@example.com';
    if (props.question.type === 'url') return 'https://example.com';
    if (props.question.type === 'inn') return '10 или 12 цифр';
    if (props.question.type === 'city_country') return 'Город, страна';
    return props.question.isRequired ? 'Введите ответ' : 'Необязательно';
});

const optionInputId = (option) => (
    `${props.question.id}-${String(option.id).replace(/[^a-zA-Z0-9_-]/g, '_')}`
);

const handleInnInput = (value) => {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 12);
    emit('update:modelValue', digits);
};
</script>

<style scoped>
.survey-question {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    padding: 1rem;
    border-radius: 16px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
    background: color-mix(in srgb, var(--p-content-background) 94%, var(--p-primary-color) 6%);
}

.survey-question--heading {
    border-style: dashed;
    background: rgba(var(--p-blue-500-rgb), 0.04);
}

.survey-question--invalid {
    border-color: color-mix(in srgb, var(--p-red-500) 55%, transparent);
    background: color-mix(in srgb, var(--p-red-500) 3%, var(--p-content-background));
}

.survey-question-head {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.survey-question-heading {
    margin: 0;
    font-size: 1.1rem;
}

.survey-question-label {
    font-weight: 700;
    line-height: 1.35;
}

.survey-question-required {
    color: var(--p-red-500);
}

.survey-question-help {
    margin: 0;
    color: var(--p-grey-1);
    font-size: 0.8rem;
    line-height: 1.4;
}

.survey-question-error {
    margin: 0;
    color: var(--p-red-500);
    font-size: 0.78rem;
    line-height: 1.35;
}

.survey-options {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
}

.survey-option {
    display: flex;
    align-items: flex-start;
    gap: 0.55rem;
    min-width: 0;
}

.survey-option label {
    cursor: pointer;
    line-height: 1.35;
}

.survey-rating {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.survey-rating-value {
    min-width: 1.5rem;
    color: var(--p-grey-1);
    font-weight: 700;
}

.survey-scale {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.35rem 0.2rem 0;
}

.survey-scale-slider {
    width: 100%;
}

.survey-scale-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    color: var(--p-grey-1);
    font-size: 0.78rem;
}

.survey-question :deep(.p-select),
.survey-question :deep(.p-inputnumber),
.survey-question :deep(.p-datepicker),
.survey-question :deep(.p-inputtext),
.survey-question :deep(.p-textarea) {
    width: 100%;
}

.survey-question :deep(.p-rating) {
    color: var(--p-primary-color);
}
</style>
