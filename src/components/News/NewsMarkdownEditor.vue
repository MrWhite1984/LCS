<template>
    <div class="news-editor">
        <div class="editor-toolbar-shell">
            <Editor
                v-model="editorHtml"
                :placeholder="placeholder"
                :editorStyle="`height: ${editorHeight}`"
                class="news-quill-editor"
                @load="onEditorLoad"
                @text-change="syncMarkdownFromEditor"
            >
                <template #toolbar>
                    <span class="ql-formats">
                        <select class="ql-header" :value="''">
                            <option value="2">H2</option>
                            <option value="">Текст</option>
                        </select>
                        <button class="ql-bold" type="button"></button>
                        <button class="ql-italic" type="button"></button>
                        <button class="ql-strike" type="button"></button>
                        <button class="ql-blockquote" type="button"></button>
                        <button class="ql-code-block" type="button"></button>
                        <button class="ql-link" type="button"></button>
                        <button class="ql-list" value="ordered" type="button"></button>
                        <button class="ql-list" value="bullet" type="button"></button>
                    </span>
                </template>
            </Editor>
        </div>

        <FileDropzone
            v-if="allowMediaUpload"
            class="editor-dropzone"
            multiple
            :disabled="uploading"
            icon="pi pi-images"
            title="Перетащите медиафайлы сюда"
            subtitle="или нажмите, чтобы выбрать файлы через проводник"
            active-subtitle="Отпустите файлы для загрузки в редактор"
            compact
            @select="onFilesSelected"
        />

        <div v-if="showMediaPanel" class="editor-layout">
            <div class="editor-source">
                <div v-if="mediaItems.length > 0" class="editor-media-list">
                    <div
                        v-for="media in mediaItems"
                        :key="media.id"
                        class="media-chip"
                    >
                        <i class="pi pi-paperclip"></i>
                        <span>{{ media.title }}</span>
                        <Button
                            icon="pi pi-times"
                            text
                            rounded
                            size="small"
                            severity="secondary"
                            :loading="removingMediaIds.includes(media.id)"
                            :disabled="removingMediaIds.includes(media.id)"
                            :aria-label="`Удалить ${media.title}`"
                            @click="removeMediaItem(media.id)"
                        />
                    </div>
                </div>

                <div v-else-if="existingMediaNotice" class="editor-hint">
                    {{ existingMediaNotice }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import {
    deleteMedia,
    getMedia,
    getMediaTypes,
    normalizeMediaResponse,
    normalizeMediaType,
    uploadMedia,
} from '@/api/news.js';
import {
    editorHtmlToNewsMarkdown,
    fileToBase64,
    markdownToNewsEditorHtml,
    normalizeNewsMediaIds,
    resolveMediaTypeId,
} from '@/utils/news.js';
import { attachPlainTextPasteToQuill } from '@/utils/faqHtml.js';
import FileDropzone from '@/components/Utils/FileDropzone.vue';

const props = defineProps({
    modelValue: {
        type: String,
        default: '',
    },
    mediaIds: {
        type: Array,
        default: () => [],
    },
    initialMediaIds: {
        type: Array,
        default: () => [],
    },
    placeholder: {
        type: String,
        default: 'Напишите текст…',
    },
    rows: {
        type: Number,
        default: 14,
    },
    allowMediaUpload: {
        type: Boolean,
        default: true,
    },
    existingMediaNotice: {
        type: String,
        default: '',
    },
});

const emit = defineEmits(['update:modelValue', 'update:mediaIds']);

const mediaTypes = ref([]);
const uploading = ref(false);
const knownMedia = ref({});
const removingMediaIds = ref([]);
const editorHtml = ref(markdownToNewsEditorHtml(props.modelValue));
const detachPasteHandler = ref(() => {});
const isSyncingEditor = ref(false);

const normalizedMediaIds = computed(() => normalizeNewsMediaIds(props.mediaIds));
const initialMediaIdSet = computed(() => new Set(normalizeNewsMediaIds(props.initialMediaIds)));
const editorHeight = computed(() => `${Math.max(Number(props.rows || 14) * 22, 240)}px`);
const mediaItems = computed(() => normalizedMediaIds.value.map((mediaId) => (
    knownMedia.value[mediaId] || {
        id: mediaId,
        title: 'Медиафайл',
    }
)));
const showMediaPanel = computed(() => mediaItems.value.length > 0 || Boolean(props.existingMediaNotice));

async function ensureMediaTypes() {
    if (mediaTypes.value.length > 0) return;

    const { data } = await getMediaTypes();
    mediaTypes.value = Array.isArray(data) ? data.map(normalizeMediaType) : [];
}

async function ensureMediaDetails(mediaIds = []) {
    const missingMediaIds = mediaIds.filter((mediaId) => !knownMedia.value[mediaId]);
    if (missingMediaIds.length === 0) return;

    const entries = await Promise.all(missingMediaIds.map(async (mediaId) => {
        try {
            const { data } = await getMedia(mediaId);
            const media = normalizeMediaResponse(data).media;

            return [mediaId, {
                id: mediaId,
                title: media?.title || 'Медиафайл',
            }];
        } catch {
            return [mediaId, {
                id: mediaId,
                title: 'Медиафайл',
            }];
        }
    }));

    knownMedia.value = {
        ...knownMedia.value,
        ...Object.fromEntries(entries),
    };
}

function syncMarkdownFromEditor() {
    if (isSyncingEditor.value) return;
    emit('update:modelValue', editorHtmlToNewsMarkdown(editorHtml.value));
}

function onEditorLoad(quill) {
    detachPasteHandler.value?.();
    detachPasteHandler.value = attachPlainTextPasteToQuill(quill);
}

async function onFilesSelected(files) {
    const normalizedFiles = Array.from(files || []);
    const filesToUpload = normalizedFiles.filter(Boolean);
    if (filesToUpload.length === 0) return;

    uploading.value = true;

    try {
        await ensureMediaTypes();

        const uploaded = [];

        for (const file of filesToUpload) {
            const content = await fileToBase64(file);
            const typeId = resolveMediaTypeId(file, mediaTypes.value);
            const { data } = await uploadMedia({
                title: file.name,
                typeId,
                content,
            });

            const mediaId = String(data || '').trim();
            if (!mediaId) continue;

            uploaded.push({
                id: mediaId,
                title: file.name,
            });
        }

        if (uploaded.length > 0) {
            knownMedia.value = {
                ...knownMedia.value,
                ...Object.fromEntries(uploaded.map((item) => [item.id, item])),
            };
            emit('update:mediaIds', [...new Set([...normalizedMediaIds.value, ...uploaded.map((item) => item.id)])]);
        }
    } finally {
        uploading.value = false;
    }
}

async function removeMediaItem(mediaId) {
    if (!mediaId || removingMediaIds.value.includes(mediaId)) return;

    const shouldDeleteImmediately = !initialMediaIdSet.value.has(mediaId);
    removingMediaIds.value = [...removingMediaIds.value, mediaId];

    try {
        if (shouldDeleteImmediately) {
            await deleteMedia(mediaId);
        }

        const nextMediaIds = normalizedMediaIds.value.filter((item) => item !== mediaId);
        emit('update:mediaIds', nextMediaIds);
    } finally {
        removingMediaIds.value = removingMediaIds.value.filter((item) => item !== mediaId);
    }
}

watch(
    normalizedMediaIds,
    (mediaIds) => {
        ensureMediaDetails(mediaIds);
    },
    { immediate: true }
);

watch(
    () => props.modelValue,
    (value) => {
        const nextHtml = markdownToNewsEditorHtml(value);
        if (nextHtml === editorHtml.value) return;

        isSyncingEditor.value = true;
        editorHtml.value = nextHtml;
        queueMicrotask(() => {
            isSyncingEditor.value = false;
        });
    },
    { immediate: true }
);

onBeforeUnmount(() => {
    detachPasteHandler.value?.();
});
</script>

<style scoped>
.news-editor {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
}

.editor-toolbar-shell {
    border-radius: 22px;
    overflow: hidden;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.1);
    background: var(--p-bg-color-1);
}

