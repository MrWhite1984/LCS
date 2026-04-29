<template>
    <main>

        <!-- Секция сезонов -->
        <section class="content-wrapper">
            <div class="section-header">
                <div class="section-title-wrapper">
                    <i class="pi pi-calendar section-icon"></i>
                    <h2 class="section-title">Сезоны</h2>
                </div>
            </div>
            <Transition name="content-fade" mode="out-in">
                <div v-if="loading" key="rating-seasons-skeleton" class="seasons-grid">
                    <div v-for="idx in 6" :key="idx" class="season-card card-animated">
                        <Skeleton width="55%" height="1.5rem" class="mb-3" />
                        <Skeleton width="35%" height="1.4rem" class="mb-3" />
                        <Skeleton width="100%" height="1rem" class="mb-2" />
                        <Skeleton width="75%" height="1rem" class="mb-2" />
                        <Skeleton width="60%" height="1rem" />
                    </div>
                </div>
                <div v-else key="rating-seasons-content" class="seasons-grid">
                    <div 
                        v-for="(item, index) in seasons" 
                        :key="item.id" 
                        class="season-card card-animated" 
                        :class="{'season-closed': item.isClosed}"
                        @click="goToSeason(item.id)"
                    >
                        <div class="card-status-indicator" :class="item.isClosed ? 'status-closed' : 'status-open'"></div>
                        <div class="season-top-row">
                            <div class="season-header">
                                <h3 class="card-title">{{ item.title }}</h3>
                            </div>
                            <div class="menu">
                                <Button 
                                    type="button" 
                                    icon="pi pi-ellipsis-v" 
                                    class="edit-btn" 
                                    text
                                    rounded
                                    @click.stop="(event) => toggle(event, index)" 
                                    aria-haspopup="true" 
                                    aria-controls="overlay_menu" 
                                    v-tooltip.top="'Действия'" 
                                />
                                <Menu :ref="(el) => { if (el) menus[index] = el }" :model="menuItems[index]" :popup="true" id="season_edit"/>
                            </div>
                        </div>

                        <Tag :severity="item.isClosed ? 'danger' : 'success'" class="status-badge">
                            <span class="status-dot" :class="item.isClosed ? 'closed' : 'open'"></span>
                            {{ item.isClosed ? 'Закрыт' : 'Открыт' }}
                        </Tag>
                        
                        <div class="card-content">
                            <div class="info-item primary-info">
                                <div class="info-icon-wrapper">
                                    <i class="pi pi-calendar"></i>
                                </div>
                                <span class="info-text">{{ item.period }}</span>
                            </div>
                            <div class="info-item">
                                <div class="info-icon-wrapper">
                                    <i class="pi pi-chart-bar"></i>
                                </div>
                                <div class="info-details">
                                    <span class="info-label">Показателей</span>
                                    <span class="info-value">{{ item.indicatorsCount }}</span>
                                </div>
                            </div>
                            <div class="info-item">
                                <div class="info-icon-wrapper">
                                    <i class="pi pi-users"></i>
                                </div>
                                <div class="info-details">
                                    <span class="info-label">Оценок сотрудников</span>
                                    <span class="info-value">{{ item.pointsCount }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <CreateSeason @created="fetchSeasons" />
                    <UpdateSeason @edited="fetchSeasons" :season="selectedSeason" v-model:visible="showEditDialog" />
                    <DeleteSeason @deleted="fetchSeasons" :season="selectedSeason" v-model:visible="showDeleteDialog"/>
                </div>
            </Transition>
        </section>

        <!-- Секция сотрудников -->
        <EmployeeTable />

        <!-- Секция должностей -->
        <JobPositionTable />
        
        <!-- Секция отделов -->
        <DepartmentTable />
    </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from "vue-router";
import axiosInstance from "@/utils/axios.js";
import { getQuarterPeriod } from '@/utils/formatSeason.js';

import CreateSeason from "@/components/Microservice/Rating/Methods/Seasons/CreateSeason.vue";
import UpdateSeason from "@/components/Microservice/Rating/Methods/Seasons/UpdateSeason.vue";
import DeleteSeason from "@/components/Microservice/Rating/Methods/Seasons/DeleteSeason.vue";

import EmployeeTable from '@/components/Microservice/Rating/Tables/EmployeeTable.vue';
import JobPositionTable from '@/components/Microservice/Rating/Tables/JobPositionTable.vue';
import DepartmentTable from '@/components/Microservice/Rating/Tables/DepartmentTable.vue';

const router = useRouter();
const route = useRoute();

// Меню для сезонов
const menus = ref([]);
const seasons = ref([]);
const menuItems = ref([]);
const selectedSeason = ref(null);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);

