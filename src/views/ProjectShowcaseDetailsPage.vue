<template>
    <main class="project-details-page">
        <section class="project-details-shell">
            <div class="project-details-top">
                <header class="project-details-header">
                    <div class="project-details-copy">
                        <Button
                            label="Назад к списку"
                            icon="pi pi-arrow-left"
                            text
                            class="project-back-button"
                            @click="goBackToProjectList"
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

                    <section
                        v-if="showFloatingProgress"
                        ref="projectProgressInlineRef"
                        class="project-progress-panel project-progress-panel-inline"
                        :style="{ opacity: `${inlineProgressOpacity}` }"
                    >
                        <div class="project-progress-panel-main">
                            <div class="project-progress-panel-copy">
                                <div class="project-progress-panel-title">
                                    <span>Прогресс проекта</span>
                                    <h3>{{ floatingProgressCompactTitle }}</h3>
                                </div>
                                <div class="project-progress-panel-subline">
                                    <Tag :severity="floatingProgressTag.severity" :value="floatingProgressTag.label" />
                                    <small v-if="checklistVisible && checklistItems.length">
                                        Чек-лист: {{ completedChecklistCount }}/{{ checklistItems.length }}
                                    </small>
                                    <small v-else>
                                        Шагов: {{ roadMapCompletedCount }}/{{ roadMapTotalCount || 0 }}
                                    </small>
                                </div>
                            </div>

                            <div class="project-progress-panel-metric">
                                <strong>{{ roadMapProgress }}%</strong>
                                <small>{{ roadMapCompletedCount }}/{{ roadMapTotalCount || 0 }}</small>
                            </div>
                        </div>

                        <ProgressBar :value="roadMapProgress" :showValue="false" style="height: 0.8rem" />
                    </section>
                </template>

                <div v-else class="project-empty-state">
                    <i class="pi pi-folder-open"></i>
                    <h4>Проект не найден</h4>
                    <p>Возможно, у вас нет доступа к этой карточке или проект был удалён.</p>
                </div>
            </div>

            <Tabs v-if="project" v-model:value="activeTab" class="project-tabs">
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
                                        <Tag :severity="checklistStatus.severity" :value="checklistStatus.label" />
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
                                        <div class="project-info-item">
                                            <span>Объект проекта</span>
                                            <strong>{{ project.object || 'Не указан' }}</strong>
                                        </div>
                                        <div class="project-info-item">
                                            <span>Этап жизненного цикла объекта</span>
                                            <strong>{{ project.objectStatement || 'Не указан' }}</strong>
                                        </div>
                                        <div class="project-info-item">
                                            <span>Грейд проекта</span>
                                            <strong>{{ formatProjectGrade(project.grade) }}</strong>
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

                                    <div class="project-subsection">
                                        <span class="project-subsection-title">Научные направления</span>
                                        <div v-if="project.scientificDirections?.length" class="project-chip-grid">
                                            <article
                                                v-for="direction in project.scientificDirections"
                                                :key="`${direction.rootId}-${direction.id ?? direction.name}`"
                                                class="project-chip-card"
                                            >
                                                <strong>{{ direction.name }}</strong>
                                            </article>
                                        </div>
                                        <p v-else class="project-empty-text">Научные направления пока не заполнены.</p>
                                    </div>
                                </section>

                                <section class="project-section-card">
                                    <div class="project-section-head">
                                        <div>
                                            <h3>Задачи</h3>
                                            <p>Список основных задач проекта.</p>
                                        </div>
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
                                        <div class="project-info-item">
                                            <span>Кафедра</span>
                                            <strong>{{ project.department?.name || 'Не указана' }}</strong>
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
                                    <ProjectRoadMapTree
                                        v-else-if="roadMapItems.length"
                                        :nodes="roadMapItems"
                                        :can-edit="canEditAfterSolution"
                                        @edit="openRoadMapEditDialog"
                                        @download-document="handleRoadMapDocumentDownload"
                                    />
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
                                <section class="project-section-card">
                                    <div class="project-section-head">
                                        <div>
                                            <h3>Документы проекта</h3>
                                            <p>Общий пул документов, которые можно прикреплять к шагам дорожной карты</p>
                                        </div>
                                    </div>

                                    <FileDropzone
                                        v-if="canEditAfterSolution"
                                        class="project-document-dropzone"
                                        :disabled="projectDocumentUploading"
                                        icon="pi pi-file-arrow-up"
                                        title="Перетащите документы проекта сюда"
                                        subtitle="или нажмите, чтобы выбрать файлы через проводник"
                                        active-subtitle="Отпустите файлы для загрузки в проект"
                                        @select="handleProjectDocumentSelected"
                                    />

                                    <div v-if="projectDocumentsLoading" class="project-inline-loader">
                                        <ProgressSpinner style="width: 40px; height: 40px" />
                                    </div>

                                    <div v-else-if="projectDocuments.length" class="project-document-list">
                                        <article
                                            v-for="document in projectDocuments"
                                            :key="document.id"
                                            class="project-document-card"
                                        >
                                            <div class="project-document-copy">
                                                <div class="project-document-name">
                                                    <i class="pi pi-file"></i>
                                                    <strong>{{ document.name }}</strong>
                                                </div>
                                                <p>Документ доступен для скачивания и привязки к задачам дорожной карты</p>
                                            </div>

                                            <div class="project-document-actions">
                                                <Button
                                                    label="Скачать"
                                                    icon="pi pi-download"
                                                    text
                                                    :loading="downloadingDocumentIds.includes(document.id)"
                                                    @click="downloadProjectDocumentById(document.id, document)"
                                                />
                                                <Button
                                                    v-if="canEditAfterSolution"
                                                    label="Удалить"
                                                    icon="pi pi-trash"
                                                    severity="danger"
                                                    text
                                                    :loading="deletingDocumentIds.includes(document.id)"
                                                    @click="handleProjectDocumentDelete(document.id)"
                                                />
                                            </div>
                                        </article>
                                    </div>

                                    <div v-else class="project-empty-state project-empty-state-inline">
                                        <i class="pi pi-file"></i>
                                        <h4>Документы проекта пока не загружены</h4>
                                        <p>Загрузите первый документ, чтобы затем привязывать его к задачам дорожной карты.</p>
                                    </div>
                                </section>
                            </div>
                    </TabPanel>
                </TabPanels>
            </Tabs>
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
            :available-documents="projectDocuments"
            :item="activeRoadMapItem"
            @saved="handleRoadMapMutation"
        />

        <Teleport to="body">
            <section
                v-if="showFloatingProgress"
                ref="projectProgressFloatingRef"
                class="project-progress-panel project-progress-panel-floating"
                :style="floatingProgressStyle"
            >
                <div class="project-progress-panel-main">
                    <div class="project-progress-panel-copy">
                        <div class="project-progress-panel-title">
                            <span>Прогресс проекта</span>
                            <h3>{{ floatingProgressCompactTitle }}</h3>
                        </div>
                        <div class="project-progress-panel-subline">
                            <Tag :severity="floatingProgressTag.severity" :value="floatingProgressTag.label" />
                            <small v-if="checklistVisible && checklistItems.length">
                                {{ completedChecklistCount }}/{{ checklistItems.length }}
                            </small>
                            <small v-else>
                                {{ roadMapCompletedCount }}/{{ roadMapTotalCount || 0 }} шагов
                            </small>
                        </div>
                    </div>

                    <div class="project-progress-panel-metric">
                        <strong>{{ roadMapProgress }}%</strong>
                        <small>{{ roadMapCompletedCount }}/{{ roadMapTotalCount || 0 }}</small>
                    </div>
                </div>

                <ProgressBar :value="roadMapProgress" :showValue="false" style="height: 0.5rem" />
            </section>
        </Teleport>
    </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { usePermissionStore } from '@/stores/permissions.js';
