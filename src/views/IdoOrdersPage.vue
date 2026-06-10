<template>
    <div class="ido-orders-page">
        <div class="ido-page-header">
            <div class="ido-header-copy">
                <div class="ido-header-row">
                    <div class="ido-header-icon">
                        <i class="pi pi-list-check"></i>
                    </div>
                    <div>
                        <h2 class="m-0">Список консультаций</h2>
                        <p class="text-color-secondary mt-2 mb-0">
                            {{
                                role === 'su'
                                    ? 'Общий список заявок с быстрым просмотром и административными действиями.'
                                    : 'Ваши консультации и сформированные договоры.'
                            }}
                        </p>
                        <div v-if="showRoleSwitcher" class="ido-role-switcher">
                            <span class="ido-role-switcher-label">Показывать заказы как:</span>
                            <SelectButton
                                v-model="role"
                                :options="availableRoleOptions"
                                optionLabel="label"
                                optionValue="value"
                                @change="handleRoleChange"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <Button
                icon="pi pi-refresh"
                label="Обновить"
                outlined
                severity="secondary"
                :loading="loading"
                @click="fetchOrders"
            />
        </div>

        <Card v-if="role === 'su'" class="ido-filter-card">
            <template #title>Фильтры администратора</template>
            <template #content>
                <div class="ido-filters">
                    <div class="ido-field">
                        <label for="ido-filter-teacher">Преподаватель</label>
                        <AutoComplete
                            id="ido-filter-teacher"
                            v-model="selectedTeacher"
                            :suggestions="teacherSuggestions"
                            optionLabel="fullName"
                            showClear
                            forceSelection
                            placeholder="Начните вводить ФИО преподавателя"
                            :loading="teacherLoading"
                            @complete="searchTeacherOptions"
                            @item-select="(event) => filters.teacherId = event.value.id"
                            @clear="clearTeacherFilter"
                        />
                    </div>
                    <div class="ido-field">
                        <label for="ido-filter-employer">Employer Id</label>
                        <InputText id="ido-filter-employer" v-model.trim="filters.employerId" placeholder="UUID сотрудника" />
                    </div>
                    <div class="ido-field">
                        <label for="ido-filter-lks">Пользователь ЛКС</label>
                        <AutoComplete
                            id="ido-filter-lks"
                            v-model="selectedEmployerLksUser"
                            :suggestions="employerLksSuggestions"
                            optionLabel="fullName"
                            dropdown
                            dropdownMode="blank"
                            showClear
                            forceSelection
                            placeholder="Выберите пользователя ЛКС"
                            :loading="employerLksLoading"
                            @complete="searchEmployerLksOptions"
                            @item-select="(event) => filters.employerLksId = event.value.id"
                            @clear="clearEmployerLksFilter"
                        />
                    </div>
                    <div class="ido-filter-actions">
                        <Button icon="pi pi-filter" @click="applyFilters" />
                        <Button
                            label="Получить отчет"
                            icon="pi pi-file-excel"
                            severity="success"
                            outlined
                            :loading="reportLoading"
                            @click="openReportDialog"
                        />
                        <Button icon="pi pi-eraser" severity="secondary" outlined @click="resetFilters" />
                    </div>
                </div>
            </template>
        </Card>

        <Dialog
            v-model:visible="reportDialogVisible"
            modal
            header="Получить отчет за период"
            :style="{ width: 'min(32rem, calc(100vw - 2rem))' }"
        >
            <div class="ido-report-dialog">
                <p class="ido-report-description">
                    Укажите дату начала и дату окончания, если хотите ограничить период. Оба поля можно оставить пустыми.
                </p>

                <div class="ido-report-fields">
                    <div class="ido-field">
                        <label for="ido-report-start">Дата начала</label>
                        <DatePicker
                            id="ido-report-start"
                            v-model="reportPeriod.startDate"
                            showIcon
                            showButtonBar
                            :manualInput="false"
                            inputClass="w-full"
                        />
                    </div>
                    <div class="ido-field">
                        <label for="ido-report-end">Дата окончания</label>
                        <DatePicker
                            id="ido-report-end"
                            v-model="reportPeriod.endDate"
                            showIcon
                            showButtonBar
                            :manualInput="false"
                            inputClass="w-full"
                        />
                    </div>
                </div>
            </div>

            <template #footer>
                <Button
                    label="Отмена"
                    icon="pi pi-times"
                    severity="secondary"
                    text
                    :disabled="reportLoading"
                    @click="reportDialogVisible = false"
                />
                <Button
                    label="Скачать отчет"
                    icon="pi pi-download"
                    :loading="reportLoading"
                    @click="downloadOrdersReport"
                />
            </template>
        </Dialog>

        <Card class="ido-table-card">
            <template #content>
                <DataTable
                    lazy
                    paginator
                    scrollable
                    stripedRows
                    :rows="rowsPerPage"
                    :totalRecords="totalRecords"
                    :value="orders"
                    :loading="loading"
                    :rowsPerPageOptions="[5, 10, 15]"
                    @page="onPage"
                    @row-click="openOrder"
                >
                    <template #empty>
                        <div class="ido-empty-state">
                            <i class="pi pi-inbox fs-2"></i>
                            <h4 class="mt-3 mb-2">Заявки не найдены</h4>
                            <p class="text-color-secondary mb-0">Попробуйте обновить список или изменить фильтры.</p>
                        </div>
                    </template>

                    <Column field="topic" header="Тема" style="min-width: 260px;" />
                    <Column field="teacher" header="Преподаватель" style="min-width: 240px;">
                        <template #body="{ data }">
                            {{ buildTeacherLabel(data.teacher) || '-' }}
                        </template>
                    </Column>
                    <Column field="employer" header="Заказчик" style="min-width: 220px;">
                        <template #body="{ data }">
                            {{ buildEmployerLabel(data.employer) || '-' }}
                        </template>
                    </Column>
                    <Column field="hoursQuantity" header="Часы" style="width: 120px;" />
                    <Column field="sum" header="Сумма" style="width: 160px;">
                        <template #body="{ data }">
                            {{ formatCurrency(data.sum) }}
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Card>

        <IdoOrderDetailsDialog
            v-model:visible="detailsVisible"
            :order-id="selectedOrderId"
            :role="role"
            @updated="handleOrderUpdated"
        />
    </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { debounce } from 'lodash';
