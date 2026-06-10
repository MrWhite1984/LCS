<template>
    <main class="ml-page">
        <div class="ml-dashboard">
            <section class="ml-hero">
                <div>
                    <span class="ml-kicker">Аналитика студентов</span>
                    <h1>Мониторинг академических рисков студентов</h1>
                    <p>
                        Прогнозирование вероятности академической задолженности по посещаемости, активности в ЛКС,
                        текущим оценкам и истории сессий.
                    </p>
                </div>
                <div class="hero-summary">
                    <span>Прогноз на 21 день</span>
                    <strong>86.4%</strong>
                    <small>выявление высокого риска</small>
                </div>
            </section>

            <section class="snapshot-strip" aria-label="Параметры среза данных">
                <div v-for="item in snapshot" :key="item.label" class="snapshot-item">
                    <span>{{ item.label }}</span>
                    <strong>{{ item.value }}</strong>
                </div>
            </section>

            <section class="ml-risk-grid" aria-label="Ключевые метрики">
                <article v-for="metric in summaryMetrics" :key="metric.title" class="risk-card" :class="metric.level">
                    <div class="risk-icon">
                        <i :class="metric.icon"></i>
                    </div>
                    <div class="risk-copy">
                        <span>{{ metric.title }}</span>
                        <strong>{{ metric.value }}</strong>
                        <small>{{ metric.caption }}</small>
                        <em>{{ metric.trend }}</em>
                    </div>
                </article>
            </section>

            <section class="chart-grid">
                <article class="analytics-panel chart-panel-wide">
                    <div class="panel-heading compact">
                        <div>
                            <h2>Динамика точности прогноза</h2>
                            <p>Выявление высокого риска на подтвержденных исходах сессии</p>
                        </div>
                    </div>

                    <div class="line-chart" aria-label="Линейный график качества моделей">
                        <div class="chart-canvas-wrap line-canvas-wrap">
                            <canvas ref="qualityChartRef"></canvas>
                        </div>
                        <div class="chart-metric-row">
                            <span>Текущая выявляемость</span>
                            <strong>{{ latestQualityValue }}%</strong>
                        </div>
                    </div>
                </article>

                <article class="analytics-panel chart-panel-side">
                    <div class="panel-heading compact">
                        <div>
                            <h2>Распределение риска</h2>
                            <p>Активный контингент, включенный в расчет</p>
                        </div>
                    </div>

                    <div class="donut-layout">
                        <div class="chart-canvas-wrap donut-canvas-wrap" aria-label="Распределение студенческих расчетов">
                            <canvas ref="riskChartRef"></canvas>
                            <div class="donut-center">
                                <strong>2 846</strong>
                                <span>студентов</span>
                            </div>
                            <div ref="riskTooltipRef" class="chart-tooltip" role="status"></div>
                        </div>
                        <div class="donut-legend">
                            <div v-for="item in taskDistribution" :key="item.label" class="legend-item">
                                <span :style="{ backgroundColor: item.color }"></span>
                                <div>
                                    <strong>{{ item.label }}</strong>
                                    <small>{{ item.count }} студентов · {{ item.value }}%</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </article>
            </section>

            <section class="factor-grid" aria-label="Ключевые факторы риска">
                <article v-for="factor in riskFactors" :key="factor.title" class="factor-card">
                    <div class="factor-top">
                        <span class="factor-icon" :style="{ color: factor.color, backgroundColor: factor.background }">
                            <i :class="factor.icon"></i>
                        </span>
                        <strong>{{ factor.value }}</strong>
                    </div>
                    <h3>{{ factor.title }}</h3>
                    <p>{{ factor.caption }}</p>
                    <div class="factor-bar" :aria-label="`${factor.title}: ${factor.share}%`">
                        <span :style="{ width: `${factor.share}%`, backgroundColor: factor.color }"></span>
                    </div>
                </article>
            </section>

            <section class="analytics-panel action-panel">
                <div class="panel-heading">
                    <div>
                        <h2>Очередь действий</h2>
                        <p>Группы и сегменты, где куратору стоит проверить динамику</p>
                    </div>
                    <i class="pi pi-users"></i>
                </div>

                <div class="model-table-wrap">
                    <table class="model-table">
                        <thead>
                            <tr>
                                <th>Группа / сегмент</th>
                                <th>Студентов</th>
                                <th>Риск</th>
                                <th>Фактор</th>
                                <th>Действие</th>
                                <th>Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="model in models" :key="model.name">
                                <td>
                                    <strong>{{ model.name }}</strong>
                                    <span>{{ model.pipeline }}</span>
                                </td>
                                <td>{{ model.students }}</td>
                                <td>
                                    <span class="risk-score" :class="model.risk">{{ model.riskScore }}</span>
                                </td>
                                <td>
                                    <span class="drift-dot" :class="model.risk"></span>
                                    {{ model.factor }}
                                </td>
                                <td>{{ model.action }}</td>
                                <td>
                                    <span class="status-pill" :class="model.risk">{{ model.status }}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section class="analytics-panel retrospective-panel">
                <div class="panel-heading">
                    <div>
                        <h2>Ретроспектива по студентам</h2>
                        <p>Сравнение с предыдущим семестром и подтвержденными исходами сессии</p>
                    </div>
                    <i class="pi pi-history"></i>
                </div>

                <div class="retrospective-grid">
                    <article v-for="item in retrospective" :key="item.label" class="retro-item">
                        <div class="retro-head">
                            <span>{{ item.label }}</span>
                            <strong>{{ item.value }}</strong>
                        </div>
                        <div class="retro-bar">
                            <span :style="{ width: `${item.progress}%`, backgroundColor: item.color }"></span>
                        </div>
                        <small>{{ item.caption }}</small>
                    </article>
                </div>
            </section>
        </div>
    </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import {
    ArcElement,
    CategoryScale,
    Chart,
    DoughnutController,
    Filler,
    Legend,
    LineController,
    LineElement,
    LinearScale,
    PointElement,
    Tooltip,
} from 'chart.js';

