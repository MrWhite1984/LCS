<template>
    <main class="project-details-page">
        <section class="project-details-shell">
            <header class="project-details-header">
                <div class="project-details-copy">
                    <Button
                        label="Назад к списку"
                        icon="pi pi-arrow-left"
                        text
                        class="project-back-button"
                        @click="router.push({ name: 'ProjectShowcaseList' })"
                    />
                    <div class="project-details-title-row">
                        <h2>{{ project?.name || 'Карточка проекта' }}</h2>
                        <Tag :severity="project?.isPublic ? 'success' : 'secondary'" :value="describeProjectVisibility(project)" />
                        <Tag v-if="detailsMode === 'su'" severity="contrast" value="Режим SU" />
                    </div>
                    <p>{{ project?.shortDescription || 'Описание проекта пока не заполнено.' }}</p>
                </div>

                <div class="project-details-actions">
                    <Button
                        icon="pi pi-refresh"
                        label="Обновить"
                        outlined
                        severity="secondary"
                        :loading="loading"
                        @click="refreshProject"
                    />
                    <Button
                        v-if="canCreateSolutionAction"
                        label="Создать решение"
                        icon="pi pi-check-square"
                        :loading="ensuringShowcaseIdentity"
                        @click="openSolutionDialog"
                    />
                    <Button
                        v-if="canPublishAction"
                        label="Опубликовать"
                        icon="pi pi-globe"
                        severity="success"
                        :loading="publishing"
                        @click="publishProjectVisibility"
                    />
                </div>
            </header>

            <div v-if="loading && !project" class="project-details-loading">
                <ProgressSpinner style="width: 48px; height: 48px" />
            </div>

            <template v-else-if="project">
                <section class="project-summary-grid">
                    <article class="project-summary-card">
                        <span>Инициатор</span>
                        <strong>{{ buildProjectShowcaseFullName(project.initiator?.user) }}</strong>
                    </article>
                    <article class="project-summary-card">
                        <span>Менеджер</span>
                        <strong>{{ buildProjectShowcaseFullName(project.projectManager?.user) }}</strong>
                    </article>
                    <article class="project-summary-card">
                        <span>Срок</span>
                        <strong>{{ formatDateRuLong(project.estimatedImplementationPeriod, 'Не указан') }}</strong>
                    </article>
                    <article class="project-summary-card">
                        <span>Обновлено</span>
                        <strong>{{ formatDateRuShortWithTime(project.updatedAt, '-') }}</strong>
                    </article>
                </section>

                <Tabs v-model:value="activeTab">
                    <TabList>
                        <Tab value="general" as="div">Общая информация</Tab>
                        <Tab value="team" as="div">Команда проекта</Tab>
                        <Tab value="journal" as="div">Журнал</Tab>
                        <Tab value="consultations" as="div">Консультации</Tab>
                        <Tab value="roadmap" as="div">Дорожная карта</Tab>
                        <Tab value="documents" as="div">Документы</Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel value="general">
                            <div class="project-tab-content">
                                <section v-if="projectRejected" class="project-rejected-card">
                                    <div class="project-rejected-icon">
                                        <i class="pi pi-times-circle"></i>
                                    </div>
                                    <div class="project-rejected-copy">
                                        <div class="project-rejected-topline">
                                            <h3>Проект отклонён</h3>
                                            <Tag severity="danger" value="Отклонён" />
                                        </div>
                                        <p>Проектный офис отклонил проект. Заполнение чек-листа и дальнейшее редактирование недоступны.</p>
                                    </div>
                                </section>

                                <section v-else-if="checklistVisible" class="project-checklist-card">
                                    <div class="project-section-head">
                                        <div>
                                            <h3>Чек-лист публикации</h3>
                                            <p>Публикация станет доступна после заполнения всех обязательных этапов.</p>
                                        </div>
                                        <Tag :severity="canPublishAction ? 'success' : 'secondary'" :value="canPublishAction ? 'Готово к публикации' : 'Ещё не готово'" />
                                    </div>

                                    <div class="project-checklist-grid">
                                        <div
                                            v-for="item in checklistItems"
                                            :key="item.key"
                                            class="project-checklist-item"
                                            :class="{ 'project-checklist-item-done': item.done }"
                                        >
                                            <i :class="item.done ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                                            <span>{{ item.label }}</span>
                                        </div>
                                    </div>
                                </section>

                                <section class="project-section-card">
                                    <div class="project-section-head">
                                        <div>
                                            <h3>Общая информация</h3>
                                            <p>Название, цели, заказчик, сроки и ключевые параметры проекта.</p>
                                        </div>
                                        <Button
                                            v-if="canEditAfterSolution"
                                            :label="project.projectType || project.customer ? 'Обновить' : 'Заполнить'"
                                            icon="pi pi-pen-to-square"
                                            text
                                            @click="generalInfoDialogVisible = true"
                                        />
                                    </div>

                                    <div class="project-info-grid">
                                        <div class="project-info-item">
                                            <span>Тип проекта</span>
                                            <strong>{{ translateProjectShowcaseTypeTitle(project.projectType?.title) }}</strong>
                                        </div>
                                        <div class="project-info-item">
                                            <span>Заказчик</span>
                                            <strong>{{ project.customer || 'Не указан' }}</strong>
                                        </div>
                                        <div class="project-info-item">
                                            <span>Дата начала</span>
                                            <strong>{{ formatDateRuLong(project.startDate, 'Не указана') }}</strong>
                                        </div>
                                        <div class="project-info-item">
                                            <span>Дата завершения</span>
                                            <strong>{{ formatDateRuLong(project.endDate, 'Не указана') }}</strong>
                                        </div>
                                        <div class="project-info-item">
                                            <span>Трудоёмкость</span>
                                            <strong>{{ project.laborIntensity || 'Не указана' }}</strong>
                                        </div>
                                        <div class="project-info-item">
                                            <span>Плановое число участников</span>
                                            <strong>{{ project.plannedNumberOfTeamMembers || 'Не указано' }}</strong>
                                        </div>
                                        <div class="project-info-item project-info-item-wide">
                                            <span>Цель проекта</span>
                                            <strong>{{ project.projectGoal || 'Не указана' }}</strong>
                                        </div>
                                        <div class="project-info-item project-info-item-wide">
                                            <span>Ожидаемые результаты</span>
                                            <strong>{{ project.expectedResults || 'Не указаны' }}</strong>
                                        </div>
                                    </div>
                                </section>

                                <section class="project-section-card">
                                    <div class="project-section-head">
                                        <div>
                                            <h3>Задачи</h3>
                                            <p>Список основных задач проекта.</p>
                                        </div>
                                        <Button
                                            v-if="canEditAfterSolution"
                                            label="Добавить"
                                            icon="pi pi-plus"
                                            text
                                            @click="tasksDialogVisible = true"
                                        />
                                    </div>

                                    <ul v-if="project.projectTasks?.length" class="project-bullet-list">
                                        <li v-for="task in project.projectTasks" :key="task.id">{{ task.taskDescription }}</li>
                                    </ul>
                                    <p v-else class="project-empty-text">Задачи пока не заполнены.</p>
                                </section>

                                <section class="project-section-card">
                                    <div class="project-section-head">
                                        <div>
                                            <h3>Ресурсы</h3>
                                            <p>Необходимые ресурсы и источники их получения.</p>
                                        </div>
                                        <Button
                                            v-if="canEditAfterSolution"
                                            label="Добавить"
                                            icon="pi pi-plus"
                                            text
                                            @click="resourceDialogVisible = true"
                                        />
                                    </div>

                                    <div v-if="project.projectResources?.length" class="project-chip-grid">
                                        <article v-for="resource in project.projectResources" :key="resource.id" class="project-chip-card">
                                            <strong>{{ translateProjectShowcaseTypeTitle(resource.resourceType?.title) }}</strong>
                                            <span>{{ resource.need }}</span>
                                            <small>{{ resource.source || 'Источник не указан' }}</small>
                                        </article>
                                    </div>
                                    <p v-else class="project-empty-text">Ресурсы пока не добавлены.</p>
                                </section>

                                <section class="project-section-card">
                                    <div class="project-section-head">
                                        <div>
                                            <h3>Инициатор</h3>
                                            <p>Данные об инициаторе проекта.</p>
                                        </div>
                                    </div>

                                    <div class="project-info-grid">
                                        <div class="project-info-item">
                                            <span>ФИО</span>
                                            <strong>{{ buildProjectShowcaseFullName(project.initiator?.user) }}</strong>
                                        </div>
                                        <div class="project-info-item">
                                            <span>Тип инициатора</span>
                                            <strong>{{ translateProjectShowcaseTypeTitle(project.initiator?.type?.title) }}</strong>
                                        </div>
                                    </div>
                                </section>

                                <section class="project-section-card">
                                    <div class="project-section-head">
                                        <div>
                                            <h3>Менеджер</h3>
                                            <p>Координация проекта и ответственное подразделение.</p>
                                        </div>
                                        <Button
                                            v-if="canEditAfterSolution"
                                            :label="project.projectManager ? 'Изменить' : 'Заполнить'"
                                            icon="pi pi-user-edit"
                                            text
                                            @click="managerDialogVisible = true"
                                        />
                                    </div>

                                    <div class="project-info-grid">
                                        <div class="project-info-item">
                                            <span>ФИО</span>
                                            <strong>{{ buildProjectShowcaseFullName(project.projectManager?.user) }}</strong>
                                        </div>
                                        <div class="project-info-item">
                                            <span>Подразделение</span>
                                            <strong>{{ project.projectManager?.division || 'Не указано' }}</strong>
                                        </div>
                                    </div>
                                </section>

                                <section class="project-section-card">
                                    <div class="project-section-head">
                                        <div>
                                            <h3>Необходимые компетенции</h3>
                                            <p>Компетенции, заявленные на этапе инициации проекта.</p>
                                        </div>
                                    </div>

                                    <div v-if="project.requiredCompetenciesOfProjectParticipants?.length" class="project-chip-grid">
                                        <article
                                            v-for="competency in project.requiredCompetenciesOfProjectParticipants"
                                            :key="competency.id"
                                            class="project-chip-card"
                                        >
                                            <strong>{{ competency.competencies }}</strong>
                                        </article>
                                    </div>
                                    <p v-else class="project-empty-text">Компетенции пока не заполнены.</p>
                                </section>

                                <section class="project-section-card">
                                    <div class="project-section-head">
                                        <div>
                                            <h3>Решение проектного офиса</h3>
                                            <p>Результат рассмотрения проекта сотрудником проектного офиса.</p>
                                        </div>
                                        <Button
                                            v-if="canCreateSolutionAction"
                                            label="Создать решение"
                                            icon="pi pi-check-square"
                                            text
                                            @click="openSolutionDialog"
                                        />
                                    </div>

                                    <div v-if="project.solution" class="project-info-grid">
                                        <div class="project-info-item">
                                            <span>Статус</span>
                                            <strong>{{ project.solution.isApproved ? 'Одобрено' : 'Не одобрено' }}</strong>
                                        </div>
                                        <div class="project-info-item">
                                            <span>Дата решения</span>
                                            <strong>{{ formatDateRuLong(project.solution.decisionDate, 'Не указана') }}</strong>
                                        </div>
                                        <div class="project-info-item">
                                            <span>Ответственный</span>
                                            <strong>{{ buildProjectShowcaseFullName(project.solution.responsibleUser) }}</strong>
                                        </div>
                                        <div class="project-info-item project-info-item-wide">
                                            <span>Описание</span>
                                            <strong>{{ project.solution.solutionDescription || 'Не указано' }}</strong>
                                        </div>
                                    </div>
                                    <p v-else class="project-empty-text">Решение проектного офиса пока не создано.</p>
                                </section>

                                <section class="project-section-card">
                                    <div class="project-section-head">
                                        <div>
                                            <h3>Критерии выполнения проекта</h3>
                                            <p>Что считается успешным результатом выполнения проекта.</p>
                                        </div>
                                        <Button
                                            v-if="canEditAfterSolution"
                                            label="Добавить"
                                            icon="pi pi-plus"
                                            text
                                            @click="criteriaDialogVisible = true"
                                        />
                                    </div>

                                    <ul v-if="project.criteriaForAchievingResults?.length" class="project-bullet-list">
                                        <li v-for="criteria in project.criteriaForAchievingResults" :key="criteria.id">{{ criteria.criteriaDescription }}</li>
                                    </ul>
                                    <p v-else class="project-empty-text">Критерии пока не определены.</p>
                                </section>
                            </div>
                        </TabPanel>

                        <TabPanel value="team">
                            <div class="project-tab-content">
                                <section class="project-section-card">
                                    <div class="project-section-head">
                                        <div>
                                            <h3>Команда проекта</h3>
                                            <p>Участники и распределение ролей в проекте.</p>
                                        </div>
                                        <Button
                                            v-if="canEditAfterSolution"
                                            label="Добавить участника"
                                            icon="pi pi-user-plus"
                                            text
                                            @click="participantDialogVisible = true"
                                        />
                                    </div>

                                    <div v-if="participantsLoading" class="project-inline-loader">
                                        <ProgressSpinner style="width: 40px; height: 40px" />
                                    </div>

                                    <DataTable
                                        v-else-if="participants.length"
                                        :value="participants"
                                        stripedRows
                                        responsiveLayout="scroll"
                                    >
                                        <Column field="user" header="Участник" style="min-width: 220px;">
                                            <template #body="{ data }">
                                                {{ buildProjectShowcaseFullName(data.user) }}
                                            </template>
                                        </Column>
                                        <Column field="role" header="Роль" style="min-width: 180px;" />
                                        <Column field="group" header="Группа" style="min-width: 180px;">
                                            <template #body="{ data }">
                                                {{ data.group || '—' }}
                                            </template>
                                        </Column>
                                    </DataTable>

                                    <div v-else class="project-empty-state project-empty-state-inline">
                                        <i class="pi pi-users"></i>
                                        <h4>Команда пока не сформирована</h4>
                                        <p>После решения проектного офиса сюда можно будет добавить участников.</p>
                                    </div>
                                </section>
                            </div>
                        </TabPanel>

                        <TabPanel value="journal">
                            <div class="project-tab-content">
                                <section class="project-section-card">
                                    <div class="project-section-head">
                                        <div>
                                            <h3>Журнал проекта</h3>
                                            <p>История действий и изменений по проекту.</p>
                                        </div>
                                    </div>

                                    <div class="project-journal-scroll" @scroll.passive="onJournalScroll">
                                        <article
                                            v-for="log in journalLogs"
                                            :key="log.id"
                                            class="project-journal-item"
                                        >
                                            <div class="project-journal-date">{{ formatDateRuShortWithTime(log.createdAt, '-') }}</div>
                                            <div class="project-journal-text">{{ log.log }}</div>
                                        </article>

                                        <div v-if="journalLoading" class="project-inline-loader">
                                            <ProgressSpinner style="width: 34px; height: 34px" />
                                        </div>

                                        <div v-if="!journalLoading && !journalLogs.length" class="project-empty-state project-empty-state-inline">
                                            <i class="pi pi-history"></i>
                                            <h4>Журнал пока пуст</h4>
                                            <p>Когда в проекте появятся события, они будут отображены здесь.</p>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </TabPanel>

                        <TabPanel value="consultations">
                            <div class="project-tab-content">
                                <ProjectPlaceholderPane
                                    icon="pi pi-comments"
                                    title="Консультации в разработке"
                                    description="Раздел консультаций пока не подключён к проектной витрине."
                                />
                            </div>
                        </TabPanel>

                        <TabPanel value="roadmap">
                            <div class="project-tab-content">
                                <section class="project-section-card">
                                    <div class="project-section-head">
                                        <div>
                                            <h3>Дорожная карта</h3>
                                            <p>Пошаговый план реализации проекта с иерархией этапов.</p>
                                        </div>
                                        <Button
                                            v-if="canEditAfterSolution"
                                            label="Добавить шаг"
                                            icon="pi pi-plus"
                                            text
                                            @click="openRoadMapItemDialog"
                                        />
                                    </div>

                                    <div v-if="roadMapLoading" class="project-inline-loader">
                                        <ProgressSpinner style="width: 40px; height: 40px" />
                                    </div>
                                    <ProjectRoadMapTree v-else-if="roadMapItems.length" :nodes="roadMapItems" />
                                    <div v-else class="project-empty-state project-empty-state-inline">
                                        <i class="pi pi-sitemap"></i>
                                        <h4>Дорожная карта пока не заполнена</h4>
                                        <p>Здесь появятся этапы и вложенные шаги проекта.</p>
                                    </div>
                                </section>
                            </div>
                        </TabPanel>

                        <TabPanel value="documents">
                            <div class="project-tab-content">
                                <ProjectPlaceholderPane
                                    icon="pi pi-file"
                                    title="Документы в разработке"
                                    description="Раздел документов будет подключён в следующих итерациях."
                                />
                            </div>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </template>

            <div v-else class="project-empty-state">
                <i class="pi pi-folder-open"></i>
                <h4>Проект не найден</h4>
                <p>Возможно, у вас нет доступа к этой карточке или проект был удалён.</p>
            </div>
        </section>

        <ProjectSolutionDialog
            v-model:visible="solutionDialogVisible"
            :project-id="projectId"
            :responsible-user-id="showcaseUserId"
            @saved="handleProjectMutation"
        />
        <ProjectGeneralInformationDialog
            v-model:visible="generalInfoDialogVisible"
            :project-id="projectId"
            :initial-data="project || {}"
            @saved="handleProjectMutation"
        />
        <ProjectManagerDialog
            v-model:visible="managerDialogVisible"
            :project-id="projectId"
            @saved="handleProjectMutation"
        />
        <ProjectStringListDialog
            v-model:visible="tasksDialogVisible"
            :project-id="projectId"
            kind="tasks"
            @saved="handleProjectMutation"
        />
        <ProjectStringListDialog
            v-model:visible="criteriaDialogVisible"
            :project-id="projectId"
            kind="criteria"
            @saved="handleProjectMutation"
        />
        <ProjectResourceDialog
            v-model:visible="resourceDialogVisible"
            :project-id="projectId"
            @saved="handleProjectMutation"
        />
        <ProjectParticipantDialog
            v-model:visible="participantDialogVisible"
            :project-id="projectId"
            @saved="handleTeamMutation"
        />
        <ProjectRoadMapItemDialog
            v-model:visible="roadMapDialogVisible"
            :project-id="projectId"
            :participants="participants"
            :road-map-items="roadMapItems"
            @saved="handleRoadMapMutation"
        />
    </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { usePermissionStore } from '@/stores/permissions.js';