import { useToast } from 'primevue/usetoast';
import { usePermissionStore } from '@/stores/permissions.js';
import axiosInstance from '@/utils/axios.js';
import { getCurrentUser } from '@/utils/currentUser.js';
import { exportIdoOrdersReport, getIdoOrders, searchTeachers } from '@/api/ido.js';
import { buildEmployerLabel, buildTeacherLabel, downloadBase64Document, getIdoAvailableRoles, isUuid } from '@/utils/ido.js';
import IdoOrderDetailsDialog from '@/components/Ido/IdoOrderDetailsDialog.vue';

const permissionStore = usePermissionStore();
const toast = useToast();

const loading = ref(true);
const teacherLoading = ref(false);
const employerLksLoading = ref(false);
const reportLoading = ref(false);
const orders = ref([]);
const totalRecords = ref(0);
const rowsPerPage = ref(10);
const currentPage = ref(1);
const role = ref('employer-lks');
const availableRoles = ref(['employer-lks']);
const selectedOrderId = ref('');
const detailsVisible = ref(false);
const selectedTeacher = ref(null);
const selectedEmployerLksUser = ref(null);
const teacherSuggestions = ref([]);
const employerLksSuggestions = ref([]);
const reportDialogVisible = ref(false);

const filters = reactive({
    teacherId: '',
    employerId: '',
    employerLksId: '',
});

const reportPeriod = reactive({
    startDate: null,
    endDate: null,
});

