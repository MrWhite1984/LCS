<template>
    <main class="pfw-page">
        <input
            ref="fileInputRef"
            type="file"
            class="pfw-file-input"
            accept=".pdf,.doc,.docx,.zip"
            @change="onFilePicked"
        />

        <section class="pfw-shell">
            <header class="pfw-header">
                <div class="pfw-copy">
                    <Tag rounded severity="info">Портфолио</Tag>
                    <h2>Учебные работы</h2>
                    <p v-if="selectedGroup">
                        {{ selectedGroup.groupName || 'Группа не указана'
                            }}{{ selectedGroup.course ? ` · ${selectedGroup.course} курс` : ''
                            }}{{ selectedGroup.specialtyCode ? ` · ${selectedGroup.specialtyCode}${selectedGroup.specialtyName ? ` ${selectedGroup.specialtyName}` : ''}` : '' }}
                    </p>
                    <p v-else>Загружайте работы по дисциплинам и просматривайте уже загруженные файлы.</p>
                </div>

                <div class="pfw-actions">
                    <Button
                        icon="pi pi-refresh"
                        label="Обновить"
                        outlined
                        severity="secondary"
                        :loading="loading"
                        :disabled="!selectedGroup"
                        @click="refresh"
                    />
                </div>
            </header>

            <section v-if="groupsLoading" class="pfw-empty">
                <ProgressSpinner style="width: 2.5rem; height: 2.5rem;" />
                <h4>Загрузка данных…</h4>
            </section>

            <section v-else-if="groupsError" class="pfw-empty">
                <i class="pi pi-exclamation-triangle"></i>
                <h4>Не удалось загрузить учебные работы</h4>
                <p>{{ groupsErrorDetail || 'Проверьте связь с системой UMU и попробуйте позже.' }}</p>
            </section>

            <section v-else-if="!groups.length" class="pfw-empty">
                <i class="pi pi-folder-open"></i>
                <h4>Записи не найдены</h4>
                <p>В системе UMU не найдено учебных записей для вашего аккаунта.</p>
            </section>

            <template v-else-if="selectedGroup">
                <div v-if="groups.length > 1" class="pfw-group-select">
                    <label>Группа</label>
                    <Select
                        :modelValue="selectedGroup"
                        :options="groups"
                        optionLabel="groupName"
                        placeholder="Выбрать группу"
                        @update:modelValue="selectGroup"
                    >
                        <template #option="{ option }">
                            <div class="pfw-group-option">
                                <strong>{{ option.groupName || 'Без названия' }}</strong>
                                <small>{{
                                    [
                                        option.course ? `${option.course} курс` : null,
                                        option.specialtyCode
                                            ? `${option.specialtyCode}${option.specialtyName ? ` ${option.specialtyName}` : ''}`
                                            : null,
                                    ].filter(Boolean).join(' · ') || 'Учебная запись'
                                }}</small>
                            </div>
                        </template>
                    </Select>
                </div>

                <section v-if="dataLoading && !portfolioGroups.length" class="pfw-empty">
                    <ProgressSpinner style="width: 2.5rem; height: 2.5rem;" />
                    <h4>Загрузка учебных работ…</h4>
                </section>

                <template v-else>
                    <section class="pfw-card">
                        <div class="pfw-card-head">
                            <div class="pfw-title-row">
                                <h3>Дисциплины и работы</h3>
                                <Tag :value="String(disciplines.length)" severity="contrast" />
                            </div>
                            <Tag
                                v-if="portfolioGroup?.levelName"
                                :value="portfolioGroup.levelName"
                                severity="secondary"
                            />
                        </div>

                        <div v-if="!disciplines.length" class="pfw-empty">
                            <i class="pi pi-book"></i>
                            <h4>Дисциплины не найдены</h4>
                            <p>Для выбранной учебной записи нет дисциплин с учебными работами.</p>
                        </div>

                        <div v-else class="pfw-disciplines-grid">
                            <article
                                v-for="discipline in disciplines"
                                :key="discipline.id"
                                class="pfw-discipline-card"
                            >
                                <div class="pfw-discipline-head">
                                    <div class="pfw-discipline-title">
                                        <h4>{{ discipline.name || 'Без названия' }}</h4>
                                        <div class="pfw-discipline-tags">
                                            <Tag
                                                v-if="discipline.objectTypeName"
                                                :value="discipline.objectTypeName"
                                                severity="info"
                                            />
                                            <Tag
                                                v-if="discipline.practiceTypeName"
                                                :value="discipline.practiceTypeName"
                                                severity="warn"
                                            />
                                            <Tag
                                                v-if="discipline.hasCourseWork"
                                                value="Курсовая работа"
                                                severity="secondary"
                                            />
                                            <Tag
                                                v-if="discipline.hasCourseProject"
                                                value="Курсовой проект"
                                                severity="secondary"
                                            />
                                        </div>
                                    </div>

                                    <div class="pfw-grade">
                                        <small>Оценка</small>
                                        <Tag
                                            v-if="gradeLabel(discipline)"
                                            severity="success"
                                            :value="gradeLabel(discipline)"
                                        />
                                        <span v-else>—</span>
                                    </div>
                                </div>

                                <div v-if="discipline.semesters?.length" class="pfw-semesters">
                                    <i class="pi pi-calendar"></i>
                                    <span>Семестры: {{ discipline.semesters.join(', ') }}</span>
                                </div>

                                <div class="pfw-files">
                                    <div class="pfw-files-head">
                                        <span>
                                            <i class="pi pi-paperclip"></i>
                                            Файлы
                                        </span>
                                        <Tag
                                            :value="`${filesCount(discipline)} / ${MAX_FILES_PER_DISCIPLINE}`"
                                            severity="contrast"
                                        />
                                    </div>

                                    <div v-if="!discipline.files?.length" class="pfw-files-empty">
                                        Работы по дисциплине пока не загружены.
                                    </div>

                                    <ul v-else class="pfw-file-list">
                                        <li
                                            v-for="file in discipline.files"
                                            :key="file.id"
                                            class="pfw-file-row"
                                        >
                                            <i class="pi pi-file"></i>
                                            <div class="pfw-file-copy">
                                                <span :title="file.fileName">{{ file.fileName }}</span>
                                                <small>
                                                    {{ formatFileSize(file.sizeBytes) }}
                                                    · {{ formatDateRuLongWithTime(file.uploadedAt) }}
                                                </small>
                                            </div>
                                            <Button
                                                icon="pi pi-download"
                                                text
                                                rounded
                                                severity="secondary"
                                                aria-label="Скачать работу"
                                                :loading="downloadingWorkId === file.id"
                                                @click="downloadWork(file)"
                                            />
                                        </li>
                                    </ul>
                                </div>

                                <div v-if="canUpload" class="pfw-upload-actions">
                                    <Button
                                        label="Загрузить работу"
                                        icon="pi pi-upload"
                                        outlined
                                        :loading="uploadingDisciplineId === discipline.id"
                                        :disabled="isUploadLimitReached(discipline)
                                            || (uploadingDisciplineId !== null && uploadingDisciplineId !== discipline.id)"
                                        @click="pickFileForDiscipline(discipline)"
                                    />
                                    <small v-if="isUploadLimitReached(discipline)" class="pfw-files-limit">
                                        Достигнут лимит: {{ MAX_FILES_PER_DISCIPLINE }} файла
                                    </small>
                                </div>
                            </article>
                        </div>
                    </section>
                </template>
            </template>
        </section>
    </main>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { usePermissionStore } from '@/stores/permissions.js';
