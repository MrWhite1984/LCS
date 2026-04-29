<template>
    <main>
        
        <div class="content-wrapper">
            
            <header class="app-header">
                <div class="header-content">
                    <div class="header-main">
                        <div class="navigation-section">
                            <Button 
                                icon="pi pi-arrow-left" 
                                class="p-button-text back-button"
                                @click="goBack"
                                v-tooltip.top="'Назад'"
                            />
                            <div class="title-section">
                                <h1 class="page-title">Показатели эффективности</h1>
                                <span class="season-badge">
                                <i class="pi pi-calendar badge-icon"></i>
                                Сезон: {{ certainSeason?.title || '—' }}
                                </span>
                            </div>
                        </div>

                        <div class="stats-section">
                            <div 
                                v-for="(stat, index) in headerStats" 
                                :key="index"
                                class="stat-card"
                                :class="`stat-card-${index}`"
                            >
                                <div class="stat-graphic">
                                    <i :class="`stat-icon ${stat.icon}`"></i>
                                    <div class="stat-wave"></div>
                                </div>
                                <div class="stat-info">
                                    <span class="stat-value">{{ stat.value }}</span>
                                    <span class="stat-label">{{ stat.label }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Основной контент -->
            <Transition name="content-fade" mode="out-in">
                <div v-if="loading && !rawIndicators.length" key="season-indicators-skeleton" class="main-content">
                    <div class="content-card">
                        <div class="toolbar">
                            <div class="toolbar-left">
                                <Skeleton width="10rem" height="2.25rem" />
                            </div>
                            <div class="toolbar-right">
                                <Skeleton width="12rem" height="2.25rem" class="me-3" />
                                <Skeleton width="11rem" height="2.25rem" />
                            </div>
                        </div>
                        <div class="table-container">
                            <Skeleton width="100%" height="3rem" class="mb-2" />
                            <Skeleton width="100%" height="3rem" class="mb-2" />
                            <Skeleton width="100%" height="3rem" class="mb-2" />
                            <Skeleton width="100%" height="3rem" class="mb-2" />
                            <Skeleton width="100%" height="3rem" class="mb-2" />
                            <Skeleton width="100%" height="3rem" class="mb-2" />
                        </div>
                    </div>
                </div>
                <div v-else key="season-indicators-content" class="main-content">
                    <div class="content-card">
                        <!-- Панель инструментов -->
                        <div class="toolbar">
                            <div class="toolbar-left">
                                <Button 
                                    :icon="allExpanded ? 'pi pi-minus' : 'pi pi-plus'" 
                                    :label="allExpanded ? 'Свернуть все' : 'Развернуть все'"
                                    class="p-button-outlined toggle-button"
                                    @click="toggleAllExpanded"
                                />
                            </div>
                            
                            <div class="toolbar-right">
                                <AddIndToSeason 
                                :seasonId="seasonId" 
                                @added="onIndicatorAdded" 
                                :rawIndicators="rawIndicators" 
                                />
                                <Button 
                                    icon="pi pi-download"
                                    label="Скачать отчет"
                                    outlined
                                    severity="success"
                                    class="ms-3 toggle-button"
                                    @click="downloadReport"
                                    :loading="downloading"
                                />
                            </div>
                        </div>

                        <!-- Таблица с показателями -->
                        <div class="table-container">
                            <div class="table-section" :class="{ 'empty-state': totalIndicators === 0 }">
                            <TreeTable
                                v-if="totalIndicators > 0"
                                :value="treeNodes"
                                :expandedKeys="expandedKeys"
                                @toggle="onToggle"
                                dataKey="key"
                                scrollable
                                scrollHeight="58vh"
                                :rowClassName="rowClass"
                                class="indicators-table"
                                :lazy="true"
                                :loading="loading"
                                :virtualScrollerOptions="{ itemSize: 10 }"
                            >

                                <Column field="name" header="Наименование" expander>
                                    <template #body="{ node }">
                                        <div class="node-content">
                                            <div v-if="node.data.isGroup" class="group-node">
                                                <span class="indicator-number">{{ node.data.number }}</span>
                                                <div class="group-info">
                                                    <div class="group-header">
                                                        
                                                        <span class="group-name">{{ node.data.group }}</span>
                                                    </div>
                                                    <span class="group-stats">
                                                        {{ calculateIndicatorsTotal(node.data.group) }} {{ getIndicatorWord(calculateIndicatorsTotal(node.data.group)) }},
                                                        {{ node.data.totalEmployeeScores }} {{ getScoreWord(node.data.totalEmployeeScores) }}
                                                    </span>
                                                </div>
                                            </div>

                                            <div v-else-if="node.data.isSubGroup" class="subgroup-node">
                                                <i v-if="node.data.number === 'N'" class="pi pi-folder-open subgroup-icon"></i>
                                                <span v-else class="indicator-number">{{ node.data.number }}</span>
                                                <div class="subgroup-info">
                                                    <div class="subgroup-header">
                                                        <span class="subgroup-name">{{ node.data.subGroup }}</span>
                                                    </div>
                                                    <span class="subgroup-stats">
                                                        {{ node.children?.length || 0 }} {{ getIndicatorWord(node.children?.length || 0) }},
                                                        {{ node.data.totalEmployeeScores || '' }} {{ getScoreWord(node.data.totalEmployeeScores || 0) }}
                                                    </span>
                                                </div>
                                            </div>

                                            <div v-else class="indicator-node">
                                                <div class="indicator-header">
                                                    <span class="indicator-number">{{ node.data.number }}</span>
                                                    <span class="indicator-name">{{ node.data.indicator }}</span>
                                                </div>
                                                <div class="indicator-meta">
                                                    <Tag 
                                                        v-if="node.data.periodicity" 
                                                        :value="node.data.periodicity" 
                                                        severity="info" 
                                                        class="meta-tag"
                                                    />
                                                    <Tag 
                                                        v-if="node.data.responsible" 
                                                        :value="node.data.responsible" 
                                                        severity="success" 
                                                        class="meta-tag"
                                                    />
                                                    
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                </Column>

                                <!-- Колонка действий -->
                                <Column header="Действия" style="width: 140px">
                                    <template #body="{ node }">
                                        <div v-if="!node.data.isGroup && !node.data.isSubGroup" class="actions">
                                            <IndicatorScoresManager
                                                :indicatorData="node.data"
                                                :seasonId="seasonId"
                                                :employeeIndicatorValues="employeeIndicatorValues"
                                                :employees="employees"
                                                @updated="fetchIndicators"
                                            />
                                            <DeleteIndicator 
                                                :item="node.data" 
                                                :seasonId="seasonId" 
                                                @deleted="fetchIndicators" 
                                            />
                                        </div>
                                    </template>
                                </Column>
                            </TreeTable>

                            <!-- Состояние пустого списка -->
                                <div v-if="totalIndicators === 0" class="empty-indicators">
                                    <div class="empty-content">
                                        <i class="pi pi-chart-line empty-icon"></i>
                                        <h3>Показатели не добавлены</h3>
                                        <p>Начните работу, добавив первый показатель эффективности</p>
                                        <AddIndToSeason 
                                            :seasonId="seasonId" 
                                            @added="onIndicatorAdded" 
                                            :rawIndicators="rawIndicators"
                                            class="empty-action"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>
        </div>
    </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from "vue-router";
import axiosInstance from "@/utils/axios.js";
import { getQuarterPeriod } from '@/utils/formatSeason.js';

import DeleteIndicator from "@/components/Microservice/Rating/Methods/DeleteIndicator.vue";
import AddIndToSeason from "@/components/Microservice/Rating/Methods/AddIndToSeason.vue";
import IndicatorScoresManager from "@/components/Microservice/Rating/IndicatorScoresManager.vue";

const router = useRouter();
const route = useRoute();
const returnTo = computed(() => (
    typeof route.query.returnTo === 'string' && route.query.returnTo.trim()
        ? route.query.returnTo
        : '/services/rating'
));

const seasonId = ref(parseInt(route.params.idSeason));
const certainSeason = ref({});
const loading = ref(true);
const rawIndicators = ref([]);
const employeeIndicatorValues = ref([]);
const employees = ref([]);
const expandedKeys = ref({});
const allExpanded = ref(false);
const lastAddedIndicatorId = ref(null);
const downloading = ref(false);

const dialogVisible = ref(false);
const selectedIndicator = ref(null);

const getIndicatorWord = (count) => {
    if (count % 10 === 1 && count % 100 !== 11) {
        return 'показатель';
    } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
        return 'показателя';
    } else {
        return 'показателей';
    }
};

