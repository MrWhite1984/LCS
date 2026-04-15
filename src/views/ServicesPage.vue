<template>
    <main>
        <div class="content-wrapper">
            <section class="services-hero">
                <div class="services-hero-copy">
                    <span class="services-kicker">Мониторинг</span>
                    <h2 class="m-0">Состояние сервисов</h2>
                    <p class="services-subtitle">
                        Быстрая проверка доступности основных сервисов ЛКС и связанных подсистем.
                    </p>
                </div>
                <div class="services-hero-actions">
                    <Button
                        icon="pi pi-sync"
                        label="Проверить все"
                        severity="contrast"
                        :loading="checkingAll"
                        :disabled="checkingAll"
                        @click="checkAllServices"
                    />
                </div>
            </section>

            <Transition name="content-fade" mode="out-in">
                <section v-if="!loading" key="health-panel" class="health-panel">
                    <div class="health-panel-head">
                        <div>
                            <h3 class="m-0">Сервисы API</h3>
                            <p class="health-panel-caption">
                                Проверки выполняются по эндпоинтам `GET /api/health/*`.
                            </p>
                        </div>
                        <div class="health-summary">
                            <div class="health-summary-item ok">
                                <strong>{{ healthyCount }}</strong>
                                <span>в норме</span>
                            </div>
                            <div class="health-summary-item fail">
                                <strong>{{ failedCount }}</strong>
                                <span>с ошибкой</span>
                            </div>
                            <div class="health-summary-item idle">
                                <strong>{{ uncheckedCount }}</strong>
                                <span>не проверены</span>
                            </div>
                        </div>
                    </div>

                    <div class="health-grid">
                        <article
                            v-for="service in services"
                            :key="service.key"
                            class="health-card"
                            :class="`status-${service.status}`"
                        >
                            <div class="health-card-head">
                                <div class="health-card-copy">
                                    <h4>{{ service.name }}</h4>
                                    <p>{{ service.description }}</p>
                                </div>
                                <span class="health-badge" :class="`health-badge-${service.status}`">
                                    {{ service.statusCode ?? getStatusLabel(service.status) }}
                                </span>
                            </div>

                            <div class="health-endpoint">{{ service.endpoint }}</div>

                            <div class="health-card-actions">
                                <Button
                                    icon="pi pi-search"
                                    label="Проверить"
                                    outlined
                                    severity="secondary"
                                    :loading="service.checking"
                                    :disabled="service.checking || checkingAll"
                                    @click="checkService(service)"
                                />
                            </div>

                            <div v-if="service.status === 'error' && service.error" class="health-error">
                                <i class="pi pi-exclamation-triangle"></i>
                                <span>{{ service.error }}</span>
                            </div>
                        </article>
                    </div>
                </section>

                <section v-else key="health-skeleton" class="health-panel">
                    <div class="health-grid">
                        <Skeleton v-for="idx in 6" :key="idx" width="100%" height="184px" borderRadius="20px" />
                    </div>
                </section>
            </Transition>

            <section class="services-section">
                <div class="services-section-head">
                    <h3 class="m-0">Микросервисы</h3>
                    <p class="services-section-caption">Быстрый переход к рабочим разделам сервисов.</p>
                </div>

                <Transition name="content-fade" mode="out-in">
                    <div v-if="!loading" key="services-content" class="services-cards">
                        <InfraManagerMicroService />
                        <RatingService />
                        <NewsMicroService v-if="canManageNews" />
                    </div>
                    <div v-else key="services-skeleton" class="services-cards">
                        <Skeleton width="100%" height="110px" />
                        <Skeleton width="100%" height="110px" />
                        <Skeleton v-if="canManageNews" width="100%" height="110px" />
                    </div>
                </Transition>
            </section>
        </div>
    </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { usePermissionStore } from '@/stores/permissions.js';
import InfraManagerMicroService from '@/components/Microservice/InfraManager/InfraManagerMicroService.vue';
import RatingService from '@/components/Microservice/Rating/RatingMicroService.vue';
import NewsMicroService from '@/components/News/NewsMicroService.vue';
import { canAccessNewsManagement } from '@/api/news.js';
import axiosInstance from '@/utils/axios.js';

const loading = ref(true);
const checkingAll = ref(false);
const permissionStore = usePermissionStore();
const canManageNews = computed(() => canAccessNewsManagement(permissionStore));

