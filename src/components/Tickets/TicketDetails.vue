<template>
    <Dialog 
        :visible="visible" 
        @update:visible="$emit('update:visible', $event)"
        modal 
        :header="selectedTicket?.requestType?.name || 'Детали заявки'"
        :style="{ width: '100%', maxWidth: '100rem' }"
        :draggable="false"
        @hide="closeModal"
    >
        <Transition name="content-fade" mode="out-in">
            <!-- Состояние загрузки -->
            <div key="ticket-details-skeleton" v-if="loading" class="call-details">
                <Skeleton width="100%" height="200px" class="mb-2"/>
                <Skeleton width="100%" height="200px" class="mb-2"/>
                <Skeleton width="100%" height="200px" class="mb-2"/>
                <Skeleton width="100%" height="200px" class="mb-2"/>
            </div>

            <!-- Состояние ошибки -->
            <div key="ticket-details-error" v-else-if="error" class="error-message">
                <p>Произошла ошибка при загрузке данных</p>
                <Button 
                    label="Повторить" 
                    icon="pi pi-refresh" 
                    @click="loadTicket(props.ticketId)" 
                    class="mt-3"
                />
            </div>

            <!-- Основное содержимое -->
            <div key="ticket-details-content" v-else-if="selectedTicket" class="ticket-details">
                <Tabs value="0">
                <TabList>
                    <Tab value="0" as="div">
                        <i class="pi pi-cog"></i>
                        <span class="ms-2">Общее</span>
                    </Tab>
                    <Tab value="1" as="div">
                        <i class="pi pi-comments"></i>
                        <span class="ms-2">Комментарии</span>
                        <Badge v-if="selectedTicket.comments?.length > 0" 
                                :value="selectedTicket.comments.length" 
                                class="ms-2" />
                    </Tab>
                    <Tab value="2" as="div">
                        <i class="pi pi-paperclip"></i>
                        <span class="ms-2">Вложения</span>
                        <Badge v-if="selectedTicket.attachments?.length > 0" 
                                :value="selectedTicket.attachments.length" 
                                class="ms-2" />
                    </Tab>
                </TabList>
                
                <TabPanels>
                    <!-- Вкладка "Общее" -->
                    <TabPanel value="0">
                        <div class="call-details">
                            <!-- Основная информация -->
                            <div class="details-section">
                                <h4><i class="pi pi-info-circle"></i> Основная информация</h4>
                                <p><strong>Номер заявки:</strong> {{ selectedTicket.number }}</p>
                                <p><strong>ID заявки:</strong> {{ selectedTicket.id }}</p>
                                <p><strong>Тип заявки:</strong> {{ selectedTicket.requestType?.name || 'Не указан' }}</p>
                                <p class="status-row">
                                    <strong>Статус:</strong>

                                    <Tag
                                        class="ms-2 status-tag clickable"
                                        :severity="getStatusSeverity(selectedTicket.status)"
                                        :value="getStatusLabel(selectedTicket.status)"
                                        :icon="getStatusIcon(selectedTicket.status)"
                                        :loading="updatingStatus"
                                        @click="toggleStatusPanel"
                                    />

                                    <i 
                                        class="pi pi-pencil ms-2 status-edit-icon"
                                        @click="toggleStatusPanel"
                                    />

                                    <OverlayPanel ref="statusPanel">
                                        <div class="status-select">
                                            <div
                                                v-for="status in availableStatuses"
                                                :key="status"
                                                class="status-option"
                                                :class="{ active: status === selectedTicket.status }"
                                                @click="confirmStatusChange(status)"
                                            >
                                                <Tag
                                                    :severity="getStatusSeverity(status)"
                                                    :value="getStatusLabel(status)"
                                                    :icon="getStatusIcon(status)"
                                                />
                                            </div>
                                        </div>
                                    </OverlayPanel>
                                </p>


                                <p><strong>Приоритет:</strong> 
                                    <Tag 
                                        :severity="getPrioritySeverity(selectedTicket.priority)" 
                                        :value="getPriorityLabel(selectedTicket.priority)"
                                        class="ms-2"
                                    />
                                </p>
                            </div>

                            <!-- Даты -->
                            <div class="details-section">
                                <h4><i class="pi pi-calendar"></i> Даты</h4>
                                <Timeline :value="timelineEvents" class="mb-3">
                                    <template #opposite="slotProps">
                                        <small>{{ formatDate(slotProps.item.date) }}</small>
                                    </template>
                                    <template #content="slotProps">
                                        <span>{{ slotProps.item.label }}</span>
                                    </template>
                                </Timeline>
                            </div>

                            <!-- Данные формы -->
                            <div class="details-section" v-if="formDataInfo?.fields?.length > 0">
                                <h4><i class="pi pi-user"></i> Данные заявителя</h4>
                                
                                <!-- Карточка с ФИО -->
                                <div v-if="formDataInfo.fioField" class="user-card">
                                    <div class="user-info">
                                        <div class="user-name">{{ formDataInfo.fioField.value }}</div>
                                        <div v-if="formDataInfo.studentInfo" class="user-details">
                                            <span v-if="formDataInfo.studentInfo.faculty !== 'Институт не указан'" class="info-badge edu-badge">
                                                <i class="pi pi-graduation-cap"></i>
                                                {{ formDataInfo.studentInfo.faculty }}
                                            </span>
                                            <span v-if="formDataInfo.studentInfo.group !== 'Группа не указана'" class="info-badge group-badge">
                                                <i class="pi pi-users"></i>
                                                {{ formDataInfo.studentInfo.group }}
                                            </span>
                                            <span v-if="formDataInfo.studentInfo.code" class="info-badge code-badge">
                                                <i class="pi pi-code"></i>
                                                {{ formDataInfo.studentInfo.code }}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Карточка заказа справок -->
                                <div v-if="formDataInfo.certificateInfo" class="certificate-card">
                                    <div class="certificate-header">
                                        <i class="pi pi-file"></i>
                                        <span>Информация о справке</span>
                                    </div>
                                    <div class="certificate-details">
                                        <!-- Динамически рендерим поля справки -->
                                        <div v-for="field in formDataInfo.certificateInfo.fields" 
                                            :key="field.key" 
                                            class="certificate-field">
                                            
                                            <!-- Для типа справки показываем badge -->
                                            <div v-if="field.key === 'certificateType'" class="certificate-type">
                                                <span class="type-badge" :class="getCertificateTypeClass(field.rawValue)">
                                                    {{ formatCertificateType(field.rawValue) }}
                                                </span>
                                            </div>
                                            
                                            <!-- Для количества справок показываем счётчик -->
                                            <div v-else-if="field.key === 'certificateCount'" class="certificate-count">
                                                <div class="count-display">
                                                    <span class="count-number">{{ field.value }}</span>
                                                    <span class="count-label">шт.</span>
                                                </div>
                                                <div class="count-description">{{ field.label }}</div>
                                            </div>
                                            
                                            <!-- Для остальных полей справки -->
                                            <div v-else class="certificate-field-item">
                                                <strong>{{ field.label }}:</strong>
                                                <span>{{ field.value }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Динамическое отображение остальных полей -->
                                <div v-if="hasOtherFields" class="other-fields-section">
                                    <div v-for="category in visibleCategories" 
                                        :key="category"
                                        class="field-category">
                                        <h5>{{ getCategoryLabel(category) }}</h5>
                                        <div class="field-grid">
                                            <div v-for="field in formDataInfo.groupedFields[category]" 
                                                :key="field.key"
                                                class="field-item">
                                                <div class="field-label">{{ field.label }}:</div>
                                                <div class="field-value">{{ field.value || '—' }}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- <div style="background: #111; color: #0f0; padding: 12px; font-family: monospace; white-space: pre; max-height: 300px; overflow: auto;">
                                    <strong>DEBUG: groupedFields</strong>
                                    {{ JSON.stringify(formDataInfo?.groupedFields, null, 2) }}
                                </div> -->
                            </div>

                            <!-- Участники -->
                            <div class="details-section participants-section">
                                <h4><i class="pi pi-users"></i> Участники</h4>
                                <div class="participants-grid">
                                    <div class="participant-item">
                                        <i class="pi pi-desktop"></i>
                                        <div>
                                            <div class="participant-label">Система</div>
                                            <div class="participant-value">{{ selectedTicket.requesterSystem || 'Не указана' }}</div>
                                        </div>
                                    </div>
                                    <div class="participant-item">
                                        <i class="pi pi-user-plus"></i>
                                        <div>
                                            <div class="participant-label">Инициатор</div>
                                            <div class="participant-value">{{ getRequesterName }}</div>
                                        </div>
                                    </div>
                                    <div class="participant-item">
                                        <i class="pi pi-user-edit"></i>
                                        <div>
                                            <div class="participant-label">Исполнитель</div>
                                            <div class="participant-value">
                                                <AutoComplete
                                                    v-model="selectedAssignee"
                                                    :suggestions="filteredAssignees"
                                                    optionLabel="fullName"
                                                    field="fullName"
                                                    placeholder="Выберите исполнителя..."
                                                    @complete="searchAssignees"
                                                    :disabled="updatingAssignee"
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            :icon="selectedTicket.asigneeId ? 'pi pi-circle-check' : 'pi pi-pencil'"
                                            class="p-button-rounded p-button-text ms-2"
                                            @click="updateAssignee"
                                            :loading="updatingAssignee"
                                            :disabled="!selectedAssignee || selectedAssignee.id === selectedTicket.assigneeId"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabPanel>

                    <!-- Вкладка "Комментарии" -->
                    <TabPanel value="1">
                        <div class="comments-tab">
                            <!-- Список комментариев -->
                            <div v-if="selectedTicket.comments && selectedTicket.comments.length > 0" 
                                    class="comments-section">
                                <div v-for="comment in commentsWithAttachments" 
                                        :key="comment.id" 
                                        class="comment-card">
                                    <div class="comment-header">
                                        <div class="comment-author">
                                            <i class="pi pi-user me-2"></i>
                                            <span class="font-semibold">{{ comment.authorName }}</span>
                                            <small v-if="comment.authorId && !comment.authorName" 
                                                class="text-muted ms-2">
                                                (ID: {{ comment.authorId }})
                                            </small>
                                        </div>
                                        <div class="comment-date">
                                            {{ formatDate(comment.createdAt) }}
                                        </div>
                                    </div>
                                    <div class="comment-body">
                                        {{ comment.body }}
                                    </div>
                                    <!-- Вложения комментария как chips -->
                                    <div v-if="comment.attachments && comment.attachments.length > 0" 
                                        class="comment-attachments mt-2">
                                        <div class="attachment-chips">
                                            <div v-for="attachment in comment.attachments" 
                                                :key="attachment.id" 
                                                class="attachment-chip">
                                                <i 
                                                    :class="[
                                                        'pi',
                                                        attachment.mimeType.includes('image') ? 'pi-image' :
                                                        attachment.mimeType.includes('pdf') ? 'pi-file-pdf' :
                                                        'pi-file'
                                                    ]"
                                                ></i>

                                                <span class="chip-name" :title="attachment.fileName">
                                                    {{ attachment.fileName }}
                                                </span>

                                                <span class="chip-size">
                                                    {{ formatFileSize(attachment.size) }}
                                                </span>

                                                <Button
                                                    icon="pi pi-download"
                                                    class="p-button-rounded p-button-text p-button-sm"
                                                    @click="downloadAttachment(attachment.id, attachment.fileName, attachment.mimeType)"
                                                    :loading="downloadingAttachmentId === attachment.id"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                            <div v-else class="no-comments">
                                <i class="pi pi-comment" style="font-size: 2rem; color: var(--p-gray-400);"></i>
                                <p class="mt-2">Комментарии отсутствуют</p>
                            </div>

                            <!-- Форма добавления комментария -->
                            <div class="add-comment-section">
                                <h5><i class="pi pi-plus-circle me-2"></i>Добавить комментарий</h5>
                                
                                <div class="comment-form">

                                    <!-- Textarea wrapper -->
                                    <div 
                                        class="comment-input-wrapper"
                                        :class="{ 'drag-active': isDragActive }"
                                        @dragover.prevent="onDragOver"
                                        @dragleave.prevent="onDragLeave"
                                        @drop.prevent="onDrop"
                                    >
                                        <Textarea 
                                            v-model="newComment.body" 
                                            :autoResize="true" 
                                            rows="3" 
                                            placeholder="Введите текст комментария..."
                                            class="comment-textarea"
                                            :class="{ 'p-invalid': commentValidation.body }"
                                        />

                                        <!-- Overlay при drag -->
                                        <div v-if="isDragActive" class="drag-overlay">
                                            <i class="pi pi-cloud-upload"></i>
                                            <span>Отпустите файлы для загрузки</span>
                                        </div>

                                        <!-- Action buttons -->
                                        <div class="comment-actions">
                                            <!-- Скрепка -->
                                            <Button
                                                icon="pi pi-paperclip"
                                                class="p-button-rounded p-button-text"
                                                @click="openFileDialog"
                                                :disabled="attachments.length >= 5 || submittingComment"
                                                v-tooltip="'Добавить файлы'"
                                            />

                                            <!-- Отправить -->
                                            <Button 
                                                icon="pi pi-send"
                                                class="p-button-rounded"
                                                size="large"
                                                @click="submitComment"
                                                :loading="submittingComment"
                                                :disabled="!newComment.body || submittingComment"
                                            />
                                        </div>

                                        <!-- Скрытый FileUpload -->
                                        <FileUpload 
                                            ref="fileUploadRef"
                                            mode="basic"
                                            :multiple="true"
                                            :auto="true"
                                            :maxFileSize="10485760"
                                            :accept="allowedFileTypes"
                                            style="display:none"
                                            @select="onFileSelect"
                                        />
                                    </div>

                                    <small v-if="commentValidation.body" class="p-error">
                                        Текст комментария обязателен
                                    </small>

                                    <!-- Chips -->
                                    <div v-if="attachments.length > 0" class="attachment-chips">
                                        <div 
                                            v-for="(file, index) in attachments" 
                                            :key="index"
                                            class="attachment-chip"
                                        >
                                            <i 
                                                :class="[
                                                    'pi',
                                                    file.type.includes('image') ? 'pi-image' :
                                                    file.type.includes('pdf') ? 'pi-file-pdf' :
                                                    'pi-file'
                                                ]"
                                            ></i>

                                            <span class="chip-name" :title="file.name">
                                                {{ file.name }}
                                            </span>

                                            <span class="chip-size">
                                                {{ formatFileSize(file.size) }}
                                            </span>

                                            <Button
                                                icon="pi pi-times"
                                                class="p-button-rounded p-button-text p-button-sm p-button-danger"
                                                @click="removeAttachment(index)"
                                                :disabled="submittingComment"
                                            />
                                        </div>
                                    </div>

                                    <!-- Progress -->
                                    <div v-if="submittingComment" class="upload-progress">
                                        <ProgressBar :value="uploadProgress" :showValue="false" style="height:6px" />
                                        <small class="progress-text">Загрузка файлов…</small>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </TabPanel>

                    <!-- Вкладка "Вложения" -->
                    <TabPanel value="2">
                        <div v-if="selectedTicket.attachments && selectedTicket.attachments.length > 0" 
                                class="attachments-section">
                            <div v-for="attachment in selectedTicket.attachments" 
                                    :key="attachment.id" 
                                    class="attachment-card">
                                <div class="row align-items-center justify-content-between">
                                    <div class="col-auto">
                                        <h5>{{ attachment.fileName }}</h5>
                                        <p>Тип: {{ attachment.mimeType }}</p>
                                        <p>Размер: {{ formatFileSize(attachment.size) }}</p>
                                        <p>Дата загрузки: {{ formatDate(attachment.createdAt) }}</p>
                                    </div>
                                    <div class="col-auto">
                                        <Button 
                                            icon="pi pi-download" 
                                            class="p-button-rounded p-button-text"
                                            :title="`Скачать ${attachment.fileName}`"
                                            @click="downloadAttachment(attachment.id, attachment.fileName, attachment.mimeType)"
                                            :loading="downloadingAttachmentId === attachment.id"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="no-attachments">
                            <i class="pi pi-paperclip" style="font-size: 2rem; color: var(--p-gray-400);"></i>
                            <p class="mt-2">Вложения отсутствуют</p>
                        </div>
                    </TabPanel>
                </TabPanels>
                </Tabs>
            </div>
        </Transition>
    </Dialog>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import axiosInstance from '@/utils/axios.js';
