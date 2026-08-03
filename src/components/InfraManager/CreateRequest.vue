<template>
    <div class="d-flex justify-content-center">
        <Button v-if="showButton" icon="pi pi-plus" @click="visible = true"/>
        <Dialog v-model:visible="visible" modal header="Создание заявки" :style="{ 'max-width': '32rem' }" class="create-request-dialog">
            <div class="request-form">
                <div class="row request-form-row">
                    <div class="col">
                        <label for="whoami">Для кого заявка?</label>
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
                <div class="row request-form-row">
                    <div class="col">
                        <label for="service">Сервис</label>
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
                <div class="row request-form-row">
                    <div class="col">
                        <label for="priority">Приоритет</label>
                        <InputText id="priority" readonly v-model="store.selectedPriority" class="form-input" placeholder="Выберите приоритет..." @click="toggle"/>
                        <Popover ref="op">
                            <PrioritySelect />
                        </Popover>
                    </div>
                </div>
                <div class="row request-form-row">
                    <div class="col">
                        <label for="shortDescriprion">Аудитория</label>
                        <InputText id="shortDescriprion" v-model="shortDescriprion" class="form-input" placeholder="Введите аудиторию..."/>
                    </div>
                </div>
                <div class="row request-form-row">
                    <div class="col">
                        <label for="inventoryNumber">Инвентарный номер</label>
                        <InputText
                            id="inventoryNumber"
                            v-model="inventoryNumber"
                            class="form-input"
                            placeholder="Введите инвентарный номер..."
                        />
                    </div>
                </div>
                <div class="row request-form-row">
                    <div class="col">
                        <label for="description">Краткое описание</label>
                        <Textarea id="descriprion" v-model="description" class="form-input" rows="4" placeholder="Введите описание..."/>
                    </div>
                </div>
                <div class="row request-form-row">
                    <div class="col">
                        <label>Файлы</label>
                        <FileDropzone
                            :disabled="isSubmitting"
                            :multiple="true"
                            compact
                            icon="pi pi-file-arrow-up"
                            title="Перетащите файлы сюда"
                            subtitle="или нажмите, чтобы выбрать через проводник"
                            active-subtitle="Отпустите файлы для загрузки"
                            @select="handleFilesSelected"
                        />

                        <div v-if="attachments.length" class="infra-attachments">
                            <div
                                v-for="attachment in attachments"
                                :key="attachment.localId"
                                class="infra-attachment-card"
                                :class="`infra-attachment-card-${attachment.status}`"
                            >
                                <div class="infra-attachment-head">
                                    <div class="infra-attachment-copy">
                                        <strong :title="attachment.fileName">{{ attachment.fileName }}</strong>
                                        <small>
                                            {{
                                                attachment.status === 'uploaded'
                                                    ? 'Загружен'
                                                    : attachment.status === 'uploading'
                                                        ? 'Загрузка...'
                                                        : attachment.status === 'error'
                                                            ? 'Ошибка загрузки'
                                                            : 'В очереди'
                                            }}
                                        </small>
                                    </div>

                                    <div class="infra-attachment-actions">
                                        <Button
                                            v-if="attachment.status === 'error'"
                                            icon="pi pi-refresh"
                                            text
                                            rounded
                                            severity="secondary"
                                            :disabled="isSubmitting"
                                            @click="retryAttachmentUpload(attachment.localId)"
                                        />
                                        <Button
                                            icon="pi pi-times"
                                            text
                                            rounded
                                            severity="danger"
                                            :disabled="isSubmitting || attachment.status === 'uploading'"
                                            @click="removeAttachment(attachment.localId)"
                                        />
                                    </div>
                                </div>

                                <ProgressBar
                                    v-if="attachment.status === 'uploading' || attachment.status === 'uploaded'"
                                    :mode="attachment.indeterminate ? 'indeterminate' : 'determinate'"
                                    :value="attachment.progress"
                                    :showValue="false"
                                    style="height: 6px"
                                />

                                <small v-if="attachment.errorMessage" class="infra-attachment-error">
                                    {{ attachment.errorMessage }}
                                </small>
                            </div>
                        </div>

                        <small v-if="attachments.length && hasUploadingAttachments" class="infra-attachment-hint">
                            Дождитесь загрузки всех файлов, прежде чем создавать заявку.
                        </small>
                        <small v-else-if="attachments.length && hasAttachmentErrors" class="infra-attachment-hint infra-attachment-hint-error">
                            Удалите файлы с ошибкой или повторите их загрузку.
                        </small>
                    </div>
                </div>
                <div class="row align-items-center justify-content-end request-form-actions">
                    <div class="col-auto">
                        <div class="create-call-action" @click="handleCreateClick">
                            <Button
                                text
                                label="Создать заявку"
                                severity="success"
                                :loading="isSubmitting"
                                :disabled="isSubmitting || isCreateBlocked"
                                @click="createCall"
                            />
                        </div>
                    </div>
                    <div class="col-auto">
                        <Button text label="Отмена" severity="danger" :disabled="isSubmitting" @click="handleCancel" />
                    </div>
                </div>
            </div>
        </Dialog>
    </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import axiosInstance from "@/utils/axios.js";
