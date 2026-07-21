<template>
    <div class="content">
        <div class="content-wrapper">
            <Transition name="content-fade" mode="out-in">
                <div v-if="isFirstLoadDone" key="tickets-content">
                    <section v-if="isCardMode" class="tickets-mobile-layout">
                        <div class="tickets-mobile-toolbar">
                            <div>
                                <h3 class="m-0">Справки</h3>
                                <p class="tickets-mobile-subtitle">Управление и отслеживание справок.</p>
                            </div>
                            <div class="tickets-mobile-toolbar-actions">
                                <Button
                                    icon="pi pi-sliders-h"
                                    outlined
                                    severity="secondary"
                                    @click="toggleSpecialFeaturesPanel"
                                />
                                <Button
                                    icon="pi pi-filter"
                                    outlined
                                    severity="secondary"
                                    @click="showMobileFilters = !showMobileFilters"
                                />
                                <Button
                                    icon="pi pi-sync"
                                    outlined
                                    severity="secondary"
                                    @click="fetchTickets"
                                    :loading="loading"
                                    :disabled="loading"
                                />
                            </div>
                        </div>

                        <OverlayPanel ref="specialFeaturesPanel">
                            <div class="special-features-panel">
                                <Button
                                    label="Автоназначение ответственных"
                                    icon="pi pi-users"
                                    :loading="autoAssignLoading"
                                    :disabled="autoAssignLoading"
                                    @click="runAutoAssignResponsible"
                                />
                            </div>
                        </OverlayPanel>

                        <div class="tickets-mobile-switch">
                            <Checkbox
                                v-model="onlyMyTickets"
                                binary
                                inputId="onlyMyTicketsMobile"
                                :disabled="!canReadTickets"
                                @change="onAssigneeToggle"
                            />
                            <label for="onlyMyTicketsMobile" class="cursor-pointer">
                                Только мои заявки
                            </label>
                        </div>

                        <div v-if="showMobileFilters" class="tickets-mobile-filters">
                            <InputText
                                :model-value="filters.number"
                                placeholder="Поиск по номеру"
                                @update:model-value="newValue => onFilter('number', newValue)"
                            />
                            <Select
                                v-model="filters.status"
                                :options="statusOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Выберите статус"
                                @change="onFilter('status', $event.value)"
                            />
                            <Select
                                v-model="filters.priority"
                                :options="priorityOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Выберите приоритет"
                                @change="onFilter('priority', $event.value)"
                            />
                            <InputText
                                :model-value="filters.requesterId"
                                placeholder="Поиск по ID инициатора"
                                @update:model-value="newValue => onFilter('requesterId', newValue)"
                            />
                            <div class="tickets-mobile-filter-actions">
                                <Select
                                    v-model="rowsPerPage"
                                    :options="rowsPerPageOptions"
                                    optionLabel="label"
                                    optionValue="value"
                                    placeholder="Строк на странице"
                                    @change="onRowsPerPageChange"
                                />
                                <Button
                                    label="Сбросить"
                                    text
                                    severity="secondary"
                                    @click="resetMobileFilters"
                                />
                            </div>
                        </div>

                        <div class="tickets-mobile-summary">
                            <span>Всего заявок: {{ totalRecords }}</span>
                            <span>Показано: {{ currentPageTickets.length }}</span>
                        </div>

                        <div v-if="currentPageTickets.length" class="tickets-card-list">
                            <article
                                v-for="ticket in currentPageTickets"
                                :key="ticket.id"
                                class="tickets-card"
                                @click="openTicketModal(ticket.id)"
                            >
                                <div class="tickets-card-head">
                                    <div class="tickets-card-title">
                                        <strong>№ {{ ticket.number || '—' }}</strong>
                                        <span>{{ ticket.requestType?.name || 'Тип заявки не указан' }}</span>
                                    </div>
                                    <Tag
                                        :severity="getStatusSeverity(ticket.status)"
                                        :value="getStatusLabel(ticket.status)"
                                        :icon="getStatusIcon(ticket.status)"
                                    />
                                </div>

                                <div class="tickets-card-meta">
                                    <Tag
                                        :severity="getPrioritySeverity(ticket.priority)"
                                        :value="getPriorityLabel(ticket.priority)"
                                        class="priority-tag"
                                    />
                                    <span class="tickets-card-chip">
                                        <i class="pi pi-user"></i>
                                        {{ ticket.requesterName || 'Заявитель не указан' }}
                                    </span>
                                </div>

                                <div class="tickets-card-row">
                                    <span class="tickets-card-label">Система-источник</span>
                                    <span class="tickets-card-value">{{ ticket.requesterSystem || 'Не указана' }}</span>
                                </div>

                                <div class="tickets-card-row">
                                    <span class="tickets-card-label">Дата создания</span>
                                    <span class="tickets-card-value">{{ formatDate(ticket.createdAt) }}</span>
                                </div>

                                <div class="tickets-card-footer">
                                    <span>ID {{ ticket.id }}</span>
                                    <Button
                                        label="Открыть"
                                        size="small"
                                        outlined
                                        severity="secondary"
                                        @click.stop="openTicketModal(ticket.id)"
                                    />
                                </div>
                            </article>
                        </div>

                        <div v-else class="empty-table-state tickets-empty-mobile">
                            <div class="empty-state-icon">
                                <i class="pi pi-ticket fs-3 text-gray-400"></i>
                            </div>
                            <h4 class="mt-3 mb-2">Справки не найдены</h4>
                            <p class="text-color-secondary mb-4">
                                {{ hasActiveFilters ?
                                    'Попробуйте изменить параметры фильтрации' :
                                    'У вас пока нет справок или они не назначены на вас'
                                }}
                            </p>
                            <div class="empty-state-actions">
                                <Button
                                    label="Обновить"
                                    icon="pi pi-refresh"
                                    @click="fetchTickets"
                                    outlined
                                />
                            </div>
                        </div>

                        <div class="tickets-mobile-paginator">
                            <Paginator
                                :rows="rowsPerPage"
                                :first="firstRowIndex"
                                :totalRecords="totalRecords"
                                @page="onPage"
                            />
                        </div>
                    </section>

                    <DataTable
                        v-else
                        lazy
                        :value="tickets"
                        paginator
                        scrollable
                        stripedRows
                        :rows="rowsPerPage"
                        :first="firstRowIndex"
                        :rowClass="rowClass"
                        @row-click="(event) => openTicketModal(event.data.id)"
                        :totalRecords="totalRecords"
                        @page="onPage"
                        :rowsPerPageOptions="[5, 10, 15]"
                        filterDisplay="row"
                        class="tickets-table"
                    >
                    <template #header>
                        <div class="page-header">
                            <div class="d-flex justify-content-between align-items-center tickets-table-header">
                                <div class="page-title">
                                    <h3 class="m-0">
                                        Справки
                                    </h3>
                                    <p class="text-color-secondary m-0 mt-1">Управление и отслеживание справок</p>
                                </div>
                                <div class="page-controls">
                                    <div class="d-flex gap-2 align-items-center tickets-table-actions">
                                        <Button
                                            icon="pi pi-sliders-h"
                                            outlined
                                            severity="secondary"
                                            @click="toggleSpecialFeaturesPanel"
                                        />
                                        <OverlayPanel ref="specialFeaturesPanel">
                                            <div class="special-features-panel">
                                                <Button
                                                    label="Автоназначение ответственных"
                                                    icon="pi pi-users"
                                                    :loading="autoAssignLoading"
                                                    :disabled="autoAssignLoading"
                                                    @click="runAutoAssignResponsible"
                                                />
                                            </div>
                                        </OverlayPanel>
                                        <MultiSelect
                                            :modelValue="selectedColumns"
                                            :options="columns"
                                            optionLabel="header"
                                            @update:modelValue="onToggle"
                                            display="chip"
                                            placeholder="Выберите поля"
                                            class="column-selector"
                                        />
                                        <Button
                                            icon="pi pi-sync"
                                            outlined
                                            severity="secondary"
                                            @click="fetchTickets"
                                            :loading="loading"
                                            :disabled="loading"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>

                    <template #paginatorstart>
                        <div class="table-stats">
                            <div class="stats-item">
                                <span>Всего заявок: <strong>{{ totalRecords }}</strong></span>
                            </div>
                        </div>
                    </template>

                    <template #paginatorend>
                        <div class="d-flex align-items-center gap-2">
                            <Checkbox
                                v-model="onlyMyTickets"
                                binary
                                inputId="onlyMyTickets"
                                :disabled="!canReadTickets"
                                @change="onAssigneeToggle"
                            />
                            <label for="onlyMyTickets" class="cursor-pointer">
                                Только мои заявки
                            </label>
                        </div>
                    </template>

                    <template #empty>
                        <div class="empty-table-state">
                            <div class="empty-state-icon">
                                <i class="pi pi-ticket fs-3 text-gray-400"></i>
                            </div>
                            <h4 class="mt-3 mb-2">Справки не найдены</h4>
                            <p class="text-color-secondary mb-4">
                                {{ hasActiveFilters ?
                                    'Попробуйте изменить параметры фильтрации' :
                                    'У вас пока нет справок или они не назначены на вас'
                                }}
                            </p>
                            <div class="empty-state-actions">
                                <Button
                                    label="Обновить"
                                    icon="pi pi-refresh"
                                    @click="fetchTickets"
                                    outlined
                                />
                            </div>
                        </div>
                    </template>

                    <template #loading>
                        <div class="loading-state">
                            <ProgressSpinner style="width: 50px; height: 50px" />
                            <p class="mt-3 text-color-secondary">Загрузка заявок...</p>
                        </div>
                    </template>

                    <Column
                        v-for="col in ordinaryColumns"
                        :field="col.field"
                        :key="col.field"
                        :header="col.header"
                        :style="col.style"
                        :showFilterMenu="false"
                        :sortable="false"
                    >
                        <template #body="{ data }">
                            <div class="cell-content" :class="col.field">
                                <span v-if="col.field === 'createdAt' || col.field === 'updatedAt' || col.field === 'resolvedAt' || col.field === 'closedAt'">
                                    {{ formatDate(data[col.field]) }}
                                </span>
                                <span v-else-if="col.field === 'requestType'">
                                    <div class="request-type-cell">
                                        {{ data.requestType?.name || 'Не указан' }}
                                    </div>
                                </span>
                                <span v-else>
                                    {{ data[col.field] }}
                                </span>
                            </div>
                        </template>

                        <template #filter>
                            <InputText
                                v-if="['string', 'number'].includes(col.filterType)"
                                :model-value="filters[col.field]"
                                :placeholder="col.placeholder"
                                @update:model-value="newValue => onFilter(col.field, newValue)"
                                autocomplete="off"
                                class="filter-input"
                            />
                        <Select 
                            v-else-if="col.filterType === 'select'"
                            v-model="filters[col.field]" 
                            :options="getFilterOptions(col.field)"
                            optionLabel="label"
                            optionValue="value"
                            :placeholder="col.placeholder"
                            @change="onFilter(col.field, $event.value)" 
                            class="filter-select"
                        />
                        </template>
                    </Column>

                    <Column field="status" header="Статус" :showFilterMenu="false" v-if="selectedColumnFields.includes('status')">
                        <template #body="{ data }">
                            <Tag
                                :severity="getStatusSeverity(data.status)"
                                :value="getStatusLabel(data.status)"
                                :icon="getStatusIcon(data.status)"
                                class="status-tag"
                            />
                        </template>
                        <template #filter>
                        <Select 
                            v-model="filters.status" 
                            :options="statusOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Выберите статус" 
                            @change="onFilter('status', $event.value)" 
                        />
                        </template>
                    </Column>

                    <Column field="priority" header="Приоритет" :showFilterMenu="false" v-if="selectedColumnFields.includes('priority')">
                        <template #body="{ data }">
                            <Tag
                                :severity="getPrioritySeverity(data.priority)"
                                :value="getPriorityLabel(data.priority)"
                                class="priority-tag"
                            />
                        </template>
                        <template #filter>
                        <Select 
                            v-model="filters.priority" 
                            :options="priorityOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Выберите приоритет" 
                            @change="onFilter('priority', $event.value)" 
                        />
                        </template>
                    </Column>
                    </DataTable>
                </div>

                <!-- Состояние загрузки при первом открытии -->
                <div key="tickets-skeleton" v-else-if="loading" class="skeleton-container">
                    <div class="skeleton-header mb-4">
                        <Skeleton width="200px" height="40px" class="mb-2" />
                        <Skeleton width="300px" height="20px" />
                    </div>
                    <div class="skeleton-filters mb-4">
                        <Skeleton width="100%" height="50px" />
                    </div>
                    <Skeleton width="100%" height="100%" class="skeleton-table" />
                </div>
            </Transition>
        </div>

        <!-- Модальное окно деталей тикета -->
        <TicketDetailsModal 
            v-model:visible="ticketModalVisible" 
            :ticketId="selectedTicketId"
            @close="handleModalClose"
        />
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axiosInstance from '@/utils/axios.js';
import { debounce } from 'lodash';
import TicketDetailsModal from '@/components/Tickets/TicketDetails.vue';
import { usePermissionStore } from '@/stores/permissions';
import { mockTickets } from '@/config/mocks/tickets.js';
import { USE_MOCK_DATA } from '@/config/mocks/config.js';
import { formatDateRuLongWithTime as formatDate } from '@/utils/date.js';
import { getSessionUserId } from '@/utils/TokenService';
import { getCurrentUser } from '@/utils/currentUser.js';
import { useResponsiveLayout } from '@/composables/useResponsiveLayout.js';
import { useMobileTableView } from '@/composables/useMobileTableView.js';

