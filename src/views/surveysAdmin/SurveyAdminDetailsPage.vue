<template>
    <section class="admin-panel">
        <div class="admin-panel-head">
            <div>
                <Button label="К списку" icon="pi pi-arrow-left" text severity="secondary" @click="router.push('/surveys/admin/surveys')" />
                <h3>{{ survey?.title || 'Опрос' }}</h3>
                <p>Настройки, вопросы, аудитория и результаты.</p>
            </div>
            <div class="admin-panel-actions">
                <Tag :value="survey?.status || 'Не задан'" severity="contrast" />
            </div>
        </div>

        <div v-if="loading" class="admin-empty"><ProgressSpinner style="width: 2.5rem; height: 2.5rem;" /><h4>Загрузка…</h4></div>
        <div v-else-if="error" class="admin-empty"><i class="pi pi-exclamation-triangle"></i><h4>Не удалось загрузить опрос</h4><p>{{ errorDetail }}</p></div>

        <template v-else-if="survey">
            <nav class="admin-subtabs">
                <button
                    v-for="tab in detailTabs"
                    :key="tab.id"
                    type="button"
                    class="admin-subtab"
                    :class="{ 'admin-subtab--active': activeTab === tab.id }"
                    @click="activeTab = tab.id"
                >
                    <i :class="tab.icon"></i>
                    {{ tab.label }}
                </button>
            </nav>

            <div v-if="activeTab === 'settings'" class="admin-card">
                <h4>Основное</h4>
                <div class="admin-form">
                    <div class="admin-field">
                        <label>Название</label>
                        <InputText v-model="form.title" class="w-full" />
                    </div>

                    <div class="admin-field">
                        <label>Описание</label>
                        <Textarea v-model="form.description" rows="3" autoResize class="w-full" />
                    </div>

                    <div class="admin-form-grid">
                        <div class="admin-field">
                            <label>Статус</label>
                            <Select v-model="form.status" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
                        </div>
                        <div class="admin-field">
                            <label>Анонимность</label>
                            <Select v-model="form.anonymousMode" :options="anonymousOptions" optionLabel="label" optionValue="value" class="w-full" />
                        </div>
                    </div>

                    <div class="admin-form-grid">
                        <div class="admin-field">
                            <label>Начало</label>
                            <DatePicker v-model="form.startsAt" dateFormat="dd.mm.yy" showButtonBar class="w-full" />
                        </div>
                        <div class="admin-field">
                            <label>Окончание</label>
                            <DatePicker v-model="form.endsAt" dateFormat="dd.mm.yy" showButtonBar class="w-full" />
                        </div>
                    </div>

                    <div class="admin-form-grid">
                        <div class="admin-field">
                            <label>Льготных дней</label>
                            <InputNumber v-model="form.graceDays" :min="0" :useGrouping="false" class="w-full" />
                        </div>
                        <div class="admin-field">
                            <label>Льготных входов</label>
                            <InputNumber v-model="form.graceAuthCount" :min="0" :useGrouping="false" class="w-full" />
                        </div>
                    </div>

                    <div class="admin-form-grid">
                        <div class="admin-field">
                            <label>Уведомить до закрытия, дней</label>
                            <InputNumber v-model="form.notifyDaysBeforeClose" :min="0" :useGrouping="false" class="w-full" />
                        </div>
                        <div class="admin-field">
                            <label>Повтор уведомления, дней</label>
                            <InputNumber v-model="form.notifyRepeatIntervalDays" :min="0" :useGrouping="false" class="w-full" />
                        </div>
                    </div>

                    <div class="admin-checkbox-row"><Checkbox v-model="form.isMandatory" binary inputId="details-mandatory" /><label for="details-mandatory">Обязательный</label></div>
                    <div class="admin-checkbox-row"><Checkbox v-model="form.allowMultiple" binary inputId="details-multiple" /><label for="details-multiple">Разрешить повторное прохождение</label></div>
                    <div class="admin-checkbox-row"><Checkbox v-model="form.notifyOnOpen" binary inputId="details-notify" /><label for="details-notify">Уведомлять об открытии</label></div>
                </div>

                <div class="admin-card-actions">
                    <Button label="Сохранить" icon="pi pi-save" :loading="saving" :disabled="!canUpdate" @click="saveSurvey" />
                    <Button v-if="canDelete" label="Удалить" icon="pi pi-trash" severity="danger" outlined @click="removeSurvey" />
                </div>
            </div>

            <div v-else-if="activeTab === 'questions'" class="admin-card">
                <div class="admin-card-head">
                    <h4>Вопросы</h4>
                    <Button v-if="canCreate" label="Добавить вопрос" icon="pi pi-plus" @click="openQuestionDialog()" />
                </div>

                <div v-if="questionsError" class="admin-questions-warning">
                    <i class="pi pi-exclamation-triangle"></i>
                    <span>Не удалось загрузить сохранённые вопросы: {{ questionsError }}</span>
                </div>

                <p v-if="!questions.length && !questionsError" class="admin-hint">
                    У опроса пока нет вопросов. Добавьте первый вопрос.
                </p>

                <VueDraggable
                    v-else
                    :model-value="questions"
                    :disabled="!canUpdate"
                    :animation="180"
                    handle=".admin-question-drag"
                    ghost-class="admin-question-ghost"
                    class="admin-question-list"
                    @update:model-value="onQuestionOrderChange"
                    @start="snapshotQuestionOrder"
                    @end="saveQuestionOrder"
                >
                    <article v-for="(question, index) in questions" :key="question.id" class="admin-question-row">
                        <span v-if="canUpdate" class="admin-question-drag" title="Перетащить вопрос">
                            <i class="pi pi-bars"></i>
                        </span>
                        <span class="admin-question-position">{{ index + 1 }}</span>
                        <div class="admin-question-copy">
                            <strong>{{ question.title }}</strong>
                            <small>{{ typeLabel(question.type) }} · обязательный: {{ question.isRequired ? 'да' : 'нет' }}</small>
                        </div>
                        <div class="admin-row-actions">
                            <template v-if="canUpdate">
                                <Button icon="pi pi-arrow-up" text rounded :disabled="index === 0" @click="moveQuestion(index, -1)" />
                                <Button icon="pi pi-arrow-down" text rounded :disabled="index === questions.length - 1" @click="moveQuestion(index, 1)" />
                                <Button icon="pi pi-pencil" text rounded @click="openQuestionDialog(question)" />
                            </template>
                            <Button v-if="canDelete" icon="pi pi-trash" text rounded severity="danger" @click="deleteQuestion(question)" />
                        </div>
                    </article>
                </VueDraggable>
            </div>

            <div v-else-if="activeTab === 'audience'" class="admin-card">
                <h4>Аудитория</h4>
                <div class="admin-form">
                    <div class="admin-field">
                        <label>Режим</label>
                        <Select v-model="audienceForm.mode" :options="audienceModeOptions" optionLabel="label" optionValue="value" class="w-full" />
                    </div>

                    <div v-if="audienceForm.mode === 'roles'" class="admin-field">
                        <label>Роли</label>
                        <MultiSelect
                            v-model="audienceForm.roleIds"
                            :options="roleOptions"
                            optionLabel="label"
                            optionValue="value"
                            display="chip"
                            filter
                            placeholder="Выберите роли"
                            class="w-full"
                        />
                    </div>

                    <div v-if="audienceForm.mode === 'condition'" class="admin-field">
                        <label>Условие аудитории</label>
                        <ConditionNodeEditor v-model="audienceForm.condition" />
                    </div>
                </div>

                <div class="admin-card-actions">
                    <Button label="Сохранить аудиторию" icon="pi pi-save" :loading="savingAudience" :disabled="!canUpdateAudience" @click="saveAudience" />
                    <Button label="Проверить пользователя" icon="pi pi-user" outlined @click="evaluateOpen = true" />
                    <Button v-if="canGrant" label="Выдать доступ" icon="pi pi-key" outlined @click="openGrantDialog" />
                </div>
            </div>

            <div v-else-if="activeTab === 'results'" class="admin-card">
                <SurveyResultsPanel :survey-id="id" />
            </div>
        </template>

        <Dialog v-model:visible="questionDialogVisible" :header="editingQuestion ? 'Редактировать вопрос' : 'Новый вопрос'" modal :draggable="false" class="survey-admin-dialog" :style="{ width: '100%', maxWidth: '760px' }">
            <div class="admin-form">
                <div class="admin-field">
                    <label>Тип</label>
                    <Select v-model="questionForm.type" :options="questionTypeOptions" optionLabel="label" optionValue="value" class="w-full" />
                </div>

                <div class="admin-field">
                    <label>Заголовок</label>
                    <InputText v-model="questionForm.title" class="w-full" />
                </div>

                <div class="admin-field">
                    <label>Подсказка</label>
                    <InputText v-model="questionForm.helpText" class="w-full" />
                </div>

                <div class="admin-checkbox-row"><Checkbox v-model="questionForm.isRequired" binary inputId="question-required" /><label for="question-required">Обязательный</label></div>

                <div v-if="['single', 'multi', 'select'].includes(questionForm.type)" class="admin-field">
                    <label>Варианты ответа</label>
                    <SurveyOptionsEditor v-model="questionForm.options" />
                </div>

                <div v-if="['scale', 'rating'].includes(questionForm.type)" class="admin-form-grid">
                    <div class="admin-field"><label>Минимум</label><InputNumber v-model="questionForm.scaleMin" :useGrouping="false" class="w-full" /></div>
                    <div class="admin-field"><label>Максимум</label><InputNumber v-model="questionForm.scaleMax" :useGrouping="false" class="w-full" /></div>
                </div>

                <div class="admin-field">
                    <label>Показывать при условии</label>
                    <ConditionNodeEditor v-model="questionForm.showWhen" allow-answer :questions="questions" />
                </div>
            </div>

            <template #footer>
                <Button label="Отмена" severity="secondary" text @click="questionDialogVisible = false" />
                <Button label="Сохранить" icon="pi pi-check" :loading="savingQuestion" @click="saveQuestion" />
            </template>
        </Dialog>

        <Dialog v-model:visible="evaluateOpen" header="Проверка аудитории" modal :draggable="false" class="survey-admin-dialog" :style="{ width: '100%', maxWidth: '520px' }">
            <div class="admin-form">
                <div class="admin-field">
                    <label>ID пользователя</label>
                    <InputText v-model="evaluateUserId" class="w-full" />
                </div>
            </div>
            <template #footer>
                <Button label="Проверить" icon="pi pi-search" :loading="evaluating" @click="evaluateAudience" />
            </template>
        </Dialog>

        <Dialog v-model:visible="grantOpen" header="Выдать доступ" modal :draggable="false" class="survey-admin-dialog" :style="{ width: '100%', maxWidth: '560px' }">
            <div class="admin-form">
                <div class="admin-field">
                    <label>Пользователь</label>
                    <AutoComplete
                        v-model="selectedGrantUser"
                        :suggestions="grantUserOptions"
                        optionLabel="fullName"
                        dropdown
                        forceSelection
                        showClear
                        placeholder="Начните вводить ФИО"
                        :loading="grantUserLoading"
                        class="w-full"
                        @complete="searchGrantUsers"
                        @clear="clearGrantUser"
                    />
                </div>
                <p class="admin-hint">
                    Доступ будет выдан на текущий опрос: «{{ survey?.title }}».
                </p>
            </div>
            <template #footer>
                <Button label="Выдать" icon="pi pi-key" :loading="granting" :disabled="!selectedGrantUser" @click="grantAccess" />
            </template>
        </Dialog>
    </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { debounce } from 'lodash';
