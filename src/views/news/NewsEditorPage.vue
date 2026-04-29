<template>
    <main class="news-editor-page">
        <section class="page-hero">
            <div>
                <div class="page-kicker">News</div>
                <h1>{{ isEdit ? 'Редактирование поста' : 'Новый пост' }}</h1>
                <p>{{ isEdit ? 'Обновите текст, медиа, теги и видимость' : 'Создайте пост с текстом, тегами и вложенным контентом' }}</p>
            </div>
            <Button
                label="Назад"
                icon="pi pi-arrow-left"
                outlined
                severity="secondary"
                @click="goBackToNewsManage"
            />
        </section>

        <section v-if="loading" class="page-card loading-card">
            <ProgressSpinner style="width: 38px; height: 38px" strokeWidth="5" />
            <span>Загружаем пост…</span>
        </section>

        <section v-else class="page-card">
            <div class="form-grid">
                <div class="field">
                    <label for="news-title">Заголовок</label>
                    <InputText
                        id="news-title"
                        v-model.trim="title"
                        placeholder="Название новости"
                    />
                </div>

                <div class="field">
                    <label for="news-tag-search">Теги</label>
                    <AutoComplete
                        id="news-tag-search"
                        v-model="selectedTags"
                        multiple
                        optionLabel="name"
                        :suggestions="tagSuggestions"
                        placeholder="Добавьте существующий тег"
                        @complete="completeTagSearch"
                    />
                </div>

                <div class="field inline-field">
                    <InputText
                        v-model.trim="newTagName"
                        placeholder="Создать отсутствующий тег"
                        @keyup.enter="createAndSelectTag"
                    />
                    <Button
                        label="Добавить тег"
                        icon="pi pi-plus"
                        :disabled="!newTagName"
                        @click="createAndSelectTag"
                    />
                </div>

                <div v-if="canManageVisibility" class="field field-checkbox">
                    <Checkbox v-model="isVisible" binary inputId="post-visible" />
                    <label for="post-visible">Пост видим в публичной ленте</label>
                </div>
            </div>

            <NewsMarkdownEditor
                v-model="body"
                v-model:mediaIds="mediaIds"
                :initial-media-ids="initialMediaIds"
            />

            <div class="save-actions">
                <Button
                    label="Отмена"
                    outlined
                    severity="secondary"
                    @click="goBackToNewsManage"
                />
                <Button
                    :label="isEdit ? 'Сохранить изменения' : 'Опубликовать пост'"
                    :loading="saving"
                    :disabled="saving || isInvalid"
                    @click="savePost"
                />
            </div>
        </section>
    </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePermissionStore } from '@/stores/permissions.js';
import { buildNewsMarkdown, splitNewsMarkdown } from '@/utils/news.js';
import {
    addTagToPost,
    addMediaToPost,
    changePostVisibility,
    createPost,
    createTag,
    deleteMedia,
    getAuthorPosts,
    getPost,
    hasNewsPermission,
    normalizePost,
    normalizePostsResponse,
    removeTagFromPost,
    searchTags,
    updatePost,
} from '@/api/news.js';
import NewsMarkdownEditor from '@/components/News/NewsMarkdownEditor.vue';

const route = useRoute();
const router = useRouter();
const permissionStore = usePermissionStore();

const loading = ref(false);
const saving = ref(false);
const title = ref('');
const body = ref('');
const selectedTags = ref([]);
const tagSuggestions = ref([]);
const newTagName = ref('');
const isVisible = ref(true);
const mediaIds = ref([]);
const initialMediaIds = ref([]);
const initialTagIds = ref([]);
const initialVisibility = ref(true);

const isEdit = computed(() => Boolean(route.params.postId));
const returnTo = computed(() => (
    typeof route.query.returnTo === 'string' && route.query.returnTo.trim()
        ? route.query.returnTo
        : '/news/manage'
));
const canManageVisibility = computed(() => hasNewsPermission(permissionStore, 'Update'));
const isInvalid = computed(() => (
    !String(title.value || '').trim()
    || (!String(body.value || '').trim() && mediaIds.value.length === 0)
));

async function completeTagSearch(event) {
    const query = String(event?.query || '').trim();

    if (!query) {
        tagSuggestions.value = [];
        return;
    }

    const { data } = await searchTags(query);
    tagSuggestions.value = Array.isArray(data) ? data : [];
}

async function createAndSelectTag() {
    const name = String(newTagName.value || '').trim();
    if (!name) return;

    const { data } = await createTag(name);
    const newTag = { id: Number(data), name };

    if (!selectedTags.value.some((tag) => tag.id === newTag.id)) {
        selectedTags.value = [...selectedTags.value, newTag];
    }

    newTagName.value = '';
}

function resolveCreatedPostId(payload) {
    const candidate = typeof payload === 'string'
        ? payload
        : payload?.postId || payload?.id || payload?.post?.id || null;

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(candidate || ''))
        ? String(candidate)
        : null;
}

