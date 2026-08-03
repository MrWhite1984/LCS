<template>
    <main>
        <div class="faq-page">
            <header class="faq-header">
                <div class="faq-title-wrap">
                    <Tag rounded>FAQ</Tag>
                    <h2>Вопросы и ответы</h2>
                    <p class="faq-subtitle">Выберите группу, чтобы найти ответ на свой вопрос.</p>
                </div>
            </header>

            <section class="faq-search-section">
                <div class="faq-search-card">
                    <div class="faq-search-input-wrap">
                        <i class="pi pi-search faq-search-icon"></i>
                        <InputText
                            v-model.trim="searchQuery"
                            class="faq-search-input"
                            placeholder="Поиск по вопросам статьи"
                        />
                    </div>
                    <small class="faq-search-hint">Поиск выполняется по названию вопроса статьи.</small>
                </div>

                <Transition name="content-fade" mode="out-in">
                    <div v-if="hasSearchQuery" key="faq-search-results" class="faq-search-results">
                        <div class="faq-search-results-header">
                            <h4>Результаты поиска</h4>
                            <Tag rounded severity="contrast">{{ searchLoading ? 'Поиск...' : `${searchResults.length}` }}</Tag>
                        </div>

                        <div v-if="searchLoading" class="faq-search-list">
                            <div v-for="idx in 3" :key="idx" class="faq-search-item faq-search-item-skeleton">
                                <Skeleton width="60%" height="1rem" />
                                <Skeleton width="35%" height="0.9rem" />
                            </div>
                        </div>

                        <div v-else-if="searchResults.length" class="faq-search-list">
                            <article
                                v-for="article in searchResults"
                                :key="article.id"
                                class="faq-search-item"
                            >
                                <div class="faq-search-item-head">
                                    <button type="button" class="faq-search-item-link" @click="openArticle(article.id)">
                                        <span class="faq-search-item-title">{{ article.question }}</span>
                                    </button>
                                    <Tag rounded severity="success">Статья</Tag>
                                </div>
                                <div v-if="article.pathSegments?.length" class="faq-search-item-path">
                                    <button
                                        v-for="(segment, segmentIndex) in article.pathSegments"
                                        :key="`${article.id}-${segmentIndex}-${segment}`"
                                        type="button"
                                        class="faq-search-path-link"
                                        @click="focusPathSegment(article, segmentIndex)"
                                    >
                                        {{ segment }}
                                    </button>
                                </div>
                            </article>
                        </div>

                        <div v-else class="faq-search-empty">
                            По вашему запросу статьи не найдены.
                        </div>
                    </div>
                </Transition>
            </section>
    
            <section class="faq-tree-section">
                <div class="faq-tree-header">
                    <h4>Часто задаваемые вопросы</h4>
                    <div class="faq-tree-actions">
                        <button class="create-root-btn" type="button" aria-label="Создать группу" @click="openCreateRootGroupDialog" :disabled="actionLoading">
                            <i class="pi pi-folder-plus"></i>
                            <span class="create-root-btn-label">Создать группу</span>
                        </button>
                        <button class="refresh-btn" type="button" @click="fetchRootGroups" :disabled="loadingRoot">
                            <i class="pi pi-sync"></i>
                        </button>
                    </div>
                </div>
    
                <Transition name="content-fade" mode="out-in">
                    <div key="faq-skeleton" v-if="loadingRoot" class="faq-skeleton-list">
                        <div v-for="idx in 6" :key="idx" class="faq-skeleton-row">
                            <Skeleton width="1rem" height="2rem" borderRadius="4px" />
                            <Skeleton width="55%" height="1rem" />
                            <Skeleton width="4.5rem" height="1.2rem" borderRadius="999px" />
                        </div>
                    </div>
                    <div key="faq-empty" v-else-if="!items.length" class="faq-empty">Группы не найдены.</div>
        
                    <div key="faq-content" v-else class="faq-list-root">
                        <FaqNode
                            v-for="item in items"
                            :key="item.key"
                            :item="item"
                            :loading-group-id="loadingGroupId"
                            :current-user-id="currentUserId"
                            :can-manage-any-faq="canManageAnyFaq"
                            :highlighted-node-key="highlightedNodeKey"
                            @toggle-group="handleGroupToggle"
                            @open-article="openArticle"
                            @group-action="handleGroupAction"
                        />
                    </div>
                </Transition>
            </section>

            <Dialog
                v-model:visible="groupDialog.visible"
                modal
                :header="groupDialog.mode === 'edit' ? 'Изменить группу' : groupDialog.parentId === ROOT_PARENT_ID ? 'Создать корневую группу' : 'Создать подгруппу'"
                :style="{ width: '32rem' }"
            >
                <div class="faq-dialog-form">
                    <div class="faq-field">
                        <label for="faq-group-title">Название</label>
                        <InputText id="faq-group-title" v-model="groupDialog.title" class="w-100" />
                    </div>
                </div>
                <template #footer>
                    <Button label="Отмена" severity="secondary" text @click="closeGroupDialog" :disabled="actionLoading" />
                    <Button :label="groupDialog.mode === 'create' ? 'Создать' : 'Сохранить'" @click="submitGroupDialog" :loading="actionLoading" severity="success" />
                </template>
            </Dialog>

            <Dialog v-model:visible="deleteDialog.visible" modal header="Удаление группы" :style="{ width: '28rem' }">
                <p class="m-0">Удалить группу «{{ deleteDialog.group?.title }}»?</p>
                <template #footer>
                    <Button label="Отмена" severity="secondary" text @click="closeDeleteDialog" :disabled="actionLoading" />
                    <Button label="Удалить" severity="danger" @click="confirmDeleteGroup" :loading="actionLoading" />
                </template>
            </Dialog>

        </div>
    </main>