import { useToast } from 'primevue/usetoast';
import { useTicket } from './composables/useTicket.js';
import { useTicketStatus } from './composables/useTicketStatus.js';
import { useFormatters } from './composables/useFormatters.js';
import { useAttachments } from './composables/useAttachments.js';
import { useFormDataProcessor } from './composables/useFormDataProcessor.js';
import { useTicketStatusChange } from './composables/useTicketStatusChange';
import { useConfirm } from 'primevue/useconfirm';

// Импорты PrimeVue компонентов
import Textarea from 'primevue/textarea';
import FileUpload from 'primevue/fileupload';
import Badge from 'primevue/badge';

const props = defineProps({
    visible: {
        type: Boolean,
        required: true
    },
    ticketId: {
        type: String,
        required: true
    }
});

const emit = defineEmits(['update:visible', 'close', 'comment-added']);

const toast = useToast();

// Инициализация композаблов
const {
    selectedTicket,
    loading,
    error,
    loadTicket,
    resetTicket
} = useTicket(axiosInstance);

const {
    downloadingAttachmentId,
    downloadAttachment
} = useAttachments(axiosInstance);

const {
    getStatusSeverity,
    getStatusLabel,
    getStatusIcon,
    getPrioritySeverity,
    getPriorityLabel,
    statusMap
} = useTicketStatus();

