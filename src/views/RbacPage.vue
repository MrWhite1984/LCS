<template>
    <main>
        <div class="content-wrapper">
            <div class="statistics">
                <div class="rows gap-3">
                    <div class="col" v-for="i in 4" :key="i">
                        <div class="stat-card">
                            <Transition name="content-fade" mode="out-in">
                                <div key="rbac-stat-skeleton" v-if="loading">
                                    <Skeleton width="100%" height="80px" />
                                </div>
                                <div key="rbac-stat-content" v-else>
                                    <div class="row align-items-center">
                                        <div class="col-auto pe-0">
                                            <i :class="statisticsIcons[i - 1]"></i>
                                        </div>
                                        <div class="col">
                                            <span class="stat-label">{{ statisticsLabels[i - 1] }}</span>
                                        </div>
                                    </div>
                                    <div class="stat-number">{{ statisticsCounts[i - 1] }}</div>
                                </div>
                            </Transition>
                        </div>
                    </div>
                </div>
            </div>
            <div class="searchField mt-4">
                <div class="row align-items-center justify-content-between">
                    <div class="col">
                        <IconField class="searchBar">
                            <InputIcon class="pi pi-search" />
                            <InputText id="search" name="search" placeholder="Поиск..." class="search" v-model="searchQuery3" />
                        </IconField>
                    </div>
                    <div class="col-auto">
                        <CreateRole :refreshRoles="fetchRoles" v-if="hasPermission('Rbac', 'Create')"/>
                    </div>
                </div>
            </div>
            <Divider class="my-4"/>
            <div class="roles-cards">
                <div class="row g-3">
                    <div class="col" v-for="role in filteredRoles" :key="role.id">
                        <div class="card">
                            <div class="card-body d-flex flex-column">
                                <Transition name="content-fade" mode="out-in">
                                    <Skeleton key="rbac-card-skeleton" v-if="loading" width="100%" height="200px"/>
                                    <div key="rbac-card-content" v-else>
                                        <UpdateRole 
                                            :id="role.id" 
                                            :refreshRoles="fetchRoles" 
                                            :roles="roles" 
                                            v-if="role.id !== userRole.id && role.id !== 1 && hasPermission('Rbac', 'Update')" 
                                        />
                                        <h5 class="card-title">{{ role.title }}</h5>
                                        <p class="card-text" v-tooltip="{ value: `${role.description}`, showDelay: 1000, hideDelay: 300 }">{{ role.description }}</p>
                                        <p class="card-text"><span class="muted">Приоритет: {{ role.priority }}</span></p>
                                        <div class="mt-auto row row-cols-2 justify-content-between align-items-center">
                                            <div class="col-auto">
                                                <UserCount 
                                                    :roleId="role.id" 
                                                    :userCount="role.userCount" 
                                                    :roleType="role.type" 
                                                    :roleTitle="role.title"
                                                />
                                            </div>
                                            <div class="col-auto">
                                                <div class="card-text m-0" v-if="role.id === userRole.id">Это вы</div>
                                                <div v-else class="role-actions-inline">
                                                    <Button 
                                                        v-if="role.type === 'Custom' && hasPermission('Rbac', 'Delete')"
                                                        label="Удалить" 
                                                        class="delete-btn"
                                                        severity="danger" 
                                                        @click="confirm1(role)" 
                                                    />
                                                    <router-link to="/role-permissions" class="perm-link-grow" v-if="hasPermission('Rbac', 'Update')">
                                                        <Button label="Полномочия" class="perm-btn" @click.prevent="navigateToPermissions(role)"/>
                                                    </router-link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Transition>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

import qs from 'qs';
import axiosInstance from '@/utils/axios.js';
import UpdateRole from '@/components/Rbac/UpdateRole.vue';
import CreateRole from '@/components/Rbac/CreateRole.vue';
import UserCount from '@/components/Rbac/UserCount.vue';

import { useRoleStore } from '@/stores/roleStore';
import { usePermissionStore } from '@/stores/permissions.js';

import { useConfirm } from "primevue/useconfirm";

const statisticsLabels = [
    'Всего ролей',
    'Пользовательские роли',
    'Системные роли',
    'Пользователи без роли',
];

const statisticsCounts = computed(() => [
    roles.value.length,
    customRolesCount.value,
    systemRolesCount.value,
    noRoleUsersCount.value,
]);

const statisticsIcons = [
    'bi bi-people-fill',
    'bi bi-person-fill',
    'bi bi-person-fill-gear',
    'bi bi-person',
];

const loading = ref(true);
const roles = ref([]);
const users = ref([]);
const searchQuery3 = ref('');
const userRole = ref({id: null, title: '', type: '' });

const filteredRoles = computed(() => {
    return roles.value.filter(role => role.title.toLowerCase().startsWith(searchQuery3.value.toLowerCase()));
});

const permissionStore = usePermissionStore();

const hasPermission = (type, action) => permissionStore.hasPermission(type, action);

const toast = useToast();

const fetchRoles = async () => {
    try {
        const response = await axiosInstance.get('/api/rbac/roles');
            
        roles.value = response.data.map(role => ({
            ...role,
            userCount: countUsersWithRole(role.id)
        }));
    } catch (error) {
        console.debug('Ошибка при получении ролей: ', error);
    }

    loading.value = false;
};