const permissionStore = usePermissionStore();

const tickets = ref([]);
const totalRecords = ref(0);
const loading = ref(true);
const isFirstLoadDone = ref(false);
const useMockData = ref(USE_MOCK_DATA);
const specialFeaturesPanel = ref(null);
const autoAssignLoading = ref(false);
const rowsPerPageOptions = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '15', value: 15 },
];
const { isPhone } = useResponsiveLayout();


// Модальное окно
const ticketModalVisible = ref(false);
const selectedTicketId = ref(null);

const resolveUserId = async () => {
    const sessionUserId = getSessionUserId();
    if (sessionUserId) return sessionUserId;

    try {
        const me = await getCurrentUser();
        return me?.id || null;
    } catch {
        return null;
    }
};

const onlyMyTickets = ref(true);

const canReadTickets = computed(() => {
    return permissionStore.hasPermission('Tickets', 'Read');
});

const onAssigneeToggle = () => {
    currentPage.value = 1;
    fetchTickets();
};

const toggleSpecialFeaturesPanel = (event) => {
    specialFeaturesPanel.value?.toggle(event);
};

const runAutoAssignResponsible = async () => {
    try {
        autoAssignLoading.value = true;
        await axiosInstance.post('/api/tickets/function/auto/assign-tickets');
        window.dispatchEvent(new CustomEvent('toast', {
            detail: {
                severity: 'success',
                summary: 'Справки',
                detail: 'Автоназначение ответственных запущено'
            }
        }));
        specialFeaturesPanel.value?.hide();
    } catch (error) {
        console.error('Ошибка при автоназначении ответственных:', error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: {
                severity: 'error',
                summary: 'Справки',
                detail: 'Не удалось запустить автоназначение ответственных'
            }
        }));
    } finally {
        autoAssignLoading.value = false;
    }
};

