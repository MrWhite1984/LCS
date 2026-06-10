<template>
    <div class="content">
        <div class="content-wrap">

            <!-- Подсказка для прокрутки таблицы -->
            <div v-if="showScrollHint && !isCardMode" class="scroll-hint" @click="hideScrollHint">
                Прокрутите таблицу вправо, чтобы увидеть больше данных.
            </div>

            <Transition name="content-fade" mode="out-in">
                <div key="requests-content" v-if="!loading">
                    <section v-if="isCardMode" class="requests-mobile-layout">
                        <div class="requests-mobile-toolbar">
                            <div>
                                <h3 class="title m-0">Ваши заявки</h3>
                                <p class="requests-mobile-subtitle">Быстрый просмотр актуальных обращений и статусов.</p>
                            </div>
                            <div class="requests-mobile-toolbar-actions">
                                <Button icon="pi pi-filter" outlined severity="secondary" @click="showMobileFilters = !showMobileFilters" />
                                <Button icon="pi pi-plus" @click="openCreateModal" />
                                <Button
                                    icon="pi pi-sync"
                                    outlined
                                    severity="secondary"
                                    @click="fetchCalls"
                                    :loading="loading"
                                    :disabled="loading"
                                />
                            </div>
                        </div>

                        <div v-if="showMobileFilters" class="requests-mobile-filters">
                            <InputText
                                v-model="filters.number"
                                placeholder="Поиск по номеру"
                                @input="handleFilterInput('number', filters.number)"
                            />
                            <InputText
                                v-model="filters.callSummaryName"
                                placeholder="Поиск по сводке"
                                @input="handleFilterInput('callSummaryName', filters.callSummaryName)"
                            />
                            <Select
                                v-model="filters.priorityId"
                                :options="priorityOptions"
                                optionLabel="name"
                                optionValue="id"
                                placeholder="Приоритет"
                                @change="handleFilterInput('priorityId', filters.priorityId)"
                            />
                            <MultiSelect
                                v-model="filters.entityStateNames"
                                :options="stateOptions"
                                optionLabel="label"
                                optionValue="value"
                                display="chip"
                                placeholder="Статусы"
                                @change="handleFilterInput('entityStateNames', filters.entityStateNames)"
                            />
                            <div class="requests-mobile-filter-actions">
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
                                    @click="clearMobileFilters"
                                />
                            </div>
                        </div>

                        <div class="requests-mobile-summary">
                            <span>Всего заявок: {{ totalRecords }}</span>
                            <span>Показано: {{ currentPageCalls.length }}</span>
                        </div>

                        <div v-if="currentPageCalls.length" class="requests-card-list">
                            <article
                                v-for="call in currentPageCalls"
                                :key="call.id"
                                class="requests-card"
                                :class="{ 'removed-row': call.removed, 'highlighted-row': call.id === lastCreatedId }"
                                @click="openCallDetails(call.id)"
                            >
                                <div class="requests-card-head">
                                    <div class="requests-card-number">
                                        <OverlayBadge :value="call.documentCount" :severity="call.documentCount ? 'danger' : 'secondary'">
                                            <i class="pi pi-file"></i>
                                        </OverlayBadge>
                                        <strong>№ {{ call.number || '—' }}</strong>
                                    </div>
                                    <Tag
                                        :value="call.entityStateName"
                                        :severity="getStatusSeverity(call.entityStateName)"
                                        :icon="getStatusIcon(call.entityStateName)"
                                    />
                                </div>

                                <div class="requests-card-row">
                                    <span class="requests-card-label">Сводка</span>
                                    <span class="requests-card-value">{{ call.callSummaryName || '—' }}</span>
                                </div>

                                <div class="requests-card-meta">
                                    <Tag
                                        :value="call.priorityName || 'Без приоритета'"
                                        :severity="call.priorityName === 'Высокий' ? 'danger' : call.priorityName === 'Низкий' ? 'success' : 'info'"
                                    />
                                    <span class="requests-card-meta-item">{{ call.clientFullName || 'Клиент не указан' }}</span>
                                    <span class="requests-card-meta-item">{{ call.executorFullName || 'Исполнитель не назначен' }}</span>
                                </div>

                                <div class="requests-card-row">
                                    <span class="requests-card-label">Описание</span>
                                    <span class="requests-card-value clamp-2">{{ call.description || '—' }}</span>
                                </div>

                                <div class="requests-card-footer">
                                    <span>{{ call.utcDateRegistered || 'Дата регистрации не указана' }}</span>
                                    <Button
                                        label="Открыть"
                                        size="small"
                                        outlined
                                        severity="secondary"
                                        @click.stop="openCallDetails(call.id)"
                                    />
                                </div>
                            </article>
                        </div>
                        <div v-else class="requests-empty-state">Не найдено.</div>

                        <div class="requests-mobile-paginator">
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
                        :value="calls"
                        filterDisplay="row"
                        paginator
                        :rows="rowsPerPage"
                        :first="firstRowIndex"
                        :totalRecords="totalRecords"
                        scrollable
                        removableSort
                        stripedRows
                        @page="onPage"
                        :rowClass="rowClass"
                        @row-click="(event) => openCallDetails(event.data.id)"
                    >
                    <template #header>
                        <div class="row justify-content-between align-items-center">
                            <div class="col d-flex justify-content-start">
                                <h3 class="title m-0">Ваши заявки</h3>
                            </div>
                            <div class="col d-flex justify-content-end gap-2">
                                <MultiSelect
                                    :modelValue="selectedColumns"
                                    :options="columns"
                                    optionLabel="header"
                                    display="chip"
                                    placeholder="Выберите поля"
                                    @update:modelValue="onToggle"
                                />
                                <Button icon="pi pi-plus" @click="openCreateModal" />
                                <Button
                                    icon="pi pi-sync"
                                    outlined
                                    severity="secondary"
                                    @click="fetchCalls"
                                    :loading="loading"
                                    :disabled="loading"
                                />
                            </div>
                        </div>
                    </template>

                    <template #empty>Не найдено.</template>

                    <Column field="documentCount" header="" sortable style="min-width: 50px;">
                        <template #body="{ data }">
                            <OverlayBadge :value="data.documentCount" :severity="data.documentCount ? 'danger' : 'secondary'">
                                <i class="pi pi-file" style="font-size: 2rem" />
                            </OverlayBadge>
                        </template>
                    </Column>

                    <Column
                        v-for="col in selectedColumns"
                        :key="col.field"
                        :field="col.field"
                        :header="col.header"
                        :sortable="true"
                        :showFilterMenu="false"
                        :frozen="col.field === 'number'"
                        style="min-width: 300px;"
                    >
                        <template #body="{ data }">
                            <template v-if="col.field === 'entityStateName'">
                                <Tag :value="data.entityStateName" :severity="getStatusSeverity(data.entityStateName)" :icon="getStatusIcon(data.entityStateName)"/>
                            </template>
                            <template v-else-if="col.field === 'priorityName'">
                                <div class="d-flex align-items-center">
                                    <Tag :value="data.priorityName" :severity="data.priorityName === 'Высокий' ? 'danger' : data.priorityName === 'Низкий' ? 'success' : 'info'" />
                                </div>
                            </template>

                            <template v-else>
                                {{ data[col.field] }}
                            </template>
                        </template>
                        <template #filter v-if="col.filterable">
                            <InputText
                                v-if="col.filterType === 'text'"
                                v-model="filters[col.field]"
                                :placeholder="col.placeholder"
                                @input="handleFilterInput(col.field, filters[col.field])"
                                class="w-75"
                            />
                            <MultiSelect
                                v-else-if="col.filterType === 'multiselect'"
                                v-model="filters[col.filterField]"
                                :options="col.options"
                                optionLabel="label"
                                optionValue="value"
                                class="w-75"
                                :placeholder="col.placeholder"
                                @change="handleFilterInput(col.filterField, filters[col.filterField])"
                            />
                            <Select
                                v-else-if="col.filterType === 'select' && col.filterField === 'serviceName'"
                                v-model="filters[col.filterField]"
                                :options="col.options"
                                optionLabel="label"
                                optionValue="value"
                                class="w-75"
                                :placeholder="col.placeholder"
                                @change="handleFilterInput(col.filterField, filters[col.filterField])"
                            />
                            <Select
                                v-else-if="col.filterType === 'select'"
                                v-model="filters[col.filterField]"
                                :options="col.options"
                                optionLabel="name"
                                optionValue="id"
                                class="w-75"
                                :placeholder="col.placeholder"
                                @change="handleFilterInput(col.filterField, filters[col.filterField])"
                            />
                            <Button
                                icon="pi pi-filter-slash"
                                text
                                severity="contrast"
                                class="ms-2"
                                v-if="filters[col.filterField] && (Array.isArray(filters[col.filterField]) ? filters[col.filterField].length : true)"
                                @click="clearFilter(col.filterField)"
                            />
                        </template>
                    </Column>

                    <template #paginatorstart>
                        <div class="d-flex justify-content-between align-items-center">
                            <div>Всего заявок: {{ totalRecords }}</div>
                        </div>
                    </template>
                    <template #paginatorend>
                        <div class="d-flex align-items-center">
                            <span>Показать</span>
                            <Select
                                v-model="rowsPerPage"
                                :options="rowsPerPageOptions"
                                optionLabel="label"
                                optionValue="value"
                                class="search mx-1 px-1"
                            />
                            <span>строк</span>
                        </div>
                    </template>
                    </DataTable>
                </div>
                <Skeleton key="requests-skeleton" v-else width="100%" height="100%" class="skeleton-table" />
            </Transition>
        </div>
        <CreateRequest ref="createRequestRef" :showButton="false" @refreshRequests="(id) => fetchCalls(id)"/>
        <InfraManagerCallsMe ref="callDetailsRef" class="position-absolute opacity-0" style="z-index: -999;" @close="clearCallDetailsQuery"/>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { debounce } from 'lodash';
