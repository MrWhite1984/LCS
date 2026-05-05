<template>
    <div class="ido-settings-page">
        <div class="ido-settings-header">
            <div class="ido-settings-copy">
                <div class="ido-settings-row">
                    <div class="ido-settings-icon">
                        <i class="pi pi-sliders-h"></i>
                    </div>
                    <div>
                        <h2 class="m-0">Настройки ИДО</h2>
                        <p class="text-color-secondary mt-2 mb-0">
                            Управление коэффициентами расчета, академическими надбавками и шаблоном договора.
                        </p>
                    </div>
                </div>
            </div>
            <Button
                label="Обновить"
                icon="pi pi-refresh"
                outlined
                severity="secondary"
                :loading="loading"
                @click="loadData"
            />
        </div>

        <div class="ido-settings-grid">
            <Card class="ido-settings-card">
                <template #title>Настройки расчета</template>
                <template #content>
                    <div class="ido-settings-form">
                        <div class="ido-field">
                            <label for="ido-standard-hours">Стандартное количество часов</label>
                            <InputNumber id="ido-standard-hours" v-model="settings.standardNumberOfHours" :useGrouping="false" />
                        </div>
                        <div class="ido-field">
                            <label for="ido-accrual">Начисление на зарплату, %</label>
                            <InputNumber id="ido-accrual" v-model="settings.accrualOnWages" :minFractionDigits="0" :maxFractionDigits="2" />
                        </div>
                        <div class="ido-field">
                            <label for="ido-development">Развитие СибАДИ, %</label>
                            <InputNumber id="ido-development" v-model="settings.developmentOfSibADI" :minFractionDigits="0" :maxFractionDigits="2" />
                        </div>
                        <div class="ido-field">
                            <label for="ido-vat">НДС, %</label>
                            <InputNumber id="ido-vat" v-model="settings.vat" :minFractionDigits="0" :maxFractionDigits="2" />
                        </div>
                        <Button
                            label="Сохранить настройки"
                            icon="pi pi-save"
                            :loading="savingSettings"
                            @click="saveSettings"
                        />
                    </div>
                </template>
            </Card>

            <Card class="ido-settings-card">
                <template #title>Шаблон и синхронизация</template>
                <template #content>
                    <div class="ido-settings-side">
                        <div class="ido-upload-box">
                            <div>
                                <h4 class="m-0">Шаблон договора</h4>
                                <p class="text-color-secondary mb-0 mt-2">
                                    Загрузите новый шаблон документа, который будет использоваться при генерации договора.
                                </p>
                            </div>
                            <div class="ido-inline-actions">
                                <FileDropzone
                                    class="ido-template-dropzone"
                                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    icon="pi pi-file-word"
                                    title="Перетащите шаблон сюда"
                                    subtitle="или нажмите, чтобы выбрать .doc/.docx через проводник"
                                    active-subtitle="Отпустите шаблон для загрузки"
                                    compact
                                    @select="onTemplateSelected"
                                />
                                <Tag v-if="templateFileName" :value="templateFileName" severity="secondary" />
                            </div>
                        </div>

                        <Divider />

                        <div class="ido-upload-box">
                            <div>
                                <h4 class="m-0">Синхронизация</h4>
                                <p class="mb-0 mt-2">
                                    Обновить академические данные микросервиса перед проверкой процентов и шаблонов.
                                </p>
                            </div>
                            <Button
                                label="Синхронизировать"
                                icon="pi pi-sync"
                                severity="contrast"
                                :loading="syncing"
                                @click="syncData"
                            />
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <div class="ido-settings-grid">
            <Card class="ido-settings-card">
                <template #title>
                    <div class="ido-card-heading">
                        <span>Степени</span>
                        <Tag value="Процент надбавки за академическую степень" severity="secondary" class="ido-section-tag" />
                    </div>
                </template>
                <template #content>
                    <div v-if="loading" class="ido-settings-list">
                        <Skeleton v-for="index in 4" :key="index" width="100%" height="82px" borderRadius="16px" />
                    </div>
                    <div v-else class="ido-settings-section">
                        <div class="ido-settings-list">
                            <div
                                v-for="degree in degrees"
                                :key="degree.id"
                                class="ido-setting-item"
                                :class="{ 'ido-setting-item-dirty': isDirty(degree) }"
                            >
                                <div class="ido-setting-item-copy">
                                    <div class="ido-setting-item-title">{{ degree.title }}</div>
                                </div>
                                <div class="ido-setting-item-actions">
                                    <div class="ido-percent-panel">
                                        <div class="ido-percent-editor">
                                            <div class="ido-percent-value-wrap">
                                                <InputNumber
                                                    v-model="degree.percent"
                                                    :minFractionDigits="0"
                                                    :maxFractionDigits="2"
                                                    inputClass="ido-percent-input"
                                                />
                                                <span class="ido-percent-sign">%</span>
                                            </div>
                                            <div class="ido-percent-controls">
                                                <Button
                                                    icon="pi pi-minus"
                                                    text
                                                    rounded
                                                    severity="secondary"
                                                    class="ido-step-button ido-step-button-left"
                                                    @click="stepPercent(degree, -1)"
                                                />
                                                <Button
                                                    icon="pi pi-plus"
                                                    text
                                                    rounded
                                                    severity="secondary"
                                                    class="ido-step-button ido-step-button-right"
                                                    @click="stepPercent(degree, 1)"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="ido-section-actions">
                            <Button
                                label="Сохранить степени"
                                icon="pi pi-check"
                                class="ido-save-batch"
                                :loading="savingDegrees"
                                @click="saveDegrees"
                            />
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="ido-settings-card">
                <template #title>
                    <div class="ido-card-heading">
                        <span>Звания</span>
                        <Tag value="Процент надбавки за академическое звание" severity="secondary" class="ido-section-tag" />
                    </div>
                </template>
                <template #content>
                    <div v-if="loading" class="ido-settings-list">
                        <Skeleton v-for="index in 4" :key="index" width="100%" height="82px" borderRadius="16px" />
                    </div>
                    <div v-else class="ido-settings-section">
                        <div class="ido-settings-list">
                            <div
                                v-for="rank in ranks"
                                :key="rank.id"
                                class="ido-setting-item"
                                :class="{ 'ido-setting-item-dirty': isDirty(rank) }"
                            >
                                <div class="ido-setting-item-copy">
                                    <div class="ido-setting-item-title">{{ rank.title }}</div>
                                </div>
                                <div class="ido-setting-item-actions">
                                    <div class="ido-percent-panel">
                                        <div class="ido-percent-editor">
                                            <div class="ido-percent-value-wrap">
                                                <InputNumber
                                                    v-model="rank.percent"
                                                    :minFractionDigits="0"
                                                    :maxFractionDigits="2"
                                                    inputClass="ido-percent-input"
                                                />
                                                <span class="ido-percent-sign">%</span>
                                            </div>
                                            <div class="ido-percent-controls">
                                                <Button
                                                    icon="pi pi-minus"
                                                    text
                                                    rounded
                                                    severity="secondary"
                                                    class="ido-step-button ido-step-button-left"
                                                    @click="stepPercent(rank, -1)"
                                                />
                                                <Button
                                                    icon="pi pi-plus"
                                                    text
                                                    rounded
                                                    severity="secondary"
                                                    class="ido-step-button ido-step-button-right"
                                                    @click="stepPercent(rank, 1)"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="ido-section-actions">
                            <Button
                                label="Сохранить звания"
                                icon="pi pi-check"
                                class="ido-save-batch"
                                :loading="savingRanks"
                                @click="saveRanks"
                            />
                        </div>
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import {
    getAcademicDegrees,
    getAcademicRanks,
    getCalculationSettings,
    syncAcademicData,
    updateAcademicDegreePercent,
    updateAcademicRankPercent,
    updateAccrualOnWages,
    updateDevelopmentOfSibadi,
    updateStandardNumberOfHours,
    updateVat,
    uploadIdoTemplate,
} from '@/api/ido.js';
import { fileToBase64 } from '@/utils/ido.js';
import FileDropzone from '@/components/Utils/FileDropzone.vue';