const loading = ref(true);

const openEditDialog = (season) => {
    selectedSeason.value = season;
    showEditDialog.value = true;
};

const openDeleteDialog = (season) => {
    selectedSeason.value = season;
    showDeleteDialog.value = true;
};

const toggle = (event, index) => {
    menus.value[index].toggle(event);
};

const goToSeason = (seasonId) => {
    router.push({ 
        path: `/services/rating/season/${seasonId}`, 
        query: {
            returnTo: route.fullPath,
        },
    });
};

const fetchSeasons = async () => {
    loading.value = true;
    try {
        const { data } = await axiosInstance.get('/api/rating/seasons');
        seasons.value = data.map(season => {
            const quarter = season.title.split('/')[1];
            const period = getQuarterPeriod(quarter);

            return {
                ...season,
                period
            }
        }).sort((a, b) => {
            const [yearA, quarterA] = a.title.split('/');
            const [yearB, quarterB] = b.title.split('/');
            
            if (yearA !== yearB) {
                return parseInt(yearB) - parseInt(yearA);
            }
            
            return parseInt(quarterB) - parseInt(quarterA);
        });

        showEditDialog.value = false;
        showDeleteDialog.value = false;

        menuItems.value = seasons.value.map(season => ([{
            label: 'Действия',
            items: [
                {
                    label: 'Редактировать',
                    icon: 'pi pi-pencil',
                    command: () => openEditDialog(season)
                },
                {
                    label: 'Удалить',
                    icon: 'pi pi-trash',
                    command: () => openDeleteDialog(season)
                }
            ]
        }]));
    } catch (error) {
        console.error('Ошибка при получении сезонов: ', error);
    } finally {
        loading.value = false;
    }
};

onMounted(async () => {
    await Promise.all([
        fetchSeasons(),
    ]);
});

</script>

<style scoped>
/* ========== Основные стили ========== */
main {
    position: relative;
    box-sizing: border-box;
}

h3 {
    margin: 0;
}

/* ========== Секция контента ========== */
.content-wrapper {
    flex-shrink: 1;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: 2.5rem 8rem;
    overflow: hidden;
    color: var(--p-text-color);
}

.content-wrapper:not(:last-child) {
    border-bottom: 1px solid var(--p-surface-200);
}

.p-dark .content-wrapper:not(:last-child) {
    border-bottom: 1px solid var(--p-surface-700);
}

/* ========== Заголовки секций ========== */
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.section-title-wrapper {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.section-icon {
    font-size: 1.75rem;
    color: var(--p-text-color);
    padding: 0.75rem;
    background: linear-gradient(135deg, var(--p-primary-100), var(--p-primary-50));
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(var(--p-primary-color-rgb, 59, 130, 246), 0.15);
}

.p-dark .section-icon {
    background: linear-gradient(135deg, var(--p-primary-700), var(--p-primary-600));
    box-shadow: 0 2px 8px rgba(var(--p-primary-color-rgb, 59, 130, 246), 0.25);
}

.section-title {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0;
    background: var(--p-text-color);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* ========== Сетка карточек ========== */
.seasons-grid {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(auto-fill, minmax(clamp(240px, 40vw, 300px), 1fr));
}

/* ========== Базовые стили карточек ========== */
.season-card {
    padding: 1.5rem;
    background: var(--p-surface-0);
    border-radius: 16px;
    border: 1px solid var(--p-surface-200);
    position: relative;
    overflow: hidden;
    transition: all 0.5s;
}

.p-dark .season-card {
    background: var(--p-surface-900);
    border: 1px solid var(--p-surface-700);
}

/* ========== Анимация карточек ========== */
.card-animated {
    transition: all 0.5s;
}

.season-card:hover {
    cursor: pointer;
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
}

.p-dark .season-card:hover {
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
}

/* ========== Индикатор статуса для сезонов ========== */
.card-status-indicator {
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    border-radius: 16px 0 0 16px;
}

.status-open {
    background: linear-gradient(180deg, var(--p-green-500), var(--p-green-600));
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
}

.status-closed {
    background: linear-gradient(180deg, var(--p-red-500), var(--p-red-600));
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
}

/* ========== Верхняя часть карточки ========== */
.season-top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
}

.season-header {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.card-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--p-text-color);
    margin: 0;
    line-height: 1.4;
}