const {
    formatFileSize,
    formatDate,
    createTimelineEvents
} = useFormatters();

const {
    processFormData,
    getCertificateTypeClass,
    formatCertificateType
} = useFormDataProcessor();

// Реактивные данные для комментариев
const activeTab = ref(0);
const submittingComment = ref(false);
const newComment = ref({
    body: '',
    attachments: []
});
const attachments = ref([]);
const commentValidation = ref({
    body: false
});
const uploadProgress = ref(0);
const isDragActive = ref(false);
const fileUploadRef = ref(null);

const statusPanel = ref(null);
const confirm = useConfirm();

const users = ref([]);
const usersMap = ref({});
const loadingUsers = ref(false);

// Исполнитель
const selectedAssignee = ref(null); // выбранный исполнитель
const filteredAssignees = ref([]); // список для AutoComplete
const updatingAssignee = ref(false);

const { updatingStatus, updateTicketStatus } =
    useTicketStatusChange(axiosInstance, toast);

const openFileDialog = () => {
    fileUploadRef.value?.choose();
};

const availableStatuses = computed(() => {
    const allStatuses = Object.keys(statusMap);
    return allStatuses.filter(status => status !== "New");
});

// Разрешенные типы файлов
const allowedFileTypes = [
    'image/*',
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.txt',
].join(',');

