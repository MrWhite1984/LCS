<template>
    <div class="">
        <!-- Заявки InfraManager -->
        <div class="service-card mt-3">
            <!-- <h4><strong>Последние заявки</strong></h4>
            <Divider />

            <div class="microservice-card">
                <div v-for="call in lastCalls" :key="call.id" class="call-card" @click="openCallDetails(call.id)">
                    <h4>Заявка №{{ call.number }}</h4>
                    <p>{{ call.callSummaryName }}</p>
                    <p><strong>Описание:</strong> {{ call.description }}</p>
                    <p><strong>Решение:</strong> {{ call.solution }}</p>
                </div>
            </div> -->

            <!-- Модальное окно для подробной информации -->
            <Dialog v-model:visible="isDialogVisible" modal :style="{ 'min-width': '60rem', 'max-width': '100rem' }" @hide="closeDialog">
              <Transition name="content-fade" mode="out-in">
                <div key="infra-calls-error" v-if="errorOccurred" class="error-message">
                  <p>Произошла ошибка при загрузке данных</p>
                </div>

                <div key="infra-calls-content" v-else-if="selectedCall">
                  <h3 class="dialog-title">Заявка №{{ selectedCall.number }}</h3>
                  <Tabs value="0">
                  <TabList>
                    <Tab value="0" as="div">
                      <i class="pi pi-cog"></i>
                      <span class="ms-2">Общее</span>
                    </Tab>
                    <Tab value="1" as="div" :disabled="documents.length < 1">
                      <i class="pi pi-folder"></i>
                      <span class="ms-2">Файлы</span>
                    </Tab>
                    <Tab value="2" as="div" :disabled="negotiations.length < 1">
                      <i class="pi pi-thumbs-up"></i>
                      <span class="ms-2">Согласование</span>
                    </Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel value="0">
                      <div class="call-details">
                        <!-- Основная информация -->
                        <div class="details-section">
                            <h4><i class="pi pi-info-circle"></i> Основная информация</h4>
                            <p v-if="selectedCall.fullName"><strong>Заявка:</strong> <span v-html="selectedCall.fullName"></span></p>
                            <p v-if="selectedCall.description"><strong>Описание:</strong> <span v-html="selectedCall.description"></span></p>
                            <p v-if="selectedCall.solution"><strong>Решение:</strong> <span class="override-color" v-html="selectedCall.solution"></span></p>
                            <p v-if="selectedCall.serviceCategoryName"><strong>Категория сервиса:</strong> <span v-html="selectedCall.serviceCategoryName"></span></p>
                        </div>

                        <!-- Даты -->
                        <div class="details-section">
                            <h4><i class="pi pi-calendar"></i> Даты</h4>
                            <Timeline :value="timelineEvents" class="mb-3">
                              <template #opposite="slotProps">
                                <small>{{ formatTimestampToOmsk(slotProps.item.date) }}</small>
                              </template>
                              <template #content="slotProps">
                                <span>{{ slotProps.item.label }}</span>
                              </template>
                            </Timeline>
                            <p v-if="selectedCall.utcDatePromised"><strong>Дата обещанного выполнения:</strong> {{ formatTimestampToOmsk(selectedCall.utcDatePromised) }}</p>
                            <p v-if="selectedCall.utcDateModified"><strong>Дата последнего изменения:</strong> {{ formatTimestampToOmsk(selectedCall.utcDateModified) }}</p>
                        </div>

                        <!-- Сервис -->
                        <div class="details-section">
                            <h4><i class="pi pi-cog"></i> Сервис</h4>
                            <p v-if="selectedCall.serviceName"><strong>Сервис:</strong> <span v-html="selectedCall.serviceName"></span></p>
                            <p v-if="selectedCall.servicePlaceName"><strong>Место сервиса:</strong> <span v-html="selectedCall.servicePlaceName"></span></p>
                            <p v-if="selectedCall.serviceItemName"><strong>Элемент сервиса:</strong> <span v-html="selectedCall.serviceItemName"></span></p>
                            <p v-if="selectedCall.serviceAttendanceName"><strong>Исполнитель:</strong> <span v-html="selectedCall.serviceAttendanceName"></span></p>
                        </div>

                        <!-- Статусы и приоритет -->
                        <div class="details-section">
                            <h4><i class="pi pi-exclamation-circle"></i> Статус и приоритет</h4>
                            <p v-if="selectedCall.callType"><strong>Тип заявки:</strong> <span v-html="selectedCall.callType"></span></p>
                            <p v-if="selectedCall.entityStateName">
                              <strong>Статус:</strong> 
                              <Tag :value="selectedCall.entityStateName" :severity="getStatusSeverity(selectedCall.entityStateName)" :icon="getStatusIcon(selectedCall.entityStateName)" class="ms-3"/>
                            </p>
                            <p v-if="selectedCall.receiptTypeName"><strong>Тип приема:</strong> <span v-html="selectedCall.receiptTypeName"></span></p>
                            <p v-if="selectedCall.urgencyName"><strong>Срочность:</strong> <span v-html="selectedCall.urgencyName"></span></p>
                            <p v-if="selectedCall.influenceName"><strong>Влияние:</strong> <span v-html="selectedCall.influenceName"></span></p>
                            <p v-if="selectedCall.priorityName"><strong>Приоритет:</strong> <span v-html="selectedCall.priorityName"></span></p>
                        </div>

                        <!-- Ответственные -->
                        <div class="details-section">
                            <h4><i class="pi pi-user"></i> Ответственные</h4>
                            <p v-if="selectedCall.initiatorFullName"><strong>Инициатор:</strong> <span v-html="selectedCall.initiatorFullName"></span></p>
                            <p v-if="selectedCall.clientFullName"><strong>Клиент:</strong> <span v-html="selectedCall.clientFullName"></span></p>
                            <p v-if="selectedCall.ownerFullName"><strong>Владелец:</strong> <span v-html="selectedCall.ownerFullName"></span></p>
                            <p v-if="selectedCall.executorFullName"><strong>Исполнитель:</strong> <span v-html="selectedCall.executorFullName"></span></p>
                            <p v-if="selectedCall.accomplisherFullName"><strong>Выполнивший:</strong> <span v-html="selectedCall.accomplisherFullName"></span></p>
                        </div>
                      </div>
                    </TabPanel>

                    <TabPanel value="1">
                      <div v-if="documents.length > 0" class="documents-section">
                        <div v-for="document in documents" :key="document.id" class="document-card">
                          <div class="row align-items-center justify-content-between">
                            <div class="col-auto">
                              <h5>{{ document.name }}</h5>
                              <p>Размер: {{ formatFileSize(document.size) }}</p>
                              <p>Дата загрузки: {{ formatUTCToOmsk(document.utcDateCreated) }}</p>
                            </div>
                            <div class="col-auto">
                              <Button
                                icon="pi pi-download"
                                text
                                rounded
                                :loading="downloadingDocumentId === document.id"
                                @click="downloadDocument(document)"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <p v-else>Документы отсутствуют</p>
                    </TabPanel>

                    <TabPanel value="2">
                      <div v-if="negotiations.length > 0" class="negotiations-container">
                        <div v-for="negotiation in negotiations" :key="negotiation.id" class="negotiation-card">
                          <h5 class="negotiation-title">
                            <i class="pi pi-thumbs-up me-2"></i>Тема: {{ negotiation.theme }}
                          </h5>
                          <div class="negotiation-details">
                            <p><strong>Участник:</strong> {{ negotiation.fullName }}</p>
                            <p><strong>Статус:</strong>
                              <Tag :value="negotiation.statusString" :severity="getStatusSeverity(negotiation.statusString)" class="status-tag"/>
                            </p>
                            <p><strong>Дата начала:</strong> {{ formatUTCToOmsk(negotiation.utcDateVoteStart) }}</p>
                            <p><strong>Дата окончания:</strong> {{ formatUTCToOmsk(negotiation.utcDateVoteEnd) }}</p>
                          </div>
                          <div v-if="negotiation.userList.length" class="user-list">
                            <h6 class="user-list-title">Список пользователей:</h6>
                            <ul>
                              <div v-for="user in negotiation.userList" :key="user.userId" class="user-item">
                                <i class="pi pi-user me-2"></i>{{ user.userFullName }} - {{ user.positionName }} ({{ user.subdivisionName }})
                              </div>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <p v-else>Согласования отсутствуют</p>
                    </TabPanel>
                  </TabPanels>
                  </Tabs>
                </div>
                <div key="infra-calls-skeleton" v-else class="call-details">
                  <Skeleton width="530px" height="200px" class="mb-2"/>
                  <Skeleton width="530px" height="200px" class="mb-2"/>
                  <Skeleton width="530px" height="200px" class="mb-2"/>
                  <Skeleton width="530px" height="200px" class="mb-2"/>
                  <Skeleton width="530px" height="200px" class="mb-2"/>
                  <Skeleton width="530px" height="200px" class="mb-2"/>
                </div>
              </Transition>
            </Dialog>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import axiosInstance from '@/utils/axios.js';
