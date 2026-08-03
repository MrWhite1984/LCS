<template>
    <p class="card-text my-0" @click="showUsersWithRole">
        <span style="cursor: pointer;" class="d-flex align-items-center counter">
            <span class="count me-2">
                {{ userCount || 0 }}
            </span>
            <i class="pi pi-user"></i>
        </span>
    </p>
    <div class="d-flex justify-content-center">
        <Dialog header="Пользователи с ролью" v-model:visible="visible" @hide="visible = false" modal style="width: 50vw">
            <template v-if="selectedRoleUsers.length > 0">
                <div class="user" v-for="user in selectedRoleUsers" :key="user.id">
                    {{ user.lastName }} {{ user.firstName }} ({{ user.email }})
                    <span>
                        <Chip class="ms-3">
                            <span :class="['roleType', roleType === 'Custom' ? 'custom-role-type' : '']">
                                {{ roleType.charAt(0) }}
                            </span>
                            <span class="role-label">
                                {{ roleTitle }}
                            </span>
                        </Chip>
                    </span>
                </div>
            </template>
            <template v-else>
                <p>Пользователей с этой ролью нет.</p>
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axiosInstance from '@/utils/axios.js';

const props = defineProps({
    roleId: {
        type: String,
        required: true
    },
    userCount: {
        type: Number,
        default: 0
    },
    roleType: {
        type: String,
        default: ''
    },
    roleTitle: {
        type: String,
        default: ''
    },
});

const visible = ref(false);
const users = ref([]);
const selectedRoleUsers = ref([]);

const fetchUsers = async () => {
    try {
        const payload = {
            page: 1,
            pageSize: 500,
            isBlocked: false
        };
        
        const response = await axiosInstance.post('/api/users/list', payload);

        users.value = response.data.entities;
    } catch (error) {
        console.debug('Ошибка при получении пользователей: ', error);
    }
};

const showUsersWithRole = () => {
    selectedRoleUsers.value = users.value.filter(user => user.roles.some(role => role.id === props.roleId));
    visible.value = true;
}

onMounted(async () => {
    await fetchUsers();
});
</script>

<style scoped>
.pi {
    font-size: 1rem;
}
.counter {
    color: var(--p-grey-1);
    transition: color 0.5s ease;
}
.counter:hover {
    color: var(--p-text-color);
}
.count {
    font-size: 1.2rem;
}
.card-text {
    font-family: 'SF Pro Rounded', sans-serif;
    color: var(--p-grey-1);
    margin-top: 5px;
}
.user {
    background-color: var(--p-grey-7);
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 10px;
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
.role-label {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-weight: 500;
}
</style>