const getScoreWord = (count) => {
    if (count % 10 === 1 && count % 100 !== 11) {
        return 'оценка';
    } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
        return 'оценки';
    } else {
        return 'оценок';
    }
};

const downloadReport = async () => {
    downloading.value = true;
    try {
        const response = await axiosInstance.get(`/api/rating/season/${seasonId.value}/report/excel`, {
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        const fileName = `rating_report_${certainSeason.value.title.replace('/', '_')}.xlsx`;

        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        window.dispatchEvent(new CustomEvent('toast', {
            detail: {
                severity: 'success',
                summary: 'Рейтинг',
                detail: 'Excel отчет успешно скачан',
            }
        }));

    } catch (error) {
        console.error('Ошибка при скачивании Excel отчета: ', error);
        
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { 
                severity: 'error', 
                summary: 'Рейтинг', 
                detail: 'Ошибка при скачивании Excel отчета',
            }
        }));
    } finally {
        downloading.value = false;
    }
}

// Computed properties
const headerStats = computed(() => [
    {
        icon: 'pi pi-chart-line',
        value: certainSeason.value.indicatorsCount,
        label: 'Показатели'
    },
    {
        icon: 'pi pi-users',
        value: certainSeason.value.pointsCount,
        label: 'Оценки'
    },
    {
        icon: 'pi pi-calendar',
        value: certainSeason.value?.title ? getQuarterPeriod(certainSeason.value.title.split('/')[1]) : '—',
        label: 'Период оценки'
    }
]);