import { useInfraCallDetails } from '@/components/InfraManager/composables/useInfraCallDetails.js';
import { getInfraStatusIcon, getInfraStatusSeverity } from '@/utils/infraStatus.js';
import { formatDateOmskFromUnixSeconds, formatDateOmskFromUtcString, formatFileSize } from '@/utils/date.js';

// Пропс для передачи ID пользователя
const props = defineProps({
  userId: {
    type: String,
  }
});

const lastCalls = ref([]);  // Список последних заявок
const {
  isDialogVisible,
  selectedCall,
  documents,
  errorOccurred,
  negotiations,
  timelineEvents,
  downloadingDocumentId,
  openCallDetails,
  closeDialog,
  downloadDocument,
} = useInfraCallDetails({
  axiosInstance,
  loadCallById: async (callId) => {
    const response = await axiosInstance.get(`/api/infra-manager/calls/${callId}`);
    return response.data;
  },
});

const getStatusSeverity = getInfraStatusSeverity;
const getStatusIcon = getInfraStatusIcon;
const formatTimestampToOmsk = formatDateOmskFromUnixSeconds;
const formatUTCToOmsk = formatDateOmskFromUtcString;

// Функция для получения последних заявок по ID пользователя
const fetchUserCalls = async () => {
    try {
        const callsResponse = await axiosInstance.get(`/api/infra-manager/calls`, {
          params: {
            page: 1,
            pageSize: 10,
            InitiatorIdOrClientIdOrOwnerId: props.userId,
          }
        });
        lastCalls.value = callsResponse.data.entities;
    } catch (error) {
        console.debug('Ошибка при загрузке информации о заявке: ', error);
    }

}

