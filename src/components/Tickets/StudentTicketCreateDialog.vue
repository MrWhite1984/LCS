<template>
    <div class="student-ticket-create-dialog">
        <Button v-if="showButton" icon="pi pi-plus" @click="visible = true" />
        <Dialog
            v-model:visible="visible"
            modal
            :draggable="false"
            :style="{ width: '100%', maxWidth: '42rem' }"
            header="Новая заявка на справку"
        >
            <div class="tickets-student-card-head student-ticket-create-dialog__head">
                <div>
                    <h4>Оформление справки</h4>
                    <p>Выберите тип справки, заполните форму и отправьте заявку.</p>
                </div>
                <Tag
                    :severity="selectedRequestTypeDetails ? 'success' : 'secondary'"
                    :value="selectedRequestTypeDetails ? 'Схема загружена' : 'Выберите тип справки'"
                />
            </div>

            <div class="tickets-student-form">
                <div class="tickets-student-field tickets-student-field-wide">
                    <label for="ticket-request-type">Тип справки</label>
                    <Select
                        id="ticket-request-type"
                        v-model="selectedRequestTypeId"
                        :options="activeRequestTypes"
                        optionLabel="name"
                        optionValue="id"
                        filter
                        placeholder="Выберите тип справки"
                        class="w-100"
                        :loading="requestTypesLoading"
                    />
                    <small v-if="selectedRequestTypeDescription" class="tickets-student-field-hint">
                        {{ selectedRequestTypeDescription }}
                    </small>
                </div>

                <div v-if="requestTypesError" class="tickets-student-inline-message tickets-student-inline-message-error">
                    <i class="pi pi-exclamation-triangle"></i>
                    <span>{{ requestTypesError }}</span>
                </div>

                <div v-else-if="requestTypeDetailsLoading" class="tickets-student-skeleton-grid">
                    <Skeleton v-for="item in 4" :key="item" height="4.2rem" borderRadius="16px" />
                </div>

                <div v-else-if="selectedRequestTypeDetails && selectedRequestTypeSchema.length" class="tickets-student-dynamic-grid">
                    <div
                        v-for="field in selectedRequestTypeSchema"
                        :key="field.name"
                        class="tickets-student-field"
                        :class="{ 'tickets-student-field-wide': isWideField(field) }"
                    >
                        <label :for="`ticket-field-${field.name}`">
                            {{ field.label || field.name }}
                            <span v-if="field.required || isGroupField(field)" class="tickets-required-mark">*</span>
                        </label>

                        <AutoComplete
                            v-if="isGroupField(field)"
                            :id="`ticket-field-${field.name}`"
                            :modelValue="groupSelections[field.name] ?? null"
                            :suggestions="filteredGroupOptions"
                            optionLabel="label"
                            field="label"
                            class="w-100"
                            :placeholder="field.placeholder || 'Начните вводить название группы...'"
                            :loading="groupsLoading"
                            :disabled="groupsLoading"
                            :invalid="Boolean(formErrors[field.name])"
                            dropdown
                            dropdownMode="blank"
                            forceSelection
                            showClear
                            @complete="searchStudentGroups"
                            @update:modelValue="onGroupSelectionChange(field.name, $event)"
                            @clear="clearGroupSelection(field.name)"
                        />

                        <InputText
                            v-else-if="field.type === 'Text'"
                            :id="`ticket-field-${field.name}`"
                            v-model.trim="formValues[field.name]"
                            class="w-100"
                            :placeholder="field.placeholder || ''"
                            :invalid="Boolean(formErrors[field.name])"
                        />

                        <Textarea
                            v-else-if="field.type === 'Textarea'"
                            :id="`ticket-field-${field.name}`"
                            v-model="formValues[field.name]"
                            class="w-100"
                            autoResize
                            rows="4"
                            :placeholder="field.placeholder || ''"
                            :invalid="Boolean(formErrors[field.name])"
                        />

                        <InputNumber
                            v-else-if="field.type === 'Number'"
                            :id="`ticket-field-${field.name}`"
                            v-model="formValues[field.name]"
                            class="w-100"
                            :useGrouping="false"
                            :invalid="Boolean(formErrors[field.name])"
                            fluid
                        />

                        <DatePicker
                            v-else-if="field.type === 'Date'"
                            :id="`ticket-field-${field.name}`"
                            v-model="formValues[field.name]"
                            class="w-100"
                            showIcon
                            dateFormat="dd.mm.yy"
                            :invalid="Boolean(formErrors[field.name])"
                        />

                        <input
                            v-else-if="field.type === 'Time'"
                            :id="`ticket-field-${field.name}`"
                            v-model="formValues[field.name]"
                            type="time"
                            class="p-inputtext p-component tickets-student-native-input"
                            :placeholder="field.placeholder || ''"
                        />

                        <input
                            v-else-if="field.type === 'Datetime'"
                            :id="`ticket-field-${field.name}`"
                            v-model="formValues[field.name]"
                            type="datetime-local"
                            class="p-inputtext p-component tickets-student-native-input"
                        />

                        <div v-else-if="field.type === 'Checkbox'" class="tickets-student-checkbox-wrap">
                            <Checkbox
                                :inputId="`ticket-field-${field.name}`"
                                v-model="formValues[field.name]"
                                binary
                            />
                            <label :for="`ticket-field-${field.name}`" class="tickets-student-checkbox-label">
                                {{ field.placeholder || 'Подтверждаю выбор' }}
                            </label>
                        </div>

                        <div v-else-if="field.type === 'Radio'" class="tickets-student-radio-group">
                            <div
                                v-for="option in field.options || []"
                                :key="`${field.name}-${option.value}`"
                                class="tickets-student-radio-option"
                            >
                                <RadioButton
                                    :inputId="`ticket-field-${field.name}-${option.value}`"
                                    v-model="formValues[field.name]"
                                    :value="option.value"
                                />
                                <label :for="`ticket-field-${field.name}-${option.value}`">
                                    {{ option.label }}
                                </label>
                            </div>
                        </div>

                        <Select
                            v-else-if="field.type === 'Select'"
                            :id="`ticket-field-${field.name}`"
                            v-model="formValues[field.name]"
                            :options="field.options || []"
                            optionLabel="label"
                            optionValue="value"
                            class="w-100"
                            :placeholder="field.placeholder || 'Выберите значение'"
                        />

                        <div v-else-if="field.type === 'File'" class="tickets-student-file-field">
                            <FileDropzone
                                compact
                                :disabled="Boolean(uploadingFieldNames[field.name])"
                                icon="pi pi-paperclip"
                                title="Перетащите файл сюда"
                                subtitle="или нажмите, чтобы выбрать файл"
                                active-subtitle="Отпустите файл для загрузки"
                                @select="onFieldFileSelected(field, $event)"
                            />
                            <div v-if="formValues[field.name]?.fileName" class="tickets-student-file-chip">
                                <Tag :value="formValues[field.name].fileName" severity="secondary" />
                            </div>
                        </div>

                        <InputText
                            v-else
                            :id="`ticket-field-${field.name}`"
                            v-model="formValues[field.name]"
                            class="w-100"
                            :placeholder="field.placeholder || ''"
                        />

                        <small v-if="formErrors[field.name]" class="p-error tickets-student-error">
                            {{ formErrors[field.name] }}
                        </small>
                        <small
                            v-else-if="isGroupField(field) && groupsLoadError"
                            class="p-error tickets-student-error"
                        >
                            {{ groupsLoadError }}
                        </small>
                    </div>
                </div>

                <div v-else-if="selectedRequestTypeId" class="tickets-student-inline-message">
                    <i class="pi pi-info-circle"></i>
                    <span>Для выбранного типа пока не пришла схема заполнения.</span>
                </div>

                <div v-else-if="!requestTypesLoading && !activeRequestTypes.length" class="tickets-student-inline-message">
                    <i class="pi pi-inbox"></i>
                    <span>Активные типы справок пока недоступны.</span>
                </div>

                <div class="tickets-student-form-footer">
                    <div class="tickets-student-form-note">
                        <i class="pi pi-info-circle"></i>
                        <span>При отправке заявки используется стандартный приоритет.</span>
                    </div>
                    <div class="student-ticket-create-dialog__actions">
                        <Button
                            label="Отмена"
                            text
                            severity="secondary"
                            :disabled="creatingTicket"
                            @click="handleCancel"
                        />
                        <Button
                            label="Отправить заявку"
                            icon="pi pi-send"
                            :loading="creatingTicket"
                            :disabled="!selectedRequestTypeId || requestTypeDetailsLoading || !selectedRequestTypeSchema.length"
                            @click="submitTicket"
                        />
                    </div>
                </div>
            </div>
        </Dialog>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { fileToBase64 } from '@/utils/ido.js';
