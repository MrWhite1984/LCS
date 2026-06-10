<template>
    <Dialog
        :visible="visible"
        modal
        :draggable="false"
        :style="{ width: '100%', maxWidth: '56rem' }"
        :header="dialogTitle"
        @update:visible="onVisibilityChange"
    >
        <div v-if="loading" class="student-ticket-dialog__state">
            <Skeleton height="5rem" borderRadius="18px" />
            <Skeleton height="14rem" borderRadius="18px" />
            <Skeleton height="16rem" borderRadius="18px" />
        </div>

        <div v-else-if="errorMessage" class="student-ticket-dialog__state student-ticket-dialog__state_error">
            <i class="pi pi-exclamation-circle"></i>
            <div>
                <h4>Не удалось загрузить заявку</h4>
                <p>{{ errorMessage }}</p>
            </div>
            <Button
                label="Повторить"
                icon="pi pi-refresh"
                severity="secondary"
                @click="loadTicket"
            />
        </div>

        <div v-else-if="ticket" class="student-ticket-dialog">
            <section class="student-ticket-dialog__panel">
                <div class="student-ticket-dialog__panel-head">
                    <div>
                        <h4>Информация по заявке</h4>
                        <p>Вы можете просмотреть все прикреплённые файлы и скачать нужный документ.</p>
                    </div>
                    <div class="student-ticket-dialog__chips">
                        <Tag
                            :severity="getStatusSeverity(ticket.status)"
                            :value="getStatusLabel(ticket.status)"
                        />
                        <Tag
                            severity="contrast"
                            :value="getPriorityLabel(ticket.priority)"
                        />
                    </div>
                </div>

                <div class="student-ticket-dialog__meta">
                    <div class="student-ticket-dialog__meta-item">
                        <span class="student-ticket-dialog__meta-label">Номер</span>
                        <strong>{{ ticket.number || '—' }}</strong>
                    </div>
                    <div class="student-ticket-dialog__meta-item">
                        <span class="student-ticket-dialog__meta-label">Тип справки</span>
                        <strong>{{ ticket.requestType?.name || 'Не указан' }}</strong>
                    </div>
                    <div class="student-ticket-dialog__meta-item">
                        <span class="student-ticket-dialog__meta-label">Создана</span>
                        <strong>{{ formatDate(ticket.createdAt) }}</strong>
                    </div>
                    <div class="student-ticket-dialog__meta-item">
                        <span class="student-ticket-dialog__meta-label">Обновлена</span>
                        <strong>{{ formatDate(ticket.updatedAt) }}</strong>
                    </div>
                </div>
            </section>

            <section v-if="displayFields.length" class="student-ticket-dialog__panel">
                <div class="student-ticket-dialog__panel-head">
                    <div>
                        <h4>Данные заявки</h4>
                        <p>Поля, которые были переданы при оформлении справки.</p>
                    </div>
                </div>

                <div class="student-ticket-dialog__fields">
                    <div
                        v-for="field in displayFields"
                        :key="field.key"
                        class="student-ticket-dialog__field"
                    >
                        <span class="student-ticket-dialog__field-label">{{ field.label }}</span>
                        <span class="student-ticket-dialog__field-value">{{ field.value }}</span>
                    </div>
                </div>
            </section>

            <section class="student-ticket-dialog__panel">
                <div class="student-ticket-dialog__panel-head">
                    <div>
                        <h4>Прикреплённые файлы</h4>
                        <p v-if="attachments.length">Всего файлов: {{ attachments.length }}</p>
                        <p v-else>По этой заявке пока нет доступных вложений.</p>
                    </div>
                </div>

                <div v-if="attachments.length" class="student-ticket-dialog__attachments">
                    <article
                        v-for="attachment in attachments"
                        :key="attachment.id"
                        class="student-ticket-dialog__attachment"
                    >
                        <div class="student-ticket-dialog__attachment-main">
                            <div class="student-ticket-dialog__attachment-icon">
                                <i :class="getAttachmentIcon(attachment.mimeType)"></i>
                            </div>

                            <div class="student-ticket-dialog__attachment-body">
                                <div class="student-ticket-dialog__attachment-title-row">
                                    <strong>{{ attachment.fileName || 'Файл без названия' }}</strong>
                                    <Tag
                                        size="small"
                                        :severity="attachment.commentId ? 'secondary' : 'info'"
                                        :value="attachment.commentId ? 'Комментарий' : 'Заявка'"
                                    />
                                </div>

                                <div class="student-ticket-dialog__attachment-meta">
                                    <span>{{ attachment.mimeType || 'Неизвестный тип' }}</span>
                                    <span>{{ formatFileSize(attachment.size) }}</span>
                                    <span>{{ formatDate(attachment.createdAt) }}</span>
                                </div>
                            </div>
                        </div>

                        <Button
                            icon="pi pi-download"
                            label="Скачать"
                            severity="secondary"
                            outlined
                            :loading="downloadingAttachmentIds.includes(attachment.id)"
                            @click="downloadAttachment(attachment)"
                        />
                    </article>
                </div>

                <div v-else class="student-ticket-dialog__empty">
                    <i class="pi pi-paperclip"></i>
                    <span>Вложения отсутствуют</span>
                </div>
            </section>
        </div>
    </Dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { downloadMyTicketAttachment, getMyTicket } from '@/api/tickets.js';