import { VueDraggable } from 'vue-draggable-plus';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { usePermissionStore } from '@/stores/permissions.js';
import { getApiErrorMessage } from '@/utils/apiErrors.js';
import axiosInstance from '@/utils/axios.js';
import {
    createAdminQuestion,
    deleteAdminQuestion,
    deleteAdminSurvey,
    evaluateAdminAudience,
    getAdminSurvey,
    getAdminSurveyQuestions,
    getAdminUserOptions,
    grantAdminAccess,
    reorderAdminQuestions,
    updateAdminQuestion,
    updateAdminSurvey,
    upsertAdminAudience,
} from '@/api/surveysAdmin.js';
import SurveyResultsPanel from '@/components/SurveysAdmin/SurveyResultsPanel.vue';
import ConditionNodeEditor from '@/components/SurveysAdmin/ConditionNodeEditor.vue';
import SurveyOptionsEditor from '@/components/SurveysAdmin/SurveyOptionsEditor.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const permissionStore = usePermissionStore();

const id = computed(() => String(route.params.id || ''));
const survey = ref(null);
const questions = ref([]);
const questionsError = ref('');
const previousQuestions = ref([]);
const loading = ref(false);
const error = ref(false);
const errorDetail = ref('');
const saving = ref(false);
const savingAudience = ref(false);
const activeTab = ref('settings');