import { useUmuStudentGroups } from '@/composables/useUmuStudentGroups.js';
import {
    getPortfolioDisciplines,
    uploadPortfolioWork,
    downloadPortfolioWork,
} from '@/api/portfolio.js';
import { formatDateRuLongWithTime, formatFileSize } from '@/utils/date.js';

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_FILES_PER_DISCIPLINE = 3;

const toast = useToast();
const permissionStore = usePermissionStore();

const {
    groups,
    groupsLoading,
    groupsError,
    groupsErrorDetail,
    selectedGroup,
    selectGroup,
} = useUmuStudentGroups();

const portfolioGroups = ref([]);
const fileInputRef = ref(null);
const pendingDisciplineId = ref(null);
const uploadingDisciplineId = ref(null);
const dataLoading = ref(false);
const downloadingWorkId = ref(null);

const canUpload = computed(() => permissionStore.hasPermission('Portfolio', 'Create'));
const loading = computed(() => groupsLoading.value || dataLoading.value);

const portfolioGroup = computed(() => {
    const studentId = selectedGroup.value?.studentId;
    if (!studentId) return null;

    return portfolioGroups.value.find((group) => group.studentId === studentId)
        ?? portfolioGroups.value[0]
        ?? null;
});

const disciplines = computed(() => portfolioGroup.value?.disciplines ?? []);

