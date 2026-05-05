<template>
    <main class="tickets-student-page">
        <section class="tickets-student-shell">
            <header class="tickets-student-header">
                <div class="tickets-student-copy">
                    <Tag rounded severity="info">Справки</Tag>
                    <h2>Заявки на получение справок</h2>
                    <p>Выберите тип справки, заполните форму и отслеживайте статус уже созданных заявок</p>
                </div>

                <div class="tickets-student-actions">
                    <Button
                        icon="pi pi-refresh"
                        label="Обновить"
                        outlined
                        severity="secondary"
                        :loading="requestTypesLoading || requestTypeDetailsLoading || listLoading"
                        @click="refreshPage"
                    />
                    <Button
                        v-if="canCreateStudentTickets && canReadStudentTickets"
                        icon="pi pi-list"
                        label="К списку заявок"
                        text
                        @click="scrollToList"
                    />
                </div>
            </header>

            <PermissionDenied v-if="!canAccessTicketsStudent" />

            <template v-else>
                <section class="tickets-student-top-grid">
                    <article v-if="canCreateStudentTickets" class="tickets-student-card tickets-student-card-form">
                        <div class="tickets-student-card-head">
                            <div>
                                <h3>Новая заявка</h3>
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
                                        <span v-if="field.required" class="tickets-required-mark">*</span>
                                    </label>

                                    <InputText
                                        v-if="field.type === 'Text'"
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
                                <Button
                                    label="Отправить заявку"
                                    icon="pi pi-send"
                                    :loading="creatingTicket"
                                    :disabled="!selectedRequestTypeId || requestTypeDetailsLoading || !selectedRequestTypeSchema.length"
                                    @click="submitTicket"
                                />
                            </div>
                        </div>
                    </article>

                </section>

                <section
                    v-if="canReadStudentTickets"
                    ref="listSectionRef"
                    class="tickets-student-card tickets-student-card-list"
                >
                    <div class="tickets-student-card-head">
                        <div>
                            <h3>Ранее сформированные заявки</h3>
                        </div>
                        <Tag :value="`Всего: ${totalRecords}`" severity="contrast" />
                    </div>

                    <div class="tickets-student-list-filters">
                        <InputText
                            :model-value="listFilters.number"
                            placeholder="Поиск по номеру"
                            @update:model-value="onListFilterChange('number', $event)"
                        />
                        <Select
                            v-model="listFilters.status"
                            :options="statusOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Статус"
                            @change="onListFilterChange('status', $event.value)"
                        />
                        <Select
                            v-model="listFilters.priority"
                            :options="priorityOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Приоритет"
                            @change="onListFilterChange('priority', $event.value)"
                        />
                        <Select
                            v-model="rowsPerPage"
                            :options="rowsPerPageOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Строк на странице"
                            @change="onRowsPerPageChange"
                        />
                        <Button
                            icon="pi pi-filter-slash"
                            label="Сбросить"
                            text
                            severity="secondary"
                            @click="resetListFilters"
                        />
                    </div>

                    <div v-if="isPhone" class="tickets-student-mobile-list">
                        <div v-if="studentTickets.length" class="tickets-student-mobile-cards">
                            <article
                                v-for="ticket in studentTickets"
                                :key="ticket.id"
                                class="tickets-student-mobile-card"
                            >
                                <div class="tickets-student-mobile-card-head">
                                    <div>
                                        <strong>№ {{ ticket.number || '—' }}</strong>
                                        <span>{{ ticket.requestType?.name || 'Тип не указан' }}</span>
                                    </div>
                                    <Tag
                                        :severity="getStatusSeverity(ticket.status)"
                                        :value="getStatusLabel(ticket.status)"
                                        :icon="getStatusIcon(ticket.status)"
                                    />
                                </div>

                                <div class="tickets-student-mobile-meta">
                                    <Tag
                                        :severity="getPrioritySeverity(ticket.priority)"
                                        :value="getPriorityLabel(ticket.priority)"
                                    />
                                    <span>{{ formatDate(ticket.createdAt) }}</span>
                                </div>

                                <div class="tickets-student-mobile-summary">
                                    {{ ticket.summary }}
                                </div>
                            </article>
                        </div>

                        <div v-else class="tickets-student-empty-state">
                            <i class="pi pi-inbox"></i>
                            <h4>Заявки не найдены</h4>
                            <p>{{ hasActiveListFilters ? 'Измените параметры фильтрации и попробуйте ещё раз.' : 'У вас пока нет созданных заявок на справки.' }}</p>
                        </div>

                        <Paginator
                            :rows="rowsPerPage"
                            :first="firstRowIndex"
                            :totalRecords="totalRecords"
                            @page="onPage"
                        />
                    </div>

                    <DataTable
                        v-else
                        lazy
                        paginator
                        scrollable
                        stripedRows
                        class="tickets-student-table"
                        :value="studentTickets"
                        :loading="listLoading"
                        :rows="rowsPerPage"
                        :first="firstRowIndex"
                        :totalRecords="totalRecords"
                        :rowsPerPageOptions="[5, 10, 20]"
                        @page="onPage"
                    >
                        <template #empty>
                            <div class="tickets-student-empty-state">
                                <i class="pi pi-inbox"></i>
                                <h4>Заявки не найдены</h4>
                                <p>{{ hasActiveListFilters ? 'Измените параметры фильтрации и попробуйте ещё раз.' : 'У вас пока нет созданных заявок на справки.' }}</p>
                            </div>
                        </template>

                        <Column field="number" header="№" style="width: 110px;" />
                        <Column field="requestType.name" header="Тип справки" style="min-width: 260px;">
                            <template #body="{ data }">
                                <div class="tickets-student-table-main">
                                    <strong>{{ data.requestType?.name || 'Не указан' }}</strong>
                                    <small>{{ data.summary }}</small>
                                </div>
                            </template>
                        </Column>
                        <Column field="status" header="Статус" style="width: 170px;">
                            <template #body="{ data }">
                                <Tag
                                    :severity="getStatusSeverity(data.status)"
                                    :value="getStatusLabel(data.status)"
                                    :icon="getStatusIcon(data.status)"
                                />
                            </template>
                        </Column>
                        <Column field="priority" header="Приоритет" style="width: 150px;">
                            <template #body="{ data }">
                                <Tag
                                    :severity="getPrioritySeverity(data.priority)"
                                    :value="getPriorityLabel(data.priority)"
                                />
                            </template>
                        </Column>
                        <Column field="createdAt" header="Создана" style="width: 180px;">
                            <template #body="{ data }">
                                {{ formatDate(data.createdAt) }}
                            </template>
                        </Column>
                        <Column field="updatedAt" header="Обновлена" style="width: 180px;">
                            <template #body="{ data }">
                                {{ formatDate(data.updatedAt) }}
                            </template>
                        </Column>
                    </DataTable>
                </section>
            </template>
        </section>
    </main>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { usePermissionStore } from '@/stores/permissions.js';