const services = ref([
    {
        key: 'lks',
        name: 'ЛКС API',
        description: 'Основной сервер личного кабинета.',
        endpoint: '/api/health',
        status: 'idle',
        statusCode: null,
        checking: false,
        error: '',
    },
    {
        key: 'database',
        name: 'База ЛКС',
        description: 'Подключение основной базы данных ЛКС.',
        endpoint: '/api/health/database',
        status: 'idle',
        statusCode: null,
        checking: false,
        error: '',
    },
    {
        key: 'oneczkgu',
        name: '1СЗКГУ',
        description: 'Интеграция с сервисом 1СЗКГУ.',
        endpoint: '/api/health/oneczkgu',
        status: 'idle',
        statusCode: null,
        checking: false,
        error: '',
    },
    {
        key: 'infra',
        name: 'InfraManager',
        description: 'Микросервис управления ИТ-процессами.',
        endpoint: '/api/health/infra',
        status: 'idle',
        statusCode: null,
        checking: false,
        error: '',
    },
    {
        key: 'infra-db',
        name: 'База InfraManager',
        description: 'Состояние базы данных InfraManager.',
        endpoint: '/api/health/infra-db',
        status: 'idle',
        statusCode: null,
        checking: false,
        error: '',
    },
    {
        key: 'rating',
        name: 'Rating',
        description: 'Сервис расчёта и управления рейтингом.',
        endpoint: '/api/health/rating',
        status: 'idle',
        statusCode: null,
        checking: false,
        error: '',
    },
    {
        key: 'acc',
        name: 'ИДО',
        description: 'Сервис заявок по дополнительным консультациям.',
        endpoint: '/api/health/additional-consultation-calculation',
        status: 'idle',
        statusCode: null,
        checking: false,
        error: '',
    },
    {
        key: 'faq',
        name: 'FAQ',
        description: 'Сервис статей и базы знаний.',
        endpoint: '/api/health/faq',
        status: 'idle',
        statusCode: null,
        checking: false,
        error: '',
    },
    {
        key: 'news',
        name: 'News',
        description: 'Новостная лента, теги, эмодзи и комментарии.',
        endpoint: '/api/health/news',
        status: 'idle',
        statusCode: null,
        checking: false,
        error: '',
    },
    {
        key: 'max',
        name: 'Max',
        description: 'Интеграционный сервис Max.',
        endpoint: '/api/health/max',
        status: 'idle',
        statusCode: null,
        checking: false,
        error: '',
    },
    {
        key: 'tickets',
        name: 'Tickets',
        description: 'Сервис заявок и обращений.',
        endpoint: '/api/health/tickets',
        status: 'idle',
        statusCode: null,
        checking: false,
        error: '',
    },
    {
        key: 'umu',
        name: 'UMU',
        description: 'Интеграция с сервисом УМУ.',
        endpoint: '/api/health/umu',
        status: 'idle',
        statusCode: null,
        checking: false,
        error: '',
    },
]);

const healthyCount = computed(() => services.value.filter((service) => service.status === 'healthy').length);
const failedCount = computed(() => services.value.filter((service) => service.status === 'error').length);
const uncheckedCount = computed(() => services.value.filter((service) => service.status === 'idle').length);

const getStatusLabel = (status) => {
    if (status === 'checking') return '...';
    if (status === 'idle') return '---';
    return '';
};

const formatError = (error) => {
    const responseData = error?.response?.data;

    if (typeof responseData === 'string' && responseData.trim()) {
        return responseData.trim();
    }

    if (typeof responseData?.message === 'string' && responseData.message.trim()) {
        return responseData.message.trim();
    }

    if (typeof responseData?.title === 'string' && responseData.title.trim()) {
        return responseData.title.trim();
    }

    if (Array.isArray(responseData?.errors) && responseData.errors.length) {
        return responseData.errors.join(', ');
    }

    if (responseData && typeof responseData === 'object') {
        try {
            return JSON.stringify(responseData);
        } catch {
            return 'Не удалось получить подробности ошибки.';
        }
    }

    if (typeof error?.message === 'string' && error.message.trim()) {
        return error.message.trim();
    }

    return 'Сервис недоступен или вернул ошибку.';
};

const checkService = async (service) => {
    service.checking = true;
    service.status = 'checking';
    service.statusCode = null;
    service.error = '';

    try {
        const response = await axiosInstance.get(service.endpoint);
        service.status = 'healthy';
        service.statusCode = response.status ?? 200;
    } catch (error) {
        service.status = 'error';
        service.statusCode = error?.response?.status ?? 'ERR';
        service.error = formatError(error);
    } finally {
        service.checking = false;
    }
};

const checkAllServices = async () => {
    checkingAll.value = true;

    try {
        await Promise.allSettled(services.value.map((service) => checkService(service)));
    } finally {
        checkingAll.value = false;
    }
};

let loadingTimer = null;

onMounted(() => {
    loadingTimer = window.setTimeout(() => {
        loading.value = false;
    }, 400);
});