// Компьютед свойства
const formDataInfo = computed(() => 
    selectedTicket.value?.formData 
        ? processFormData(selectedTicket.value.formData, formSchema.value)
        : null
);

const formSchema = computed(() => selectedTicket.value?.requestType?.formSchema || []);

const mainCategories = ['personal', 'education', 'certificate'];

const hasOtherFields = computed(() => {
    if (!formDataInfo.value?.groupedFields) return false;
    return Object.keys(formDataInfo.value.groupedFields).some(
        cat => !mainCategories.includes(cat) && 
                formDataInfo.value.groupedFields[cat]?.length > 0
    );
});

const visibleCategories = computed(() => {
    if (!formDataInfo.value?.groupedFields) return [];
    return Object.keys(formDataInfo.value.groupedFields).filter(
        cat => !mainCategories.includes(cat) && 
                formDataInfo.value.groupedFields[cat]?.length > 0
    );
});

const getCategoryLabel = (category) => {
    const labels = {
        'personal': 'Личные данные',
        'education': 'Образование',
        'certificate': 'Справка',
        'contacts': 'Контактная информация',
        'details': 'Детали заявки',
        'other': 'Дополнительная информация'
    };
    return labels[category] || category;
};

const timelineEvents = computed(() => 
    createTimelineEvents(selectedTicket.value)
);