const filters = ref({
    number: null,
    status: null,
    priority: null,
    requesterId: null,
});

const columns = ref([
    { field: 'number', header: '№', placeholder: 'Поиск по номеру', filterType: 'number', style: 'width: 200px; max-width: 200px;' },
    { field: 'requesterName', header: 'ФИО' },
    { field: 'requestType', header: 'Тип заявки', placeholder: 'Поиск по типу', style: 'width: 150px; max-width: 200px;' },
    { field: 'status', header: 'Статус', placeholder: 'Выберите статус', filterType: 'select' },
    { field: 'priority', header: 'Приоритет', placeholder: 'Выберите приоритет', filterType: 'select' },
    { field: 'requesterSystem', header: 'Система-источник', placeholder: 'Поиск по системе' },
    { field: 'requesterId', header: 'ID инициатора', placeholder: 'Поиск по ID', filterType: 'string' },
    { field: 'createdAt', header: 'Дата создания', placeholder: 'Поиск по дате' },
    { field: 'updatedAt', header: 'Дата обновления', placeholder: 'Поиск по дате' },
    { field: 'resolvedAt', header: 'Дата решения', placeholder: 'Поиск по дате' },
    { field: 'closedAt', header: 'Дата закрытия', placeholder: 'Поиск по дате' },
]);