const fetchUsers = async () => {
    let page = 1;
    let pageSize = 500;
    try {
        const payload = {
            page: page,
            pageSize: pageSize,
        };
        const response = await axiosInstance.post('/api/users/list', payload);

        const userResponse = await axiosInstance.get('/api/users/me/info');
        userRole.value = userResponse.data.roles[0] || {};
        
        users.value = response.data.entities;
    } catch (error) {
        console.debug('Ошибка при получении пользователей: ', error);
    }
};

const countUsersWithRole = (roleId) => {
    return users.value.filter(user => user.roles.some(role => role.id === roleId)).length;
}

const customRolesCount = computed(() => {
    return roles.value.filter(role => role.type === 'Custom').length;
});

const systemRolesCount = computed(() => {
    return roles.value.filter(role => role.type !== 'Custom').length;
});

const noRoleUsersCount = computed(() => {
    return users.value.filter(user => user.roles.length === 0).length;
});

const deleteRole = async (role) => {
    if (role.type === 'Custom') {
        try {
            await axiosInstance.delete(`/api/rbac/roles/${role.id}`);
            roles.value = roles.value.filter(r => r.id !== role.id);
        } catch (error) {
            toast.add({ severity: 'info', summary: 'Роли', detail: 'Можно удалять только пользовательские роли', life: 3000 });
        }
    }
}

const confirm = useConfirm();
const router = useRouter();

const confirm1 = (role) => {
    confirm.require({
        message: 'Вы действительно хотите удалить роль?',
        header: 'Удаление роли',
        icon: 'pi pi-info-circle',
        rejectProps: {
            label: 'Отмена',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label:'Удалить',
            severity: 'danger'
        },
        accept: () => {
            deleteRole(role);
            toast.add({ severity: 'success', summary: 'Успешно', detail: 'Вы удалили роль', life: 3000 });
        }, 
        reject: () => {
            toast.add({ severity: 'info', summary: 'Отклонено', detail: 'Отмена действия', life: 3000 });
        }
    });
};

onMounted(async () => {
    await fetchUsers();
    await fetchRoles();
});

const roleStore = useRoleStore();

const setRoleInfo = role => {
    roleStore.setRoleInfo({
        roleId: role.id,
        roleTitle: role.title,
        roleDescription: role.description,
        roleType: role.type
    });
};
const navigateToPermissions = (role) => {
    setRoleInfo(role);
    router.push({
        path: '/role-permissions',
        query: {
            'id': String(role.id),
        },
    });
};
</script>

<style scoped>
p {
    margin-block: 20px;
}
.roles-cards {
    width: 100%;
}
.roles-cards .row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(clamp(240px, 45vw, 320px), 1fr));
    gap: 1rem;
}
.role-action-buttons {
    align-items: stretch;
}
.role-action-primary {
    flex: 1.75;
}
.role-action-secondary {
    flex: 1;
}
.statistics .rows {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(clamp(200px, 45vw, 300px), 1fr));
    gap: 1rem;
}
.card {
    border: none;
    border-radius: 12px;
    transition: all 0.5s;
    background-color: var(--p-grey-7);
    color: var(--p-text-color);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
}
.card:hover {
    filter: drop-shadow(0 0 0.5rem rgba(0, 0, 0, 0.2));
}
.card-body {
    padding: 14px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}
.card-title {
    font-size: 1.15rem;
    margin-bottom: 8px;
    font-family: 'SF Pro Rounded', sans-serif;
    color: var(--p-text-color);
}
.card-text {
    font-size: 1rem;
    font-family: 'SF Pro Rounded', sans-serif;
    color: var(--p-grey-1);
    margin-bottom: 5px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    max-width: 400px;
}
p {
    margin: 0;
}
.edit-btn, .perm-btn {
    width: 100%;
    border-radius: 12px;
    padding: 5px;
    font-size: 0.9rem;
}
.delete-btn {
    width: auto;
    min-width: 86px;
    border-radius: 10px;
    padding: 4px 10px;
    font-size: 0.82rem;
}
.delete-btn:hover {
    color: white !important;
}
.role-actions-inline {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
}
.perm-link-grow {
    flex: 1 1 auto;
    min-width: 0;
}
.muted {
    color: var(--p-grey-2);
    font-size: 0.8rem;
}
main {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
}
.content-wrapper {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: 20px 6rem;
    overflow: hidden;
    color: var(--p-text-color);
}
.pi {
    font-size: 20pt;
}
.pi-search {
    font-size: 1rem;
}
.search {
    border-radius: 12px;
    transition: all 0.5s;
    width: 100%; 
}
.statistics-title {
    font-size: 1.5rem;
    margin-bottom: 20px;
    color: var(--p-text-color);
    text-align: center;
}
.stat-card {
    background-color: var(--p-grey-7);
    padding: 15px;
    border-radius: 12px;
    color: var(--p-text-color);
    transition: all 0.5s;
}
.stat-card:hover {
    filter: drop-shadow(0 0 0.75rem rgba(0, 0, 0, 0.3));
}
.stat-number {
    font-size: 2rem;
    font-weight: bold;
}
.stat-label {
    font-size: 1.1rem;
    opacity: 0.8;
}
.bi {
    font-size: larger;
} 

@media (max-width: 640px) {
    .roles-cards .row {
        grid-template-columns: 1fr;
    }

    .statistics .row {
        grid-template-columns: 1fr;
    }
}

</style>
