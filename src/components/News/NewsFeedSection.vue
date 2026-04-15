<template>
    <section class="news-section">
        <header class="news-head">
            <div>
                <div class="news-kicker">Новости</div>
                <h2>Новостная лента</h2>
                <p>Публичные посты, фильтр по тегам, закладки и обсуждение прямо на главной</p>
            </div>

            <div class="news-head-actions">
                <Button
                    v-if="canManageNews"
                    label="Управление новостями"
                    icon="pi pi-cog"
                    @click="router.push('/news/manage')"
                />
                <Button
                    icon="pi pi-refresh"
                    outlined
                    severity="secondary"
                    :loading="loading"
                    :disabled="loading"
                    @click="fetchPosts(true)"
                />
            </div>
        </header>

        <div class="news-toolbar">
            <SelectButton
                v-model="mode"
                :options="modeOptions"
                optionLabel="label"
                optionValue="value"
                class="mode-switch"
            />

            <AutoComplete
                v-model="selectedTags"
                multiple
                optionLabel="name"
                :suggestions="tagSuggestions"
                placeholder="Фильтр по тегам"
                class="tag-autocomplete"
                @complete="completeTagSearch"
                @item-select="onTagsChanged"
                @item-unselect="onTagsChanged"
                @clear="onTagsChanged"
            />

            <Button
                label="Сбросить теги"
                text
                severity="secondary"
                :disabled="selectedTags.length === 0"
                @click="clearTags"
            />
        </div>

        <div v-if="selectedTags.length > 0" class="active-tags">
            <span>Активные теги:</span>
            <button
                v-for="tag in selectedTags"
                :key="tag.id"
                type="button"
                class="active-tag"
                @click="removeTag(tag.id)"
            >
                #{{ tag.name }}
                <i class="pi pi-times"></i>
            </button>
        </div>

        <div v-if="loading && posts.length === 0" class="news-loading">
            <Skeleton v-for="idx in 3" :key="idx" width="100%" height="220px" borderRadius="26px" />
        </div>

        <div v-else-if="posts.length === 0" class="news-empty">
            <i class="pi pi-megaphone"></i>
            <div>
                <h3>Посты не найдены</h3>
                <p>Попробуйте переключить режим или изменить фильтр по тегам.</p>
            </div>
        </div>

        <div v-else class="news-list">
            <NewsPostCard
                v-for="post in posts"
                :key="post.id"
                :post="post"
                :expanded="expandedPostId === post.id"
                :bookmarked="bookmarkedIds.has(post.id)"
                :show-bookmark-action="mode !== 'bookmarked'"
                :emojis="emojis"
                :media-types="mediaTypes"
                :current-user-id="currentUserId"
                :is-admin="isAdmin"
                @toggle="togglePost"
                @bookmark="bookmarkPost"
                @tag-click="toggleTag"
            />
        </div>

        <Paginator
            v-if="pageCount > 1"
            :rows="pageSize"
            :totalRecords="pageCount * pageSize"
            :first="(page - 1) * pageSize"
            @page="onPage"
        />
    </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { usePermissionStore } from '@/stores/permissions.js';
import { getCurrentUser } from '@/utils/currentUser.js';
import {
    NEWS_PAGE_SIZE,
    addMarkedPost,
    addPostView,
    canAccessNewsManagement,
    getBookmarkedPosts,
    getEmojies,
    getMediaTypes,
    getPostsByTags,
    getVisiblePosts,
    hasNewsAdminPermission,
    normalizeMediaType,
    normalizePostsResponse,
    searchTags,
} from '@/api/news.js';
import NewsPostCard from '@/components/News/NewsPostCard.vue';

const router = useRouter();
const permissionStore = usePermissionStore();

const posts = ref([]);
const emojis = ref([]);
const mediaTypes = ref([]);
const loading = ref(false);
const page = ref(1);
const pageCount = ref(0);
const pageSize = NEWS_PAGE_SIZE;
const mode = ref('all');
const modeOptions = [
    { label: 'Все', value: 'all' },
    { label: 'Закладки', value: 'bookmarked' },
];
const tagSuggestions = ref([]);
const selectedTags = ref([]);
const expandedPostId = ref(null);
const currentUserId = ref('');
const viewedPostIds = ref(new Set());
const bookmarkedIds = ref(new Set());

const canManageNews = computed(() => canAccessNewsManagement(permissionStore));
const isAdmin = computed(() => hasNewsAdminPermission(permissionStore, 'Read'));

async function loadBookmarkedIds() {
    const initialPage = 1;
    const requestPageSize = 100;
    const { data } = await getBookmarkedPosts({
        page: initialPage,
        pageSize: requestPageSize,
    });

    const firstPayload = normalizePostsResponse(data);
    const collectedIds = new Set(firstPayload.posts.map((post) => post.id));

    if (firstPayload.pageCount > 1) {
        const responses = await Promise.all(
            Array.from({ length: firstPayload.pageCount - 1 }, (_, index) => getBookmarkedPosts({
                page: index + 2,
                pageSize: requestPageSize,
            }))
        );

        responses.forEach((response) => {
            const payload = normalizePostsResponse(response.data);
            payload.posts.forEach((post) => collectedIds.add(post.id));
        });
    }

    bookmarkedIds.value = collectedIds;
}

