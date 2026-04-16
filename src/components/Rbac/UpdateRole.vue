<template>
    <div class="d-flex justify-content-center">
        <Button v-tooltip.left="{ value: 'Изменение роли', showDelay: 300, hideDelay: 300 }" icon="pi pi-cog" class="edit-btn" @click="openDialog(id)"/>
        <Dialog v-model:visible="visible" modal header="Изменение роли" :style="{ 'max-width': '30rem' }">
            <div class="row row-cols-1 mt-1 mb-3">
                <div class="col">
                    <label class="ms-2" for="currentRole">Название</label>
                    <InputText id="currentRole" name="currentRole" v-model="currentRole.title" class="form-input" placeholder="Введите название..." />
                </div>
                <div class="col">
                    <label class="ms-2">Описание</label>
                    <Textarea v-model="currentRole.description" rows="5" class="w-100" placeholder="Введите описание..." />
                </div>
                <div class="col">
                    <label class="ms-2">Приоритет</label>
                    <Select v-model="currentRole.priority" :options="priorities" optionValue="value" optionLabel="label" class="form-input" />
                </div>
            </div>

            <Divider class="my-3 py-1"/>

            <div class="text-center">
                <Button label="Сохранить" class="save-btn w-100 mb-3" @click="updateRole"/>
            </div>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axiosInstance from '@/utils/axios.js';
import { useToast } from 'primevue/usetoast';

const visible = ref(false);
const currentRole = ref({
    id: null,
    title: '',
    description: '',
    priority: 1
});

const priorities = ref([]);

const roleId = ref(null);
const toast = useToast();

const props = defineProps({
    id: Number,
    refreshRoles: Function,
    roles: Object
})

const openDialog = (id) => {
    if (id === null) return;

    roleId.value = id;
    const role = props.roles.find(r => r.id === id);
    if (role) {
        currentRole.value = { ...role };
        visible.value = true;
    }
    console.debug(role);
};

const fetchPriorities = async () => {
    try {
        const response = await axiosInstance.get('/api/rbac/roles/priorities');
        priorities.value = response.data.map(value => ({ label: value, value }));
    } catch (error) {
        console.debug('Ошибка при получении приоритетов: ', error);
    }
};

const updateRole = async () => {
    try {
        await axiosInstance.put(`/api/rbac/roles/${props.id}`, {
            title: currentRole.value.title,
            description: currentRole.value.description,
            priority: currentRole.value.priority
        });
        
        visible.value = false;
        await props.refreshRoles();

        toast.add({ severity: 'success', summary: 'Успешно', detail: 'Роль обновлена', life: 3000 });
    } catch (error) {
        console.debug('Ошибка при обновлении роли: ', error);
        toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Не удалось обновить роль', life: 3000 });
    }
}

onMounted(async () => {
    await fetchPriorities();
})

</script>

<style scoped>
label {
    font-size: 16px;
}
.form-input {
    width: 100%;
}
.edit-btn {
    margin-top: 10px;
    border-radius: 8px;
    position: absolute;
    top: 0px;
    right: 10px;
    width: 30px;
    height: 30px;
}
.save-btn {
    border-radius: 12px;
    transition: all 0.5s;
}
</style>