</template>

<script setup>
import FaqNode from '@/components/Faq/groups/nodes/FaqNode.vue';
import { useFaqGroupsPage } from '@/components/Faq/groups/useFaqGroupsPage.js';

const {
    ROOT_PARENT_ID,
    currentUserId,
    canManageAnyFaq,
    items,
    loadingRoot,
    loadingGroupId,
    searchQuery,
    hasSearchQuery,
    searchLoading,
    searchResults,
    highlightedNodeKey,
    actionLoading,
    groupDialog,
    deleteDialog,
    fetchRootGroups,
    openCreateRootGroupDialog,
    handleGroupToggle,
    focusPathSegment,
    openArticle,
    handleGroupAction,
    closeGroupDialog,
    submitGroupDialog,
    closeDeleteDialog,
    confirmDeleteGroup,
} = useFaqGroupsPage();
</script>

<style scoped>
main {
    height: 100%;
    padding: 10px 2rem;
}
.faq-page {
    --faq-bg-1: var(--p-bg-color-2);
    --faq-bg-2: var(--p-bg-color-1);
    --faq-border: var(--p-grey-4);
    --faq-shadow: 0 12px 32px rgba(15, 23, 42, 0.07);
    --faq-primary: var(--p-blue-500);
    --faq-primary-soft: var(--p-blue-100);
    --faq-text: var(--p-text-color);
    --faq-muted: var(--p-grey-1);
    font-family: "SF Pro Rounded", "Segoe UI", sans-serif;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 1.15rem;
    background:
        radial-gradient(1200px 220px at 10% 0%, rgba(var(--p-blue-500-rgb), 0.08), transparent 60%),
        linear-gradient(180deg, var(--faq-bg-1) 0%, var(--faq-bg-2) 85%);
    border: 1px solid var(--faq-border);
    border-radius: 12px;
    box-shadow: var(--faq-shadow);
}

.faq-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.faq-title-wrap h2 {
    margin: 0;
    color: var(--faq-text);
}

.faq-kicker {
    display: inline-flex;
    align-items: center;
    padding: 0.2rem 0.65rem;
    border-radius: 999px;
    background: var(--p-blue-500);
    color: var(--p-bg-color-1);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    margin-bottom: 0.4rem;
}

.faq-subtitle {
    color: var(--faq-muted);
    margin: 0.35rem 0 0;
    font-size: 0.95rem;
}

.faq-tree-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.faq-search-section {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
}

.faq-search-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem 1.1rem;
}

.faq-search-input-wrap {
    position: relative;
}

.faq-search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--faq-muted);
}

.faq-search-input {
    width: 100%;
    padding-left: 2.75rem;
    border-radius: 999px;
}

.faq-search-hint {
    color: var(--faq-muted);
}

.faq-search-results {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding: 1rem 1.1rem;
    border-radius: 18px;
    background: color-mix(in srgb, var(--p-blue-500) 4%, var(--p-bg-color-1));
    border: 1px solid color-mix(in srgb, var(--p-blue-500) 15%, var(--faq-border));
}