const formatCurrency = (value) => new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2,
}).format(Number(value || 0));

const availableRoleOptions = computed(() => availableRoles.value.map((value) => ({
    value,
    label: value === 'teacher' ? 'Преподаватель' : 'Заказчик',
})));

const showRoleSwitcher = computed(() =>
    role.value !== 'su' && availableRoleOptions.value.length > 1
);

const requestParams = computed(() => {
    const params = {
        Page: currentPage.value,
        PageSize: rowsPerPage.value,
    };

    if (role.value === 'su') {
        if (isUuid(filters.teacherId)) params.TeacherId = filters.teacherId;
        if (isUuid(filters.employerId)) params.EmployerId = filters.employerId;
        if (isUuid(filters.employerLksId)) params.EmployerLksId = filters.employerLksId;
    }

    return params;
});

const resolveTotalRecords = (data) => {
    const candidates = [
        data?.totalCount,
        data?.countEntities,
        data?.countAllEntities,
        data?.totalRecords,
    ];

    const directTotal = candidates.find((value) => Number.isFinite(Number(value)));
    if (directTotal !== undefined) {
        return Number(directTotal);
    }

    const pageCount = Number(data?.pageCount);
    if (Number.isFinite(pageCount) && pageCount > 0) {
        return pageCount * rowsPerPage.value;
    }

    return Array.isArray(data?.orderResponses) ? data.orderResponses.length : 0;
};

const padDatePart = (value) => String(value).padStart(2, '0');

const formatDateTimeWithOffset = (value) => {
    const offsetMinutes = -value.getTimezoneOffset();
    const offsetSign = offsetMinutes >= 0 ? '+' : '-';
    const absoluteOffsetMinutes = Math.abs(offsetMinutes);
    const offsetHours = padDatePart(Math.floor(absoluteOffsetMinutes / 60));
    const offsetRemainderMinutes = padDatePart(absoluteOffsetMinutes % 60);

    return `${value.getFullYear()}-${padDatePart(value.getMonth() + 1)}-${padDatePart(value.getDate())}`
        + `T${padDatePart(value.getHours())}:${padDatePart(value.getMinutes())}:${padDatePart(value.getSeconds())}`
        + `${offsetSign}${offsetHours}:${offsetRemainderMinutes}`;
};

const normalizeReportDate = (value, endOfDay = false) => {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) return undefined;

    const normalized = new Date(value);

    if (endOfDay) {
        normalized.setHours(23, 59, 59, 999);
    } else {
        normalized.setHours(0, 0, 0, 0);
    }

    return formatDateTimeWithOffset(normalized);
};

const ensureExcelFileName = (value) => {
    const normalized = String(value || '').trim();

    if (!normalized) return 'ido-orders-report.xlsx';

    return /\.(xlsx|xls)$/i.test(normalized) ? normalized : `${normalized}.xlsx`;
};

const loadTeachersDebounced = debounce(async (query) => {
    const normalizedQuery = query?.trim() || '';

    teacherLoading.value = true;

    try {
        const response = await searchTeachers(normalizedQuery);
        teacherSuggestions.value = (response.data || []).map((teacher) => ({
            ...teacher,
            fullName: buildTeacherLabel(teacher),
        }));
    } catch (error) {
        console.debug('Ошибка поиска преподавателя для фильтра ИДО:', error);
        teacherSuggestions.value = [];
    } finally {
        teacherLoading.value = false;
    }
}, 300);

const buildLksUserLabel = (user) => [user?.firstName, user?.middleName, user?.lastName].filter(Boolean).join(' ');

