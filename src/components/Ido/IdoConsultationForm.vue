<template>
    <div :class="['ido-page', { 'ido-page-public': !canUseAutofill }]">
        <div class="ido-hero">
            <div class="ido-hero-copy">
                <div class="ido-heading-row">
                    <div class="ido-heading-icon">
                        <i class="pi pi-file-edit"></i>
                    </div>
                    <div>
                        <h2 class="m-0">Подать заявку</h2>
                        <p class="text-color-secondary mt-2 mb-0">
                            {{ canUseAutofill
                                ? 'Заполните договор, выберите преподавателя и сразу скачайте готовый документ.'
                                : 'Заполните форму без входа в аккаунт, выберите преподавателя и сразу скачайте готовый документ.' }}
                        </p>
                    </div>
                </div>
            </div>
            <Button
                v-if="canUseAutofill"
                label="Обновить автозаполнение"
                icon="pi pi-refresh"
                outlined
                severity="secondary"
                :loading="profileLoading"
                @click="prefillCurrentUser"
            />
        </div>

        <Message severity="warn" class="ido-important-message">
            <div class="ido-important-message-content">
                <i class="pi pi-megaphone"></i>
                <div>
                    <strong>Уважаемые студенты!</strong>
                    После заполнения договора и оплаты за образовательную услугу, преподавателю необходимо принести распечатанный договор с вашей подписью и чек об оплате.
                </div>
            </div>
        </Message>

        <div class="ido-grid">
            <Card class="ido-card">
                <template #title>Данные заказчика</template>
                <template #content>
                    <div class="ido-form-grid">
                        <div class="ido-field">
                            <label for="ido-surname">Фамилия</label>
                            <InputText id="ido-surname" v-model.trim="form.surname" :invalid="submitted && !form.surname" />
                        </div>
                        <div class="ido-field">
                            <label for="ido-name">Имя</label>
                            <InputText id="ido-name" v-model.trim="form.name" :invalid="submitted && !form.name" />
                        </div>
                        <div class="ido-field">
                            <label for="ido-patronymic">Отчество</label>
                            <InputText id="ido-patronymic" v-model.trim="form.pastronymic" />
                        </div>
                        <div class="ido-field ido-field-wide">
                            <label for="ido-address">Адрес</label>
                            <InputText id="ido-address" v-model.trim="form.address" :invalid="submitted && !form.address" />
                        </div>
                        <div class="ido-field">
                            <label for="ido-phone">Телефон</label>
                            <InputMask
                                id="ido-phone"
                                v-model="form.phone"
                                mask="+7 (999) 999-99-99"
                                placeholder="+7 (___) ___-__-__"
                                :invalid="submitted && !form.phone"
                            />
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="ido-card">
                <template #title>Документ, удостоверяющий личность</template>
                <template #content>
                    <div class="ido-form-grid">
                        <div class="ido-field ido-field-wide">
                            <label for="ido-document-type">Тип документа</label>
                            <Select
                                id="ido-document-type"
                                v-model="form.identityDocumentType"
                                :options="identityDocumentOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Выберите тип документа"
                            />
                        </div>
                        <div v-if="!isKazakhstanPassport" class="ido-field">
                            <label for="ido-passport-series">{{ identitySeriesLabel }}</label>
                            <InputMask
                                id="ido-passport-series"
                                v-model="form.passportSeries"
                                class="w-100"
                                mask="9999"
                                :placeholder="identitySeriesPlaceholder"
                                :invalid="submitted && !form.passportSeries"
                            />
                        </div>
                        <div class="ido-field">
                            <label for="ido-passport-number">{{ identityNumberLabel }}</label>
                            <InputText
                                v-if="isKazakhstanPassport"
                                id="ido-passport-number"
                                v-model="form.passportNumber"
                                class="w-100"
                                :placeholder="identityNumberPlaceholder"
                                :invalid="submitted && !form.passportNumber"
                                @update:modelValue="normalizeIdentityField('passportNumber')"
                            />
                            <InputMask
                                v-else
                                id="ido-passport-number"
                                v-model="form.passportNumber"
                                class="w-100"
                                mask="999999"
                                :placeholder="identityNumberPlaceholder"
                                :invalid="submitted && !form.passportNumber"
                            />
                        </div>
                        <div class="ido-field">
                            <label for="ido-passport-date">Дата выдачи</label>
                            <InputMask
                                id="ido-passport-date"
                                v-model="form.dateIssuePassport"
                                mask="99.99.9999"
                                placeholder="дд.мм.гггг"
                                :invalid="submitted && !form.dateIssuePassport"
                            />
                        </div>
                        <div class="ido-field ido-field-wide">
                            <label for="ido-passport-place">{{ identityIssuerLabel }}</label>
                            <InputText
                                id="ido-passport-place"
                                v-model.trim="form.placeIssuePassport"
                                :invalid="submitted && !form.placeIssuePassport"
                            />
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <Card class="ido-card">
            <template #title>Параметры консультации</template>
            <template #content>
                <div class="ido-form-grid">
                    <div class="ido-field">
                        <label for="ido-hours">Количество часов</label>
                        <InputNumber
                            id="ido-hours"
                            v-model="form.hoursQuantity"
                            :min="1"
                            :max="999"
                            :useGrouping="false"
                            :invalid="submitted && !form.hoursQuantity"
                        />
                    </div>
                    <div class="ido-field ido-field-wide">
                        <label for="ido-topic">Дисциплина</label>
                        <Textarea
                            id="ido-topic"
                            v-model.trim="form.topic"
                            rows="3"
                            autoResize
                            :invalid="submitted && !form.topic"
                        />
                    </div>
                    <div class="ido-field ido-field-wide">
                        <label for="ido-teacher">Преподаватель</label>
                        <AutoComplete
                            id="ido-teacher"
                            v-model="selectedTeacher"
                            :suggestions="teacherSuggestions"
                            optionLabel="fullName"
                            dropdown
                            dropdownMode="blank"
                            placeholder="Начните вводить ФИО преподавателя"
                            :loading="teacherLoading"
                            :invalid="submitted && !form.teacherId"
                            @complete="searchTeacherOptions"
                            @item-select="handleTeacherSelect"
                            @clear="clearTeacherSelection"
                        />
                    </div>
                    <div v-if="divisionOptions.length > 1" class="ido-field ido-field-wide">
                        <label for="ido-division">Кафедра</label>
                        <Select
                            id="ido-division"
                            v-model="form.divisionId"
                            :options="divisionOptions"
                            optionLabel="title"
                            optionValue="id"
                            placeholder="Выберите кафедру"
                            :invalid="submitted && !form.divisionId"
                        />
                    </div>
                    <Message v-else-if="divisionOptions.length === 1" severity="success" class="ido-message">
                        Кафедра определена автоматически: <strong>{{ divisionOptions[0].title }}</strong>
                    </Message>
                </div>
            </template>
        </Card>

        <div class="ido-actions">
            <Button
                label="Сформировать договор"
                icon="pi pi-file-word"
                :loading="submitting"
                @click="submitForm"
            />
        </div>
    </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { debounce } from 'lodash';
