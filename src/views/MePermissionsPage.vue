<template>
    <main>
        <div class="permissions-wrapper">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h2 class="m-0">Мои полномочия</h2>
            </div>
            <PermissionsResourceList
                :resources="filteredResources"
                :loading="loading"
                grid-class="row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xxl-4 g-2"
                :skeleton-items="4"
                skeleton-title-width="48%"
                skeleton-description-width="74%"
                :skeleton-sections="5"
            />
        </div>
    </main>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import axiosInstance from '@/utils/axios.js';
import { getSessionUserId } from '@/utils/TokenService.js';
import PermissionsResourceList from '@/components/Permissions/PermissionsResourceList.vue';

const loading = ref(true);
const allPermissions = ref([]);
const rolePermissions = ref([]);
const roleIds = ref([]);

const route = useRoute();

const fetchAllPermissions = async () => {
    try {
        const response = await axiosInstance.get('/api/rbac/permissions');
        allPermissions.value = response.data; // Получаем все полномочия системы
    } catch (error) {
        console.debug('Ошибка при загрузке полномочий:', error);
    }
};

const fetchUserRoles = async () => {
    try {
        const targetUserId = route.query.id;
        const currentUserId = getSessionUserId();
        const isCurrentUser = !targetUserId || String(targetUserId) === String(currentUserId);
        const endpoint = isCurrentUser ? '/api/users/me/info' : `/api/users/${targetUserId}`;
        const response = await axiosInstance.get(endpoint);

        roleIds.value = (response.data?.roles || [])
            .map((role) => role?.id)
            .filter(Boolean);
    } catch (error) {
        roleIds.value = [];
        console.debug('Ошибка при загрузке ролей пользователя:', error);
    }
};

const fetchRolePermissions = async () => {
    try {
        if (!roleIds.value.length) {
            rolePermissions.value = [];
            updatePermissionsWithRoleStatus();
            return;
        }

        const responses = await Promise.all(
            roleIds.value.map((roleId) => axiosInstance.get(`/api/rbac/roles/${roleId}/permissions`))
        );

        rolePermissions.value = responses.flatMap(
            (response) => response.data?.resourcesWithPermissions || []
        );

        updatePermissionsWithRoleStatus();
    } catch (error) {
        console.debug('Ошибка при загрузке полномочий роли:', error);
    }
};

const updatePermissionsWithRoleStatus = () => {
    // Создаем словарь полномочий для быстрого доступа
    const rolePermissionMap = new Set();
    rolePermissions.value.forEach(resource => {
        resource.permissions.forEach(permission => {
            rolePermissionMap.add(permission.id);
        });
    });

    // Обновляем полномочия системы на основании словаря
    allPermissions.value.forEach(resource => {
        resource.permissions.forEach(permission => {
            permission.enabled = rolePermissionMap.has(permission.id);
        });
    });
};

const filteredResources = computed(() => {
    return allPermissions.value.map(resource => ({
        ...resource,
    }));
});

const fetchData = async () => {
    try {
        loading.value = true;
        
        await fetchAllPermissions();
        await fetchUserRoles();
        await fetchRolePermissions();
    } catch (error) {
        console.debug('Ошибка при загрузке данных:', error);
    } finally {
        loading.value = false;
    }
};

watch(
    () => route.query.id,
    () => {
        fetchData();
    },
    { immediate: true }
);
</script>

<style scoped>
.permissions-wrapper {
    color: var(--p-text-color);
    width: 100%;
}
h2 {
    margin-bottom: 5px;
    font-size: 28px;
    font-weight: bold;
}
</style>
