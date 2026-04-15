<template>
    <div class="d-flex justify-content-center">
        <Button v-if="showButton" icon="pi pi-plus" @click="visible = true"/>
        <Dialog v-model:visible="visible" modal header="Создание заявки" :style="{ 'max-width': '32rem' }">
            <div class="p-4">
                <div class="row mb-4">
                    <div class="col">
                        <label class="ms-2 mb-1" for="whoami">Для кого заявка?</label>
                        <div class="input-with-button">
                            <AutoComplete 
                                id="whoami"
                                v-model="whoami"
                                :suggestions="userSuggestions"
                                class="custom-input"
                                optionValue="id"
                                @complete="searchUsers"
                                optionLabel="fullName"
                                placeholder="Выберите пользователя..."
                            />
                            <Button v-if="!whoami" rounded label="Для меня" severity="secondary" class="input-button" @click="fetchMe" />
                        </div>
                    </div>
                </div>
                <div class="row mb-4">
                    <div class="col">
                        <label for="service" class="ms-2 mb-1">Сервис</label>
                        <TreeSelect 
                            v-model="selectedService"
                            :options="serviceTree"
                            :disabled="!whoami"
                            placeholder="Выберите сервис..."
                            filter
                            class="form-input"
                        >
                            <template #value="{ value }">
                                <span>{{ formatSelectedService(value) }}</span>
                            </template>
                        </TreeSelect>
                    </div>
                </div>
                <div class="row mb-4">
                    <div class="col">
                        <label for="priority" class="ms-2 mb-1">Приоритет</label>
                        <InputText id="priority" readonly v-model="store.selectedPriority" class="form-input" placeholder="Выберите приоритет..." @click="toggle"/>
                        <Popover ref="op">
                            <PrioritySelect />
                        </Popover>
                    </div>
                </div>
                <div class="row mb-4">
                    <div class="col">
                        <label for="shortDescriprion" class="ms-2 mb-1">Аудитория</label>
                        <InputText id="shortDescriprion" v-model="shortDescriprion" class="form-input" placeholder="Введите аудиторию..."/>
                    </div>
                </div>
                <div class="row mb-4">
                    <div class="col">
                        <label for="inventoryNumber" class="ms-2 mb-1">Инвентарный номер</label>
                        <InputText
                            id="inventoryNumber"
                            v-model="inventoryNumber"
                            class="form-input"
                            placeholder="Введите инвентарный номер..."
                        />
                    </div>
                </div>
                <div class="row mb-4">
                    <div class="col">
                        <label for="description" class="ms-2 mb-1">Краткое описание</label>
                        <Textarea id="descriprion" v-model="description" class="form-input" rows="5" placeholder="Введите описание..."/>
                    </div>
                </div>
                <div class="row align-items-center justify-content-end">
                    <div class="col-auto">
                        <Button text label="Создать заявку" severity="success" @click="createCall"/>
                    </div>
                    <div class="col-auto">
                        <Button text label="Отмена" severity="danger" @click="handleCancel" />
                    </div>
                </div>
                <div class="row">
                    <div class="col">
                    </div>
                </div>
            </div>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, watch } from "vue";
import axiosInstance from "@/utils/axios.js";
import PrioritySelect from '@/components/InfraManager/PrioritySelect.vue';

import { usePriorityStore } from '@/stores/priorityStore.js';

const emit = defineEmits(['refreshRequests']);
defineProps({
    showButton: {
        type: Boolean,
        default: true
    }
});
const visible = ref(false);
const whoami = ref('');
const loading = ref(false);

const userSuggestions = ref([]);

const selectedService = ref(null);
const serviceTree = ref([]);
const shortDescriprion = ref('');
const inventoryNumber = ref('');
const description = ref('');

const store = usePriorityStore();


const fetchMe = async () => {
    loading.value = true;
    try {
        const response = await axiosInstance.get('/api/infra-manager/users/me');

        whoami.value = response.data;
    } catch (error) {
        console.debug('Ошибка при получении себя?? ', error);
    }
    loading.value = false;
}


// Загрузка пользователей
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

const fetchServices = async () => {
    try {
        if (whoami.value?.id) {
            const response = await axiosInstance.get(`/api/infra-manager/users/${whoami.value.id}/calls/services/available`);
            serviceTree.value = transformServicesToTree(response.data);
        }
    } catch (error) {
        console.debug('Ошибка при получении сервисов: ', error);
    }
}

// Преобразование дерева в объект для быстрого поиска
const serviceMap = ref({});

const transformServicesToTree = (data) => {
  const map = {};
  const tree = data.map((category) => {
    const categoryNode = {
      key: category.id,
      label: category.name,
      selectable: false,
      children: category.services.map((service) => {
        const serviceNode = {
          key: service.id,
          label: service.name,
          selectable: false,
          children: service.items.map((item) => ({
            key: item.id,
            label: item.name,
          })),
        };

        // Сохраняем путь для сервисов и их элементов
        serviceNode.children.forEach((item) => {
          map[item.key] = `${category.name} > ${service.name} > ${item.label}`;
        });
        map[serviceNode.key] = `${category.name} > ${service.name}`;
        return serviceNode;
      }),
    };

    map[categoryNode.key] = category.name;
    return categoryNode;
  });

  serviceMap.value = map;
  return tree;
};

var serviceKey = '';

const formatSelectedService = (key) => {
    if (!key || key.length === 0) return "Выберите сервис...";

    // Проверяем, если key — массив
    const firstItem = Array.isArray(key) ? key[0] : key;

    serviceKey = firstItem.key;

    // Возвращаем путь из serviceMap или значение по умолчанию
    return serviceMap.value[serviceKey] || "Выберите сервис...";
};

const createCall = async () => {
    try {
        const payload = {
            userId: whoami.value.id,
            callSummaryName: shortDescriprion.value,
            htmlDescription: description.value,
            serviceItemId: serviceKey,
            urgencyId: store.selectedUrgencyId,
            priorityId: store.selectedPriorityId,
            inventoryNumber: inventoryNumber.value || null,
            influenceId: store.selecetedInfluenceId
        };
        const response = await axiosInstance.post('/api/infra-manager/calls/register', payload);
        const createdCallId = response.data.callId;

        visible.value = false;

        emit('refreshRequests', createdCallId);

        window.dispatchEvent(new CustomEvent('toast', {
            detail: {
                severity: 'success',
                summary: 'Заявки',
                detail: 'Заявка успешно создана'
            }
        }));
    } catch (error) {
        console.debug('Ошибка при создании: ', error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: {
                severity: 'error',
                summary: 'Заявки',
                detail: 'Ошибка при создании заявки'
            }
        }));
    }
};

watch(whoami, fetchServices);

const resetForm = () => {
    whoami.value = '';
    selectedService.value = null;
    shortDescriprion.value = '';
    inventoryNumber.value = '';
    description.value = '';
    store.selectedPriority = null;
}

const handleCancel = () => {
    resetForm();
    visible.value = false;
}

const op = ref();

const toggle = (event) => {
    op.value.toggle(event);
}

const openModal = () => {
    visible.value = true;
};

defineExpose({
    openModal
});

</script>

<style scoped>
.muted {
    color: var(--p-grey-1);
}
.input-with-button {
  position: relative;
  display: inline-block;
  width: 100%;
}
.form-input {
    width: 100%;
    resize: none;
}
.custom-input {
    width: 100%;
}
.input-button {
    position: absolute;
    top: 50%;
    right: 5px;
    margin: 0;
    transform: translateY(-50%);
    padding: 4px 10px;
    cursor: pointer;
    font-size: 13px;
}
</style>