import { useToast } from 'primevue/usetoast';
import { createIdoOrder, createPublicIdoOrder, fetchCurrentUserPhones, getTeacherDivisions, searchTeachers } from '@/api/ido.js';
import { isAuthenticated } from '@/utils/auth.js';
import { getCurrentUser } from '@/utils/currentUser.js';
import { buildTeacherLabel, downloadBase64Document, getPrimaryPhone } from '@/utils/ido.js';

const toast = useToast();

const profileLoading = ref(false);
const teacherLoading = ref(false);
const submitting = ref(false);
const submitted = ref(false);
const selectedTeacher = ref(null);
const teacherSuggestions = ref([]);
const divisionOptions = ref([]);
const canUseAutofill = computed(() => isAuthenticated());
const IDENTITY_DOCUMENT_TYPES = {
    RF_PASSPORT: 'RF_PASSPORT',
    KZ_PASSPORT: 'KZ_PASSPORT',
};

const identityDocumentOptions = [
    { label: 'Паспорт РФ', value: IDENTITY_DOCUMENT_TYPES.RF_PASSPORT },
    { label: 'Паспорт Казахстана', value: IDENTITY_DOCUMENT_TYPES.KZ_PASSPORT },
];

const form = reactive({
    surname: '',
    name: '',
    pastronymic: '',
    address: '',
    phone: '',
    identityDocumentType: IDENTITY_DOCUMENT_TYPES.RF_PASSPORT,
    passportSeries: '',
    passportNumber: '',
    dateIssuePassport: '',
    placeIssuePassport: '',
    hoursQuantity: 1,
    topic: '',
    teacherId: '',
    divisionId: '',
});