const canCreate = computed(() => permissionStore.hasPermission('SurveysAdmin', 'Create'));
const canUpdate = computed(() => permissionStore.hasPermission('SurveysAdmin', 'Update'));
const canDelete = computed(() => permissionStore.hasPermission('SurveysAdmin', 'Delete'));
const canUpdateAudience = computed(() => permissionStore.hasPermission('SurveysAudience', 'Update'));
const canReadAudience = computed(() => permissionStore.hasPermission('SurveysAudience', 'Read'));
const canReadResults = computed(() => permissionStore.hasPermission('SurveysResults', 'Read'));
const canGrant = computed(() => permissionStore.hasPermission('SurveysAccessGrant', 'Create'));

const detailTabs = computed(() => [
    { id: 'settings', label: 'Основное', icon: 'pi pi-cog' },
    { id: 'questions', label: 'Вопросы', icon: 'pi pi-list' },
    ...(canReadAudience.value ? [{ id: 'audience', label: 'Аудитория', icon: 'pi pi-users' }] : []),
    ...(canReadResults.value ? [{ id: 'results', label: 'Результаты', icon: 'pi pi-chart-bar' }] : []),
]);

const statusOptions = [
    { label: 'Черновик', value: 'draft' },
    { label: 'Активен', value: 'active' },
    { label: 'Закрыт', value: 'closed' },
    { label: 'Архив', value: 'archived' },
];
const anonymousOptions = [
    { label: 'Не анонимный', value: 'unspecified' },
    { label: 'Анонимный', value: 'open' },
    { label: 'Полуанонимный', value: 'semi' },
];
const audienceModeOptions = [
    { label: 'Все', value: 'all' },
    { label: 'Роли', value: 'roles' },
    { label: 'Условие', value: 'condition' },
];
const questionTypeOptions = [
    { label: 'Один вариант', value: 'single' },
    { label: 'Несколько вариантов', value: 'multi' },
    { label: 'Шкала', value: 'scale' },
    { label: 'Короткий текст', value: 'text' },
    { label: 'Длинный текст', value: 'longtext' },
    { label: 'Дата', value: 'date' },
    { label: 'Выпадающий список', value: 'select' },
    { label: 'Число', value: 'number' },
    { label: 'Целое число', value: 'integer' },
    { label: 'Email', value: 'email' },
    { label: 'ИНН', value: 'inn' },
    { label: 'Ссылка', value: 'url' },
    { label: 'Рейтинг', value: 'rating' },
    { label: 'Да / Нет', value: 'yes_no' },
    { label: 'Заголовок', value: 'heading' },
    { label: 'Город / страна', value: 'city_country' },
];