const toast = useToast();

const loading = ref(true);
const savingSettings = ref(false);
const syncing = ref(false);
const savingDegrees = ref(false);
const savingRanks = ref(false);
const templateFileName = ref('');
const degrees = ref([]);
const ranks = ref([]);

const settings = reactive({
    standardNumberOfHours: 0,
    accrualOnWages: 0,
    developmentOfSibADI: 0,
    vat: 0,
});

const stepPercent = (item, delta) => {
    const current = Number(item.percent || 0);
    const next = Math.max(0, current + delta);
    item.percent = Number(next.toFixed(2));
};

const normalizePercent = (value) => Number(Number(value || 0).toFixed(2));

const withOriginalPercent = (item) => ({
    ...item,
    percent: normalizePercent(item.percent),
    originalPercent: normalizePercent(item.percent),
});

const isDirty = (item) => normalizePercent(item.percent) !== normalizePercent(item.originalPercent);

const loadData = async () => {
    loading.value = true;

    try {
        const [settingsResponse, degreesResponse, ranksResponse] = await Promise.all([
            getCalculationSettings(),
            getAcademicDegrees(),
            getAcademicRanks(),
        ]);

        Object.assign(settings, settingsResponse.data || {});
        degrees.value = (degreesResponse.data || []).map(withOriginalPercent);
        ranks.value = (ranksResponse.data || []).map(withOriginalPercent);
    } catch (error) {
        console.debug('Ошибка загрузки настроек ИДО:', error);
        toast.add({
            severity: 'error',
            summary: 'Настройки не загружены',
            detail: 'Не удалось получить данные ИДО.',
            life: 3000,
        });
    } finally {
        loading.value = false;
    }
};

