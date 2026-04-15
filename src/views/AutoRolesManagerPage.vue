<template>
    <div class="auto-roles-manager">

        <div class="table-container">
            <Transition name="content-fade" mode="out-in">
            <DataTable
                key="autoroles-content"
                v-if="!loading"
                :value="autoRoles" 
                :paginator="true" 
                :rows="10"
                :rowsPerPageOptions="[5, 10, 15]"
                paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                currentPageReportTemplate="{first} - {last} из {totalRecords}"
                stripedRows
                class="auto-roles-table no-row-hover"
                :class="{ 'empty-table': autoRoles.length === 0 }"
            >
                <template #header>
                    <div class="header">
                        <div class="header-content">
                            <div class="title-section">
                                <h1 class="m-0">Авто-роли</h1>
                            </div>
                            <div class="page-controls d-flex gap-2">
                                <Button
                                    icon="pi pi-sliders-h"
                                    outlined
                                    severity="secondary"
                                    @click="toggleSettingsPanel"
                                />
                                <OverlayPanel ref="settingsPanel">
                                    <div class="auto-roles-settings-panel">
                                        <Button
                                            label="Синхронизировать преподавателей"
                                            icon="pi pi-sync"
                                            :loading="syncLoading"
                                            :disabled="syncLoading"
                                            @click="syncLecturers"
                                        />
                                    </div>
                                </OverlayPanel>
                                <Button 
                                    icon="pi pi-plus" 
                                    @click="openCreateDialog"
                                />
                                <Button 
                                    icon="pi pi-sync"
                                    outlined
                                    severity="secondary"
                                    @click="loadAutoRoles"
                                    :loading="loading"
                                    :disabled="loading"
                                />
                            </div>
                        </div>
                    </div>
                </template>
                <Column field="id" header="ID" style="width: 80px">
                    <template #body="{ data }">
                        <span class="id-cell">{{ data.id }}</span>
                    </template>
                </Column>
                
                <Column field="systemType" header="Система" style="width: 200px">
                    <template #body="{ data }">
                        <div class="system-cell">
                            <i class="pi pi-database system-icon"></i>
                            <Tag :value="data.systemType" :severity="getSystemSeverity(data.systemType)" class="system-tag" />
                        </div>
                    </template>
                </Column>

                <Column field="role.title" header="Роль" style="min-width: 250px">
                    <template #body="{ data }">
                        <div class="role-info">
                            <div class="role-header">
                                <i class="pi pi-shield role-icon"></i>
                                <span class="role-title">{{ data.role.title }}</span>
                                <Tag 
                                    v-if="data.role.type === 'System'" 
                                    value="Системная" 
                                    severity="warning" 
                                    class="system-role-badge"
                                />
                            </div>
                            <span class="role-description">{{ data.role.description }}</span>
                        </div>
                    </template>
                </Column>

                <Column field="role.type" header="Тип роли" style="width: 150px">
                    <template #body="{ data }">
                        <Tag :value="data.role.type" :severity="getRoleTypeSeverity(data.role.type)" class="type-tag" />
                    </template>
                </Column>

                <Column field="role.priority" header="Приоритет" style="width: 120px">
                    <template #body="{ data }">
                        <div class="priority-cell">
                            <Tag severity="info">
                                {{ data.role.priority }}
                            </Tag>
                        </div>
                    </template>
                </Column>

                <Column header="Действия" style="width: 100px">
                    <template #body="{ data }">
                        <Button 
                            icon="pi pi-trash" 
                            severity="danger" 
                            text
                            rounded
                            @click="confirmDelete(data)"
                            v-tooltip.bottom="'Удалить'"
                            class="delete-btn"
                            :disabled="data.role.type === 'System'"
                        />
                    </template>
                </Column>

                <template #empty>
                    <div class="empty-state">
                        <div class="empty-content">
                            <i class="pi pi-shield-empty empty-icon"></i>
                            <h3>Авто-роли не настроены</h3>
                            <p>Настройте автоматическое назначение ролей для новых пользователей</p>
                            <Button 
                                label="Добавить первую авто-роль" 
                                icon="pi pi-plus" 
                                @click="openCreateDialog"
                                severity="success"
                                class="empty-action-button"
                            />
                        </div>
                    </div>
                </template>
            </DataTable>
            <Skeleton key="autoroles-skeleton" v-else width="100%" height="100%"/>
            </Transition>
        </div>

        <!-- Диалог создания новой авто-роли -->
        <Dialog 
            v-model:visible="showCreateDialog" 
            header="Добавить авто-роль" 
            :style="{ width: '500px' }"
            :modal="true"
            class="create-dialog"
        >
            <div class="create-form">
                <div class="field">
                    <label for="systemType" class="field-label">
                        <i class="pi pi-database"></i>
                        Система *
                    </label>
                    <Select 
                        id="systemType"
                        v-model="newAutoRole.systemType"
                        :options="systemTypes"
                        placeholder="Выберите систему"
                        class="w-full field-input"
                        :class="{ 'p-invalid': !newAutoRole.systemType && submitted }"
                    />
                </div>

                <div class="field">
                    <label for="role" class="field-label">
                        <i class="pi pi-shield"></i>
                        Роль *
                    </label>
                    <Select 
                        id="role"
                        v-model="newAutoRole.roleId"
                        :options="availableRoles"
                        optionLabel="title"
                        optionValue="id"
                        placeholder="Выберите роль"
                        class="w-full field-input"
                        :class="{ 'p-invalid': !newAutoRole.roleId && submitted }"
                    >
                        <template #option="slotProps">
                            <div class="role-option">
                                <div class="role-option-main">
                                    <span class="role-option-title">{{ slotProps.option.title }}</span>
                                    <span class="role-option-description">{{ slotProps.option.description }}</span>
                                </div>
                                <div class="role-option-meta">
                                    <Tag :value="slotProps.option.type" :severity="getRoleTypeSeverity(slotProps.option.type)" class="role-option-type" />
                                </div>
                            </div>
                        </template>
                    </Select>
                </div>

                <div class="selected-info" v-if="selectedRole">
                    <div class="selected-info-header">
                        <i class="pi pi-info-circle"></i>
                        <span>Информация о выбранной роли</span>
                    </div>
                    <div class="selected-info-content">
                        <div class="info-item">
                            <span class="info-label">Описание:</span>
                            <span class="info-value">{{ selectedRole.description }}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Тип:</span>
                            <Tag :value="selectedRole.type" :severity="getRoleTypeSeverity(selectedRole.type)" />
                        </div>
                        <div class="info-item">
                            <span class="info-label">Приоритет:</span>
                            <span class="info-value priority">{{ selectedRole.priority }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <Button 
                    label="Отмена" 
                    icon="pi pi-times" 
                    @click="closeCreateDialog" 
                    text
                    severity="secondary"
                    class="cancel-btn"
                />
                <Button 
                    label="Создать" 
                    icon="pi pi-check" 
                    @click="createAutoRole" 
                    :loading="creating"
                    severity="success"
                    class="create-btn"
                    :disabled="isSystemRoleSelected"
                />
            </template>
        </Dialog>

        <!-- Диалог подтверждения удаления -->
        <Dialog 
            v-model:visible="showDeleteDialog" 
            header="Подтверждение удаления" 
            :style="{ width: '450px' }"
            :modal="true"
            class="delete-dialog"
        >
            <div class="confirmation-content">
                <div class="confirmation-icon">
                    <i class="pi pi-exclamation-triangle"></i>
                </div>
                <div class="confirmation-text">
                    <h4>Удалить авто-роль?</h4>
                    <p>Вы уверены, что хотите удалить авто-роль для системы <strong>{{ autoRoleToDelete?.systemType }}</strong>?</p>
                    <Tag class="role-details" v-if="autoRoleToDelete">
                        <span class="role-name">{{ autoRoleToDelete.role.title }}</span>
                        <Tag :value="autoRoleToDelete.role.type" :severity="getRoleTypeSeverity(autoRoleToDelete.role.type)" />
                    </Tag>
                    <div v-if="autoRoleToDelete?.role.type === 'System'" class="system-role-warning">
                        <i class="pi pi-exclamation-circle"></i>
                        <span>Эта системная роль будет удалена из авто-назначения</span>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button 
                    label="Отмена" 
                    icon="pi pi-times" 
                    @click="showDeleteDialog = false" 
                    text 
                    severity="secondary"
                />
                <Button 
                    label="Удалить" 
                    icon="pi pi-trash" 
                    @click="deleteAutoRole" 
                    :loading="deleting"
                    severity="danger"
                />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import axiosInstance from '@/utils/axios.js';
import { usePermissionStore } from '@/stores/permissions.js';

const toast = useToast();
const permissionStore = usePermissionStore();

// Reactive data
const autoRoles = ref([]);
const systemTypes = ref([]);
const availableRoles = ref([]);
const loading = ref(false);
const creating = ref(false);
const deleting = ref(false);
const syncLoading = ref(false);
const settingsPanel = ref(null);

// Dialog states
const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const submitted = ref(false);

// Form data
const newAutoRole = ref({
    systemType: null,
    roleId: null
});

const autoRoleToDelete = ref(null);

// Computed properties
const selectedRole = computed(() => {
    if (!newAutoRole.value.roleId) return null;
    return availableRoles.value.find(role => role.id === newAutoRole.value.roleId);
});

const isSystemRoleSelected = computed(() => {
    if (!selectedRole.value) return false;
    return selectedRole.value.type === 'System';
});

// Methods
const loadAutoRoles = async () => {
    loading.value = true;
    try {
        const response = await axiosInstance.get('/api/roleautoassigner');
        autoRoles.value = response.data;
    } catch (error) {
        console.error('Ошибка при загрузке авто-ролей:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось загрузить список авто-ролей',
            life: 5000
        });
    } finally {
        loading.value = false;
    }
};

