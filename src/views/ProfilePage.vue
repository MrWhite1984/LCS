<template>
    <main>

        <!-- Сайдбар перключения профилей -->
        <aside class="sidebar">
            <div class="button-group">
                <Button label="Профиль ЛКС" unstyled icon="pi pi-user me-3" @click="setActiveProfile('user')" :class="{ 'active-link': activeProfile === 'user' }" class="menu-item w-100 mb-3"/>
                <Button unstyled label="Полномочия" icon="pi pi-lock me-3" @click="setActiveProfile('permiss')" :class="{ 'active-link': activeProfile === 'permiss' }" class="menu-item w-100 mb-3"/>

                <Divider />
                <div class="external-systems-title">Внешние системы</div>
                <div class="external-systems-list">
                    <Button
                        v-for="account in externalAccounts"
                        :key="account.id"
                        unstyled
                        icon="pi pi-external-link me-3"
                        :label="getSystemTypeLabel(account.systemType)"
                        @click="openExternalAccount(account)"
                        :class="{ 'active-link': activeProfile === 'external' && selectedExternalAccount?.id === account.id }"
                        class="menu-item w-100 mb-2"
                    />
                    <Button
                        v-if="isAdmin"
                        icon="pi pi-plus"
                        severity="secondary"
                        outlined
                        class="w-100 mt-2"
                        @click="openAddExternalDialog"
                    />
                </div>
            </div>

            <GetOtpButton 
                v-if="hasPermission('User', 'Update')"
                :userId="userId"
                :buttonLabel="'Получить OTP'"
                :showLabel="true"
                :buttonSeverity="'help'"
                class="w-100 mb-3"
            />

            <!-- Изменить пароль -->
            <Button class="w-100 mb-3" label="Сменить пароль" icon="pi pi-key" outlined @click="visible = true" v-if="!isCurrentUser && hasPermission('User', 'Update')" />
            <Dialog v-model:visible="visible" modal header="Изменить пароль" :style="{ 'max-width': '30rem' }">
                <form>
                    <FloatLabel class="mt-4">
                        <Password v-model="userPassword" inputId="userPassword" toggleMask class="form-input" @input="validatePassword" :feedback="false" :invalid="!passwordChecks.length || !passwordChecks.upperLower || !passwordChecks.number" />
                        <label for="userPassword">Пароль</label>
                    </FloatLabel>
                </form>
                <div class="password-requirements my-3">
                    <p><i :class="passwordChecks.length ? 'pi pi-thumbs-up text-success' : 'pi pi-thumbs-down text-danger'" class="me-2"/> Минимум 8 символов</p>
                    <p><i :class="passwordChecks.upperLower ? 'pi pi-thumbs-up text-success' : 'pi pi-thumbs-down text-danger'" class="me-2"/> Верхний и нижний регистры</p>
                    <p><i :class="passwordChecks.number ? 'pi pi-thumbs-up text-success' : 'pi pi-thumbs-down text-danger'" class="me-2"/> Минимум одна цифра</p>
                </div>
                <Button label="Сохранить" class="w-100 text-center" @click="changePassword"/>
            </Dialog>

            <!-- Изменить о себе -->
            <div v-if="isCurrentUser">
                <Button label="Сменить пароль" text icon="pi pi-key" class="d-flex justify-content-between w-100" iconPos="right" @click="visiblePass = true" />
                <Dialog v-model:visible="visiblePass" modal header="Сменить пароль" :style="{ 'max-width': '25rem' }">
                    <form>
                        <div class="">
                            <label for="oldPass" class="ms-2">Старый пароль</label>
                            <Password :inputProps="{ autocomplete: 'off' }" inputId="oldPass" name="oldPass" v-model="oldPass" class="form-input w-100" :feedback="false" toggleMask placeholder="Введите пароль" />
                        </div>
                        <div class="mt-2">
                            <label for="newPass" class="ms-2">Новый пароль</label>
                            <Password inputId="newPass" name="newPass" v-model="newPass" class="form-input w-100" :feedback="false" toggleMask @input="validateMePassword" :invalid="!passwordChecks.length || !passwordChecks.upperLower || !passwordChecks.number" autocomplete="off" placeholder="Введите новый пароль"/>
                        </div>
                        <div class="password-requirements my-3 mx-2">
                            <p><i :class="passwordChecks.length ? 'pi pi-thumbs-up text-success' : 'pi pi-thumbs-down text-danger'" class="me-2"/> Минимум 8 символов</p>
                            <p><i :class="passwordChecks.upperLower ? 'pi pi-thumbs-up text-success' : 'pi pi-thumbs-down text-danger'" class="me-2"/> Верхний и нижний регистры</p>
                            <p><i :class="passwordChecks.number ? 'pi pi-thumbs-up text-success' : 'pi pi-thumbs-down text-danger'" class="me-2"/> Минимум одна цифра</p>
                        </div>
                        <div class="">
                            <label for="confirmPass" class="ms-2">Подтвердите новый пароль</label>
                            <Password inputId="confirmPass" name="confirmPass" v-model="confirmPass" class="form-input w-100" :feedback="false" toggleMask :invalid="newPass !== confirmPass && confirmPass" />
                        </div>
                        <Button label="Сохранить" icon="pi pi-check" class="w-100 mt-4" @click="changeMePass"/>
                    </form>
                </Dialog>
                <Button label="Сменить email" text icon="pi pi-at" class="d-flex justify-content-between w-100" iconPos="right" @click="visibleEmail = true" />
                <Dialog v-model:visible="visibleEmail" modal header="Сменить e-mail" :style="{ 'max-width': '25rem' }">
                    <div class="">
                        <label for="newEmail" class="ms-2">Новый e-mail</label>
                        <InputText id="newEmail" name="newEmail" v-model="newEmail" class="form-input w-100" placeholder="Введите e-mail" />
                    </div>
                    <Button label="Сохранить" icon="pi pi-check" class="w-100 mt-4" @click="changeEmail"/>
                </Dialog>
            </div>

            
            <!-- Кнопка блокировки -->
            <Button 
                v-if="!isCurrentUser && hasPermission('User', 'Update')"
                :label="blockButtonLabel" 
                class="w-100 block-button" 
                :severity="blockButtonSeverity" 
                text 
                @click="toggleUserBlock"
            />

            <Dialog v-model:visible="showAddExternalDialog" modal header="Добавить внешний аккаунт" :style="{ 'max-width': '40rem', width: '100%' }">
                <div class="external-form-grid">
                    <div>
                        <label for="externalSystemType" class="mb-1 d-block">Тип системы</label>
                        <Select
                            id="externalSystemType"
                            v-model="externalForm.systemType"
                            :options="systemTypeOptions"
                            optionLabel="label"
                            optionValue="value"
                            class="w-100"
                            placeholder="Выберите систему"
                            :loading="systemTypeOptionsLoading"
                        />
                    </div>
                    <div>
                        <label for="externalSystemUserId" class="mb-1 d-block">ID пользователя в системе</label>
                        <InputText id="externalSystemUserId" v-model="externalForm.userIdInOtherSystem" class="w-100" />
                    </div>
                    <div class="full-width">
                        <label class="mb-1 d-block">Формат Information</label>
                        <SelectButton
                            v-model="addInformationMode"
                            :options="addInformationModeOptions"
                            optionLabel="label"
                            optionValue="value"
                            class="w-100 mb-2"
                        />
                    </div>
                    <div class="full-width" v-if="addInformationMode === 'fields'">
                        <div class="external-edit-grid">
                            <div
                                v-for="(field, index) in addExternalFields"
                                :key="`add-${index}`"
                                class="external-add-row"
                            >
                                <InputText v-model="field.key" placeholder="Ключ" class="w-100" />
                                <InputText v-model="field.value" placeholder="Значение" class="w-100" />
                                <Button
                                    icon="pi pi-trash"
                                    severity="danger"
                                    outlined
                                    size="small"
                                    :disabled="addExternalFields.length === 1"
                                    @click="removeAddExternalField(index)"
                                />
                            </div>
                            <Button
                                label="Добавить поле"
                                icon="pi pi-plus"
                                outlined
                                severity="secondary"
                                size="small"
                                class="align-self-start"
                                @click="addExternalFields.push({ key: '', value: '' })"
                            />
                        </div>
                    </div>
                    <div class="full-width" v-else>
                        <label for="externalSystemInfo" class="mb-1 d-block">Information</label>
                        <Textarea id="externalSystemInfo" v-model="externalForm.information" rows="12" class="w-100" />
                    </div>
                </div>
                <div class="d-flex justify-content-end mt-3 gap-2">
                    <Button label="Отмена" text severity="secondary" @click="showAddExternalDialog = false" />
                    <Button label="Добавить" icon="pi pi-check" :loading="externalActionLoading" @click="addExternalAccount" />
                </div>
            </Dialog>

            <Dialog v-model:visible="showEditExternalDialog" modal header="Изменить" :style="{ 'max-width': '40rem', width: '100%' }">
                <div>
                    <label class="mb-1 d-block">Information</label>
                    <div v-if="isExternalInfoStructured" class="external-edit-grid">
                        <div
                            v-for="(field, index) in editableExternalFields"
                            :key="`${field.key}-${index}`"
                            class="external-edit-row"
                        >
                            <label class="external-edit-label">{{ field.key }}</label>
                            <InputText v-model="field.value" placeholder="Значение" class="w-100" />
                        </div>
                    </div>
                    <Textarea v-else id="externalSystemInfoEdit" v-model="editExternalInformation" rows="14" class="w-100" />
                </div>
                <div class="d-flex justify-content-end mt-3 gap-2">
                    <Button label="Отмена" text severity="secondary" @click="showEditExternalDialog = false" />
                    <Button label="Сохранить" icon="pi pi-check" :loading="externalActionLoading" @click="updateExternalAccountInformation" />
                </div>
            </Dialog>

            <Dialog v-model:visible="showDeleteExternalDialog" modal header="Удалить внешний аккаунт?" :style="{ 'max-width': '30rem' }">
                <p class="m-0">Вы уверены, что хотите удалить связку внешней системы?</p>
                <div class="d-flex justify-content-end mt-3 gap-2">
                    <Button label="Отмена" text severity="secondary" @click="showDeleteExternalDialog = false" />
                    <Button label="Удалить" icon="pi pi-trash" severity="danger" :loading="externalActionLoading" @click="deleteExternalAccount" />
                </div>
            </Dialog>
        </aside>
        

        <div class="content-wrap">
            <div v-if="activeProfile === 'user'">
                <div class="profile-card profile-card-user">
                    <!-- <div class="profile-header">
                        <img src="../assets/backgrounds/profBack.webp" alt="Profile Header" class="header-image"/>
                    </div> -->
                    <div class="row mx-0">
                        <div class="col-auto d-flex align-items-center justify-content-center">
                            <div
                                class="avatar-wrapper"
                                :class="{ 'avatar-wrapper-dragover': isAvatarDragOver }"
                                @dragover.prevent="onAvatarDragOver"
                                @dragleave.prevent="onAvatarDragLeave"
                                @drop.prevent="onAvatarDrop"
                            >
                                <Avatar :image="srcAvatar" icon="pi pi-user fs-1" size="large" shape="circle" style="transition: all 0.5s;" />
                                <div class="avatar-overlay" @click="triggerFileUpload">
                                    <div class="avatar-overlay-copy">
                                        <div class="upload-button pi pi-camera" />
                                        <small>{{ isAvatarDragOver ? 'Отпустите изображение' : 'Нажмите или перетащите фото' }}</small>
                                    </div>
                                    <input 
                                        ref="fileInput" 
                                        type="file" 
                                        style="display: none" 
                                        accept="image/*"
                                        @change="onFileSelect"
                                    />
                                </div>
                            </div>
                        </div>
                        <div class="col d-flex align-items-center">
                            <div class="profile-body w-100">
                                <div class="row justify-content-between">
                                    <div class="col">
                                        <h2>{{ fullName }}</h2>
                                        <p class="profile-email">{{ email }}</p>
                                        <div class="profile-role d-flex flex-row gap-2">
                                            <template v-if="userRoles.length > 0">
                                                <div v-for="ur in userRoles" :key="ur.id">
                                                    <Chip class="role-label" >
                                                        <span class="roleType" :class="getRoleTypeClass(ur)">
                                                            {{ ur.type[0] }}
                                                        </span>
                                                        <span>{{ ur.title }}</span>
                                                    </Chip>
                                                </div>
                                            </template>
                                            <template v-else>
                                                <Tag severity="warn">Нет ролей</Tag>
                                            </template>
                                        </div>
                                    </div>
                                    <div class="col-auto d-flex align-items-center">
                                        <UpdateUser v-if="!isCurrentUser && hasPermission('User', 'Update')" :userId="userId"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="profile-card profile-card-user-secondary" style="margin-top: 10px;">
                    <div class="profile-info-header">
                        <div>
                            <h2 class="mb-1">Информация о пользователе</h2>
                            <p class="profile-info-subtitle">Основные данные профиля</p>
                        </div>
                        <i class="pi pi-id-card profile-info-icon"></i>
                    </div>
                    <div class="profile-info-body">
                        <div class="info-card">
                            <div class="field">Имя</div>
                            <div class="value">{{ firstName }}</div>
                        </div>
                        <div class="info-card">
                            <div class="field">Фамилия</div>
                            <div class="value">{{ lastName }}</div>
                        </div>
                        <div class="info-card">
                            <div class="field">Отчество</div>
                            <div class="value">{{ middleName || '-' }}</div>
                        </div>
                        <div class="info-card">
                            <div class="field">Email</div>
                            <div class="value">{{ email }}</div>
                        </div>
                        <!-- <div class="info-card">
                            <span class="field">Телефон</span>
                        </div> -->
                    </div>
                </div>
            </div>

            <!-- Полномочия -->
            <div v-if="activeProfile === 'permiss'">
                <div class="profile-card">
                    <MePermissionsPage />
                </div>
            </div>
            
            <div v-if="activeProfile === 'external'">
                <div class="profile-card external-profile-card">
                    <div class="external-header">
                        <div>
                            <div class="external-eyebrow">Внешняя система</div>
                            <h2 class="m-0">{{ selectedExternalAccount ? getSystemTypeLabel(selectedExternalAccount.systemType) : 'Внешние системы' }}</h2>
                            <p v-if="selectedExternalAccount" class="external-subtitle">
                                Структурированные данные связки пользователя
                            </p>
                        </div>
                        <div v-if="selectedExternalAccount && isAdmin" class="d-flex gap-2">
                            <Button label="Изменить" icon="pi pi-pencil" outlined severity="secondary" @click="openEditExternalDialog" />
                            <Button label="Удалить" icon="pi pi-trash" severity="danger" outlined @click="showDeleteExternalDialog = true" />
                        </div>
                    </div>

                    <div v-if="externalAccountsLoading" class="d-flex align-items-center gap-2">
                        <ProgressSpinner style="width: 24px; height: 24px;" />
                        <span>Загрузка внешних систем...</span>
                    </div>

                    <div v-else-if="!selectedExternalAccount" class="external-empty-page">
                        Выберите систему слева для просмотра информации
                    </div>

                    <div v-else class="external-info">
                        <div class="external-meta-grid">
                            <div class="external-meta-card">
                                <div class="external-meta-label">ID связки</div>
                                <div class="external-meta-value">{{ selectedExternalAccount.id }}</div>
                            </div>
                            <div class="external-meta-card">
                                <div class="external-meta-label">User ID в системе</div>
                                <div class="external-meta-value">{{ selectedExternalAccount.userIdInOtherSystem || '-' }}</div>
                            </div>
                            <div class="external-meta-card">
                                <div class="external-meta-label">Тип системы</div>
                                <div class="external-meta-value">{{ getSystemTypeLabel(selectedExternalAccount.systemType) }}</div>
                            </div>
                        </div>

                        <template v-if="isInfraManagerAccount">
                            <div
                                v-for="section in infraManagerSections"
                                :key="section.title"
                                class="external-data-section"
                            >
                                <div class="external-section-header">
                                    <div>
                                        <div class="external-section-title">{{ section.title }}</div>
                                        <div v-if="section.subtitle" class="external-section-subtitle">{{ section.subtitle }}</div>
                                    </div>
                                </div>

                                <div class="external-kv-grid">
                                    <div v-for="field in section.fields" :key="field.label" class="external-kv-card">
                                        <div class="external-kv-label">{{ field.label }}</div>
                                        <div class="external-kv-value">
                                            <span
                                                v-if="field.isBoolean"
                                                class="external-boolean"
                                                :class="{ 'is-true': field.booleanValue, 'is-false': !field.booleanValue }"
                                            >
                                                <i :class="field.booleanValue ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                                                {{ field.booleanValue ? 'Да' : 'Нет' }}
                                            </span>
                                            <template v-else>{{ field.value }}</template>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>

                        <template v-else-if="isUmuAccount">
                            <div
                                v-for="section in umuSummarySections"
                                :key="section.title"
                                class="external-data-section"
                            >
                                <div class="external-section-header">
                                    <div>
                                        <div class="external-section-title">{{ section.title }}</div>
                                        <div v-if="section.subtitle" class="external-section-subtitle">{{ section.subtitle }}</div>
                                    </div>
                                </div>

                                <div class="external-kv-grid">
                                    <div v-for="field in section.fields" :key="field.label" class="external-kv-card">
                                        <div class="external-kv-label">{{ field.label }}</div>
                                        <div class="external-kv-value">
                                            <span
                                                v-if="field.isBoolean"
                                                class="external-boolean"
                                                :class="{ 'is-true': field.booleanValue, 'is-false': !field.booleanValue }"
                                            >
                                                <i :class="field.booleanValue ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                                                {{ field.booleanValue ? 'Да' : 'Нет' }}
                                            </span>
                                            <template v-else>{{ field.value }}</template>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="external-data-section">
                                <div class="external-section-header">
                                    <div>
                                        <div class="external-section-title">Статус обучающегося</div>
                                        <div class="external-section-subtitle">Текущее состояние профиля в УМУ</div>
                                    </div>
                                </div>

                                <div class="external-badge-row external-badge-row-single">
                                    <div class="external-badge-group">
                                        <div class="external-badge-label">Статус</div>
                                        <Tag :value="umuStatusLabel" severity="info" />
                                    </div>
                                </div>
                            </div>
                        </template>

                        <template v-else-if="isOneCzkguAccount">
                            <div
                                v-for="section in oneCzkguSummarySections"
                                :key="section.title"
                                class="external-data-section"
                            >
                                <div class="external-section-header">
                                    <div>
                                        <div class="external-section-title">{{ section.title }}</div>
                                        <div v-if="section.subtitle" class="external-section-subtitle">{{ section.subtitle }}</div>
                                    </div>
                                </div>

                                <div class="external-kv-grid">
                                    <div v-for="field in section.fields" :key="field.label" class="external-kv-card">
                                        <div class="external-kv-label">{{ field.label }}</div>
                                        <div class="external-kv-value">
                                            <span
                                                v-if="field.isBoolean"
                                                class="external-boolean"
                                                :class="{ 'is-true': field.booleanValue, 'is-false': !field.booleanValue }"
                                            >
                                                <i :class="field.booleanValue ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                                                {{ field.booleanValue ? 'Да' : 'Нет' }}
                                            </span>
                                            <template v-else>{{ field.value }}</template>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="external-data-section">
                                <div class="external-section-header">
                                    <div>
                                        <div class="external-section-title">Должности</div>
                                        <div class="external-section-subtitle">Текущие назначения и условия работы</div>
                                    </div>
                                </div>

                                <div v-if="oneCzkguJobPositions.length" class="external-job-grid">
                                    <div v-for="job in oneCzkguJobPositions" :key="job.id" class="external-job-card">
                                        <div class="external-job-card-header">
                                            <div>
                                                <div class="external-job-title">{{ job.title }}</div>
                                                <div class="external-job-subtitle">{{ job.division }}</div>
                                            </div>
                                            <Tag :value="job.workFunction" severity="secondary" />
                                        </div>

                                        <div class="external-kv-grid external-kv-grid-compact">
                                            <div v-for="field in job.fields" :key="field.label" class="external-kv-card">
                                                <div class="external-kv-label">{{ field.label }}</div>
                                                <div class="external-kv-value">
                                                    <span
                                                        v-if="field.isBoolean"
                                                        class="external-boolean"
                                                        :class="{ 'is-true': field.booleanValue, 'is-false': !field.booleanValue }"
                                                    >
                                                        <i :class="field.booleanValue ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                                                        {{ field.booleanValue ? 'Да' : 'Нет' }}
                                                    </span>
                                                    <template v-else>{{ field.value }}</template>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="external-empty-inline">Нет данных о должностях</div>
                            </div>

                            <div class="external-data-section">
                                <div class="external-section-header">
                                    <div>
                                        <div class="external-section-title">Академическая информация</div>
                                        <div class="external-section-subtitle">Степени и звания</div>
                                    </div>
                                </div>

                                <div class="external-badge-row">
                                    <div class="external-badge-group">
                                        <div class="external-badge-label">Ученые степени</div>
                                        <template v-if="oneCzkguAcademicDegrees.length">
                                            <Tag v-for="degree in oneCzkguAcademicDegrees" :key="degree" :value="degree" severity="info" />
                                        </template>
                                        <span v-else class="external-empty-inline">Нет данных</span>
                                    </div>
                                    <div class="external-badge-group">
                                        <div class="external-badge-label">Ученые звания</div>
                                        <template v-if="oneCzkguAcademicRanks.length">
                                            <Tag v-for="rank in oneCzkguAcademicRanks" :key="rank" :value="rank" severity="success" />
                                        </template>
                                        <span v-else class="external-empty-inline">Нет данных</span>
                                    </div>
                                </div>
                            </div>
                        </template>

                        <div v-else-if="parsedExternalInformationRows.length" class="external-data-section">
                            <div class="external-section-header">
                                <div>
                                    <div class="external-section-title">Information</div>
                                    <div class="external-section-subtitle">Вложенные данные аккаунта</div>
                                </div>
                            </div>

                            <div class="external-tree">
                                <div
                                    v-for="entry in parsedExternalInformationRows"
                                    :key="entry.id"
                                    class="external-tree-row"
                                    :class="{ 'external-tree-row-group': entry.isGroup }"
                                >
                                    <div
                                        class="external-tree-key"
                                        :style="{ paddingLeft: `${1 + (entry.depth * 1.15)}rem` }"
                                    >
                                        <span class="external-tree-branch" :style="{ left: `${0.45 + (entry.depth * 1.15)}rem` }"></span>
                                        {{ entry.label }}
                                    </div>
                                    <div class="external-tree-value" :class="{ 'external-tree-value-group': entry.isGroup }">
                                        <span
                                            v-if="entry.isBoolean"
                                            class="external-boolean"
                                            :class="{ 'is-true': entry.booleanValue, 'is-false': !entry.booleanValue }"
                                        >
                                            <i :class="entry.booleanValue ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
                                            {{ entry.booleanValue ? 'Да' : 'Нет' }}
                                        </span>
                                        <template v-else>{{ entry.value }}</template>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <pre v-else class="external-raw">{{ selectedExternalAccount.information || 'Пусто' }}</pre>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import axiosInstance from '@/utils/axios.js';