.status-badge {
    font-size: 0.813rem;
    font-weight: 500;
    display: flex;
    margin-bottom: 1.25rem;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    display: inline-block;
    margin-right: 4px;
}

.open.status-dot {
    background: var(--p-green-600);
    box-shadow: 0 0 6px var(--p-green-400);
}

.closed.status-dot {
    background: var(--p-red-600);
    box-shadow: 0 0 6px var(--p-red-400);
}

/* ========== Меню действий ========== */
.menu {
    position: static;
    flex-shrink: 0;
}

.edit-btn {
    width: 2rem;
    height: 2rem;
    transition: all 0.5s;
    color: var(--p-text-color) !important;
}

.edit-btn:hover {
    background: var(--p-primary-100) !important;
}

.p-dark .edit-btn:hover {
    background: var(--p-primary-500) !important;
}

/* ========== Контент карточки ========== */
.card-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.info-item {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 0.625rem 0;
}

.info-item.primary-info {
    padding: 0.875rem;
    background: var(--p-surface-100);
    border-radius: 10px;
    margin-bottom: 0.5rem;
}

.p-dark .info-item.primary-info {
    background: var(--p-surface-800);
}

.info-icon-wrapper {
    width: 2.25rem;
    height: 2.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--p-surface-200);
    border-radius: 10px;
    color: var(--p-text-secondary-color);
    flex-shrink: 0;
    transition: all 0.5s;
}

.p-dark .info-icon-wrapper {
    background: var(--p-surface-700);
}

.info-icon-wrapper.primary {
    background: linear-gradient(135deg, var(--p-primary-500), var(--p-primary-600));
    color: white;
    box-shadow: 0 2px 8px rgba(var(--p-primary-color-rgb, 59, 130, 246), 0.3);
}

.info-icon-wrapper i {
    font-size: 1.125rem;
}

.info-text {
    font-size: 1rem;
    color: var(--p-text-color);
    font-weight: 500;
    word-break: break-word;
}

.info-details {
    display: flex;
    flex-direction: column;
}

.info-label {
    font-size: 0.813rem;
    color: var(--p-text-secondary-color);
    font-weight: 500;
}

.info-value {
    font-size: 1rem;
    color: var(--p-text-color);
    font-weight: 600;
}

/* ========== Адаптивность ========== */
@media (max-width: 1400px) {
    .content-wrapper {
        padding: 2rem 4rem;
    }
    
    .seasons-grid {
        grid-template-columns: repeat(auto-fill, minmax(clamp(260px, 45vw, 320px), 1fr));
    }
}

@media (max-width: 1024px) {
    .content-wrapper {
        padding: 1.5rem 2rem;
    }
    
    .seasons-grid {
        grid-template-columns: repeat(auto-fill, minmax(clamp(260px, 55vw, 320px), 1fr));
        gap: 1.25rem;
    }
    
    .section-title {
        font-size: 1.5rem;
    }
}

@media (max-width: 768px) {
    .content-wrapper {
        padding: 1.25rem 1rem;
    }
    
    .seasons-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
    }
    
    .section-title-wrapper {
        gap: 0.75rem;
    }
    
    .section-icon {
        font-size: 1.5rem;
        padding: 0.625rem;
    }
    
    .section-title {
        font-size: 1.25rem;
    }
}
</style>