import { fileToBase64 } from '@/utils/ido.js';
import { formatDateRuLongWithTime as formatDate } from '@/utils/date.js';
import { useResponsiveLayout } from '@/composables/useResponsiveLayout.js';
import {
    createMyTicket,
    getTicketRequestType,
    getTicketRequestTypes,
    listMyTickets,
} from '@/api/tickets.js';
import PermissionDenied from '@/components/Utils/PermissionDenied.vue';
import FileDropzone from '@/components/Utils/FileDropzone.vue';

const toast = useToast();
const permissionStore = usePermissionStore();
const { isPhone } = useResponsiveLayout();

const requestTypesLoading = ref(false);
const requestTypeDetailsLoading = ref(false);
const listLoading = ref(false);
const creatingTicket = ref(false);
const requestTypesError = ref('');

const requestTypes = ref([]);
const requestTypeDetailsMap = ref({});
const selectedRequestTypeId = ref(null);
const formValues = ref({});
const formErrors = ref({});
const uploadingFieldNames = ref({});

const studentTickets = ref([]);
const totalRecords = ref(0);
const currentPage = ref(1);
const rowsPerPage = ref(10);
const rowsPerPageOptions = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '20', value: 20 },
];

const listFilters = ref({
    number: '',
    status: null,
    priority: null,
});

const listSectionRef = ref(null);

const canReadStudentTickets = computed(() => permissionStore.hasPermission('TicketsStudent', 'Read'));
const canCreateStudentTickets = computed(() => permissionStore.hasPermission('TicketsStudent', 'Create'));
const canAccessTicketsStudent = computed(() => canReadStudentTickets.value || canCreateStudentTickets.value);

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

const firstRowIndex = computed(() => (currentPage.value - 1) * rowsPerPage.value);
const hasActiveListFilters = computed(() => Boolean(
    String(listFilters.value.number || '').trim()
    || listFilters.value.status
    || listFilters.value.priority
));

const statusOptions = [
    { label: 'Все статусы', value: null },
    { label: 'Новая', value: 'New' },
    { label: 'Открыта', value: 'Open' },
    { label: 'Назначена', value: 'Assigned' },
    { label: 'В ожидании', value: 'Pending' },
    { label: 'Решена', value: 'Resolved' },
    { label: 'Закрыта', value: 'Closed' },
    { label: 'Отменена', value: 'Cancelled' },
];

const priorityOptions = [
    { label: 'Любой приоритет', value: null },
    { label: 'Низкий', value: 'Low' },
    { label: 'Средний', value: 'Medium' },
    { label: 'Высокий', value: 'High' },
];