import { getCurrentUser } from '@/utils/currentUser.js';
import { formatDateRuLong, formatDateRuShortWithTime } from '@/utils/date.js';
import {
    addMeToProjectShowcaseSystem,
    changeProjectVisibility,
    getMeInProjectShowcaseSystem,
    getProject,
    getProjectCheckList,
    getProjectJournal,
    getProjectParticipants,
    getProjectRoadMap,
    getSuProject,
} from '@/api/projectShowcase.js';
import {
    buildProjectShowcaseErrorMessage,
    buildProjectShowcaseFullName,
    canCreateProjectSolution,
    canEditOwnProject,
    canPublishProject,
    clearProjectShowcaseUserId,
    describeProjectVisibility,
    getProjectDetailsMode,
    getStoredProjectShowcaseUserId,
    isProjectInitiator,
    isTeacherRole,
    normalizeProject,
    normalizeProjectJournal,
    resolveProjectShowcaseUserIdFromResponse,
    storeProjectShowcaseUserId,
    translateProjectShowcaseTypeTitle,
} from '@/utils/projectShowcase.js';
import ProjectPlaceholderPane from '@/components/ProjectShowcase/ProjectPlaceholderPane.vue';
import ProjectRoadMapTree from '@/components/ProjectShowcase/ProjectRoadMapTree.vue';
import ProjectSolutionDialog from '@/components/ProjectShowcase/ProjectSolutionDialog.vue';
import ProjectGeneralInformationDialog from '@/components/ProjectShowcase/ProjectGeneralInformationDialog.vue';
import ProjectManagerDialog from '@/components/ProjectShowcase/ProjectManagerDialog.vue';
import ProjectStringListDialog from '@/components/ProjectShowcase/ProjectStringListDialog.vue';
import ProjectResourceDialog from '@/components/ProjectShowcase/ProjectResourceDialog.vue';
import ProjectParticipantDialog from '@/components/ProjectShowcase/ProjectParticipantDialog.vue';
import ProjectRoadMapItemDialog from '@/components/ProjectShowcase/ProjectRoadMapItemDialog.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const permissionStore = usePermissionStore();