const defaultColumns = ['number', 'requesterName', 'requestType', 'status', 'priority', 'createdAt'];

const selectedColumnFields = ref(defaultColumns);
const selectedColumns = computed(() => 
    columns.value.filter(c => selectedColumnFields.value.includes(c.field))
);

const onToggle = (val) => {
    selectedColumnFields.value = val.map(col => col.field);
};

const ordinaryColumns = computed(() => 
    columns.value.filter(c => 
        selectedColumnFields.value.includes(c.field) && 
        !['status', 'priority'].includes(c.field)
    )
);

const currentPage = ref(1);
const rowsPerPage = ref(10);
const {
    isCardMode,
    firstRowIndex,
    currentPageItems: currentPageTickets,
    showMobileFilters,
} = useMobileTableView({
    items: tickets,
    currentPage,
    rowsPerPage,
    isPhone,
    sliceItems: false,
});

// Маппинг статусов (английский → русский)
const statusMap = {
    'New': 'Новая',
    'Open': 'Открыта',
    'Assigned': 'Назначена',
    'Pending': 'В ожидании',
    'Resolved': 'Решена',
    'Closed': 'Закрыта',
    'Cancelled': 'Отменена'
};

// Маппинг приоритетов (английский → русский)
const priorityMap = {
    'Low': 'Низкий',
    'Medium': 'Средний',
    'High': 'Высокий'
};

