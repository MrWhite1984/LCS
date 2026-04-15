<template>
    <article class="news-card" :class="{ expanded }">
        <div class="card-head">
            <div class="card-copy">
                <div class="meta-line">
                    <span class="author">{{ authorName }}</span>
                    <span>{{ createdAt }}</span>
                    <span>{{ post.viewsCount }} просмотров</span>
                </div>
                <h3>{{ post.title }}</h3>
                <div class="tag-list">
                    <button
                        v-for="tag in post.tags"
                        :key="tag.id"
                        type="button"
                        class="tag-chip"
                        @click="$emit('tag-click', tag)"
                    >
                        #{{ tag.name }}
                    </button>
                </div>
            </div>

            <div class="card-actions">
                <Button
                    v-if="showBookmarkAction"
                    :icon="bookmarked ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'"
                    text
                    rounded
                    :aria-label="bookmarked ? 'В закладках' : 'Добавить в закладки'"
                    @click="$emit('bookmark', post)"
                />
                <Button
                    :label="expanded ? 'Свернуть' : 'Читать'"
                    :icon="expanded ? 'pi pi-angle-up' : 'pi pi-angle-down'"
                    @click="$emit('toggle', post)"
                />
            </div>
        </div>

        <div v-if="!expanded" class="excerpt">
            <NewsMarkdownRenderer
                :markdown="post.body"
                :mediaTypes="mediaTypes"
                compact
            />
        </div>

        <div v-else class="card-body">
            <NewsMarkdownRenderer :markdown="post.body" :mediaTypes="mediaTypes" />

            <div class="card-reactions">
                <NewsReactionBar
                    :reactions="localPost.emojiReactions"
                    :emojis="emojis"
                    :busy="reactionBusy"
                    @toggle="toggleReaction"
                    @add="addReaction"
                />
            </div>

            <NewsCommentsPanel
                :post-id="post.id"
                :emojis="emojis"
                :media-types="mediaTypes"
                :current-user-id="currentUserId"
                :is-admin="isAdmin"
            />
        </div>
    </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { formatDateRuLongWithTime } from '@/utils/date.js';
import { formatNewsAuthorName } from '@/utils/news.js';
import { addPostReaction, deleteReaction, normalizePost } from '@/api/news.js';
import NewsCommentsPanel from '@/components/News/NewsCommentsPanel.vue';
import NewsMarkdownRenderer from '@/components/News/NewsMarkdownRenderer.vue';
import NewsReactionBar from '@/components/News/NewsReactionBar.vue';

const props = defineProps({
    post: {
        type: Object,
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
    expanded: {
        type: Boolean,
        default: false,
    },
    bookmarked: {
        type: Boolean,
        default: false,
    },
    showBookmarkAction: {
        type: Boolean,
        default: true,
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

const emit = defineEmits(['toggle', 'bookmark', 'tag-click']);

const localPost = ref(normalizePost(props.post));
const reactionBusy = ref(false);

const authorName = computed(() => formatNewsAuthorName(localPost.value.author));
const createdAt = computed(() => formatDateRuLongWithTime(localPost.value.createdAt, ''));

watch(() => props.post, (value) => {
    localPost.value = normalizePost(value);
}, { deep: true });

function upsertReaction(emojiId, isActive) {
    const nextReactions = [...localPost.value.emojiReactions];
    const index = nextReactions.findIndex((item) => item.emoji.id === emojiId);

    if (index === -1 && isActive) {
        const emoji = props.emojis.find((item) => item.id === emojiId);
        if (emoji) {
            nextReactions.push({
                emoji,
                count: 1,
                isUserReact: true,
            });
        }
    } else if (index !== -1) {
        const current = nextReactions[index];
        const nextCount = current.count + (isActive ? 1 : -1);

        if (nextCount <= 0) {
            nextReactions.splice(index, 1);
        } else {
            nextReactions[index] = {
                ...current,
                count: nextCount,
                isUserReact: isActive,
            };
        }
    }

    localPost.value = {
        ...localPost.value,
        emojiReactions: nextReactions,
    };
}

async function toggleReaction(reaction) {
    if (!reaction?.emoji?.id || reactionBusy.value) return;

    reactionBusy.value = true;

    try {
        if (reaction.isUserReact) {
            await deleteReaction({
                postId: localPost.value.id,
                emojiId: reaction.emoji.id,
            });
            upsertReaction(reaction.emoji.id, false);
        } else {
            await addPostReaction(localPost.value.id, reaction.emoji.id);
            upsertReaction(reaction.emoji.id, true);
        }
    } finally {
        reactionBusy.value = false;
    }
}

async function addReaction(emojiId) {
    if (!emojiId || reactionBusy.value) return;

    const current = localPost.value.emojiReactions.find((item) => item.emoji.id === emojiId);
    if (current?.isUserReact) return;

    reactionBusy.value = true;

    try {
        await addPostReaction(localPost.value.id, emojiId);
        upsertReaction(emojiId, true);
    } finally {
        reactionBusy.value = false;
    }
}
</script>

<style scoped>
.news-card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.25rem;
    border-radius: 26px;
    background: linear-gradient(
        180deg,
        rgba(var(--p-blue-500-rgb), 0.04),
        rgba(255, 255, 255, 0)
    );
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
}

.news-card.expanded {
    border-color: rgba(var(--p-blue-500-rgb), 0.22);
    box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08);
}

.card-head,
.meta-line,
.card-actions {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
}

.meta-line {
    justify-content: flex-start;
    gap: 0.85rem;
    color: var(--p-text-muted-color, var(--p-grey-2));
    font-size: 0.88rem;
}

.card-copy {
    flex: 1;
    min-width: 0;
}

.card-copy h3 {
    margin: 0.45rem 0 0;
    font-size: 1.35rem;
    line-height: 1.25;
}

.tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin-top: 0.9rem;
}

.tag-chip {
    padding: 0.38rem 0.7rem;
    border-radius: 999px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.14);
    background: rgba(var(--p-blue-500-rgb), 0.06);
    color: var(--p-text-color);
    font-size: 0.86rem;
}

.tag-chip:hover {
    border-color: rgba(var(--p-blue-500-rgb), 0.28);
}

.excerpt {
    position: relative;
    border-top: 1px solid rgba(var(--p-blue-500-rgb), 0.08);
    padding-top: 0.2rem;
}

.card-body {
    display: flex;
    flex-direction: column;
    gap: 1.15rem;
}
</style>