const questionTypeLabels = Object.fromEntries(questionTypeOptions.map((option) => [option.value, option.label]));
const typeLabel = (value) => questionTypeLabels[value] || value || '—';

const form = reactive({});
const audienceForm = reactive({ mode: 'all', roleIds: [], condition: null });
const roleOptions = ref([]);

const questionDialogVisible = ref(false);
const editingQuestion = ref(null);
const savingQuestion = ref(false);
const questionForm = reactive({
    type: 'text',
    title: '',
    helpText: '',
    isRequired: false,
    options: [],
    scaleMin: null,
    scaleMax: null,
    showWhen: null,
});

const evaluateOpen = ref(false);
const evaluateUserId = ref('');
const evaluating = ref(false);
const grantOpen = ref(false);
const selectedGrantUser = ref(null);
const grantUserOptions = ref([]);
const grantUserLoading = ref(false);
const granting = ref(false);


const fillForm = (data) => {
    Object.assign(form, {
        title: data.title || '',
        description: data.description || '',
        status: data.status || 'draft',
        isMandatory: Boolean(data.isMandatory),
        anonymousMode: data.anonymousMode || 'unspecified',
        allowMultiple: Boolean(data.allowMultiple),
        notifyOnOpen: Boolean(data.notifyOnOpen),
        graceDays: data.graceDays ?? null,
        graceAuthCount: data.graceAuthCount ?? null,
        notifyDaysBeforeClose: data.notifyDaysBeforeClose ?? null,
        notifyRepeatIntervalDays: data.notifyRepeatIntervalDays ?? null,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
    });
};