onBeforeUnmount(() => {
    if (loadingTimer) {
        window.clearTimeout(loadingTimer);
    }
});
</script>

<style scoped>
main {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
}

.content-wrapper {
    flex-shrink: 1;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: 10px 2rem 2rem;
    overflow: auto;
    color: var(--p-text-color);
    gap: 1.5rem;
}

.services-hero {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.5rem;
    border-radius: 24px;
    background:
        radial-gradient(circle at top right, rgba(var(--p-blue-500-rgb), 0.18), transparent 34%),
        linear-gradient(135deg, var(--p-bg-color-1), var(--p-grey-7));
    border: 1px solid color-mix(in srgb, var(--p-blue-500) 15%, var(--p-grey-4));
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.services-kicker {
    display: inline-flex;
    align-items: center;
    margin-bottom: 0.6rem;
    padding: 0.3rem 0.7rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--p-blue-500) 16%, transparent);
    color: var(--p-blue-600);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.services-subtitle {
    margin: 0.55rem 0 0;
    color: var(--p-text-muted-color, var(--p-grey-1));
    max-width: 50rem;
}

.services-hero-actions {
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.health-panel,
.services-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.health-panel-head,
.services-section-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
}

.health-panel-caption,
.services-section-caption {
    margin: 0.35rem 0 0;
    color: var(--p-text-muted-color, var(--p-grey-1));
}

.health-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(120px, 1fr));
    gap: 0.75rem;
}

.health-summary-item {
    display: flex;
    flex-direction: column;
    padding: 0.9rem 1rem;
    border-radius: 18px;
    border: 1px solid var(--p-grey-4);
    background: var(--p-bg-color-1);
    min-width: 120px;
}

.health-summary-item strong {
    font-size: 1.15rem;
}

.health-summary-item span {
    color: var(--p-text-muted-color, var(--p-grey-1));
    font-size: 0.88rem;
}

.health-summary-item.ok strong {
    color: #15803d;
}

.health-summary-item.fail strong {
    color: #b91c1c;
}

.health-summary-item.idle strong {
    color: #475569;
}

.health-grid,
.services-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
}

.health-card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.15rem;
    min-height: 220px;
    border-radius: 22px;
    background: linear-gradient(
        180deg,
        rgba(var(--p-blue-500-rgb), 0.03),
        rgba(255, 255, 255, 0)
    );
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
    transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
}

.health-card:hover {
    transform: translateY(-3px);
    border-color: rgba(var(--p-blue-500-rgb), 0.28);
}

.health-card.status-healthy {
    border-color: rgba(34, 197, 94, 0.35);
}

.health-card.status-error {
    border-color: rgba(239, 68, 68, 0.35);
}

.health-card.status-checking {
    border-color: rgba(59, 130, 246, 0.35);
}

.health-card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.85rem;
}

.health-card-copy h4 {
    margin: 0;
    font-size: 1.05rem;
}

.health-card-copy p {
    margin: 0.45rem 0 0;
    color: var(--p-text-muted-color, var(--p-grey-1));
    line-height: 1.45;
}

.health-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 700;
    white-space: nowrap;
}

.health-badge-idle {
    background: rgba(148, 163, 184, 0.16);
    color: #475569;
}

.health-badge-checking {
    background: rgba(59, 130, 246, 0.16);
    color: #1d4ed8;
}

.health-badge-healthy {
    background: rgba(34, 197, 94, 0.16);
    color: #15803d;
}

.health-badge-error {
    background: rgba(239, 68, 68, 0.16);
    color: #b91c1c;
}

.health-endpoint {
    display: inline-flex;
    align-self: flex-start;
    padding: 0.38rem 0.65rem;
    border-radius: 10px;
    background: color-mix(in srgb, var(--p-bg-color-2) 90%, transparent);
    color: var(--p-text-muted-color, var(--p-grey-1));
    font-family: "SFMono-Regular", Consolas, monospace;
    font-size: 0.8rem;
}

.health-card-actions {
    margin-top: auto;
}

.health-error {
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
    padding: 0.9rem 1rem;
    border-radius: 16px;
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.16);
    color: #991b1b;
    line-height: 1.45;
    word-break: break-word;
}

@media (max-width: 768px) {
    .content-wrapper {
        padding: 20px;
    }

    .services-hero {
        padding: 1.2rem;
        border-radius: 20px;
    }

    .services-hero,
    .health-panel-head,
    .services-section-head {
        flex-direction: column;
    }

    .services-hero-actions,
    .services-hero-actions :deep(.p-button) {
        width: 100%;
    }

    .health-summary {
        width: 100%;
        grid-template-columns: 1fr;
    }

    .health-grid,
    .services-cards {
        grid-template-columns: 1fr;
    }
}
</style>
