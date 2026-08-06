<template>
    <div class="content">
        <div class="content-wrapper">
            <Transition name="content-fade" mode="out-in">
                <div v-if="isFirstLoadDone" key="users-content">
                    <section v-if="isCardMode" class="users-mobile-layout">
                        <div class="users-mobile-toolbar">
                            <div>
                                <h3 class="m-0">Пользователи</h3>
                                <p class="users-mobile-subtitle">Управление профилями, ролями и доступом.</p>
                            </div>
                            <div class="users-mobile-toolbar-actions">
                                <Button
                                    icon="pi pi-sliders-h"
                                    outlined
                                    severity="secondary"
                                    @click="toggleSpecialUsersPanel"
                                />
                                <Button
                                    icon="pi pi-filter"
                                    outlined
                                    severity="secondary"
                                    @click="showMobileFilters = !showMobileFilters"
                                />
                                <CreateUser v-if="hasPermission('User', 'Create')" />
                                <Button
                                    icon="pi pi-sync"
                                    outlined
                                    severity="secondary"
                                    @click="fetchCustomers"
                                    :loading="loading"
                                    :disabled="loading"
                                />
                            </div>
                        </div>

                        <div v-if="showMobileFilters" class="users-mobile-filters">
                            <InputText
                                :model-value="filters.lastName"
                                placeholder="Поиск по фамилии"
                                @update:model-value="(value) => onFilter('lastName', value)"
                            />
                            <InputText
                                :model-value="filters.firstName"
                                placeholder="Поиск по имени"
                                @update:model-value="(value) => onFilter('firstName', value)"
                            />
                            <InputText
                                :model-value="filters.middleName"
                                placeholder="Поиск по отчеству"
                                @update:model-value="(value) => onFilter('middleName', value)"
                            />
                            <InputText
                                :model-value="filters.email"
                                placeholder="Поиск по E-mail"
                                @update:model-value="(value) => onFilter('email', value)"
                            />
                            <MultiSelect
                                v-model="filters.roleIds"
                                :options="roles"
                                optionLabel="title"
                                optionValue="id"
                                :maxSelectedLabels="1"
                                display="chip"
                                placeholder="Выберите роли"
                                @change="onFilter('roleIds', $event.value)"
                            />
                            <Select
                                v-model="filters.isBlocked"
                                :options="statusOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Выберите статус"
                                @change="onFilter('isBlocked', $event.value)"
                            />
                            <div class="users-mobile-filter-actions">
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

                        <div class="users-mobile-summary">
                            <span>Всего пользователей: {{ totalRecords }}</span>
                            <span>Показано: {{ currentPageCustomers.length }}</span>
                        </div>

                        <div v-if="currentPageCustomers.length" class="users-card-list">
                            <article
                                v-for="customer in currentPageCustomers"
                                :key="customer.id"
                                class="users-card"
                                @click="navigateToProfile(customer.id)"
                            >
                                <div class="users-card-header">
                                    <div class="users-card-title">
                                        <strong>{{ getCustomerFullName(customer) }}</strong>
                                        <span>{{ customer.email || 'E-mail не указан' }}</span>
                                    </div>
                                    <Tag
                                        :severity="customer.isBlocked ? 'danger' : 'success'"
                                        :value="customer.isBlocked ? 'Заблокирован' : 'Активен'"
                                        :icon="customer.isBlocked ? 'pi pi-times' : 'pi pi-check'"
                                    />
                                </div>

                                <div class="users-card-meta">
                                    <span class="users-card-meta-item">
                                        <i class="pi pi-id-card"></i>
                                        ID {{ customer.id }}
                                    </span>
                                    <span v-if="customer.middleName" class="users-card-meta-item">
                                        <i class="pi pi-user"></i>
                                        {{ customer.middleName }}
                                    </span>
                                </div>

                                <div class="users-card-role-block">
                                    <div class="users-card-label">Главная роль</div>
                                    <Chip v-if="customer.roles.length > 0" class="role-label">
                                        <span class="roleType" :class="getRoleTypeClass(customer.roles[0])">
                                            {{ customer.roles[0].type.charAt(0) }}
                                        </span>
                                        <span>{{ customer.roles[0].title }}</span>
                                    </Chip>
                                    <Tag v-else severity="warn" value="Нет ролей" />
                                    <div v-if="customer.roles.length > 1" class="users-card-extra-roles">
                                        +{{ customer.roles.length - 1 }} доп.
                                    </div>
                                </div>

                                <div class="users-card-actions">
                                    <Button
                                        label="Профиль"
                                        size="small"
                                        outlined
                                        severity="secondary"
                                        @click.stop="navigateToProfile(customer.id)"
                                    />
                                </div>
                            </article>
                        </div>
                        <div v-else class="users-empty-state">Не найдено.</div>

                        <div class="users-mobile-paginator">
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
                        :value="customers"
                        paginator
                        scrollable
                        stripedRows
                        :rows="rowsPerPage"
                        :first="firstRowIndex"
                        :rowClass="rowClass"
                        @row-click="(event) => navigateToProfile(event.data.id)"
                        :totalRecords="totalRecords"
                        @page="onPage"
                        :rowsPerPageOptions="[5, 10, 15]"
                        filterDisplay="row"
                    >
                    <template #header>
                        <div class="d-flex justify-content-between align-items-center users-table-header">
                            <h3 class="m-0 ps-4">Пользователи</h3>
                            <div class="d-flex gap-2 users-table-actions">
                                <MultiSelect
                                    :modelValue="selectedColumns"
                                    :options="columns"
                                    optionLabel="header"
                                    @update:modelValue="onToggle"
                                    display="chip"
                                    placeholder="Выберите поля"
                                />
                                <CreateUser v-if="hasPermission('User', 'Create')" />
                                <Button
                                    icon="pi pi-sync"
                                    outlined
                                    severity="secondary"
                                    @click="fetchCustomers"
                                    :loading="loading"
                                    :disabled="loading"
                                />
                            </div>
                        </div>
                    </template>

                    <template #paginatorstart>
                        <div class="d-flex justify-content-between align-items-center">
                            <div>Всего пользователей: {{ totalRecords }}</div>
                        </div>
                    </template>

                    <template #paginatorend>
                        <Button disabled type="button" icon="pi pi-download" text />
                    </template>

                    <template #empty>Не найдено.</template>
                    <template #loading>Данные загружаются. Подождите.</template>

                    <Column
                        v-for="col in ordinaryColumns"
                        :field="col.field"
                        :key="col.field"
                        :header="col.header"
                        :showFilterMenu="false"
                        :style="col.style"
                    >
                        <template #filter>
                            <InputText
                                :value="filters[col.field]"
                                :placeholder="col.placeholder"
                                @input="event => onFilter(col.field, event.target.value)"
                                autocomplete="off"
                                class="w-75"
                            />
                        </template>
                    </Column>

                    <Column field="roleIds" header="Роли" :showFilterMenu="false" v-if="selectedColumnFields.includes('roleIds')" style="min-width: 280px;">
                        <template #body="{ data }">
                            <div class="role-label-container">
                                <Chip v-if="data.roles.length > 0" class="role-label">
                                    <span class="roleType" :class="getRoleTypeClass(data.roles[0])">
                                        {{ data.roles[0].type.charAt(0) }}
                                    </span>
                                    <span>{{ data.roles[0].title }}</span>
                                </Chip>

                                <Button v-if="data.roles.length > 1" rounded text class="p-2 ms-2" icon="pi pi-ellipsis-h" @click.stop="(event) => togglePopover($refs['popover' + data.id], event)" />

                                <Popover :ref="'popover' + data.id">
                                    <div class="roles-container">
                                        <div v-for="(role, index) in data.roles.slice(1)" :key="role.id" class="role-list-item">
                                            <Chip class="role-label">
                                                <span class="roleType" :class="getRoleTypeClass(role)">
                                                    {{ role.type.charAt(0) }}
                                                </span>
                                                <span>{{ role.title }}</span>
                                            </Chip>
                                        </div>
                                    </div>

                                </Popover>
                            </div>
                        </template>
                        <template #filter>
                            <MultiSelect
                                v-model="filters.roleIds"
                                :options="roles"
                                optionLabel="title"
                                optionValue="id"
                                :maxSelectedLabels="1"
                                placeholder="Выберите роли"
                                @change="onFilter('roleIds', $event.value)"
                            />
                        </template>
                    </Column>
                    <Column field="isBlocked" header="Статус" :showFilterMenu="false" v-if="selectedColumnFields.includes('isBlocked')">
                        <template #body="{ data }">
                            <Tag
                                :severity="data.isBlocked ? 'danger' : 'success'"
                                :value="data.isBlocked ? 'Заблокирован' : 'Активен'"
                                :icon="data.isBlocked ? 'pi pi-times' : 'pi pi-check'"
                            />
                        </template>
                        <template #filter>
                            <Select
                                v-model="filters.isBlocked"
                                :options="statusOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Выберите статус"
                                @change="onFilter('isBlocked', $event.value)"
                            />
                        </template>
                    </Column>
                    </DataTable>
                </div>

                <div v-else-if="!isFirstLoadDone && loading" key="users-skeleton" class="users-skeleton">
                <div class="users-skeleton-header">
                    <Skeleton width="180px" height="34px" />
                    <div class="users-skeleton-actions">
                        <Skeleton width="260px" height="40px" borderRadius="10px" />
                        <Skeleton width="140px" height="40px" borderRadius="10px" />
                        <Skeleton width="40px" height="40px" borderRadius="10px" />
                    </div>
                </div>

                <div class="users-skeleton-table">
                    <div class="users-skeleton-col otp">
                        <Skeleton width="36px" height="18px" />
                        <Skeleton width="100%" height="32px" borderRadius="8px" />
                    </div>
                    <div class="users-skeleton-col name">
                        <Skeleton width="90px" height="18px" />
                        <Skeleton width="100%" height="32px" borderRadius="8px" />
                    </div>
                    <div class="users-skeleton-col name">
                        <Skeleton width="50px" height="18px" />
                        <Skeleton width="100%" height="32px" borderRadius="8px" />
                    </div>
                    <div class="users-skeleton-col name">
                        <Skeleton width="85px" height="18px" />
                        <Skeleton width="100%" height="32px" borderRadius="8px" />
                    </div>
                    <div class="users-skeleton-col roles">
                        <Skeleton width="65px" height="18px" />
                        <Skeleton width="100%" height="32px" borderRadius="8px" />
                    </div>
                </div>

                <div class="users-skeleton-body">
                    <div class="users-skeleton-row" v-for="idx in rowsPerPage" :key="idx">
                        <Skeleton width="34px" height="34px" borderRadius="8px" />
                        <Skeleton width="220px" height="24px" borderRadius="8px" />
                        <Skeleton width="180px" height="24px" borderRadius="8px" />
                        <Skeleton width="180px" height="24px" borderRadius="8px" />
                        <Skeleton width="180px" height="28px" borderRadius="999px" />
                    </div>
                </div>

                <div class="users-skeleton-footer">
                    <Skeleton width="180px" height="22px" />
                    <Skeleton width="220px" height="36px" borderRadius="10px" />
                </div>
                </div>
            </Transition>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import axiosInstance from '@/utils/axios.js';