const totalIndicators = computed(() => rawIndicators.value.length);

const getEmployeeScoresCountForIndicator = (indicatorId) => {
    return employeeIndicatorValues.value.filter(eiv => 
        eiv.indicator.id === indicatorId && eiv.season.id === seasonId.value
    ).length;
};

const groupedIndicators = computed(() => {
    const groupsMap = {};

    rawIndicators.value.forEach(ind => {
        const hasParentGroup = !!ind.groupIndicator?.parentGroupIndicator;

        const mainGroup = hasParentGroup
            ? ind.groupIndicator?.parentGroupIndicator?.title
            : ind.groupIndicator?.title || "—";
        
        const subGroup = hasParentGroup 
            ? ind.groupIndicator?.title 
            : "—";

        const mainGroupNum = hasParentGroup 
            ? ind.groupIndicator?.parentGroupIndicator?.numberInOrder 
            : ind.groupIndicator?.numberInOrder || 'N';
            
        const subGroupNum = hasParentGroup 
            ? ind.groupIndicator?.numberInOrder 
            : 'N';

        const indNum = ind.numberInOrder || 'N';

        const employeeScoresCount = getEmployeeScoresCountForIndicator(ind.id);

        if (!groupsMap[mainGroup]) {
            groupsMap[mainGroup] = { 
                mainGroupNum, 
                mainGroup, 
                subGroups: {}, 
                totalEmployeeScores: 0 
            };
        }

        if (!groupsMap[mainGroup].subGroups[subGroup]) {
            groupsMap[mainGroup].subGroups[subGroup] = {
                subGroupNum,
                subGroup,
                uniqueKey: `${mainGroup}_${subGroup}`,
                indicators: [],
                totalEmployeeScores: 0
            };
        }

        // Формируем полный номер показателя
        let indicatorFullNumber;
        if (hasParentGroup) {
            // Двухуровневая структура: группа.подгруппа.показатель
            indicatorFullNumber = `${mainGroupNum}${subGroupNum !== 'N' ? '.' + subGroupNum : ''}${indNum !== 'N' ? '.' + indNum : ''}`;
        } else {
            // Одноуровневая структура: группа.показатель
            indicatorFullNumber = `${mainGroupNum}${indNum !== 'N' ? '.' + indNum : '.N.N'}`;
        }

        groupsMap[mainGroup].subGroups[subGroup].indicators.push({
            id: ind.id,
            number: indicatorFullNumber,
            indicator: ind.title,
            periodicity: ind.periodicityIndicators?.map(p => p.title).join(", ") || "",
            responsible: ind.responsibleIndicators?.map(r => r.title).join(", ") || "",
            employeeScoresCount: employeeScoresCount,
            raw: ind
        });

        groupsMap[mainGroup].subGroups[subGroup].totalEmployeeScores += employeeScoresCount;
        groupsMap[mainGroup].totalEmployeeScores += employeeScoresCount;
    });

    return Object.values(groupsMap).map(group => ({
        ...group,
        subGroups: Object.values(group.subGroups)
    }));
});

