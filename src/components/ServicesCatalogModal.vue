<template>
    <Dialog
        :visible="visible"
        header="Сервисы"
        modal
        :style="{ width: 'min(96vw, 1360px)' }"
        class="services-catalog-modal"
        @update:visible="emit('update:visible', $event)"
        @hide="closeModal"
    >
        <div class="services-catalog-body">
            <template v-if="activeParent">
                <div class="catalog-section-context">
                    <Button icon="pi pi-arrow-left" label="Все сервисы" text class="catalog-back-button" @click="activeParent = null" />
                    <div class="catalog-section-context-card">
                        <span class="catalog-section-context-icon"><i :class="activeParent.icon || 'pi pi-folder-open'"></i></span>
                        <div>
                            <span class="services-group-kicker">Раздел сервисов</span>
                            <h3>{{ activeParent.name }}</h3>
                            <p>{{ getDescription(activeParent) }}</p>
                        </div>
                        <span class="catalog-section-count">{{ activeParent.children.length }} {{ getItemsLabel(activeParent.children.length) }}</span>
                    </div>
                </div>
                <div class="services-grid">
                    <CatalogServiceCard
                        v-for="(item, index) in activeParent.children"
                        :key="item.id || item.path"
                        :item="withDescription(item)"
                        :index="index"
                        @select="openItem"
                    />
                </div>
            </template>

            <template v-else>
                <section v-if="items.length" class="services-group">
                    <div class="modal-section-heading">
                        <div>
                            <span class="services-group-kicker">Личный кабинет</span>
                            <h3>Рабочие сервисы</h3>
                        </div>
                    </div>
                    <div class="services-grid">
                        <CatalogServiceCard
                            v-for="(item, index) in items"
                            :key="item.id || item.path"
                            :item="withDescription(item)"
                            :index="index"
                            @select="openItem"
                        />
                    </div>
                </section>

                <section v-if="adminItems.length" class="services-group">
                    <div class="modal-section-heading">
                        <div>
                            <span class="services-group-kicker">Администрирование</span>
                            <h3>Управление системой</h3>
                        </div>
                    </div>
                    <div class="services-grid">
                        <CatalogServiceCard
                            v-for="(item, index) in adminItems"
                            :key="item.id || item.path"
                            :item="withDescription(item)"
                            :index="index + 2"
                            @select="openItem"
                        />
                    </div>
                </section>

                <section v-if="microserviceItems.length" class="services-group">
                    <div class="modal-section-heading">
                        <div>
                            <span class="services-group-kicker">Инструменты</span>
                            <h3>Микросервисы</h3>
                        </div>
                    </div>
                    <div class="services-grid">
                        <CatalogServiceCard
                            v-for="(item, index) in microserviceItems"
                            :key="item.id"
                            :item="item"
                            :index="index"
                            @select="openItem"
                        />
                    </div>
                </section>

                <section v-if="showThemeEditor" class="services-group services-group--theme">
                    <div class="modal-section-heading">
                        <div>
                            <span class="services-group-kicker">Оформление</span>
                            <h3>Тема и акцент</h3>
                        </div>
                    </div>
                    <AccentColorEditor class="catalog-theme-editor" />
                </section>
            </template>
        </div>
    </Dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { usePermissionStore } from '@/stores/permissions.js';
import CatalogServiceCard from '@/components/CatalogServiceCard.vue';
import { canAccessNewsManagement } from '@/api/news.js';
import AccentColorEditor from '@/components/Utils/AccentColorEditor.vue';

const props = defineProps({
    visible: Boolean,
    items: { type: Array, default: () => [] },
    adminItems: { type: Array, default: () => [] },
    showThemeEditor: { type: Boolean, default: false },
});

const emit = defineEmits(['update:visible']);
const router = useRouter();
const permissionStore = usePermissionStore();
const activeParent = ref(null);
const canManageNews = computed(() => canAccessNewsManagement(permissionStore));
const canAccessInfraSuite = computed(() => permissionStore.hasPermission('InfraManager', 'Read'));
const canReadUmuSirius = computed(() => props.items.some((item) => item.id === 'umu-sirius'));
const microserviceItems = computed(() => {
    const items = [];

    if (canAccessInfraSuite.value) {
        items.push(
            { id: 'infra-manager', name: 'ИТ-заявки', badge: 'Заявки', description: 'Заявки, связи пользователей и управление ИТ-процессами.', path: '/services/infraManager', icon: 'pi pi-ticket', theme: 0 },
            { id: 'rating', name: 'Рейтинг', badge: 'Рейтинг', description: 'Сезоны, показатели и расчет рейтингов сотрудников.', path: '/services/rating', icon: 'pi pi-star', theme: 1 },
            { id: 'analytics', name: 'Аналитика студентов', badge: 'Прогноз', description: 'Академические риски, активность и рекомендации кураторам.', path: '/services/ml-analytics', icon: 'pi pi-chart-line', theme: 2 },
        );
    }

    if (canReadUmuSirius.value) {
        items.push({ id: 'umu', name: 'УМУ · ГПХ', badge: 'Документы', description: 'Исполнители, договоры, решения и шаблоны для ГПХ.', path: '/umu-sirius', icon: 'pi pi-briefcase', theme: 3 });
    }

    if (canManageNews.value) {
        items.push({ id: 'news', name: 'Новости', badge: 'Контент', description: 'Публикации, редактура и управление новостной лентой.', path: '/news/manage', icon: 'pi pi-megaphone', theme: 4 });
    }

    return items;
});