const loading = ref(false);
const project = ref(null);
const currentUser = ref(null);
const showcaseUserId = ref(getStoredProjectShowcaseUserId());
const ensuringShowcaseIdentity = ref(false);
const activeTab = ref('general');
const checklist = ref(null);
const checklistLoading = ref(false);
const publishing = ref(false);

const participants = ref([]);
const participantsLoading = ref(false);

const journalLogs = ref([]);
const journalLoading = ref(false);
const journalPage = ref(1);
const journalRows = 20;
const journalHasMore = ref(true);

const roadMapItems = ref([]);
const roadMapLoading = ref(false);

const solutionDialogVisible = ref(false);
const generalInfoDialogVisible = ref(false);
const managerDialogVisible = ref(false);
const tasksDialogVisible = ref(false);
const criteriaDialogVisible = ref(false);
const resourceDialogVisible = ref(false);
const participantDialogVisible = ref(false);
const roadMapDialogVisible = ref(false);

const projectId = computed(() => Number(route.params.id));
const detailsMode = computed(() => getProjectDetailsMode(permissionStore));
const isTeacher = computed(() => isTeacherRole(currentUser.value));
const isCurrentProjectInitiator = computed(() => isProjectInitiator(project.value, showcaseUserId.value));
const projectRejected = computed(() => Boolean(project.value?.solution) && project.value?.solution?.isApproved === false);
const canEditAfterSolution = computed(() =>
    Boolean(project.value?.solution)
    && !projectRejected.value
    && isTeacher.value
    && isCurrentProjectInitiator.value
    && canEditOwnProject(permissionStore)
);
const canCreateSolutionAction = computed(() =>
    !project.value?.solution && canCreateProjectSolution(permissionStore)
);
const checklistVisible = computed(() => isTeacher.value && isCurrentProjectInitiator.value && !projectRejected.value);
const canPublishAction = computed(() => !projectRejected.value && canPublishProject(project.value, checklist.value));