async function fetchPosts(resetExpanded = false) {
    loading.value = true;

    try {
        let response;

        if (mode.value === 'bookmarked') {
            response = await getBookmarkedPosts({
                page: page.value,
                pageSize,
            });
        } else if (selectedTags.value.length > 0) {
            response = await getPostsByTags(
                selectedTags.value.map((tag) => tag.id),
                {
                    page: page.value,
                    pageSize,
                }
            );
        } else {
            response = await getVisiblePosts({
                page: page.value,
                pageSize,
            });
        }

        const payload = normalizePostsResponse(response.data);
        posts.value = payload.posts;
        pageCount.value = payload.pageCount;

        if (mode.value === 'bookmarked') {
            bookmarkedIds.value = new Set(payload.posts.map((post) => post.id));
        } else {
            payload.posts.forEach((post) => {
                if (post.isUserViewed) viewedPostIds.value.add(post.id);
            });
        }

        if (resetExpanded || !posts.value.some((post) => post.id === expandedPostId.value)) {
            expandedPostId.value = null;
        }
    } finally {
        loading.value = false;
    }
}

async function fetchMeta() {
    const [me, emojisResponse, mediaTypesResponse] = await Promise.all([
        getCurrentUser(),
        getEmojies(),
        getMediaTypes(),
    ]);

    currentUserId.value = me?.id || '';
    emojis.value = Array.isArray(emojisResponse.data) ? emojisResponse.data : [];
    mediaTypes.value = Array.isArray(mediaTypesResponse.data)
        ? mediaTypesResponse.data.map(normalizeMediaType)
        : [];
}

async function completeTagSearch(event) {
    const query = String(event?.query || '').trim();

    if (!query) {
        tagSuggestions.value = [];
        return;
    }

    const { data } = await searchTags(query);
    tagSuggestions.value = Array.isArray(data) ? data : [];
}

function onTagsChanged() {
    page.value = 1;
    fetchPosts(true);
}

function clearTags() {
    selectedTags.value = [];
    tagSuggestions.value = [];
    page.value = 1;
    fetchPosts(true);
}

function removeTag(tagId) {
    selectedTags.value = selectedTags.value.filter((tag) => tag.id !== tagId);
    onTagsChanged();
}

function toggleTag(tag) {
    if (!tag?.id) return;

    const exists = selectedTags.value.some((item) => item.id === tag.id);
    selectedTags.value = exists
        ? selectedTags.value.filter((item) => item.id !== tag.id)
        : [...selectedTags.value, tag];

    onTagsChanged();
}

async function togglePost(post) {
    if (!post?.id) return;

    expandedPostId.value = expandedPostId.value === post.id ? null : post.id;

    if (expandedPostId.value === post.id && !viewedPostIds.value.has(post.id) && !post.isUserViewed) {
        viewedPostIds.value.add(post.id);
        try {
            await addPostView(post.id);
            posts.value = posts.value.map((item) => item.id === post.id
                ? { ...item, viewsCount: item.viewsCount + 1, isUserViewed: true }
                : item);
        } catch {
            viewedPostIds.value.delete(post.id);
        }
    }
}

async function bookmarkPost(post) {
    if (!post?.id) return;

    await addMarkedPost(post.id);
    bookmarkedIds.value = new Set([...bookmarkedIds.value, post.id]);

    if (mode.value === 'bookmarked') {
        fetchPosts(true);
    }
}

function onPage(event) {
    page.value = Math.floor(event.first / event.rows) + 1;
    fetchPosts();
}

watch(mode, () => {
    page.value = 1;
    fetchPosts(true);
});

onMounted(async () => {
    await Promise.allSettled([fetchMeta(), loadBookmarkedIds()]);
    await fetchPosts(true);
});
</script>

<style scoped>
.news-section {
    display: flex;
    flex-direction: column;
    gap: 1.15rem;
}

.news-head,
.news-toolbar,
.news-head-actions,
.active-tags {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    flex-wrap: wrap;
}

.news-kicker {
    display: inline-flex;
    align-items: center;
    padding: 0.32rem 0.7rem;
    border-radius: 999px;
    background: rgba(var(--p-blue-500-rgb), 0.12);
    color: var(--p-blue-600);
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 0.7rem;
}

.news-head h2 {
    margin: 0;
}

.news-head p {
    margin: 0.45rem 0 0;
    color: var(--p-text-muted-color, var(--p-grey-2));
    max-width: 46rem;
}

.news-toolbar {
    padding: 0.9rem 1rem;
    border-radius: 20px;
    background: rgba(var(--p-blue-500-rgb), 0.04);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.1);
}

.tag-autocomplete {
    min-width: min(100%, 24rem);
}

.active-tags {
    align-items: center;
}

.active-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.42rem 0.7rem;
    border-radius: 999px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
    background: rgba(var(--p-blue-500-rgb), 0.06);
}

.news-loading,
.news-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.news-empty {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.4rem;
    border-radius: 26px;
    background: rgba(var(--p-blue-500-rgb), 0.04);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.08);
}

.news-empty h3 {
    margin: 0;
}

.news-empty p {
    margin: 0.35rem 0 0;
    color: var(--p-text-muted-color, var(--p-grey-2));
}

.news-empty .pi {
    font-size: 1.8rem;
    color: rgba(var(--p-blue-500-rgb), 0.75);
}

@media (max-width: 900px) {
    .news-toolbar {
        align-items: stretch;
    }

    .tag-autocomplete {
        width: 100%;
        min-width: 100%;
    }
}
</style>