import { useRoute, useRouter } from 'vue-router';
import { debounce } from 'lodash';
import { useResponsiveLayout } from '@/composables/useResponsiveLayout.js';
import { useMobileTableView } from '@/composables/useMobileTableView.js';

import CreateUser from '@/components/Users/CreateUser.vue';
import { usePermissionStore } from '@/stores/permissions.js';

const router = useRouter();
const route = useRoute();

const customers = ref([]);
const totalRecords = ref(0);
const loading = ref(true);
const isFirstLoadDone = ref(false);
const specialUsersPanel = ref(null);
const syncLoading = ref(false);

const roles = ref([]);
const userPriority = ref(null);
const rowsPerPageOptions = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '15', value: 15 },
];

const permissionStore = usePermissionStore();
const hasPermission = (type, action) => permissionStore.hasPermission(type, action);
const { isPhone } = useResponsiveLayout();

const filters = ref({
    firstName: null,
    lastName: null,
    middleName: null,
    email: null,
    roleIds: [],
    isBlocked: null,
});

const columns = ref([
    { field: 'lastName', header:'Фамилия', placeholder: 'Поиск по фамилии', style: 'min-width: 260px;' },
    { field: 'firstName', header: 'Имя', placeholder: 'Поиск по имени', style: 'min-width: 260px;' },
    { field: 'middleName', header: 'Отчество', placeholder: 'Поиск по отчеству', style: 'min-width: 260px;' },
    { field: 'email', header: 'E-mail', placeholder: 'Поиск по E-mail', style: 'min-width: 260px;' },
    { field: 'roleIds', header: 'Роли', placeholder: 'Выберите роли', style: 'min-width: 280px;' },
    { field: 'isBlocked', header: 'Статус', placeholder: 'Выберите статус', style: 'min-width: 120px;' }
]);
const defaultColumns = ['lastName', 'firstName', 'middleName', 'roleIds'];