async function findCreatedPostId(expectedTitle, expectedBody) {
    try {
        const { data } = await getAuthorPosts({
            page: 1,
            pageSize: 10,
        });
        const payload = normalizePostsResponse(data);
        const matchedPost = payload.posts.find((post) => (
            post.title === expectedTitle && post.body === expectedBody
        ));

        return matchedPost?.id || null;
    } catch {
        return null;
    }
}

async function loadPost() {
    if (!isEdit.value) return;

    loading.value = true;

    try {
        const { data } = await getPost(route.params.postId);
        const post = normalizePost(data?.post);
        const parsedBody = splitNewsMarkdown(post.body);

        title.value = post.title;
        body.value = parsedBody.text;
        selectedTags.value = post.tags;
        isVisible.value = post.isVisible;
        mediaIds.value = parsedBody.mediaIds;
        initialMediaIds.value = parsedBody.mediaIds;
        initialTagIds.value = post.tags.map((tag) => tag.id);
        initialVisibility.value = post.isVisible;
    } finally {
        loading.value = false;
    }
}

function goBackToNewsManage() {
    router.push(returnTo.value);
}

async function savePost() {
    if (isInvalid.value || saving.value) return;

    saving.value = true;

    try {
        const nextTitle = title.value.trim();
        const nextBody = buildNewsMarkdown(body.value, mediaIds.value);

        if (!isEdit.value) {
            const { data } = await createPost({
                title: nextTitle,
                body: nextBody,
                tagsIds: selectedTags.value.map((tag) => tag.id),
                mediaIds: mediaIds.value,
            });

            if (canManageVisibility.value && !isVisible.value) {
                const postId = resolveCreatedPostId(data) || await findCreatedPostId(nextTitle, nextBody);

                if (postId) {
                    await changePostVisibility(postId, false);
                }
            }
        } else {
            const postId = route.params.postId;
            const nextMediaIds = [...mediaIds.value];
            const mediaIdsToAdd = nextMediaIds.filter((id) => !initialMediaIds.value.includes(id));
            const mediaIdsToDelete = initialMediaIds.value.filter((id) => !nextMediaIds.includes(id));

            if (mediaIdsToAdd.length > 0) {
                await addMediaToPost(postId, mediaIdsToAdd);
            }

            await updatePost(postId, {
                title: nextTitle,
                body: nextBody,
            });

            const nextTagIds = selectedTags.value.map((tag) => tag.id);
            const tagsToAdd = nextTagIds.filter((id) => !initialTagIds.value.includes(id));
            const tagsToRemove = initialTagIds.value.filter((id) => !nextTagIds.includes(id));

            if (tagsToAdd.length > 0) {
                await Promise.all(tagsToAdd.map((tagId) => addTagToPost(postId, tagId)));
            }

            if (tagsToRemove.length > 0) {
                await Promise.all(tagsToRemove.map((tagId) => removeTagFromPost(postId, tagId)));
            }

            if (isVisible.value !== initialVisibility.value) {
                await changePostVisibility(postId, isVisible.value);
            }

            if (mediaIdsToDelete.length > 0) {
                await Promise.all(mediaIdsToDelete.map((mediaId) => deleteMedia(mediaId)));
            }
        }

        router.push(returnTo.value);
    } finally {
        saving.value = false;
    }
}

onMounted(() => {
    loadPost();
});
</script>

<style scoped>
.news-editor-page {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    padding: 10px 2rem 2rem;
}

.page-hero,
.page-card {
    padding: 1.25rem;
    border-radius: 26px;
    background: linear-gradient(
        180deg,
        rgba(var(--p-blue-500-rgb), 0.04),
        rgba(255, 255, 255, 0)
    );
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
}

.page-hero {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    flex-wrap: wrap;
}

.page-kicker {
    display: inline-flex;
    padding: 0.3rem 0.7rem;
    border-radius: 999px;
    background: rgba(var(--p-blue-500-rgb), 0.12);
    color: var(--p-blue-600);
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    margin-bottom: 0.75rem;
}

.page-hero h1 {
    margin: 0;
}

.page-hero p {
    margin: 0.4rem 0 0;
    color: var(--p-text-muted-color, var(--p-grey-2));
}

.loading-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.page-card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.form-grid {
    display: flex;
    flex-direction: column;
    gap: 0.95rem;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
}

.field label {
    font-weight: 600;
}

.inline-field {
    flex-direction: row;
    align-items: center;
    gap: 0.75rem;
}

.field-checkbox {
    flex-direction: row;
    align-items: center;
    gap: 0.65rem;
}

.save-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    flex-wrap: wrap;
}

@media (max-width: 900px) {
    .inline-field {
        flex-direction: column;
        align-items: stretch;
    }
}
</style>
