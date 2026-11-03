<template>
    <section class="admin-panel">
        <div class="admin-panel-head">
            <div>
                <h3>Опросы</h3>
                <p>{{ canManageAll ? 'Создание, публикация и управление опросами.' : 'Показаны только ваши опросы.' }}</p>
            </div>
            <div class="admin-panel-actions">
                <Button
                    v-if="canCreate"
                    label="Создать опрос"
                    icon="pi pi-plus"
                    @click="openCreate"
                />
                <Button
                    label="Обновить"
                    icon="pi pi-refresh"
                    outlined
                    severity="secondary"
                    :loading="loading"
                    @click="loadSurveys"
                />
            </div>
        </div>

        <div class="admin-filters">
            <Select
                v-model="filters.status"
                :options="statusOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Статус"
                showClear
            />
            <InputText v-model="filters.templateId" placeholder="ID шаблона" />
            <Button label="Применить" icon="pi pi-filter" @click="applyFilters" />
        </div>

        <div v-if="loading" class="admin-surveys-grid">
            <article
                v-for="index in 6"
                :key="`survey-skeleton-${index}`"
                class="admin-survey-card admin-survey-card--skeleton"
            >
                <div class="admin-survey-card-head">
                    <Skeleton shape="circle" size="2.6rem" />
                    <Skeleton width="5rem" height="1.4rem" />
                </div>
                <div class="admin-survey-card-body">
                    <Skeleton width="82%" height="1rem" />
                    <Skeleton width="100%" height="0.75rem" />
                    <Skeleton width="65%" height="0.75rem" />
                </div>
                <Skeleton width="100%" height="2.2rem" />
            </article>
        </div>

        <div v-else-if="!surveys.length" class="admin-empty">
            <i class="pi pi-inbox"></i>
            <h4>Опросы не найдены</h4>
            <p>Измените фильтры или создайте новый опрос.</p>
        </div>

        <template v-else>
            <div class="admin-surveys-grid">
                <article
                    v-for="survey in surveys"
                    :key="survey.id"
                    class="admin-survey-card"
                    @click="openSurvey(survey)"
                >
                    <div class="admin-survey-card-head">
                        <span class="admin-survey-card-icon"><i class="pi pi-clipboard"></i></span>
                        <Tag :value="statusLabel(survey.status)" :severity="statusSeverity(survey.status)" />
                    </div>

                    <div class="admin-survey-card-body">
                        <h4 :title="survey.title">{{ survey.title }}</h4>
                        <p v-if="survey.description">{{ survey.description }}</p>

                        <div class="admin-survey-card-tags">
                            <Tag v-if="survey.isMandatory" value="Обязательный" severity="danger" />
                            <Tag v-if="anonymousLabel(survey.anonymousMode)" :value="anonymousLabel(survey.anonymousMode)" :severity="anonymousSeverity(survey.anonymousMode)" />
                        </div>
                    </div>

                    <div class="admin-survey-card-meta">
                        <span><i class="pi pi-calendar"></i>{{ formatDateRuShort(survey.startsAt) }}</span>
                        <span><i class="pi pi-calendar-times"></i>{{ formatDateRuShort(survey.endsAt) }}</span>
                    </div>

                    <div class="admin-survey-card-actions" @click.stop>
                        <Button icon="pi pi-pencil" text rounded aria-label="Открыть" @click="openSurvey(survey)" />
                        <Button
                            v-if="canUpdate && survey.status !== 'active'"
                            icon="pi pi-play"
                            text
                            rounded
                            severity="success"
                            aria-label="Опубликовать"
                            @click="publish(survey)"
                        />
                        <Button
                            v-if="canUpdate && survey.status === 'active'"
                            icon="pi pi-stop"
                            text
                            rounded
                            severity="warn"
                            aria-label="Закрыть"
                            @click="close(survey)"
                        />
                        <Button
                            v-if="canDelete"
                            icon="pi pi-trash"
                            text
                            rounded
                            severity="danger"
                            aria-label="Удалить"
                            @click="remove(survey)"
                        />
                    </div>
                </article>
            </div>

            <Paginator
                v-if="total > pageSize"
                :first="(page - 1) * pageSize"
                :rows="pageSize"
                :totalRecords="total"
                :rowsPerPageOptions="[10, 20, 50]"
                @page="onPage"
            />
        </template>

        <Dialog v-model:visible="createVisible" header="Новый опрос" modal :draggable="false" class="survey-admin-dialog" :style="{ width: '100%', maxWidth: '640px' }">
            <div class="admin-form">
                <label>Название</label>
                <InputText v-model="createForm.title" class="w-full" />

                <label>Описание</label>
                <Textarea v-model="createForm.description" rows="3" autoResize class="w-full" />

                <div class="admin-form-grid">
                    <div>
                        <label>Статус</label>
                        <Select v-model="createForm.status" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
                    </div>
                    <div>
                        <label>Анонимность</label>
                        <Select v-model="createForm.anonymousMode" :options="anonymousOptions" optionLabel="label" optionValue="value" class="w-full" />
                    </div>
                </div>

                <div class="admin-form-grid">
                    <div>
                        <label>Начало</label>
                        <DatePicker v-model="createForm.startsAt" dateFormat="dd.mm.yy" showButtonBar class="w-full" />
                    </div>
                    <div>
                        <label>Окончание</label>
                        <DatePicker v-model="createForm.endsAt" dateFormat="dd.mm.yy" showButtonBar class="w-full" />
                    </div>
                </div>

                <div class="admin-checkbox-row">
                    <Checkbox v-model="createForm.isMandatory" binary inputId="survey-mandatory" />
                    <label for="survey-mandatory">Обязательный опрос</label>
                </div>

                <div class="admin-checkbox-row">
                    <Checkbox v-model="createForm.allowMultiple" binary inputId="survey-multiple" />
                    <label for="survey-multiple">Разрешить повторное прохождение</label>
                </div>
            </div>

            <template #footer>
                <Button label="Отмена" severity="secondary" text @click="createVisible = false" />
                <Button label="Создать" icon="pi pi-check" :loading="creating" :disabled="!createForm.title.trim()" @click="createSurvey" />
            </template>
        </Dialog>
    </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { usePermissionStore } from '@/stores/permissions.js';