import {
    createMyTicket,
    getTicketRequestType,
    getTicketRequestTypes,
} from '@/api/tickets.js';
import FileDropzone from '@/components/Utils/FileDropzone.vue';

defineProps({
    showButton: {
        type: Boolean,
        default: true,
    },
});

const emit = defineEmits(['created']);

const toast = useToast();

const visible = ref(false);
const requestTypesLoading = ref(false);
const requestTypeDetailsLoading = ref(false);
const creatingTicket = ref(false);
const requestTypesError = ref('');

const requestTypes = ref([]);
const requestTypeDetailsMap = ref({});
const selectedRequestTypeId = ref(null);
const formValues = ref({});
const formErrors = ref({});
const uploadingFieldNames = ref({});
const groupSelections = ref({});
const allGroupOptions = ref([]);
const filteredGroupOptions = ref([]);
const groupsLoading = ref(false);
const groupsLoadError = ref('');

let requestTypesLoaded = false;

const now = new Date();
const currentCalendarYear = now.getFullYear();
const currentStudyYear = now.getMonth() >= 8
    ? currentCalendarYear
    : currentCalendarYear - 1;
const studentGroupsYear = `${currentStudyYear}-${currentStudyYear + 1}`;

const activeRequestTypes = computed(() => (
    requestTypes.value
        .filter((item) => item?.isActive)
        .sort((left, right) => String(left?.name || '').localeCompare(String(right?.name || ''), 'ru'))
));