import qs from 'qs';
import axiosInstance from '@/utils/axios.js';
import { getInfraStatusIcon, getInfraStatusSeverity } from '@/utils/infraStatus.js';
import { formatDateOmskFromUtcString } from '@/utils/date.js';
import { useResponsiveLayout } from '@/composables/useResponsiveLayout.js';
import {
    TABLE_VIEW_MODE,
    STACKED_CARDS_MODE,
    useMobileTableView
} from '@/composables/useMobileTableView.js';

import InfraManagerCallsMe from '@/components/InfraManager/InfraManagerCallsMe.vue';
import CreateRequest from '@/components/InfraManager/CreateRequest.vue';

const loading = ref(true);
const calls = ref([]);  // Все загруженные заявки
const currentPage = ref(1);  // Текущая страница
const rowsPerPage = ref(10);  // Количество строк на странице
const totalRecords = ref(0);  // Общее количество заявок
const totalPages = ref(0);
const loadedPages = ref(10);

const route = useRoute();
const router = useRouter();
const { isPhone } = useResponsiveLayout();

const serviceOptions = ref([]);
const priorityOptions = ref([]);
const stateOptions = ref([]);

const rowsPerPageOptions = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 },
];

const columns = ref([
    { field: 'number', header: '№', placeholder: 'Введите номер...', filterable: true, filterField: 'number', filterType: 'text' },
    { field: 'entityStateName', header: 'Статус', placeholder: 'Выберите статус', filterable: true, filterField: 'entityStateNames', filterType: 'multiselect', options: stateOptions },
    { field: 'priorityName', header: 'Приоритет', placeholder: 'Выберите приоритет', filterable: true, filterField: 'priorityId', filterType: 'select', options: priorityOptions },
    { field: 'clientFullName', header: 'Клиент' },
    { field: 'callSummaryName', header: 'Сводка', placeholder: 'Введите...', filterable: true, filterField: 'callSummaryName', filterType: 'text' },
    { field: 'description', header: 'Описание' },
    { field: 'solution', header: 'Решение' },
    { field: 'serviceItemFullName', header: 'Элемент сервиса' },
    { field: 'serviceAttendanceFullName', header: 'Выполнил' },
    { field: 'serviceName', header: 'Сервис', placeholder: 'Выберите сервис', filterable: true, filterField: 'serviceName', filterType: 'select', options: serviceOptions },
    { field: 'callTypeFullName', header: 'Тип заявки' },
    { field: 'ownerFullName', header: 'Владелец' },
    { field: 'executorFullName', header: 'Исполнитель' },
    { field: 'utcDateRegistered', header: 'Дата регистрации' },
    { field: 'utcDateModified', header: 'Дата изменения' },
    { field: 'utcDateClosed', header: 'Дата закрытия' }
]);