const checklistItems = computed(() => {
    if (!checklist.value) return [];

    return [
        { key: 'isProjectTypeFilled', label: 'Тип проекта заполнен', done: checklist.value.isProjectTypeFilled },
        { key: 'isCustomerFilled', label: 'Заказчик заполнен', done: checklist.value.isCustomerFilled },
        { key: 'isProjectManagerFilled', label: 'Менеджер назначен', done: checklist.value.isProjectManagerFilled },
        { key: 'isImplementationDeadlineFilled', label: 'Срок реализации указан', done: checklist.value.isImplementationDeadlineFilled },
        { key: 'isLaborIntensityFilled', label: 'Трудоёмкость указана', done: checklist.value.isLaborIntensityFilled },
        { key: 'isProjectParticipiantsFilled', label: 'Команда проекта заполнена', done: checklist.value.isProjectParticipiantsFilled },
        { key: 'isProjectTaskFilled', label: 'Задачи проекта заполнены', done: checklist.value.isProjectTaskFilled },
        { key: 'isCriteriasFilled', label: 'Критерии выполнения заполнены', done: checklist.value.isCriteriasFilled },
        { key: 'isResourcesFilled', label: 'Ресурсы заполнены', done: checklist.value.isResourcesFilled },
        { key: 'isRoadMapFilled', label: 'Дорожная карта заполнена', done: checklist.value.isRoadMapFilled },
    ];
});