// Отслеживаем изменение userId и перезапрашиваем заявки
watch(() => props.userId, async (newUserId) => {
    if (newUserId) {
        await fetchUserCalls();
    }
}, { immediate: true })

defineExpose({ openCallDetails });
</script>

<style scoped>
.dialog-title {
  text-align: center;
  margin-bottom: 20px;
}
.call-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.details-section {
  padding: 20px;
  border-radius: 12px;
  background-color: var(--p-grey-7);
  color: var(--p-text-color);

  .pi {
    margin-right: 10px;
    color: var(--primary-color);
    font-size: 1.4rem;
  }
}
.details-section h4 {
  margin-top: 0;
}
.details-section p {
  margin: 5px 0;
}

h2 {
    margin-bottom: 5px;
    font-weight: bold;
}
.error-message {
  color: var(--error-color, #f44336); /* Цвет ошибки */
  text-align: center;
  padding: 20px;
}
.document-card {
  padding: 16px;
  border-radius: 12px;
  background-color: var(--p-grey-7);
  margin-bottom: 10px;
}
.document-card h5 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--p-text-color);
}
.document-card p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--p-text-color);
}
.override-color * {
  color: var(--p-text-color) !important;
  background-color: transparent !important;
  font-size: 14px !important;
  font-weight: 400 !important;
  font-style: normal !important;
  text-decoration: none !important;
}
.document-icon {
  width: 48px; 
  height: 48px; 
}

.negotiations-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.negotiation-card {
  background-color: var(--p-grey-7);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #007ad9;
}
.negotiation-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.negotiation-details p {
  margin: 0.25rem 0;
}
.status-tag {
  margin-left: 0.5rem;
}

.user-list {
  margin-top: 1rem;
}

.user-list-title {
  font-weight: 600;
  font-size: 1rem;
}

.user-item {
  /* padding-left: 1rem; */
  position: relative;
}
</style>
