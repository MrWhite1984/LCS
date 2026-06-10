<template>
    <main>
        <div class="content">
            <div class="content-wrap">
                <div v-if="showScrollHint" class="scroll-hint" @click="hideScrollHint">
                    Прокрутите таблицу вправо, чтобы увидеть больше данных.
                </div>
                <Transition name="content-fade" mode="out-in">
                <DataTable
                    key="infra-manager-table-content"
                    v-if="!loading || calls.length"
                    :value="calls"
                    :filters="filters"
                    filterDisplay="row"
                    paginator
                    :rows="rowsPerPage"
                    :totalRecords="totalRecords"
                    scrollable
                    removableSort
                    stripedRows                    
                    @page="onPage"
                    :rowClass="rowClass"
                    @row-click="(event) => openCallDetails(event.data.id)"
                >
                    <template #header>
                        <div class="d-flex justify-content-between align-items-center">
                            <Button label="Назад" icon="pi pi-arrow-left" @click="goBack"/>
                            <h3 class="title m-0">
                                Все заявки
                            </h3>
                            <AutoComplete 
                                v-model="selectedUser"
                                :suggestions="userSuggestions"
                                optionLabel="fullName"
                                @complete="searchUsers"
                                @item-select="fetchCalls"
                                @clear="fetchCalls"
                                placeholder="Поиск по пользователю"
                            />
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
                    <Column field="number" header="#" sortable :showFilterMenu="false" style="min-width: 180px">
                        <template #body="{ data }">
                            {{ data.number }}
                        </template>
                        <template #filter="{ filterModel, filterCallback }">
                            <div class="d-flex align-items-center">
                                <InputText 
                                    v-model="filters.number"
                                    placeholder="Введите номер..."
                                    @input="handleFilterInput('number', filters.number)"
                                    class="w-100"
                                />
                                <Button 
                                    icon="pi pi-filter-slash"
                                    text
                                    severity="contrast"
                                    class="ms-2"
                                    v-if="filters.number"
                                    @click="clearFilter('number', filterCallback)"
                                />
                            </div>
                        </template>
                    </Column>
                    <Column field="entityStateName" header="Статус" :showFilterMenu="false" style="max-width: 250px;">
                        <template #body="{ data }">
                            <Tag :value="data.entityStateName" :severity="getStatusSeverity(data.entityStateName)" :icon="getStatusIcon(data.entityStateName)" />
                        </template>
                        <template #filter="{ filterCallback }">
                            <div class="d-flex align-items-center">
                                <MultiSelect 
                                    v-model="filters.entityStateNames"
                                    :options="stateOptions"
                                    optionLabel="label"
                                    optionValue="value"
                                    class="w-75"
                                    placeholder="Выберите статус"
                                    @change="handleFilterInput('entityStateNames', filters.entityStateNames)"
                                />
                                <Button 
                                    icon="pi pi-filter-slash"
                                    text
                                    severity="contrast"
                                    class="ms-2"
                                    v-if="filters.entityStateNames"
                                    @click="clearFilter('entityStateNames', filterCallback)"
                                />
                            </div>
                        </template>
                    </Column>
                    <Column field="priorityName" header="Приоритет" :showFilterMenu="false" style="min-width: 200px">
                        <template #body="{ data }">
                            <div class="d-flex align-items-center">
                                <Badge value="" :severity="data.priorityName === 'Высокий' ? 'danger' : data.priorityName === 'Низкий' ? 'success' : 'contrast'" class="me-2 p-2"/>
                                {{ data.priorityName }}
                            </div>
                        </template>
                        <template #filter="{ filterCallback }">
                            <div class="d-flex align-items-center">
                                <Select 
                                    v-model="filters.priorityId"
                                    :options="priorityOptions"
                                    optionLabel="name"
                                    optionValue="id"
                                    class="w-100"
                                    placeholder="Выберите приоритет..."
                                    @change="handleFilterInput('priorityId', filters.priorityId)"
                                />
                                <Button 
                                    icon="pi pi-filter-slash"
                                    text
                                    severity="contrast"
                                    class="ms-2"
                                    v-if="filters.priorityId"
                                    @click="clearFilter('priorityId', filterCallback)"
                                />
                            </div>
                        </template>
                    </Column>
                    <Column field="initiatorFullName" header="Инициатор" sortable style="min-width: 200px">
                        <template #body="{ data }">
                            {{ data.initiatorFullName }}
                        </template>
                    </Column>
                    <Column field="clientFullName" header="Клиент" sortable style="min-width: 200px">
                        <template #body="{ data }">
                            {{ data.clientFullName }}
                        </template>
                    </Column>
                    <Column field="callSummaryName" header="Сводка" :showFilterMenu="false" style="min-width: 200px">
                        <template #body="{ data }">
                            {{ data.callSummaryName }}
                        </template>
                        <template #filter="{ filterCallback }">
                            <div class="d-flex align-items-center">
                                <InputText 
                                    v-model="filters.callSummaryName"
                                    placeholder="Введите..."
                                    @input="handleFilterInput('callSummaryName', filters.callSummaryName)"
                                    class="w-100"
                                />
                                <Button 
                                    icon="pi pi-filter-slash"
                                    text
                                    severity="contrast"
                                    class="ms-2"
                                    v-if="filters.callSummaryName"
                                    @click="clearFilter('callSummaryName', filterCallback)"
                                />
                            </div>
                        </template>
                    </Column>
                    <Column field="description" header="Описание" style="max-width: 150px">
                        <template #body="{ data }">
                            <div style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;" v-tooltip="{ value: data.description, showDelay: 800, hideDelay: 300 }">{{ data.description }}</div>
                        </template>
                    </Column>
                    <Column field="solution" header="Решение" style="max-width: 250px;">
                        <template #body="{ data }">
                            <div style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;" v-tooltip="{ value: data.solution, showDelay: 800, hideDelay: 300 }">{{ data.solution }}</div>
                        </template>
                    </Column>
                    <Column field="serviceItemFullName" header="Элемент сервиса" style="min-width: 350px">
                        <template #body="{ data }">
                            {{ data.serviceItemFullName }}
                        </template>
                    </Column>

                    <Column field="serviceAttendanceFullName" header="Выполнил" sortable style="min-width: 150px">
                        <template #body="{ data }">
                            {{ data.accomplisherFullName }}
                        </template>
                    </Column>
                    <Column field="serviceName" header="Сервис" :showFilterMenu="false" style="min-width: 250px">
                        <template #body="{ data }">
                            {{ data.serviceName }}
                        </template>
                        <template #filter="{ filterCallback }">
                            <div class="d-flex align-items-center">
                                <Select 
                                    v-model="filters.serviceName"
                                    :options="serviceOptions"
                                    :maxSelectedLabels="1"
                                    optionLabel="label"
                                    optionValue="label"
                                    class="w-75"
                                    placeholder="Выберите сервис..."
                                    @change="handleFilterInput('serviceName', filters.serviceName)"
                                />
                                <Button 
                                    icon="pi pi-filter-slash"
                                    text
                                    severity="contrast"
                                    class="ms-2"
                                    v-if="filters.serviceName"
                                    @click="clearFilter('serviceName', filterCallback)"
                                />
                            </div>
                        </template>
                    </Column>
                    <Column field="callTypeFullName" header="Тип заявки" style="min-width: 100px">
                        <template #body="{ data }">
                            {{ data.callTypeFullName }}
                        </template>
                    </Column>
                    <Column field="ownerFullName" header="Владелец" sortable style="min-width: 200px">
                        <template #body="{ data }">
                            {{ data.ownerFullName }}
                        </template>
                    </Column>
                    <Column field="executorFullName" header="Исполнитель" sortable style="min-width: 200px">
                        <template #body="{ data }">
                            {{ data.executorFullName }}
                        </template>
                    </Column>
                    <Column field="utcDateRegistered" header="Дата регистрации" sortable style="min-width: 290px">
                        <template #body="{ data }">
                            {{ formatUTCToOmsk(data.utcDateRegistered) }}
                        </template>
                    </Column>
                    <Column field="utcDateModified" header="Дата изменения" style="min-width: 290px">
                        <template #body="{ data }">
                            {{ formatUTCToOmsk(data.utcDateModified) }}
                        </template>
                    </Column>
                    <Column field="utcDateClosed" header="Дата закрытия" style="min-width: 290px">
                        <template #body="{ data }">
                            {{ formatUTCToOmsk(data.utcDateClosed) }}
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
                                @change="resetPagination()"
                                optionLabel="label"
                                optionValue="value"
                                class="search mx-1 px-1"
                            />
                            <span>строк</span>
                        </div>
                    </template>
                </DataTable>
                <div key="infra-manager-table-skeleton" v-else class="infra-table-skeleton">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <Skeleton width="7rem" height="2.1rem" />
                        <Skeleton width="10rem" height="1.6rem" />
                        <Skeleton width="14rem" height="2.1rem" />
                    </div>
                    <Skeleton width="100%" height="3rem" class="mb-2" />
                    <Skeleton width="100%" height="3rem" class="mb-2" />
                    <Skeleton width="100%" height="3rem" class="mb-2" />
                    <Skeleton width="100%" height="3rem" class="mb-2" />
                    <Skeleton width="100%" height="3rem" />
                </div>
                </Transition>
            </div>
        </div>
        <InfraManagerCalls ref="callDetailsRef" class="position-absolute opacity-0" @close="clearCallDetailsQuery"/>
    </main>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, reactive } from 'vue';