const fillAudience = (audience) => {
    audienceForm.mode = audience?.mode || 'all';
    audienceForm.roleIds = [...(audience?.roleIds || [])];
    audienceForm.condition = audience?.condition ? JSON.parse(JSON.stringify(audience.condition)) : null;
};

const loadRoles = async () => {
    try {
        const response = await axiosInstance.get('/api/rbac/roles');
        roleOptions.value = (response.data || []).map((role) => ({
            value: String(role.id),
            label: role.title || role.name || `Роль ${role.id}`,
        }));
    } catch {
        roleOptions.value = [];
    }
};

const loadSurvey = async () => {
    loading.value = true;
    error.value = false;
    errorDetail.value = '';
    questionsError.value = '';

    try {
        const [surveyResult, questionsResult] = await Promise.allSettled([
            getAdminSurvey(id.value),
            getAdminSurveyQuestions(id.value),
        ]);

        if (surveyResult.status === 'rejected') {
            throw surveyResult.reason;
        }

        const data = surveyResult.value.data;
        survey.value = data.survey || null;

        const adminQuestions = Array.isArray(data.survey?.questions)
            ? data.survey.questions
            : [];
        const loadedQuestions = questionsResult.status === 'fulfilled'
            && Array.isArray(questionsResult.value.data?.questions)
            ? questionsResult.value.data.questions
            : [];

        questions.value = loadedQuestions.length ? loadedQuestions : adminQuestions;

        if (questionsResult.status === 'rejected' && questions.value.length === 0) {
            questionsError.value = getApiErrorMessage(questionsResult.reason);
        }

        fillForm(survey.value || {});
        fillAudience(data.audience);
    } catch (requestError) {
        survey.value = null;
        questions.value = [];
        error.value = true;
        errorDetail.value = getApiErrorMessage(requestError);
    } finally {
        loading.value = false;
    }
};

const buildSurveyPayload = () => ({
    ...survey.value,
    title: form.title,
    description: form.description || null,
    status: form.status,
    isMandatory: form.isMandatory,
    anonymousMode: form.anonymousMode,
    allowMultiple: form.allowMultiple,
    notifyOnOpen: form.notifyOnOpen,
    graceDays: form.graceDays,
    graceAuthCount: form.graceAuthCount,
    notifyDaysBeforeClose: form.notifyDaysBeforeClose,
    notifyRepeatIntervalDays: form.notifyRepeatIntervalDays,
    startsAt: form.startsAt ? form.startsAt.toISOString() : null,
    endsAt: form.endsAt ? form.endsAt.toISOString() : null,
});

const saveSurvey = async () => {
    saving.value = true;
    try {
        const response = await updateAdminSurvey(id.value, buildSurveyPayload());
        survey.value = response.data;
        fillForm(survey.value || {});
        toast.add({ severity: 'success', summary: 'Опрос сохранён', life: 3000 });
    } catch (requestError) {
        toast.add({ severity: 'error', summary: 'Не удалось сохранить', detail: getApiErrorMessage(requestError), life: 4000 });
    } finally {
        saving.value = false;
    }
};