const treeNodes = computed(() => {
    return buildTreeNodes(groupedIndicators.value);
});

// Methods
const goBack = () => router.push(returnTo.value);

const calculateIndicatorsTotal = (mainGroupName) => {
    return rawIndicators.value.filter(ind => {
        const hasParentGroup = !!ind.groupIndicator?.parentGroupIndicator;
        const indicatorMainGroup = hasParentGroup 
            ? ind.groupIndicator?.parentGroupIndicator?.title 
            : ind.groupIndicator?.title || "—";
        return indicatorMainGroup === mainGroupName;
    }).length;
};

const buildTreeNodes = (groups) => {
    return groups.map((g, gIndex) => {
        const groupKey = `group_${gIndex}_${g.mainGroup}`;
        
        const subNodes = g.subGroups.map((s, sIndex) => {
            const subKey = `sub_${gIndex}_${sIndex}_${s.uniqueKey}`;
            const indicatorNodes = s.indicators.map(ind => ({
                key: String(ind.id),
                data: { ...ind, isGroup: false, isSubGroup: false, raw: ind.raw }
            }));
            
            const subgroupNumber = s.subGroup === "—" ? 'N' : `${g.mainGroupNum}${s.subGroupNum !== 'N' ? '.' + s.subGroupNum : ''}`;
            
            return {
                key: subKey,
                data: {
                    number: subgroupNumber,
                    subGroup: s.subGroup, 
                    isGroup: false, 
                    isSubGroup: true, 
                    totalEmployeeScores: s.totalEmployeeScores 
                },
                children: indicatorNodes
            };
        });

        return {
            key: groupKey,
            data: {
                number: g.mainGroupNum,
                group: g.mainGroup, 
                isGroup: true, 
                isSubGroup: false, 
                totalEmployeeScores: g.totalEmployeeScores 
            },
            children: subNodes
        };
    });
};

const onToggle = (e) => {
    expandedKeys.value = e.value || {};
    syncAllExpanded();
};

const openIndicatorDialog = (node) => {
    if (!node.data.isGroup && !node.data.isSubGroup) {
        selectedIndicator.value = node.data;
        dialogVisible.value = true;
    }
};

const syncAllExpanded = () => {
    const totalGroups = groupedIndicators.value.length;
    const totalSubGroups = groupedIndicators.value.reduce((acc, g) => acc + g.subGroups.length, 0);
    const expandedCount = Object.keys(expandedKeys.value).length;
    allExpanded.value = (expandedCount >= (totalGroups + totalSubGroups));
};

const expandAll = () => {
    const keys = {};
    groupedIndicators.value.forEach((g, gi) => {
        const groupKey = `group_${gi}_${g.mainGroup}`;
        keys[groupKey] = true;
        g.subGroups.forEach((s, si) => {
            const subKey = `sub_${gi}_${si}_${s.uniqueKey}`;
            keys[subKey] = true;
        });
    });
    expandedKeys.value = keys;
    allExpanded.value = true;
};