const loadSystemTypes = async () => {
    try {
        const response = await axiosInstance.get('/api/roleautoassigner/system-types');
        systemTypes.value = response.data;
    } catch (error) {
        console.error('Ошибка при загрузке типов систем:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось загрузить список систем',
            life: 5000
        });
    }
};

const loadAvailableRoles = async () => {
    try {
        const response = await axiosInstance.get('/api/rbac/roles');
        availableRoles.value = response.data.filter(role => role.type !== 'System');
    } catch (error) {
        console.error('Ошибка при загрузке ролей:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось загрузить список ролей',
            life: 5000
        });
    }
};

const openCreateDialog = async () => {
    showCreateDialog.value = true;
    submitted.value = false;
    newAutoRole.value = {
        systemType: null,
        roleId: null
    };
};

const closeCreateDialog = () => {
    showCreateDialog.value = false;
    submitted.value = false;
    newAutoRole.value = {
        systemType: null,
        roleId: null
    };
};

const hasPermission = (type, action) => permissionStore.hasPermission(type, action);

const toggleSettingsPanel = (event) => {
    settingsPanel.value?.toggle(event);
};

const syncLecturers = async () => {
    try {
        syncLoading.value = true;
        await axiosInstance.post('/api/roleautoassigner/sync-lecturers');

        toast.add({
            severity: 'success',
            summary: 'Синхронизация запущена',
            detail: 'Синхронизация преподавателей успешно запущена.',
            life: 3000
        });

        settingsPanel.value?.hide();
    } catch (error) {
        console.error('Ошибка синхронизации преподавателей:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось запустить синхронизацию преподавателей.',
            life: 5000
        });
    } finally {
        syncLoading.value = false;
    }
};

