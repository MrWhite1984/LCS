<template>
    <main class="news-manage-page">
        <section class="page-hero">
            <div>
                <div class="page-kicker">Новости</div>
                <h1>Управление новостями</h1>
                <p>Посты автора, теги и эмодзи в одном редакционном пространстве</p>
            </div>

            <div class="page-actions">
                <Button
                    v-if="canCreatePosts"
                    label="Новый пост"
                    icon="pi pi-plus"
                    @click="router.push('/news/manage/create')"
                />
                <Button
                    icon="pi pi-refresh"
                    outlined
                    severity="secondary"
                    :loading="postsLoading || emojiLoading || tagsLoading"
                    @click="refreshCurrentSection"
                />
            </div>
        </section>

        <section class="section-switch">
            <SelectButton
                v-model="section"
                :options="sectionOptions"
                optionLabel="label"
                optionValue="value"
            />
        </section>

        <section v-if="section === 'posts'" class="content-card">
            <header class="content-head">
                <div>
                    <h2>Мои посты</h2>
                    <p>Редактирование текста, тегов, видимости и удаление</p>
                </div>
            </header>

            <div v-if="postsLoading && posts.length === 0" class="state-box">
                <ProgressSpinner style="width: 36px; height: 36px" strokeWidth="5" />
                <span>Загружаем посты…</span>
            </div>

            <div v-else-if="posts.length === 0" class="state-box">
                <span>У вас пока нет постов.</span>
            </div>

            <div v-else class="post-list">
                <article v-for="post in posts" :key="post.id" class="post-card">
                    <div class="post-meta">
                        <span>{{ formatDateRuLongWithTime(post.createdAt, '') }}</span>
                        <Tag :value="post.isVisible ? 'Виден' : 'Скрыт'" :severity="post.isVisible ? 'success' : 'warning'" />
                    </div>

                    <h3>{{ post.title }}</h3>
                    <p>{{ summarize(post.body) }}</p>

                    <div class="post-tags">
                        <span v-for="tag in post.tags" :key="tag.id" class="post-tag">#{{ tag.name }}</span>
                    </div>

                    <div class="post-actions">
                        <Button
                            v-if="canUpdatePosts"
                            label="Редактировать"
                            icon="pi pi-pencil"
                            text
                            @click="router.push(`/news/manage/${post.id}/edit`)"
                        />
                        <Button
                            v-if="canUpdatePosts"
                            :label="post.isVisible ? 'Скрыть' : 'Показать'"
                            text
                            @click="toggleVisibility(post)"
                        />
                        <Button
                            v-if="canDeletePosts"
                            label="Удалить"
                            icon="pi pi-trash"
                            text
                            severity="danger"
                            @click="removePost(post)"
                        />
                    </div>
                </article>
            </div>

            <Paginator
                v-if="postsPageCount > 1"
                :rows="pageSize"
                :first="(postsPage - 1) * pageSize"
                :totalRecords="postsPageCount * pageSize"
                @page="onPostsPage"
            />
        </section>

        <section v-else-if="section === 'tags'" class="content-card">
            <header class="content-head">
                <div>
                    <h2>Теги</h2>
                    <p>Поиск и управление найденными тегами. Полное редактирование доступно только администратору новостей.</p>
                </div>
            </header>

            <div class="inline-form mt-2">
                <IconField class="flex-grow-1">
                    <InputIcon class="pi pi-search" />
                    <InputText
                        v-model.trim="tagQuery"
                        placeholder="Найти теги по части названия"
                        class="w-100"
                        @keyup.enter="loadTags"
                    />
                </IconField>
                <Button label="Найти" @click="loadTags" />
            </div>

            <div v-if="canCreateTags" class="inline-form my-2">
                <InputText
                    v-model.trim="newTagName"
                    placeholder="Новый тег"
                    class="flex-grow-1"
                    @keyup.enter="createNewTag"
                />
                <Button
                    label="Создать тег"
                    icon="pi pi-plus"
                    :disabled="!newTagName"
                    @click="createNewTag"
                />
            </div>

            <div v-if="tagsLoading" class="state-box">
                <ProgressSpinner style="width: 32px; height: 32px" strokeWidth="5" />
                <span>Загружаем теги…</span>
            </div>

            <div v-else-if="tags.length === 0" class="state-box">
                <span>Совпадений по тегам пока нет.</span>
            </div>

            <div v-else class="row-list">
                <article v-for="tag in tags" :key="tag.id" class="row-card">
                    <div class="row-card-copy">
                        <strong>#{{ tag.name }}</strong>
                    </div>
                    <div class="row-card-actions">
                        <InputText
                            v-if="canRenameTags"
                            v-model.trim="tagDrafts[tag.id]"
                            :placeholder="tag.name"
                            class="draft-input"
                        />
                        <Button
                            v-if="canRenameTags"
                            label="Сохранить"
                            text
                            :disabled="!tagDrafts[tag.id] || tagDrafts[tag.id] === tag.name"
                            @click="renameExistingTag(tag)"
                        />
                        <Button
                            v-if="canDeleteTags"
                            label="Удалить"
                            text
                            severity="danger"
                            @click="deleteExistingTag(tag)"
                        />
                    </div>
                </article>
            </div>
        </section>

        <section v-else class="content-card">
            <header class="content-head">
                <div>
                    <h2>Эмодзи</h2>
                    <p>Реакции доступны всей редакции, а создание и удаление — только администратору новостей.</p>
                </div>
            </header>

            <div v-if="canCreateEmoji" class="inline-form">
                <InputText
                    v-model.trim="newEmojiCode"
                    maxlength="8"
                    placeholder="😀"
                    class="emoji-input"
                    @keyup.enter="createNewEmoji"
                />
                <Button
                    label="Добавить эмодзи"
                    icon="pi pi-face-smile"
                    :disabled="!newEmojiCode"
                    @click="createNewEmoji"
                />
            </div>

            <div v-if="emojiLoading" class="state-box">
                <ProgressSpinner style="width: 32px; height: 32px" strokeWidth="5" />
                <span>Загружаем эмодзи…</span>
            </div>

            <div v-else-if="emojis.length === 0" class="state-box">
                <span>Эмодзи пока не настроены.</span>
            </div>

            <div v-else class="emoji-grid">
                <article v-for="emoji in emojis" :key="emoji.id" class="emoji-card">
                    <span class="emoji-symbol">{{ emoji.code }}</span>
                    <Button
                        v-if="canDeleteEmojiAction"
                        label="Удалить"
                        text
                        severity="danger"
                        @click="deleteExistingEmoji(emoji)"
                    />
                </article>
            </div>
        </section>
    </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useConfirm } from 'primevue/useconfirm';