import { usePermissionStore } from '@/stores/permissions.js';
import { getSessionUserId } from '@/utils/TokenService.js';
import { formatDateRuShort } from '@/utils/date.js';

import UpdateUser from '@/components/Users/UpdateUser.vue';
import MePermissionsPage from '@/views/MePermissionsPage.vue';

import GetOtpButton from '@/components/Users/GetOtpButton.vue';

const permissionStore = usePermissionStore();

const hasPermission = (type, action) => permissionStore.hasPermission(type, action);

const isCurrentUser = computed(() => {
    return String(getSessionUserId() || '') === String(userId.value || '');
});

const route = useRoute();

const srcAvatar = ref(null);
const loading = ref(true);
const visible = ref(false);
const visiblePass = ref(false);
const visibleEmail = ref(false);
const fileInput = ref(null);
const isAvatarDragOver = ref(false);
const sidebarVisible = ref(false);
const activeProfile = ref('user'); // Переключение профилей

const firstName = ref('');
const lastName = ref('');
const middleName = ref('');
const fullName = ref('');
const email = ref('');
const userRoles = ref([]);

const newEmail = ref('');
const oldPass = ref('');
const newPass = ref('');
const confirmPass = ref('');

const userPassword = ref(null);

const passwordChecks = ref({
    length: false,
    upperLower: false,
    number: false,
});