const selectedColumnFields = ref(defaultColumns);
const selectedColumns = computed(() => 
    columns.value.filter(c => selectedColumnFields.value.includes(c.field))
);
const onToggle = (val) => {
    selectedColumnFields.value = val.map(col => col.field);
};
const ordinaryColumns = computed(() => 
    columns.value.filter(c => selectedColumnFields.value.includes(c.field) && !['roleIds','isBlocked'].includes(c.field))
);

const currentPage = ref(1);
const rowsPerPage = ref(10);
const {
    isCardMode,
    firstRowIndex,
    currentPageItems: currentPageCustomers,
    showMobileFilters,
} = useMobileTableView({
    items: customers,
    currentPage,
    rowsPerPage,
    isPhone,
    sliceItems: false,
});

const parsePositiveNumber = (value, fallback) => {
    const normalized = Number(value);
    return Number.isFinite(normalized) && normalized > 0 ? normalized : fallback;
};

const parseBooleanQuery = (value) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
};

const parseRoleIdsQuery = (value) => {
    const rawValue = Array.isArray(value) ? value.join(',') : String(value || '');

    return rawValue
        .split(',')
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item) && item > 0);
};

const normalizeQueryText = (value) => {
    const normalized = String(value || '').trim();
    return normalized || null;
};