const isKazakhstanPassport = computed(() => form.identityDocumentType === IDENTITY_DOCUMENT_TYPES.KZ_PASSPORT);

const identitySeriesLabel = computed(() => (
    isKazakhstanPassport.value ? 'Серия / код документа' : 'Серия'
));
const identitySeriesPlaceholder = computed(() => (
    isKazakhstanPassport.value ? 'Например, N' : '0000'
));

const identityNumberLabel = computed(() => (
    isKazakhstanPassport.value ? 'Номер документа' : 'Номер'
));
const identityNumberPlaceholder = computed(() => (
    isKazakhstanPassport.value ? 'N1234567' : '000000'
));

const identityIssuerLabel = computed(() => (
    isKazakhstanPassport.value ? 'Орган выдачи' : 'Место выдачи'
));

const requiredFields = computed(() => ([
    form.surname,
    form.name,
    form.address,
    form.phone,
    isKazakhstanPassport.value ? 'kz-passport' : form.passportSeries,
    form.passportNumber,
    form.dateIssuePassport,
    form.placeIssuePassport,
    form.hoursQuantity,
    form.topic,
    form.teacherId,
    form.divisionId,
]).every(Boolean));

const normalizeIdentityField = (fieldName) => {
    if (!isKazakhstanPassport.value) return;
    form[fieldName] = String(form[fieldName] || '')
        .toUpperCase()
        .replace(/\s+/g, ' ')
        .trimStart();
};

const loadTeachersDebounced = debounce(async (query) => {
    const normalizedQuery = query?.trim() || '';

    teacherLoading.value = true;

    try {
        const response = await searchTeachers(normalizedQuery);
        teacherSuggestions.value = (response.data || []).map((teacher) => ({
            ...teacher,
            fullName: buildTeacherLabel(teacher),
        }));
    } catch (error) {
        console.debug('Ошибка при поиске преподавателя:', error);
        teacherSuggestions.value = [];
    } finally {
        teacherLoading.value = false;
    }
}, 350);

const prefillCurrentUser = async () => {
    profileLoading.value = true;

    try {
        const [user, phonesResponse] = await Promise.all([
            getCurrentUser(true),
            fetchCurrentUserPhones().catch(() => ({ data: [] })),
        ]);

        form.surname = user?.lastName || '';
        form.name = user?.firstName || '';
        form.pastronymic = user?.middleName || '';
        form.phone = getPrimaryPhone(phonesResponse?.data || []) || form.phone;

        toast.add({
            severity: 'success',
            summary: 'Автозаполнение готово',
            detail: 'ФИО и доступные контакты подтянуты в форму.',
            life: 2500,
        });
    } catch (error) {
        console.debug('Ошибка автозаполнения формы ИДО:', error);
        toast.add({
            severity: 'warn',
            summary: 'Не удалось автозаполнить',
            detail: 'Часть полей нужно будет заполнить вручную.',
            life: 3000,
        });
    } finally {
        profileLoading.value = false;
    }
};

const searchTeacherOptions = (event) => {
    loadTeachersDebounced(event.query);
};

const clearTeacherSelection = () => {
    selectedTeacher.value = null;
    teacherSuggestions.value = [];
    divisionOptions.value = [];
    form.teacherId = '';
    form.divisionId = '';
};

const handleTeacherSelect = async ({ value }) => {
    form.teacherId = value.id;
    form.divisionId = '';
    divisionOptions.value = [];

    try {
        const response = await getTeacherDivisions(value.id);
        divisionOptions.value = response.data || [];

        if (divisionOptions.value.length === 1) {
            form.divisionId = divisionOptions.value[0].id;
        }
    } catch (error) {
        console.debug('Ошибка при получении кафедр:', error);
        toast.add({
            severity: 'error',
            summary: 'Кафедры не загружены',
            detail: 'Не удалось получить кафедры выбранного преподавателя.',
            life: 3000,
        });
        clearTeacherSelection();
    }
};

