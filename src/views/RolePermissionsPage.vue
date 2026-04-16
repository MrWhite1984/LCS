<template>
    <main>
        <div class="permissions-wrapper">
            <div class="d-flex justify-content-between align-items-center">
                <h2 class="m-0">Полномочия роли</h2>
                <Button class="back-btn m-0" icon="pi pi-arrow-left" label="Назад" @click="goBack" text />
            </div>
            <div class="searchField my-3">
                <div class="row align-items-center">
                    <div class="col">
                        <IconField class="searchBar">
                            <InputIcon class="pi pi-search" />
                            <InputText id="search" name="search" placeholder="Поиск..." class="search" v-model="searchQuery1" />
                        </IconField>
                    </div>
                    <div class="col-auto">
                        <div class="card h-100">
                            <div class="card-body">
                <Chip class="role-label">
                                    <span class="roleType" :class="getRoleTypeClass()">
                                        {{ (roleStore.roleType || '?').charAt(0) }}
                                    </span>
                                    <span>{{ roleStore.roleTitle }}</span>
                                </Chip>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Divider />
            <PermissionsResourceList
                :resources="filteredResources"
                :loading="loading"
                :can-toggle="true"
                @toggle-permission="handleTogglePermission"
            />
        </div>
    </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRoleStore } from '@/stores/roleStore';
import axiosInstance from '@/utils/axios.js';
import PermissionsResourceList from '@/components/Permissions/PermissionsResourceList.vue';

const searchQuery1 = ref('');
const loading = ref(true);
const roleStore = useRoleStore();
const router = useRouter();
const route = useRoute();
const allPermissions = ref([]);
const rolePermissions = ref([]);

const resolveRoleContext = async () => {
    const rawRoleId = route.query['id'];
    const queryRoleId = Number(rawRoleId);

    if (Number.isFinite(queryRoleId) && queryRoleId > 0) {
        if (Number(roleStore.roleId) === queryRoleId) {
            return true;
        }
        try {
            const response = await axiosInstance.get('/api/rbac/roles');
            const role = response.data.find((item) => Number(item.id) === queryRoleId);
            if (!role) return false;

            roleStore.setRoleInfo({
                roleId: role.id,
                roleTitle: role.title,
                roleDescription: role.description,
                roleType: role.type,
            });
            return true;
        } catch (error) {
            console.debug('Ошибка при загрузке роли из query:', error);
            return false;
        }
    }

    return Number.isFinite(Number(roleStore.roleId)) && Number(roleStore.roleId) > 0;
};

const fetchAllPermissions = async () => {
    try {
        const response = await axiosInstance.get('/api/rbac/permissions');
        allPermissions.value = response.data; // Получаем все полномочия системы
    } catch (error) {
        console.debug('Ошибка при загрузке полномочий:', error);
    }
};

const fetchRolePermissions = async () => {
    const roleId = Number(roleStore.roleId);
    if (!Number.isFinite(roleId) || roleId <= 0) return;

    try {
        const response = await axiosInstance.get(`/api/rbac/roles/${roleId}/permissions`);
        rolePermissions.value = response.data.resourcesWithPermissions; // Получаем полномочия роли
        updatePermissionsWithRoleStatus();
    } catch (error) {
        console.debug('Ошибка при загрузке полномочий роли:', error);
    }
};

const updatePermissionsWithRoleStatus = () => {
    // Создаем словарь полномочий для быстрого доступа
    const rolePermissionMap = new Map();
    rolePermissions.value.forEach(resource => {
        resource.permissions.forEach(permission => {
            rolePermissionMap.set(permission.id, true);
        });
    });

    // Обновляем полномочия системы на основании словаря
    allPermissions.value.forEach(resource => {
        resource.permissions.forEach(permission => {
            permission.enabled = rolePermissionMap.has(permission.id);
        });
    });
};

const goBack = () => {
    router.back();
};