const hydrateUsersStateFromQuery = () => {
    currentPage.value = parsePositiveNumber(route.query.page, 1);
    rowsPerPage.value = parsePositiveNumber(route.query.pageSize, 10);

    filters.value = {
        firstName: normalizeQueryText(route.query.firstName),
        lastName: normalizeQueryText(route.query.lastName),
        middleName: normalizeQueryText(route.query.middleName),
        email: normalizeQueryText(route.query.email),
        roleIds: parseRoleIdsQuery(route.query.roleIds),
        isBlocked: parseBooleanQuery(route.query.isBlocked),
    };
};

const buildUsersQuery = () => {
    const nextQuery = {
        page: String(currentPage.value),
        pageSize: String(rowsPerPage.value),
    };

    if (filters.value.firstName) nextQuery.firstName = filters.value.firstName;
    if (filters.value.lastName) nextQuery.lastName = filters.value.lastName;
    if (filters.value.middleName) nextQuery.middleName = filters.value.middleName;
    if (filters.value.email) nextQuery.email = filters.value.email;
    if (filters.value.roleIds?.length) nextQuery.roleIds = filters.value.roleIds.join(',');
    if (filters.value.isBlocked !== null) nextQuery.isBlocked = String(filters.value.isBlocked);

    return nextQuery;
};

const syncUsersQuery = async () => {
    const nextQuery = buildUsersQuery();
    const currentQuery = route.query;
    const nextKeys = Object.keys(nextQuery);
    const currentKeys = Object.keys(currentQuery);
    const sameLength = nextKeys.length === currentKeys.length;
    const sameEntries = nextKeys.every((key) => String(currentQuery[key] ?? '') === String(nextQuery[key] ?? ''));

    if (sameLength && sameEntries) return;

    await router.replace({ query: nextQuery });
};

const onFilter = (field, value) => {
    filters.value[field] = value;
    currentPage.value = 1;
    debouncedFetchCustomers();
};

const debouncedFetchCustomers = debounce(async () => {
    await fetchCustomers();
}, 500);

const statusOptions = [
    { label: "Все", value: null },
    { label: 'Активен', value: false },
    { label: 'Заблокирован', value: true },
];

