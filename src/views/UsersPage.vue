<template>
    <div class="content">
        <div class="content-wrapper">                
            <Transition name="content-fade" mode="out-in">
                <DataTable
                    key="users-table"
                    lazy
                    v-if="isFirstLoadDone"
                    :value="customers" 
                    paginator
                    scrollable
                    stripedRows
                    :rows="rowsPerPage"
                    :rowClass="rowClass"
                    @row-click="(event) => navigateToProfile(event.data.id)"
                    :totalRecords="totalRecords"
                    @page="onPage"
                    :rowsPerPageOptions="[5, 10, 15]"
                    filterDisplay="row"
                >
                <template #header>
                    <div class="d-flex justify-content-between align-items-center">
                        <h3 class="m-0 ps-4">Пользователи</h3>
                        <div class="d-flex gap-2">
                            <Button
                                icon="pi pi-sliders-h"
                                outlined
                                severity="secondary"
                                @click="toggleSpecialUsersPanel"
                            />
                            <OverlayPanel ref="specialUsersPanel">
                                <div class="special-users-panel">
                                    <Button
                                        label="Синхронизировать с InfraManager"
                                        icon="pi pi-sync"
                                        :loading="syncLoading"
                                        :disabled="syncLoading"
                                        @click="syncPasImAccounts"
                                    />
                                    <Button
                                        label="Синхронизировать с 1СЗКГУ"
                                        icon="pi pi-sync"
                                        :loading="syncLoading"
                                        :disabled="syncLoading"
                                        @click="syncPasOneCzkguAccounts"
                                    />
                                </div>
                            </OverlayPanel>
                            <MultiSelect :modelValue="selectedColumns" :options="columns" optionLabel="header" @update:modelValue="onToggle"
                                display="chip" placeholder="Выберите поля" />
                            <CreateUser v-if="hasPermission('User', 'Create')"/>
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

                <Column header="OTP" :showFilterMenu="false" :exportable="false" style="min-width: 60px;">
                    <template #body="{ data }">
                        <GetOtpButton 
                            :userId="data.id"
                            :buttonClass="'p-button-sm me-2'"
                            :showLabel="false"
                        />
                    </template>
                </Column>

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
                            @change="onFilter"
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
                            @change="onFilter" 
                        />
                    </template>
                </Column>
                </DataTable>

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
import { useRouter } from 'vue-router';
import { debounce } from 'lodash';

import CreateUser from '@/components/Users/CreateUser.vue';
import GetOtpButton from '@/components/Users/GetOtpButton.vue';
import { usePermissionStore } from '@/stores/permissions.js';

const router = useRouter();

const customers = ref([]);
const totalRecords = ref(0);
const loading = ref(true);
const isFirstLoadDone = ref(false);
const specialUsersPanel = ref(null);
const syncLoading = ref(false);

const roles = ref([]);
const userPriority = ref(null);

const permissionStore = usePermissionStore();
const hasPermission = (type, action) => permissionStore.hasPermission(type, action);

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

const onFilter = (field, value) => {
    filters.value[field] = value;
    currentPage.value = 1;
    debouncedFetchCustomers()
}

const debouncedFetchCustomers = debounce(async () => {
    await fetchCustomers()
}, 500)

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
        query: { id: userId }
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

const syncPasImAccounts = async () => {
    await runUsersSync({
        endpoint: '/api/users/other-accounts/sync-pas-im',
        successDetail: 'Синхронизация с InfraManager успешно запущена',
        errorDetail: 'Не удалось запустить синхронизацию с InfraManager',
        errorLogLabel: 'Ошибка синхронизации с InfraManager: '
    });
};

const syncPasOneCzkguAccounts = async () => {
    await runUsersSync({
        endpoint: '/api/users/other-accounts/sync-pas-oneczkgu',
        successDetail: 'Синхронизация с 1СЗКГУ успешно запущена',
        errorDetail: 'Не удалось запустить синхронизацию с 1СЗКГУ',
        errorLogLabel: 'Ошибка синхронизации с 1СЗКГУ: '
    });
};

// Классы для отображения ролей в зависимости от их типа
const getRoleTypeClass = (role) => {
    return role.type === 'Custom' ? 'custom-role-type' : 'default-role-type';
}

const onPage = async (event) => {
    currentPage.value = event.page + 1;
    rowsPerPage.value = event.rows;
    await fetchCustomers();
}

const fetchCustomers = async () => {
    try {
        loading.value = true;
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
    await fetchCustomers();
    await fetchRoles();
});

const fetchRoles = async () => {
    try {
        const response = await axiosInstance.get('/api/rbac/roles');
        const allRoles = response.data;            
        // Фильтруем роли по приоритету
        roles.value = allRoles
            .filter(role => role.priority > userPriority.value)
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
    padding: 10px 2rem;
    height: 100%;
    color: var(--p-text-color);
    transition: all 0.5s;
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

</style>
