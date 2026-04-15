<template>
    <div class="news-editor">
        <div class="editor-toolbar">
            <Button label="H2" text size="small" @click="wrapBlock('## ', '')" />
            <Button text size="small" @click="wrapInline('**', '**', 'жирный текст')">
                <svg viewBox="0 0 18 18"> <path class="ql-stroke" d="M5,4H9.5A2.5,2.5,0,0,1,12,6.5v0A2.5,2.5,0,0,1,9.5,9H5A0,0,0,0,1,5,9V4A0,0,0,0,1,5,4Z"></path> <path class="ql-stroke" d="M5,9h5.5A2.5,2.5,0,0,1,13,11.5v0A2.5,2.5,0,0,1,10.5,14H5a0,0,0,0,1,0,0V9A0,0,0,0,1,5,9Z"></path> </svg>
            </Button>
            <Button text size="small" @click="wrapInline('*', '*', 'курсив')">
                <div>
                    <svg viewBox="0 0 18 18"> <line class="ql-stroke" x1="7" x2="13" y1="4" y2="4"></line> <line class="ql-stroke" x1="5" x2="11" y1="14" y2="14"></line> <line class="ql-stroke" x1="8" x2="10" y1="14" y2="4"></line> </svg>
                </div>
            </Button>
            <Button icon="pi pi-list" text size="small" @click="insertLine('- пункт')" />
            <Button icon="pi pi-comments" text size="small" @click="insertLine('> цитата')" />
            <Button icon="pi pi-code" text size="small" @click="wrapInline('`', '`', 'код')" />
            <Button icon="pi pi-link" text size="small" @click="wrapInline('[ссылка](', ')', 'https://example.com')" />
            <Button
                v-if="allowMediaUpload"
                icon="pi pi-image"
                text
                size="small"
                :loading="uploading"
                :disabled="uploading"
                @click="openFileDialog"
            />
        </div>

        <input
            ref="fileInputRef"
            type="file"
            class="hidden-input"
            multiple
            @change="onFileSelected"
        />

        <div class="editor-layout">
            <div class="editor-source">
                <Textarea
                    ref="textareaRef"
                    :modelValue="modelValue"
                    :rows="rows"
                    autoResize
                    class="editor-textarea"
                    :placeholder="placeholder"
                    @update:modelValue="emit('update:modelValue', $event)"
                />

                <div v-if="allowMediaUpload && localMedia.length > 0" class="editor-media-list">
                    <div
                        v-for="media in localMedia"
                        :key="media.id"
                        class="media-chip"
                    >
                        <i class="pi pi-paperclip"></i>
                        <span>{{ media.title }}</span>
                    </div>
                </div>

                <div v-else-if="!allowMediaUpload && existingMediaNotice" class="editor-hint">
                    {{ existingMediaNotice }}
                </div>
            </div>

            <div class="editor-preview">
                <div class="preview-head">
                    <span>Предпросмотр</span>
                </div>
                <NewsMarkdownRenderer :markdown="modelValue" :mediaTypes="mediaTypes" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { getMediaTypes, normalizeMediaType, uploadMedia } from '@/api/news.js';
import { fileToBase64, insertAroundSelection, resolveMediaTypeId } from '@/utils/news.js';
import NewsMarkdownRenderer from '@/components/News/NewsMarkdownRenderer.vue';

const props = defineProps({
    modelValue: {
        type: String,
        default: '',
    },
    mediaIds: {
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

const textareaRef = ref(null);
const fileInputRef = ref(null);
const mediaTypes = ref([]);
const uploading = ref(false);
const localMedia = ref([]);

const normalizedMediaIds = computed(() => Array.isArray(props.mediaIds) ? props.mediaIds : []);

async function ensureMediaTypes() {
    if (mediaTypes.value.length > 0) return;

    const { data } = await getMediaTypes();
    mediaTypes.value = Array.isArray(data) ? data.map(normalizeMediaType) : [];
}

function updateTextareaValue(nextState) {
    emit('update:modelValue', nextState.value);

    nextTick(() => {
        const textarea = textareaRef.value?.$el?.querySelector('textarea') || textareaRef.value?.$el || textareaRef.value;
        if (!textarea) return;

        textarea.focus();
        textarea.setSelectionRange(nextState.selectionStart, nextState.selectionEnd);
    });
}

function getTextareaElement() {
    return textareaRef.value?.$el?.querySelector('textarea') || textareaRef.value?.$el || textareaRef.value;
}

function wrapInline(prefix, suffix, placeholder) {
    const textarea = getTextareaElement();
    updateTextareaValue(insertAroundSelection(textarea, prefix, suffix, placeholder));
}

function wrapBlock(prefix, suffix = '') {
    const textarea = getTextareaElement();
    updateTextareaValue(insertAroundSelection(textarea, prefix, suffix, 'подзаголовок'));
}

function insertLine(template) {
    const textarea = getTextareaElement();
    const nextState = insertAroundSelection(textarea, `${template}\n`, '', '');
    updateTextareaValue({
        ...nextState,
        selectionStart: nextState.selectionStart + template.length + 1,
        selectionEnd: nextState.selectionStart + template.length + 1,
    });
}

function openFileDialog() {
    fileInputRef.value?.click();
}

async function onFileSelected(event) {
    const files = Array.from(event.target?.files || []);
    if (files.length === 0) return;

    uploading.value = true;

    try {
        await ensureMediaTypes();

        const uploaded = [];

        for (const file of files) {
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
            const currentBody = String(props.modelValue || '').trimEnd();
            const mediaTokens = uploaded.map((item) => `media://${item.id}`).join('\n');
            const nextBody = currentBody ? `${currentBody}\n\n${mediaTokens}` : mediaTokens;

            localMedia.value = [...localMedia.value, ...uploaded];
            emit('update:modelValue', nextBody);
            emit('update:mediaIds', [...new Set([...normalizedMediaIds.value, ...uploaded.map((item) => item.id)])]);
        }
    } finally {
        if (fileInputRef.value) fileInputRef.value.value = '';
        uploading.value = false;
    }
}

watch(() => props.mediaIds, () => {
    localMedia.value = localMedia.value.filter((item) => normalizedMediaIds.value.includes(item.id));
}, { deep: true });
</script>

<style scoped>
.news-editor {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
}

.editor-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem;
    padding: 0.45rem;
    border-radius: 16px;
    background: rgba(var(--p-blue-500-rgb), 0.05);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
}

.editor-toolbar :deep(.p-button svg) {
    display: block;
    width: 1rem;
    height: 1rem;
}

.editor-toolbar :deep(.p-button .ql-stroke) {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.hidden-input {
    display: none;
}

.editor-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
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

.editor-textarea {
    width: 100%;
}

.editor-textarea :deep(textarea) {
    width: 100%;
    min-height: 300px;
    font-family: 'SFMono-Regular', ui-monospace, monospace;
    line-height: 1.6;
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
    padding: 0.48rem 0.7rem;
    border-radius: 999px;
    background: rgba(var(--p-blue-500-rgb), 0.08);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.14);
    font-size: 0.88rem;
}

.editor-hint {
    margin-top: 0.85rem;
    padding: 0.85rem 1rem;
    border-radius: 16px;
    background: rgba(245, 158, 11, 0.12);
    color: #9a6700;
    font-size: 0.92rem;
}

@media (max-width: 1100px) {
    .editor-layout {
        grid-template-columns: 1fr;
    }
}
</style>