const validatePassword = () => {
    passwordChecks.value.length = userPassword.value.length >= 8;
    passwordChecks.value.upperLower = /[a-z]/.test(userPassword.value) && /[A-Z]/.test(userPassword.value);
    passwordChecks.value.number = /\d/.test(userPassword.value);
};

const validateMePassword = () => {
    passwordChecks.value.length = newPass.value.length >= 8;
    passwordChecks.value.upperLower = /[a-z]/.test(newPass.value) && /[A-Z]/.test(newPass.value);
    passwordChecks.value.number = /\d/.test(newPass.value);
};

const userId = ref(route.query.id || null);
const currentUserRoleIds = ref([]);
const isAdmin = computed(() => currentUserRoleIds.value.includes(1));

const isBlocked = ref(null);

const externalAccounts = ref([]);
const externalAccountsLoading = ref(false);
const selectedExternalAccount = ref(null);
const showAddExternalDialog = ref(false);
const showEditExternalDialog = ref(false);
const showDeleteExternalDialog = ref(false);
const externalActionLoading = ref(false);
const systemTypeOptions = ref([]);
const systemTypeOptionsLoading = ref(false);
const externalForm = ref({
    userIdInOtherSystem: '',
    systemType: null,
    information: ''
});
const addInformationMode = ref('fields');
const addInformationModeOptions = [
    { label: 'Ключ-значение', value: 'fields' },
    { label: 'JSON', value: 'raw' }
];
const addExternalFields = ref([{ key: '', value: '' }]);
const addInformationModeSync = ref(false);
const editExternalInformation = ref('');
const editableExternalFields = ref([]);
const isExternalInfoStructured = ref(false);