const descriptions = {
    requests: 'Создание и отслеживание обращений.',
    tickets: 'Справки, заявки и статусы обработки.',
    ido: 'Консультации и настройки дополнительного обучения.',
    'umu-sirius': 'Документы, исполнители и процессы ГПХ.',
    'project-office': 'Проекты, инициативы и рабочие материалы.',
    users: 'Учетные записи и доступ сотрудников.',
    rbac: 'Роли и права доступа в системе.',
    'ticket-responsibles': 'Ответственные за обработку справок.',
    'health-checks': 'Статус и доступность сервисов.',
    '/tickets': 'Все выданные справки и их статусы.',
    '/tickets/my-requests': 'Ваши заявки на получение справок.',
    '/ido/consultations': 'Новая заявка на дополнительную консультацию.',
    '/ido/orders': 'Заявки и история консультаций.',
    '/ido/settings': 'Параметры и доступы модуля ИДО.',
    '/umu-sirius': 'Документы, исполнители и процессы ГПХ.',
    '/project-office/projects': 'Банк проектов и рабочие инициативы.',
};

const getDescription = (item) => item.description || descriptions[item.id] || descriptions[item.path] || 'Открыть раздел и продолжить работу.';
const withDescription = (item) => ({ ...item, description: getDescription(item) });
const getItemsLabel = (count) => (count === 1 ? 'пункт' : count < 5 ? 'пункта' : 'пунктов');

const closeModal = () => {
    activeParent.value = null;
    emit('update:visible', false);
};

const openItem = (item) => {
    if (item.children?.length) {
        activeParent.value = item;
        return;
    }
    if (!item.path) return;
    closeModal();
    router.push(item.path);
};
</script>

<style>
.services-catalog-modal.p-dialog { max-height: min(88vh, 860px); }
.services-catalog-modal .p-dialog-header { padding: 1.3rem 1.35rem 0.75rem; font-size: clamp(1.35rem, 2vw, 1.65rem); font-weight: 850; letter-spacing: -0.035em; }
.services-catalog-modal .p-dialog-content { padding: 0.8rem 1.35rem 1.35rem; scrollbar-color: color-mix(in srgb, var(--p-primary-color) 55%, transparent) transparent; scrollbar-width: thin; }
.services-catalog-modal .p-dialog-content::-webkit-scrollbar { width: 0.65rem; }
.services-catalog-modal .p-dialog-content::-webkit-scrollbar-track { margin: 0.5rem 0; border-radius: 999px; background: color-mix(in srgb, var(--p-primary-color) 6%, transparent); }
.services-catalog-modal .p-dialog-content::-webkit-scrollbar-thumb { min-height: 3rem; border: 0.18rem solid transparent; border-radius: 999px; background: color-mix(in srgb, var(--p-primary-color) 48%, transparent); background-clip: padding-box; }
.services-catalog-modal .p-dialog-content::-webkit-scrollbar-thumb:hover { background: var(--p-primary-color); background-clip: padding-box; }
.services-catalog-body { display: flex; flex-direction: column; gap: 1.4rem; }
.services-group { display: flex; flex-direction: column; gap: 0.75rem; }
.modal-section-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.modal-section-heading--back { justify-content: flex-start; }
.catalog-section-context { display: flex; flex-direction: column; gap: 0.35rem; }
.catalog-back-button { align-self: flex-start; margin-left: -0.5rem; }
.catalog-section-context-card { display: flex; align-items: center; gap: 0.9rem; min-height: 94px; padding: 0.95rem 1rem; border: 1px solid color-mix(in srgb, var(--p-primary-color) 20%, var(--p-grey-4)); border-radius: 16px; background: linear-gradient(135deg, color-mix(in srgb, var(--p-primary-color) 12%, transparent), transparent 62%), var(--p-bg-color-1); }
.catalog-section-context-icon { display: grid; width: 3rem; height: 3rem; flex: 0 0 auto; place-items: center; border-radius: 13px; color: var(--p-primary-color); background: color-mix(in srgb, var(--p-primary-color) 14%, transparent); }
.catalog-section-context-icon i { font-size: 1.35rem; }
.catalog-section-context-card h3 { margin: 0.12rem 0 0; color: var(--p-text-color); font-size: 1.22rem; font-weight: 850; letter-spacing: -0.025em; }
.catalog-section-context-card p { margin: 0.25rem 0 0; color: var(--p-text-muted-color, var(--p-grey-1)); font-size: 0.8rem; line-height: 1.35; }
.catalog-section-count { margin-left: auto; padding: 0.32rem 0.55rem; border-radius: 999px; color: var(--p-primary-color); background: color-mix(in srgb, var(--p-primary-color) 12%, transparent); font-size: 0.72rem; font-weight: 800; white-space: nowrap; }
.modal-section-heading h3 { margin: 0.12rem 0 0; color: var(--p-text-color); font-size: 1.08rem; font-weight: 850; letter-spacing: -0.025em; }
.services-group-kicker { color: var(--p-primary-color); font-size: 0.68rem; font-weight: 800; letter-spacing: 0.09em; text-transform: uppercase; }
.services-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.8rem; }
.services-group--theme { padding-top: 0.25rem; }
.catalog-theme-editor { width: min(100%, 22rem); }
@media (max-width: 960px) { .services-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 760px) { .services-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .services-catalog-modal.p-dialog { width: calc(100vw - 1rem) !important; } .services-grid { grid-template-columns: 1fr; } .catalog-section-context-card { align-items: flex-start; flex-wrap: wrap; } .catalog-section-count { margin-left: 3.9rem; } }
</style>