import PrioritySelect from '@/components/InfraManager/PrioritySelect.vue';
import FileDropzone from '@/components/Utils/FileDropzone.vue';
import { fileToBase64 } from '@/utils/ido.js';

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
const attachments = ref([]);
const isSubmitting = ref(false);

const store = usePriorityStore();
let attachmentSequence = 0;

const hasUploadingAttachments = computed(() => attachments.value.some((attachment) => (
    attachment.status === 'queued' || attachment.status === 'uploading'
)));
const hasAttachmentErrors = computed(() => attachments.value.some((attachment) => attachment.status === 'error'));
const isCreateBlocked = computed(() => hasUploadingAttachments.value || hasAttachmentErrors.value);

const createAttachmentRecord = (file) => ({
    localId: `attachment-${Date.now()}-${attachmentSequence += 1}`,
    file,
    fileName: file.name,
    status: 'queued',
    progress: 0,
    indeterminate: false,
    filePostfix: '',
    errorMessage: '',
});

const updateAttachment = (localId, patch) => {
    attachments.value = attachments.value.map((attachment) => (
        attachment.localId === localId ? { ...attachment, ...patch } : attachment
    ));
};

const buildUploadErrorMessage = (error) => {
    const detail = error?.response?.data?.message
        || error?.response?.data?.detail
        || error?.message;

    return detail ? `Не удалось загрузить файл: ${detail}` : 'Не удалось загрузить файл.';
};

const uploadAttachment = async (localId) => {
    const targetAttachment = attachments.value.find((attachment) => attachment.localId === localId);
    if (!targetAttachment?.file) return;

    updateAttachment(localId, {
        status: 'uploading',
        progress: 0,
        indeterminate: false,
        filePostfix: '',
        errorMessage: '',
    });

    try {
        const base64Content = await fileToBase64(targetAttachment.file);
        const response = await axiosInstance.post('/api/infra-manager/documents', {
            objectID: null,
            fileName: targetAttachment.fileName,
            content: base64Content,
        }, {
            onUploadProgress: (event) => {
                const hasTotal = Number(event?.total) > 0;
                const progress = hasTotal
                    ? Math.min(100, Math.max(0, Math.round((event.loaded / event.total) * 100)))
                    : 100;

                updateAttachment(localId, {
                    progress,
                    indeterminate: !hasTotal,
                });
            },
        });

        updateAttachment(localId, {
            status: 'uploaded',
            progress: 100,
            indeterminate: false,
            filePostfix: String(response.data || ''),
            errorMessage: '',
        });
    } catch (error) {
        updateAttachment(localId, {
            status: 'error',
            progress: 0,
            indeterminate: false,
            filePostfix: '',
            errorMessage: buildUploadErrorMessage(error),
        });
    }
};

const handleFilesSelected = async (files = []) => {
    const nextAttachments = files.map(createAttachmentRecord);
    attachments.value = [...attachments.value, ...nextAttachments];

    await Promise.all(nextAttachments.map((attachment) => uploadAttachment(attachment.localId)));
};

const removeAttachment = (localId) => {
    attachments.value = attachments.value.filter((attachment) => attachment.localId !== localId);
};

