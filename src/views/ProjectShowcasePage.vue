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

            <section v-if="showPrintFormTemplateUpload" class="project-template-card">
                <div class="project-template-copy">
                    <div class="project-template-icon">
                        <i class="pi pi-file-word"></i>
                    </div>
                    <div>
                        <h3>Шаблон печатной формы</h3>
                        <p>
                            Загрузите шаблон который будет использоваться для формирования печатной формы проекта.
                        </p>
                    </div>
                </div>

                <div class="project-template-actions">
                    <FileDropzone
                        class="project-template-dropzone"
                        :disabled="uploadingPrintFormTemplate"
                        accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        icon="pi pi-upload"
                        title="Перетащите шаблон сюда"
                        subtitle="или нажмите, чтобы выбрать .doc/.docx"
                        active-subtitle="Отпустите файл для загрузки"
                        compact
                        @select="onPrintFormTemplateSelected"
                    />
                    <Tag
                        v-if="printFormTemplateFileName"
                        :value="printFormTemplateFileName"
                        severity="secondary"
                    />
                </div>
            </section>

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
                :first="(currentPage - 1) * rowsPerPage"
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
                                            ? 'Публичные проекты, доступные всем пользователям'
                                            : selectedMode === 'me'
                                                ? 'Ваши проекты и проекты, в которых вы участвуете'
                                                : selectedMode === 'for-project-office-solution'
                                                    ? 'Проекты, ожидающие решения проектного офиса'
                                                    : 'Полный список проектов для расширенного доступа'
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
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { usePermissionStore } from '@/stores/permissions.js';
import { getCurrentUser } from '@/utils/currentUser.js';
import { fileToBase64 } from '@/utils/ido.js';
import { formatDateRuShortWithTime } from '@/utils/date.js';
import {
    addMeToProjectShowcaseSystem,
    getMeInProjectShowcaseSystem,
    getProjectsList,
    uploadProjectPrintFormTemplate,
} from '@/api/projectShowcase.js';
import {
    buildProjectShowcaseFullName,
    buildProjectShowcaseListModes,
    buildProjectShowcaseErrorMessage,
    canCreateProject,
    canCreateProjectSolution,
    clearProjectShowcaseUserId,
    getStoredProjectShowcaseUserId,
    isTeacherRole,
    normalizeProjectsList,
    resolveDefaultProjectShowcaseMode,
    resolveProjectShowcaseUserIdFromResponse,
    storeProjectShowcaseUserId,
} from '@/utils/projectShowcase.js';
import ProjectInitiationDialog from '@/components/ProjectShowcase/ProjectInitiationDialog.vue';
import FileDropzone from '@/components/Utils/FileDropzone.vue';

const permissionStore = usePermissionStore();
const router = useRouter();
const route = useRoute();
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
const uploadingPrintFormTemplate = ref(false);
const printFormTemplateFileName = ref('');
let projectQueryHydrating = false;
let projectModeWatchReady = false;

const parsePositiveNumber = (value, fallback) => {
    const normalized = Number(value);
    return Number.isFinite(normalized) && normalized > 0 ? normalized : fallback;
};

const availableModes = computed(() => buildProjectShowcaseListModes(permissionStore, Boolean(showcaseUserId.value)));

const currentModeLabel = computed(() =>
    availableModes.value.find((mode) => mode.value === selectedMode.value)?.label || 'Публичные'
);

const showCreateButton = computed(() =>
    isTeacherRole(currentUser.value) && canCreateProject(permissionStore)
);
const showPrintFormTemplateUpload = computed(() => canCreateProjectSolution(permissionStore));

const ensureSelectedMode = () => {
    const allowedModes = availableModes.value.map((mode) => mode.value);

    if (!allowedModes.includes(selectedMode.value)) {
        selectedMode.value = resolveDefaultProjectShowcaseMode(permissionStore, Boolean(showcaseUserId.value));
    }
};

const hydrateProjectQueryState = () => {
    currentPage.value = parsePositiveNumber(route.query.page, 1);
    rowsPerPage.value = parsePositiveNumber(route.query.pageSize, 10);

    if (typeof route.query.mode === 'string' && route.query.mode.trim()) {
        selectedMode.value = route.query.mode;
    }
};