const blockButtonLabel = computed(() => (isBlocked.value ? 'Разблокировать' : 'Заблокировать'));
const blockButtonSeverity = computed(() => (isBlocked.value ? 'success' : 'danger'));

const toggleUserBlock = async () => {
    try {
        const endpoint = isBlocked.value ? 'unblock' : 'block';
        await axiosInstance.patch(`/api/users/${ userId.value }/${ endpoint }`);
        
        fetchUserProfile(userId.value);
    } catch (error) {
        console.debug(`Ошибка при ${ isBlocked.value ? 'разблокировке' : 'блокировке' } пользователя: `, error);
    }
}

// Классы для отображения ролей в зависимости от их типа
const getRoleTypeClass = (role) => {
    return role?.type === 'Custom' ? 'custom-role-type' : 'default-role-type';
}

const setActiveProfile = async (profile) => {
    activeProfile.value = profile;
    sidebarVisible.value = false;

    if (profile === 'external' && !externalAccounts.value.length) {
        await fetchExternalAccounts();
    }
};

const triggerFileUpload = () => {
  fileInput.value.click();
}

const applyAvatarFile = (file) => {
    if (!file || !String(file.type || '').startsWith('image/')) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        srcAvatar.value = e.target.result;
    };

    reader.readAsDataURL(file);
};

const onAvatarDragOver = () => {
    isAvatarDragOver.value = true;
};

const onAvatarDragLeave = (event) => {
    const nextTarget = event?.relatedTarget;
    if (nextTarget && event.currentTarget?.contains?.(nextTarget)) return;
    isAvatarDragOver.value = false;
};

const onAvatarDrop = (event) => {
    isAvatarDragOver.value = false;
    const file = event?.dataTransfer?.files?.[0];
    applyAvatarFile(file);
};

const changePassword = async () => {
    try {
        await axiosInstance.patch(`/api/users/${ userId.value }/password`, userPassword.value.toString());
        visible.value = false;
    } catch (error) {
        console.debug('Ошибка при сохранении пароля: ', error);
    }
}

function onFileSelect(event) {
    const file = event.target.files[0];
    applyAvatarFile(file);
}

let statusInfra = null;
const status = ref(false);
const INFRA_MANAGER_SYSTEM_TYPE = 0;
const UMU_SYSTEM_TYPE = 3;
const ONE_CZKGU_SYSTEM_TYPE = 1;

const parseInformation = (information) => {
    if (!information) return null;
    if (typeof information === 'object') return information;
    try {
        return JSON.parse(information);
    } catch {
        return null;
    }
};

const formatExternalInfoValue = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return String(value);
};

const formatExternalInfoLabel = (label) => {
    if (!label) return '';

    const arrayMatch = /^\[(\d+)\]$/.exec(label);
    if (arrayMatch) {
        return `Элемент ${arrayMatch[1]}`;
    }

    return String(label)
        .replace(/_/g, ' ')
        .replace(/([a-zа-я0-9])([A-ZА-Я])/g, '$1 $2')
        .trim();
};

const buildExternalInformationRows = (value, depth = 0, label = '', path = 'root') => {
    if (Array.isArray(value)) {
        if (!value.length) {
            return label ? [{ id: path, label, value: '[]', depth, isGroup: false }] : [];
        }

        const rows = label
            ? [{ id: path, label: formatExternalInfoLabel(label), value: `Список (${value.length})`, depth, isGroup: true }]
            : [];

        value.forEach((item, index) => {
            const itemLabel = `[${index + 1}]`;
            rows.push(...buildExternalInformationRows(item, depth + (label ? 1 : 0), itemLabel, `${path}.${index}`));
        });

        return rows;
    }

    if (value && typeof value === 'object') {
        const entries = Object.entries(value);
        if (!entries.length) {
            return label ? [{ id: path, label, value: '{}', depth, isGroup: false }] : [];
        }

        const rows = label
            ? [{ id: path, label: formatExternalInfoLabel(label), value: 'Объект', depth, isGroup: true }]
            : [];
        const nestedDepth = depth + (label ? 1 : 0);

        entries.forEach(([key, nestedValue]) => {
            rows.push(...buildExternalInformationRows(nestedValue, nestedDepth, key, `${path}.${key}`));
        });

        return rows;
    }

    if (!label) return [];

    return [{
        id: path,
        label: formatExternalInfoLabel(label),
        value: formatExternalInfoValue(value),
        depth,
        isGroup: false,
        isBoolean: typeof value === 'boolean',
        booleanValue: typeof value === 'boolean' ? value : null
    }];
};

const parsedExternalInformationRows = computed(() => {
    const info = parseInformation(selectedExternalAccount.value?.information);
    if (!info || typeof info !== 'object') return [];

    return buildExternalInformationRows(info);
});

const parsedExternalInformation = computed(() => {
    const info = parseInformation(selectedExternalAccount.value?.information);
    return info && typeof info === 'object' ? info : null;
});