const selectedRequestTypeDetails = computed(() => (
    selectedRequestTypeId.value ? requestTypeDetailsMap.value[selectedRequestTypeId.value] || null : null
));

const selectedRequestTypeSchema = computed(() => (
    Array.isArray(selectedRequestTypeDetails.value?.formSchema)
        ? selectedRequestTypeDetails.value.formSchema
        : []
));

const selectedRequestTypeDescription = computed(() => (
    selectedRequestTypeDetails.value?.description
    || activeRequestTypes.value.find((item) => item.id === selectedRequestTypeId.value)?.description
    || ''
));

const parseBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === 'true' || normalized === '1' || normalized === 'yes';
    }
    if (typeof value === 'number') return value === 1;
    return false;
};

const parseDateValue = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const isGroupField = (field) => field?.name === 'eduGroup';

const normalizeSchemaDefaultValue = (field) => {
    const defaultValue = field?.defaultValue;

    if (defaultValue === null || defaultValue === undefined || defaultValue === '') {
        return field?.type === 'Checkbox' ? false : '';
    }

    switch (field?.type) {
        case 'Number': {
            const normalized = Number(defaultValue);
            return Number.isFinite(normalized) ? normalized : null;
        }
        case 'Checkbox':
            return parseBoolean(defaultValue);
        case 'Date':
            return parseDateValue(defaultValue);
        case 'Datetime':
            return String(defaultValue);
        default:
            return String(defaultValue);
    }
};

const buildInitialFormValues = (schema = []) => schema.reduce((accumulator, field) => {
    accumulator[field.name] = normalizeSchemaDefaultValue(field);
    return accumulator;
}, {});

const buildInitialFormErrors = (schema = []) => schema.reduce((accumulator, field) => {
    accumulator[field.name] = '';
    return accumulator;
}, {});

const buildInitialGroupSelections = (schema = []) => schema.reduce((accumulator, field) => {
    if (isGroupField(field)) {
        accumulator[field.name] = null;
    }

    return accumulator;
}, {});