import { getCurrentUser } from '@/utils/currentUser.js';
import { downloadBase64Document, fileToBase64 } from '@/utils/ido.js';
import { formatDateRuLong, formatDateRuShortWithTime } from '@/utils/date.js';
import {
    addMeToProjectShowcaseSystem,
    addProjectDocument,
    changeProjectVisibility,
    deleteProjectDocument,
    getMeInProjectShowcaseSystem,
    getProject,
    getProjectCheckList,
    getProjectDocument,
    getProjectDocuments,
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
import FileDropzone from '@/components/Utils/FileDropzone.vue';

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
const projectDocuments = ref([]);
const projectDocumentContentCache = ref({});
const projectDocumentsLoading = ref(false);
const projectDocumentsLoaded = ref(false);
const projectDocumentUploading = ref(false);
const downloadingDocumentIds = ref([]);
const deletingDocumentIds = ref([]);

const solutionDialogVisible = ref(false);
const generalInfoDialogVisible = ref(false);
const managerDialogVisible = ref(false);
const tasksDialogVisible = ref(false);
const criteriaDialogVisible = ref(false);
const resourceDialogVisible = ref(false);
const participantDialogVisible = ref(false);
const roadMapDialogVisible = ref(false);
const activeRoadMapItem = ref(null);
const projectProgressInlineRef = ref(null);
const projectProgressFloatingRef = ref(null);
const progressMorph = ref(0);
const floatingProgressStyle = ref({});
const inlineProgressOpacity = computed(() => Math.max(0.12, 1 - (progressMorph.value * 0.92)).toFixed(3));
let progressSyncFrame = null;

const projectId = computed(() => Number(route.params.id));
const returnMode = computed(() => (
    typeof route.query.returnMode === 'string' && route.query.returnMode.trim()
        ? route.query.returnMode
        : null
));
const returnPage = computed(() => {
    const value = Number(route.query.returnPage);
    return Number.isFinite(value) && value > 0 ? value : null;
});
const returnPageSize = computed(() => {
    const value = Number(route.query.returnPageSize);
    return Number.isFinite(value) && value > 0 ? value : null;
});
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
const isChecklistComplete = computed(() => {
    if (!checklist.value) return false;
    return Object.values(checklist.value).every(Boolean);
});
const canPublishAction = computed(() => !projectRejected.value && canPublishProject(project.value, checklist.value));
const checklistStatus = computed(() => {
    if (project.value?.isPublic) {
        return {
            severity: 'success',
            label: 'Уже опубликован',
        };
    }

    if (isChecklistComplete.value) {
        return {
            severity: 'success',
            label: 'Готово к публикации',
        };
    }

    return {
        severity: 'secondary',
        label: 'Ещё не готово',
    };
});

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

const completedChecklistCount = computed(() => checklistItems.value.filter((item) => item.done).length);

const flattenRoadMapItems = (items = []) => items.flatMap((item) => [
    item,
    ...flattenRoadMapItems(item.roadMapItems || []),
]);

const formatProjectGrade = (value) => {
    const normalized = String(value || '').trim();
    if (!normalized) return 'Не указан';
    if (normalized === '1') return '1 (минимальная сложность)';
    if (normalized === '6') return '6 (максимальная сложность, стратегический)';
    return normalized;
};

const normalizeProjectDocument = (document) => ({
    ...document,
    id: Number(document?.id) || null,
    name: String(document?.name || '').trim(),
    data: document?.data || null,
});

const normalizeProjectDocuments = (documents = []) => (
    Array.isArray(documents)
        ? documents.map(normalizeProjectDocument).filter((document) => document.id)
        : []
);

const cacheProjectDocumentData = (documentId, data) => {
    if (!documentId || !data) return;

    projectDocumentContentCache.value = {
        ...projectDocumentContentCache.value,
        [documentId]: data,
    };
};

const hydrateProjectDocumentCache = (documents = []) => {
    documents.forEach((document) => {
        cacheProjectDocumentData(document.id, document.data);
    });
};

const findProjectDocumentByName = (fileName, previousDocumentIds = new Set()) => {
    const normalizedFileName = String(fileName || '').trim().toLowerCase();
    if (!normalizedFileName) return null;

    const matchedDocuments = projectDocuments.value.filter((document) => (
        String(document?.name || '').trim().toLowerCase() === normalizedFileName
    ));

    if (!matchedDocuments.length) return null;

    const newDocuments = matchedDocuments.filter((document) => !previousDocumentIds.has(document.id));
    const candidates = newDocuments.length ? newDocuments : matchedDocuments;

    return [...candidates].sort((left, right) => right.id - left.id)[0] || null;
};

const wait = (ms = 0) => new Promise((resolve) => {
    window.setTimeout(resolve, ms);
});

const roadMapProgress = computed(() => {
    const items = flattenRoadMapItems(roadMapItems.value);
    if (!items.length) return 0;

    const completedCount = items.filter((item) => item.isCompleted).length;
    return Math.round((completedCount / items.length) * 100);
});

const roadMapTotalCount = computed(() => flattenRoadMapItems(roadMapItems.value).length);
const roadMapCompletedCount = computed(() => (
    flattenRoadMapItems(roadMapItems.value).filter((item) => item.isCompleted).length
));
const showFloatingProgress = computed(() => roadMapTotalCount.value > 0 || checklistItems.value.length > 0);
const floatingProgressCompactTitle = computed(() => {
    if (!roadMapTotalCount.value) {
        return 'Дорожная карта ещё не заполнена';
    }

    if (roadMapProgress.value >= 100) {
        return 'Дорожная карта завершена';
    }

    return 'Дорожная карта в работе';
});
const floatingProgressTag = computed(() => {
    if (project.value?.isPublic) {
        return {
            severity: 'success',
            label: 'Опубликован',
        };
    }

    if (roadMapTotalCount.value && roadMapProgress.value >= 100) {
        return {
            severity: 'success',
            label: 'Шаги завершены',
        };
    }

    if (checklistVisible.value && checklistItems.value.length) {
        return checklistStatus.value;
    }

    return {
        severity: 'secondary',
        label: roadMapTotalCount.value ? 'В работе' : 'Нет шагов',
    };
});

const goBackToProjectList = () => {
    if (returnMode.value && returnPage.value && returnPageSize.value) {
        router.push({
            name: 'ProjectShowcaseList',
            query: {
                mode: returnMode.value,
                page: String(returnPage.value),
                pageSize: String(returnPageSize.value),
            },
        });
        return;
    }

    router.push({ name: 'ProjectShowcaseList' });
};

const getProgressCompactTargetRect = () => {
    if (typeof window === 'undefined') return null;

    const top = window.innerWidth <= 768 ? 12 : 16;
    const right = window.innerWidth <= 768 ? 12 : 16;
    const width = Math.min(window.innerWidth <= 768 ? 320 : 360, window.innerWidth - (right * 2));

    return {
        top,
        left: Math.max(right, window.innerWidth - right - width),
        width,
    };
};

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const easeOutCubic = (value) => 1 - ((1 - value) ** 3);

const updateProgressPresentation = () => {
    if (typeof window === 'undefined' || !showFloatingProgress.value) {
        progressMorph.value = 0;
        floatingProgressStyle.value = {
            opacity: '0',
            pointerEvents: 'none',
        };
        return;
    }

    const inlineElement = projectProgressInlineRef.value;
    const floatingElement = projectProgressFloatingRef.value;
    if (!inlineElement || !floatingElement) return;

    const sourceRect = inlineElement.getBoundingClientRect();
    const targetRect = floatingElement.getBoundingClientRect();
    const compactTarget = getProgressCompactTargetRect();

    const startOffset = window.innerWidth <= 768 ? 160 : 190;
    const endOffset = window.innerWidth <= 768 ? 88 : 104;
    const positionMorph = clamp((startOffset - sourceRect.bottom) / Math.max(1, startOffset - endOffset));
    const scrollTop = window.scrollY || window.pageYOffset || 0;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const assistWindow = Math.min(220, Math.max(80, maxScroll * 0.55));
    const assistStart = Math.max(0, maxScroll - assistWindow);
    const assistProgress = maxScroll > 0
        ? clamp((scrollTop - assistStart) / Math.max(1, maxScroll - assistStart))
        : 0;
    const assistedMorph = positionMorph + ((1 - positionMorph) * easeOutCubic(assistProgress));
    const nextMorph = clamp(Math.max(positionMorph, assistedMorph));

    progressMorph.value = nextMorph;

    const deltaX = sourceRect.left - targetRect.left;
    const deltaY = sourceRect.top - targetRect.top;
    const sourceScaleX = sourceRect.width / targetRect.width;
    const sourceScaleY = sourceRect.height / targetRect.height;

    const translateX = deltaX * (1 - nextMorph);
    const translateY = deltaY * (1 - nextMorph);
    const scaleX = 1 + ((sourceScaleX - 1) * (1 - nextMorph));
    const scaleY = 1 + ((sourceScaleY - 1) * (1 - nextMorph));

    floatingProgressStyle.value = {
        opacity: `${nextMorph}`,
        pointerEvents: nextMorph > 0.92 ? 'auto' : 'none',
        transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleX}, ${scaleY})`,
        transformOrigin: 'top right',
        top: `${compactTarget?.top ?? 16}px`,
        left: `${compactTarget?.left ?? 16}px`,
        width: `${compactTarget?.width ?? targetRect.width}px`,
    };
};

const syncProgressPresentation = async () => {
    await nextTick();
    updateProgressPresentation();
};

const requestProgressPresentationSync = () => {
    if (typeof window === 'undefined') return;
    if (progressSyncFrame) return;

    progressSyncFrame = window.requestAnimationFrame(() => {
        progressSyncFrame = null;
        updateProgressPresentation();
    });
};

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
        await Promise.all([
            loadChecklist(),
            fetchRoadMap(),
        ]);
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

const fetchProjectDocuments = async () => {
    if (!projectId.value) return;

    projectDocumentsLoading.value = true;

    try {
        const response = await getProjectDocuments(projectId.value);
        projectDocuments.value = normalizeProjectDocuments(response.data);
        hydrateProjectDocumentCache(projectDocuments.value);
        projectDocumentsLoaded.value = true;
    } catch (error) {
        projectDocuments.value = [];
        projectDocumentsLoaded.value = false;
        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить документы проекта',
            detail: buildProjectShowcaseErrorMessage(error, 'Повторите попытку позже.'),
            life: 3500,
        });
    } finally {
        projectDocumentsLoading.value = false;
    }
};

const ensureProjectDocumentsLoaded = async () => {
    if (projectDocumentsLoaded.value || projectDocumentsLoading.value) return;
    await fetchProjectDocuments();
};

const withDocumentLoading = async (loadingRef, documentId, action) => {
    if (loadingRef.value.includes(documentId)) return;

    loadingRef.value = [...loadingRef.value, documentId];

    try {
        return await action();
    } finally {
        loadingRef.value = loadingRef.value.filter((id) => id !== documentId);
    }
};

const resolveUploadedProjectDocument = async (fileName, previousDocumentIds = new Set()) => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
        await fetchProjectDocuments();

        const matchedDocument = findProjectDocumentByName(fileName, previousDocumentIds);
        if (matchedDocument) {
            return matchedDocument;
        }

        if (attempt < 2) {
            await wait(350);
        }
    }

    return findProjectDocumentByName(fileName, previousDocumentIds);
};

const handleProjectDocumentSelected = async (selectedFiles) => {
    const [file] = Array.from(selectedFiles || []);
    if (!file || !projectId.value) return;

    projectDocumentUploading.value = true;
    const uploadedFileName = String(file.name || '').trim();
    const previousDocumentIds = new Set(
        projectDocuments.value
            .map((document) => document.id)
            .filter(Boolean),
    );
    let uploadedDocumentContent = '';

    try {
        uploadedDocumentContent = await fileToBase64(file);
        const response = await addProjectDocument(projectId.value, {
            documentName: file.name,
            documentContent: uploadedDocumentContent,
        });
        const uploadedDocumentId = Number(response?.data);

        if (uploadedDocumentId) {
            cacheProjectDocumentData(uploadedDocumentId, uploadedDocumentContent);
        }

        toast.add({
            severity: 'success',
            summary: 'Документ загружен',
            detail: 'Документ добавлен в проект.',
            life: 2500,
        });

        await fetchProjectDocuments();
    } catch (error) {
        const uploadedDocument = await resolveUploadedProjectDocument(uploadedFileName, previousDocumentIds);

        if (uploadedDocument?.id) {
            cacheProjectDocumentData(uploadedDocument.id, uploadedDocumentContent);

            const errorMessage = buildProjectShowcaseErrorMessage(error, '');
            const isMinioStorageIssue = /MinIO API responded with message=documents/i.test(errorMessage);

            toast.add({
                severity: isMinioStorageIssue ? 'warn' : 'success',
                summary: isMinioStorageIssue ? 'Документ загружен с предупреждением' : 'Документ загружен',
                detail: isMinioStorageIssue,
                life: 5000,
            });
            return;
        }

        toast.add({
            severity: 'error',
            summary: 'Не удалось загрузить документ',
            detail: buildProjectShowcaseErrorMessage(error, 'Проверьте файл и повторите попытку.'),
            life: 3500,
        });
    } finally {
        projectDocumentUploading.value = false;
    }
};

const downloadProjectDocumentById = async (documentId, fallbackDocument = null) => {
    await withDocumentLoading(downloadingDocumentIds, documentId, async () => {
        try {
            let targetDocument = fallbackDocument ? normalizeProjectDocument(fallbackDocument) : null;

            if (targetDocument?.data) {
                cacheProjectDocumentData(targetDocument.id, targetDocument.data);
            }

            if (!targetDocument?.data) {
                const cachedData = projectDocumentContentCache.value[documentId];
                const cachedName = targetDocument?.name
                    || projectDocuments.value.find((document) => document.id === Number(documentId))?.name
                    || '';

                if (cachedData && cachedName) {
                    targetDocument = {
                        ...targetDocument,
                        id: Number(documentId),
                        name: cachedName,
                        data: cachedData,
                    };
                }
            }

            if (!targetDocument?.data) {
                const response = await getProjectDocument(documentId);
                targetDocument = normalizeProjectDocument(response.data?.projectDocument || response.data);
                cacheProjectDocumentData(targetDocument.id, targetDocument.data);
            }

            if (!targetDocument?.data || !targetDocument?.name) {
                throw new Error('Документ не содержит данных для скачивания.');
            }

            downloadBase64Document(targetDocument.data, targetDocument.name);
        } catch (error) {
            const errorMessage = buildProjectShowcaseErrorMessage(error, 'Документ временно недоступен для скачивания.');

            toast.add({
                severity: 'error',
                summary: 'Не удалось скачать документ',
                detail: errorMessage,
                life: 3500,
            });
        }
    });
};

const handleProjectDocumentDelete = async (documentId) => {
    await withDocumentLoading(deletingDocumentIds, documentId, async () => {
        try {
            await deleteProjectDocument(documentId);
            const nextDocumentCache = { ...projectDocumentContentCache.value };
            delete nextDocumentCache[documentId];
            projectDocumentContentCache.value = nextDocumentCache;

            toast.add({
                severity: 'success',
                summary: 'Документ удалён',
                detail: 'Список документов проекта обновлён.',
                life: 2500,
            });

            await Promise.all([
                fetchProjectDocuments(),
                fetchRoadMap(),
            ]);
        } catch (error) {
            toast.add({
                severity: 'error',
                summary: 'Не удалось удалить документ',
                detail: buildProjectShowcaseErrorMessage(error, 'Повторите попытку позже.'),
                life: 3500,
            });
        }
    });
};

const handleRoadMapDocumentDownload = async (document) => {
    if (!document?.id) return;
    await downloadProjectDocumentById(document.id, document);
};

const refreshProject = async () => {
    await loadProjectDetails();

    if (activeTab.value === 'team') {
        await fetchParticipants();
    }

    if (activeTab.value === 'journal') {
        await fetchJournal({ reset: true });
    }

    if (activeTab.value === 'documents') {
        await fetchProjectDocuments();
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
    await Promise.all([
        fetchRoadMap(),
        fetchProjectDocuments(),
    ]);
    await loadChecklist();
};

const openRoadMapItemDialog = async () => {
    if (!participants.length) {
        await fetchParticipants();
    }

    await ensureProjectDocumentsLoaded();
    activeRoadMapItem.value = null;
    roadMapDialogVisible.value = true;
};

const openRoadMapEditDialog = async (item) => {
    if (!item?.id) return;

    if (!participants.length) {
        await fetchParticipants();
    }

    await ensureProjectDocumentsLoaded();
    activeRoadMapItem.value = item;
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

    if (tab === 'documents' && !projectDocumentsLoaded.value && !projectDocumentsLoading.value) {
        await fetchProjectDocuments();
    }
});

watch(roadMapDialogVisible, (visible) => {
    if (!visible) {
        activeRoadMapItem.value = null;
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
        projectDocuments.value = [];
        projectDocumentContentCache.value = {};
        projectDocumentsLoaded.value = false;
        downloadingDocumentIds.value = [];
        deletingDocumentIds.value = [];
        activeRoadMapItem.value = null;
        await loadProjectDetails();
    }
);

watch(showFloatingProgress, async () => {
    await syncProgressPresentation();
});

onMounted(async () => {
    currentUser.value = await getCurrentUser();
    await syncProjectShowcaseUser();
    await loadProjectDetails();

    await nextTick();
    await syncProgressPresentation();

    if (typeof window !== 'undefined') {
        window.addEventListener('scroll', requestProgressPresentationSync, { passive: true });
        window.addEventListener('resize', requestProgressPresentationSync);
    }
});

onBeforeUnmount(() => {
    if (typeof window !== 'undefined' && progressSyncFrame) {
        window.cancelAnimationFrame(progressSyncFrame);
        progressSyncFrame = null;
    }

    if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', requestProgressPresentationSync);
        window.removeEventListener('resize', requestProgressPresentationSync);
    }
});
</script>

<style scoped>
.project-details-page {
    --project-bg-1: var(--p-bg-color-2);
    --project-bg-2: var(--p-bg-color-1);
    --project-border: var(--p-grey-4);
    --project-shadow: 0 12px 32px rgba(15, 23, 42, 0.07);
    min-height: 100%;
    padding: 10px;
}

.project-details-shell {
    display: flex;
    flex-direction: column;
    min-height: 100%;
    border-radius: 18px;
    border: 1px solid var(--project-border);
    background:
        radial-gradient(1200px 220px at 10% 0%, rgba(var(--p-blue-500-rgb), 0.08), transparent 60%),
        linear-gradient(180deg, var(--project-bg-1) 0%, var(--project-bg-2) 85%);
    box-shadow: var(--project-shadow);
}

.project-tabs {
    border-radius: 18px;
    overflow: hidden;
}

.project-details-top {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.25rem;
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
    gap: .5rem;
}

.project-progress-panel {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding: 0.95rem 1.05rem;
    border-radius: 18px;
    background: color-mix(in srgb, var(--p-bg-color-1) 90%, var(--p-primary-500) 10%);
    border: 1px solid color-mix(in srgb, var(--p-content-border-color) 78%, var(--p-primary-500) 22%);
    box-shadow:
        0 14px 34px rgba(15, 23, 42, 0.12),
        0 2px 10px rgba(15, 23, 42, 0.04);
    backdrop-filter: blur(12px);
    transform-origin: top right;
}

.project-progress-panel-inline {
    width: 100%;
    transition: opacity 0.2s ease-out;
}

.project-progress-panel-floating {
    position: fixed;
    z-index: 900;
    top: 1rem;
    right: 1rem;
    width: min(360px, calc(100vw - 2rem));
    transform-origin: top right;
    will-change: transform, opacity;
    pointer-events: none;
}

.project-progress-panel-main {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    position: relative;
    z-index: 1;
}

.project-progress-panel-copy {
    min-width: 0;
}

.project-progress-panel-title {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
}

.project-progress-panel-title h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
}

.project-progress-panel-title span {
    color: var(--p-grey-1);
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.project-progress-panel-subline {
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
}

.project-progress-panel-subline small {
    color: var(--p-grey-1);
}

.project-progress-panel-metric {
    min-width: 88px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    gap: 0.15rem;
    text-align: right;
    padding: 0.45rem 0.65rem;
    border-radius: 12px;
    background: color-mix(in srgb, var(--p-bg-color-2) 88%, var(--p-primary-500) 12%);
}

.project-progress-panel-metric strong {
    font-size: 1.5rem;
    color: var(--p-text-color);
    line-height: 1;
}

.project-progress-panel-metric small {
    color: var(--p-grey-1);
    font-size: 0.82rem;
}

.project-summary-card,
.project-section-card,
.project-checklist-card {
    padding: .75rem 1rem;
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
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.5rem;
}

.project-info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem 0.85rem;
    border-radius: 14px;
    background: rgba(var(--p-blue-500-rgb), 0.04);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.08);
    min-width: 0;
}

.project-info-item strong {
    font-size: 0.95rem;
    line-height: 1.45;
    color: var(--p-text-color);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}

.project-info-item-wide {
    grid-column: 1 / -1;
}

.project-subsection {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    margin-top: 1rem;
}

.project-subsection-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--p-text-color);
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

.project-document-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.project-document-dropzone {
    margin-bottom: 1rem;
}

.project-document-card {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.95rem 1rem;
    border-radius: 14px;
    background: rgba(var(--p-blue-500-rgb), 0.04);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.08);
}

.project-document-copy {
    min-width: 0;
}

.project-document-copy p {
    margin: 0.35rem 0 0;
    color: var(--p-grey-1);
    line-height: 1.55;
}

.project-document-name {
    display: flex;
    align-items: center;
    gap: 0.65rem;
}

.project-document-actions {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    justify-content: flex-end;
}

@media (max-width: 1024px) {
    .project-summary-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .project-info-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 768px) {
    .project-details-page {
        padding: 0.75rem;
    }

    .project-details-top {
        padding: 1rem;
    }

    .project-details-header,
    .project-section-head {
        flex-direction: column;
        align-items: stretch;
    }

    .project-progress-panel {
        padding: 1rem;
        border-radius: 20px;
    }

    .project-progress-panel-floating {
        top: 0.75rem;
        right: 0.75rem;
        width: min(320px, calc(100vw - 1.5rem));
    }

    .project-progress-panel-main,
    .project-progress-panel-subline {
        flex-direction: column;
        align-items: flex-start;
    }

    .project-progress-panel-metric {
        min-width: 0;
        width: 100%;
        align-items: flex-start;
        text-align: left;
    }

    .project-summary-grid,
    .project-info-grid,
    .project-checklist-grid {
        grid-template-columns: 1fr;
    }

    .project-journal-item {
        grid-template-columns: 1fr;
    }

    .project-document-card {
        flex-direction: column;
    }

    .project-document-actions {
        justify-content: flex-start;
    }
}
</style>