const collapseAll = () => {
    expandedKeys.value = {};
    allExpanded.value = false;
};

const toggleAllExpanded = () => {
    allExpanded.value ? collapseAll() : expandAll();
};

const rowClass = ({ node }) => {
    if (!node) return '';
    const isIndicator = !node.data.isGroup && !node.data.isSubGroup;
    if (isIndicator && String(node.key) === String(lastAddedIndicatorId.value)) {
        return 'highlighted-row';
    }
    return '';
};

const onIndicatorAdded = (id) => {
    lastAddedIndicatorId.value = id;
    fetchIndicators();
};

const fetchIndicators = async () => {
    loading.value = true;
    try {
        const [
            { data: indicatorsData }, 
            { data: seasonData }, 
            { data: employeeValuesData },
            { data: employeesData }
        ] = await Promise.all([
            axiosInstance.get(`/api/rating/seasons/${seasonId.value}/indicators`),
            axiosInstance.get(`/api/rating/seasons/${seasonId.value}`),
            axiosInstance.get('/api/rating/employee-indicators-value'),
            axiosInstance.get('/api/rating/employees')
        ]);

        rawIndicators.value = indicatorsData || [];
        certainSeason.value = seasonData || {};
        employeeIndicatorValues.value = employeeValuesData  || [];
        employees.value = employeesData?.employees || [];
    } catch (error) {
        console.error('Ошибка при загрузке: ', error);
        rawIndicators.value = [];
        certainSeason.value = {};
        employeeIndicatorValues.value = [];
        employees.value = [];
    } finally {
        loading.value = false;
    }
};

onMounted(fetchIndicators);
</script>

<style scoped>

.content-wrapper {
    padding: 1.5rem;
    margin: 0 auto;
    width: 100%;
}

/* Header Styles */
.app-header {
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 1.5rem 2rem;
    margin-bottom: 1.5rem;
    border: 2px solid var(--p-grey-7);
}

.header-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.header-main {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
}

.navigation-section {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
}

.back-button {
    color: var(--p-primary-color) !important;
    border-radius: 12px;
    padding: 0.75rem;
    transition: all 0.3s ease;
}

.back-button:hover {
    background: rgba(var(--p-primary-color), 0.1) !important;
    transform: translateX(-2px);
}

.title-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.page-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, var(--p-primary-color), #3498db);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.season-badge {
    background: linear-gradient(135deg, var(--p-primary-color), #3498db);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 4px 12px rgba(var(--p-primary-color), 0.3);
}

.badge-icon {
    font-size: 0.875rem;
}

/* Stats Section */
.stats-section {
    display: flex;
    gap: 1rem;
}

.stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: .75rem 1.25rem;
    background: var(--p-grey-7);
    border-radius: 16px;
    min-width: 220px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.stat-card:hover {
    transform: translateY(-2px);
}