const isInfraManagerAccount = computed(() => Number(selectedExternalAccount.value?.systemType) === INFRA_MANAGER_SYSTEM_TYPE);
const isUmuAccount = computed(() => Number(selectedExternalAccount.value?.systemType) === UMU_SYSTEM_TYPE);
const isOneCzkguAccount = computed(() => Number(selectedExternalAccount.value?.systemType) === ONE_CZKGU_SYSTEM_TYPE);

const createExternalField = (label, value) => ({
    label,
    value: formatExternalInfoValue(value),
    isBoolean: typeof value === 'boolean',
    booleanValue: typeof value === 'boolean' ? value : null
});

const filterExternalFields = (fields) => fields.filter(field => field.value !== '-');

const formatExternalDateValue = (value) => {
    if (!value) return null;

    if (typeof value === 'string') {
        const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/.exec(value);
        if (isoDateMatch) {
            const [, year, month, day] = isoDateMatch;
            return `${day}.${month}.${year}`;
        }
    }

    return formatDateRuShort(value, null);
};

const resolveStudentGroupLabel = (studentGroup) => {
    if (!studentGroup) return null;
    if (typeof studentGroup === 'string') return studentGroup;

    return studentGroup.Name
        || studentGroup.Title
        || studentGroup.Number
        || studentGroup.Code
        || null;
};

const infraManagerSections = computed(() => {
    if (!isInfraManagerAccount.value || !parsedExternalInformation.value) return [];

    const info = parsedExternalInformation.value;

    return [
        {
            title: 'Основное',
            subtitle: 'Личные и учетные данные',
            fields: filterExternalFields([
                createExternalField('ФИО', [info.Surname, info.Name, info.Patronymic].filter(Boolean).join(' ')),
                createExternalField('E-mail', info.Email),
                createExternalField('Логин', info.Login),
                createExternalField('Внутренний телефон', info.PhoneInternal || info.Phone),
                createExternalField('Таймзона', info.TimeZoneName)
            ])
        },
        {
            title: 'Оргструктура',
            subtitle: 'Подразделение и подчиненность',
            fields: filterExternalFields([
                createExternalField('Организация', info.OrganizationName),
                createExternalField('Подразделение', info.DivisionName),
                createExternalField('Должность', info.PositionName),
                createExternalField('Руководитель', info.ManagerName)
            ])
        },
        {
            title: 'Локация',
            subtitle: 'Рабочее место пользователя',
            fields: filterExternalFields([
                createExternalField('Корпус', info.BuildingName),
                createExternalField('Этаж', info.FloorName),
                createExternalField('Кабинет', info.RoomName),
                createExternalField('Рабочее место', info.WorkplaceName)
            ])
        },
        {
            title: 'Система',
            subtitle: 'Служебные параметры',
            fields: filterExternalFields([
                createExternalField('ID в системе', info.Id),
                createExternalField('Внутренний ID', info.IntId),
                createExternalField('Доступ SD Web', info.SDWebAccessIsGranted),
                createExternalField('Удален', info.IsRemoved),
                createExternalField('Заблокирован для OSI', info.IsLockedForOSI)
            ])
        }
    ].filter(section => section.fields.length);
});

const umuSummarySections = computed(() => {
    if (!isUmuAccount.value || !parsedExternalInformation.value) return [];

    const info = parsedExternalInformation.value;
    const studentGroup = info.StudentGroup;

    return [
        {
            title: 'Основное',
            subtitle: 'Персональные данные обучающегося',
            fields: filterExternalFields([
                createExternalField('ФИО', [info.Surname, info.Name, info.Patronymic].filter(Boolean).join(' ')),
                createExternalField('E-mail', info.Email),
                createExternalField('Дата рождения', formatExternalDateValue(info.BirthDate))
            ])
        },
        {
            title: 'Обучение',
            subtitle: 'Идентификаторы и академические данные',
            fields: filterExternalFields([
                createExternalField('ID в системе', info.Id),
                createExternalField('Зачетная книжка', info.GradeBook),
                createExternalField('Учебная группа', resolveStudentGroupLabel(studentGroup))
            ])
        }
    ].filter(section => section.fields.length);
});

const umuStatusLabel = computed(() => {
    if (!isUmuAccount.value) return '-';

    const info = parsedExternalInformation.value || {};
    if (info.StatusText) return info.StatusText;
    if (info.Status !== null && info.Status !== undefined && info.Status !== '') {
        return `Код ${info.Status}`;
    }

    return '-';
});

const oneCzkguSummarySections = computed(() => {
    if (!isOneCzkguAccount.value || !parsedExternalInformation.value) return [];

    const info = parsedExternalInformation.value;

    return [
        {
            title: 'Основное',
            subtitle: 'Персональная информация',
            fields: filterExternalFields([
                createExternalField('ФИО', [info.Surname, info.FirstName, info.Patronymic].filter(Boolean).join(' ')),
                createExternalField('Дата рождения', formatExternalDateValue(info.BirthDate)),
                createExternalField('Пол', info.Gender),
                createExternalField('ИНН', info.Inn),
                createExternalField('СНИЛС', info.Snils)
            ])
        },
        {
            title: 'Контакты',
            subtitle: 'Контактные данные сотрудника',
            fields: filterExternalFields([
                createExternalField('E-mail', info.PersonalData?.Email || info.Email),
                createExternalField('Мобильный телефон', info.PersonalData?.MobilePhone),
                createExternalField('Домашний телефон', info.PersonalData?.HomePhone)
            ])
        },
        {
            title: 'Персональные данные',
            subtitle: 'Адреса и документы',
            fields: filterExternalFields([
                createExternalField('Адрес регистрации', info.PersonalData?.RegisteredAddress),
                createExternalField('Адрес проживания', info.PersonalData?.ResidentialAddress),
                createExternalField('Документ', info.PersonalData?.IdentityDocument)
            ])
        }
    ].filter(section => section.fields.length);
});

const oneCzkguJobPositions = computed(() => {
    if (!isOneCzkguAccount.value) return [];

    const positions = parsedExternalInformation.value?.JobPosition;
    if (!Array.isArray(positions)) return [];

    return positions.map((job, index) => ({
        id: job.Id || `job-${index}`,
        title: formatExternalInfoValue(job.Name),
        division: formatExternalInfoValue(job.Division?.Name),
        workFunction: formatExternalInfoValue(job.WorkFunction?.Name),
        fields: filterExternalFields([
            createExternalField('Тариф', job.Tariff),
            createExternalField('Тарифная сетка', job.TariffSchedule),
            createExternalField('Табельный номер', job.ServiceNumber),
            createExternalField('Дата приема', formatExternalDateValue(job.DataAdmission)),
            createExternalField('Дата увольнения', formatExternalDateValue(job.DateDismissal)),
            createExternalField('Номер договора', job.CurrentPlaceOfWork?.ContrantNumber),
            createExternalField('Дата договора', formatExternalDateValue(job.CurrentPlaceOfWork?.ContrantDate))
        ])
    }));
});

const normalizeAcademicItems = (items) => {
    if (!Array.isArray(items)) return [];

    return items
        .map((item) => {
            if (typeof item === 'string') return item;
            if (item?.Name) return item.Name;
            if (item?.title) return item.title;
            return '';
        })
        .filter(Boolean);
};

const oneCzkguAcademicDegrees = computed(() => normalizeAcademicItems(parsedExternalInformation.value?.AcademicDegrees));
const oneCzkguAcademicRanks = computed(() => normalizeAcademicItems(parsedExternalInformation.value?.AcademicRanks));

const getSystemTypeLabel = (systemType) => {
    const matchedSystemType = systemTypeOptions.value.find((option) => Number(option.value) === Number(systemType));
    if (matchedSystemType?.label) return matchedSystemType.label;

    const map = {
        0: 'InfraManager',
        1: '1СЗКГУ',
        3: 'UMU'
    };
    return map[Number(systemType)] || `Система ${systemType}`;
};