import { usePermissionStore } from '@/stores/permissions.js';
import { formatDateRuLongWithTime } from '@/utils/date.js';
import { extractNewsMediaIds, getNewsPlainText } from '@/utils/news.js';
import {
    NEWS_PAGE_SIZE,
    changePostVisibility,
    deleteEmoji,
    deleteTag,
    getAuthorPosts,
    getEmojies,
    hasNewsPermission,
    hasNewsAdminPermission,
    normalizePostsResponse,
    renameTag,
    searchTags,
    softDeletePost,
    createTag,
    createEmoji,
} from '@/api/news.js';

const router = useRouter();
const confirm = useConfirm();
const permissionStore = usePermissionStore();

const section = ref('posts');
const sectionOptions = [
    { label: 'Посты', value: 'posts' },
    { label: 'Теги', value: 'tags' },
    { label: 'Эмодзи', value: 'emoji' },
];

const pageSize = NEWS_PAGE_SIZE;
const posts = ref([]);
const postsPage = ref(1);
const postsPageCount = ref(0);
const postsLoading = ref(false);

const tagQuery = ref('');
const newTagName = ref('');
const tags = ref([]);
const tagsLoading = ref(false);
const tagDrafts = ref({});

const emojis = ref([]);
const emojiLoading = ref(false);
const newEmojiCode = ref('');

const canReadPosts = computed(() => hasNewsPermission(permissionStore, 'Read'));
const canCreatePosts = computed(() => hasNewsPermission(permissionStore, 'Create'));
const canUpdatePosts = computed(() => hasNewsPermission(permissionStore, 'Update'));
const canDeletePosts = computed(() => hasNewsPermission(permissionStore, 'Delete'));
const canCreateTags = computed(() => hasNewsPermission(permissionStore, 'Create'));
const canRenameTags = computed(() => hasNewsAdminPermission(permissionStore, 'Update'));
const canDeleteTags = computed(() => hasNewsAdminPermission(permissionStore, 'Delete'));
const canCreateEmoji = computed(() => hasNewsAdminPermission(permissionStore, 'Create'));
const canDeleteEmojiAction = computed(() => hasNewsAdminPermission(permissionStore, 'Delete'));

function summarize(text) {
    const plainText = getNewsPlainText(text)
        .replace(/\s+/g, ' ')
        .trim();
    const mediaCount = extractNewsMediaIds(text).length;
    const suffix = mediaCount > 0 ? ` [медиа: ${mediaCount}]` : '';
    const value = `${plainText}${suffix}`.trim();

    return value.length > 180 ? `${value.slice(0, 180).trim()}…` : value || 'Без текста';
}

