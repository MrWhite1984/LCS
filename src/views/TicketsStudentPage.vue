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
                    <Button v-if="canCreateStudentTickets" icon="pi pi-plus" @click="openCreateModal" />
                    <Button
                        icon="pi pi-refresh"
                        label="Обновить"
                        outlined
                        severity="secondary"
                        :loading="listLoading"
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

                                <div class="tickets-student-mobile-actions">
                                    <Button
                                        label="Открыть заявку"
                                        icon="pi pi-paperclip"
                                        severity="secondary"
                                        outlined
                                        @click="openTicketDetails(ticket)"
                                    />
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
                        <Column header="Файлы" style="width: 170px;">
                            <template #body="{ data }">
                                <Button
                                    label="Открыть"
                                    icon="pi pi-paperclip"
                                    severity="secondary"
                                    outlined
                                    class="tickets-student-table-action"
                                    @click="openTicketDetails(data)"
                                />
                            </template>
                        </Column>
                    </DataTable>
                </section>
            </template>
        </section>

        <StudentTicketDetailsDialog
            v-model:visible="ticketDetailsVisible"
            :ticket-id="selectedTicketId"
            @update:visible="onTicketDetailsVisibilityChange"
        />
        <StudentTicketCreateDialog
            ref="createTicketDialogRef"
            :show-button="false"
            @created="onTicketCreated"
        />
    </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { usePermissionStore } from '@/stores/permissions.js';
import { formatDateRuLongWithTime as formatDate } from '@/utils/date.js';
import { useResponsiveLayout } from '@/composables/useResponsiveLayout.js';
import { listMyTickets } from '@/api/tickets.js';
import PermissionDenied from '@/components/Utils/PermissionDenied.vue';
import StudentTicketDetailsDialog from '@/components/Tickets/StudentTicketDetailsDialog.vue';
import StudentTicketCreateDialog from '@/components/Tickets/StudentTicketCreateDialog.vue';

const toast = useToast();
const permissionStore = usePermissionStore();
const { isPhone } = useResponsiveLayout();

const listLoading = ref(false);

const studentTickets = ref([]);
const totalRecords = ref(0);
const currentPage = ref(1);
const rowsPerPage = ref(10);
const ticketDetailsVisible = ref(false);
const selectedTicketId = ref('');
const createTicketDialogRef = ref(null);
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

const normalizeNumberFilter = (value) => {
    const normalized = String(value || '').trim();
    if (!normalized) return null;
    const numericValue = Number(normalized);
    return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : null;
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

const openTicketDetails = (ticket) => {
    if (!ticket?.id) return;

    selectedTicketId.value = ticket.id;
    ticketDetailsVisible.value = true;
};

const onTicketDetailsVisibilityChange = (value) => {
    ticketDetailsVisible.value = value;

    if (!value) {
        selectedTicketId.value = '';
    }
};

const openCreateModal = () => {
    createTicketDialogRef.value?.openModal?.();
};

const onTicketCreated = async () => {
    if (!canReadStudentTickets.value) return;

    currentPage.value = 1;
    await fetchStudentTickets();
};

const refreshPage = async () => {
    await fetchStudentTickets();
};

onMounted(async () => {
    if (!canAccessTicketsStudent.value) return;

    await fetchStudentTickets();
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

.tickets-student-mobile-actions {
    display: flex;
    justify-content: flex-start;
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

.tickets-student-table-action {
    width: 100%;
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
    .tickets-student-list-filters {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 768px) {
    .tickets-student-shell {
        padding: 1rem;
    }

    .tickets-student-header,
    .tickets-student-card-head {
        flex-direction: column;
        align-items: stretch;
    }

    .tickets-student-actions {
        justify-content: flex-start;
    }

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