const removeAttachment = (index) => {
    attachments.value.splice(index, 1);
};

const handleIncomingFiles = (files) => {
    if (attachments.value.length + files.length > 5) {
        toast.add({
            severity: 'warn',
            summary: 'Лимит файлов',
            detail: 'Можно загрузить не более 5 файлов',
            life: 3000
        });
        return;
    }

    for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
            toast.add({
                severity: 'error',
                summary: 'Ошибка',
                detail: `Файл ${file.name} превышает 10MB`,
                life: 3000
            });
            continue;
        }

        attachments.value.push(file);
    }
};

// Методы для работы с комментариями
const onFileSelect = (event) => {
    handleIncomingFiles(Array.from(event.files));
};

const onDragOver = () => {
    if (submittingComment.value) return;
    isDragActive.value = true;
};

const onDragLeave = () => {
    isDragActive.value = false;
};

const onDrop = (event) => {
    isDragActive.value = false;
    if (submittingComment.value) return;

    const files = Array.from(event.dataTransfer.files);
    handleIncomingFiles(files);
};


const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};

const validateComment = () => {
    commentValidation.value.body = !newComment.value.body.trim();
    return !commentValidation.value.body;
};

const submitComment = async () => {
    if (!validateComment()) return;

    submittingComment.value = true;
    uploadProgress.value = 0;

    try {
        const attachmentsData = [];

        for (let i = 0; i < attachments.value.length; i++) {
            const file = attachments.value[i];
            const base64Content = await convertFileToBase64(file);

            attachmentsData.push({
                fileName: file.name,
                fileContent: base64Content.split(',')[1],
                mimeType: file.type || 'application/octet-stream'
            });

            uploadProgress.value = Math.round(
                ((i + 1) / attachments.value.length) * 100
            );
        }

        const payload = {
            body: newComment.value.body.trim(),
            attachments: attachmentsData
        };

        await axiosInstance.post(`/api/tickets/${props.ticketId}/comment`, payload);

        resetCommentForm();
        await loadTicket(props.ticketId);

        toast.add({
            severity: 'success',
            summary: 'Успех',
            detail: 'Комментарий добавлен',
            life: 3000
        });

        activeTab.value = 1;
        emit('comment-added');

    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось добавить комментарий',
            life: 3000
        });
    } finally {
        submittingComment.value = false;
        uploadProgress.value = 0;
    }
};


const resetCommentForm = () => {
    newComment.value = {
        body: '',
        attachments: []
    };
    attachments.value = [];
    commentValidation.value = {
        body: false
    };
};

// Общие методы
const closeModal = () => {
    emit('update:visible', false);
    emit('close');
    resetTicket();
    resetCommentForm();
    activeTab.value = 0;
};

const toggleStatusPanel = (event) => {
    statusPanel.value.toggle(event);
};

const confirmStatusChange = (newStatus) => {
    if (newStatus === selectedTicket.value.status) return;

    confirm.require({
        message: `Изменить статус на «${getStatusLabel(newStatus)}»?`,
        header: 'Подтверждение',
        icon: 'pi pi-exclamation-triangle',
        acceptProps: {
            label: 'Изменить',
            severity: 'success'
        },
        rejectProps: {
            label: 'Отмена',
            severity: 'secondary',
            outlined: true
        },
        accept: async () => {
            const success = await updateTicketStatus(
                selectedTicket.value.id,
                newStatus
            );

            if (success) {
                selectedTicket.value.status = newStatus;
                statusPanel.value.hide();
            }
        }
    });
};

const getUserName = (userId) => {
    if (!userId) return 'Неизвестный пользователь';
    
    // Проверяем, что usersMap.value существует и имеет ключ
    if (!usersMap.value || typeof usersMap.value !== 'object') {
        return `ID: ${userId}`;
    }
    
    const user = usersMap.value[userId];
    if (!user) return `ID: ${userId}`;
    return user.fullName || `ID: ${userId}`;
};

