<template>
    <section class="comments-panel">
        <header class="comments-head">
            <div>
                <h4>Комментарии</h4>
                <p>Ответы подгружаются по мере раскрытия веток</p>
            </div>
            <Button
                icon="pi pi-refresh"
                outlined
                severity="secondary"
                :loading="loading"
                :disabled="loading"
                @click="loadComments(1, true)"
            />
        </header>

        <div class="comment-form">
            <NewsMarkdownEditor
                v-model="body"
                v-model:mediaIds="mediaIds"
                :rows="8"
                placeholder="Напишите комментарий…"
            />
            <div class="comment-form-actions">
                <Button
                    label="Очистить"
                    outlined
                    severity="secondary"
                    @click="clearForm"
                />
                <Button
                    label="Отправить комментарий"
                    :loading="submitting"
                    :disabled="submitting || isEmpty"
                    @click="submitComment"
                />
            </div>
        </div>

        <div v-if="loading && comments.length === 0" class="comments-loading">
            <ProgressSpinner style="width: 34px; height: 34px" strokeWidth="5" />
            <span>Загружаем комментарии…</span>
        </div>

        <div v-else-if="comments.length === 0" class="comments-empty">
            Пока комментариев нет. Будьте первым.
        </div>

        <div v-else class="comment-list">
            <NewsCommentTree
                v-for="comment in comments"
                :key="comment.id"
                :comment="comment"
                :post-id="postId"
                :emojis="emojis"
                :media-types="mediaTypes"
                :current-user-id="currentUserId"
                :is-admin="isAdmin"
            />

            <Button
                v-if="page < pageCount"
                label="Загрузить ещё комментарии"
                text
                :loading="loading"
                @click="loadComments(page + 1)"
            />
        </div>
    </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import {
    NEWS_COMMENT_PAGE_SIZE,
    createCommentToPost,
    getComments,
    normalizeCommentsResponse,
} from '@/api/news.js';
import NewsCommentTree from '@/components/News/NewsCommentTree.vue';
import NewsMarkdownEditor from '@/components/News/NewsMarkdownEditor.vue';

const props = defineProps({
    postId: {
        type: String,
        required: true,
    },
    emojis: {
        type: Array,
        default: () => [],
    },
    mediaTypes: {
        type: Array,
        default: () => [],
    },
    currentUserId: {
        type: String,
        default: '',
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
});

const comments = ref([]);
const page = ref(1);
const pageCount = ref(0);
const loading = ref(false);
const submitting = ref(false);
const body = ref('');
const mediaIds = ref([]);

const isEmpty = computed(() => !String(body.value || '').trim() && mediaIds.value.length === 0);

async function loadComments(nextPage = 1, reset = false) {
    loading.value = true;

    try {
        const { data } = await getComments(props.postId, {
            page: nextPage,
            pageSize: NEWS_COMMENT_PAGE_SIZE,
        });
        const payload = normalizeCommentsResponse(data);

        comments.value = reset ? payload.comments : [...comments.value, ...payload.comments];
        page.value = nextPage;
        pageCount.value = payload.pageCount;
    } finally {
        loading.value = false;
    }
}

function clearForm() {
    body.value = '';
    mediaIds.value = [];
}

async function submitComment() {
    if (isEmpty.value || submitting.value) return;

    submitting.value = true;

    try {
        await createCommentToPost(props.postId, {
            body: String(body.value || '').trim(),
            mediaIds: mediaIds.value,
        });
        clearForm();
        await loadComments(1, true);
    } finally {
        submitting.value = false;
    }
}

onMounted(() => {
    loadComments(1, true);
});
</script>

<style scoped>
.comments-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.comments-head,
.comment-form-actions {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    flex-wrap: wrap;
}

.comments-head h4 {
    margin: 0;
}

.comments-head p {
    margin: 0.35rem 0 0;
    color: var(--p-text-muted-color, var(--p-grey-2));
}

.comment-form {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding: 1rem;
    border-radius: 22px;
    background: rgba(var(--p-blue-500-rgb), 0.03);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.09);
}

.comments-loading,
.comments-empty {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 18px;
    background: rgba(var(--p-blue-500-rgb), 0.04);
    color: var(--p-text-muted-color, var(--p-grey-2));
}

.comment-list {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
}
</style>