import axiosInstance from '@/utils/axios.js';
import { useRoute, useRouter } from 'vue-router';
import { debounce } from 'lodash';
import qs from 'qs';
import { getInfraStatusIcon, getInfraStatusSeverity } from '@/utils/infraStatus.js';
import { formatDateOmskFromUtcString } from '@/utils/date.js';

import InfraManagerCalls from '@/components/InfraManager/InfraManagerCalls.vue';

const loading = ref(true);

const showScrollHint = ref(true);

const hideScrollHint = () => {
    showScrollHint.value = false;
};

const selectedUser = ref(null);
const userSuggestions = ref([]);
const calls = ref([]);  // Все загруженные заявки
const currentPage = ref(1);  // Текущая страница
const rowsPerPage = ref(10);  // Количество строк на странице
const totalRecords = ref(0);  // Общее количество заявок
const totalPages = ref(0);
const loadedPages = ref(10);

const route = useRoute();
const router = useRouter();

const serviceOptions = ref([]);
const priorityOptions = ref([]);
const stateOptions = ref([]);

const rowsPerPageOptions = [
    { label: '10', value: 10 },
    { label: '15', value: 15 },
    { label: '20', value: 20 },
    { label: '50', value: 50 },
];

const getStatusSeverity = getInfraStatusSeverity;
const getStatusIcon = getInfraStatusIcon;
const formatUTCToOmsk = formatDateOmskFromUtcString;