const togglePermission = async (roleId, permissionId, isActive) => {
    try {
        const endpoint = `/api/rbac/roles/${roleId}/permissions/${permissionId}`;
        if (isActive) {
            await axiosInstance.patch(endpoint); // Обновляем статус полномочия
            window.dispatchEvent(new CustomEvent('toast', {
                detail: { 
                    severity: 'success', 
                    summary: 'Роли', 
                    detail: 'Вы добавили полномочие для роли',
                    userName: `${ roleStore.roleTitle }`
                }
            }));
        } else {
            await axiosInstance.delete(endpoint); // Удаляем полномочие
            window.dispatchEvent(new CustomEvent('toast', {
                detail: { 
                    severity: 'success', 
                    summary: 'Роли', 
                    detail: 'Вы удалили полномочие для роли',
                    userName: `${ roleStore.roleTitle }` 
                }
            }));
        }
        updatePermissionStatus(permissionId, isActive);
    } catch (error) {
        console.debug('Ошибка при переключении полномочий: ', error);
    }
};

const handleTogglePermission = ({ permissionId, isActive }) => {
    togglePermission(roleStore.roleId, permissionId, isActive);
};

const updatePermissionStatus = (permissionId, isActive) => {
    allPermissions.value.forEach(resource => {
        const permission = resource.permissions.find(p => p.id === permissionId);
        if (permission) {
            permission.enabled = isActive; // Обновляем состояние полномочия в локальном массиве
        }
    });
};

const filteredResources = computed(() => {
    const customizableResources = allPermissions.value.map(resource => ({
        ...resource,
    }));

    if (!searchQuery1.value) {
        return customizableResources; // Если нет запроса, возвращаем отфильтрованные ресурсы
    }

    // Фильтрация полномочий по названию или описанию
    return customizableResources.map(resource => ({
        ...resource,
        permissions: resource.permissions.filter(permission =>
            permission.title.toLowerCase().includes(searchQuery1.value.toLowerCase()) ||
            permission.description.toLowerCase().includes(searchQuery1.value.toLowerCase())
        )
    })).filter(resource => resource.permissions.length > 0); // Возвращаем только те ресурсы, которые содержат полномочия после фильтрации
});

// Классы для отображения ролей в зависимости от их типа
const getRoleTypeClass = () => {
    return roleStore.roleType === 'Custom' ? 'custom-role-type' : 'default-role-type';
}

onMounted(async () => {
    loading.value = true;
    const hasRoleContext = await resolveRoleContext();
    if (!hasRoleContext) {
        loading.value = false;
        router.replace('/rbac');
        return;
    }
    await fetchAllPermissions();
    await fetchRolePermissions();
    loading.value = false;
});
</script>

<style scoped>
.p-chip {
    background: transparent;
}
.permissions-wrapper {
    position: relative;
    padding: 10px 2rem;
    color: var(--p-text-color);
}
.search {
    border-radius: 12px;
    transition: all 0.5s;
    width: 100%; 
}
.back-btn {
    border-radius: 12px;
    font-size: 1.25rem;
}
.card {
    border-radius: 12px;
    background-color: var(--p-grey-7);
    color: var(--p-text-color);
    display: flex;
    border: none;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    transition: all 0.5s;
}
.card-body {
    padding: 5px;
}
.card-title {
    font-size: 1.5rem;
    margin-bottom: 10px;
    font-family: 'SF Pro Rounded';
    color: var(--p-text-color);
}
.card-text {
    font-size: 1rem;
    font-family: 'SF Pro Rounded', sans-serif;
    color: var(--p-grey-1);
    margin: 0;
}
.resourse-type {
    color: var(--p-grey-1);
    font-size: 1.5rem;
}
.resource-description {
    color: var(--p-grey-1);
}
.role-label {
    font-size: 1rem;
}
.roleType {
    background-color: var(--p-blue-500);
    border-radius: 50%;
    font-size: 20px;
    color: white;
    width: 28px;
    height: 28px;
    display: flex;
    justify-content: center;
    align-items: center;
}
.custom-role-type {
    background-color: var(--p-purple-500);
}
</style>
