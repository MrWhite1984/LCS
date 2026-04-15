<template>
    <div class="news-markdown-renderer" :class="{ compact }">
        <div v-if="loading && mediaIds.length > 0" class="render-status">
            <ProgressSpinner style="width: 26px; height: 26px" strokeWidth="5" />
            <span>Загружаем медиа…</span>
        </div>
        <div class="news-markdown" v-html="html"></div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { extractNewsMediaIds, renderNewsMarkdown, createNewsMediaHtml } from '@/utils/news.js';
import { getMedia, normalizeMediaResponse } from '@/api/news.js';

const props = defineProps({
    markdown: {
        type: String,
        default: '',
    },
    mediaTypes: {
        type: Array,
        default: () => [],
    },
    compact: {
        type: Boolean,
        default: false,
    },
});

const mediaCache = new Map();
const loading = ref(false);
const mediaHtmlMap = ref({});

const mediaIds = computed(() => extractNewsMediaIds(props.markdown));

const html = computed(() => renderNewsMarkdown(props.markdown, mediaHtmlMap.value));

async function fetchMedia(mediaId) {
    if (!mediaId) return null;

    if (!mediaCache.has(mediaId)) {
        mediaCache.set(
            mediaId,
            getMedia(mediaId)
                .then(({ data }) => normalizeMediaResponse(data).media)
                .catch(() => null)
        );
    }

    return mediaCache.get(mediaId);
}

async function resolveMedia() {
    if (mediaIds.value.length === 0) {
        mediaHtmlMap.value = {};
        return;
    }

    loading.value = true;

    try {
        const entries = await Promise.all(mediaIds.value.map(async (mediaId) => {
            const media = await fetchMedia(mediaId);
            return [mediaId, createNewsMediaHtml(media, props.mediaTypes)];
        }));

        mediaHtmlMap.value = Object.fromEntries(entries);
    } finally {
        loading.value = false;
    }
}

watch(() => props.markdown, resolveMedia, { immediate: true });
watch(() => props.mediaTypes, resolveMedia, { deep: true });

onMounted(resolveMedia);
</script>

<style scoped>
.news-markdown-renderer {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    --news-compact-fade-color: color-mix(in srgb, var(--p-bg-color-1) 94%, transparent);
}

.render-status {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    color: var(--p-text-muted-color, var(--p-grey-2));
    font-size: 0.92rem;
}

.news-markdown {
    color: var(--p-text-color);
    line-height: 1.72;
    word-break: break-word;
}

.news-markdown :deep(*) {
    color: inherit;
}

.news-markdown :deep(h1),
.news-markdown :deep(h2),
.news-markdown :deep(h3),
.news-markdown :deep(h4),
.news-markdown :deep(h5),
.news-markdown :deep(h6) {
    margin: 1rem 0 0.55rem;
    line-height: 1.25;
}

.news-markdown :deep(p) {
    margin: 0 0 0.9rem;
}

.news-markdown :deep(ul),
.news-markdown :deep(ol) {
    margin: 0 0 1rem;
    padding-left: 1.4rem;
}

.news-markdown :deep(blockquote) {
    margin: 0 0 1rem;
    padding: 0.85rem 1rem;
    border-left: 4px solid rgba(var(--p-blue-500-rgb), 0.32);
    background: rgba(var(--p-blue-500-rgb), 0.06);
    border-radius: 0 16px 16px 0;
}

.news-markdown :deep(pre) {
    margin: 0 0 1rem;
    padding: 0.95rem 1rem;
    border-radius: 16px;
    background: rgba(15, 23, 42, 0.92);
    color: #e2e8f0;
    overflow: auto;
}

.news-markdown :deep(code) {
    font-family: 'SFMono-Regular', ui-monospace, monospace;
}

.news-markdown :deep(a) {
    color: var(--p-blue-500);
    text-decoration: none;
}

.news-markdown :deep(a:hover) {
    text-decoration: underline;
}

.news-markdown :deep(.news-media-figure) {
    margin: 1rem 0;
    padding: 0.85rem;
    border-radius: 20px;
    background: rgba(var(--p-blue-500-rgb), 0.04);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.1);
}

.news-markdown :deep(.news-media-image),
.news-markdown :deep(.news-media-video) {
    display: block;
    width: 100%;
    max-height: 420px;
    object-fit: contain;
    border-radius: 16px;
    background: rgba(15, 23, 42, 0.08);
}

.news-markdown :deep(.news-media-audio) {
    width: 100%;
}

.news-markdown :deep(.news-media-link) {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.75rem 1rem;
    border-radius: 16px;
    background: rgba(var(--p-blue-500-rgb), 0.08);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.14);
}

.news-markdown :deep(.news-media-placeholder) {
    display: inline-flex;
    padding: 0.35rem 0.7rem;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.18);
    color: #475569;
    font-size: 0.88rem;
}

.news-markdown :deep(.news-markdown-empty) {
    margin: 0;
    color: var(--p-text-muted-color, var(--p-grey-2));
}

.news-markdown :deep(figcaption) {
    margin-top: 0.65rem;
    color: var(--p-text-muted-color, var(--p-grey-2));
    font-size: 0.88rem;
}

.compact .news-markdown-renderer,
.news-markdown-renderer.compact {
    position: relative;
}

.news-markdown-renderer.compact .news-markdown {
    position: relative;
    max-height: 8.8rem;
    overflow: hidden;
}

.news-markdown-renderer.compact .news-markdown::after {
    content: "";
    position: absolute;
    inset: auto 0 0;
    height: 3.2rem;
    pointer-events: none;
    background: linear-gradient(
        180deg,
        transparent,
        var(--news-compact-fade-color)
    );
}
</style>