const syncProjectShowcaseUser = async ({ createIfMissing = false } = {}) => {
    ensuringShowcaseIdentity.value = true;

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
            detail: buildProjectShowcaseErrorMessage(error, 'Попробуйте повторить действие ещё раз.'),
            life: 3500,
        });
        return showcaseUserId.value;
    } finally {
        ensuringShowcaseIdentity.value = false;
    }
};

const loadChecklist = async () => {
    if (!projectId.value || !checklistVisible.value) {
        checklist.value = null;
        return;
    }

    checklistLoading.value = true;

    try {
        const response = await getProjectCheckList(projectId.value);
        checklist.value = response.data || null;
    } catch (error) {
        checklist.value = null;
        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить чек-лист',
            detail: buildProjectShowcaseErrorMessage(error, 'Список требований для публикации временно недоступен.'),
            life: 3500,
        });
    } finally {
        checklistLoading.value = false;
    }
};

const loadProjectDetails = async () => {
    if (!projectId.value) return;

    loading.value = true;

    try {
        const response = detailsMode.value === 'su'
            ? await getSuProject(projectId.value)
            : await getProject(projectId.value, showcaseUserId.value || undefined);

        project.value = normalizeProject(response.data);
        await loadChecklist();
    } catch (error) {
        project.value = null;
        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить проект',
            detail: buildProjectShowcaseErrorMessage(error, 'Проверьте доступ к проекту и попробуйте снова.'),
            life: 3500,
        });
    } finally {
        loading.value = false;
    }
};

