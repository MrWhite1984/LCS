<template>
    <div class="d-flex justify-content-center">
        <Button icon="pi pi-user-edit" label="Изменить" class="edit-btn" severity="contrast" rounded @click="fetchUserData"/>
        <Dialog v-model:visible="visible" modal header="Изменить информацию" :style="{ 'max-width': '30rem' }" @hide="handleDialogHide">
            <div class="row mt-4 mb-5">
                <div class="col">
                    <FloatLabel>
                        <InputText id="firstName" name="firstName" v-model="firstName" class="form-input" />
                        <label for="firstName">Имя</label>
                    </FloatLabel>
                </div>
                <div class="col">
                    <FloatLabel>
                        <InputText id="lastName" name="lastName" v-model="lastName" class="form-input" />
                        <label for="lastName">Фамилия</label>
                    </FloatLabel>
                </div>
            </div>
            <div class="row">
                <div class="col">
                    <FloatLabel>
                        <InputText id="middleName" name="middleName" v-model="middleName" class="form-input" />
                        <label for="middleName">Отчество</label>
                    </FloatLabel>
                </div>
            </div>

            <Divider class="my-5 py-1"/>

            <div class="row mb-5">
                <div class="col">
                    <FloatLabel>
                        <InputText id="email" name="email" v-model="email" class="form-input" />
                        <label for="email">E-mail</label>
                    </FloatLabel>
                </div>
            </div>
            <Button label="Сохранить" class="search w-100 mb-3" @click="updateUserData"/>

            <Divider class="mb-3 py-1"/>

            <div class="row mb-3">
                <div class="col roles-chips-col">
                    <label class="form-label mb-2">Роли</label>
                    <div class="roles-chips">
                        <button
                            v-for="role in roles"
                            :key="role.id"
                            type="button"
                            class="role-chip"
                            :class="{ 'role-chip--active': selectedRoles.includes(role.id) }"
                            @click="toggleRole(role.id)"
                        >
                            {{ role.title }}
                        </button>
                    </div>
                </div>
            </div>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axiosInstance from '@/utils/axios.js';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const emit = defineEmits(['rolesChanged']);

const rolesChangedFlag = ref(false);

const toggleRole = async (id) => {
    const idx = selectedRoles.value.indexOf(id);
    const isAdding = idx < 0;

    try {
        await axiosInstance.post(`/api/users/${ Iduser.value }/${ isAdding ? 'set-role' : 'remove-role' }/${ id }`);

        if (isAdding) {
            selectedRoles.value.push(id);
        } else {
            selectedRoles.value.splice(idx, 1);
        }
        rolesChangedFlag.value = true;
    } catch (error) {
        console.debug('Ошибка при изменении роли: ', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: isAdding ? 'Не удалось назначить роль' : 'Не удалось снять роль',
            life: 3000
        });
    }
};

const props = defineProps({
    userId: String,
    isBlocked: Boolean
});

const visible = ref(false);
const selectedRoles = ref([]);
const roles = ref([]);
const userPriority = ref(null);

const Iduser = ref('');
const firstName = ref('');
const lastName = ref('');
const middleName = ref('');
const email = ref('');

const originalEmail = ref('');


const fetchUserData = async () => {
    visible.value = true;
    Iduser.value = props.userId;
    rolesChangedFlag.value = false;
    try {
        const response = await axiosInstance.get(`/api/users/${ Iduser.value }`);
        const userData = response.data;
        
        firstName.value = userData.firstName;
        lastName.value = userData.lastName;
        middleName.value = userData.middleName;
        email.value = userData.email;
        
        selectedRoles.value = userData.roles.map(role => role.id);
        originalEmail.value = userData.email;

        userPriority.value = userData.roles[0]?.priority;
    } catch (error) {
        console.debug('Ошибка при получении данных: ', error);
    }
};

const handleDialogHide = () => {
    if (rolesChangedFlag.value) {
        rolesChangedFlag.value = false;
        emit('rolesChanged');
    }
};

const updateRolesList = async () => {
    try {
        const response = await axiosInstance.get('/api/rbac/roles');
        const allRoles = response.data;

        // Фильтруем роли по приоритету
        roles.value = allRoles.filter(role => role.priority > userPriority.value);
    } catch (error) {
        console.debug('Ошибка при получении ролей: ', error);
    }
};

const checkEmail = async () => {
    let isEmailOccupied = false;

    if (email.value !== originalEmail.value) {
        const emailResponse = await axiosInstance.get('/api/users/checking/occupy-email', {
            params: { email: email.value }
        });
        isEmailOccupied = emailResponse.data === true;
        if (isEmailOccupied) {
            toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Email уже занят', life: 3000 });
        }
    }

    return !isEmailOccupied;
}

const updateUserData = async () => {
    const isAvailable = await checkEmail();
    if (!isAvailable) return;
    
    try {
        const updatedUser = {
            firstName: firstName.value,
            lastName: lastName.value,
            middleName: middleName.value,
            email: email.value
        };

        await axiosInstance.put(`/api/users/${ Iduser.value }`, updatedUser);

        visible.value = false;
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'success', 
                summary: 'Пользователи', 
                detail: 'Вы обновили данные пользователя',
                userName: `${ firstName.value } ${ lastName.value }` 
            }
        }));

    } catch (error) {
        console.debug('Ошибка при обновлении данных пользователя: ', error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'error', 
                summary: 'Пользователи',
                detail: 'Ошибка при обновлении данных пользователя',
                userName: `${ firstName.value } ${ lastName.value }`
            }
        }));
    }
};

onMounted(async () => {
    await updateRolesList();
});

defineExpose({ fetchUserData });

</script>

<style scoped>
label {
   font-size: 16px;
}
.form-input {
    font-size: 16px;
    width: 100%;
}
.search {
    border-radius: 12px;
    font-size: 14pt;
    transition: all 0.5s;
}
.upd-btn:hover {
    background-color: var(--p-blue-500) !important;
    color: white !important;
}

.roles-chips-col { min-width: 0; }

.roles-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.role-chip {
    padding: 0.4rem 1rem;
    border-radius: 999px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--p-text-color);
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    user-select: none;
}

.role-chip:hover {
    background: rgba(var(--p-primary-500-rgb), 0.12);
}

.role-chip--active {
    background: var(--p-primary-color);
    color: var(--p-primary-contrast-color, #fff);
    border-color: var(--p-primary-color);
}
</style>