const retryAttachmentUpload = async (localId) => {
    await uploadAttachment(localId);
};

const notify = (severity, detail) => {
    window.dispatchEvent(new CustomEvent('toast', {
        detail: {
            severity,
            summary: 'Заявки',
            detail,
        },
    }));
};


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
    if (hasUploadingAttachments.value) {
        notify('warn', 'Дождитесь загрузки всех файлов');
        return;
    }

    if (hasAttachmentErrors.value) {
        notify('warn', 'Удалите файлы с ошибкой или повторите их загрузку');
        return;
    }

    try {
        isSubmitting.value = true;
        const payload = {
            userId: whoami.value.id,
            callSummaryName: shortDescriprion.value,
            htmlDescription: description.value,
            serviceItemId: serviceKey,
            urgencyId: store.selectedUrgencyId,
            priorityId: store.selectedPriorityId,
            inventoryNumber: inventoryNumber.value || null,
            influenceId: store.selecetedInfluenceId,
            callFiles: attachments.value
                .filter((attachment) => attachment.status === 'uploaded' && attachment.filePostfix)
                .map((attachment) => ({
                    fileName: attachment.fileName,
                    filePostfix: attachment.filePostfix,
                })),
        };
        const response = await axiosInstance.post('/api/infra-manager/calls/register', payload);
        const createdCallId = response.data.callId;

        visible.value = false;

        emit('refreshRequests', createdCallId);

        notify('success', 'Заявка успешно создана');
    } catch (error) {
        console.debug('Ошибка при создании: ', error);
        notify('error', 'Ошибка при создании заявки');
    } finally {
        isSubmitting.value = false;
    }
};

const handleCreateClick = () => {
    if (isSubmitting.value) return;
    if (hasUploadingAttachments.value) {
        notify('warn', 'Дождитесь загрузки всех файлов');
        return;
    }

    if (hasAttachmentErrors.value) {
        notify('warn', 'Удалите файлы с ошибкой или повторите их загрузку');
    }
};

watch(whoami, fetchServices);
watch(visible, (nextVisible) => {
    if (!nextVisible && !isSubmitting.value) {
        resetForm();
    }
});

const resetForm = () => {
    whoami.value = '';
    selectedService.value = null;
    shortDescriprion.value = '';
    inventoryNumber.value = '';
    description.value = '';
    store.selectedPriority = null;
    attachments.value = [];
    serviceKey = '';
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
.request-form {
    padding: 0.75rem 0.9rem 0.9rem;
}
.request-form-row {
    margin-bottom: 0.8rem;
}
.request-form label {
    display: block;
    margin: 0 0 0.35rem;
    padding: 0;
    font-size: 0.9rem;
    font-weight: 600;
}
.request-form-actions {
    margin-top: -0.1rem;
}
:deep(.create-request-dialog .p-dialog-header) {
    padding: 1rem 1.1rem 0.55rem;
}
:deep(.create-request-dialog .p-dialog-content) {
    padding: 0;
}
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
.create-call-action {
    display: inline-flex;
}
.infra-attachments {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 0.9rem;
}
.infra-attachment-card {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 0.85rem 0.95rem;
    border-radius: 14px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
    background: rgba(var(--p-blue-500-rgb), 0.04);
}
.infra-attachment-card-uploaded {
    border-color: rgba(var(--p-green-500-rgb), 0.24);
    background: rgba(var(--p-green-500-rgb), 0.06);
}
.infra-attachment-card-error {
    border-color: rgba(var(--p-red-500-rgb), 0.24);
    background: rgba(var(--p-red-500-rgb), 0.05);
}
.infra-attachment-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
}
.infra-attachment-copy {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}
.infra-attachment-copy strong,
.infra-attachment-copy small {
    overflow-wrap: anywhere;
}
.infra-attachment-copy small,
.infra-attachment-hint {
    color: var(--p-grey-1);
}
.infra-attachment-actions {
    display: flex;
    align-items: center;
    gap: 0.15rem;
    flex-shrink: 0;
}
.infra-attachment-error,
.infra-attachment-hint-error {
    color: var(--p-red-500);
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