const defaultColumns = ['number', 'entityStateName', 'priorityName', 'callSummaryName', 'clientFullName', 'executorFullName'];
const selectedColumnFields = ref(defaultColumns);

const selectedColumns = computed(() => 
    columns.value.filter(c => selectedColumnFields.value.includes(c.field))
);
const {
    viewMode: requestsViewMode,
    isCardMode,
    firstRowIndex,
    currentPageItems: currentPageCalls,
    showMobileFilters,
} = useMobileTableView({
    items: calls,
    currentPage,
    rowsPerPage,
    isPhone,
});

const onToggle = (val) => {
    selectedColumnFields.value = val.map(col => col.field);
};

const getStatusSeverity = getInfraStatusSeverity;
const getStatusIcon = getInfraStatusIcon;
const formatUTCToOmsk = formatDateOmskFromUtcString;

const rowClass = (data) => {
    return [{ 'removed-row': data.removed , 'not-allowed': data.removed, 'pointer': !data.removed, 'highlighted-row': data.id === lastCreatedId.value }];
};

const formatUtcFields = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map(formatUtcFields);
    } else if (obj !== null && typeof obj === 'object') {
        const newObj = {};
        for (const key in obj) {
            if (key.startsWith('utc') && obj[key]) {
                newObj[key] = formatUTCToOmsk(obj[key]);
            } else {
                newObj[key] = formatUtcFields(obj[key]);
            }
        }
        return newObj;
    }
    return obj;
};