const loadUsers = async () => {
    if (loadingUsers.value) return;
    
    loadingUsers.value = true;
    try {
        const payload = {
            page: 1,
            pageSize: 500,
            isBlocked: false
        };
        const response = await axiosInstance.post('/api/users/list', payload);
        users.value = response.data.entities || [];
        
        // Инициализируем usersMap.value как объект
        usersMap.value = {};
        
        users.value.forEach(user => {
            if (user && user.id) {
                usersMap.value[user.id] = {
                    id: user.id,
                    fullName: `${user.firstName || ''} ${user.middleName || ''} ${user.lastName || ''}`.trim(),
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    middleName: user.middleName || ''
                };
            }
        });
        
        // Обновляем список для автодополнения исполнителей
        filteredAssignees.value = users.value
            .filter(user => user && user.id)
            .map(user => ({
                id: user.id,
                fullName: `${user.firstName || ''} ${user.middleName || ''} ${user.lastName || ''}`.trim()
            }));
        
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось загрузить список пользователей',
            life: 3000
        });
    } finally {
        loadingUsers.value = false;
    }
};

const commentsWithAttachments = computed(() => {
    if (!selectedTicket.value?.comments) return [];

    const attachmentsByCommentId = (selectedTicket.value.attachments || []).reduce((acc, att) => {
        if (!att.commentId) return acc;
        if (!acc[att.commentId]) acc[att.commentId] = [];
        acc[att.commentId].push(att);
        return acc;
    }, {});

    return selectedTicket.value.comments.map(comment => ({
        ...comment,
        attachments: attachmentsByCommentId[comment.id] || [],
        authorName: comment.authorId ? getUserName(comment.authorId) : 'Неизвестный пользователь'
    }));
});

const searchAssignees = async (event) => {
    const query = event.query || '';

    if (!users.value || users.value.length === 0) {
        await loadUsers();
    }

    if (!users.value || users.value.length === 0) {
        filteredAssignees.value = [];
        return;
    }

    filteredAssignees.value = users.value
        .filter(user => {
            if (!user) return false;
            const fullName = `${user.firstName || ''} ${user.middleName || ''} ${user.lastName || ''}`.toLowerCase();
            return fullName.includes(query.toLowerCase());
        })
        .map(user => ({
            id: user.id,
            fullName: `${user.firstName || ''} ${user.middleName || ''} ${user.lastName || ''}`.trim()
        }));
};

const updateAssignee = async () => {
    if (!selectedAssignee.value || selectedAssignee.value.id === selectedTicket.value.assigneeId) return;

    updatingAssignee.value = true;

    try {
        await axiosInstance.patch(`/api/tickets/${selectedTicket.value.id}/assignee/${selectedAssignee.value.id}`);
        selectedTicket.value.assigneeId = selectedAssignee.value.id;

        toast.add({
            severity: 'success',
            summary: 'Успех',
            detail: `Исполнитель назначен: ${selectedAssignee.value.fullName}`,
            life: 3000
        });
    } catch (err) {
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось назначить исполнителя',
            life: 3000
        });
    } finally {
        updatingAssignee.value = false;
    }
};

// Наблюдатели
watch(() => props.ticketId, (newVal) => {
    if (props.visible && newVal) {
        loadTicket(newVal);
        activeTab.value = 0;
    }
});


watch(() => props.visible, async (val) => {
    if (val && props.ticketId) {
        await loadTicket(props.ticketId);
        
        if (!users.value || users.value.length === 0) {
            await loadUsers();
        }
        
        if (selectedTicket.value && 
            selectedTicket.value.assigneeId && 
            usersMap.value && 
            usersMap.value[selectedTicket.value.assigneeId]) {
            
            const user = usersMap.value[selectedTicket.value.assigneeId];
            selectedAssignee.value = {
                id: user.id,
                fullName: user.fullName
            };
        } else {
            selectedAssignee.value = null;
        }
    }
}, { immediate: true });

const getRequesterName = computed(() => {
    if (!selectedTicket.value?.requesterId) return 'Не указан';
    return getUserName(selectedTicket.value.requesterId);
});

</script>

<style scoped>
.call-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    min-width: 0;
}
.details-section {
    padding: 20px;
    border-radius: 12px;
    background-color: var(--p-grey-7);
    color: var(--p-text-color);
    min-width: 0;
    overflow-wrap: anywhere;
}
.details-section h4 {
    margin-top: 0;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    color: var(--p-text-color);
    font-size: 1.1rem;
    font-weight: 600;
}

.details-section h4 .pi {
    margin-right: 10px;
    color: var(--primary-color);
    font-size: 1.2rem;
}

.status-row {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
}

.status-tag.clickable {
    cursor: pointer;
}

.status-edit-icon {
    cursor: pointer;
    color: var(--p-grey-400);
    transition: color 0.2s;
}

.status-edit-icon:hover {
    color: var(--primary-color);
}