async function loadPosts() {
    postsLoading.value = true;

    try {
        const { data } = await getAuthorPosts({
            page: postsPage.value,
            pageSize,
        });
        const payload = normalizePostsResponse(data);
        posts.value = payload.posts;
        postsPageCount.value = payload.pageCount;
    } finally {
        postsLoading.value = false;
    }
}

async function toggleVisibility(post) {
    await changePostVisibility(post.id, !post.isVisible);
    await loadPosts();
}

async function removePost(post) {
    confirm.require({
        message: `Удалить пост «${post.title}»?`,
        header: 'Удаление поста',
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
            await softDeletePost(post.id);
            await loadPosts();
        },
    });
}

function onPostsPage(event) {
    postsPage.value = Math.floor(event.first / event.rows) + 1;
    loadPosts();
}

async function loadTags() {
    tagsLoading.value = true;

    try {
        const { data } = await searchTags(tagQuery.value || '');
        tags.value = Array.isArray(data) ? data : [];
        tagDrafts.value = Object.fromEntries(tags.value.map((tag) => [tag.id, tag.name]));
    } finally {
        tagsLoading.value = false;
    }
}

async function createNewTag() {
    if (!newTagName.value) return;
    await createTag(newTagName.value);
    tagQuery.value = newTagName.value;
    newTagName.value = '';
    await loadTags();
}

async function renameExistingTag(tag) {
    const nextName = String(tagDrafts.value[tag.id] || '').trim();
    if (!nextName || nextName === tag.name) return;
    await renameTag(tag.id, nextName);
    await loadTags();
}

async function deleteExistingTag(tag) {
    confirm.require({
        message: `Удалить тег #${tag.name}?`,
        header: 'Удаление тега',
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
            await deleteTag(tag.id);
            await loadTags();
        },
    });
}

async function loadEmoji() {
    emojiLoading.value = true;

    try {
        const { data } = await getEmojies();
        emojis.value = Array.isArray(data) ? data : [];
    } finally {
        emojiLoading.value = false;
    }
}

async function createNewEmoji() {
    if (!newEmojiCode.value) return;
    await createEmoji(newEmojiCode.value);
    newEmojiCode.value = '';
    await loadEmoji();
}

async function deleteExistingEmoji(emoji) {
    confirm.require({
        message: `Удалить эмодзи ${emoji.code}?`,
        header: 'Удаление эмодзи',
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
            await deleteEmoji(emoji.id);
            await loadEmoji();
        },
    });
}

function refreshCurrentSection() {
    if (section.value === 'posts') return loadPosts();
    if (section.value === 'tags') return loadTags();
    return loadEmoji();
}

onMounted(async () => {
    const tasks = [loadEmoji()];

    if (canReadPosts.value) {
        tasks.unshift(loadPosts());
    }

    await Promise.allSettled(tasks);
});
</script>

<style scoped>
.news-manage-page {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 10px 2rem 2rem;
}

.page-hero,
.page-actions,
.content-head,
.inline-form,
.row-card,
.row-card-actions,
.post-meta,
.post-actions {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    flex-wrap: wrap;
}

.page-hero,
.content-card,
.section-switch {
    padding: 1.25rem;
    border-radius: 26px;
    background: linear-gradient(
        180deg,
        rgba(var(--p-blue-500-rgb), 0.04),
        rgba(255, 255, 255, 0)
    );
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
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

.page-hero h1,
.content-head h2 {
    margin: 0;
}

.page-hero p,
.content-head p {
    margin: 0.4rem 0 0;
    color: var(--p-text-muted-color, var(--p-grey-2));
}

.state-box {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.1rem;
    border-radius: 18px;
    background: rgba(var(--p-blue-500-rgb), 0.04);
    color: var(--p-text-muted-color, var(--p-grey-2));
}

.post-list,
.row-list {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
}

.post-card,
.row-card,
.emoji-card {
    padding: 1rem;
    border-radius: 20px;
    background: var(--p-bg-color-1);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.1);
}

.post-card h3 {
    margin: 0.7rem 0 0.55rem;
}

.post-card p {
    margin: 0;
    color: var(--p-text-muted-color, var(--p-grey-2));
    line-height: 1.65;
}

.post-tags {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
    margin-top: 0.9rem;
}

.post-tag {
    padding: 0.32rem 0.65rem;
    border-radius: 999px;
    background: rgba(var(--p-blue-500-rgb), 0.08);
    font-size: 0.85rem;
}

.row-card {
    align-items: center;
}

.row-card-copy {
    flex: 1;
}

.draft-input {
    min-width: 14rem;
}

.emoji-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 0.9rem;
}

.emoji-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.7rem;
    text-align: center;
}

.emoji-symbol {
    font-size: 2rem;
}

.emoji-id {
    color: var(--p-text-muted-color, var(--p-grey-2));
    font-size: 0.85rem;
}

.emoji-input {
    max-width: 8rem;
}
</style>