const togglePopover = (popoverRef, event) => {
    nextTick(() => {
        if (popoverRef) {
            popoverRef.toggle(event);
        } else {
            console.debug("Popover reference is null");
        }
    });
};

const rowClass = (data) => {
    return [{ 'pointer': !data.removed }];
};

const navigateToProfile = (userId) => {
    router.push({ 
        name: 'Profile', 
        query: {
            id: userId,
            returnTo: route.fullPath,
        }
    });
};

const toggleSpecialUsersPanel = (event) => {
    specialUsersPanel.value?.toggle(event);
};

const runUsersSync = async ({ endpoint, successDetail, errorDetail, errorLogLabel }) => {
    try {
        syncLoading.value = true;
        await axiosInstance.post(endpoint);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: {
                severity: 'success',
                summary: 'Пользователи',
                detail: successDetail
            }
        }));
        specialUsersPanel.value?.hide();
    } catch (error) {
        console.debug(errorLogLabel, error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: {
                severity: 'error',
                summary: 'Пользователи',
                detail: errorDetail
            }
        }));
    } finally {
        syncLoading.value = false;
    }
};

// Классы для отображения ролей в зависимости от их типа
const getRoleTypeClass = (role) => {
    return role.type === 'Custom' ? 'custom-role-type' : 'default-role-type';
};

const getCustomerFullName = (customer) => {
    return [
        customer.lastName,
        customer.firstName,
        customer.middleName,
    ].filter(Boolean).join(' ') || `Пользователь #${customer.id}`;
};

const resetMobileFilters = async () => {
    currentPage.value = 1;
    filters.value = {
        firstName: null,
        lastName: null,
        middleName: null,
        email: null,
        roleIds: [],
        isBlocked: null,
    };
    await fetchCustomers();
};

const onPage = async (event) => {
    currentPage.value = event.page + 1;
    rowsPerPage.value = event.rows;
    await fetchCustomers();
};

const onRowsPerPageChange = async () => {
    currentPage.value = 1;
    await fetchCustomers();
};

const fetchCustomers = async () => {
    try {
        loading.value = true;
        await syncUsersQuery();

        const payload = {
            page: currentPage.value,
            pageSize: rowsPerPage.value,
            ...filters.value,
            roleIds: filters.value.roleIds?.length ? filters.value.roleIds : null,
        };

        const { data } = await axiosInstance.post('/api/users/list', payload)
        customers.value = data.entities;
        totalRecords.value = data.countEntities;
    } catch (error) {
        console.debug('Ошибка при получении пользователей: ', error);
    } finally {
        loading.value = false;
        isFirstLoadDone.value = true;
    }
};


onMounted(async () => {
    hydrateUsersStateFromQuery();
    await fetchCustomers();
    await fetchRoles();
});

const fetchRoles = async () => {
    try {
        const response = await axiosInstance.get('/api/rbac/roles');
        const allRoles = response.data;            
        // Фильтруем роли по приоритету
        roles.value = allRoles
            .filter(role => role.priority > userPriority.value);
    } catch (error) {
        console.debug('Ошибка при получении ролей: ', error);
    }
};

</script>

<style scoped>

h3 {
    color: var(--p-text-color);
    transition: all 0.5s;
}
.content {
    display: flex;
    flex-direction: column;
    height: 100dvh;
    box-sizing: border-box;
}
.content-wrapper {
    position: relative;
    flex-grow: 1;
    align-content: center;
    padding: var(--app-page-padding-y) var(--app-page-padding-x) 1rem;
    height: 100%;
    color: var(--p-text-color);
    transition: all 0.5s;
}

.users-mobile-layout {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.users-mobile-toolbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
}

.users-mobile-subtitle {
    margin: 0.35rem 0 0;
    color: var(--p-text-muted-color, var(--p-grey-2));
    font-size: 0.92rem;
}

.users-mobile-toolbar-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
}

.users-mobile-filters {
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

.users-mobile-filter-actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.75rem;
    align-items: center;
}

.users-mobile-summary {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    font-size: 0.92rem;
    color: var(--p-text-muted-color, var(--p-grey-2));
}