.faq-search-results-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.faq-search-results-header h4 {
    margin: 0;
    color: var(--faq-text);
}

.faq-search-list {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
}

.faq-search-item {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    width: 100%;
    padding: 0.95rem 1rem;
    border-radius: 16px;
    border: 1px solid color-mix(in srgb, var(--p-blue-500) 12%, var(--faq-border));
    background: var(--p-bg-color-1);
    text-align: left;
    cursor: pointer;
    transition: transform 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease;
}

.faq-search-item:hover {
    transform: translateY(-1px);
    border-color: var(--p-blue-400);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.faq-search-item-link {
    padding: 0;
    border: 0;
    background: transparent;
    text-align: left;
    font: inherit;
    color: inherit;
    cursor: pointer;
}

.faq-search-item-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
}

.faq-search-item-title {
    color: var(--faq-text);
    font-weight: 600;
}

.faq-search-item-path {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex-wrap: wrap;
}

.faq-search-path-link {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0.28rem 0.7rem;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--p-blue-500) 12%, var(--faq-border));
    background: rgba(var(--p-blue-500-rgb), 0.08);
    color: color-mix(in srgb, var(--p-blue-700, #1d4ed8) 72%, var(--faq-text));
    font-size: 0.82rem;
    font-weight: 500;
    line-height: 1.2;
    cursor: pointer;
    transition: border-color 0.14s ease, background-color 0.14s ease, transform 0.14s ease;
}

.faq-search-path-link:hover {
    border-color: var(--p-blue-400);
    background: rgba(var(--p-blue-500-rgb), 0.12);
    transform: translateY(-1px);
}

.faq-search-path-link:not(:last-child)::after {
    content: "›";
    margin-left: 0.55rem;
    color: var(--faq-muted);
    pointer-events: none;
}

.faq-search-item-skeleton {
    cursor: default;
}

.faq-search-empty {
    color: var(--faq-muted);
}

.faq-tree-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.faq-tree-actions {
    display: flex;
    align-items: center;
    gap: 0.55rem;
}

.faq-tree-header h4 {
    margin: 0;
    font-weight: 700;
    color: var(--faq-text);
}

.refresh-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    border: 1px solid color-mix(in srgb, var(--p-blue-500) 35%, transparent);
    background: var(--p-blue-500);
    color: var(--p-bg-color-1);
    border-radius: 999px;
    padding: 0.5rem 1rem;
    font-size: 0.84rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease background 0.15s ease;
}

.create-root-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    border: 1px solid var(--p-grey-4);
    background: var(--p-bg-color-1);
    color: var(--p-text-color);
    border-radius: 999px;
    padding: 0.5rem 0.95rem;
    font-size: 0.84rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}

.create-root-btn:hover {
    transform: translateY(-1px);
    border-color: var(--p-blue-400);
    background: var(--p-bg-color-2);
}

.create-root-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.refresh-btn:hover {
    transform: translateY(-1px);
    background: var(--p-blue-400);
}

.refresh-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.faq-empty {
    color: var(--faq-muted);
    padding: 0.5rem 0;
}

.faq-list-root {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
}

.faq-skeleton-list {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
}

.faq-skeleton-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.82rem 1rem;
    border-radius: 16px;
    background: var(--p-grey-7);
    border: 1px solid var(--p-grey-4);
}

.faq-dialog-form {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
}

.faq-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.faq-dropzone {
    border: 2px dashed var(--p-grey-3);
    border-radius: 12px;
    padding: 0.9rem;
    background: var(--p-bg-color-2);
    transition: border-color 0.2s ease, background-color 0.2s ease;
    cursor: pointer;
}

.faq-dropzone.is-dragover {
    border-color: var(--p-blue-500);
    background: var(--p-blue-100);
}

.faq-dropzone-inner {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    color: var(--p-grey-1);
}

.faq-image-preview {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.45rem;
}

.faq-image-preview img {
    max-width: 100%;
    max-height: 220px;
    object-fit: contain;
    border-radius: 10px;
    border: 1px solid var(--p-grey-4);
    background: var(--p-bg-color-1);
}

@media (max-width: 900px) {
    .faq-page {
        padding: 1rem;
    }

    .faq-subtitle {
        font-size: 0.9rem;
    }
}

@media (max-width: 420px) {
    .create-root-btn {
        width: 2.7rem;
        height: 2.7rem;
        justify-content: center;
        padding: 0;
    }

    .create-root-btn-label {
        display: none;
    }
}
</style>
