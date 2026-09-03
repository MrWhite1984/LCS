<template>
  <Dialog v-model:visible="visible" modal header="Редактирование ответственных" :style="{ 'max-width': '32rem', width: '100%' }" class="edit-participants-dialog">
    <div class="edit-participants-form">
      <div v-if="canEditOwner" class="form-field">
        <label>Владелец</label>
        <AutoComplete
          v-model="owner"
          :suggestions="ownerSuggestions"
          @complete="searchUsers($event, 'owner')"
          @item-select="handleOwnerChange"
          @clear="owner = null"
          field="fullName"
          optionLabel="fullName"
          placeholder="Выберите владельца..."
          class="w-full"
        />
      </div>

      <div v-if="canEditExecutor" class="form-field">
        <label>Исполнитель</label>
        <AutoComplete
          v-model="executor"
          :suggestions="executorSuggestions"
          @complete="searchUsers($event, 'executor')"
          @item-select="handleExecutorChange"
          @clear="executor = null"
          field="fullName"
          optionLabel="fullName"
          placeholder="Выберите исполнителя..."
          class="w-full"
        />
      </div>

      <div v-if="canEditAccomplisher" class="form-field">
        <label>Выполнивший</label>
        <AutoComplete
          v-model="accomplisher"
          :suggestions="accomplisherSuggestions"
          @complete="searchUsers($event, 'accomplisher')"
          @item-select="handleAccomplisherChange"
          @clear="accomplisher = null"
          field="fullName"
          optionLabel="fullName"
          placeholder="Выберите выполнившего..."
          class="w-full"
        />
      </div>
    </div>

    <template #footer>
      <Button label="Закрыть" text severity="secondary" @click="handleClose" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import axiosInstance from '@/utils/axios.js';
import { usePermissionStore } from '@/stores/permissions.js';

const emit = defineEmits(['saved']);

const permissionStore = usePermissionStore();

const visible = ref(false);
const callId = ref(null);

const owner = ref(null);
const executor = ref(null);
const accomplisher = ref(null);

const ownerSuggestions = ref([]);
const executorSuggestions = ref([]);
const accomplisherSuggestions = ref([]);

const initialOwner = ref(null);
const initialExecutor = ref(null);
const initialAccomplisher = ref(null);

const canEditOwner = computed(() => permissionStore.hasPermission('InfraManager_Owner', 'Update'));
const canEditExecutor = computed(() => permissionStore.hasPermission('InfraManager_Executor', 'Update'));
const canEditAccomplisher = computed(() => permissionStore.hasPermission('InfraManager_Accomplisher', 'Update'));

const fetchUserFullName = async (userId) => {
  if (!userId) return null;
  try {
    const response = await axiosInstance.get(`/api/infra-manager/users/${userId}`);
    return response?.data || null;
  } catch (error) {
    console.debug(`Не удалось загрузить пользователя ${userId}:`, error);
    return null;
  }
};

const searchUsers = async (event, field) => {
  try {
    const response = await axiosInstance.get('/api/infra-manager/users', {
      params: { patternSearch: event.query }
    });
    const suggestions = response.data;
    if (field === 'owner') ownerSuggestions.value = suggestions;
    else if (field === 'executor') executorSuggestions.value = suggestions;
    else if (field === 'accomplisher') accomplisherSuggestions.value = suggestions;
  } catch (error) {
    console.debug('Ошибка при поиске пользователей:', error);
  }
};

const openModal = async ({ id, ownerId, executorId, accomplisherId }) => {
  callId.value = id;
  visible.value = true;

  owner.value = null;
  executor.value = null;
  accomplisher.value = null;

  const [ownerData, executorData, accomplisherData] = await Promise.all([
    fetchUserFullName(ownerId),
    fetchUserFullName(executorId),
    fetchUserFullName(accomplisherId),
  ]);

  owner.value = ownerData;
  executor.value = executorData;
  accomplisher.value = accomplisherData;

  initialOwner.value = ownerData;
  initialExecutor.value = executorData;
  initialAccomplisher.value = accomplisherData;
};

const updateParticipant = async ({ endpoint, newValue, initialValue, revertFn, label }) => {
  if (newValue?.id === initialValue.value?.id) return;

  try {
    await axiosInstance.put(`/api/infra-manager/calls/${callId.value}/${endpoint}`, {
      id: newValue.id,
      fullName: newValue.fullName,
    });
    initialValue.value = newValue;
    emit('saved');
  } catch (error) {
    console.debug(`Ошибка при обновлении ${label}:`, error);
    revertFn();
    window.dispatchEvent(new CustomEvent('toast', {
      detail: {
        severity: 'error',
        summary: 'Заявки',
        detail: `Не удалось обновить ${label}`,
      },
    }));
  }
};

const handleOwnerChange = (event) => {
  updateParticipant({
    endpoint: 'owner',
    newValue: event.value,
    initialValue: initialOwner,
    revertFn: () => { owner.value = initialOwner.value; },
    label: 'владельца',
  });
};

const handleExecutorChange = (event) => {
  updateParticipant({
    endpoint: 'executor',
    newValue: event.value,
    initialValue: initialExecutor,
    revertFn: () => { executor.value = initialExecutor.value; },
    label: 'исполнителя',
  });
};

const handleAccomplisherChange = (event) => {
  updateParticipant({
    endpoint: 'accomplisher',
    newValue: event.value,
    initialValue: initialAccomplisher,
    revertFn: () => { accomplisher.value = initialAccomplisher.value; },
    label: 'выполнившего',
  });
};

const handleClose = () => {
  visible.value = false;
};

defineExpose({ openModal });
</script>

<style scoped>
.edit-participants-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0;
}
.form-field label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.9rem;
  font-weight: 600;
}
.w-full {
  width: 100%;
}
:deep(.edit-participants-dialog .p-dialog-content) {
  overflow: visible;
}
:deep(.edit-participants-dialog .p-dialog-header) {
  padding: 1rem 1.1rem 0.55rem;
}
</style>