// Опции для фильтров статусов (с полным списком enum)
const statusOptions = [
    { label: "Все", value: null },
    { label: 'Новая', value: 'New' },
    { label: 'Открыта', value: 'Open' },
    { label: 'Назначена', value: 'Assigned' },
    { label: 'В ожидании', value: 'Pending' },
    { label: 'Решена', value: 'Resolved' },
    { label: 'Закрыта', value: 'Closed' },
    { label: 'Отменена', value: 'Cancelled' },
];

// Опции для фильтров приоритетов (с полным списком enum)
const priorityOptions = [
    { label: "Все", value: null },
    { label: 'Низкий', value: 'Low' },
    { label: 'Средний', value: 'Medium' },
    { label: 'Высокий', value: 'High' },
];

const getFilterOptions = (field) => {
    if (field === 'status') return statusOptions;
    if (field === 'priority') return priorityOptions;
    return [];
};

// Компьютированные свойства
const hasActiveFilters = computed(() => {
    return Object.values(filters.value).some(value => 
        value !== null && value !== '' && (!Array.isArray(value) || value.length > 0)
    );
});

const filteredCount = computed(() => {
    if (!hasActiveFilters.value) return totalRecords.value;
    return tickets.value.length;
});

const onFilter = (field, value) => {
    filters.value[field] = value;
    currentPage.value = 1;
    debouncedFetchTickets();
};

const debouncedFetchTickets = debounce(async () => {
    await fetchTickets();
}, 500);

const rowClass = () => {
    return [{ 'pointer': true }];
};

const resetMobileFilters = async () => {
    currentPage.value = 1;
    filters.value = {
        number: null,
        status: null,
        priority: null,
        requesterId: null,
    };
    await fetchTickets();
};

const parseFioFromFormData = (formData) => {
    if (!formData) return null;
    try {
        const parsed = typeof formData === 'string' ? JSON.parse(formData) : formData;
        return parsed?.fio || null;
    } catch {
        return null;
    }
};

const enrichTicketsWithFio = (ticketList) => {
    return (ticketList || []).map(ticket => ({
        ...ticket,
        requesterName: parseFioFromFormData(ticket?.formData) || '—'
    }));
};