import { formatDateRuLongWithTime as formatDate } from '@/utils/date.js';
import { downloadBase64Document } from '@/utils/ido.js';

const props = defineProps({
    visible: {
        type: Boolean,
        required: true,
    },
    ticketId: {
        type: String,
        default: '',
    },
});

const emit = defineEmits(['update:visible']);

const toast = useToast();

const loading = ref(false);
const errorMessage = ref('');
const ticket = ref(null);
const downloadingAttachmentIds = ref([]);

const statusLabels = {
    New: 'Новая',
    Open: 'Открыта',
    Assigned: 'Назначена',
    Pending: 'В ожидании',
    Resolved: 'Решена',
    Closed: 'Закрыта',
    Cancelled: 'Отменена',
};

const priorityLabels = {
    Low: 'Низкий приоритет',
    Medium: 'Средний приоритет',
    High: 'Высокий приоритет',
};

const dialogTitle = computed(() => (
    ticket.value?.number
        ? `Заявка № ${ticket.value.number}`
        : 'Заявка на получение справки'
));

const attachments = computed(() => (
    Array.isArray(ticket.value?.attachments) ? ticket.value.attachments : []
));

const parseFormData = (value) => {
    if (!value) return {};

    try {
        return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
        return {};
    }
};

const formatFileSize = (value) => {
    const size = Number(value);

    if (!Number.isFinite(size) || size <= 0) {
        return 'Размер не указан';
    }

    if (size < 1024) return `${size} Б`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} КБ`;
    return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
};

const getStatusSeverity = (status) => ({
    New: 'info',
    Open: 'warning',
    Assigned: 'success',
    Pending: 'secondary',
    Resolved: 'success',
    Closed: 'secondary',
    Cancelled: 'danger',
}[status] || 'contrast');

const getStatusLabel = (status) => statusLabels[status] || status || 'Не указан';
const getPriorityLabel = (priority) => priorityLabels[priority] || priority || 'Без приоритета';

const normalizeFileContent = (value) => {
    const rawValue = String(value || '').trim().replace(/\s/g, '');
    return rawValue.includes('base64,') ? rawValue.split('base64,')[1] : rawValue;
};

const formatFieldValue = (field, value) => {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    if (field?.type === 'Checkbox') {
        return value ? 'Да' : 'Нет';
    }

    if (field?.type === 'Date') {
        return formatDate(value);
    }

    if (field?.type === 'File' && typeof value === 'object') {
        return value.fileName || 'Файл прикреплён';
    }

    if (Array.isArray(value)) {
        return value.join(', ');
    }

    if (typeof value === 'object') {
        return value.fileName || JSON.stringify(value);
    }

    return String(value);
};

const displayFields = computed(() => {
    const parsed = parseFormData(ticket.value?.formData);
    const schema = Array.isArray(ticket.value?.requestType?.formSchema)
        ? ticket.value.requestType.formSchema
        : [];

    const schemaKeys = new Set(schema.map((field) => field.name));

    const mappedSchemaFields = schema.map((field) => ({
        key: field.name,
        label: field.label || field.name,
        value: formatFieldValue(field, parsed[field.name]),
    }));

    const extraFields = Object.entries(parsed)
        .filter(([key]) => !schemaKeys.has(key))
        .map(([key, value]) => ({
            key,
            label: key,
            value: formatFieldValue(null, value),
        }));

    return [...mappedSchemaFields, ...extraFields].filter((field) => field.value !== '—');
});

const getAttachmentIcon = (mimeType = '') => {
    const normalizedMimeType = String(mimeType).toLowerCase();

    if (normalizedMimeType.includes('pdf')) return 'pi pi-file-pdf';
    if (normalizedMimeType.includes('image')) return 'pi pi-image';
    if (normalizedMimeType.includes('word') || normalizedMimeType.includes('document')) return 'pi pi-file-word';
    if (normalizedMimeType.includes('zip') || normalizedMimeType.includes('rar')) return 'pi pi-file';
    return 'pi pi-file';
};

const loadTicket = async () => {
    if (!props.ticketId) return;

    loading.value = true;
    errorMessage.value = '';

    try {
        const response = await getMyTicket(props.ticketId);
        ticket.value = response.data || null;
    } catch (error) {
        ticket.value = null;
        errorMessage.value = error?.response?.data?.message || 'Попробуйте открыть заявку ещё раз.';
    } finally {
        loading.value = false;
    }
};

const downloadAttachment = async (attachment) => {
    if (!props.ticketId || !attachment?.id) return;

    downloadingAttachmentIds.value = [...downloadingAttachmentIds.value, attachment.id];

    try {
        const response = await downloadMyTicketAttachment(props.ticketId, attachment.id);
        const content = normalizeFileContent(response.data);

        if (!content) {
            throw new Error('Пустое содержимое файла');
        }

        downloadBase64Document(
            content,
            attachment.fileName || 'attachment',
            attachment.mimeType || 'application/octet-stream',
        );
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Не удалось скачать файл',
            detail: error?.response?.data?.message || 'Попробуйте ещё раз немного позже.',
            life: 3500,
        });
    } finally {
        downloadingAttachmentIds.value = downloadingAttachmentIds.value.filter((id) => id !== attachment.id);
    }
};

const onVisibilityChange = (value) => {
    emit('update:visible', value);

    if (!value) {
        ticket.value = null;
        errorMessage.value = '';
        downloadingAttachmentIds.value = [];
    }
};

watch(
    () => [props.visible, props.ticketId],
    async ([isVisible, ticketId]) => {
        if (!isVisible || !ticketId) return;
        await loadTicket();
    },
    { immediate: true }
);
</script>

<style scoped>
.student-ticket-dialog {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.student-ticket-dialog__panel,
.student-ticket-dialog__state {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    border-radius: 18px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
    background: rgba(var(--p-blue-500-rgb), 0.04);
}

.student-ticket-dialog__state {
    padding: 0;
    border: 0;
    background: transparent;
}

.student-ticket-dialog__state_error {
    align-items: flex-start;
    padding: 1rem;
    border-color: rgba(var(--p-red-500-rgb), 0.18);
    background: rgba(var(--p-red-500-rgb), 0.08);
}

.student-ticket-dialog__state_error i {
    font-size: 1.75rem;
    color: var(--p-red-500);
}

.student-ticket-dialog__state_error h4,
.student-ticket-dialog__state_error p {
    margin: 0;
}

.student-ticket-dialog__panel-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
}

.student-ticket-dialog__panel-head h4,
.student-ticket-dialog__panel-head p {
    margin: 0;
}

.student-ticket-dialog__panel-head p {
    margin-top: 0.35rem;
    color: var(--p-grey-1);
    line-height: 1.45;
}

.student-ticket-dialog__chips {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.student-ticket-dialog__meta,
.student-ticket-dialog__fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.85rem;
}

.student-ticket-dialog__meta-item,
.student-ticket-dialog__field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.85rem 0.95rem;
    border-radius: 14px;
    background: var(--p-content-background);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.08);
}

.student-ticket-dialog__meta-label,
.student-ticket-dialog__field-label {
    font-size: 0.85rem;
    color: var(--p-grey-1);
}

.student-ticket-dialog__field-value {
    line-height: 1.45;
    word-break: break-word;
}

.student-ticket-dialog__attachments {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
}

.student-ticket-dialog__attachment {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.95rem 1rem;
    border-radius: 16px;
    background: var(--p-content-background);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.08);
}

.student-ticket-dialog__attachment-main {
    display: flex;
    align-items: flex-start;
    gap: 0.85rem;
    min-width: 0;
}

.student-ticket-dialog__attachment-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 12px;
    background: rgba(var(--p-blue-500-rgb), 0.1);
    color: var(--p-blue-600);
    flex-shrink: 0;
}

.student-ticket-dialog__attachment-body {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    min-width: 0;
}

.student-ticket-dialog__attachment-title-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
}

.student-ticket-dialog__attachment-title-row strong {
    word-break: break-word;
}

.student-ticket-dialog__attachment-meta {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    color: var(--p-grey-1);
    font-size: 0.9rem;
}

.student-ticket-dialog__empty {
    min-height: 11rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    color: var(--p-grey-1);
}

.student-ticket-dialog__empty i {
    font-size: 2rem;
}

@media (max-width: 768px) {
    .student-ticket-dialog__panel-head,
    .student-ticket-dialog__attachment {
        flex-direction: column;
        align-items: stretch;
    }

    .student-ticket-dialog__chips {
        justify-content: flex-start;
    }

    .student-ticket-dialog__meta,
    .student-ticket-dialog__fields {
        grid-template-columns: 1fr;
    }
}
</style>