import { formatDateRuShort } from '@/utils/date.js';
import { getApiErrorMessage } from '@/utils/apiErrors.js';
import {
    createAdminSurvey,
    closeAdminSurvey,
    deleteAdminSurvey,
    getAdminAllSurveys,
    getAdminMySurveys,
    publishAdminSurvey,
} from '@/api/surveysAdmin.js';

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const permissionStore = usePermissionStore();

const surveys = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const creating = ref(false);
const createVisible = ref(false);

const filters = reactive({
    status: null,
    templateId: '',
});

const statusOptions = [
    { label: 'Черновик', value: 'draft' },
    { label: 'Активен', value: 'active' },
    { label: 'Закрыт', value: 'closed' },
    { label: 'Архив', value: 'archived' },
];

const anonymousOptions = [
    { label: 'Открытый', value: 'open' },
    { label: 'Анонимный', value: 'semi' },
];

const statusLabels = {
    draft: 'Черновик',
    active: 'Активен',
    closed: 'Закрыт',
    archived: 'Архив',
};

const statusSeverities = {
    draft: 'secondary',
    active: 'success',
    closed: 'warn',
    archived: 'contrast',
};

const statusLabel = (status) => statusLabels[status] || status || 'вЂ”';
const statusSeverity = (status) => statusSeverities[status] || 'secondary';
const anonymousLabel = (mode) => {
    if (mode === 'semi') return 'Анонимный';
    if (mode === 'open') return '';
    return 'Ошибка';
};
const anonymousSeverity = (mode) => (mode === 'open' || mode === 'semi' ? 'info' : 'danger');

const createForm = reactive({
    title: '',
    description: '',
    status: 'draft',
    anonymousMode: 'open',
    isMandatory: false,
    allowMultiple: false,
    startsAt: null,
    endsAt: null,
});

const canCreate = computed(() => permissionStore.hasPermission('SurveysAdmin', 'Create'));
const canUpdate = computed(() => permissionStore.hasPermission('SurveysAdmin', 'Update'));
const canDelete = computed(() => permissionStore.hasPermission('SurveysAdmin', 'Delete'));
const canManageAll = computed(() => permissionStore.hasPermission('SurveysAdmin', 'ManageAll'));

const loadSurveys = async () => {
    loading.value = true;
    try {
        const params = {
            status: filters.status || undefined,
            templateId: filters.templateId || undefined,
            page: page.value,
            pageSize: pageSize.value,
        };

        const response = canManageAll.value
            ? await getAdminAllSurveys(params)
            : await getAdminMySurveys(params);
        surveys.value = Array.isArray(response.data?.surveys) ? response.data.surveys : [];
        total.value = Number(response.data?.total || 0);
    } catch (error) {
        surveys.value = [];
        total.value = 0;
        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить опросы',
            detail: getApiErrorMessage(error),
            life: 3500,
        });
    } finally {
        loading.value = false;
    }
};

const applyFilters = () => {
    page.value = 1;
    loadSurveys();
};

const onPage = (event) => {
    page.value = event.page + 1;
    pageSize.value = event.rows;
    loadSurveys();
};

const openSurvey = (survey) => {
    router.push(`/surveys/admin/surveys/${encodeURIComponent(survey.id)}`);
};