const buildProjectQuery = () => ({
    mode: selectedMode.value,
    page: String(currentPage.value),
    pageSize: String(rowsPerPage.value),
});

const buildProjectListLocation = () => ({
    name: 'ProjectShowcaseList',
    query: buildProjectQuery(),
});

const syncProjectQueryState = async () => {
    const nextQuery = buildProjectQuery();
    const currentQuery = route.query;
    const nextKeys = Object.keys(nextQuery);
    const currentKeys = Object.keys(currentQuery);
    const sameLength = nextKeys.length === currentKeys.length;
    const sameEntries = nextKeys.every((key) => String(currentQuery[key] ?? '') === String(nextQuery[key] ?? ''));

    if (sameLength && sameEntries) return;

    await router.replace({ query: nextQuery });
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
        await syncProjectQueryState();
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

const onPrintFormTemplateSelected = async (files) => {
    const file = Array.from(files || [])[0];

    if (!file || uploadingPrintFormTemplate.value) return;

    const allowedMimeTypes = new Set([
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]);
    const normalizedFileName = String(file.name || '').toLowerCase();
    const isWordFile = normalizedFileName.endsWith('.doc')
        || normalizedFileName.endsWith('.docx')
        || allowedMimeTypes.has(file.type);

    if (!isWordFile) {
        toast.add({
            severity: 'warn',
            summary: 'Неверный формат файла',
            detail: 'Для шаблона печатной формы можно выбрать только файл Microsoft Word (.doc или .docx).',
            life: 3500,
        });
        printFormTemplateFileName.value = '';
        return;
    }

    uploadingPrintFormTemplate.value = true;
    printFormTemplateFileName.value = file.name;

    try {
        const base64Template = await fileToBase64(file);
        await uploadProjectPrintFormTemplate(base64Template);

        toast.add({
            severity: 'success',
            summary: 'Шаблон загружен',
            detail: `Файл "${file.name}" установлен для печатной формы проекта.`,
            life: 3000,
        });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Шаблон не загружен',
            detail: buildProjectShowcaseErrorMessage(error, 'Не удалось отправить выбранный файл.'),
            life: 3500,
        });
    } finally {
        uploadingPrintFormTemplate.value = false;
    }
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
        query: {
            returnMode: selectedMode.value,
            returnPage: String(currentPage.value),
            returnPageSize: String(rowsPerPage.value),
        },
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
    if (!projectModeWatchReady) return;
    if (projectQueryHydrating) return;
    currentPage.value = 1;
    await loadProjects();
});

onMounted(async () => {
    projectQueryHydrating = true;
    selectedMode.value = resolveDefaultProjectShowcaseMode(permissionStore, Boolean(showcaseUserId.value));
    hydrateProjectQueryState();
    projectQueryHydrating = false;
    await loadPageContext();
    projectModeWatchReady = true;
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

.project-template-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.1rem;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.16);
    border-radius: 18px;
    background: linear-gradient(135deg, rgba(var(--p-blue-500-rgb), 0.08), rgba(var(--p-blue-500-rgb), 0.03));
}

.project-template-copy {
    display: flex;
    align-items: flex-start;
    gap: 0.9rem;
}

.project-template-icon {
    width: 3rem;
    height: 3rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    background: rgba(var(--p-blue-500-rgb), 0.14);
    color: var(--p-primary-color);
    font-size: 1.2rem;
    flex-shrink: 0;
}

.project-template-copy h3,
.project-template-copy p {
    margin: 0;
}

.project-template-copy p {
    margin-top: 0.45rem;
    max-width: 66ch;
    color: var(--p-grey-1);
    line-height: 1.5;
}

.project-template-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.project-template-dropzone {
    width: min(100%, 22rem);
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
    .project-template-card,
    .project-template-copy,
    .project-table-header,
    .project-table-header-main,
    .project-table-header-controls {
        flex-direction: column;
        align-items: stretch;
    }

    .project-template-actions {
        justify-content: flex-start;
    }

    .project-template-dropzone {
        width: 100%;
    }
}
</style>