const normalizeSystemTypeOptions = (payload) => {
    if (!Array.isArray(payload)) return [];

    return payload
        .map((item) => {
            if (typeof item === 'number' || typeof item === 'string') {
                const numericValue = Number(item);
                return {
                    label: getSystemTypeLabel(numericValue),
                    value: numericValue,
                };
            }

            const value = item?.value ?? item?.id ?? item?.systemType ?? item?.type;
            if (value === undefined || value === null || value === '') return null;

            return {
                label: item?.label || item?.title || item?.name || `Система ${value}`,
                value: Number(value),
            };
        })
        .filter(Boolean);
};

const loadSystemTypeOptions = async () => {
    try {
        systemTypeOptionsLoading.value = true;
        const response = await axiosInstance.get('/api/users/get-system-types');
        systemTypeOptions.value = normalizeSystemTypeOptions(response.data);
    } catch (error) {
        console.debug('Ошибка при получении типов систем: ', error);
        systemTypeOptions.value = [];
        window.dispatchEvent(new CustomEvent('toast', {
            detail: {
                severity: 'error',
                summary: 'Внешние системы',
                detail: 'Не удалось загрузить список систем'
            }
        }));
    } finally {
        systemTypeOptionsLoading.value = false;
    }
};

const getInfraExternalAccount = (accounts = []) => {
    return accounts.find(account => Number(account.systemType) === INFRA_MANAGER_SYSTEM_TYPE) || null;
};

const openExternalAccount = (account) => {
    selectedExternalAccount.value = account;
    activeProfile.value = 'external';
};

const fetchCurrentUserRole = async () => {
    try {
        const response = await axiosInstance.get('/api/users/me/info');
        currentUserRoleIds.value = (response.data?.roles || []).map(role => role.id).filter(Boolean);
    } catch (error) {
        console.debug('Ошибка при получении роли текущего пользователя: ', error);
    }
};

const fetchExternalAccounts = async () => {
    if (!userId.value) return;

    try {
        externalAccountsLoading.value = true;
        const endpoint = isAdmin.value && !isCurrentUser.value
            ? `/api/users/other-accounts/${userId.value}`
            : '/api/users/other-accounts/getall';

        const response = await axiosInstance.get(endpoint);
        externalAccounts.value = response.data?.accounts || [];
        statusInfra = getInfraExternalAccount(externalAccounts.value);
        status.value = !!statusInfra;

        if (!externalAccounts.value.length) {
            selectedExternalAccount.value = null;
            return;
        }

        const selectedId = selectedExternalAccount.value?.id;
        selectedExternalAccount.value = externalAccounts.value.find(a => a.id === selectedId) || externalAccounts.value[0];
    } catch (error) {
        console.debug('Ошибка при получении внешних аккаунтов: ', error);
        externalAccounts.value = [];
        selectedExternalAccount.value = null;
        statusInfra = null;
        status.value = false;
    } finally {
        externalAccountsLoading.value = false;
    }
};

const resetExternalForm = () => {
    externalForm.value = {
        userIdInOtherSystem: '',
        systemType: null,
        information: ''
    };
    addInformationMode.value = 'fields';
    addExternalFields.value = [{ key: '', value: '' }];
};

const openAddExternalDialog = async () => {
    if (!systemTypeOptions.value.length) {
        await loadSystemTypeOptions();
    }
    showAddExternalDialog.value = true;
};

const removeAddExternalField = (index) => {
    if (addExternalFields.value.length === 1) return;
    addExternalFields.value.splice(index, 1);
};

const buildInformationFromFields = () => {
    const result = {};
    addExternalFields.value.forEach((field) => {
        const key = (field.key || '').trim();
        if (!key) return;
        result[key] = field.value ?? '';
    });
    return result;
};

const mapInfoObjectToFields = (infoObject) => {
    const entries = Object.entries(infoObject).map(([key, value]) => ({
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')
    }));
    addExternalFields.value = entries.length ? entries : [{ key: '', value: '' }];
};

watch(addInformationMode, (newMode, oldMode) => {
    if (!showAddExternalDialog.value || addInformationModeSync.value) return;

    if (newMode === 'raw' && oldMode === 'fields') {
        externalForm.value.information = JSON.stringify(buildInformationFromFields(), null, 2);
        return;
    }

    if (newMode === 'fields' && oldMode === 'raw') {
        if (!externalForm.value.information?.trim()) {
            addExternalFields.value = [{ key: '', value: '' }];
            return;
        }

        const parsed = parseInformation(externalForm.value.information);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            addInformationModeSync.value = true;
            addInformationMode.value = 'raw';
            addInformationModeSync.value = false;
            window.dispatchEvent(new CustomEvent('toast', {
                detail: {
                    severity: 'error',
                    summary: 'Внешние системы',
                    detail: 'Для режима "Ключ-значение" нужен JSON-объект'
                }
            }));
            return;
        }

        mapInfoObjectToFields(parsed);
    }
});

const buildAddInformationPayload = () => {
    if (addInformationMode.value === 'raw') {
        if (!externalForm.value.information?.trim()) return '';
        try {
            JSON.parse(externalForm.value.information);
            return externalForm.value.information;
        } catch {
            throw new Error('INVALID_JSON');
        }
    }

    return JSON.stringify(buildInformationFromFields(), null, 2);
};

const addExternalAccount = async () => {
    if (!userId.value) return;

    try {
        externalActionLoading.value = true;
        const informationPayload = buildAddInformationPayload();
        await axiosInstance.post('/api/users/other-accounts/add-user-account-in-other-system', {
            userId: userId.value,
            userIdInOtherSystem: externalForm.value.userIdInOtherSystem,
            systemType: externalForm.value.systemType,
            information: informationPayload
        });

        window.dispatchEvent(new CustomEvent('toast', {
            detail: {
                severity: 'success',
                summary: 'Внешние системы',
                detail: 'Внешний аккаунт успешно добавлен'
            }
        }));

        showAddExternalDialog.value = false;
        resetExternalForm();
        await fetchExternalAccounts();
    } catch (error) {
        if (error?.message === 'INVALID_JSON') {
            window.dispatchEvent(new CustomEvent('toast', {
                detail: {
                    severity: 'error',
                    summary: 'Внешние системы',
                    detail: 'JSON в Information невалиден'
                }
            }));
            return;
        }
        console.debug('Ошибка при добавлении внешнего аккаунта: ', error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: {
                severity: 'error',
                summary: 'Внешние системы',
                detail: 'Не удалось добавить внешний аккаунт'
            }
        }));
    } finally {
        externalActionLoading.value = false;
    }
};

const openEditExternalDialog = () => {
    editExternalInformation.value = selectedExternalAccount.value?.information || '';
    const parsed = parseInformation(editExternalInformation.value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        isExternalInfoStructured.value = true;
        editableExternalFields.value = Object.entries(parsed).map(([key, value]) => ({
            key,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value),
            originalType: Array.isArray(value) ? 'array' : typeof value
        }));
    } else {
        isExternalInfoStructured.value = false;
        editableExternalFields.value = [];
    }
    showEditExternalDialog.value = true;
};

const castFieldValueByType = (value, type) => {
    if (type === 'boolean') {
        return value === 'true';
    }
    if (type === 'number') {
        const numberValue = Number(value);
        return Number.isNaN(numberValue) ? value : numberValue;
    }
    if (type === 'object' || type === 'array') {
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }
    return value;
};

const buildExternalInformationPayload = () => {
    if (!isExternalInfoStructured.value) {
        return editExternalInformation.value;
    }

    const normalized = {};
    editableExternalFields.value.forEach((field) => {
        const key = (field.key || '').trim();
        if (!key) return;
        normalized[key] = castFieldValueByType(field.value, field.originalType);
    });

    return JSON.stringify(normalized, null, 2);
};