const fetchParticipants = async () => {
    if (!projectId.value) return;

    participantsLoading.value = true;

    try {
        const response = await getProjectParticipants(projectId.value);
        participants.value = Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        participants.value = [];
        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить команду',
            detail: buildProjectShowcaseErrorMessage(error, 'Повторите попытку позже.'),
            life: 3500,
        });
    } finally {
        participantsLoading.value = false;
    }
};

const fetchJournal = async ({ reset = false } = {}) => {
    if (!projectId.value || journalLoading.value || (!journalHasMore.value && !reset)) return;

    journalLoading.value = true;

    try {
        if (reset) {
            journalPage.value = 1;
            journalHasMore.value = true;
        }

        const response = await getProjectJournal(projectId.value, {
            page: journalPage.value,
            pageSize: journalRows,
        });

        const normalized = normalizeProjectJournal(response.data);
        journalLogs.value = reset ? normalized.logs : [...journalLogs.value, ...normalized.logs];
        journalHasMore.value = normalized.logs.length >= journalRows;
        journalPage.value += 1;
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить журнал',
            detail: buildProjectShowcaseErrorMessage(error, 'Попробуйте повторить действие позже.'),
            life: 3500,
        });
    } finally {
        journalLoading.value = false;
    }
};

const fetchRoadMap = async () => {
    if (!projectId.value) return;

    roadMapLoading.value = true;

    try {
        const response = await getProjectRoadMap(projectId.value);
        roadMapItems.value = Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        roadMapItems.value = [];
        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить дорожную карту',
            detail: buildProjectShowcaseErrorMessage(error, 'Повторите попытку позже.'),
            life: 3500,
        });
    } finally {
        roadMapLoading.value = false;
    }
};