const isWideField = (field) => ['Textarea', 'Radio', 'File'].includes(field?.type);

const extractGroupCode = (groupName) => {
    if (!groupName) return '';

    const match = String(groupName).match(/([А-Яа-яA-Za-z]+)[-\s]*(\d+)[-\s]*(\d+)?/);
    return match ? match[0] : '';
};

const mapGroupOption = (group) => {
    if (typeof group === 'string') {
        return {
            label: group,
            value: group,
            code: extractGroupCode(group),
        };
    }

    const label = group?.name || group?.title || group?.groupName || String(group?.id || '');
    return {
        label,
        value: group?.id || group?.code || label,
        code: group?.code || extractGroupCode(label),
    };
};

const ensureStudentGroupsLoaded = async () => {
    if (allGroupOptions.value.length || groupsLoading.value) return;

    groupsLoading.value = true;
    groupsLoadError.value = '';

    try {
        const response = await fetch('https://umu.sibadi.org/api/raspGrouplist?' + new URLSearchParams({
            year: studentGroupsYear,
        }));

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        allGroupOptions.value = Array.isArray(data?.data) ? data.data.map(mapGroupOption) : [];
        filteredGroupOptions.value = [...allGroupOptions.value];
    } catch (error) {
        console.debug('Ошибка при загрузке списка групп для справок:', error);
        allGroupOptions.value = [];
        filteredGroupOptions.value = [];
        groupsLoadError.value = 'Не удалось загрузить список групп. Попробуйте обновить страницу.';
    } finally {
        groupsLoading.value = false;
    }
};

const searchStudentGroups = async (event) => {
    await ensureStudentGroupsLoaded();

    const query = String(event?.query || '').trim().toLowerCase();

    if (!query) {
        filteredGroupOptions.value = [...allGroupOptions.value];
        return;
    }

    filteredGroupOptions.value = allGroupOptions.value.filter((group) => (
        group.label.toLowerCase().includes(query)
        || group.code.toLowerCase().includes(query)
    ));
};

const clearGroupSelection = (fieldName) => {
    groupSelections.value = {
        ...groupSelections.value,
        [fieldName]: null,
    };
    formValues.value = {
        ...formValues.value,
        [fieldName]: '',
    };
};

const onGroupSelectionChange = (fieldName, value) => {
    groupSelections.value = {
        ...groupSelections.value,
        [fieldName]: value,
    };

    const selectedLabel = value && typeof value === 'object' ? value.label || '' : '';

    formValues.value = {
        ...formValues.value,
        [fieldName]: selectedLabel,
    };

    formErrors.value = {
        ...formErrors.value,
        [fieldName]: selectedLabel ? '' : formErrors.value[fieldName],
    };
};

const hasValidGroupSelection = (fieldName) => {
    const selection = groupSelections.value[fieldName];

    return Boolean(
        selection
        && typeof selection === 'object'
        && selection.label
        && formValues.value[fieldName] === selection.label
    );
};

const formatDateOnly = (value) => {
    const date = parseDateValue(value);
    if (!date) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const serializeFieldValue = (field, value) => {
    switch (field?.type) {
        case 'Date':
            return formatDateOnly(value);
        case 'Number':
            return value === '' || value === null || value === undefined ? null : Number(value);
        case 'Checkbox':
            return Boolean(value);
        default:
            return value;
    }
};

const validateField = (field, value) => {
    if (isGroupField(field)) {
        return hasValidGroupSelection(field.name) ? '' : 'Выберите группу из списка.';
    }

    if (!field?.required) return '';

    switch (field?.type) {
        case 'Checkbox':
            return value ? '' : 'Поле нужно подтвердить.';
        case 'File':
            return value?.fileName ? '' : 'Выберите файл.';
        case 'Number':
            return value === 0 || Number.isFinite(Number(value)) ? '' : 'Введите число.';
        case 'Date':
            return formatDateOnly(value) ? '' : 'Укажите дату.';
        default:
            return String(value ?? '').trim() ? '' : 'Заполните поле.';
    }
};

const loadRequestTypes = async () => {
    requestTypesLoading.value = true;
    requestTypesError.value = '';

    try {
        const response = await getTicketRequestTypes();
        requestTypes.value = Array.isArray(response.data) ? response.data : [];

        if (!selectedRequestTypeId.value && requestTypes.value.length) {
            selectedRequestTypeId.value = activeRequestTypes.value[0]?.id || requestTypes.value[0]?.id || null;
        }
    } catch (error) {
        requestTypes.value = [];
        requestTypesError.value = error?.response?.data?.message || 'Не удалось загрузить типы справок.';
        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить типы справок',
            detail: requestTypesError.value,
            life: 3500,
        });
    } finally {
        requestTypesLoading.value = false;
    }
};