const loadEmployerLksUsersDebounced = debounce(async (query) => {
    const normalizedQuery = query?.trim().toLowerCase();

    employerLksLoading.value = true;

    try {
        const response = await axiosInstance.post('/api/users/list', {
            page: 1,
            pageSize: 500,
            isBlocked: false,
        });

        employerLksSuggestions.value = (response.data?.entities || [])
            .filter((user) => !normalizedQuery || buildLksUserLabel(user).toLowerCase().includes(normalizedQuery))
            .map((user) => ({
                ...user,
                fullName: buildLksUserLabel(user),
            }));
    } catch (error) {
        console.debug('Ошибка поиска пользователя ЛКС для фильтра ИДО:', error);
        employerLksSuggestions.value = [];
    } finally {
        employerLksLoading.value = false;
    }
}, 300);

const detectRole = async () => {
    const currentUser = await getCurrentUser();
    availableRoles.value = getIdoAvailableRoles(currentUser, permissionStore);
    role.value = availableRoles.value[0] || 'employer-lks';
};

const handleRoleChange = () => {
    currentPage.value = 1;
    selectedOrderId.value = '';
    detailsVisible.value = false;
    fetchOrders();
};

const fetchOrders = async () => {
    loading.value = true;

    try {
        const response = await getIdoOrders(role.value, requestParams.value);
        orders.value = response.data?.orderResponses || [];
        totalRecords.value = resolveTotalRecords(response.data);
    } catch (error) {
        console.debug('Ошибка загрузки списка заявок ИДО:', error);
        orders.value = [];
        totalRecords.value = 0;
    } finally {
        loading.value = false;
    }
};

const searchTeacherOptions = (event) => {
    loadTeachersDebounced(event.query);
};

const searchEmployerLksOptions = (event) => {
    loadEmployerLksUsersDebounced(event.query);
};

const clearTeacherFilter = () => {
    selectedTeacher.value = null;
    filters.teacherId = '';
};

const clearEmployerLksFilter = () => {
    selectedEmployerLksUser.value = null;
    filters.employerLksId = '';
};

const applyFilters = () => {
    currentPage.value = 1;
    fetchOrders();
};

const resetFilters = () => {
    selectedTeacher.value = null;
    selectedEmployerLksUser.value = null;
    filters.teacherId = '';
    filters.employerId = '';
    filters.employerLksId = '';
    currentPage.value = 1;
    fetchOrders();
};

const openReportDialog = () => {
    reportDialogVisible.value = true;
};

const downloadOrdersReport = async () => {
    if (reportLoading.value) return;

    const hasInvalidRange = reportPeriod.startDate
        && reportPeriod.endDate
        && reportPeriod.startDate > reportPeriod.endDate;

    if (hasInvalidRange) {
        toast.add({
            severity: 'warn',
            summary: 'Отчет ИДО',
            detail: 'Дата начала не может быть позже даты окончания.',
            life: 3500,
        });
        return;
    }

    reportLoading.value = true;

    try {
        const response = await exportIdoOrdersReport({
            startDate: normalizeReportDate(reportPeriod.startDate),
            endDate: normalizeReportDate(reportPeriod.endDate, true),
        });

        const fileName = ensureExcelFileName(response.data?.fileName);
        const content = response.data?.content;

        if (!content) {
            throw new Error('Пустой ответ отчета');
        }

        downloadBase64Document(
            content,
            fileName,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        reportDialogVisible.value = false;

        toast.add({
            severity: 'success',
            summary: 'Отчет ИДО',
            detail: 'Excel-отчет успешно сформирован.',
            life: 3000,
        });
    } catch (error) {
        console.debug('Ошибка выгрузки Excel-отчета ИДО:', error);
        toast.add({
            severity: 'error',
            summary: 'Отчет ИДО',
            detail: 'Не удалось получить Excel-отчет.',
            life: 4000,
        });
    } finally {
        reportLoading.value = false;
    }
};

const onPage = (event) => {
    currentPage.value = event.page + 1;
    rowsPerPage.value = event.rows;
    fetchOrders();
};

const openOrder = ({ data }) => {
    selectedOrderId.value = data.id;
    detailsVisible.value = true;
};

const handleOrderUpdated = () => {
    fetchOrders();
};

onMounted(async () => {
    await detectRole();
    await fetchOrders();
});
</script>

<style scoped>
.ido-orders-page {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 10px 2rem 2rem;
    color: var(--p-text-color);
}

.ido-page-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    padding: 0;
}

