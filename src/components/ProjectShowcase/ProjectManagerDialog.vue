<template>
    <Dialog
        :visible="visible"
        modal
        header="Менеджер проекта"
        :style="{ width: '44rem', maxWidth: '95vw' }"
        @update:visible="emit('update:visible', $event)"
    >
        <div class="project-dialog-grid">
            <div class="project-field project-field-wide">
                <label for="manager-mode">Способ выбора менеджера</label>
                <SelectButton id="manager-mode" v-model="mode" :options="modeOptions" optionLabel="label" optionValue="value" />
            </div>

            <div class="project-field project-field-wide">
                <label for="manager-division">Подразделение</label>
                <InputText id="manager-division" v-model.trim="division" class="w-100" placeholder="Например, кафедра или отдел" />
            </div>

            <template v-if="mode === 'lks'">
                <div class="project-field project-field-wide">
                    <label for="manager-lks-id">Пользователь ЛКС</label>
                    <AutoComplete
                        id="manager-lks-id"
                        v-model="selectedLksUser"
                        :suggestions="lksSuggestions"
                        optionLabel="fullName"
                        class="w-100"
                        dropdown
                        dropdownMode="blank"
                        showClear
                        forceSelection
                        placeholder="Выберите пользователя ЛКС"
                        :loading="lksLoading"
                        @complete="searchLksUsers"
                        @item-select="handleLksUserSelect"
                        @clear="clearLksSelection"
                    />
                    <small class="project-field-hint">Если пользователя ещё нет в проектной витрине, он будет добавлен автоматически.</small>
                </div>
            </template>

            <template v-else-if="mode === 'system'">
                <div class="project-field project-field-wide">
                    <label for="manager-search">Пользователь новой системы</label>
                    <AutoComplete
                        id="manager-search"
                        v-model="selectedUser"
                        :suggestions="userSuggestions"
                        optionLabel="label"
                        class="w-100"
                        forceSelection
                        dropdown
                        placeholder="Начните вводить ФИО"
                        :loading="searchLoading"
                        @complete="searchUsers"
                    />
                </div>
            </template>

            <template v-else>
                <div class="project-field">
                    <label for="manager-last-name">Фамилия</label>
                    <InputText id="manager-last-name" v-model.trim="manualUser.lastName" class="w-100" />
                </div>
                <div class="project-field">
                    <label for="manager-first-name">Имя</label>
                    <InputText id="manager-first-name" v-model.trim="manualUser.firstName" class="w-100" />
                </div>
                <div class="project-field">
                    <label for="manager-middle-name">Отчество</label>
                    <InputText id="manager-middle-name" v-model.trim="manualUser.middleName" class="w-100" />
                </div>
                <div class="project-field">
                    <label for="manager-email">E-mail</label>
                    <InputText id="manager-email" v-model.trim="manualUser.email" class="w-100" />
                </div>
                <div class="project-field">
                    <label for="manager-phone">Телефон</label>
                    <InputText id="manager-phone" v-model.trim="manualUser.phone" class="w-100" />
                </div>
            </template>
        </div>

        <template #footer>
            <Button label="Отмена" severity="secondary" text @click="emit('update:visible', false)" :disabled="saving" />
            <Button label="Сохранить" icon="pi pi-check" :loading="saving" @click="submit" />
        </template>
    </Dialog>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { debounce } from 'lodash';
import { useToast } from 'primevue/usetoast';
import {
    PROJECT_SHOWCASE_LKS_SEARCH_MIN_LENGTH,
    addLksUserToProjectShowcaseSystem,
    addProjectManager,
    addProjectShowcaseUser,
    getProjectShowcaseUserByLksId,
    searchProjectShowcaseLksUsers,
    searchProjectShowcaseUsers,
} from '@/api/projectShowcase.js';
import {
    buildProjectShowcaseErrorMessage,
    buildProjectShowcaseFullName,
} from '@/utils/projectShowcase.js';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false,
    },
    projectId: {
        type: Number,
        default: null,
    },
});

const emit = defineEmits(['update:visible', 'saved']);

const toast = useToast();

const modeOptions = [
    { label: 'Из ЛКС', value: 'lks' },
    { label: 'Из новой системы', value: 'system' },
    { label: 'Новый пользователь', value: 'new' },
];

const mode = ref('lks');
const division = ref('');
const lksId = ref('');
const selectedLksUser = ref(null);
const lksSuggestions = ref([]);
const lksLoading = ref(false);
const selectedUser = ref(null);
const userSuggestions = ref([]);
const searchLoading = ref(false);
const saving = ref(false);

const manualUser = reactive({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    userLksId: '',
});

const reset = () => {
    mode.value = 'lks';
    division.value = '';
    lksId.value = '';
    selectedLksUser.value = null;
    lksSuggestions.value = [];
    selectedUser.value = null;
    userSuggestions.value = [];
    Object.assign(manualUser, {
        firstName: '',
        lastName: '',
        middleName: '',
        email: '',
        phone: '',
        userLksId: '',
    });
};