const loadRequestTypeDetails = async (requestTypeId) => {
    if (!requestTypeId) {
        formValues.value = {};
        formErrors.value = {};
        groupSelections.value = {};
        return;
    }

    if (requestTypeDetailsMap.value[requestTypeId]) {
        const schema = requestTypeDetailsMap.value[requestTypeId]?.formSchema || [];
        formValues.value = buildInitialFormValues(schema);
        formErrors.value = buildInitialFormErrors(schema);
        groupSelections.value = buildInitialGroupSelections(schema);
        if (schema.some(isGroupField)) {
            await ensureStudentGroupsLoaded();
        }
        return;
    }

    requestTypeDetailsLoading.value = true;

    try {
        const response = await getTicketRequestType(requestTypeId);
        requestTypeDetailsMap.value = {
            ...requestTypeDetailsMap.value,
            [requestTypeId]: response.data || null,
        };

        const schema = response.data?.formSchema || [];
        formValues.value = buildInitialFormValues(schema);
        formErrors.value = buildInitialFormErrors(schema);
        groupSelections.value = buildInitialGroupSelections(schema);

        if (schema.some(isGroupField)) {
            await ensureStudentGroupsLoaded();
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить форму справки',
            detail: error?.response?.data?.message || 'Попробуйте выбрать тип ещё раз.',
            life: 3500,
        });
        formValues.value = {};
        formErrors.value = {};
        groupSelections.value = {};
    } finally {
        requestTypeDetailsLoading.value = false;
    }
};

const onFieldFileSelected = async (field, files) => {
    const file = Array.from(files || [])[0];
    if (!file) return;

    uploadingFieldNames.value = {
        ...uploadingFieldNames.value,
        [field.name]: true,
    };

    try {
        const fileContent = await fileToBase64(file);
        formValues.value = {
            ...formValues.value,
            [field.name]: {
                fileName: file.name,
                fileContent,
                mimeType: file.type || 'application/octet-stream',
            },
        };
        formErrors.value = {
            ...formErrors.value,
            [field.name]: '',
        };
    } catch {
        toast.add({
            severity: 'error',
            summary: 'Не удалось обработать файл',
            detail: 'Выберите файл ещё раз.',
            life: 3000,
        });
    } finally {
        uploadingFieldNames.value = {
            ...uploadingFieldNames.value,
            [field.name]: false,
        };
    }
};

const submitTicket = async () => {
    if (!selectedRequestTypeId.value || !selectedRequestTypeSchema.value.length) return;

    if (selectedRequestTypeSchema.value.some(isGroupField)) {
        await ensureStudentGroupsLoaded();
    }

    const nextErrors = buildInitialFormErrors(selectedRequestTypeSchema.value);
    const preparedFormData = {};
    let hasErrors = false;

    selectedRequestTypeSchema.value.forEach((field) => {
        const currentValue = formValues.value[field.name];
        const validationError = validateField(field, currentValue);

        if (validationError) {
            nextErrors[field.name] = validationError;
            hasErrors = true;
            return;
        }

        preparedFormData[field.name] = serializeFieldValue(field, currentValue);
    });

    formErrors.value = nextErrors;

    if (hasErrors) {
        toast.add({
            severity: 'warn',
            summary: 'Заполните обязательные поля',
            detail: 'Проверьте форму перед отправкой заявки.',
            life: 3000,
        });
        return;
    }

    creatingTicket.value = true;

    try {
        const response = await createMyTicket({
            requestTypeId: selectedRequestTypeId.value,
            formData: JSON.stringify(preparedFormData),
            priority: 'Medium',
        });

        toast.add({
            severity: 'success',
            summary: 'Заявка создана',
            detail: response.data?.number
                ? `Заявке присвоен номер ${response.data.number}.`
                : 'Заявка на получение справки успешно отправлена.',
            life: 3500,
        });

        emit('created', response.data);
        resetForm();
        visible.value = false;
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Не удалось создать заявку',
            detail: error?.response?.data?.message || 'Проверьте введённые данные и повторите попытку.',
            life: 3500,
        });
    } finally {
        creatingTicket.value = false;
    }
};