const removeSurvey = () => {
    confirm.require({
        message: `Удалить опрос «${survey.value?.title}»?`,
        header: 'Удаление опроса',
        icon: 'pi pi-exclamation-triangle',
        acceptProps: { label: 'Удалить', severity: 'danger' },
        rejectProps: { label: 'Отмена', severity: 'secondary', outlined: true },
        accept: async () => {
            try {
                await deleteAdminSurvey(id.value);
                toast.add({ severity: 'success', summary: 'Опрос удалён', life: 3000 });
                router.push('/surveys/admin/surveys');
            } catch (requestError) {
                toast.add({ severity: 'error', summary: 'Не удалось удалить', detail: getApiErrorMessage(requestError), life: 4000 });
            }
        },
    });
};


const openQuestionDialog = (question = null) => {
    editingQuestion.value = question;
    Object.assign(questionForm, {
        type: question?.type || 'text',
        title: question?.title || '',
        helpText: question?.helpText || '',
        isRequired: Boolean(question?.isRequired),
        options: JSON.parse(JSON.stringify(question?.options || [])),
        scaleMin: question?.scaleMin ?? null,
        scaleMax: question?.scaleMax ?? null,
        showWhen: question?.showWhen ? JSON.parse(JSON.stringify(question.showWhen)) : null,
    });
    questionDialogVisible.value = true;
};

const buildQuestionPayload = () => {
    const showWhen = questionForm.showWhen
        ? JSON.parse(JSON.stringify(questionForm.showWhen))
        : null;

    return {
        id: editingQuestion.value?.id || '',
        type: questionForm.type,
        title: questionForm.title,
        helpText: questionForm.helpText || null,
        isRequired: questionForm.isRequired,
        position: editingQuestion.value?.position || questions.value.length + 1,
        options: ['single', 'multi', 'select'].includes(questionForm.type)
            ? questionForm.options.map((option, index) => ({
                ...option,
                id: String(option.id || '').trim() || String(index + 1),
                label: String(option.label || '').trim(),
                position: index + 1,
                enabled: option.enabled !== false,
                semestr: option.semestr || null,
            })).filter((option) => option.label)
            : [],
        scaleMin: questionForm.scaleMin,
        scaleMax: questionForm.scaleMax,
        showWhen,
    };
};

const saveQuestion = async () => {
    const payload = buildQuestionPayload();
    if (!payload) return;

    savingQuestion.value = true;
    try {
        const response = editingQuestion.value
            ? await updateAdminQuestion(editingQuestion.value.id, payload)
            : await createAdminQuestion(id.value, payload);

        const saved = response.data;
        if (editingQuestion.value) {
            const index = questions.value.findIndex((item) => item.id === saved.id);
            if (index >= 0) questions.value[index] = saved;
        } else {
            questions.value.push(saved);
        }

        questionDialogVisible.value = false;
        toast.add({ severity: 'success', summary: 'Вопрос сохранён', life: 3000 });
    } catch (requestError) {
        toast.add({ severity: 'error', summary: 'Не удалось сохранить вопрос', detail: getApiErrorMessage(requestError), life: 4000 });
    } finally {
        savingQuestion.value = false;
    }
};

const deleteQuestion = (question) => {
    confirm.require({
        message: `Удалить вопрос «${question.title}»?`,
        header: 'Удаление вопроса',
        icon: 'pi pi-exclamation-triangle',
        acceptProps: { label: 'Удалить', severity: 'danger' },
        rejectProps: { label: 'Отмена', severity: 'secondary', outlined: true },
        accept: async () => {
            try {
                await deleteAdminQuestion(question.id);
                questions.value = questions.value.filter((item) => item.id !== question.id);
                toast.add({ severity: 'success', summary: 'Вопрос удалён', life: 3000 });
            } catch (requestError) {
                toast.add({ severity: 'error', summary: 'Не удалось удалить', detail: getApiErrorMessage(requestError), life: 4000 });
            }
        },
    });
};

const snapshotQuestionOrder = () => {
    previousQuestions.value = JSON.parse(JSON.stringify(questions.value));
};

const onQuestionOrderChange = (value) => {
    questions.value = value.map((question, index) => ({ ...question, position: index + 1 }));
};

