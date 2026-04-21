<template>
    <article class="comment-card" :class="{ deleted: localComment.isSoftDeleted }">
        <div class="comment-head">
            <div>
                <strong>{{ authorName }}</strong>
                <span class="comment-date">{{ formattedDate }}</span>
            </div>
            <span v-if="localComment.isSoftDeleted" class="comment-state">Удалено</span>
        </div>

        <div class="comment-body">
            <NewsMarkdownRenderer
                v-if="!localComment.isSoftDeleted"
                :markdown="localComment.body"
                :mediaTypes="mediaTypes"
            />
            <p v-else class="deleted-text">Комментарий удалён</p>
        </div>

        <div class="comment-actions">
            <div class="comment-buttons">
                <Button
                    v-if="canEdit"
                    icon="pi pi-pencil"
                    text
                    size="small"
                    rounded
                    aria-label="Редактировать комментарий"
                    @click="openEdit"
                />
                <Button
                    v-if="!localComment.isSoftDeleted"
                    icon="pi pi-reply"
                    text
                    size="small"
                    rounded
                    aria-label="Ответить"
                    @click="replyOpen = !replyOpen"
                />
                <Button
                    v-if="canDelete"
                    icon="pi pi-trash"
                    text
                    size="small"
                    rounded
                    severity="danger"
                    aria-label="Удалить комментарий"
                    :loading="deleting"
                    :disabled="deleting || localComment.isSoftDeleted"
                    @click="removeComment"
                />
                <button
                    v-if="localComment.hasChildren"
                    type="button"
                    class="replies-toggle-button"
                    :aria-label="repliesExpanded ? 'Скрыть ответы' : 'Показать ответы'"
                    :disabled="loadingReplies"
                    @click="toggleReplies"
                >
                    <i class="pi pi-comments"></i>
                    <span v-if="visibleReplyCount > 0" class="replies-count">{{ visibleReplyCount }}</span>
                </button>
            </div>
        </div>

        <div v-if="editOpen" class="reply-form">
            <NewsMarkdownEditor
                v-model="editBody"
                v-model:mediaIds="editMediaIds"
                :initial-media-ids="editInitialMediaIds"
                :rows="8"
                placeholder="Измените комментарий…"
            />
            <div class="reply-actions">
                <Button
                    label="Отмена"
                    severity="secondary"
                    outlined
                    @click="closeEdit"
                />
                <Button
                    label="Сохранить"
                    :loading="editSubmitting"
                    :disabled="editSubmitting || isEditEmpty"
                    @click="submitEdit"
                />
            </div>
        </div>

        <div v-if="replyOpen" class="reply-form">
            <NewsMarkdownEditor
                v-model="replyBody"
                v-model:mediaIds="replyMediaIds"
                :rows="8"
                placeholder="Ответьте на комментарий…"
            />
            <div class="reply-actions">
                <Button
                    label="Отмена"
                    severity="secondary"
                    outlined
                    @click="closeReply"
                />
                <Button
                    label="Отправить"
                    :loading="replySubmitting"
                    :disabled="replySubmitting || isReplyEmpty"
                    @click="submitReply"
                />
            </div>
        </div>

        <div v-if="repliesExpanded" class="reply-list">
            <NewsCommentTree
                v-for="reply in replies"
                :key="reply.id"
                :comment="reply"
                :post-id="postId"
                :emojis="emojis"
                :media-types="mediaTypes"
                :current-user-id="currentUserId"
                :is-admin="isAdmin"
            />

            <Button
                v-if="repliesPage < repliesPageCount"
                label="Загрузить ещё ответы"
                text
                size="small"
                :loading="loadingReplies"
                @click="loadReplies(repliesPage + 1)"
            />
        </div>
    </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { formatDateRuLongWithTime } from '@/utils/date.js';
import { buildNewsMarkdown, formatNewsAuthorName, splitNewsMarkdown } from '@/utils/news.js';
import {
    addMediaToComment,
    deleteMedia,
    NEWS_COMMENT_PAGE_SIZE,
    createCommentToComment,
    getComments,
    normalizeCommentsResponse,
    normalizeComment,
    softDeleteComment,
    updateComment,
} from '@/api/news.js';
import NewsMarkdownEditor from '@/components/News/NewsMarkdownEditor.vue';
import NewsMarkdownRenderer from '@/components/News/NewsMarkdownRenderer.vue';

defineOptions({
    name: 'NewsCommentTree',
});

const confirm = useConfirm();

