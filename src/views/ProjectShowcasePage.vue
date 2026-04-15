<template>
    <main class="content project-showcase-page">
        <div class="content-wrapper">
        <section class="project-showcase-shell">
            <header class="project-showcase-header">
                <div class="project-showcase-copy">
                    <Tag rounded>Проектный офис</Tag>
                    <h2>Витрина проектов</h2>
                    <p>
                        Единое пространство для публичных проектов, ваших инициатив и решений проектного офиса.
                    </p>
                </div>

                <div class="project-showcase-actions">
                    <Button
                        icon="pi pi-refresh"
                        label="Обновить"
                        outlined
                        severity="secondary"
                        :loading="loading || syncingUser"
                        @click="refreshPage"
                    />
                    <Button
                        v-if="showCreateButton"
                        icon="pi pi-plus"
                        label="Создать проект"
                        :loading="preparingCreateDialog"
                        @click="openCreateDialog"
                    />
                </div>
            </header>

            <DataTable
                class="project-showcase-table"
                lazy
                paginator
                scrollable
                scrollHeight="flex"
                stripedRows
                :value="projects"
                :loading="loading"
                :rows="rowsPerPage"
                :totalRecords="totalRecords"
                :rowsPerPageOptions="[5, 10, 20]"
                @page="onPage"
                @row-click="openProject"
            >
                <template #header>
                    <div class="project-table-header">
                        <div class="project-table-header-main">
                            <div class="project-table-header-icon">
                                <i class="pi pi-briefcase"></i>
                            </div>
                            <div class="project-table-header-copy">
                                <div class="project-table-header-topline">
                                    <h3>Список проектов</h3>
                                    <Tag severity="secondary">{{ currentModeLabel }}</Tag>
                                </div>
                                <p>
                                    {{
                                        selectedMode === 'public'
                                            ? 'Публичные проекты, доступные всем пользователям.'
                                            : selectedMode === 'me'
                                                ? 'Ваши проекты и проекты, в которых вы участвуете.'
                                                : selectedMode === 'for-project-office-solution'
                                                    ? 'Проекты, ожидающие решения проектного офиса.'
                                                    : 'Полный список проектов для расширенного доступа.'
                                    }}
                                </p>
                            </div>
                        </div>

                        <div class="project-table-header-controls">
                            <SelectButton
                                v-if="availableModes.length > 1"
                                v-model="selectedMode"
                                :options="availableModes"
                                optionLabel="label"
                                optionValue="value"
                                aria-label="Тип списка проектов"
                            />
                            <Tag
                                :severity="showcaseUserId ? 'secondary' : 'warn'"
                                :value="showcaseUserId
                                    ? `Пользователь витрины: #${showcaseUserId}`
                                    : 'Аккаунт в новой системе будет создан автоматически при первой инициации проекта.'"
                            />
                        </div>
                    </div>
                </template>

                <template #paginatorstart>
                    <div class="project-table-stats">
                        <span>Страниц: <strong>{{ totalPages }}</strong></span>
                    </div>
                </template>

                <template #empty>
                    <div class="project-empty-state">
                        <i class="pi pi-briefcase"></i>
                        <h4>Проекты не найдены</h4>
                        <p>Попробуйте выбрать другой тип списка или обновить данные.</p>
                    </div>
                </template>

                <Column field="name" header="Проект" style="min-width: 260px;">
                    <template #body="{ data }">
                        <div class="project-name-cell">
                            <strong>{{ data.name || 'Без названия' }}</strong>
                            <small>{{ data.statement || data.shortDescription || 'Описание пока не заполнено' }}</small>
                        </div>
                    </template>
                </Column>
                <Column field="projectInitiator" header="Инициатор" style="min-width: 210px;">
                    <template #body="{ data }">
                        {{ buildProjectShowcaseFullName(data.projectInitiator?.user || data.initiator?.user) }}
                    </template>
                </Column>
                <Column field="projectManager" header="Менеджер" style="min-width: 210px;">
                    <template #body="{ data }">
                        {{ buildProjectShowcaseFullName(data.projectManager?.user) }}
                    </template>
                </Column>
                <Column field="updatedAt" header="Обновлено" style="width: 170px;">
                    <template #body="{ data }">
                        {{ formatDateRuShortWithTime(data.updatedAt, '-') }}
                    </template>
                </Column>
            </DataTable>
        </section>
        </div>

        <ProjectInitiationDialog
            v-model:visible="createDialogVisible"
            :initiator-id="showcaseUserId"
            @created="handleProjectCreated"
        />
    </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { usePermissionStore } from '@/stores/permissions.js';