const doSearchUsers = debounce(async (query) => {
    if (!query || query.length < 2) {
        userSuggestions.value = [];
        return;
    }

    searchLoading.value = true;

    try {
        const response = await searchProjectShowcaseUsers(query);
        userSuggestions.value = (Array.isArray(response.data) ? response.data : []).map((user) => ({
            ...user,
            label: buildProjectShowcaseFullName(user),
        }));
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Поиск недоступен',
            detail: buildProjectShowcaseErrorMessage(error, 'Не удалось найти пользователя.'),
            life: 3000,
        });
    } finally {
        searchLoading.value = false;
    }
}, 350);

const buildLksUserLabel = (user) => [user?.firstName, user?.middleName, user?.lastName].filter(Boolean).join(' ');

const doSearchLksUsers = debounce(async (query) => {
    const normalizedQuery = query?.trim() || '';
    const maxPartLength = Math.max(
        0,
        ...normalizedQuery.split(/\s+/).filter(Boolean).map((part) => part.length),
    );

    if (!normalizedQuery || maxPartLength < PROJECT_SHOWCASE_LKS_SEARCH_MIN_LENGTH) {
        lksSuggestions.value = [];
        return;
    }

    lksLoading.value = true;

    try {
        const response = await searchProjectShowcaseLksUsers(normalizedQuery);
        lksSuggestions.value = (Array.isArray(response.data) ? response.data : response.data?.entities || [])
            .map((user) => ({
                ...user,
                fullName: buildLksUserLabel(user),
            }));
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Поиск недоступен',
            detail: buildProjectShowcaseErrorMessage(error, 'Не удалось загрузить пользователей ЛКС.'),
            life: 3000,
        });
        lksSuggestions.value = [];
    } finally {
        lksLoading.value = false;
    }
}, 300);

const searchUsers = (event) => {
    doSearchUsers(event.query);
};

const searchLksUsers = (event) => {
    doSearchLksUsers(event.query);
};

const handleLksUserSelect = (event) => {
    selectedLksUser.value = event.value;
    lksId.value = event.value?.id || '';
};

const clearLksSelection = () => {
    selectedLksUser.value = null;
    lksId.value = '';
};

const resolveManagerUserId = async () => {
    if (mode.value === 'lks') {
        const normalizedLksId = lksId.value.trim();
        if (!normalizedLksId) throw new Error('Укажите Id пользователя ЛКС.');

        try {
            const existingResponse = await getProjectShowcaseUserByLksId(normalizedLksId);
            const existingId = existingResponse.data?.userResponse?.id;
            if (existingId) return existingId;
        } catch (error) {
            if (error?.response?.status !== 404) throw error;
        }

        const createResponse = await addLksUserToProjectShowcaseSystem(normalizedLksId);
        return Number(createResponse.data);
    }

    if (mode.value === 'system') {
        if (!selectedUser.value?.id) throw new Error('Выберите пользователя новой системы.');
        return Number(selectedUser.value.id);
    }

    if (!manualUser.lastName || !manualUser.firstName || !manualUser.email) {
        throw new Error('Заполните как минимум фамилию, имя и e-mail нового пользователя.');
    }

    const createResponse = await addProjectShowcaseUser({ ...manualUser });
    return Number(createResponse.data);
};

const submit = async () => {
    if (!props.projectId) return;
    if (!division.value.trim()) {
        toast.add({
            severity: 'warn',
            summary: 'Не заполнено подразделение',
            detail: 'Укажите подразделение менеджера проекта.',
            life: 3000,
        });
        return;
    }

    saving.value = true;

    try {
        const userId = await resolveManagerUserId();
        await addProjectManager(props.projectId, userId, division.value.trim());

        toast.add({
            severity: 'success',
            summary: 'Менеджер назначен',
            detail: 'Данные менеджера проекта сохранены.',
            life: 2500,
        });

        emit('saved');
        emit('update:visible', false);
        reset();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Не удалось назначить менеджера',
            detail: error instanceof Error
                ? error.message
                : buildProjectShowcaseErrorMessage(error, 'Повторите попытку немного позже.'),
            life: 3500,
        });
    } finally {
        saving.value = false;
    }
};

watch(
    () => props.visible,
    (visible) => {
        if (!visible) reset();
    }
);
</script>

<style scoped>
.project-dialog-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
}

.project-field {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
}

.project-field-wide {
    grid-column: 1 / -1;
}

.project-field label {
    font-weight: 600;
}

.project-field-hint {
    color: var(--p-grey-1);
}

@media (max-width: 768px) {
    .project-dialog-grid {
        grid-template-columns: 1fr;
    }
}
</style>