const statusMap = {
    New: 'Новая',
    Open: 'Открыта',
    Assigned: 'Назначена',
    Pending: 'В ожидании',
    Resolved: 'Решена',
    Closed: 'Закрыта',
    Cancelled: 'Отменена',
};

const priorityMap = {
    Low: 'Низкий',
    Medium: 'Средний',
    High: 'Высокий',
};

const getStatusSeverity = (status) => ({
    New: 'info',
    Open: 'warning',
    Assigned: 'success',
    Pending: 'secondary',
    Resolved: 'success',
    Closed: 'secondary',
    Cancelled: 'danger',
}[status] || 'contrast');

const getStatusLabel = (status) => statusMap[status] || status || 'Не указан';
const getStatusIcon = (status) => ({
    New: 'pi pi-plus-circle',
    Open: 'pi pi-folder-open',
    Assigned: 'pi pi-verified',
    Pending: 'pi pi-hourglass',
    Resolved: 'pi pi-check-circle',
    Closed: 'pi pi-lock',
    Cancelled: 'pi pi-times-circle',
}[status] || 'pi pi-info-circle');

const getPrioritySeverity = (priority) => ({
    Low: 'success',
    Medium: 'warning',
    High: 'danger',
}[priority] || 'secondary');

const getPriorityLabel = (priority) => priorityMap[priority] || priority || 'Не указан';

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

const isWideField = (field) => ['Textarea', 'Radio', 'File'].includes(field?.type);

const normalizeNumberFilter = (value) => {
    const normalized = String(value || '').trim();
    if (!normalized) return null;
    const numericValue = Number(normalized);
    return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : null;
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

const parseTicketFormData = (formData) => {
    if (!formData) return {};

    try {
        return typeof formData === 'string' ? JSON.parse(formData) : formData;
    } catch {
        return {};
    }
};

const buildTicketSummary = (ticket) => {
    const parsed = parseTicketFormData(ticket?.formData);
    const values = Object.values(parsed || {})
        .map((value) => {
            if (value && typeof value === 'object') {
                return value.fileName || '';
            }

            return String(value || '').trim();
        })
        .filter(Boolean);

    return values.slice(0, 2).join(' • ') || 'Дополнительные данные не указаны';
};

const enrichStudentTickets = (items = []) => (
    Array.isArray(items)
        ? items.map((ticket) => ({
            ...ticket,
            summary: buildTicketSummary(ticket),
        }))
        : []
);

const loadRequestTypes = async () => {
    if (!canCreateStudentTickets.value) return;

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
        return;
    }

    if (requestTypeDetailsMap.value[requestTypeId]) {
        const schema = requestTypeDetailsMap.value[requestTypeId]?.formSchema || [];
        formValues.value = buildInitialFormValues(schema);
        formErrors.value = buildInitialFormErrors(schema);
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
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить форму справки',
            detail: error?.response?.data?.message || 'Попробуйте выбрать тип ещё раз.',
            life: 3500,
        });
        formValues.value = {};
        formErrors.value = {};
    } finally {
        requestTypeDetailsLoading.value = false;
    }
};

const fetchStudentTickets = async () => {
    if (!canReadStudentTickets.value) return;

    listLoading.value = true;

    try {
        const response = await listMyTickets({
            page: currentPage.value,
            pageSize: rowsPerPage.value,
            number: normalizeNumberFilter(listFilters.value.number),
            status: listFilters.value.status || undefined,
            priority: listFilters.value.priority || undefined,
        });

        studentTickets.value = enrichStudentTickets(response.data?.tickets);
        totalRecords.value = Number(response.data?.totalCount) || 0;
    } catch (error) {
        studentTickets.value = [];
        totalRecords.value = 0;
        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить список заявок',
            detail: error?.response?.data?.message || 'Попробуйте обновить страницу позже.',
            life: 3500,
        });
    } finally {
        listLoading.value = false;
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

        formValues.value = buildInitialFormValues(selectedRequestTypeSchema.value);
        formErrors.value = buildInitialFormErrors(selectedRequestTypeSchema.value);

        if (canReadStudentTickets.value) {
            currentPage.value = 1;
            await fetchStudentTickets();
            await nextTick();
            scrollToList();
        }
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

const resetListFilters = async () => {
    listFilters.value = {
        number: '',
        status: null,
        priority: null,
    };
    currentPage.value = 1;
    await fetchStudentTickets();
};

const onListFilterChange = async (field, value) => {
    listFilters.value = {
        ...listFilters.value,
        [field]: value,
    };
    currentPage.value = 1;
    await fetchStudentTickets();
};

const onRowsPerPageChange = async () => {
    currentPage.value = 1;
    await fetchStudentTickets();
};

const onPage = async (event) => {
    currentPage.value = Number(event.page) + 1;
    rowsPerPage.value = Number(event.rows);
    await fetchStudentTickets();
};

const scrollToList = () => {
    listSectionRef.value?.scrollIntoView?.({
        behavior: 'smooth',
        block: 'start',
    });
};

const refreshPage = async () => {
    await Promise.all([
        loadRequestTypes(),
        fetchStudentTickets(),
    ]);

    if (selectedRequestTypeId.value) {
        await loadRequestTypeDetails(selectedRequestTypeId.value);
    }
};

watch(selectedRequestTypeId, async (newValue, oldValue) => {
    if (!newValue || newValue === oldValue) {
        if (!newValue) {
            formValues.value = {};
            formErrors.value = {};
        }
        return;
    }

    await loadRequestTypeDetails(newValue);
});

onMounted(async () => {
    if (!canAccessTicketsStudent.value) return;

    await Promise.all([
        loadRequestTypes(),
        fetchStudentTickets(),
    ]);
});
</script>

<style scoped>
.tickets-student-page {
    --tickets-student-border: rgba(var(--p-blue-500-rgb), 0.14);
    --tickets-student-soft-bg: rgba(var(--p-blue-500-rgb), 0.05);
    min-height: 100%;
    padding: 10px;
}

.tickets-student-shell {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 100%;
    padding: 1.25rem;
    border-radius: 20px;
    border: 1px solid var(--tickets-student-border);
    background:
        radial-gradient(1000px 220px at 0% 0%, rgba(var(--p-blue-500-rgb), 0.08), transparent 60%),
        linear-gradient(180deg, var(--p-bg-color-2) 0%, var(--p-bg-color-1) 100%);
    box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
}

.tickets-student-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
}