const openCreate = () => {
    Object.assign(createForm, {
        title: '',
        description: '',
        status: 'draft',
        anonymousMode: 'open',
        isMandatory: false,
        allowMultiple: false,
        startsAt: null,
        endsAt: null,
    });
    createVisible.value = true;
};

const createSurvey = async () => {
    creating.value = true;
    try {
        const payload = {
            title: createForm.title.trim(),
            status: createForm.status,
            anonymousMode: createForm.anonymousMode,
            isMandatory: createForm.isMandatory,
            allowMultiple: createForm.allowMultiple,
        };

        if (createForm.description.trim()) {
            payload.description = createForm.description.trim();
        }

        if (createForm.startsAt) {
            payload.startsAt = createForm.startsAt.toISOString();
        }

        if (createForm.endsAt) {
            payload.endsAt = createForm.endsAt.toISOString();
        }

        const response = await createAdminSurvey(payload);
        createVisible.value = false;
        toast.add({ severity: 'success', summary: 'Опрос создан', life: 3000 });
        if (response.data?.id) {
            router.push(`/surveys/admin/surveys/${encodeURIComponent(response.data.id)}`);
        } else {
            await loadSurveys();
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Не удалось создать опрос', detail: getApiErrorMessage(error), life: 4000 });
    } finally {
        creating.value = false;
    }
};

const publish = async (survey) => {
    try {
        await publishAdminSurvey(survey.id);
        toast.add({ severity: 'success', summary: 'Опрос опубликован', life: 3000 });
        await loadSurveys();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Не удалось опубликовать', detail: getApiErrorMessage(error), life: 4000 });
    }
};

const close = async (survey) => {
    try {
        await closeAdminSurvey(survey.id);
        toast.add({ severity: 'success', summary: 'Опрос закрыт', life: 3000 });
        await loadSurveys();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Не удалось закрыть', detail: getApiErrorMessage(error), life: 4000 });
    }
};

const remove = (survey) => {
    confirm.require({
        message: `Удалить опрос «${survey.title}»?`,
        header: 'Удаление опроса',
        icon: 'pi pi-exclamation-triangle',
        acceptProps: { label: 'Удалить', severity: 'danger' },
        rejectProps: { label: 'Отмена', severity: 'secondary', outlined: true },
        accept: async () => {
            try {
                await deleteAdminSurvey(survey.id);
                toast.add({ severity: 'success', summary: 'Опрос удалён', life: 3000 });
                await loadSurveys();
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Не удалось удалить', detail: getApiErrorMessage(error), life: 4000 });
            }
        },
    });
};

onMounted(loadSurveys);
</script>

<style scoped>
.admin-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.admin-panel-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
}

.admin-panel-head h3 {
    margin: 0;
}

.admin-panel-head p {
    margin: 0.35rem 0 0;
    color: var(--p-grey-1);
}

.admin-panel-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.admin-filters {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.75rem;
    padding: 0.85rem;
    border-radius: 14px;
    border: 1px dashed rgba(var(--p-blue-500-rgb), 0.16);
    background: rgba(var(--p-blue-500-rgb), 0.03);
}

.admin-filters > * {
    min-width: 0;
}

.admin-row-actions {
    display: flex;
    gap: 0.15rem;
}

.admin-surveys-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 0.9rem;
}

.admin-survey-card {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 16px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
    background: color-mix(in srgb, var(--p-content-background) 94%, var(--p-primary-color) 6%);
    cursor: pointer;
    transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.admin-survey-card:hover {
    border-color: rgba(var(--p-blue-500-rgb), 0.28);
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.admin-survey-card--skeleton {
    cursor: default;
    pointer-events: none;
}

.admin-survey-card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
}

.admin-survey-card-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.6rem;
    height: 2.6rem;
    flex: 0 0 2.6rem;
    border-radius: 12px;
    color: var(--p-primary-color);
    background: rgba(var(--p-blue-500-rgb), 0.12);
    font-size: 1.15rem;
}

.admin-survey-card-body {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    flex: 1;
    min-width: 0;
}

.admin-survey-card-body h4 {
    margin: 0;
    font-size: 1.02rem;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.admin-survey-card-body p {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0;
    color: var(--p-grey-1);
    font-size: 0.82rem;
    line-height: 1.4;
}

.admin-survey-card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
}

.admin-survey-card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 0.9rem;
    color: var(--p-grey-1);
    font-size: 0.78rem;
}

.admin-survey-card-meta span {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
}

.admin-survey-card-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.15rem;
    margin-top: auto;
    padding-top: 0.5rem;
    border-top: 1px dashed var(--p-grey-4);
}

.admin-form {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
}

.admin-form label {
    font-size: 0.78rem;
    color: var(--p-grey-1);
}

.admin-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
}

.admin-checkbox-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

@media (max-width: 900px) {
    .admin-filters {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 600px) {
    .admin-filters,
    .admin-form-grid {
        grid-template-columns: 1fr;
    }
}
</style>