.users-card-list {
    display: grid;
    gap: 0.85rem;
}

.users-card {
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

.users-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.75rem;
}

.users-card-title {
    display: flex;
    flex-direction: column;
    gap: 0.28rem;
    min-width: 0;
}

.users-card-title strong {
    font-size: 1rem;
    color: var(--p-text-color);
    word-break: break-word;
}

.users-card-title span {
    color: var(--p-text-muted-color, var(--p-grey-2));
    word-break: break-word;
}

.users-card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.users-card-meta-item {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.38rem 0.7rem;
    border-radius: 999px;
    background: rgba(var(--p-blue-500-rgb), 0.08);
    font-size: 0.82rem;
}

.users-card-role-block {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.users-card-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--p-text-muted-color, var(--p-grey-2));
}

.users-card-extra-roles {
    font-size: 0.82rem;
    color: var(--p-text-muted-color, var(--p-grey-2));
}

.users-card-actions {
    display: flex;
    gap: 0.65rem;
    flex-wrap: wrap;
}

.users-card-actions :deep(.p-button) {
    flex: 1;
}

.users-empty-state {
    padding: 2rem 1rem;
    text-align: center;
    border-radius: 18px;
    border: 1px dashed rgba(var(--p-blue-500-rgb), 0.18);
    color: var(--p-text-muted-color, var(--p-grey-2));
}

.users-mobile-paginator {
    padding-bottom: var(--app-mobile-bottom-offset);
}

.users-table-header {
    gap: 0.75rem;
}

.users-table-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
}
.special-users-panel {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 300px;
}
.search {
    border-radius: 12px;
    font-size: 18px;
    transition: all 0.5s;
}
.text-nowrap {
    white-space: nowrap;
}
.roles-container {
    display: flex;
    flex-direction: column;
}
.role-list-item {
    margin-bottom: 8px; /* Отступ между элементами */
}

.role-label {
    font-size: 1rem;
    font-weight: 500;
}
.roleType {
    background-color: var(--p-blue-500);
    border-radius: 50%;
    font-size: 20px;
    color: white;
    width: 30px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
}
.custom-role-type {
    background-color: var(--p-purple-500);
}

.content-fade-enter-active,
.content-fade-leave-active {
    transition: opacity 0.22s ease;
}

.content-fade-enter-from,
.content-fade-leave-to {
    opacity: .25;
}

.users-skeleton {
    border-radius: 12px;
    border: 2px solid var(--p-grey-4);
    background-color: var(--p-bg-color-2);
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    min-height: 100%;
}

.users-skeleton-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.users-skeleton-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.users-skeleton-table {
    display: grid;
    grid-template-columns: 70px 1fr 1fr 1fr 1.1fr;
    gap: 10px;
}

.users-skeleton-col {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.users-skeleton-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    min-height: 0;
}

.users-skeleton-row {
    display: grid;
    grid-template-columns: 70px 1fr 1fr 1fr 1.1fr;
    gap: 10px;
    align-items: center;
}

.users-skeleton-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

@media (max-width: 980px) {
    .users-skeleton-header,
    .users-skeleton-footer {
        flex-direction: column;
        align-items: flex-start;
    }

    .users-skeleton-actions {
        width: 100%;
        flex-wrap: wrap;
    }

    .users-skeleton-table,
    .users-skeleton-row {
        grid-template-columns: 56px 1fr 1fr;
    }

    .users-skeleton-table .users-skeleton-col:nth-child(n + 4),
    .users-skeleton-row :nth-child(n + 4) {
        display: none;
    }
}

@media (max-width: 768px) {
    .content-wrapper {
        padding-bottom: 1rem;
    }

    .users-mobile-toolbar,
    .users-card-header,
    .users-mobile-summary {
        flex-direction: column;
        align-items: flex-start;
    }

    .users-mobile-toolbar-actions {
        width: 100%;
        flex-wrap: wrap;
    }

    .users-mobile-toolbar-actions :deep(.p-button),
    .users-mobile-toolbar-actions :deep(.create-button) {
        flex: 1 1 calc(50% - 0.25rem);
    }

    .users-mobile-filter-actions {
        grid-template-columns: 1fr;
    }
}

</style>