.status-select {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.status-option {
    cursor: pointer;
}

.status-option.active {
    opacity: 0.6;
    pointer-events: none;
}


/* Стили для карточки пользователя */
.user-card {
    display: flex;
    align-items: center;
    background-color: var(--p-grey-6);
    color: white;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 20px;
    border: 1px solid var(--p-grey-5);
}

.user-info {
    flex: 1;
    min-width: 0;
}

.user-name {
    font-size: 1.4rem;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--p-text-color);
}

.user-details {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.info-badge {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    background: var(--p-grey-7);
    border-radius: 20px;
    font-size: 0.85rem;
    backdrop-filter: blur(10px);
    color: var(--p-text-color);
}

.info-badge .pi {
    margin-right: 6px;
    font-size: 0.9rem;
}

.edu-badge {
    border-left: 3px solid #4CAF50;
}

.group-badge {
    border-left: 3px solid #2196F3;
}

.code-badge {
    border-left: 3px solid #FF9800;
}

/* Стили для карточки справок */
.certificate-card {
    background-color: var(--p-grey-6);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid var(--p-grey-5);
}

.certificate-header {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    font-weight: 600;
    color: var(--p-text-color);
}

.certificate-header .pi {
    margin-right: 10px;
    color: var(--primary-color);
}

.certificate-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}

.certificate-type {
    flex: 1;
}

.certificate-field {
    margin-bottom: 15px;
}

.certificate-field:last-child {
    margin-bottom: 0;
}

.certificate-field-item {
    padding: 10px;
    background-color: var(--p-grey-7);
    border-radius: 8px;
    border: 1px solid var(--p-grey-5);
    width: calc(100% - 40px);
    max-width: 100%;
    overflow-wrap: anywhere;
}

.certificate-field-item strong {
    margin-right: 8px;
    color: var(--p-grey-400);
}

.type-badge {
    display: inline-block;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 500;
    font-size: 0.95rem;
}

.type-pfr {
    background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
    color: white;
}

.type-general {
    background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
    color: white;
}

.type-default {
    background-color: var(--p-grey-5);
    color: var(--p-text-color);
}

.certificate-count {
    text-align: center;
    padding-left: 20px;
    border-left: 1px solid var(--p-grey-4);
}

.count-display {
    display: flex;
    align-items: baseline;
    justify-content: center;
    margin-bottom: 4px;
}

.count-number {
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary-color);
    margin-right: 4px;
}

.count-label {
    font-size: 1rem;
    color: var(--p-grey-400);
}

.count-description {
    font-size: 0.85rem;
    color: var(--p-grey-400);
}

/* Стили для динамических полей */
.other-fields-section {
    margin-top: 20px;
}

.field-category {
    margin-bottom: 20px;
    padding: 15px;
    background-color: var(--p-grey-6);
    border-radius: 12px;
    border: 1px solid var(--p-grey-5);
}

.field-category h5 {
    margin: 0 0 15px 0;
    color: var(--p-text-color);
    font-size: 1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
}

.field-category h5 .pi {
    margin-right: 10px;
    color: var(--primary-color);
}

.field-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(clamp(240px, 45vw, 320px), 1fr));
    gap: 15px;
}

.field-item {
    display: flex;
    flex-direction: column;
    padding: 12px;
    background-color: var(--p-grey-7);
    border-radius: 8px;
    border: 1px solid var(--p-grey-5);
}

.field-label {
    font-size: 0.85rem;
    color: var(--p-grey-400);
    margin-bottom: 4px;
}

.field-value {
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--p-text-color);
    word-break: break-word;
}

/* Стили для участников */
.participants-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.participant-item {
    display: flex;
    align-items: center;
    padding: 15px;
    background-color: var(--p-grey-6);
    border-radius: 10px;
    border: 1px solid var(--p-grey-5);
}

.participant-item .pi {
    margin-right: 15px;
    font-size: 1.5rem;
    color: var(--primary-color);
}

.participant-label {
    font-size: 0.8rem;
    color: var(--p-grey-400);
    margin-bottom: 4px;
}

.participant-value {
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--p-text-color);
    min-width: 0;
    overflow-wrap: anywhere;
}

.error-message {
    color: var(--p-red-500);
    text-align: center;
    padding: 20px;
}

/* Стили для вкладки комментариев */
.comments-tab {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.comments-section {
    max-height: 400px;
    overflow-y: auto;
    padding-right: 8px;
}

.comment-card {
    padding: 16px;
    border-radius: 12px;
    background-color: var(--p-grey-7);
    margin-bottom: 10px;
    border-left: 4px solid var(--primary-color);
}

.comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 10px;
}

.comment-body {
    color: var(--p-text-color);
    line-height: 1.5;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}

.comment-attachments {
    border-top: 1px solid var(--p-grey-6);
    padding-top: 10px;
}

/* Стили для автора комментария */
.comment-author {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}

.comment-author .font-semibold {
    font-weight: 400;
    color: var(--p-text-color);
}