const lastCreatedId = ref(null);

// Загрузка заявок (по страницам)
const fetchCalls = async (highlightId = null) => {
    try {
        loading.value = true;

        const response = await axiosInstance.get('/api/infra-manager/users/me/calls', {
            params: {
                page: 1,
                pageSize: rowsPerPage.value * 5,
                ...filters,
            },
                
            paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' })
        });

        if (response.data?.entities) {
            calls.value = formatUtcFields(response.data.entities);
            totalRecords.value = response.data.countAllEntities;
            totalPages.value = response.data.countAllPages;
            loadedPages.value = 5;
            if (firstRowIndex.value >= totalRecords.value) {
                currentPage.value = 1;
            }
        }

        if (highlightId) {
            lastCreatedId.value = highlightId;
            console.debug(lastCreatedId.value);
            setTimeout(() => {
                lastCreatedId.value = null;
            }, 5000);
        }

        loading.value = false;
    } catch (error) {
        console.error('Ошибка при загрузке: ', error);
        loading.value = false;
    }
};

const loadMorePages = async () => {
    try {
        const response = await axiosInstance.get('/api/infra-manager/users/me/calls', {
            params: {
                page: loadedPages.value / 5 + 1,
                pageSize: rowsPerPage.value * 5,
                ...filters
            },
        });

        if (response.data?.entities) {
            calls.value.push(...formatUtcFields(response.data.entities));
            loadedPages.value += 5;
        }
    } catch (error) {
        console.debug('Ошибка при загрузке: ', error);
    }
};

// При изменении страницы
const onPage = async (event) => {
    currentPage.value = event.page + 1;
    rowsPerPage.value = event.rows;

    if ((currentPage.value >= loadedPages.value - 1 && 
            calls.value.length != totalRecords.value) || 
            (currentPage.value === loadedPages.value && calls.value.length != totalRecords.value)) {
        await loadMorePages();
    }
};