.stat-graphic {
    position: relative;
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.stat-card-0 .stat-graphic {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card-1 .stat-graphic {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card-2 .stat-graphic {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon {
    color: white;
    font-size: 1.25rem;
    z-index: 2;
    position: relative;
}

.stat-wave {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 14px;
}

.stat-info {
    display: flex;
    flex-direction: column;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--p-text-color);
}

.stat-card:last-child {
    .stat-value {
        font-size: .85rem;
    }
}

.stat-label {
    font-size: 0.875rem;
    color: var(--p-grey-2);
    font-weight: 500;
}

/* Main Content */
.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.content-card {
    border-radius: 20px;
    padding: 2rem;
    border: 2px solid var(--p-grey-7);
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.table-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

/* Toolbar */
.toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--p-grey-4);
}

.toggle-button {
    border-radius: 12px;
    padding: 0.75rem 1.5rem;
    font-weight: 600;
}

.table-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0; /* Важно для flex-контейнера */
}

/* Table Styles */
.indicators-table {
    border: none;
    border-radius: 12px;
    overflow: hidden;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.indicators-table :deep(.p-treetable) {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.indicators-table :deep(.p-treetable-wrapper) {
    flex: 1;
    display: flex;
    flex-direction: column;
}
.indicators-table :deep(.p-treetable-table) {
    border-radius: 0px;
    flex: 1;
}

.indicators-table :deep(.p-treetable-thead > tr > th) {
    background: var(--p-grey-3);
    color: var(--p-text-color);
    border: none;
    padding: 1rem;
    font-weight: 600;
}

.indicators-table :deep(.p-treetable-tbody > tr > td) {
    border-bottom: 1px solid var(--p-grey-3);
    padding: 1rem;
    background: transparent;
}



/* Node Styles */
.node-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.group-node, .subgroup-node {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
}

.group-icon {
    color: #667eea;
    font-size: 1.5rem;
}

.subgroup-icon {
    color: #f093fb;
    font-size: 1.25rem;
}

.group-info, .subgroup-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.group-header, .subgroup-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.group-stats, .subgroup-stats {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    color: #7f8c8d;
}

.group-stats span, .subgroup-stats span {
    display: flex;
    align-items: center;
    cursor: help;
}

.group-name {
    font-weight: 700;
    color: var(--p-text-color);
    font-size: 1.1rem;
}

.subgroup-name {
    font-weight: 600;
    color: var(--p-text-color);
}

.group-stats, .subgroup-stats {
    font-size: 0.875rem;
    color: #7f8c8d;
}

.indicator-node {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 8px;
    transition: background-color 0.3s ease;
}

.indicator-node:hover {
    background-color: rgba(var(--p-primary-color), 0.05);
}

.indicator-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.indicator-number {
    background: var(--p-primary-color);
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    min-width: 40px;
    text-align: center;
}

.indicator-name {
    font-weight: 600;
    color: var(--p-text-color);
}

.indicator-meta {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.meta-tag {
    border-radius: 8px;
    font-size: 0.75rem;
}

.actions {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
}

.action-btn {
    border-radius: 8px;
    transition: all 0.3s ease;
}

.action-btn:hover {
    background: rgba(var(--p-primary-color), 0.1) !important;
    transform: scale(1.05);
}

/* Empty State */
.empty-indicators {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    text-align: center;
}

.empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    max-width: 400px;
}

.empty-icon {
    font-size: 4rem;
    color: #bdc3c7;
    margin-bottom: 1rem;
}

.empty-content h3 {
    color: #2c3e50;
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
}

.empty-content p {
    color: #7f8c8d;
    margin: 0;
    line-height: 1.5;
}

.empty-action {
    margin-top: 1rem;
}

/* Highlight Animation */
:deep(.highlighted-row) {
    background: linear-gradient(90deg, rgba(var(--p-primary-color), 0.1) 0%, transparent 100%) !important;
    animation: highlight-pulse 2s ease-in-out;
}

@keyframes highlight-pulse {
    0% { background: linear-gradient(90deg, rgba(var(--p-primary-color), 0.3) 0%, transparent 100%); }
    50% { background: linear-gradient(90deg, rgba(var(--p-primary-color), 0.1) 0%, transparent 100%); }
    100% { background: linear-gradient(90deg, rgba(var(--p-primary-color), 0.05) 0%, transparent 100%); }
}

/* Responsive Design */
@media (max-width: 1200px) {
    .header-main {
        flex-direction: column;
        gap: 1.5rem;
    }

    .stats-section {
        width: 100%;
        justify-content: space-between;
    }
}

@media (max-width: 768px) {
    .content-wrapper {
        padding: 1rem;
    }
    
    .app-header {
        padding: 1rem;
        border-radius: 16px;
    }
    
    .stats-section {
        flex-direction: column;
    }
    
    .stat-card {
        min-width: auto;
    }
    
    .page-title {
        font-size: 1.5rem;
    }
    
    .content-card {
        padding: 1rem;
        border-radius: 16px;
    }
    
    .toolbar {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }
    
    .toolbar-left, .toolbar-right {
        display: flex;
        justify-content: center;
    }
}

@media (max-width: 480px) {
    .navigation-section {
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .title-section {
        align-items: center;
        text-align: center;
    }
    
    .node-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
}
</style>