const saveSettings = async () => {
    savingSettings.value = true;

    try {
        await Promise.all([
            updateStandardNumberOfHours(settings.standardNumberOfHours),
            updateAccrualOnWages(settings.accrualOnWages),
            updateDevelopmentOfSibadi(settings.developmentOfSibADI),
            updateVat(settings.vat),
        ]);

        toast.add({
            severity: 'success',
            summary: 'Настройки сохранены',
            detail: 'Расчетные коэффициенты ИДО обновлены.',
            life: 2500,
        });
    } catch (error) {
        console.debug('Ошибка сохранения настроек ИДО:', error);
        toast.add({
            severity: 'error',
            summary: 'Не удалось сохранить',
            detail: 'Проверьте значения и повторите попытку.',
            life: 3000,
        });
    } finally {
        savingSettings.value = false;
    }
};

const saveDegrees = async () => {
    savingDegrees.value = true;

    try {
        await Promise.all(degrees.value.map((degree) => updateAcademicDegreePercent(degree.id, degree.percent)));
        degrees.value = degrees.value.map((degree) => ({
            ...degree,
            originalPercent: normalizePercent(degree.percent),
        }));
        toast.add({
            severity: 'success',
            summary: 'Степени обновлены',
            detail: 'Все проценты по академическим степеням сохранены.',
            life: 2500,
        });
    } catch (error) {
        console.debug('Ошибка сохранения степени ИДО:', error);
        toast.add({
            severity: 'error',
            summary: 'Не удалось обновить степени',
            detail: 'Изменения не были полностью сохранены.',
            life: 3000,
        });
    } finally {
        savingDegrees.value = false;
    }
};

const saveRanks = async () => {
    savingRanks.value = true;

    try {
        await Promise.all(ranks.value.map((rank) => updateAcademicRankPercent(rank.id, rank.percent)));
        ranks.value = ranks.value.map((rank) => ({
            ...rank,
            originalPercent: normalizePercent(rank.percent),
        }));
        toast.add({
            severity: 'success',
            summary: 'Звания обновлены',
            detail: 'Все проценты по академическим званиям сохранены.',
            life: 2500,
        });
    } catch (error) {
        console.debug('Ошибка сохранения звания ИДО:', error);
        toast.add({
            severity: 'error',
            summary: 'Не удалось обновить звания',
            detail: 'Изменения не были полностью сохранены.',
            life: 3000,
        });
    } finally {
        savingRanks.value = false;
    }
};

const onTemplateSelected = async (files) => {
    const file = Array.from(files || [])[0];

    if (!file) return;

    const allowedMimeTypes = new Set([
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]);
    const fileName = String(file.name || '').toLowerCase();
    const isWordFile = fileName.endsWith('.doc') || fileName.endsWith('.docx') || allowedMimeTypes.has(file.type);

    if (!isWordFile) {
        toast.add({
            severity: 'warn',
            summary: 'Неверный формат файла',
            detail: 'Для шаблона ИДО можно выбрать только файл .doc или .docx',
            life: 3500,
        });

        templateFileName.value = '';
        return;
    }

    templateFileName.value = file.name;

    try {
        const base64 = await fileToBase64(file);
        await uploadIdoTemplate(base64);

        toast.add({
            severity: 'success',
            summary: 'Шаблон загружен',
            detail: `Файл "${file.name}" установлен для ИДО.`,
            life: 3000,
        });
    } catch (error) {
        console.debug('Ошибка загрузки шаблона ИДО:', error);
        toast.add({
            severity: 'error',
            summary: 'Шаблон не загружен',
            detail: 'Не удалось отправить выбранный файл.',
            life: 3000,
        });
    }
};

const syncData = async () => {
    syncing.value = true;

    try {
        await syncAcademicData();
        toast.add({
            severity: 'success',
            summary: 'Синхронизация выполнена',
            detail: 'Академические данные ИДО обновлены.',
            life: 2500,
        });
        await loadData();
    } catch (error) {
        console.debug('Ошибка синхронизации ИДО:', error);
        toast.add({
            severity: 'error',
            summary: 'Не удалось синхронизировать',
            detail: 'Сервис не принял команду обновления.',
            life: 3000,
        });
    } finally {
        syncing.value = false;
    }
};

onMounted(loadData);
</script>

<style scoped>
.ido-settings-page {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 10px 2rem 2rem;
    color: var(--p-text-color);
}

.ido-settings-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    padding: 0;
}