const onRowsPerPageChange = async () => {
    currentPage.value = 1;
    await fetchCalls();
};

const fetchFilterOptions = async () => {
    try {
        const [services, priorities, states] = await Promise.all([
            axiosInstance.get('/api/infra-manager/calls/service-names'),
            axiosInstance.get('/api/infra-manager/calls/priorities'),
            axiosInstance.get('/api/infra-manager/calls/states'),
        ]);

        serviceOptions.value = services.data.map(service => ({ label: service, value: service }));
        console.log(serviceOptions.value);
        priorityOptions.value = [
            { id: '', name: 'Все' },
            ...priorities.data
        ]
        stateOptions.value = states.data.map(state => ({ label: state, value: state }));
    } catch (error) {
        console.debug('Ошибка загрузки данных для фильтров: ', error);
    }
};

const filters = reactive({
    number: route.query.number || '',
    callSummaryName: route.query.callSummaryName || '',
    serviceName: route.query.serviceName ? route.query.serviceName.split(',') : [],
    priorityId: route.query.priorityId || '',
    entityStateNames: route.query.entityStateNames || ['Инициирована', 'Открыта', 'Зарегистрирована', 'Ожидает']
});

const debouncedUpdateQuery = debounce((key, value) => {
    const query = { ...route.query };

    if (value && value.length !== 0) {
        if (Array.isArray(value)) {
            query[key] = value;
        } else {
            query[key] = value;
        }
    } else {
        delete query[key];
    }

    router.push({ query });
}, 750);

const clearFilter = (key) => {
    currentPage.value = 1;
    filters[key] = Array.isArray(filters[key]) ? [] : '';
    debouncedUpdateQuery(key, filters[key]);
};

const clearMobileFilters = () => {
    currentPage.value = 1;
    filters.number = '';
    filters.callSummaryName = '';
    filters.serviceName = [];
    filters.priorityId = '';
    filters.entityStateNames = [];

    const query = { ...route.query };
    delete query.number;
    delete query.callSummaryName;
    delete query.serviceName;
    delete query.priorityId;
    delete query.entityStateNames;

    router.push({ query });
};

// Обновление query при входе
const handleFilterInput = (key, value) => {
    filters[key] = value;
    currentPage.value = 1;
    debouncedUpdateQuery(key, value);
};

watch (
    () => route.query,
    async () => {
        await fetchCalls();
    },
    { immediate: true }
);

const callDetailsRef = ref(null); // Ссылка на дочерний компонент InfraManagerCalls
const createRequestRef = ref(null);
const shouldOpenCreateModal = ref(false);

const openCallDetailsById = (id) => {
    if (!id) return;

    nextTick(() => {
        callDetailsRef.value?.openCallDetails(id);
    });
};

const openCallDetails = (id) => {
    if (!id) return;

    if (String(route.query.callId || '') === String(id)) {
        openCallDetailsById(id);
        return;
    }

    router.push({
        query: {
            ...route.query,
            callId: id,
        },
    });
};

const clearCallDetailsQuery = () => {
    if (!route.query.callId) return;

    const query = { ...route.query };
    delete query.callId;
    router.replace({ query });
};
const openCreateModal = () => { createRequestRef.value?.openModal?.(); };

const showScrollHint = ref(true);

const hideScrollHint = () => {
    showScrollHint.value = false;
};

watch(
    () => route.query.callId,
    (callId) => {
        if (callId) {
            openCallDetailsById(callId);
        }
    },
    { immediate: true }
);

watch(
    () => route.query.create,
    (createFlag) => {
        shouldOpenCreateModal.value = createFlag === '1';
    },
    { immediate: true }
);

watch(
    [shouldOpenCreateModal, createRequestRef],
    async ([needOpen]) => {
        if (!needOpen || !createRequestRef.value?.openModal) return;

        await nextTick();
        createRequestRef.value.openModal();
        shouldOpenCreateModal.value = false;

        const query = { ...route.query };
        delete query.create;
        router.replace({ query });
    },
    { immediate: true }
);