const saveQuestionOrder = async () => {
    const currentIds = questions.value.map((question) => question.id);
    const previousIds = previousQuestions.value.map((question) => question.id);

    if (currentIds.join('|') === previousIds.join('|')) return;

    try {
        await reorderAdminQuestions(id.value, currentIds);
    } catch (requestError) {
        questions.value = previousQuestions.value;
        toast.add({ severity: 'error', summary: 'Не удалось изменить порядок', detail: getApiErrorMessage(requestError), life: 4000 });
    }
};

const moveQuestion = async (index, offset) => {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= questions.value.length) return;

    const previous = [...questions.value];
    const next = [...questions.value];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    questions.value = next.map((question, position) => ({ ...question, position: position + 1 }));

    try {
        await reorderAdminQuestions(id.value, next.map((question) => question.id));
    } catch (requestError) {
        questions.value = previous;
        toast.add({ severity: 'error', summary: 'Не удалось изменить порядок', detail: getApiErrorMessage(requestError), life: 4000 });
    }
};

const buildAudience = () => {
    if (audienceForm.mode === 'condition') {
        const condition = audienceForm.condition
            ? JSON.parse(JSON.stringify(audienceForm.condition))
            : null;

        if (!condition) {
            toast.add({ severity: 'error', summary: 'Добавьте условие аудитории', life: 3500 });
            return null;
        }

        return { mode: 'condition', roleIds: [], condition };
    }

    if (audienceForm.mode === 'roles') {
        return {
            mode: 'roles',
            roleIds: [...audienceForm.roleIds],
            condition: null,
        };
    }

    return { mode: 'all', roleIds: [], condition: null };
};

const saveAudience = async () => {
    const audience = buildAudience();
    if (!audience) return;

    savingAudience.value = true;
    try {
        await upsertAdminAudience(id.value, audience);
        toast.add({ severity: 'success', summary: 'Аудитория сохранена', life: 3000 });
    } catch (requestError) {
        toast.add({ severity: 'error', summary: 'Не удалось сохранить аудиторию', detail: getApiErrorMessage(requestError), life: 4000 });
    } finally {
        savingAudience.value = false;
    }
};

const evaluateAudience = async () => {
    const audience = buildAudience();
    if (!audience || !evaluateUserId.value.trim()) return;

    evaluating.value = true;
    try {
        const response = await evaluateAdminAudience({ userId: evaluateUserId.value.trim(), audience });
        toast.add({
            severity: response.data?.result ? 'success' : 'info',
            summary: response.data?.result ? 'Пользователь входит в аудиторию' : 'Пользователь не входит в аудиторию',
            life: 3500,
        });
        evaluateOpen.value = false;
    } catch (requestError) {
        toast.add({ severity: 'error', summary: 'Не удалось проверить', detail: getApiErrorMessage(requestError), life: 4000 });
    } finally {
        evaluating.value = false;
    }
};

const searchGrantUsers = debounce(async (event) => {
    const search = String(event?.query || '').trim();
    grantUserLoading.value = true;

    try {
        const response = await getAdminUserOptions({
            search: search || undefined,
            limit: 20,
        });
        grantUserOptions.value = Array.isArray(response.data) ? response.data : [];
    } catch {
        grantUserOptions.value = [];
    } finally {
        grantUserLoading.value = false;
    }
}, 300);

const clearGrantUser = () => {
    selectedGrantUser.value = null;
    grantUserOptions.value = [];
};

const openGrantDialog = () => {
    selectedGrantUser.value = null;
    grantUserOptions.value = [];
    grantOpen.value = true;
};

const grantAccess = async () => {
    if (!selectedGrantUser.value?.id) {
        toast.add({ severity: 'error', summary: 'Выберите пользователя', life: 3000 });
        return;
    }

    granting.value = true;
    try {
        await grantAdminAccess({
            userId: selectedGrantUser.value.id,
            surveyIds: [id.value],
        });
        toast.add({ severity: 'success', summary: 'Доступ выдан', life: 3000 });
        grantOpen.value = false;
        clearGrantUser();
    } catch (requestError) {
        toast.add({ severity: 'error', summary: 'Не удалось выдать доступ', detail: getApiErrorMessage(requestError), life: 4000 });
    } finally {
        granting.value = false;
    }
};

