<template>
    <div class="d-flex justify-content-center">
        <Button icon="pi pi-plus" label="Создать роль" class="create-btn" @click="openDialog"/>
        <Dialog v-model:visible="visible" modal header="Создание новой роли" :style="{ 'max-width': '30rem' }">
            <div class="row row-cols-1 mt-1 mb-3">
                <div class="col mb-2">
                    <label for="newRole" class="ms-2">Название</label>
                    <InputText id="newRole" name="newRole" v-model="newRole.title" class="form-input" placeholder="Введите название..." />
                </div>
                <div class="col mb-2">
                    <label class="ms-2">Описание</label>
                    <Textarea v-model="newRole.description" rows="3" class="w-100" placeholder="Введите описание..." />
                </div>
                <div class="col">
                    <label class="ms-2">Приоритет</label>
                    <Select v-model="newRole.priority" :options="priorities" optionValue="value" optionLabel="label" class="form-input" placeholder="Выберите приоритет..." />
                </div>
            </div>

            <Divider class="my-3 py-1"/>

            <div class="text-center">
                <Button label="Создать" class="save-btn w-100 mb-2" @click="createRole" />
            </div>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axiosInstance from '@/utils/axios.js';
import { useToast } from 'primevue/usetoast';

const visible = ref(false);
const newRole = ref({
    title: '',
    description: '',
    priority: null
});

const props = defineProps({
    refreshRoles: Function
})

const toast = useToast();

const priorities = ref([]);
const userPriority = ref(0);

const openDialog = () => {
    visible.value = true;
}

const fetchPriorities = async () => {
    try {
        const response = await axiosInstance.get('/api/rbac/roles/priorities');
        priorities.value = response.data.map(value => ({ label: value, value }));
    } catch (error) {
        console.debug('Ошибка при получении приоритетов: ', error);
    }
};

const fetchUserPriority = async () => {
    try {
        const response = await axiosInstance.get('/api/users/me/info');
        userPriority.value = Math.max(...response.data.roles.map(role => role.priority));
    } catch (error) {
        console.debug('Ошибка при получении данных пользователя: ', error);
    }
};

const createRole = async () => {
    const name = newRole.value.title.trim();
    const priority = Number(newRole.value.priority);

    if (!name) {
        toast.add({ severity: 'warn', summary: 'Роли', detail: 'Введите название роли', life: 3000 });
        return;
    }
    if (!Number.isInteger(priority)) {
        toast.add({ severity: 'warn', summary: 'Роли', detail: 'Выберите приоритет роли', life: 3000 });
        return;
    }
    if (priority < userPriority.value) {
        toast.add({ severity: 'info', summary: 'Приоритет ролей', detail: 'Вы не можете создавать роль с приоритетом выше вашего.', life: 3000 });
        return;
    }
    if (priority === 0) {
        toast.add({ severity: 'info', summary: 'Приоритет ролей', detail: 'Вы не можете создавать роль с приоритетом 0.', life: 3000 });
        return;
    }

    try {
        await axiosInstance.post('/api/rbac/roles', {
            name,
            displayName: name,
            description: newRole.value.description.trim() || null,
            priority,
        });
        visible.value = false;
        newRole.value = { title: '', description: '', priority: null };
        await props.refreshRoles();

        toast.add({ severity: 'success', summary: 'Успешно', detail: 'Роль создана', life: 3000 });
    } catch (error) {
        console.debug('Ошибка при создании роли: ', error);
        toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Не удалось создать роль', life: 3000 });
    }
};

onMounted(async () => {
    await fetchPriorities();
    await fetchUserPriority();
});

</script>

<style scoped>
label {
    font-size: 16px;
}
.create-btn {
    border-radius: 12px;
    transition: all 0.5s;
}
.form-input {
    width: 100%;
}
.save-btn {
    border-radius: 12px;
    transition: all 0.5s;
}
</style>