Chart.register(
    ArcElement,
    CategoryScale,
    DoughnutController,
    Filler,
    Legend,
    LineController,
    LineElement,
    LinearScale,
    PointElement,
    Tooltip,
);

const qualityChartRef = ref(null);
const riskChartRef = ref(null);
const riskTooltipRef = ref(null);
let qualityChart = null;
let riskChart = null;

const snapshot = [
    { label: 'Период', value: 'Весна 2025/26' },
    { label: 'Обновлено', value: '10.06.2026 09:42' },
    { label: 'Источник', value: 'ЛКС + ведомости' },
    { label: 'Горизонт прогноза', value: '21 день' },
];

const summaryMetrics = [
    {
        title: 'Высокий риск',
        value: '181',
        caption: '6.4% активного контингента',
        trend: '+23 к прошлой неделе',
        level: 'high',
        icon: 'pi pi-exclamation-triangle',
    },
    {
        title: 'Умеренный риск',
        value: '507',
        caption: '17.8% требуют наблюдения',
        trend: '-4.1 п.п. за месяц',
        level: 'medium',
        icon: 'pi pi-clock',
    },
    {
        title: 'Низкий риск',
        value: '2 058',
        caption: '72.3% без критичных отклонений',
        trend: '+6.8 п.п. за семестр',
        level: 'low',
        icon: 'pi pi-check-circle',
    },
];

