<template>
    <div
        class="file-dropzone"
        :class="{
            'file-dropzone-active': isDragActive,
            'file-dropzone-disabled': disabled,
            'file-dropzone-compact': compact,
        }"
        @click="openFileDialog"
        @dragover.prevent="onDragOver"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
    >
        <input
            ref="inputRef"
            type="file"
            class="file-dropzone-input"
            :accept="accept || undefined"
            :multiple="multiple"
            :disabled="disabled"
            @change="onInputChange"
        />

        <slot :is-drag-active="isDragActive" :open-file-dialog="openFileDialog">
            <div class="file-dropzone-copy">
                <i :class="icon"></i>
                <strong>{{ title }}</strong>
                <span>{{ isDragActive ? activeSubtitle : subtitle }}</span>
            </div>
        </slot>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
    accept: {
        type: String,
        default: '',
    },
    multiple: {
        type: Boolean,
        default: false,
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    compact: {
        type: Boolean,
        default: false,
    },
    icon: {
        type: String,
        default: 'pi pi-upload',
    },
    title: {
        type: String,
        default: 'Перетащите файлы сюда',
    },
    subtitle: {
        type: String,
        default: 'или нажмите, чтобы выбрать через проводник',
    },
    activeSubtitle: {
        type: String,
        default: 'Отпустите файлы для загрузки',
    },
});

const emit = defineEmits(['select']);
const inputRef = ref(null);
const isDragActive = ref(false);

const normalizeFiles = (fileList) => Array.from(fileList || []).filter(Boolean);

const resetInput = () => {
    if (inputRef.value) {
        inputRef.value.value = '';
    }
};

const openFileDialog = () => {
    if (props.disabled) return;
    inputRef.value?.click();
};

const emitSelectedFiles = (files = []) => {
    const normalizedFiles = normalizeFiles(files);
    if (!normalizedFiles.length) return;

    emit('select', normalizedFiles);
    resetInput();
};

const onInputChange = (event) => {
    emitSelectedFiles(event?.target?.files);
};

const onDragOver = () => {
    if (props.disabled) return;
    isDragActive.value = true;
};

const onDragLeave = (event) => {
    if (props.disabled) return;
    const nextTarget = event?.relatedTarget;
    if (nextTarget && event.currentTarget?.contains?.(nextTarget)) return;
    isDragActive.value = false;
};

const onDrop = (event) => {
    if (props.disabled) return;
    isDragActive.value = false;
    emitSelectedFiles(event?.dataTransfer?.files);
};

defineExpose({
    openFileDialog,
});
</script>

<style scoped>
.file-dropzone {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 8.5rem;
    padding: 1rem;
    border-radius: 18px;
    border: 1.5px dashed rgba(var(--p-blue-500-rgb), 0.22);
    background: linear-gradient(180deg, rgba(var(--p-blue-500-rgb), 0.05), rgba(var(--p-blue-500-rgb), 0.02));
    cursor: pointer;
    transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.file-dropzone:hover {
    border-color: rgba(var(--p-blue-500-rgb), 0.34);
    background: linear-gradient(180deg, rgba(var(--p-blue-500-rgb), 0.08), rgba(var(--p-blue-500-rgb), 0.03));
}

.file-dropzone-active {
    border-color: rgba(var(--p-green-500-rgb), 0.45);
    background: linear-gradient(180deg, rgba(var(--p-green-500-rgb), 0.12), rgba(var(--p-green-500-rgb), 0.05));
    transform: translateY(-1px);
}

.file-dropzone-disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.file-dropzone-compact {
    min-height: 6.25rem;
}

.file-dropzone-input {
    display: none;
}

.file-dropzone-copy {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.45rem;
    text-align: center;
    color: var(--p-text-color);
}

.file-dropzone-copy i {
    font-size: 1.6rem;
    color: var(--p-primary-color);
}

.file-dropzone-copy strong {
    font-size: 0.98rem;
}

.file-dropzone-copy span {
    color: var(--p-grey-1);
    line-height: 1.5;
}
</style>
