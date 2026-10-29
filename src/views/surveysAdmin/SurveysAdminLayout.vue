<template>
    <main class="survey-admin-page">
        <section class="survey-admin-shell">
            <header class="survey-admin-header">
                <div>
                    <Tag rounded severity="contrast">Администрирование</Tag>
                    <h2>Управление опросами</h2>
                    <p>Опросы, шаблоны, серии, аудитория и результаты.</p>
                </div>

                <Button
                    label="К опросам"
                    icon="pi pi-arrow-left"
                    outlined
                    severity="secondary"
                    @click="router.push('/surveys')"
                />
            </header>

            <nav class="survey-admin-tabs">
                <button
                    v-for="tab in tabs"
                    :key="tab.path"
                    type="button"
                    class="survey-admin-tab"
                    :class="{ 'survey-admin-tab--active': isActive(tab) }"
                    @click="router.push(tab.path)"
                >
                    <i :class="tab.icon"></i>
                    <span>{{ tab.label }}</span>
                </button>
            </nav>

            <router-view />
        </section>
    </main>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePermissionStore } from '@/stores/permissions.js';

const route = useRoute();
const router = useRouter();
const permissionStore = usePermissionStore();

const allTabs = [
    { label: 'Опросы', icon: 'pi pi-list', path: '/surveys/admin/surveys', resource: 'SurveysAdmin' },
    { label: 'Шаблоны', icon: 'pi pi-copy', path: '/surveys/admin/templates', resource: 'SurveysTemplates' },
    { label: 'Серии', icon: 'pi pi-sitemap', path: '/surveys/admin/series', resource: 'SurveysTemplates' },
    { label: 'Элективы', icon: 'pi pi-graduation-cap', path: '/surveys/admin/electives', resource: 'SurveysTemplates' },
    { label: 'Поля', icon: 'pi pi-sliders-h', path: '/surveys/admin/fields', resource: 'SurveysAudience' },
    { label: 'Пресеты', icon: 'pi pi-bookmark', path: '/surveys/admin/presets', resource: 'SurveysAudience' },
    { label: 'Результаты', icon: 'pi pi-chart-bar', path: '/surveys/admin/results', resource: 'SurveysResults' },
];

const tabs = computed(() => allTabs.filter((tab) => permissionStore.hasPermission(tab.resource, 'Read')));

const isActive = (tab) => route.path === tab.path || route.path.startsWith(`${tab.path}/`);
</script>

<style scoped>
.survey-admin-page {
    min-height: 100%;
    padding: 10px;
}

.survey-admin-shell {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 100%;
    padding: 1.25rem;
    border-radius: 20px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.14);
    background:
        radial-gradient(1000px 220px at 0% 0%, rgba(var(--p-blue-500-rgb), 0.08), transparent 60%),
        linear-gradient(180deg, var(--p-bg-color-2) 0%, var(--p-bg-color-1) 100%);
    box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
}

.survey-admin-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    flex-wrap: wrap;
}

.survey-admin-header h2 {
    margin: 0.75rem 0 0;
}

.survey-admin-header p {
    margin: 0.65rem 0 0;
    color: var(--p-grey-1);
}

.survey-admin-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    padding: 0.35rem;
    border-radius: 14px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
    background: rgba(var(--p-blue-500-rgb), 0.04);
}

.survey-admin-tab {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 0.8rem;
    border: 0;
    border-radius: 11px;
    background: transparent;
    color: var(--p-text-color);
    cursor: pointer;
    font-size: 0.84rem;
    font-weight: 650;
    transition: background 0.2s ease, color 0.2s ease;
}

.survey-admin-tab:hover {
    background: rgba(var(--p-blue-500-rgb), 0.08);
}

.survey-admin-tab--active {
    background: var(--p-primary-color);
    color: #fff;
}

.survey-admin-tab i {
    font-size: 0.9rem;
}

@media (max-width: 760px) {
    .survey-admin-shell {
        padding: 1rem;
    }
}
</style>

<style>
.survey-admin-dialog.p-dialog {
    max-height: min(90vh, 900px);
    overflow: hidden;
    border-radius: 18px;
}

.survey-admin-dialog .p-dialog-header {
    padding: 1.1rem 1.25rem 0.7rem;
    font-size: 1.15rem;
    font-weight: 850;
    letter-spacing: -0.025em;
}

.survey-admin-dialog .p-dialog-content {
    padding: 0.55rem 1.25rem 1rem;
    overflow-y: auto;
    scrollbar-color: color-mix(in srgb, var(--p-primary-color) 55%, transparent) transparent;
    scrollbar-width: thin;
}

.survey-admin-dialog .p-dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    flex-wrap: wrap;
    padding: 0.9rem 1.25rem;
    border-top: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
}

.survey-admin-dialog .admin-form {
    gap: 1rem;
    padding: 0.25rem 0;
}

.survey-admin-dialog .admin-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
}

.survey-admin-dialog .admin-form label,
.survey-admin-dialog .admin-field label {
    font-size: 0.86rem;
    font-weight: 600;
    line-height: 1.3;
    color: var(--p-text-color);
}

.survey-admin-dialog .admin-form-grid {
    gap: 1rem 1.25rem;
}

.survey-admin-dialog .admin-form .p-inputtext,
.survey-admin-dialog .admin-form .p-select,
.survey-admin-dialog .admin-form .p-datepicker,
.survey-admin-dialog .admin-form .p-inputnumber,
.survey-admin-dialog .admin-form .p-textarea {
    width: 100%;
}

.survey-admin-dialog .admin-form textarea {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.8rem;
    line-height: 1.45;
}

@media (max-width: 600px) {
    .survey-admin-dialog .p-dialog-header,
    .survey-admin-dialog .p-dialog-content,
    .survey-admin-dialog .p-dialog-footer {
        padding-left: 1rem;
        padding-right: 1rem;
    }
}
</style>