.news-quill-editor :deep(.ql-toolbar.ql-snow) {
    border: none;
    border-bottom: 1px solid rgba(var(--p-blue-500-rgb), 0.1);
    background: rgba(var(--p-blue-500-rgb), 0.04);
}

.news-quill-editor :deep(.ql-container.ql-snow) {
    border: none;
}

.news-quill-editor :deep(.ql-editor) {
    line-height: 1.65;
    font-size: 1rem;
}

.editor-layout {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    gap: 1rem;
}

.editor-source,
.editor-preview {
    min-width: 0;
    padding: 1rem;
    border-radius: 22px;
    background: var(--p-bg-color-1);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.1);
}

.editor-dropzone {
    margin-top: 0.1rem;
}

.preview-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.85rem;
    font-weight: 600;
}

.editor-media-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    margin-top: 0.85rem;
}

.media-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.38rem 0.45rem 0.38rem 0.7rem;
    border-radius: 999px;
    background: rgba(var(--p-blue-500-rgb), 0.08);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.14);
    font-size: 0.88rem;
}

.editor-hint {
    padding: 0.85rem 1rem;
    border-radius: 16px;
    background: rgba(var(--p-blue-500-rgb), 0.08);
    color: var(--p-text-color);
    font-size: 0.92rem;
}

@media (max-width: 1100px) {
    .editor-layout {
        grid-template-columns: 1fr;
    }
}
</style>
