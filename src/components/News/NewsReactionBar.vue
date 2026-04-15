<template>
    <div class="reaction-bar">
        <button
            v-for="reaction in normalizedReactions"
            :key="reaction.emoji.id"
            type="button"
            class="reaction-chip"
            :class="{ active: reaction.isUserReact }"
            :disabled="busy"
            @click="$emit('toggle', reaction)"
        >
            <span class="reaction-emoji-shell">
                <span class="reaction-emoji">{{ reaction.emoji.code }}</span>
            </span>
            <span class="reaction-meta">
                <span class="reaction-count">{{ reaction.count }}</span>
            </span>
        </button>

        <button
            type="button"
            class="reaction-add-button"
            :disabled="busy || availableEmojiOptions.length === 0"
            @click="togglePicker"
        >
            <i class="pi pi-face-smile"></i>
            <span>Добавить</span>
        </button>

        <Popover ref="pickerRef" class="reaction-popover">
            <div class="reaction-picker">
                <div class="reaction-picker-head">Выберите реакцию</div>
                <div class="reaction-picker-grid">
                    <button
                        v-for="emoji in availableEmojiOptions"
                        :key="emoji.id"
                        type="button"
                        class="reaction-picker-item"
                        :class="{ active: emoji.isUserReact }"
                        :disabled="busy"
                        @click="onSelectEmoji(emoji.id)"
                    >
                        <span class="picker-emoji">{{ emoji.code }}</span>
                    </button>
                </div>
            </div>
        </Popover>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
    reactions: {
        type: Array,
        default: () => [],
    },
    emojis: {
        type: Array,
        default: () => [],
    },
    busy: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['toggle', 'add']);

const pickerRef = ref(null);

const normalizedReactions = computed(() => (
    Array.isArray(props.reactions) ? [...props.reactions] : []
).sort((left, right) => {
    if (left.isUserReact !== right.isUserReact) {
        return left.isUserReact ? -1 : 1;
    }

    return Number(right.count || 0) - Number(left.count || 0);
}));

const availableEmojiOptions = computed(() => props.emojis.map((emoji) => {
    const currentReaction = normalizedReactions.value.find((item) => item.emoji.id === emoji.id);

    return {
        id: emoji.id,
        code: emoji.code,
        isUserReact: Boolean(currentReaction?.isUserReact),
    };
}));

function togglePicker(event) {
    pickerRef.value?.toggle(event);
}

function onSelectEmoji(emojiId) {
    if (!emojiId) return;
    const option = availableEmojiOptions.value.find((item) => item.id === emojiId);
    if (option?.isUserReact) {
        pickerRef.value?.hide?.();
        return;
    }

    emit('add', emojiId);
    pickerRef.value?.hide?.();
}
</script>

<style scoped>
.reaction-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    align-items: center;
}

.reaction-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.35rem 0.7rem 0.35rem 0.35rem;
    border-radius: 999px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
    background: color-mix(in srgb, var(--p-bg-color-1) 80%, rgba(var(--p-blue-500-rgb), 0.08));
    color: var(--p-text-color);
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
    transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
}

.reaction-chip:hover:not(:disabled) {
    transform: translateY(-1px) scale(1.01);
    border-color: rgba(var(--p-blue-500-rgb), 0.24);
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.09);
}

.reaction-chip.active {
    background: rgba(var(--p-blue-500-rgb), 0.14);
    border-color: rgba(var(--p-blue-500-rgb), 0.34);
}

.reaction-chip:disabled {
    opacity: 0.65;
    cursor: wait;
}

.reaction-emoji-shell {
    width: 2rem;
    height: 2rem;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(var(--p-blue-500-rgb), 0.12);
    flex-shrink: 0;
}

.reaction-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    line-height: 1.05;
    gap: 0.15rem;
}

.reaction-emoji {
    font-size: 1.02rem;
}

.reaction-count {
    font-size: 0.85rem;
    font-weight: 600;
}

.reaction-label {
    font-size: 0.72rem;
    color: var(--p-text-muted-color, var(--p-grey-2));
}

.reaction-add-button {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.5rem 0.85rem;
    border-radius: 999px;
    border: 1px dashed rgba(var(--p-blue-500-rgb), 0.2);
    background: transparent;
    color: var(--p-text-color);
    transition: all 0.18s ease;
}

.reaction-add-button:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: rgba(var(--p-blue-500-rgb), 0.34);
    background: rgba(var(--p-blue-500-rgb), 0.06);
}

.reaction-add-button:disabled {
    opacity: 0.65;
}

.reaction-picker {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    min-width: 18rem;
    max-width: 22rem;
}

.reaction-picker-head {
    font-weight: 600;
    color: var(--p-text-color);
}

.reaction-picker-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.55rem;
}

.reaction-picker-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    padding: 0.8rem 0.45rem;
    border-radius: 18px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
    background: color-mix(in srgb, var(--p-bg-color-1) 88%, rgba(var(--p-blue-500-rgb), 0.05));
    color: var(--p-text-color);
    transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.reaction-picker-item:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: rgba(var(--p-blue-500-rgb), 0.28);
    background: rgba(var(--p-blue-500-rgb), 0.08);
}

.reaction-picker-item.active {
    border-color: rgba(var(--p-blue-500-rgb), 0.34);
    background: rgba(var(--p-blue-500-rgb), 0.14);
}

.picker-emoji {
    font-size: 1.2rem;
    line-height: 1;
}

.picker-name {
    font-size: 0.69rem;
    color: var(--p-text-muted-color, var(--p-grey-2));
    text-align: center;
}

@media (max-width: 640px) {
    .reaction-picker {
        min-width: 14rem;
    }

    .reaction-picker-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}
</style>