.tickets-student-copy h2 {
    margin: 0.75rem 0 0;
}

.tickets-student-copy p {
    margin: 0.65rem 0 0;
    max-width: 70ch;
    color: var(--p-grey-1);
    line-height: 1.5;
}

.tickets-student-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.tickets-student-top-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
}

.tickets-student-card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.15rem;
    border-radius: 18px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.1);
    background:
        linear-gradient(
            180deg,
            color-mix(in srgb, var(--p-content-background) 96%, var(--p-primary-color) 4%),
            color-mix(in srgb, var(--p-content-background) 90%, var(--p-primary-color) 10%)
        );
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}

.tickets-student-card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
}

.tickets-student-card-head h3,
.tickets-student-card-head p {
    margin: 0;
}

.tickets-student-card-head p {
    margin-top: 0.45rem;
    color: var(--p-grey-1);
    line-height: 1.5;
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
    border: 1px solid var(--tickets-student-border);
    background: var(--tickets-student-soft-bg);
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

.tickets-student-list-filters {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.75rem;
    align-items: center;
}

.tickets-student-mobile-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.tickets-student-mobile-cards {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
}

.tickets-student-mobile-card {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding: 1rem;
    border-radius: 16px;
    border: 1px solid var(--tickets-student-border);
    background: rgba(var(--p-blue-500-rgb), 0.04);
}

.tickets-student-mobile-card-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.75rem;
}

.tickets-student-mobile-card-head strong,
.tickets-student-mobile-card-head span {
    display: block;
}

.tickets-student-mobile-card-head span {
    margin-top: 0.25rem;
    color: var(--p-grey-1);
}

.tickets-student-mobile-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.tickets-student-mobile-summary {
    color: var(--p-text-color);
    line-height: 1.5;
}

.tickets-student-table-main {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.tickets-student-table-main small {
    color: var(--p-grey-1);
    line-height: 1.4;
}

.tickets-student-table :deep(.p-datatable-table-container) {
    min-height: 12rem;
}

.tickets-student-empty-state {
    min-height: 220px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
}

.tickets-student-empty-state i {
    font-size: 2rem;
    color: var(--p-grey-1);
}

.tickets-student-empty-state h4,
.tickets-student-empty-state p {
    margin: 0;
}

.tickets-student-empty-state p {
    max-width: 48ch;
    color: var(--p-grey-1);
}

@media (max-width: 1100px) {
    .tickets-student-top-grid {
        grid-template-columns: 1fr;
    }

    .tickets-student-list-filters {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 768px) {
    .tickets-student-shell {
        padding: 1rem;
    }

    .tickets-student-header,
    .tickets-student-card-head,
    .tickets-student-form-footer {
        flex-direction: column;
        align-items: stretch;
    }

    .tickets-student-actions {
        justify-content: flex-start;
    }

    .tickets-student-dynamic-grid,
    .tickets-student-skeleton-grid,
    .tickets-student-list-filters {
        grid-template-columns: 1fr;
    }

    .tickets-student-mobile-card-head,
    .tickets-student-mobile-meta {
        flex-direction: column;
        align-items: stretch;
    }
}
</style>