.ido-header-copy {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.ido-role-switcher {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.9rem;
}

.ido-role-switcher-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--p-text-color);
}

.ido-role-switcher-control {
    display: inline-flex;
    padding: 0.28rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--p-primary-500) 7%, var(--p-content-background));
    border: 1px solid color-mix(in srgb, var(--p-primary-500) 12%, var(--p-content-border-color));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.ido-role-switcher-control :deep(.p-selectbutton) {
    display: inline-flex;
    gap: 0.2rem;
    background: transparent;
    border: 0;
}

.ido-role-switcher-control :deep(.p-togglebutton) {
    min-height: 34px;
    padding: 0.48rem 0.95rem;
    border-radius: 999px;
    border: 0;
    background: transparent;
    color: var(--p-text-color-secondary);
    font-weight: 600;
    box-shadow: none;
    transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.ido-role-switcher-control :deep(.p-togglebutton:not(.p-togglebutton-checked):hover) {
    background: rgba(var(--p-primary-500-rgb), 0.08);
    color: var(--p-text-color);
}

.ido-role-switcher-control :deep(.p-togglebutton.p-togglebutton-checked) {
    background: var(--p-primary-color);
    color: var(--p-primary-contrast-color);
    box-shadow: 0 8px 18px rgba(var(--p-primary-500-rgb), 0.2);
}

.ido-role-switcher-control :deep(.p-togglebutton .p-button-label) {
    line-height: 1;
}

.ido-header-row {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
}

.ido-header-icon {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, rgba(var(--p-primary-500-rgb), 0.14), rgba(var(--p-primary-500-rgb), 0.06));
    color: var(--p-primary-color);
    border: 1px solid rgba(var(--p-primary-500-rgb), 0.12);
    flex-shrink: 0;
}

.ido-header-icon .pi {
    font-size: 1.2rem;
}

.ido-filter-card,
.ido-table-card {
    border-radius: 16px;
    border: 1px solid var(--p-content-border-color);
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
}

.ido-filter-card :deep(.p-card-title),
.ido-filter-card :deep(.p-card-content),
.ido-table-card :deep(.p-card-content) {
    color: var(--p-text-color);
}

.ido-filters {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
    align-items: end;
}

.ido-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.ido-field label {
    color: var(--p-text-color);
    font-weight: 600;
    font-size: 0.93rem;
}

.ido-filter-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: flex-end;
}

.ido-report-dialog {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.ido-report-description {
    margin: 0;
    color: var(--p-text-color-secondary);
    line-height: 1.5;
}

.ido-report-fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
}

.ido-empty-state {
    min-height: 220px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: var(--p-text-color);
}

.ido-empty-state .pi {
    width: 64px;
    height: 64px;
    display: grid;
    place-items: center;
    border-radius: 16px;
    background: var(--p-blue-500-low-op);
    color: rgb(var(--p-color-icon-menu));
}

.ido-empty-state h4 {
    font-weight: 700;
}

.ido-table-card :deep(.p-datatable-header-cell) {
    background: var(--p-content-background);
    color: var(--p-text-color);
}

.ido-table-card :deep(.p-datatable-thead > tr > th) {
    font-weight: 700;
}

.ido-table-card :deep(.p-datatable-tbody > tr) {
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.ido-table-card :deep(.p-datatable-tbody > tr:hover) {
    background: var(--p-blue-500-low-op);
}

@media (max-width: 992px) {
    .ido-filters {
        grid-template-columns: 1fr;
    }

    .ido-report-fields {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .ido-orders-page {
        padding: 1rem;
    }

    .ido-page-header,
    .ido-filter-actions {
        flex-direction: column;
    }

    .ido-header-row {
        align-items: center;
    }
}
</style>
