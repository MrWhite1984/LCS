<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    header="Сервисы"
    modal
    :style="{ width: '90vw', maxWidth: '900px' }"
    class="services-modal"
    @hide="emit('update:visible', false)"
  >
    <div class="services-modal-content">
      <section class="services-section">
        <div class="services-section-head">
          <h3 class="m-0">Микросервисы</h3>
        </div>

        <Transition name="content-fade" mode="out-in">
          <div key="services-content" class="services-cards">
            <InfraManagerMicroService />
            <RatingService />
            <MlAnalyticsMicroService />
            <UmuSiriusMicroService />
            <NewsMicroService v-if="canManageNews" />
          </div>
        </Transition>
      </section>
    </div>
  </Dialog>
</template>

<script setup>
import { computed } from 'vue';
import { usePermissionStore } from '@/stores/permissions.js';
import InfraManagerMicroService from '@/components/Microservice/InfraManager/InfraManagerMicroService.vue';
import RatingService from '@/components/Microservice/Rating/RatingMicroService.vue';
import MlAnalyticsMicroService from '@/components/Microservice/MlAnalytics/MlAnalyticsMicroService.vue';
import UmuSiriusMicroService from '@/components/Microservice/UmuSiriusMicroService.vue';
import NewsMicroService from '@/components/News/NewsMicroService.vue';
import { canAccessNewsManagement } from '@/api/news.js';

const props = defineProps({
  visible: Boolean,
});
const emit = defineEmits(['update:visible']);

const permissionStore = usePermissionStore();
const canManageNews = computed(() => canAccessNewsManagement(permissionStore));
</script>

<style scoped>
.services-modal :deep(.p-dialog-content) {
  padding: 1.5rem;
}

.services-modal-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  color: var(--p-text-color);
}

.services-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.services-section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.services-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

@media (max-width: 768px) {
  .services-modal-content {
    gap: 1rem;
  }

  .services-section-head {
    flex-direction: column;
  }

  .services-cards {
    grid-template-columns: 1fr;
  }
}
</style>