<template>
    <div class="roadmap-tree">
        <article
            v-for="node in nodes"
            :key="node.id"
            class="roadmap-node"
            :style="{ '--roadmap-level': level }"
        >
            <div class="roadmap-node-line"></div>
            <div class="roadmap-node-card">
                <div class="roadmap-node-head">
                    <div>
                        <div class="roadmap-node-order">Шаг {{ node.order || '—' }}</div>
                        <h4>{{ node.title || 'Без названия' }}</h4>
                    </div>
                    <Tag :severity="node.isCompleted ? 'success' : 'secondary'" :value="node.isCompleted ? 'Выполнен' : 'В работе'" />
                </div>

                <div class="roadmap-node-meta">
                    <span><i class="pi pi-calendar me-2"></i>{{ formatDateRuLong(node.startDate, 'Дата не указана') }}</span>
                    <span><i class="pi pi-calendar-clock me-2"></i>{{ formatDateRuLong(node.endDate, 'Срок не указан') }}</span>
                    <span><i class="pi pi-user me-2"></i>{{ buildProjectShowcaseFullName(node.executor?.user || node.executor) }}</span>
                </div>

                <p v-if="node.expectedResult" class="roadmap-node-text">
                    <strong>Ожидаемый результат:</strong> {{ node.expectedResult }}
                </p>
                <p v-if="node.comment" class="roadmap-node-text">
                    <strong>Комментарий:</strong> {{ node.comment }}
                </p>
                <p v-if="node.confirmationFormat" class="roadmap-node-text">
                    <strong>Формат подтверждения:</strong> {{ node.confirmationFormat }}
                </p>
            </div>

            <div v-if="node.roadMapItems?.length" class="roadmap-children">
                <ProjectRoadMapTree :nodes="node.roadMapItems" :level="level + 1" />
            </div>
        </article>
    </div>
</template>

<script setup>
import { formatDateRuLong } from '@/utils/date.js';
import { buildProjectShowcaseFullName } from '@/utils/projectShowcase.js';

defineProps({
    nodes: {
        type: Array,
        default: () => [],
    },
    level: {
        type: Number,
        default: 0,
    },
});
</script>

<style scoped>
.roadmap-tree {
    display: flex;
    flex-direction: column;
    gap: 0.95rem;
}

.roadmap-node {
    position: relative;
    padding-left: calc(var(--roadmap-level) * 1.2rem);
}

.roadmap-node-line {
    position: absolute;
    top: 0;
    left: calc(var(--roadmap-level) * 1.2rem + 0.7rem);
    width: 2px;
    height: 100%;
    background: linear-gradient(180deg, rgba(var(--p-blue-500-rgb), 0.24), transparent);
}

.roadmap-node-card {
    position: relative;
    margin-left: 1.4rem;
    padding: 1rem 1.1rem;
    border-radius: 18px;
    background: var(--p-content-background);
    border: 1px solid var(--p-content-border-color);
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
}

.roadmap-node-card::before {
    content: '';
    position: absolute;
    top: 1.35rem;
    left: -0.82rem;
    width: 0.82rem;
    height: 2px;
    background: rgba(var(--p-blue-500-rgb), 0.24);
}

.roadmap-node-head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
}

.roadmap-node-order {
    color: var(--p-grey-1);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.roadmap-node-head h4 {
    margin: 0.2rem 0 0;
    font-size: 1rem;
}

.roadmap-node-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1rem;
    margin-top: 0.8rem;
    color: var(--p-grey-1);
    font-size: 0.92rem;
}

.roadmap-node-text {
    margin: 0.8rem 0 0;
    color: var(--p-grey-1);
}

.roadmap-children {
    margin-top: 0.8rem;
}

@media (max-width: 768px) {
    .roadmap-node {
        padding-left: calc(var(--roadmap-level) * 0.7rem);
    }

    .roadmap-node-line {
        left: calc(var(--roadmap-level) * 0.7rem + 0.6rem);
    }

    .roadmap-node-card {
        margin-left: 1.1rem;
    }
}
</style>