const models = [
    {
        name: 'ГР-101',
        pipeline: '1 курс / прикладная информатика',
        students: '28',
        riskScore: '31%',
        factor: 'посещаемость 68%',
        action: 'проверить пропуски',
        risk: 'medium',
        status: 'наблюдение',
    },
    {
        name: 'ГР-102',
        pipeline: '1 курс / прикладная информатика',
        students: '31',
        riskScore: '47%',
        factor: '3+ пропуска за 14 дней',
        action: 'связаться до пятницы',
        risk: 'high',
        status: 'высокий',
    },
    {
        name: '1202',
        pipeline: '2 курс / строительство',
        students: '24',
        riskScore: '39%',
        factor: 'средний балл 3.18',
        action: 'назначить консультации',
        risk: 'high',
        status: 'высокий',
    },
    {
        name: '503',
        pipeline: '3 курс / транспортные системы',
        students: '27',
        riskScore: '12%',
        factor: 'активность ЛКС +8%',
        action: 'без вмешательства',
        risk: 'low',
        status: 'низкий',
    },
    {
        name: 'Индивидуальный план',
        pipeline: 'студенты с академической разницей',
        students: '43',
        riskScore: '28%',
        factor: '2 незакрытые дисциплины',
        action: 'сверить ИУП',
        risk: 'medium',
        status: 'наблюдение',
    },
];

const qualitySeries = [
    { month: 'ЯНВ', value: 76 },
    { month: 'ФЕВ', value: 78 },
    { month: 'МАР', value: 81 },
    { month: 'АПР', value: 83 },
    { month: 'МАЙ', value: 84 },
    { month: 'ИЮН', value: 86 },
];

const taskDistribution = [
    { label: 'Низкий риск', value: 72.3, count: '2 058', color: '#2fbf9f' },
    { label: 'Умеренный риск', value: 17.8, count: '507', color: '#f5bd2d' },
    { label: 'Высокий риск', value: 6.4, count: '181', color: '#ef4444' },
    { label: 'Нет данных', value: 3.5, count: '100', color: '#3b82f6' },
];

const riskFactors = [
    {
        title: 'Падение посещаемости',
        value: '312',
        caption: 'студентов снизили посещаемость больше чем на 20 п.п. за месяц',
        icon: 'pi pi-calendar-minus',
        color: '#b91c1c',
        background: 'rgba(239, 68, 68, 0.12)',
        share: 73,
    },
    {
        title: 'Низкая активность в ЛКС',
        value: '428',
        caption: 'нет входов, просмотров материалов или отправок работ 7+ дней',
        icon: 'pi pi-chart-line',
        color: '#a16207',
        background: 'rgba(245, 189, 45, 0.16)',
        share: 100,
    },
    {
        title: 'Академические долги',
        value: '236',
        caption: 'есть незакрытые контрольные точки или задолженности по дисциплинам',
        icon: 'pi pi-file-check',
        color: '#2563eb',
        background: 'rgba(59, 130, 246, 0.12)',
        share: 55,
    },
    {
        title: 'Положительная динамика',
        value: '143',
        caption: 'студента вышли из зоны риска после консультаций и пересдач',
        icon: 'pi pi-arrow-up-right',
        color: '#138a72',
        background: 'rgba(47, 191, 159, 0.14)',
        share: 33,
    },
];

const retrospective = [
    {
        label: 'Средняя посещаемость',
        value: '82.6%',
        progress: 83,
        caption: '+4.1 п.п. к предыдущему семестру',
        color: '#2fbf9f',
    },
    {
        label: 'Охват расчета',
        value: '2 846',
        progress: 92,
        caption: '92% студентов с полными данными',
        color: '#3b82f6',
    },
    {
        label: 'Выявление высокого риска',
        value: '86.4%',
        progress: 86,
        caption: 'по исходам зимней сессии 2025/26',
        color: '#22c55e',
    },
    {
        label: 'Закрыли риск',
        value: '143',
        progress: 64,
        caption: 'после консультаций и пересдач',
        color: '#f59e0b',
    },
];

const latestQualityValue = computed(() => qualitySeries[qualitySeries.length - 1]?.value || 0);

const getChartPalette = () => {
    const styles = getComputedStyle(document.documentElement);

    return {
        text: styles.getPropertyValue('--p-text-color').trim() || '#1f2937',
        muted: styles.getPropertyValue('--p-text-muted-color').trim()
            || styles.getPropertyValue('--p-grey-1').trim()
            || '#64748b',
        grid: styles.getPropertyValue('--p-grey-4').trim() || 'rgba(148, 163, 184, 0.35)',
        surface: styles.getPropertyValue('--p-bg-color-1').trim() || '#ffffff',
        blue: '#2f7dd1',
    };
};