const createAutoRole = async () => {
    if (!hasPermission('RoleAutoAssigner', 'Create')) {
        return
    }
    submitted.value = true;

    if (!newAutoRole.value.systemType || !newAutoRole.value.roleId || isSystemRoleSelected.value) {
        return;
    }

    creating.value = true;
    try {
        await axiosInstance.post('/api/roleautoassigner', {
            roleId: newAutoRole.value.roleId,
            systemType: newAutoRole.value.systemType
        });

        toast.add({
            severity: 'success',
            summary: 'Успешно',
            detail: 'Авто-роль успешно создана',
            life: 3000
        });

        closeCreateDialog();
        await loadAutoRoles();
    } catch (error) {
        console.error('Ошибка при создании авто-роли:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось создать авто-роль',
            life: 5000
        });
    } finally {
        creating.value = false;
    }
};

const confirmDelete = (autoRole) => {
    autoRoleToDelete.value = autoRole;
    showDeleteDialog.value = true;
};

const deleteAutoRole = async () => {
    if (!autoRoleToDelete.value) return;

    deleting.value = true;
    try {
        await axiosInstance.delete('/api/roleautoassigner', {
            data: autoRoleToDelete.value.id
        });

        toast.add({
            severity: 'success',
            summary: 'Успешно',
            detail: 'Авто-роль успешно удалена',
            life: 3000
        });

        showDeleteDialog.value = false;
        autoRoleToDelete.value = null;
        await loadAutoRoles();
    } catch (error) {
        console.error('Ошибка при удалении авто-роли:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: 'Не удалось удалить авто-роль',
            life: 5000
        });
    } finally {
        deleting.value = false;
    }
};

const getSystemSeverity = (systemType) => {
    const severityMap = {
        'UMU': 'info',
        'ONECZKGU': 'success',
        'AD': 'warning',
        'OTHER': 'secondary'
    };
    return severityMap[systemType] || 'secondary';
};

const getRoleTypeSeverity = (roleType) => {
    const severityMap = {
        'System': 'warning',
        'Custom': 'success',
        'Admin': 'danger',
        'User': 'info'
    };
    return severityMap[roleType] || 'secondary';
};

// Lifecycle
onMounted(async () => {
    await Promise.all([
        loadAutoRoles(),
        loadSystemTypes(),
        loadAvailableRoles()
    ]);
});
</script>

<style scoped>
.auto-roles-manager {
    padding: 10px 2rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}

.title-section h1 {
    margin: 0 0 0.5rem 0;
    color: var(--p-text-color);
    font-weight: 700;
    font-size: 1.75rem;
}