const filesCount = (discipline) => discipline?.files?.length || 0;
const isUploadLimitReached = (discipline) => filesCount(discipline) >= MAX_FILES_PER_DISCIPLINE;

const gradeLabel = (discipline) => (
    discipline?.grade?.shortText || discipline?.grade?.text || ''
);

const getErrorMessage = (error, fallback) => (
    error?.response?.data?.title
    || error?.response?.data?.error
    || error?.response?.data?.message
    || fallback
);

const getBlobErrorMessage = async (error, fallback) => {
    const data = error?.response?.data;

    if (data instanceof Blob) {
        try {
            const text = await data.text();
            const parsed = JSON.parse(text);
            return parsed.title || parsed.error || parsed.message || fallback;
        } catch {
            return fallback;
        }
    }

    return getErrorMessage(error, fallback);
};

const loadDisciplines = async () => {
    const studentId = selectedGroup.value?.studentId;
    if (!studentId) {
        portfolioGroups.value = [];
        return;
    }

    dataLoading.value = true;

    try {
        const response = await getPortfolioDisciplines(studentId);
        portfolioGroups.value = Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        portfolioGroups.value = [];
        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить дисциплины',
            detail: getErrorMessage(error, 'Попробуйте позже.'),
            life: 3500,
        });
    } finally {
        dataLoading.value = false;
    }
};

const refresh = async () => {
    if (!selectedGroup.value?.studentId) return;
    await loadDisciplines();
};

const pickFileForDiscipline = (discipline) => {
    if (!canUpload.value || uploadingDisciplineId.value !== null) return;

    if (isUploadLimitReached(discipline)) {
        toast.add({
            severity: 'warn',
            summary: 'Достигнут лимит файлов',
            detail: `К предмету можно прикрепить не более ${MAX_FILES_PER_DISCIPLINE} файлов.`,
            life: 3500,
        });
        return;
    }

    pendingDisciplineId.value = discipline.id;

    if (fileInputRef.value) {
        fileInputRef.value.value = '';
        fileInputRef.value.click();
    }
};

const onFilePicked = async (event) => {
    const file = event?.target?.files?.[0] || null;
    const disciplineId = pendingDisciplineId.value;

    event.target.value = '';
    pendingDisciplineId.value = null;

    if (!file || !disciplineId) return;

    if (file.size > MAX_FILE_SIZE) {
        toast.add({
            severity: 'error',
            summary: 'Файл слишком большой',
            detail: `Размер файла не должен превышать ${MAX_FILE_SIZE / (1024 * 1024)} МБ.`,
            life: 4000,
        });
        return;
    }

    await uploadWork(disciplineId, file);
};

const uploadWork = async (disciplineId, file) => {
    const studentId = selectedGroup.value?.studentId;
    if (!studentId || !disciplineId || !file) return;

    const discipline = disciplines.value.find((item) => item.id === disciplineId);
    if (!discipline) return;

    if (isUploadLimitReached(discipline)) {
        toast.add({
            severity: 'warn',
            summary: 'Достигнут лимит файлов',
            detail: `К предмету можно прикрепить не более ${MAX_FILES_PER_DISCIPLINE} файлов.`,
            life: 3500,
        });
        return;
    }

    uploadingDisciplineId.value = disciplineId;

    try {
        await uploadPortfolioWork({
            studentId,
            disciplineId,
            file,
        });

        toast.add({
            severity: 'success',
            summary: 'Работа загружена',
            detail: file.name,
            life: 3000,
        });

        await loadDisciplines();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить работу',
            detail: getErrorMessage(error, 'Попробуйте позже.'),
            life: 4000,
        });
    } finally {
        uploadingDisciplineId.value = null;
    }
};

const downloadWork = async (work) => {
    const studentId = selectedGroup.value?.studentId;
    if (!studentId || !work?.id) return;

    downloadingWorkId.value = work.id;

    try {
        const response = await downloadPortfolioWork({ studentId, workId: work.id });
        const url = window.URL.createObjectURL(new Blob([response.data], {
            type: work.contentType || 'application/octet-stream',
        }));

        const link = document.createElement('a');
        link.href = url;
        link.download = work.fileName || 'work';
        document.body.appendChild(link);
        link.click();
        link.remove();

        window.setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Не удалось скачать работу',
            detail: await getBlobErrorMessage(error, 'Попробуйте позже.'),
            life: 4000,
        });
    } finally {
        downloadingWorkId.value = null;
    }
};