const createQualityChart = () => {
    if (!qualityChartRef.value) return;

    const palette = getChartPalette();
    const ctx = qualityChartRef.value.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, 'rgba(47, 125, 209, 0.3)');
    gradient.addColorStop(1, 'rgba(47, 125, 209, 0.02)');

    qualityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: qualitySeries.map((item) => item.month),
            datasets: [
                {
                    label: 'Выявление высокого риска',
                    data: qualitySeries.map((item) => item.value),
                    borderColor: palette.blue,
                    backgroundColor: gradient,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: palette.blue,
                    pointBorderColor: palette.surface,
                    pointBorderWidth: 3,
                    fill: true,
                    tension: 0.38,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1100,
                easing: 'easeOutQuart',
            },
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    callbacks: {
                    label: (context) => ` Выявление: ${context.parsed.y}%`,
                    },
                    displayColors: false,
                    padding: 10,
                },
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                    },
                    ticks: {
                        color: palette.muted,
                        font: {
                            size: 11,
                            weight: 700,
                        },
                    },
                    border: {
                        display: false,
                    },
                },
                y: {
                    min: 72,
                    max: 88,
                    ticks: {
                        stepSize: 4,
                        color: palette.muted,
                        callback: (value) => `${value}%`,
                        font: {
                            size: 11,
                            weight: 700,
                        },
                    },
                    grid: {
                        color: palette.grid,
                        drawTicks: false,
                    },
                    border: {
                        display: false,
                    },
                },
            },
        },
    });
};

const createRiskChart = () => {
    if (!riskChartRef.value) return;

    const palette = getChartPalette();
    const ctx = riskChartRef.value.getContext('2d');

    riskChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: taskDistribution.map((item) => item.label),
            datasets: [
                {
                    data: taskDistribution.map((item) => item.value),
                    backgroundColor: taskDistribution.map((item) => item.color),
                    borderColor: palette.surface,
                    borderWidth: 4,
                    hoverOffset: 8,
                    spacing: 2,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1050,
                easing: 'easeOutQuart',
            },
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    enabled: false,
                    external: ({ tooltip }) => {
                        const tooltipEl = riskTooltipRef.value;

                        if (!tooltipEl) return;

                        if (!tooltip || tooltip.opacity === 0 || !tooltip.dataPoints?.length) {
                            tooltipEl.style.opacity = '0';
                            return;
                        }

                        const point = tooltip.dataPoints[0];
                        const item = taskDistribution[point.dataIndex];
                        const shift = tooltip.caretX > 82 ? 'translate(-100%, -50%)' : 'translate(14px, -50%)';

                        tooltipEl.innerHTML = `
                            <strong>${item.label}</strong>
                            <span>${item.count} студентов · ${item.value}%</span>
                        `;
                        tooltipEl.style.opacity = '1';
                        tooltipEl.style.left = `${tooltip.caretX}px`;
                        tooltipEl.style.top = `${tooltip.caretY}px`;
                        tooltipEl.style.transform = shift;
                    },
                },
            },
        },
    });
};

onMounted(async () => {
    await nextTick();
    createQualityChart();
    createRiskChart();
});

onBeforeUnmount(() => {
    qualityChart?.destroy();
    riskChart?.destroy();
});
</script>

<style scoped>
.ml-page {
    height: 100%;
    overflow: auto;
    color: var(--p-text-color);
}

.ml-dashboard {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: var(--app-page-padding-y) var(--app-page-padding-x) 1.5rem;
    min-width: 0;
}