// Функции для стилизации статусов и приоритетов
const getStatusSeverity = (status) => {
    const map = {
        'New': 'info',           // Новая - голубой
        'Open': 'warning',       // Открыта - оранжевый/желтый
        'Assigned': 'success',   // Назначена - зеленый
        'Pending': 'secondary',  // В ожидании - серый
        'Resolved': 'success',   // Решена - зеленый
        'Closed': 'secondary',   // Закрыта - серый
        'Cancelled': 'danger'    // Отменена - красный
    };
    return map[status] || 'info';
};

const getStatusLabel = (status) => {
    return statusMap[status] || status;
};

const getStatusIcon = (status) => {
    const map = {
        'New': 'pi pi-plus-circle',          // Новая
        'Open': 'pi pi-folder-open',         // Открыта
        'Assigned': 'pi pi-verified',      // Назначена
        'Pending': 'pi pi-hourglass',        // В ожидании
        'Resolved': 'pi pi-check-circle',    // Решена
        'Closed': 'pi pi-lock',              // Закрыта
        'Cancelled': 'pi pi-times-circle'    // Отменена
    };
    return map[status] || 'pi pi-info-circle';
};

const getPrioritySeverity = (priority) => {
    const map = {
        'Low': 'success',     // Низкий - зеленый
        'Medium': 'warning',  // Средний - желтый/оранжевый
        'High': 'danger'      // Высокий - красный
    };
    return map[priority] || 'info';
};

const getPriorityLabel = (priority) => {
    return priorityMap[priority] || priority;
};

// Работа с модальным окном
const openTicketModal = async (ticketId) => {
    selectedTicketId.value = ticketId;
    ticketModalVisible.value = true;
};

const handleModalClose = () => {
    fetchTickets();
};

const onPage = async (event) => {
    currentPage.value = event.page + 1;
    rowsPerPage.value = event.rows;
    await fetchTickets();
};

const onRowsPerPageChange = async () => {
    currentPage.value = 1;
    await fetchTickets();
};

const fetchTickets = async () => {
    try {
        loading.value = true;
        if (useMockData.value) {
            tickets.value = enrichTicketsWithFio(mockTickets.tickets);
            totalRecords.value = mockTickets.totalCount || 0;
            return;
        }
        const userId = await resolveUserId();
        
        const payload = {
            page: currentPage.value,
            pageSize: rowsPerPage.value,
            ...filters.value,
        };

        if (onlyMyTickets.value && canReadTickets.value) {
            payload.assigneeId = userId;
        }

        const { data } = await axiosInstance.post('/api/tickets', payload);
        tickets.value = enrichTicketsWithFio(data.tickets);
        totalRecords.value = data.totalCount || 0;
    } catch (error) {
        console.error('Ошибка при получении заявок:', error);
    } finally {
        loading.value = false;
        isFirstLoadDone.value = true;
    }
};

onMounted(async () => {
    await fetchTickets();
});
</script>

<style scoped>
.content {
    display: flex;
    flex-direction: column;
    height: 100dvh;
    box-sizing: border-box;
}

.content-wrapper {
    position: relative;
    flex-grow: 1;
    padding: var(--app-page-padding-y) var(--app-page-padding-x) 1rem;
    height: 100%;
    color: var(--p-text-color);
    transition: all 0.5s;
}

.tickets-mobile-layout {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.tickets-mobile-toolbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
}

.tickets-mobile-subtitle {
    margin: 0.35rem 0 0;
    color: var(--p-text-muted-color, var(--p-grey-2));
    font-size: 0.92rem;
}

.tickets-mobile-toolbar-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
}

.tickets-mobile-switch {
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.8rem 1rem;
    border-radius: 16px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
    background: rgba(var(--p-blue-500-rgb), 0.04);
}

.tickets-mobile-filters {
    display: grid;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 18px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
    background: linear-gradient(
        180deg,
        rgba(var(--p-blue-500-rgb), 0.04),
        rgba(255, 255, 255, 0)
    );
}

.tickets-mobile-filter-actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.75rem;
    align-items: center;
}

.tickets-mobile-summary {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    font-size: 0.92rem;
    color: var(--p-text-muted-color, var(--p-grey-2));
}

.tickets-card-list {
    display: grid;
    gap: 0.85rem;
}

.tickets-card {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding: 1rem;
    border-radius: 18px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.14);
    background: linear-gradient(
        180deg,
        rgba(var(--p-blue-500-rgb), 0.05),
        rgba(255, 255, 255, 0)
    );
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
}