import { getCurrentUser } from '@/utils/currentUser.js';
import { formatDateRuShortWithTime } from '@/utils/date.js';
import {
    addMeToProjectShowcaseSystem,
    getMeInProjectShowcaseSystem,
    getProjectsList,
} from '@/api/projectShowcase.js';
import {
    buildProjectShowcaseFullName,
    buildProjectShowcaseListModes,
    buildProjectShowcaseErrorMessage,
    canCreateProject,
    clearProjectShowcaseUserId,
    getStoredProjectShowcaseUserId,
    isTeacherRole,
    normalizeProjectsList,
    resolveDefaultProjectShowcaseMode,
    resolveProjectShowcaseUserIdFromResponse,
    storeProjectShowcaseUserId,
} from '@/utils/projectShowcase.js';
import ProjectInitiationDialog from '@/components/ProjectShowcase/ProjectInitiationDialog.vue';

const permissionStore = usePermissionStore();
const router = useRouter();
const toast = useToast();

const loading = ref(false);
const syncingUser = ref(false);
const preparingCreateDialog = ref(false);
const currentUser = ref(null);
const projects = ref([]);
const totalRecords = ref(0);
const totalPages = ref(0);
const rowsPerPage = ref(10);
const currentPage = ref(1);
const showcaseUserId = ref(getStoredProjectShowcaseUserId());
const selectedMode = ref('public');
const createDialogVisible = ref(false);

const availableModes = computed(() => buildProjectShowcaseListModes(permissionStore, Boolean(showcaseUserId.value)));

const currentModeLabel = computed(() =>
    availableModes.value.find((mode) => mode.value === selectedMode.value)?.label || 'Публичные'
);

const showCreateButton = computed(() =>
    isTeacherRole(currentUser.value) && canCreateProject(permissionStore)
);

const ensureSelectedMode = () => {
    const allowedModes = availableModes.value.map((mode) => mode.value);

    if (!allowedModes.includes(selectedMode.value)) {
        selectedMode.value = resolveDefaultProjectShowcaseMode(permissionStore, Boolean(showcaseUserId.value));
    }
};

const syncProjectShowcaseUser = async ({ createIfMissing = false } = {}) => {
    syncingUser.value = true;

    try {
        const response = await getMeInProjectShowcaseSystem();
        const userId = resolveProjectShowcaseUserIdFromResponse(response);

        if (!userId) {
            if (!createIfMissing) {
                showcaseUserId.value = null;
                clearProjectShowcaseUserId();
                return null;
            }

            const createResponse = await addMeToProjectShowcaseSystem();
            showcaseUserId.value = storeProjectShowcaseUserId(createResponse.data);
            return showcaseUserId.value;
        }

        showcaseUserId.value = storeProjectShowcaseUserId(userId);
        return showcaseUserId.value;
    } catch (error) {
        if (error?.response?.status === 404) {
            if (!createIfMissing) {
                showcaseUserId.value = null;
                clearProjectShowcaseUserId();
                return null;
            }

            const response = await addMeToProjectShowcaseSystem();
            showcaseUserId.value = storeProjectShowcaseUserId(response.data);
            return showcaseUserId.value;
        }

        toast.add({
            severity: 'error',
            summary: 'Не удалось синхронизировать пользователя',
            detail: buildProjectShowcaseErrorMessage(error, 'Попробуйте обновить страницу.'),
            life: 3500,
        });
        return showcaseUserId.value;
    } finally {
        syncingUser.value = false;
    }
};

const loadProjects = async () => {
    loading.value = true;

    try {
        const response = await getProjectsList(selectedMode.value, {
            page: currentPage.value,
            pageSize: rowsPerPage.value,
        });

        const normalized = normalizeProjectsList(response.data, {
            page: currentPage.value,
            pageSize: rowsPerPage.value,
        });
        projects.value = normalized.projects;
        totalPages.value = normalized.totalPages;
        totalRecords.value = normalized.totalRecords;
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить список проектов',
            detail: buildProjectShowcaseErrorMessage(error, 'Попробуйте обновить страницу.'),
            life: 3500,
        });
        projects.value = [];
        totalPages.value = 0;
        totalRecords.value = 0;
    } finally {
        loading.value = false;
    }
};

const loadPageContext = async () => {
    currentUser.value = await getCurrentUser();
    await syncProjectShowcaseUser();
    ensureSelectedMode();
    await loadProjects();
};

const refreshPage = async () => {
    await loadPageContext();
};