.ml-hero {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1.25rem;
    padding: 1.2rem;
    border-radius: 12px;
    border: 1px solid color-mix(in srgb, var(--p-blue-500) 12%, var(--p-grey-4));
    background:
        linear-gradient(135deg, color-mix(in srgb, #2f7dd1 10%, transparent), transparent 42%),
        var(--p-bg-color-1);
}

.ml-kicker {
    display: inline-flex;
    margin-bottom: 0.75rem;
    padding: 0.35rem 0.72rem;
    border-radius: 8px;
    background: rgba(47, 191, 159, 0.14);
    color: #138a72;
    font-size: 0.78rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.ml-hero h1 {
    max-width: 820px;
    margin: 0;
    font-size: clamp(1.9rem, 4vw, 3.05rem);
    line-height: 1.08;
    letter-spacing: 0;
}

.ml-hero p {
    max-width: 860px;
    margin: 0.75rem 0 0;
    color: var(--p-text-muted-color, var(--p-grey-1));
    font-size: 1.02rem;
    line-height: 1.5;
}

.hero-summary {
    display: grid;
    gap: 0.25rem;
    min-width: 190px;
    padding: 1rem;
    border-radius: 10px;
    border: 1px solid var(--p-grey-4);
    background: color-mix(in srgb, var(--p-bg-color-1) 88%, #2f7dd1);
}

.hero-summary span,
.hero-summary small {
    color: var(--p-text-muted-color, var(--p-grey-1));
    font-size: 0.82rem;
}

.hero-summary strong {
    color: #2f7dd1;
    font-size: 2rem;
    line-height: 1;
}

.snapshot-strip {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.75rem;
    padding: 0.85rem;
    border-radius: 8px;
    border: 1px solid var(--p-grey-4);
    background: var(--p-bg-color-1);
}

.snapshot-item {
    display: grid;
    gap: 0.25rem;
    padding: 0.15rem 0.35rem;
    min-width: 0;
}

.snapshot-item span {
    color: var(--p-text-muted-color, var(--p-grey-1));
    font-size: 0.78rem;
    text-transform: uppercase;
}

.snapshot-item strong {
    font-size: 0.98rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.ml-risk-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.9rem;
}

.risk-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-height: 116px;
    padding: 1.1rem 1.2rem;
    border-radius: 8px;
    color: var(--p-text-color);
    border: 1px solid transparent;
    box-shadow: 0 10px 20px rgba(15, 23, 42, 0.06);
    transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.risk-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 18px 34px rgba(15, 23, 42, 0.14);
}

.risk-card.high {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.16), rgba(239, 68, 68, 0.05));
    border-color: rgba(239, 68, 68, 0.22);
}

.risk-card.medium {
    background: linear-gradient(135deg, rgba(245, 189, 45, 0.18), rgba(245, 189, 45, 0.06));
    border-color: rgba(245, 158, 11, 0.24);
}

.risk-card.low {
    background: linear-gradient(135deg, rgba(47, 191, 159, 0.17), rgba(47, 191, 159, 0.05));
    border-color: rgba(47, 191, 159, 0.24);
}

.risk-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: var(--p-bg-color-1);
    flex: 0 0 auto;
}

.risk-card.high .risk-icon i {
    color: #dc2626;
}

.risk-card.medium .risk-icon i {
    color: #b45309;
}

.risk-card.low .risk-icon i {
    color: #138a72;
}

.risk-icon i {
    font-size: 1.45rem;
}

.risk-copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.risk-copy span {
    color: var(--p-text-muted-color, var(--p-grey-1));
    font-size: 0.86rem;
    font-weight: 800;
    text-transform: uppercase;
}

.risk-copy strong {
    font-size: 2.15rem;
    line-height: 1;
}

.risk-copy small {
    margin-top: 0.35rem;
    color: var(--p-text-muted-color, var(--p-grey-1));
}

.risk-copy em {
    margin-top: 0.45rem;
    color: var(--p-text-color);
    font-size: 0.8rem;
    font-style: normal;
    font-weight: 800;
}

.chart-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.75fr);
    gap: 0.9rem;
    align-items: stretch;
}

.analytics-panel {
    padding: 1.15rem;
    border-radius: 8px;
    border: 1px solid var(--p-grey-4);
    background: var(--p-bg-color-1);
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.045);
    min-width: 0;
    transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.analytics-panel:hover,
.factor-card:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--p-blue-500) 24%, var(--p-grey-4));
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
}

.panel-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
}