onMounted(async () => {
    await fetchFilterOptions();
    setTimeout(() => {
        hideScrollHint();
    }, 8000);
});
</script>

<style scoped>
.content {
    position: relative;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    height: 100dvh;
}
.content-wrap {
    flex-grow: 1;
    align-content: center;
    padding: var(--app-page-padding-y) var(--app-page-padding-x) 1rem;
    color: var(--p-text-color);
    transition: all 0.5s;
    height: 100%;
}
.pi {
    font-size: 2rem;
}
.search {
    border-radius: 12px;
    font-size: 18px;
    transition: all 0.5s;
}
.skeleton-table {
    border-radius: 12px;
    background-color: var(--p-grey-3);
}
.scroll-hint {
    position: absolute;
    top: 20px;
    right: 50%;
    transform: translateX(50%);
    background: var(--p-blue-500);
    color: white;
    padding: 10px 20px;
    border-radius: 12px;
    font-size: 14px;
    text-align: center;
    z-index: 1000;
    cursor: pointer;
    animation: fadeInOut 5s forwards;
}

@keyframes fadeInOut {
    0%, 80% {
        opacity: 1;
    }
    100% {
        opacity: 0;
    }
}

.requests-mobile-layout {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.requests-mobile-toolbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
}

.requests-mobile-subtitle {
    margin: 0.35rem 0 0;
    color: var(--p-text-muted-color, var(--p-grey-2));
    font-size: 0.92rem;
}

.requests-mobile-toolbar-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
}

.requests-mobile-filters {
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

.requests-mobile-filter-actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.75rem;
    align-items: center;
}

.requests-mobile-summary {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    font-size: 0.92rem;
    color: var(--p-text-muted-color, var(--p-grey-2));
}

.requests-card-list {
    display: grid;
    gap: 0.85rem;
}

.requests-card {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
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

.requests-card-head,
.requests-card-number,
.requests-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
}

.requests-card-number {
    justify-content: flex-start;
}

.requests-card-number .pi {
    font-size: 1.3rem;
}

.requests-card-row {
    display: flex;
    flex-direction: column;
    gap: 0.28rem;
}

.requests-card-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--p-text-muted-color, var(--p-grey-2));
}

.requests-card-value {
    color: var(--p-text-color);
    line-height: 1.45;
}

.requests-card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
}

.requests-card-meta-item {
    display: inline-flex;
    align-items: center;
    padding: 0.38rem 0.7rem;
    border-radius: 999px;
    background: rgba(var(--p-blue-500-rgb), 0.08);
    font-size: 0.82rem;
}

.requests-card-footer {
    align-items: flex-end;
    font-size: 0.85rem;
    color: var(--p-text-muted-color, var(--p-grey-2));
}

.requests-empty-state {
    padding: 2rem 1rem;
    text-align: center;
    border-radius: 18px;
    border: 1px dashed rgba(var(--p-blue-500-rgb), 0.18);
    color: var(--p-text-muted-color, var(--p-grey-2));
}

.requests-mobile-paginator {
    padding-bottom: var(--app-mobile-bottom-offset);
}

.clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

@media (max-width: 768px) {
    .content {
        min-height: calc(100dvh - 4.5rem);
    }

    .requests-mobile-toolbar,
    .requests-card-head,
    .requests-card-footer {
        flex-direction: column;
        align-items: flex-start;
    }

    .requests-mobile-toolbar-actions {
        width: 100%;
        justify-content: flex-end;
    }

    .requests-mobile-toolbar-actions :deep(.p-button) {
        flex: 1;
    }

    .requests-mobile-summary,
    .requests-mobile-filter-actions {
        grid-template-columns: 1fr;
        display: grid;
    }

    .requests-card-footer {
        align-items: stretch;
    }

    .requests-card-footer :deep(.p-button) {
        width: 100%;
    }
}
</style>
