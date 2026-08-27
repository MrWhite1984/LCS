<template>
  <Dialog v-model:visible="visible" modal header="Редактирование статуса" :style="{ 'max-width': '28rem', width: '100%' }" class="edit-statement-dialog">
    <div class="edit-statement-form">
      <div v-if="isLoading" class="loading-state">
        <ProgressSpinner style="width: 40px; height: 40px;" />
        <span>Загрузка доступных статусов...</span>
      </div>

      <div v-else-if="loadError" class="error-state">
        <p>Не удалось загрузить доступные статусы</p>
      </div>

      <div v-else-if="statements.length === 0" class="empty-state">
        <p>Нет доступных статусов для изменения</p>
      </div>

      <div v-else class="form-field">
        <label>Статус</label>
        <Dropdown
          v-model="selectedStatementId"
          :options="statements"
          optionLabel="text"
          optionValue="stateId"
          placeholder="Выберите статус..."
          class="w-full"
          :disabled="!canEditStatement"
        >
          <template #option="{ option }">
            <div class="flex align-items-center gap-2">
              <span>{{ option.text }}</span>
            </div>
          </template>
          <template #value="{ value }">
            <div v-if="value" class="flex align-items-center gap-2">
              <span>{{ getSelectedStatement(value)?.text }}</span>
            </div>
            <span v-else>Выберите статус...</span>
          </template>
        </Dropdown>
      </div>
    </div>

    <template #footer>
      <Button label="Отмена" text severity="secondary" :disabled="isSaving" @click="handleCancel" />
      <Button label="Сохранить" :loading="isSaving" :disabled="isSaving || !canEditStatement || statements.length === 0" @click="handleSave" />
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

const statements = ref([]);
const selectedStatementId = ref(null);
const initialStatementId = ref(null);

const isLoading = ref(false);
const loadError = ref(false);
const isSaving = ref(false);

const canEditStatement = computed(() => permissionStore.hasPermission('InfraManager_Call_Statement', 'Update'));

const getSelectedStatement = (stateId) => {
  return statements.value.find(s => s.stateId === stateId) || null;
};

const openModal = async ({ id, entityStateName }) => {
  callId.value = id;
  visible.value = true;
  statements.value = [];
  selectedStatementId.value = null;
  initialStatementId.value = null;
  isLoading.value = true;
  loadError.value = false;

  try {
    const response = await axiosInstance.get(`/api/infra-manager/calls/${id}/statement`);
    statements.value = response.data;

    const current = statements.value.find(s => s.text === entityStateName);
    if (current) {
      initialStatementId.value = current.stateId;
      selectedStatementId.value = current.stateId;
    }
  } catch (error) {
    console.debug('Ошибка при загрузке доступных статусов:', error);
    loadError.value = true;
  } finally {
    isLoading.value = false;
  }
};

const handleSave = async () => {
  if (selectedStatementId.value === initialStatementId.value) {
    visible.value = false;
    return;
  }

  isSaving.value = true;
  try {
    await axiosInstance.put(
      `/api/infra-manager/calls/${callId.value}/statement`,
      JSON.stringify(selectedStatementId.value),
      { headers: { 'Content-Type': 'application/json' } }
    );

    window.dispatchEvent(new CustomEvent('toast', {
      detail: {
        severity: 'success',
        summary: 'Заявки',
        detail: 'Статус успешно обновлён',
      },
    }));

    visible.value = false;
    emit('saved');
  } catch (error) {
    console.debug('Ошибка при обновлении статуса:', error);
    window.dispatchEvent(new CustomEvent('toast', {
      detail: {
        severity: 'error',
        summary: 'Заявки',
        detail: 'Не удалось обновить статус',
      },
    }));
  } finally {
    isSaving.value = false;
  }
};

const handleCancel = () => {
  visible.value = false;
};

defineExpose({ openModal });
</script>

<style scoped>
.edit-statement-form {
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
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 0;
  color: var(--p-text-color);
}
.error-state p {
  color: var(--p-red-500);
  margin: 0;
}
.empty-state p {
  color: var(--p-text-muted-color);
  margin: 0;
}
.status-icon {
  width: 20px;
  height: 20px;
}
:deep(.edit-statement-dialog .p-dialog-header) {
  padding: 1rem 1.1rem 0.55rem;
}
</style>