.panel-heading.compact {
    margin-bottom: 0.75rem;
}

.panel-heading h2 {
    margin: 0;
    font-size: 1.02rem;
    text-transform: uppercase;
}

.panel-heading p {
    margin: 0.35rem 0 0;
    color: var(--p-text-muted-color, var(--p-grey-1));
}

.panel-heading > i {
    color: var(--p-blue-500);
    font-size: 1.3rem;
}

.model-table-wrap {
    overflow-x: auto;
}

.model-table {
    width: 100%;
    min-width: 820px;
    border-collapse: collapse;
}

.model-table th,
.model-table td {
    padding: 0.88rem 0.7rem;
    text-align: left;
    border-bottom: 1px solid var(--p-grey-4);
    vertical-align: middle;
}

.model-table tbody tr {
    transition: background-color 0.16s ease;
}

.model-table tbody tr:hover {
    background: color-mix(in srgb, var(--p-blue-500) 7%, transparent);
}

.model-table th {
    background: var(--p-grey-7);
    color: var(--p-text-muted-color, var(--p-grey-1));
    font-size: 0.78rem;
    text-transform: uppercase;
}

.model-table td strong,
.model-table td span {
    display: block;
}

.model-table td span {
    margin-top: 0.18rem;
    color: var(--p-text-muted-color, var(--p-grey-1));
    font-size: 0.84rem;
}

.drift-dot {
    display: inline-block !important;
    width: 10px;
    height: 10px;
    margin: 0 0.45rem 0 0 !important;
    border-radius: 50%;
    vertical-align: middle;
}

.drift-dot.low,
.status-pill.low {
    background: rgba(47, 191, 159, 0.16);
    color: #138a72;
}

.drift-dot.medium,
.status-pill.medium {
    background: rgba(245, 189, 45, 0.18);
    color: #a16207;
}

.drift-dot.high,
.status-pill.high {
    background: rgba(239, 68, 68, 0.16);
    color: #b91c1c;
}

.drift-dot.low,
.drift-dot.medium,
.drift-dot.high {
    color: transparent;
}

.drift-dot.low {
    background: #2fbf9f;
}

.drift-dot.medium {
    background: #f5bd2d;
}

.drift-dot.high {
    background: #ef4444;
}

.status-pill {
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    margin: 0 !important;
    padding: 0.34rem 0.62rem;
    border-radius: 999px;
    font-size: 0.8rem !important;
    font-weight: 800;
    white-space: nowrap;
}

.risk-score {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 3.2rem;
    padding: 0.34rem 0.58rem;
    border-radius: 8px;
    font-weight: 900;
}

.risk-score.low {
    color: #138a72;
    background: rgba(47, 191, 159, 0.12);
}

.risk-score.medium {
    color: #a16207;
    background: rgba(245, 189, 45, 0.16);
}

.risk-score.high {
    color: #b91c1c;
    background: rgba(239, 68, 68, 0.12);
}

.chart-canvas-wrap {
    position: relative;
    min-width: 0;
}

.chart-canvas-wrap canvas {
    display: block;
    width: 100%;
}

.line-canvas-wrap {
    height: 205px;
}

.chart-metric-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 0.2rem;
    padding: 0.72rem 0.85rem;
    border-radius: 8px;
    background: color-mix(in srgb, #2f7dd1 8%, transparent);
}

.chart-metric-row span {
    color: var(--p-text-muted-color, var(--p-grey-1));
    font-size: 0.88rem;
}

.chart-metric-row strong {
    color: #2f7dd1;
    font-size: 1.18rem;
}

.donut-layout {
    position: relative;
    display: grid;
    grid-template-columns: 150px 1fr;
    gap: 1rem;
    align-items: center;
    min-height: 170px;
}

.donut-canvas-wrap {
    width: 150px;
    height: 150px;
    overflow: visible;
    z-index: 3;
}

.donut-canvas-wrap canvas {
    position: relative;
    z-index: 2;
}

.donut-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 1;
}

.donut-center strong {
    font-size: 1.12rem;
    line-height: 1;
}