.comment-author .text-muted {
    font-size: 0.8rem;
    color: var(--p-grey-400);
}

.comment-date {
    font-size: 0.85rem;
    color: var(--p-grey-400);
}

.attachment-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.attachment-item {
    display: flex;
    align-items: center;
    padding: 8px;
    background-color: var(--p-grey-6);
    border-radius: 6px;
    transition: background-color 0.2s;
}

.attachment-item:hover {
    background-color: var(--p-grey-5);
}

.attachment-name {
    flex: 1;
    font-size: 0.9rem;
}

.no-comments, .no-attachments {
    text-align: center;
    padding: 40px 20px;
    color: var(--p-grey-400);
}

/* Стили для формы добавления комментария */
.add-comment-section {
    padding: 20px;
    border-radius: 12px;
    background-color: var(--p-grey-7);
}

.add-comment-section h5 {
    margin-top: 0;
    margin-bottom: 20px;
    color: var(--p-text-color);
    display: flex;
    align-items: center;
}

.comment-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.comment-actions {
    position: absolute;
    bottom: 12px;
    right: 8px;

    display: flex;
    gap: 6px;
}

.comment-textarea {
    width: 100%;
    padding: 12px 96px 12px 12px;
    border-radius: 12px;
    background-color: var(--p-grey-6);
}

.comment-input-wrapper {
    position: relative;
    border-radius: 12px;
}

.drag-overlay {
    position: absolute;
    inset: 0;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;

    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    border-radius: 12px;

    color: white;
    font-size: 0.95rem;
    pointer-events: none;
    z-index: 2;
}

.drag-overlay .pi {
    font-size: 2rem;
    color: var(--primary-color);
}

.comment-input-wrapper.drag-active {
    border: 2px dashed var(--primary-color);
    outline-offset: 2px;
}

/* Chips */
.attachment-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
}

.attachment-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;

    padding: 6px 10px;
    border-radius: 20px;

    background-color: var(--p-grey-6);
    color: var(--p-text-color);

    font-size: 0.85rem;
    animation: fadeInUp 0.2s ease;
    max-width: 100%;
}

.attachment-chip .pi {
    font-size: 0.9rem;
    color: var(--primary-color);
}

.chip-name {
    max-width: min(100%, 160px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.chip-size {
    color: var(--p-grey-400);
    font-size: 0.75rem;
}

/* Progress */
.upload-progress {
    margin-top: 12px;
}

.progress-text {
    display: block;
    margin-top: 4px;
    font-size: 0.75rem;
    color: var(--p-grey-400);
    text-align: right;
}

/* Animation */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(4px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Стили для вложений */
.attachment-card {
    padding: 16px;
    border-radius: 12px;
    background-color: var(--p-grey-7);
    margin-bottom: 10px;
    transition: transform 0.2s;
    min-width: 0;
}

.attachment-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.attachment-card h5 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 500;
    color: var(--p-text-color);
}

.attachment-card p {
    margin: 0;
    font-size: 0.9rem;
    color: var(--p-text-color);
}

.ticket-details {
    max-height: 70vh;
    overflow-y: auto;
    padding-right: 8px;
    min-width: 0;
}

.ticket-details :deep(.p-autocomplete),
.ticket-details :deep(.p-autocomplete-input),
.ticket-details :deep(.p-tabs),
.ticket-details :deep(.p-tabpanels),
.ticket-details :deep(.p-timeline),
.ticket-details :deep(.p-togglebutton),
.ticket-details :deep(.p-select),
.ticket-details :deep(.p-multiselect) {
    max-width: 100%;
}

.ticket-details :deep(.p-tablist-tab-list) {
    flex-wrap: wrap;
}

.ticket-details :deep(.p-tab) {
    white-space: normal;
}

/* Адаптивность */
@media (max-width: 768px) {
    .call-details {
        grid-template-columns: 1fr;
    }

    .details-section,
    .add-comment-section,
    .attachment-card,
    .comment-card,
    .field-category {
        padding: 16px;
    }
    
    .user-card {
        flex-direction: column;
        text-align: center;
    }
    
    .user-details {
        justify-content: center;
    }
    
    .certificate-details {
        flex-direction: column;
        gap: 15px;
    }
    
    .certificate-count {
        border-left: none;
        border-top: 1px solid var(--p-grey-4);
        padding-left: 0;
        padding-top: 15px;
        width: 100%;
    }

    .participant-item {
        align-items: flex-start;
    }

    .comment-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .comment-actions {
        position: static;
        justify-content: flex-end;
        margin-top: 0.75rem;
    }

    .comment-textarea {
        padding-right: 12px;
    }

    .ticket-details {
        max-height: none;
        padding-right: 0;
    }
}

@media (max-width: 640px) {
    .field-grid {
        grid-template-columns: 1fr;
    }

    .attachment-chip {
        width: 100%;
        justify-content: space-between;
    }
}
</style>