const submitForm = async () => {
    submitted.value = true;

    if (!requiredFields.value) {
        toast.add({
            severity: 'warn',
            summary: 'Заполните форму',
            detail: 'Нужно указать все обязательные поля договора.',
            life: 3000,
        });
        return;
    }

    submitting.value = true;

    try {
        const payload = {
            surname: form.surname.trim(),
            name: form.name.trim(),
            pastronymic: form.pastronymic.trim() || null,
            address: form.address.trim(),
            phone: form.phone.trim(),
            passportSeries: form.passportSeries.trim(),
            passportNumber: form.passportNumber.trim(),
            dateIssuePassport: form.dateIssuePassport.trim(),
            placeIssuePassport: form.placeIssuePassport.trim(),
            hoursQuantity: Number(form.hoursQuantity),
            topic: form.topic.trim(),
            teacherId: form.teacherId,
            divisionId: form.divisionId,
        };

        const response = canUseAutofill.value
            ? await createIdoOrder(payload)
            : await createPublicIdoOrder(payload);
        downloadBase64Document(response.data?.docFile, response.data?.docName);

        toast.add({
            severity: 'success',
            summary: 'Договор сформирован',
            detail: 'Документ подготовлен и скачивается.',
            life: 3000,
        });
    } catch (error) {
        console.debug('Ошибка при создании договора ИДО:', error);
        toast.add({
            severity: 'error',
            summary: 'Не удалось создать договор',
            detail: 'Проверьте поля формы и повторите попытку.',
            life: 3500,
        });
    } finally {
        submitting.value = false;
    }
};

if (canUseAutofill.value) {
    prefillCurrentUser();
}

watch(
    () => form.identityDocumentType,
    () => {
        form.passportSeries = '';
        form.passportNumber = '';
    },
);
</script>

<style scoped>
.ido-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 10px 2rem 2rem;
    color: var(--p-text-color);
}

.ido-hero {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    padding: 2rem 1rem;
    margin-bottom: 0.25rem;
}

.ido-hero-copy {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.ido-heading-row {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
}

.ido-heading-icon {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, rgba(var(--p-primary-500-rgb), 0.14), rgba(var(--p-primary-500-rgb), 0.06));
    color: var(--p-primary-color);
    border: 1px solid rgba(var(--p-primary-500-rgb), 0.12);
    flex-shrink: 0;
}

.ido-heading-icon .pi {
    font-size: 1.2rem;
}

.ido-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.25rem;
}

.ido-card {
    border-radius: 16px;
    border: 1px solid var(--p-content-border-color);
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
}
.ido-page-public .ido-card {
    background: rgba(255, 255, 255, 0.9);
}

.ido-card :deep(.p-card-title),
.ido-card :deep(.p-card-content) {
    color: var(--p-text-color);
}

.ido-card :deep(.p-card-title) {
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 0.65rem;
}

.ido-card :deep(.p-card-content) {
    padding-top: 0.25rem;
}

.ido-card :deep(.p-card-title::before) {
    content: "";
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: var(--p-primary-color);
    box-shadow: 0 0 0 6px rgba(var(--p-primary-500-rgb), 0.12);
}

.ido-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
}

.ido-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.ido-field-wide {
    grid-column: 1 / -1;
}

.ido-field label {
    font-weight: 600;
    color: var(--p-text-color);
    font-size: 0.93rem;
}

.ido-message {
    grid-column: 1 / -1;
    border-radius: 14px;
}

.ido-actions {
    display: flex;
    justify-content: flex-end;
}

.ido-actions :deep(.p-button) {
    min-width: 240px;
    border-radius: 14px;
}

.ido-important-message {
    margin-bottom: 0.25rem;
    border-radius: 18px;
    border-width: 1px;
    box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
}

.ido-important-message-content {
    display: flex;
    align-items: flex-start;
    gap: 0.85rem;
    line-height: 1.6;
}

.ido-important-message-content .pi {
    font-size: 1.1rem;
    margin-top: 0.1rem;
    flex-shrink: 0;
}

@media (max-width: 992px) {
    .ido-grid,
    .ido-form-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .ido-page {
        padding: 1rem;
    }

    .ido-hero {
        flex-direction: column;
    }

    .ido-heading-row {
        align-items: center;
    }

    .ido-actions {
        justify-content: stretch;
    }

    .ido-actions :deep(.p-button) {
        width: 100%;
    }
}
</style>