onMounted(() => {
    loadSurvey();
    loadRoles();
});
</script>

<style scoped>
.admin-panel { display: flex; flex-direction: column; gap: 1rem; }
.admin-panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.admin-panel-head h3 { margin: 0.35rem 0 0; }
.admin-panel-head p { margin: 0.35rem 0 0; color: var(--p-grey-1); }
.admin-panel-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.admin-subtabs { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.admin-subtab { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.5rem 0.75rem; border: 1px solid rgba(var(--p-blue-500-rgb), 0.14); border-radius: 10px; background: transparent; color: var(--p-text-color); cursor: pointer; }
.admin-subtab--active { background: var(--p-primary-color); color: #fff; border-color: var(--p-primary-color); }
.admin-card { display: flex; flex-direction: column; gap: 1.15rem; padding: 1.25rem; border: 1px solid rgba(var(--p-blue-500-rgb), 0.12); border-radius: 16px; background: color-mix(in srgb, var(--p-content-background) 94%, var(--p-primary-color) 6%); }
.admin-card > h4 { margin: 0; padding-bottom: 0.65rem; border-bottom: 1px solid rgba(var(--p-blue-500-rgb), 0.12); font-size: 1.05rem; line-height: 1.3; }
.admin-card-head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; }
.admin-card-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; padding-top: 0.75rem; border-top: 1px dashed var(--p-grey-4); }
.admin-form { display: flex; flex-direction: column; gap: 1rem; }
.admin-field { display: flex; flex-direction: column; gap: 0.35rem; min-width: 0; }
.admin-form label,
.admin-field label { font-size: 0.86rem; font-weight: 600; line-height: 1.3; color: var(--p-text-color); }
.admin-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem 1.25rem; }
.admin-checkbox-row { display: flex; align-items: center; gap: 0.55rem; padding: 0.65rem 0.75rem; border-radius: 12px; background: rgba(var(--p-blue-500-rgb), 0.04); }
.admin-checkbox-row label { font-size: 0.85rem; font-weight: 500; cursor: pointer; }
.admin-question-list { display: flex; flex-direction: column; gap: 0.6rem; }
.admin-question-row { display: flex; align-items: center; gap: 0.65rem; padding: 0.75rem; border: 1px solid rgba(var(--p-blue-500-rgb), 0.1); border-radius: 12px; background: rgba(var(--p-blue-500-rgb), 0.04); }
.admin-question-drag { display: inline-flex; align-items: center; justify-content: center; width: 1.6rem; height: 1.8rem; border-radius: 8px; color: var(--p-grey-1); cursor: grab; }
.admin-question-drag:hover { background: rgba(var(--p-blue-500-rgb), 0.1); color: var(--p-primary-color); }
.admin-question-drag:active { cursor: grabbing; }
.admin-question-ghost { opacity: 0.35; border-color: var(--p-primary-color); }
.admin-question-position { display: grid; place-items: center; width: 1.8rem; height: 1.8rem; border-radius: 999px; background: rgba(var(--p-blue-500-rgb), 0.12); font-weight: 700; }
.admin-question-copy { display: flex; flex-direction: column; gap: 0.1rem; flex: 1; min-width: 0; }
.admin-question-copy small { color: var(--p-grey-1); }
.admin-row-actions { display: flex; gap: 0.15rem; }
.admin-empty { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 2rem; color: var(--p-grey-1); text-align: center; }
.admin-hint { margin: 0; padding: 0.65rem; border-radius: 10px; background: rgba(var(--p-orange-500-rgb, 245, 158, 11), 0.08); color: var(--p-grey-1); font-size: 0.82rem; }
.admin-questions-warning { display: flex; align-items: flex-start; gap: 0.45rem; padding: 0.65rem; border-radius: 10px; background: rgba(var(--p-orange-500-rgb, 245, 158, 11), 0.1); color: var(--p-orange-500); font-size: 0.82rem; }
@media (max-width: 700px) { .admin-form-grid { grid-template-columns: 1fr; } }
</style>