const props = defineProps({
    comment: {
        type: Object,
        required: true,
    },
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

const localComment = ref(normalizeComment(props.comment));
const replies = ref([]);
const repliesExpanded = ref(false);
const repliesPage = ref(1);
const repliesPageCount = ref(0);
const loadingReplies = ref(false);
const deleting = ref(false);
const replyOpen = ref(false);
const replyBody = ref('');
const replyMediaIds = ref([]);
const replySubmitting = ref(false);
const editOpen = ref(false);
const editBody = ref('');
const editMediaIds = ref([]);
const editInitialMediaIds = ref([]);
const editSubmitting = ref(false);

const authorName = computed(() => formatNewsAuthorName(localComment.value.author, 'Пользователь'));
const formattedDate = computed(() => formatDateRuLongWithTime(localComment.value.createdAt, ''));
const canDelete = computed(() => {
    if (!props.currentUserId) return props.isAdmin;
    return props.isAdmin || props.currentUserId === localComment.value.author.id;
});
const canEdit = computed(() => !localComment.value.isSoftDeleted && canDelete.value);
const isReplyEmpty = computed(() => !String(replyBody.value || '').trim() && replyMediaIds.value.length === 0);
const isEditEmpty = computed(() => !String(editBody.value || '').trim() && editMediaIds.value.length === 0);
const visibleReplyCount = computed(() => replies.value.length);

watch(() => props.comment, (value) => {
    localComment.value = normalizeComment(value);
}, { deep: true });

async function loadReplies(page = 1, reset = false) {
    loadingReplies.value = true;

    try {
        const { data } = await getComments(props.postId, {
            parentCommentId: localComment.value.id,
            page,
            pageSize: NEWS_COMMENT_PAGE_SIZE,
        });
        const payload = normalizeCommentsResponse(data);

        replies.value = reset ? payload.comments : [...replies.value, ...payload.comments];
        repliesPage.value = page;
        repliesPageCount.value = payload.pageCount;
    } finally {
        loadingReplies.value = false;
    }
}

async function toggleReplies() {
    if (repliesExpanded.value) {
        repliesExpanded.value = false;
        return;
    }

    repliesExpanded.value = true;

    if (replies.value.length === 0) {
        await loadReplies(1, true);
    }
}

function closeReply() {
    replyOpen.value = false;
    replyBody.value = '';
    replyMediaIds.value = [];
}

function openEdit() {
    const parsedBody = splitNewsMarkdown(localComment.value.body);
    editBody.value = parsedBody.text;
    editMediaIds.value = parsedBody.mediaIds;
    editInitialMediaIds.value = parsedBody.mediaIds;
    editOpen.value = true;
    replyOpen.value = false;
}

function closeEdit() {
    editOpen.value = false;
    editBody.value = '';
    editMediaIds.value = [];
    editInitialMediaIds.value = [];
}

async function submitReply() {
    if (isReplyEmpty.value || replySubmitting.value) return;

    replySubmitting.value = true;

    try {
        await createCommentToComment(props.postId, {
            body: String(replyBody.value || '').trim(),
            parentCommentId: localComment.value.id,
            mediaIds: replyMediaIds.value,
        });

        replyOpen.value = false;
        replyBody.value = '';
        replyMediaIds.value = [];
        repliesExpanded.value = true;
        localComment.value = {
            ...localComment.value,
            hasChildren: true,
        };
        await loadReplies(1, true);
    } finally {
        replySubmitting.value = false;
    }
}

async function submitEdit() {
    if (isEditEmpty.value || editSubmitting.value) return;

    editSubmitting.value = true;

    try {
        const nextBody = String(editBody.value || '').trim();
        const nextMediaIds = [...editMediaIds.value];
        const mediaIdsToAdd = nextMediaIds.filter((id) => !editInitialMediaIds.value.includes(id));
        const mediaIdsToDelete = editInitialMediaIds.value.filter((id) => !nextMediaIds.includes(id));

        await updateComment(localComment.value.id, nextBody);

        if (mediaIdsToAdd.length > 0) {
            await addMediaToComment(localComment.value.id, mediaIdsToAdd, localComment.value.author.id);
        }

        if (mediaIdsToDelete.length > 0) {
            await Promise.all(mediaIdsToDelete.map((mediaId) => deleteMedia(mediaId)));
        }

        localComment.value = {
            ...localComment.value,
            body: buildNewsMarkdown(editBody.value, editMediaIds.value),
        };
        closeEdit();
    } finally {
        editSubmitting.value = false;
    }
}

async function removeComment() {
    if (deleting.value || localComment.value.isSoftDeleted) return;
    confirm.require({
        message: 'Удалить комментарий?',
        header: 'Удаление комментария',
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'Отмена',
            severity: 'secondary',
            outlined: true,
        },
        acceptProps: {
            label: 'Удалить',
            severity: 'danger',
        },
        accept: async () => {
            deleting.value = true;

            try {
                const shouldUseSu = props.isAdmin && props.currentUserId !== localComment.value.author.id;
                await softDeleteComment(localComment.value.id, { su: shouldUseSu });
                localComment.value = {
                    ...localComment.value,
                    body: '',
                    isSoftDeleted: true,
                };
            } finally {
                deleting.value = false;
            }
        },
    });
}
</script>

<style scoped>
.comment-card {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding: 1rem;
    border-radius: 18px;
    background: rgba(var(--p-blue-500-rgb), 0.035);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.08);
}

.comment-card.deleted {
    opacity: 0.82;
}

.comment-head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
}

.comment-date,
.comment-state {
    margin-left: 0.65rem;
    font-size: 0.85rem;
    color: var(--p-text-muted-color, var(--p-grey-2));
}

.deleted-text {
    margin: 0;
    color: var(--p-text-muted-color, var(--p-grey-2));
}

.comment-actions,
.comment-buttons,
.reply-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
}

.comment-buttons {
    justify-content: flex-end;
}

.replies-toggle-button {
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
    min-height: 2rem;
    padding: 0.3rem 0.55rem;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: var(--p-text-color);
    transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.replies-toggle-button:hover:not(:disabled) {
    background: rgba(var(--p-blue-500-rgb), 0.08);
    transform: translateY(-1px);
}

.replies-toggle-button:disabled {
    opacity: 0.65;
    cursor: wait;
}

.replies-count {
    min-width: 1.25rem;
    height: 1.25rem;
    padding: 0 0.3rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: rgba(var(--p-blue-500-rgb), 0.14);
    color: var(--p-text-color);
    font-size: 0.74rem;
    font-weight: 700;
    line-height: 1;
}

.reply-form {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding: 1rem;
    border-radius: 18px;
    background: rgba(var(--p-blue-500-rgb), 0.05);
}

.reply-list {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding-left: 1rem;
    border-left: 2px solid rgba(var(--p-blue-500-rgb), 0.12);
}
</style>