.donut-center span {
    margin-top: 0.25rem;
    color: var(--p-text-muted-color, var(--p-grey-1));
    font-size: 0.72rem;
    font-weight: 700;
}

.donut-legend {
    position: relative;
    z-index: 1;
    display: grid;
    gap: 0.75rem;
}

.chart-tooltip {
    position: absolute;
    z-index: 10;
    min-width: 172px;
    max-width: 210px;
    padding: 0.62rem 0.72rem;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--p-blue-500) 18%, var(--p-grey-4));
    background: var(--p-bg-color-1);
    box-shadow: 0 16px 34px rgba(15, 23, 42, 0.18);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.12s ease, transform 0.12s ease;
}

.chart-tooltip strong,
.chart-tooltip span {
    display: block;
}

.chart-tooltip strong {
    font-size: 0.86rem;
}

.chart-tooltip span {
    margin-top: 0.18rem;
    color: var(--p-text-muted-color, var(--p-grey-1));
    font-size: 0.78rem;
    line-height: 1.3;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 0.65rem;
}

.legend-item > span {
    width: 11px;
    height: 11px;
    border-radius: 3px;
    flex: 0 0 auto;
}

.legend-item strong,
.legend-item small {
    display: block;
}

.legend-item small {
    color: var(--p-text-muted-color, var(--p-grey-1));
}

.factor-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.9rem;
}

.factor-card {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    min-width: 0;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid var(--p-grey-4);
    background: var(--p-bg-color-1);
    transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.factor-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
}

.factor-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 8px;
    flex: 0 0 auto;
}

.factor-icon i {
    font-size: 1.05rem;
}

.factor-top strong {
    font-size: 1.45rem;
    line-height: 1;
}

.factor-card h3 {
    margin: 0;
    font-size: 0.98rem;
}

.factor-card p {
    margin: 0;
    color: var(--p-text-muted-color, var(--p-grey-1));
    font-size: 0.9rem;
    line-height: 1.42;
}

.factor-bar {
    height: 7px;
    margin-top: auto;
    overflow: hidden;
    border-radius: 999px;
    background: var(--p-grey-4);
}

.factor-bar span {
    display: block;
    height: 100%;
    border-radius: inherit;
    transform-origin: left center;
}

.retrospective-panel {
    margin-bottom: 0.5rem;
}

.retrospective-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.9rem;
}

.retro-item {
    display: grid;
    gap: 0.7rem;
    padding: 0.95rem;
    border-radius: 8px;
    background: var(--p-grey-7);
    min-width: 0;
}

.retro-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.7rem;
}

.retro-head span {
    color: var(--p-text-muted-color, var(--p-grey-1));
}

.retro-head strong {
    white-space: nowrap;
}

.retro-bar {
    height: 8px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--p-grey-4);
}

.retro-bar span {
    display: block;
    height: 100%;
    border-radius: inherit;
    transform-origin: left center;
}

.retro-item small {
    color: var(--p-text-muted-color, var(--p-grey-1));
    line-height: 1.35;
}

@media (max-width: 1120px) {
    .chart-grid,
    .factor-grid,
    .retrospective-grid {
        grid-template-columns: 1fr 1fr;
    }
}

@media (max-width: 820px) {
    .ml-dashboard {
        padding-bottom: var(--app-mobile-bottom-offset);
    }

    .ml-hero,
    .snapshot-strip,
    .ml-risk-grid,
    .chart-grid,
    .factor-grid,
    .retrospective-grid {
        grid-template-columns: 1fr;
    }

    .ml-hero {
        align-items: stretch;
        flex-direction: column;
    }

    .hero-summary {
        min-width: 0;
    }

    .risk-card {
        min-height: 104px;
    }

    .donut-layout {
        grid-template-columns: 1fr;
        justify-items: center;
    }

    .donut-legend {
        width: 100%;
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 520px) {
    .risk-card {
        align-items: flex-start;
    }

    .risk-copy strong {
        font-size: 1.85rem;
    }

    .donut-legend {
        grid-template-columns: 1fr;
    }
}

@keyframes analyticsFadeUp {
    from {
        opacity: 0;
        transform: translateY(18px);
        filter: blur(6px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
        filter: blur(0);
    }
}

@keyframes analyticsScaleIn {
    from {
        opacity: 0;
        transform: translateY(14px) scale(0.97);
        filter: blur(5px);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0);
    }
}

@keyframes progressGrow {
    from {
        transform: scaleX(0);
    }

    to {
        transform: scaleX(1);
    }
}

@keyframes iconFloat {
    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-3px);
    }
}