watch(selectedGroup, async (group) => {
    if (!group?.studentId) return;

    portfolioGroups.value = [];
    await refresh();
}, { immediate: true });
</script>

<style scoped>
.pfw-page {
    --pfw-border: rgba(var(--p-blue-500-rgb), 0.14);
    min-height: 100%;
    padding: 10px;
}

.pfw-shell {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 100%;
    padding: 1.25rem;
    border-radius: 20px;
    border: 1px solid var(--pfw-border);
    background:
        radial-gradient(1000px 220px at 0% 0%, rgba(var(--p-blue-500-rgb), 0.08), transparent 60%),
        linear-gradient(180deg, var(--p-bg-color-2) 0%, var(--p-bg-color-1) 100%);
    box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
}

.pfw-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    flex-wrap: wrap;
}

.pfw-copy h2 {
    margin: 0.75rem 0 0;
}

.pfw-copy p {
    margin: 0.65rem 0 0;
    max-width: 70ch;
    color: var(--p-grey-1);
    line-height: 1.5;
}

.pfw-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.pfw-group-select {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    max-width: 32rem;
}

.pfw-group-select label {
    font-size: 0.78rem;
    color: var(--p-grey-1);
}

.pfw-group-select :deep(.p-select) {
    width: 100%;
}

.pfw-group-option {
    display: flex;
    flex-direction: column;
    gap: 0.12rem;
}

.pfw-group-option small {
    color: var(--p-text-muted-color, var(--p-grey-2));
    font-size: 0.74rem;
}

.pfw-card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.15rem;
    border-radius: 18px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.1);
    background:
        linear-gradient(
            180deg,
            color-mix(in srgb, var(--p-content-background) 96%, var(--p-primary-color) 4%),
            color-mix(in srgb, var(--p-content-background) 90%, var(--p-primary-color) 10%)
        );
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}

.pfw-card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.pfw-title-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.pfw-title-row h3 {
    margin: 0;
}

.pfw-file-input {
    display: none;
}

.pfw-disciplines-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 0.9rem;
}

.pfw-discipline-card {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 16px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
    background: color-mix(
        in srgb,
        var(--p-content-background) 94%,
        var(--p-primary-color) 6%
    );
    transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.pfw-discipline-card:hover {
    border-color: rgba(var(--p-blue-500-rgb), 0.28);
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.pfw-discipline-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
}

.pfw-discipline-title {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    min-width: 0;
}

.pfw-discipline-title h4 {
    margin: 0;
    line-height: 1.25;
}

.pfw-discipline-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
}

.pfw-grade {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.3rem;
    flex: 0 0 auto;
}

.pfw-grade small {
    color: var(--p-grey-1);
    font-size: 0.7rem;
}

.pfw-grade span {
    font-weight: 700;
}

.pfw-semesters {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--p-grey-1);
    font-size: 0.82rem;
}

.pfw-semesters i {
    color: var(--p-primary-color);
    font-size: 0.8rem;
}

.pfw-files {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 0.65rem;
    border-top: 1px dashed var(--p-grey-4);
}

.pfw-files-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 0.82rem;
    font-weight: 600;
}

.pfw-files-head > span {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
}

.pfw-files-head i {
    color: var(--p-primary-color);
}

.pfw-files-empty {
    color: var(--p-grey-1);
    font-size: 0.8rem;
}

.pfw-file-list {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin: 0;
    padding: 0;
    list-style: none;
}

.pfw-file-row {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.45rem 0.55rem;
    border-radius: 10px;
    background: rgba(var(--p-blue-500-rgb), 0.05);
}

.pfw-file-row > i {
    color: var(--p-primary-color);
    flex: 0 0 auto;
}

.pfw-file-copy {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
    flex: 1;
}

.pfw-file-copy span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.84rem;
}

.pfw-file-copy small {
    color: var(--p-grey-1);
    font-size: 0.72rem;
}

.pfw-upload-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
    margin-top: auto;
}

.pfw-files-limit {
    color: var(--p-orange-500);
    font-size: 0.74rem;
}

.pfw-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1.5rem;
    color: var(--p-grey-1);
    text-align: center;
}

.pfw-empty i {
    font-size: 1.8rem;
    color: var(--p-primary-color);
}

.pfw-empty h4,
.pfw-empty p {
    margin: 0;
}

@media (max-width: 760px) {
    .pfw-discipline-head {
        flex-direction: column;
    }

    .pfw-grade {
        align-items: flex-start;
    }
}
</style>