const resetForm = () => {
    selectedRequestTypeId.value = null;
    formValues.value = {};
    formErrors.value = {};
    groupSelections.value = {};
    uploadingFieldNames.value = {};
};

const handleCancel = () => {
    if (creatingTicket.value) return;
    resetForm();
    visible.value = false;
};

const openModal = async () => {
    if (!requestTypesLoaded) {
        await loadRequestTypes();
        requestTypesLoaded = true;
    }
    visible.value = true;
};

watch(selectedRequestTypeId, async (newValue, oldValue) => {
    if (!newValue || newValue === oldValue) {
        if (!newValue) {
            formValues.value = {};
            formErrors.value = {};
            groupSelections.value = {};
        }
        return;
    }

    await loadRequestTypeDetails(newValue);
});

watch(visible, (nextVisible) => {
    if (!nextVisible && !creatingTicket.value) {
        resetForm();
    }
});

onMounted(async () => {
    if (visible.value) {
        await openModal();
    }
});

defineExpose({
    openModal,
});
</script>

<style scoped>
.student-ticket-create-dialog__head {
    margin-bottom: 1rem;
}

.student-ticket-create-dialog__head h4,
.student-ticket-create-dialog__head p {
    margin: 0;
}

.student-ticket-create-dialog__head p {
    margin-top: 0.45rem;
    color: var(--p-grey-1);
    line-height: 1.5;
}

.student-ticket-create-dialog__actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.tickets-student-form,
.tickets-student-dynamic-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.tickets-student-dynamic-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.tickets-student-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.tickets-student-field-wide {
    grid-column: 1 / -1;
}

.tickets-student-field label {
    font-weight: 600;
    color: var(--p-text-color);
}

.tickets-required-mark {
    color: var(--p-red-500);
}

.tickets-student-field-hint {
    color: var(--p-grey-1);
    line-height: 1.45;
}

.tickets-student-native-input {
    width: 100%;
}

.tickets-student-checkbox-wrap,
.tickets-student-radio-option {
    display: flex;
    align-items: center;
    gap: 0.65rem;
}

.tickets-student-checkbox-label {
    cursor: pointer;
    color: var(--p-text-color);
}

.tickets-student-radio-group {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    padding: 0.9rem 1rem;
    border-radius: 14px;
    border: 1px solid var(--tickets-student-border);
    background: var(--tickets-student-soft-bg);
}

.tickets-student-file-field {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
}

.tickets-student-file-chip {
    display: flex;
    justify-content: flex-start;
}

.tickets-student-error {
    margin-top: -0.1rem;
}

.tickets-student-skeleton-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
}

.tickets-student-inline-message {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.95rem 1rem;
    border-radius: 14px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.14);
    background: rgba(var(--p-blue-500-rgb), 0.05);
    color: var(--p-text-color);
}

.tickets-student-inline-message-error {
    border-color: rgba(var(--p-red-500-rgb), 0.2);
    background: rgba(var(--p-red-500-rgb), 0.08);
}

.tickets-student-form-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    padding-top: 0.25rem;
}

.tickets-student-form-note {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    color: var(--p-grey-1);
}

@media (max-width: 768px) {
    .tickets-student-form-footer {
        flex-direction: column;
        align-items: stretch;
    }

    .tickets-student-dynamic-grid,
    .tickets-student-skeleton-grid {
        grid-template-columns: 1fr;
    }

    .student-ticket-create-dialog__actions {
        justify-content: flex-end;
    }
}
</style>