const updateExternalAccountInformation = async () => {
    if (!selectedExternalAccount.value?.id) return;

    try {
        externalActionLoading.value = true;
        const informationPayload = buildExternalInformationPayload();
        try {
            await axiosInstance.patch(`/api/users/other-accounts/${selectedExternalAccount.value.id}`, null, {
                params: { information: informationPayload }
            });
        } catch (error) {
            if (error?.response?.status === 405 || error?.response?.status === 404) {
                await axiosInstance.put(`/api/users/other-accounts/${selectedExternalAccount.value.id}`, null, {
                    params: { information: informationPayload }
                });
            } else {
                throw error;
            }
        }

        window.dispatchEvent(new CustomEvent('toast', {
            detail: {
                severity: 'success',
                summary: 'Внешние системы',
                detail: 'Information успешно обновлен'
            }
        }));

        showEditExternalDialog.value = false;
        await fetchExternalAccounts();
    } catch (error) {
        console.debug('Ошибка при обновлении внешнего аккаунта: ', error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: {
                severity: 'error',
                summary: 'Внешние системы',
                detail: 'Не удалось обновить information'
            }
        }));
    } finally {
        externalActionLoading.value = false;
    }
};

const deleteExternalAccount = async () => {
    if (!selectedExternalAccount.value?.id) return;

    try {
        externalActionLoading.value = true;
        await axiosInstance.delete(`/api/users/other-accounts/delete-by-id/${selectedExternalAccount.value.id}`);

        window.dispatchEvent(new CustomEvent('toast', {
            detail: {
                severity: 'success',
                summary: 'Внешние системы',
                detail: 'Внешний аккаунт удален'
            }
        }));

        showDeleteExternalDialog.value = false;
        await fetchExternalAccounts();
    } catch (error) {
        console.debug('Ошибка при удалении внешнего аккаунта: ', error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: {
                severity: 'error',
                summary: 'Внешние системы',
                detail: 'Не удалось удалить внешний аккаунт'
            }
        }));
    } finally {
        externalActionLoading.value = false;
    }
};

const fetchUserProfile = async (id) => {
    try {
        let response;
        if (isCurrentUser.value) {
            response = await axiosInstance.get(`/api/users/me/info`);
        } else {
            response = await axiosInstance.get(`/api/users/${id}`);
        }

        firstName.value = response.data.firstName;
        lastName.value = response.data.lastName;
        middleName.value = response.data.middleName;
        email.value = response.data.email;
        userRoles.value = response.data.roles || [];
        isBlocked.value = response.data.isBlocked;

        fullName.value = `${firstName.value} ${lastName.value}`.trim();
        statusInfra = null;
        status.value = false;
    } catch (error) {
        console.debug('Ошибка при получении информации о пользователе: ', error);
    }

    loading.value = false;
};

watch(() => route.query.id, async (newId) => {
    userId.value = newId;
    await fetchUserProfile(userId.value);
    await fetchExternalAccounts();
});

const changeEmail = async () => {
    try {
        await axiosInstance.patch('/api/users/me/email', newEmail.value.toString());
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'success', 
                summary: 'Мой профиль', 
                detail: `Email успешно изменен`,
            }
        }));
        fetchUserProfile(userId.value);
    } catch (error) {
        console.debug('Ошибка при обновлении email: ', error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'error', 
                summary: 'Мой профиль', 
                detail: `Ошибка при обновлении Email`,
            }
        }));
    }
}
const changeMePass = async () => {
    try {
        await axiosInstance.patch('/api/users/me/password', {
            newPassword: newPass.value.toString(),
            oldPassword: oldPass.value.toString()        
        });
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'success', 
                summary: 'Мой профиль', 
                detail: `Пароль успешно изменен`,
            }
        }));
        fetchUserProfile(userId.value);
    } catch (error) {
        console.debug('Ошибка при обновлении pass: ', error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'error', 
                summary: 'Мой профиль', 
                detail: `Ошибка при обновлении пароля`,
            }
        }));
    }
}


onMounted(async () => {
    await fetchCurrentUserRole();
    await loadSystemTypeOptions();
    if (!userId.value) return;
    await fetchUserProfile(userId.value);
    await fetchExternalAccounts();
});

</script>

<style scoped>
main {
    position: relative;
    display: flex;
    height: 100%;
    padding: 10px;
}
.menu-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    height: 45px;
    background-color: transparent;
    border-radius: 12px;
    transition: all 0.5s;
    text-decoration: none;
    color: var(--p-text-color);
    border: 2px solid transparent;
    padding: 10px 1rem;
}
.menu-item:hover {
    background-color: var(--p-blue-500-low-op);
    color: rgb(var(--p-color-icon-menu));
    border: 2px solid transparent;
}
.active-link {
    color: rgb(var(--p-color-icon-menu));
    background-color: var(--p-blue-500-low-op);
}
.disabled {
    pointer-events: none;
    color: var(--p-grey-2);
}
.sidebar {
    position: fixed;
    width: 210px;
    background: linear-gradient(
        180deg,
        rgba(var(--p-blue-500-rgb), 0.04),
        rgba(255, 255, 255, 0)
    );
    border: 2px solid rgba(var(--p-blue-500-rgb), 0.14);
    border-radius: 12px;
    padding: 15px;
    height: calc(100vh - 20px);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    transition: all 0.5s;
}
.button-group {
    flex-grow: 1;
}
.external-systems-title {
    font-size: 0.9rem;
    color: var(--p-grey-2);
    margin-bottom: 0.5rem;
}
.external-systems-list {
    margin-bottom: 1rem;
}
.external-empty {
    color: var(--p-grey-2);
    font-size: 0.9rem;
    margin: 0.25rem 0 0.5rem 0;
}
.p-chip {
    background: transparent;
}
.block-button {
    margin-top: auto;
}
.avatar-wrapper {
    position: relative;
    border-radius: 50%;
    justify-content: center;
    align-items: center;
    display: flex;
    transition: all 0.5s;
}
.avatar-wrapper-dragover {
    box-shadow: 0 0 0 6px rgba(var(--p-blue-500-rgb), 0.16);
}
.avatar-overlay {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    height: 100%;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.5);
    opacity: 0;
    transition: opacity 0.5s;
}
.avatar-wrapper:hover .avatar-overlay {
    opacity: 1;
    cursor: pointer;
}
.avatar-wrapper-dragover .avatar-overlay {
    opacity: 1;
}
.avatar-overlay-copy {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    color: white;
    text-align: center;
}
.avatar-overlay-copy small {
    max-width: 7rem;
    line-height: 1.35;
}
.upload-button {
    color: white;
    border: none;
    background: transparent;
    margin: 0;
    font-size: 1.5rem;
}
.content-wrap {
    flex: 1;
    width: 100%;
    margin-left: 210px;
    padding-inline: 10px;
    overflow-y: auto;
    color: var(--p-text-color);
}
.profile-card {
    border-width: 2px;
    border-style: solid;
    border-color: rgba(var(--p-blue-500-rgb), 0.14);
    background: linear-gradient(
        180deg,
        rgba(var(--p-blue-500-rgb), 0.04),
        rgba(255, 255, 255, 0)
    );
    border-radius: 12px;
    transition: all 0.5s;
    width: 100%;
    padding: 20px;
}
.profile-card-user {
    position: relative;
    overflow: hidden;
    padding: 16px;
    border-color: rgba(var(--p-blue-500-rgb), 0.14);
    background: linear-gradient(
        180deg,
        rgba(var(--p-blue-500-rgb), 0.04),
        rgba(255, 255, 255, 0)
    );
    box-shadow:
        0 8px 18px rgba(0, 0, 0, 0.06),
        inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.profile-card-user::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(
        circle at 20% 10%,
        rgba(var(--p-blue-500-rgb), 0.06),
        transparent 60%
    );
    pointer-events: none;
}
.profile-card-user-secondary {
    border-color: rgba(var(--p-blue-500-rgb), 0.14);
    background: linear-gradient(
        180deg,
        rgba(var(--p-blue-500-rgb), 0.04),
        rgba(255, 255, 255, 0)
    );
}
.profile-card-user .avatar-wrapper {
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
    padding: 3px;
    background: linear-gradient(
        135deg,
        rgba(var(--p-blue-500-rgb), 0.35),
        rgba(255, 255, 255, 0)
    );
}
.profile-card-user .profile-email {
    color: var(--p-grey-1);
    font-size: 15px;
}
.profile-card-user-secondary .profile-info-body {
    gap: 24px;
}
.profile-info-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}
.profile-info-subtitle {
    margin: 0;
    color: var(--p-grey-2);
    font-size: 0.9rem;
}
.profile-info-icon {
    font-size: 1.5rem;
    color: rgba(var(--p-blue-500-rgb), 0.6);
}
.info-card {
    padding: 14px 16px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
    transition: all 0.3s ease;
}
.info-card:hover {
    border-color: rgba(var(--p-blue-500-rgb), 0.3);
}
.profile-card-user-secondary .field {
    text-transform: uppercase;
    letter-spacing: 0.4px;
    font-size: 0.85rem;
}
.profile-card-user-secondary .value {
    font-size: 1.1rem;
}
.role-label {
    background: rgba(var(--p-blue-500-rgb), 0.1);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.25);
    padding: 4px 8px;
    border-radius: 999px;
    gap: 8px;
}
.profile-info-body {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
    padding: 0px;
    overflow: hidden;
}
.header-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px 10px 0 0;
}
h2 {
    margin-bottom: 5px;
    font-size: 24px;
    font-weight: bold;
}
p {
    margin-bottom: 10px;
}
.profile-email {
    color: var(--p-grey-2);
    font-size: 16px;
    margin: 0;
}
.profile-role {
    margin-top: 8px;
}
.pi {
    font-size: 1.5rem;
}
.field {
    color: var(--p-grey-2);
    font-size: 1rem;
}
.value {
    color: var(--p-text-color);
    font-weight: bold;
    font-size: 1.15rem;
}
.password-requirements p {
    display: flex;
    align-items: center;
    margin: 0.25rem 0;
    .pi {
        font-size: 1rem;
    }
}
.roleType {
    background-color: var(--p-blue-500);
    border-radius: 50%;
    font-size: 20px;
    color: white;
    width: 30px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
}
.custom-role-type {
    background-color: var(--p-purple-500);
}
.external-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}
.external-form-grid .full-width {
    grid-column: 1 / -1;
}
.external-empty-page {
    color: var(--p-grey-2);
    padding: 2rem 1rem;
    text-align: center;
    border: 1px dashed rgba(var(--p-blue-500-rgb), 0.22);
    border-radius: 18px;
    background: rgba(var(--p-blue-500-rgb), 0.03);
}
.external-profile-card {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}
.external-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
}
.external-eyebrow {
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(var(--p-blue-500-rgb), 0.85);
    margin-bottom: 0.4rem;
    font-weight: 700;
}
.external-subtitle {
    margin: 0.45rem 0 0;
    color: var(--p-grey-2);
    font-size: 0.95rem;
}
.external-info {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
.external-meta-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.85rem;
}
.external-meta-card {
    padding: 1rem 1.1rem;
    border-radius: 16px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.16);
    background: linear-gradient(180deg, rgba(var(--p-blue-500-rgb), 0.07), rgba(255, 255, 255, 0.02));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