.ido-settings-copy {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.ido-settings-row {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
}

.ido-settings-icon {
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

.ido-settings-icon .pi {
    font-size: 1.2rem;
}

.ido-settings-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
}

.ido-settings-card {
    border-radius: 16px;
    border: 1px solid var(--p-content-border-color);
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
}

.ido-settings-card :deep(.p-card-title),
.ido-settings-card :deep(.p-card-content) {
    color: var(--p-text-color);
}

.ido-settings-card :deep(.p-card-title) {
    display: flex;
    align-items: center;
    gap: 0.65rem;
}

.ido-settings-card :deep(.p-card-title::before) {
    content: "";
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: var(--p-primary-color);
    box-shadow: 0 0 0 6px rgba(var(--p-primary-500-rgb), 0.12);
}

.ido-settings-form,
.ido-settings-side {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.ido-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.ido-field label {
    color: var(--p-text-color);
    font-weight: 600;
    font-size: 0.93rem;
}

.ido-upload-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 0.9rem 0;
}

.ido-inline-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    justify-content: flex-end;
}

.ido-template-dropzone {
    min-width: min(100%, 24rem);
}

.ido-settings-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.85rem;
}

.ido-settings-section {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
}

.ido-card-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    width: 100%;
}

.ido-setting-item {
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.1rem;
    border-radius: 16px;
    border: 1px solid var(--p-content-border-color);
    background: var(--p-content-background);
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.03);
}

.ido-setting-item-dirty {
    border-color: color-mix(in srgb, var(--p-primary-color) 65%, var(--p-content-border-color));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--p-primary-color) 22%, transparent);
}

.ido-setting-item-copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
    justify-content: center;
    flex: 1;
}

.ido-setting-item-title {
    font-weight: 600;
    color: var(--p-text-color);
    font-size: 1rem;
    line-height: 1.35;
}

.ido-setting-item-actions {
    display: flex;
    align-items: stretch;
    min-width: 0;
    justify-content: flex-end;
}

.ido-percent-panel {
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.45rem;
}

.ido-percent-editor {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.ido-percent-value-wrap {
    position: relative;
    display: flex;
    justify-content: center;
    min-height: 42px;
    max-width: 90px;
    border-radius: 999px;
}

.ido-percent-sign {
    position: absolute;
    right: 0.7rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--p-text-color-secondary);
}

.ido-percent-controls {
    display: flex;
    gap: 0;
    border: 1px solid var(--p-content-border-color);
    border-radius: 999px;
    overflow: hidden;
    background: var(--p-content-background);
}

.ido-step-button {
    width: 24px;
    min-width: 24px;
    height: 24px;
    background: transparent;
    border: 1px solid transparent;
    color: var(--p-text-color-secondary);
    border-radius: 0;
}

.ido-step-button :deep(.pi) {
    font-size: 0.75rem;
}

.ido-step-button-left {
    border-right: 1px solid var(--p-content-border-color);
}

.ido-setting-item-actions :deep(.p-inputnumber) {
    width: 100%;
}

.ido-setting-item-actions :deep(.ido-percent-input) {
    width: 100%;
    border: 0;
    background: transparent;
    padding: 0;
    box-shadow: none;
    text-align: center;
    font-size: 1.2rem;
    line-height: 1;
    font-weight: 600;
    color: var(--p-text-color);
}

.ido-setting-item-actions :deep(.ido-percent-input:enabled:focus) {
    box-shadow: none;
}

.ido-setting-item-actions :deep(.p-inputnumber-input::placeholder) {
    color: var(--p-text-color-secondary);
}

.ido-section-actions {
    display: flex;
    justify-content: flex-end;
}

.ido-save-batch {
    width: auto;
    border-radius: 999px;
    justify-content: center;
    min-height: 36px;
    padding-inline: 0.9rem;
}

.ido-section-tag {
    flex-shrink: 0;
    border-radius: 999px;
}

@media (max-width: 992px) {
    .ido-settings-grid {
        grid-template-columns: 1fr;
    }

    .ido-upload-box {
        flex-direction: column;
        align-items: flex-start;
    }

    .ido-setting-item {
        flex-direction: column;
        align-items: stretch;
        padding: 1rem;
    }

    .ido-setting-item-actions {
        min-width: 0;
        width: 100%;
        justify-content: flex-start;
    }

    .ido-percent-panel {
        min-width: 0;
        align-items: flex-start;
    }

    .ido-percent-editor {
        width: 100%;
    }

    .ido-section-actions {
        justify-content: flex-start;
    }

}

@media (max-width: 768px) {
    .ido-settings-page {
        padding: 1rem;
    }

    .ido-settings-header {
        flex-direction: column;
    }

    .ido-settings-row {
        align-items: center;
    }
}
</style>