const rowClass = (data) => {
    return [{ 'removed-row': data.removed , 'not-allowed': data.removed, 'pointer': !data.removed }];
};

const searchUsers = async (event) => {
    try {
        const response = await axiosInstance.get('/api/infra-manager/users', {
            params: { patternSearch: event.query }
        });

        userSuggestions.value = response.data; // Список пользователей для AutoComplete
    } catch (error) {
        console.debug('Ошибка при поиске пользователей: ', error);
    }
}

// Загрузка заявок (по страницам)
const fetchCalls = async () => {
    try {
        loading.value = true;
        const response = await axiosInstance.get('/api/infra-manager/calls', {
            params: {
                page: 1,
                pageSize: rowsPerPage.value * 10,
                ...filters
            },

            paramsSerializer: (params) => {
                return qs.stringify(params, { arrayFormat: 'repeat' })
            }
        });

        if (response.data?.entities) {
            calls.value = response.data.entities;
            totalRecords.value = response.data.countAllEntities;
            totalPages.value = response.data.countAllPages;
            loadedPages.value = 10;
        }
        loading.value = false;
    } catch (error) {
        console.debug('Ошибка при загрузке: ', error);
        loading.value = false;
    }
};

const loadMorePages = async () => {
    try {
        const response = await axiosInstance.get('/api/infra-manager/calls', {
            params: {
                page: loadedPages.value / 10 + 1,
                pageSize: rowsPerPage.value * 10,
                ...filters
            },
            paramsSerializer: (params) => {
                return qs.stringify(params, { arrayFormat: 'repeat' })
            }
        });

        if (response.data?.entities) {
            calls.value.push(...response.data.entities);
            loadedPages.value += 10;
        }
    } catch (erorr) {
        console.debug('Ошибка при загрузке: ', error);
    }
};