.external-meta-label {
    color: var(--p-grey-2);
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 0.45rem;
}
.external-meta-value {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--p-text-color);
}
.external-data-section {
    border-radius: 20px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.16);
    background: linear-gradient(180deg, rgba(var(--p-blue-500-rgb), 0.05), rgba(255, 255, 255, 0.02));
    overflow: hidden;
}
.external-kv-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.85rem;
    padding: 1rem 1.1rem 1.1rem;
}
.external-kv-grid-compact {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 0;
}
.external-kv-card {
    min-height: 88px;
    padding: 0.95rem 1rem;
    border-radius: 16px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
    background: rgba(255, 255, 255, 0.04);
}
.external-kv-label {
    color: var(--p-grey-2);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 0.45rem;
}
.external-kv-value {
    color: var(--p-text-color);
    font-size: 1rem;
    font-weight: 600;
    word-break: break-word;
}
.external-boolean {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-weight: 700;
}
.external-boolean .pi {
    font-size: 1rem;
}
.external-boolean.is-true {
    color: var(--p-green-500);
}
.external-boolean.is-false {
    color: var(--p-red-500);
}
.external-section-header {
    padding: 1rem 1.2rem 0.9rem;
    border-bottom: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
}
.external-section-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--p-text-color);
}
.external-section-subtitle {
    color: var(--p-grey-2);
    font-size: 0.9rem;
    margin-top: 0.2rem;
}
.external-tree {
    display: flex;
    flex-direction: column;
    padding: 0.35rem 0;
}
.external-job-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem 1.1rem 1.1rem;
}
.external-job-card {
    border-radius: 18px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.14);
    background: rgba(var(--p-blue-500-rgb), 0.04);
    padding: 1rem;
}
.external-job-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.9rem;
}
.external-job-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--p-text-color);
}
.external-job-subtitle {
    margin-top: 0.2rem;
    color: var(--p-grey-2);
    font-size: 0.92rem;
}
.external-badge-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    padding: 1rem 1.1rem 1.1rem;
}
.external-badge-row-single {
    grid-template-columns: 1fr;
}
.external-badge-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    padding: 0.95rem 1rem;
    border-radius: 16px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
    background: rgba(255, 255, 255, 0.04);
}
.external-badge-label {
    width: 100%;
    color: var(--p-grey-2);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}
.external-empty-inline {
    color: var(--p-grey-2);
    font-size: 0.95rem;
}
.external-tree-row {
    display: grid;
    grid-template-columns: minmax(260px, 340px) 1fr;
    align-items: stretch;
    border-bottom: 1px solid rgba(var(--p-blue-500-rgb), 0.08);
}
.external-tree-row:last-child {
    border-bottom: none;
}
.external-tree-row-group {
    background: rgba(var(--p-blue-500-rgb), 0.045);
}
.external-tree-key {
    position: relative;
    padding: 0.9rem 1rem;
    font-weight: 600;
    word-break: break-word;
}
.external-tree-branch {
    position: absolute;
    top: 0.8rem;
    bottom: 0.8rem;
    width: 2px;
    border-radius: 999px;
    background: rgba(var(--p-blue-500-rgb), 0.22);
}
.external-tree-value {
    padding: 0.9rem 1rem;
    word-break: break-word;
    color: var(--p-text-color);
}
.external-tree-value-group {
    font-weight: 600;
    color: var(--p-grey-2);
}
.external-raw {
    background: rgba(var(--p-blue-500-rgb), 0.04);
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.14);
    border-radius: 18px;
    padding: 1rem 1.1rem;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
}
.external-edit-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 420px;
    overflow-y: auto;
    padding-right: 4px;
}
.external-edit-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    align-items: center;
}
.external-add-row {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 0.5rem;
    align-items: center;
}
.external-edit-label {
    font-weight: 600;
    color: var(--p-text-color);
    word-break: break-word;
}

@media (max-width: 960px) {
    .external-header {
        flex-direction: column;
    }

    .external-meta-grid {
        grid-template-columns: 1fr;
    }

    .external-kv-grid {
        grid-template-columns: 1fr;
    }

    .external-kv-grid-compact {
        grid-template-columns: 1fr;
    }

    .external-badge-row {
        grid-template-columns: 1fr;
    }

    .external-job-card-header {
        flex-direction: column;
    }

    .external-tree-row {
        grid-template-columns: 1fr;
    }

    .external-tree-key {
        padding-bottom: 0.35rem;
    }

    .external-tree-value {
        padding-top: 0;
        padding-left: 1rem;
        padding-bottom: 0.9rem;
    }
}
</style>