.subtitle {
    color: var(--p-grey-1);
    margin: 0;
    font-size: 1.25rem;
}

.add-button {
    min-width: 180px;
}

.table-container {
    flex: 1;
    background: var(--p-bg-color-1);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.auto-roles-settings-panel {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 320px;
}

.auto-roles-table.empty-table {
    min-height: 400px;
}

.id-cell {
    font-size: 1rem;
    color: var(--p-grey-1);
}

.system-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.system-icon {
    color: var(--p-primary-color);
    font-size: 1.1rem;
}

.system-tag {
    min-width: 80px;
    justify-content: center;
}

.role-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.role-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.role-icon {
    color: var(--p-primary-color);
    font-size: 1rem;
}

.role-title {
    font-weight: 600;
    color: var(--p-text-color);
}

.system-role-badge {
    font-size: 0.7rem;
    padding: 0.1rem 0.4rem;
}

.role-description {
    font-size: 0.875rem;
    color: var(--p-text-color-secondary);
    line-height: 1.4;
}

.type-tag {
    min-width: 80px;
    justify-content: center;
}

.delete-btn {
    opacity: 0.7;
    transition: opacity 0.2s;
}

.delete-btn:hover {
    opacity: 1;
}

.delete-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    height: 100%;
}

.empty-content {
    text-align: center;
    max-width: 400px;
}

.empty-icon {
    font-size: 4rem;
    margin-bottom: 1.5rem;
    color: var(--p-surface-400);
}

.empty-content h3 {
    margin: 0 0 0.5rem 0;
    color: var(--p-text-color);
    font-weight: 600;
}

.empty-content p {
    margin: 0 0 1.5rem 0;
    color: var(--p-text-color-secondary);
    line-height: 1.5;
}

.empty-action-button {
    min-width: 200px;
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem;
    color: var(--p-text-color-secondary);
}

/* Create Dialog Styles */
.create-dialog :deep(.p-dialog-header) {
    border-bottom: 1px solid var(--p-surface-200);
    padding: 1.5rem;
}

.create-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1rem 0;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.field-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: var(--p-text-color);
}

.field-label i {
    color: var(--p-primary-color);
}

.field-input {
    width: 100%;
}

.field-error {
    margin-top: 0.25rem;
}

/* Role option styles */
.role-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 0.5rem 0;
}

.role-option-main {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
}

.role-option-title {
    font-weight: 600;
    color: var(--p-text-color);
}

.role-option-description {
    font-size: 0.875rem;
    color: var(--p-text-color-secondary);
}

.role-option-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
}

.role-option-type {
    margin-left: 1rem;
}

.selected-info {
    background: var(--p-grey-7);
    border-radius: 8px;
    padding: 1.25rem;
    margin-top: 0.5rem;
}

.selected-info-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    color: var(--p-blue-500);
    font-weight: 600;
}

.selected-info-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
}

.info-label {
    font-weight: 600;
    color: var(--p-text-color);
    min-width: 80px;
}

.info-value {
    color: var(--p-text-color-secondary);
    text-align: right;
    flex: 1;
}

.info-value.priority {
    font-weight: 600;
    color: var(--p-text-color);
}

/* Delete Dialog Styles */
.confirmation-content {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 0.5rem 0;
}

.confirmation-icon {
    color: var(--p-red-500);
    font-size: 2rem;
    flex-shrink: 0;
}

.confirmation-text h4 {
    margin: 0 0 0.5rem 0;
    color: var(--p-text-color);
}

.confirmation-text p {
    margin: 0 0 1rem 0;
    color: var(--p-text-color-secondary);
    line-height: 1.5;
}

.role-details {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
}

.role-name {
    font-weight: 600;
}

.system-role-warning {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: var(--p-warning-50);
    border: 1px solid var(--p-warning-200);
    border-radius: 4px;
    color: var(--p-warning-700);
    font-size: 0.875rem;
    margin-top: 0.5rem;
}

.system-role-warning i {
    color: var(--p-warning-500);
}

/* Responsive Design */
@media (max-width: 768px) {
    .auto-roles-manager {
        padding: 1rem;
    }
    
    .header-content {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }
    
    .add-button {
        align-self: flex-start;
    }
    
    .confirmation-content {
        flex-direction: column;
        text-align: center;
        align-items: center;
    }
    
    .info-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
    }
    
    .info-value {
        text-align: left;
    }
    
    .role-option {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
    
    .role-option-meta {
        margin-left: 0;
    }
}

:deep(.no-row-hover .p-datatable-tbody > tr:hover),
:deep(.no-row-hover .p-datatable-tbody > tr.p-row-hover),
:deep(.no-row-hover.p-datatable-hoverable-rows .p-datatable-tbody > tr:hover) {
    background: transparent !important;
}
</style>