const resetPagination = async () => {
    currentPage.value = 1;
    console.log(1)
    loadedPages.value = 10;
    calls.value = [];
    await fetchCalls();
}

// При изменении страницы
const onPage = async (event) => {

    currentPage.value = event.page + 1;
    rowsPerPage.value = event.rows;

    if ((currentPage.value >= loadedPages.value - 1 && calls.value.length != totalRecords.value) || (currentPage.value === loadedPages.value && calls.value.length != totalRecords.value)) {
        await loadMorePages();
    }
};

const fetchFilterOptions = async () => {
    try {
        const [services, priorities, states] = await Promise.all([
            axiosInstance.get('/api/infra-manager/calls/service-names'),
            axiosInstance.get('/api/infra-manager/calls/priorities'),
            axiosInstance.get('/api/infra-manager/calls/states'),
        ]);

        serviceOptions.value = services.data.map(service => ({ label: service, value: service }));
        priorityOptions.value = priorities.data;
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

const clearFilter = (key, filterCallback) => {
    filters[key] = '';
    filterCallback();
    debouncedUpdateQuery(key, '');
}

// Обновление query при входе
const handleFilterInput = (key, value) => {
    filters[key] = value;
    debouncedUpdateQuery(key, value);
}

watch (
    () => route.query,
    async () => {
        await fetchCalls();
    },
    { immediate: true }
);

const goBack = () => {
    router.back();
};

const callDetailsRef = ref(null); // Ссылка на дочерний компонент InfraManagerCalls

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

watch(
    () => route.query.callId,
    (callId) => {
        if (callId) {
            openCallDetailsById(callId);
        }
    },
    { immediate: true }
);

onMounted(async () => {
    const defaultQuery = {
        entityStateNames: ['Инициирована', 'Открыта', 'Зарегистрирована', 'Ожидает'],
    };

    const updatedQuery = { ...route.query };

    let needsUpdate = false;

    for (const key in defaultQuery) {
        if (!updatedQuery[key]) {
            updatedQuery[key] = defaultQuery[key];
            needsUpdate = true;
        }
    }

    if (needsUpdate) {
        router.replace({ query: updatedQuery });
    }

    await fetchFilterOptions();
    setTimeout(() => {
        hideScrollHint();
    }, 8000);
});

defineExpose({
    loading
});
</script>

<style scoped>
main {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
}
.scroll-hint {
    position: absolute;
    top: 15px;
    right: 50%;
    transform: translateX(50%);
    background: var(--p-blue-500);
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    text-align: center;
    z-index: 1000;
    cursor: pointer;
    animation: fadeInOut 8s forwards;
}
@keyframes fadeInOut {
    0%, 80% {
        opacity: 1;
    }
    100% {
        opacity: 0;
    }
}
.content {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    height: 100dvh;
}
.content-wrap {
    flex-grow: 1;
    align-content: center;
    padding: 10px 10px;
    color: var(--p-text-color);
    transition: all 0.5s;
    height: 100%;
}
.infra-table-skeleton {
    width: 100%;
}
.openCall:hover {
    text-decoration: underline;
    cursor: pointer;
}
.pi {
    font-size: 2rem;
}
:deep(.p-datatable-tbody > tr:hover) {
    background-color: var(--p-blue-500-low-op) !important;
}
@media (max-width: 768px) {
    .content-wrapper {
        padding: 20px;
    }
    .card-text {
        font-size: 0.74rem;
        font-family: 'SF Pro Rounded', sans-serif;
        color: var(--p-grey-1);
        text-wrap: wrap;
    }
    h2 {
        font-size: 18px;
    }
   
}
</style>