const refreshProject = async () => {
    await loadProjectDetails();

    if (activeTab.value === 'team') {
        await fetchParticipants();
    }

    if (activeTab.value === 'journal') {
        await fetchJournal({ reset: true });
    }

    if (activeTab.value === 'roadmap') {
        await fetchRoadMap();
    }
};

const openSolutionDialog = async () => {
    const userId = await syncProjectShowcaseUser({ createIfMissing: true });
    if (!userId) {
        toast.add({
            severity: 'error',
            summary: 'Не удалось открыть форму решения',
            detail: 'Пользователь проектной витрины не зарегистрирован в системе.',
            life: 3500,
        });
        return;
    }
    solutionDialogVisible.value = true;
};

const publishProjectVisibility = async () => {
    if (!projectId.value || !canPublishAction.value) return;

    publishing.value = true;

    try {
        await changeProjectVisibility(projectId.value, true);
        toast.add({
            severity: 'success',
            summary: 'Проект опубликован',
            detail: 'Проект стал доступен в публичной витрине.',
            life: 2500,
        });
        await loadProjectDetails();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Не удалось опубликовать проект',
            detail: buildProjectShowcaseErrorMessage(error, 'Сначала убедитесь, что чек-лист заполнен полностью.'),
            life: 3500,
        });
    } finally {
        publishing.value = false;
    }
};

const handleProjectMutation = async () => {
    await loadProjectDetails();
};

const handleTeamMutation = async () => {
    await loadProjectDetails();
    await fetchParticipants();
    await loadChecklist();
};

const handleRoadMapMutation = async () => {
    await fetchRoadMap();
    await loadChecklist();
};

const openRoadMapItemDialog = async () => {
    if (!participants.length) {
        await fetchParticipants();
    }

    roadMapDialogVisible.value = true;
};

const onJournalScroll = (event) => {
    const target = event.target;
    if (!target || journalLoading.value || !journalHasMore.value) return;

    const remainingHeight = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (remainingHeight < 80) {
        fetchJournal();
    }
};

watch(activeTab, async (tab) => {
    if (tab === 'team' && !participants.length && !participantsLoading.value) {
        await fetchParticipants();
    }

    if (tab === 'journal' && !journalLogs.length && !journalLoading.value) {
        await fetchJournal({ reset: true });
    }

    if (tab === 'roadmap' && !roadMapItems.length && !roadMapLoading.value) {
        await fetchRoadMap();
    }
});

watch(
    () => route.params.id,
    async () => {
        participants.value = [];
        journalLogs.value = [];
        journalPage.value = 1;
        journalHasMore.value = true;
        roadMapItems.value = [];
        await loadProjectDetails();
    }
);

onMounted(async () => {
    currentUser.value = await getCurrentUser();
    await syncProjectShowcaseUser();
    await loadProjectDetails();
});
</script>

<style scoped>
.project-details-page {
    --project-bg-1: var(--p-bg-color-2);
    --project-bg-2: var(--p-bg-color-1);
    --project-border: var(--p-grey-4);
    --project-shadow: 0 12px 32px rgba(15, 23, 42, 0.07);
    min-height: 100%;
    padding: 1.25rem;
}

.project-details-shell {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 100%;
    padding: 1.25rem;
    border-radius: 18px;
    border: 1px solid var(--project-border);
    background:
        radial-gradient(1200px 220px at 10% 0%, rgba(var(--p-blue-500-rgb), 0.08), transparent 60%),
        linear-gradient(180deg, var(--project-bg-1) 0%, var(--project-bg-2) 85%);
    box-shadow: var(--project-shadow);
}

