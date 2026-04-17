<template>
    <div class="roadmap-tree">
        <article
            v-for="node in nodes"
            :key="node.id"
            class="roadmap-node"
            :style="{ '--roadmap-level': level }"
        >
            <div class="roadmap-node-line"></div>

            <div class="roadmap-node-card" :class="{ 'roadmap-node-card-expanded': isExpanded(node.id) }">
                <div class="roadmap-node-summary">
                    <Button
                        text
                        rounded
                        class="roadmap-node-toggle"
                        :icon="isExpanded(node.id) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                        :aria-label="isExpanded(node.id) ? 'Свернуть шаг' : 'Развернуть шаг'"
                        @click="toggleNode(node.id)"
                    />

                    <div class="roadmap-node-main" @click="toggleNode(node.id)">
                        <div class="roadmap-node-topline">
                            <div class="roadmap-node-order">Задача {{ node.order || '—' }}</div>
                            <Tag v-if="node.isControlPoint" severity="warn" value="Контрольная точка" />
                        </div>

                        <h4>{{ node.title || 'Без названия' }}</h4>

                        <div class="roadmap-node-meta">
                            <span><i class="pi pi-calendar me-2"></i>{{ formatDateRuLong(node.startDate, 'Дата не указана') }}</span>
                            <span><i class="pi pi-calendar-clock me-2"></i>{{ formatDateRuLong(node.endDate, 'Срок не указан') }}</span>
                            <span><i class="pi pi-user me-2"></i>{{ buildProjectShowcaseFullName(node.executor?.user || node.executor) }}</span>
                        </div>
                    </div>

                    <div class="roadmap-node-actions">
                        <Tag :severity="node.isCompleted ? 'success' : 'secondary'" :value="node.isCompleted ? 'Выполнено' : 'В работе'" />
                        <Button
                            v-if="canEdit"
                            label="Редактировать"
                            icon="pi pi-pen-to-square"
                            text
                            size="small"
                            @click.stop="emit('edit', node)"
                        />
                    </div>
                </div>

                <div v-if="isExpanded(node.id)" class="roadmap-node-details">
                    <p v-if="node.expectedResult" class="roadmap-node-text">
                        <strong>Ожидаемый результат:</strong> {{ node.expectedResult }}
                    </p>

                    <p v-if="node.comment" class="roadmap-node-text">
                        <strong>Комментарий:</strong> {{ node.comment }}
                    </p>

                    <p v-if="node.confirmationFormat" class="roadmap-node-text">
                        <strong>Формат подтверждения:</strong> {{ node.confirmationFormat }}
                    </p>

                    <div class="roadmap-documents">
                        <strong>Отчётные документы</strong>

                        <div v-if="node.projectDocuments?.length" class="roadmap-document-list">
                            <Button
                                v-for="document in node.projectDocuments"
                                :key="document.id"
                                :label="document.name"
                                icon="pi pi-file"
                                text
                                class="roadmap-document-button"
                                @click="emit('download-document', document)"
                            />
                        </div>

                        <p v-else class="roadmap-node-text roadmap-node-text-muted">Документы для шага пока не привязаны.</p>
                    </div>
                </div>
            </div>

            <div v-if="node.roadMapItems?.length" class="roadmap-children">
                <ProjectRoadMapTree
                    :nodes="node.roadMapItems"
                    :level="level + 1"
                    :can-edit="canEdit"
                    @edit="emit('edit', $event)"
                    @download-document="emit('download-document', $event)"
                />
            </div>
        </article>
    </div>
</template>

<script setup>
import { ref } from 'vue';
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
    canEdit: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['edit', 'download-document']);
const expandedIds = ref([]);

const isExpanded = (nodeId) => expandedIds.value.includes(nodeId);

const toggleNode = (nodeId) => {
    expandedIds.value = isExpanded(nodeId)
        ? expandedIds.value.filter((id) => id !== nodeId)
        : [...expandedIds.value, nodeId];
};
</script>

<style scoped>
.roadmap-tree {
    display: flex;
    flex-direction: column;
    gap: 0.95rem;
}

.roadmap-node {
    position: relative;
    padding-left: calc(var(--roadmap-level) * 1.35rem);
}

.roadmap-node-line {
    position: absolute;
    top: 0;
    left: calc(var(--roadmap-level) * 1.35rem + 0.75rem);
    width: 2px;
    height: 100%;
    background: linear-gradient(180deg, rgba(var(--p-blue-500-rgb), 0.28), transparent);
}

.roadmap-node-card {
    position: relative;
    margin-left: 1.45rem;
    padding: 1rem 1.1rem;
    border-radius: 18px;
    background: var(--p-content-background);
    border: 1px solid var(--p-content-border-color);
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.roadmap-node-card::before {
    content: '';
    position: absolute;
    top: 1.45rem;
    left: -0.88rem;
    width: 0.88rem;
    height: 2px;
    background: rgba(var(--p-blue-500-rgb), 0.28);
}

.roadmap-node-card-expanded {
    border-color: rgba(var(--p-blue-500-rgb), 0.18);
    box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
}

.roadmap-node-summary {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 0.9rem;
    align-items: flex-start;
}

.roadmap-node-toggle {
    flex-shrink: 0;
    margin-top: 0.15rem;
}

.roadmap-node-main {
    cursor: pointer;
    min-width: 0;
}

.roadmap-node-topline {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
}

.roadmap-node-order {
    color: var(--p-grey-1);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.roadmap-node-main h4 {
    margin: 0.25rem 0 0;
    font-size: 1rem;
    line-height: 1.45;
}

.roadmap-node-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1rem;
    margin-top: 0.8rem;
    color: var(--p-grey-1);
    font-size: 0.92rem;
}

.roadmap-node-actions {
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.roadmap-node-details {
    margin-top: 0.95rem;
    padding-top: 0.95rem;
    border-top: 1px dashed rgba(var(--p-blue-500-rgb), 0.14);
}

.roadmap-node-text {
    margin: 0;
    color: var(--p-grey-1);
    line-height: 1.65;
}

.roadmap-node-text + .roadmap-node-text,
.roadmap-documents {
    margin-top: 0.8rem;
}

.roadmap-node-text-muted {
    color: var(--p-grey-1);
}

.roadmap-documents {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
}

.roadmap-document-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
}

.roadmap-document-button {
    justify-content: flex-start;
    padding-left: 0;
}

.roadmap-children {
    margin-top: 0.8rem;
}

@media (max-width: 768px) {
    .roadmap-node {
        padding-left: calc(var(--roadmap-level) * 0.8rem);
    }

    .roadmap-node-line {
        left: calc(var(--roadmap-level) * 0.8rem + 0.62rem);
    }

    .roadmap-node-card {
        margin-left: 1.1rem;
    }

    .roadmap-node-summary {
        grid-template-columns: 1fr;
    }

    .roadmap-node-toggle {
        order: -1;
        justify-self: flex-start;
    }

    .roadmap-node-actions {
        justify-content: flex-start;
    }
}
</style>