.tickets-card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
}

.tickets-card-title {
    display: flex;
    flex-direction: column;
    gap: 0.28rem;
}

.tickets-card-title strong {
    font-size: 1rem;
    color: var(--p-text-color);
}

.tickets-card-title span {
    color: var(--p-text-muted-color, var(--p-grey-2));
    word-break: break-word;
}

.tickets-card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
}

.tickets-card-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.38rem 0.7rem;
    border-radius: 999px;
    background: rgba(var(--p-blue-500-rgb), 0.08);
    font-size: 0.82rem;
}

.tickets-card-row {
    display: flex;
    flex-direction: column;
    gap: 0.28rem;
}

.tickets-card-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--p-text-muted-color, var(--p-grey-2));
}

.tickets-card-value {
    color: var(--p-text-color);
}

.tickets-card-footer {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: center;
    font-size: 0.85rem;
    color: var(--p-text-muted-color, var(--p-grey-2));
}

.tickets-empty-mobile {
    padding: 2rem 1rem;
}

.tickets-mobile-paginator {
    padding-bottom: var(--app-mobile-bottom-offset);
}

/* Заголовок страницы */
.page-header {
    padding: 1rem;
}

.page-title h3 {
    display: flex;
    align-items: center;
    color: var(--p-text-color);
    font-size: 1.75rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
}

.page-title p {
    font-size: 0.95rem;
}

.column-selector {
    min-width: 200px;
}

.special-features-panel {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 280px;
}

/* Статистика таблицы */
.table-stats {
    display: flex;
    gap: 1.5rem;
    padding: 1rem 0;
}

.stats-item {
    display: flex;
    align-items: center;
    font-size: 0.95rem;
    color: var(--p-text-color-secondary);
}

.stats-item i {
    font-size: 1.1rem;
}

.stats-item strong {
    color: var(--p-text-color);
    margin-left: 0.25rem;
}

/* Таблица */
.tickets-table {
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.tickets-table :deep(.p-datatable-tbody tr) {
    transition: all 0.2s ease;
}

/* Ячейки */
.cell-content {
    padding: 0.5rem 0;
}

.request-type-cell {
    display: flex;
    align-items: center;
}

/* Поля фильтрации */
.filter-input, .filter-select {
    width: 100%;
}

/* Состояние пустой таблицы */
.empty-table-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    background-color: var(--p-grey-5);
    border-radius: 12px;
}

.empty-state-icon {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: var(--p-grey-3);
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
}

.empty-table-state h4 {
    color: var(--p-text-color);
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.empty-table-state p {
    max-width: 400px;
    line-height: 1.5;
}

.empty-state-actions {
    margin-top: 1.5rem;
    display: flex;
    gap: 1rem;
}

/* Состояние загрузки */
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
}

/* Скелетоны */
.skeleton-container {
    padding: 1.5rem;
}

.skeleton-header {
    display: flex;
    flex-direction: column;
}

.skeleton-filters {
    margin-bottom: 1.5rem;
}

.skeleton-table {
    border-radius: 12px;
    background-color: var(--p-grey-3);
}

.tickets-table-header {
    gap: 0.75rem;
}

.tickets-table-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
}

/* Адаптивность */
@media (max-width: 768px) {
    .content-wrapper {
        padding-bottom: 1rem;
    }

    .tickets-mobile-toolbar,
    .tickets-mobile-summary,
    .tickets-card-head,
    .tickets-card-footer {
        flex-direction: column;
        align-items: flex-start;
    }

    .tickets-mobile-toolbar-actions {
        width: 100%;
        flex-wrap: wrap;
    }

    .tickets-mobile-toolbar-actions :deep(.p-button) {
        flex: 1 1 calc(33.33% - 0.34rem);
    }

    .tickets-mobile-filter-actions {
        grid-template-columns: 1fr;
    }

    .tickets-card-footer :deep(.p-button) {
        width: 100%;
    }

    .page-title h3 {
        font-size: 1.5rem;
    }
    
    .table-stats {
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .empty-state-actions {
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .empty-table-state {
        padding: 2rem 1rem;
    }
}
</style>