const openCreateDialog = async () => {
    preparingCreateDialog.value = true;

    try {
        const userId = await syncProjectShowcaseUser({ createIfMissing: true });
        if (!userId) {
            toast.add({
                severity: 'error',
                summary: 'Не удалось подготовить создание проекта',
                detail: 'Пользователь проектной витрины не был зарегистрирован автоматически.',
                life: 3500,
            });
            return;
        }

        ensureSelectedMode();
        createDialogVisible.value = true;
    } finally {
        preparingCreateDialog.value = false;
    }
};

const openProject = (event) => {
    const project = event?.data || event;
    if (!project?.id) return;

    router.push({
        name: 'ProjectShowcaseDetails',
        params: { id: String(project.id) },
    });
};

const onPage = (event) => {
    currentPage.value = Number(event.page) + 1;
    rowsPerPage.value = Number(event.rows);
    loadProjects();
};

const handleProjectCreated = async () => {
    await syncProjectShowcaseUser();
    selectedMode.value = 'me';
    currentPage.value = 1;
    await loadProjects();
};

watch(availableModes, ensureSelectedMode);

watch(selectedMode, async (newMode, oldMode) => {
    if (newMode === oldMode) return;
    currentPage.value = 1;
    await loadProjects();
});

onMounted(() => {
    selectedMode.value = resolveDefaultProjectShowcaseMode(permissionStore, Boolean(showcaseUserId.value));
    loadPageContext();
});
</script>

<style scoped>
.project-showcase-page {
    --project-bg-1: var(--p-bg-color-2);
    --project-bg-2: var(--p-bg-color-1);
    --project-border: var(--p-grey-4);
    --project-shadow: 0 12px 32px rgba(15, 23, 42, 0.07);
    display: flex;
    flex-direction: column;
    height: 100dvh;
    box-sizing: border-box;
}

.content-wrapper {
    position: relative;
    flex-grow: 1;
    margin: 10px 2rem;
    height: 100%;
    color: var(--p-text-color);
    transition: all 0.5s;
}

.project-showcase-shell {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 1rem;
    min-height: 100%;
    padding: 1.25rem;
    border-radius: 18px;
    border: 1px solid var(--project-border);
    background:
        radial-gradient(1200px 220px at 10% 0%, rgba(var(--p-blue-500-rgb), 0.08), transparent 60%),
        linear-gradient(180deg, var(--project-bg-1) 0%, var(--project-bg-2) 85%);
}

.project-showcase-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    color: var(--p-text-color);
}

.project-showcase-copy h2 {
    margin: 0.75rem 0 0;
}

.project-showcase-copy p {
    margin: 0.75rem 0 0;
    max-width: 66ch;
    color: var(--p-text-color);
}

.project-showcase-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.project-showcase-table {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.project-table-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
    padding: 0.25rem 0;
}

.project-table-header-main {
    display: flex;
    gap: 0.9rem;
    align-items: flex-start;
}

.project-table-header-icon {
    width: 3rem;
    height: 3rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(var(--p-blue-500-rgb), 0.16), rgba(var(--p-blue-500-rgb), 0.06));
    color: var(--p-primary-color);
    font-size: 1.2rem;
    flex-shrink: 0;
}

.project-table-header-copy {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.project-table-header-topline {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.project-table-header-topline h3 {
    margin: 0;
    font-size: 1.2rem;
}

.project-table-header-copy p {
    margin: 0;
    color: var(--p-grey-1);
    max-width: 60ch;
    line-height: 1.5;
}

.project-table-header-controls {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.75rem;
}

.project-showcase-table :deep(.p-datatable),
.project-showcase-table :deep(.p-datatable-wrapper),
.project-showcase-table :deep(.p-datatable-table-container) {
    height: 100%;
}

.project-table-stats {
    display: flex;
    align-items: center;
    color: var(--p-grey-1);
}

.project-table-stats strong {
    color: var(--p-text-color);
}

.project-empty-state {
    min-height: 260px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
}

.project-empty-state i {
    font-size: 2.2rem;
    color: var(--p-text-color);
}

.project-empty-state h4,
.project-empty-state p {
    margin: 0;
}

.project-name-cell {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.project-name-cell small {
    color: var(--p-text-color);
    line-height: 1.45;
}

@media (max-width: 768px) {
    .content-wrapper {
        margin: 10px;
    }

    .project-showcase-shell {
        padding: 1rem;
    }

    .project-showcase-header,
    .project-table-header,
    .project-table-header-main,
    .project-table-header-controls {
        flex-direction: column;
        align-items: stretch;
    }
}
</style>
