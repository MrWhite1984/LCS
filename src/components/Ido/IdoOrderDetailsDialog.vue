<template>
    <Dialog
        :visible="visible"
        modal
        :style="{ width: '720px', maxWidth: '92vw' }"
        header="Заявка ИДО"
        @update:visible="emit('update:visible', $event)"
    >
        <div v-if="loading" class="ido-details-loading">
            <ProgressSpinner style="width: 48px; height: 48px" />
        </div>

        <div v-else-if="order" class="ido-details">
            <div class="ido-details-grid">
                <div class="ido-info-card">
                    <span class="ido-info-label">Заказчик</span>
                    <strong>{{ employerLabel }}</strong>
                    <div class="d-flex gap-2 align-items-center">
                        <i class="pi pi-phone"></i>
                        <small>{{ order.employer?.phone || 'Телефон не указан' }}</small>
                    </div>
                </div>
                <div class="ido-info-card">
                    <span class="ido-info-label">Преподаватель</span>
                    <strong>{{ teacherLabel }}</strong>
                    <small>{{ order.hoursQuantity }} ч.</small>
                </div>
                <div class="ido-info-card">
                    <span class="ido-info-label">Сумма</span>
                    <strong>{{ formatCurrency(order.sum) }}</strong>
                </div>
            </div>

            <div class="ido-topic-block">
                <span class="ido-info-label">Тема консультации</span>
                <p class="m-0">{{ order.topic || 'Не указана' }}</p>
            </div>

            <div class="ido-detail-actions">
                <div class="ido-document-actions">
                    <span class="ido-info-label">Файлы заявки</span>
                    <div class="ido-document-buttons">
                        <Button
                            label="Word"
                            icon="pi pi-file-word"
                            :loading="documentLoading === 'word'"
                            @click="downloadDocument('word')"
                        />
                        <Button
                            label="PDF"
                            icon="pi pi-file-pdf"
                            severity="danger"
                            outlined
                            :loading="documentLoading === 'pdf'"
                            @click="downloadDocument('pdf')"
                        />
                    </div>
                </div>
                <template v-if="role === 'su'">
                    <div class="ido-status-actions">
                        <span class="ido-info-label">Изменение статуса</span>
                        <div class="ido-status-buttons">
                            <Button
                                label="Оплачено"
                                icon="pi pi-wallet"
                                severity="success"
                                :loading="statusLoading === 'paid'"
                                @click="changeStatus('paid')"
                            />
                            <Button
                                label="Завершено"
                                icon="pi pi-check-circle"
                                severity="info"
                                :loading="statusLoading === 'completed'"
                                @click="changeStatus('completed')"
                            />
                            <Button
                                label="Отменить"
                                icon="pi pi-times-circle"
                                severity="danger"
                                outlined
                                :loading="statusLoading === 'canceled'"
                                @click="changeStatus('canceled')"
                            />
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </Dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import {
    getIdoOrder,
    getIdoOrderDocuments,
    setOrderCanceled,
    setOrderCompleted,
    setOrderPaid,
} from '@/api/ido.js';
import { buildEmployerLabel, buildTeacherLabel, downloadIdoDocument } from '@/utils/ido.js';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false,
    },
    orderId: {
        type: String,
        default: '',
    },
    role: {
        type: String,
        default: 'employer-lks',
    },
});

const emit = defineEmits(['update:visible', 'updated']);

const toast = useToast();

const loading = ref(false);
const documentLoading = ref('');
const statusLoading = ref('');
const order = ref(null);

const teacherLabel = computed(() => buildTeacherLabel(order.value?.teacher));
const employerLabel = computed(() => buildEmployerLabel(order.value?.employer));

const formatCurrency = (value) => new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2,
}).format(Number(value || 0));

const loadOrder = async () => {
    if (!props.visible || !props.orderId) return;

    loading.value = true;

    try {
        const response = await getIdoOrder(props.role, props.orderId);
        order.value = response.data;
    } catch (error) {
        console.debug('Ошибка загрузки заявки ИДО:', error);
        toast.add({
            severity: 'error',
            summary: 'Не удалось открыть заявку',
            detail: 'Попробуйте обновить список и повторить.',
            life: 3000,
        });
    } finally {
        loading.value = false;
    }
};

const downloadDocument = async (format) => {
    documentLoading.value = format;

    try {
        const response = await getIdoOrderDocuments(props.role, props.orderId);
        const hasDownloaded = downloadIdoDocument(response.data, format);

        if (!hasDownloaded) {
            throw new Error(`Файл формата ${format} отсутствует`);
        }
    } catch (error) {
        console.debug('Ошибка загрузки документа ИДО:', error);
        toast.add({
            severity: 'error',
            summary: 'Документ недоступен',
            detail: format === 'pdf'
                ? 'PDF-файл по этой заявке недоступен.'
                : 'Word-файл по этой заявке недоступен.',
            life: 3000,
        });
    } finally {
        documentLoading.value = '';
    }
};

const changeStatus = async (type) => {
    const actionMap = {
        'paid': () => setOrderPaid(props.orderId, true),
        'completed': () => setOrderCompleted(props.orderId, true),
        'canceled': () => setOrderCanceled(props.orderId, true),
    };

    statusLoading.value = type;

    try {
        await actionMap[type]?.();
        toast.add({
            severity: 'success',
            summary: 'Статус обновлен',
            detail: 'Изменение по заявке сохранено.',
            life: 2500,
        });
        emit('updated');
    } catch (error) {
        console.debug('Ошибка обновления статуса ИДО:', error);
        toast.add({
            severity: 'error',
            summary: 'Не удалось изменить статус',
            detail: 'Повторите действие немного позже.',
            life: 3000,
        });
    } finally {
        statusLoading.value = '';
    }
};

watch(
    () => [props.visible, props.orderId, props.role],
    () => {
        loadOrder();
    },
    { immediate: true }
);
</script>

<style scoped>
.ido-details-loading {
    min-height: 220px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.ido-details {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    color: var(--p-text-color);
}

.ido-details-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
}

.ido-info-card {
    padding: 1rem;
    border-radius: 14px;
    background: var(--p-content-background);
    border: 1px solid var(--p-content-border-color);
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
}

.ido-info-card strong {
    color: var(--p-text-color);
    font-size: 1.02rem;
}

.ido-info-card small {
    color: var(--p-text-color-secondary);
}

.ido-info-label {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--p-text-color-secondary);
}

.ido-topic-block {
    padding: 1rem 1.25rem;
    border-radius: 14px;
    border: 1px solid var(--p-content-border-color);
    color: var(--p-text-color);
    background: var(--p-content-background);
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
}

.ido-detail-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
}

.ido-document-actions {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 0.9rem 1rem;
    border-radius: 14px;
    border: 1px solid var(--p-content-border-color);
    background: color-mix(in srgb, var(--p-primary-500) 4%, var(--p-content-background));
    align-self: stretch;
}

.ido-document-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.ido-status-actions {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 0.9rem 1rem;
    border-radius: 14px;
    border: 1px solid var(--p-content-border-color);
    background: color-mix(in srgb, var(--p-primary-500) 3%, var(--p-content-background));
}

.ido-status-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.ido-detail-actions :deep(.p-button) {
    border-radius: 14px;
}

@media (max-width: 768px) {
    .ido-details-grid {
        grid-template-columns: 1fr;
    }

    .ido-detail-actions {
        flex-direction: column;
    }

    .ido-document-buttons {
        flex-direction: column;
    }

    .ido-status-buttons {
        flex-direction: column;
    }
}
</style>