.project-details-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
}

.project-details-title-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
    color: var(--p-text-color);
}

.project-details-title-row h2 {
    margin: 0;
}

.project-details-copy p {
    margin: 0.65rem 0 0;
    color: var(--p-grey-1);
    max-width: 72ch;
}

.project-details-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.project-details-loading {
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.project-summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
}

.project-summary-card,
.project-section-card,
.project-checklist-card {
    padding: 1rem 1.15rem;
    border-radius: 18px;
    background: var(--p-content-background);
    border: 1px solid var(--p-content-border-color);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
}

.project-rejected-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.4rem;
    border-radius: 18px;
    border: 1px dashed rgba(var(--p-red-500-rgb), 0.28);
    background: linear-gradient(180deg, rgba(var(--p-red-400-rgb), 0.11), rgba(var(--p-red-400-rgb), 0.04));
}

.project-rejected-icon {
    width: 3.5rem;
    height: 3.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 18px;
    background: rgba(var(--p-red-500-rgb), 0.14);
    color: var(--p-red-500);
    font-size: 1.45rem;
    flex-shrink: 0;
}

.project-rejected-copy {
    min-width: 0;
}

.project-rejected-topline {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.project-rejected-copy h3 {
    margin: 0;
}

.project-rejected-copy p {
    margin: 0.35rem 0 0;
    color: var(--p-grey-1);
}

.project-summary-card {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.project-summary-card span,
.project-info-item span {
    color: var(--p-grey-1);
    font-size: 0.84rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
}
.project-summary-card strong {
    color: var(--p-text-color);
}

.project-tab-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-top: 1rem;
}

.project-section-head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    margin-bottom: 1rem;
}

.project-section-head h3 {
    margin: 0;
}

.project-section-head p {
    margin: 0.4rem 0 0;
    color: var(--p-grey-1);
}

.project-info-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.9rem;
}

.project-info-item {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.9rem 1rem;
    border-radius: 14px;
    background: rgba(var(--p-blue-500-rgb), 0.04);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.08);
}

.project-info-item strong {
    font-size: 0.98rem;
    color: var(--p-text-color);
    white-space: pre-wrap;
}

.project-info-item-wide {
    grid-column: 1 / -1;
}

.project-bullet-list {
    margin: 0;
    padding-left: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
}

.project-empty-text {
    margin: 0;
    color: var(--p-grey-1);
}

.project-chip-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0.8rem;
}

.project-chip-card {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.9rem 1rem;
    border-radius: 14px;
    background: rgba(var(--p-blue-500-rgb), 0.05);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.08);
}

.project-chip-card small {
    color: var(--p-grey-1);
}

.project-checklist-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
}

.project-checklist-item {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.85rem 0.95rem;
    border-radius: 14px;
    background: rgba(var(--p-red-500-rgb), 0.05);
    color: var(--p-text-color);
}

.project-checklist-item i {
    color: var(--p-red-500);
}

.project-checklist-item-done {
    background: rgba(var(--p-green-500-rgb), 0.08);
}

.project-checklist-item-done i {
    color: var(--p-green-500);
}

.project-inline-loader {
    display: flex;
    justify-content: center;
    padding: 1.25rem 0;
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

.project-empty-state-inline {
    min-height: 180px;
}

.project-empty-state i {
    font-size: 2rem;
    color: var(--p-grey-1);
}

.project-empty-state h4,
.project-empty-state p {
    margin: 0;
}

.project-journal-scroll {
    max-height: 60vh;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-right: 0.35rem;
}

.project-journal-item {
    display: grid;
    grid-template-columns: 180px minmax(0, 1fr);
    gap: 1rem;
    padding: 0.9rem 1rem;
    border-radius: 14px;
    background: rgba(var(--p-blue-500-rgb), 0.04);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.08);
}

.project-journal-date {
    color: var(--p-grey-1);
    font-size: 0.92rem;
}

.project-journal-text {
    color: var(--p-text-color);
    line-height: 1.6;
}

@media (max-width: 1024px) {
    .project-summary-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 768px) {
    .project-details-page {
        padding: 0.75rem;
    }

    .project-details-shell {
        padding: 1rem;
    }

    .project-details-header,
    .project-section-head {
        flex-direction: column;
        align-items: stretch;
    }

    .project-summary-grid,
    .project-info-grid,
    .project-checklist-grid {
        grid-template-columns: 1fr;
    }

    .project-journal-item {
        grid-template-columns: 1fr;
    }
}
</style>