@media (prefers-reduced-motion: no-preference) {
    .ml-hero,
    .snapshot-strip,
    .ml-risk-grid,
    .chart-grid,
    .factor-grid,
    .retrospective-panel {
        opacity: 0;
        animation: analyticsFadeUp 0.62s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    .ml-hero {
        animation-delay: 0.02s;
    }

    .snapshot-strip {
        animation-delay: 0.1s;
    }

    .ml-risk-grid {
        animation-delay: 0.18s;
    }

    .chart-grid {
        animation-delay: 0.28s;
    }

    .factor-grid {
        animation-delay: 0.38s;
    }

    .retrospective-panel {
        animation-delay: 0.48s;
    }

    .snapshot-item,
    .risk-card,
    .analytics-panel,
    .factor-card,
    .retro-item {
        opacity: 0;
        animation: analyticsScaleIn 0.58s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    .snapshot-item:nth-child(1) {
        animation-delay: 0.16s;
    }

    .snapshot-item:nth-child(2) {
        animation-delay: 0.21s;
    }

    .snapshot-item:nth-child(3) {
        animation-delay: 0.26s;
    }

    .snapshot-item:nth-child(4) {
        animation-delay: 0.31s;
    }

    .risk-card:nth-child(1) {
        animation-delay: 0.26s;
    }

    .risk-card:nth-child(2) {
        animation-delay: 0.33s;
    }

    .risk-card:nth-child(3) {
        animation-delay: 0.4s;
    }

    .analytics-panel:nth-child(1) {
        animation-delay: 0.36s;
    }

    .analytics-panel:nth-child(2) {
        animation-delay: 0.43s;
    }

    .analytics-panel:nth-child(3) {
        animation-delay: 0.5s;
    }

    .factor-card:nth-child(1) {
        animation-delay: 0.48s;
    }

    .factor-card:nth-child(2) {
        animation-delay: 0.54s;
    }

    .factor-card:nth-child(3) {
        animation-delay: 0.6s;
    }

    .factor-card:nth-child(4) {
        animation-delay: 0.66s;
    }

    .retro-item:nth-child(1) {
        animation-delay: 0.62s;
    }

    .retro-item:nth-child(2) {
        animation-delay: 0.68s;
    }

    .retro-item:nth-child(3) {
        animation-delay: 0.74s;
    }

    .retro-item:nth-child(4) {
        animation-delay: 0.8s;
    }

    .risk-icon,
    .factor-icon {
        animation: iconFloat 3.4s ease-in-out infinite;
    }

    .risk-card:nth-child(2) .risk-icon,
    .factor-card:nth-child(2) .factor-icon {
        animation-delay: 0.5s;
    }

    .risk-card:nth-child(3) .risk-icon,
    .factor-card:nth-child(3) .factor-icon {
        animation-delay: 1s;
    }

    .legend-item {
        opacity: 0;
        animation: analyticsFadeUp 0.42s ease-out forwards;
    }

    .legend-item:nth-child(1) {
        animation-delay: 0.84s;
    }

    .legend-item:nth-child(2) {
        animation-delay: 0.9s;
    }

    .legend-item:nth-child(3) {
        animation-delay: 0.96s;
    }

    .legend-item:nth-child(4) {
        animation-delay: 1.02s;
    }

    .retro-bar span {
        animation: progressGrow 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    }

    .factor-bar span {
        animation: progressGrow 0.85s cubic-bezier(0.22, 1, 0.36, 1) 0.7s forwards;
    }
}
</style>
