<template>
  <Dialog v-model:visible="visible" modal header="Редактирование основной информации" :style="{ 'max-width': '32rem', width: '100%' }" class="edit-basic-info-dialog">
    <div class="edit-basic-info-form">
      <div v-if="canEditSolution" class="form-field">
        <label>Решение</label>
        <Textarea v-model="solution" class="w-full" rows="5" placeholder="Введите решение..." />
      </div>
    </div>

    <template #footer>
      <Button label="Отмена" text severity="secondary" :disabled="isSaving" @click="handleCancel" />
      <Button label="Сохранить" :loading="isSaving" :disabled="isSaving" @click="handleSave" />
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

const solution = ref(null);
const initialSolution = ref(null);

const isSaving = ref(false);

const canEditSolution = computed(() => permissionStore.hasPermission('InfraManager_Solution', 'Update'));

const openModal = ({ id, solution: currentSolution }) => {
  callId.value = id;
  solution.value = currentSolution || '';
  initialSolution.value = currentSolution || '';
  visible.value = true;
};

const handleSave = async () => {
  isSaving.value = true;
  try {
    const promises = [];

    if (canEditSolution.value && solution.value !== initialSolution.value) {
      promises.push(
        axiosInstance.put(`/api/infra-manager/calls/${callId.value}/solution`, JSON.stringify(solution.value), {
          headers: { 'Content-Type': 'application/json' },
        })
      );
    }

    if (promises.length === 0) {
      visible.value = false;
      return;
    }

    await Promise.all(promises);

    window.dispatchEvent(new CustomEvent('toast', {
      detail: {
        severity: 'success',
        summary: 'Заявки',
        detail: 'Основная информация успешно обновлена',
      },
    }));

    visible.value = false;
    emit('saved');
  } catch (error) {
    console.debug('Ошибка при обновлении основной информации:', error);
    window.dispatchEvent(new CustomEvent('toast', {
      detail: {
        severity: 'error',
        summary: 'Заявки',
        detail: 'Не удалось обновить основную информацию',
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
.edit-basic-info-form {
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
:deep(.edit-basic-info-dialog .p-dialog-header) {
  padding: 1rem 1.1rem 0.55rem;
}
</style>
