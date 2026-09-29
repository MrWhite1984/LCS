<template>
    <div class="d-flex justify-content-center">
        <div class="priority-selector">
            <div class="row">
                <div class="col-1 d-flex justify-content-start m-0 p-0">
                    <div class="vertical-header fs-4">
                        <i class="pi pi-clock fs-4 mb-2"></i>
                        <strong>Срочность</strong>
                    </div>
                </div>
                <div class="col">
                    <table v-if="urgencies.length && influences.length">
                        <thead>
                            <tr>
                                <th></th>
                                <th colspan="3" class="influence">
                                    <div class="row align-items-baseline justify-content-center">
                                        <div class="col-auto pe-0">
                                            <i class="pi pi-exclamation-triangle fs-4"></i>
                                        </div>
                                        <div class="col-auto">
                                            <span class="fs-4">Влияние</span>
                                        </div>
                                    </div>
                                </th>
                            </tr>
                            <tr>
                                <th></th>
                                <th v-for="influence in sortedInfluences" :key="influence.id">
                                    <div>{{ influence.name }}</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="urgency in sortedUrgencies" :key="urgency.id"> 
                                <td>
                                    <div><strong>{{ urgency.name }}</strong></div>
                                </td>
                                <td v-for="influence in sortedInfluences" :key="influence.id">
                                    <label
                                        :style="{ backgroundColor: getPriorityColor(urgency.id, influence.id) }"
                                        class="priority-cell"
                                    >   
                                        <input
                                            type="radio"
                                            name="priority"
                                            :value="getPriorityId(urgency.id, influence.id)"
                                            v-model="selectedPriority"
                                            @change="updateSelection(urgency, influence)"
                                        />
                                    </label>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <p v-else>Загрузка данных...</p>
                </div>
            </div>
            
            
        </div>
    </div>
</template>
  
<script>
import { ref, computed, onMounted } from 'vue';
import axiosInstance from '@/utils/axios.js';
import { usePriorityStore } from '@/stores/priorityStore.js';

export default {
    name: 'PrioritySelector',
    setup() {
        const urgencies = ref([]);
        const influences = ref([]);
        const priorities = ref([]);
        const concordances = ref([]);
        const selectedPriority = ref(null);
        const selectedUrgency = ref(null);
        const selectedInfluence = ref(null);

        const store = usePriorityStore();

        const colorMapping = {
            "767da5ef-df20-43f3-8505-c9d19af378e0": "#4ade80", // Новый цвет для Низкий
            "71ba22c4-5897-473f-9a29-6b2f1e974507": "#ffffff", // Новый цвет для Средний
            "3e7acabc-f4c7-4c95-9f50-ed5e13753bd9": "#ef4444", // Новый цвет для Высокий
        };

        const fetchPriorityData = async () => {
        try {
            const response = await axiosInstance.get('/api/infra-manager/calls/priority-list');
            urgencies.value = response.data.urgencies || [];
            influences.value = response.data.influences || [];
            priorities.value = response.data.priorities || [];
            concordances.value = response.data.concordances || [];
        } catch (error) {
            console.error('Ошибка при загрузке данных:', error);
        }
        };

        const getPriorityId = (urgencyId, influenceId) => {
            const concordance = concordances.value.find(
                (c) => c.urgencyId === urgencyId && c.influenceId === influenceId
            );
            return concordance ? concordance.priorityId : null;
        };

        const getPriorityColor = (urgencyId, influenceId) => {
            const priorityId = getPriorityId(urgencyId, influenceId);
            if (priorityId && colorMapping[priorityId]) {
                return colorMapping[priorityId]; // Используем цвет из маппинга
            }
            const priority = priorities.value.find((p) => p.id === priorityId);
            return priority ? priority.color : '#FFFFFF';
        };

        const getPriorityName = (priorityId) => {
            const priority = priorities.value.find((p) => p.id === priorityId);
            return priority ? priority.name : 'Не выбрано';
        };

        const sortedUrgencies = computed(() => {
            return [...urgencies.value].sort((a, b) => a.sequence - b.sequence);
        });

        const sortedInfluences = computed(() => {
            return [...influences.value].sort((a, b) => a.sequence - b.sequence);
        });

        const updateSelection = (urgency, influence) => {
            selectedUrgency.value = urgency;
            selectedInfluence.value = influence; 
            store.setSelectedPriority(getPriorityName(getPriorityId(urgency.id, influence.id)), getPriorityId(urgency.id, influence.id), urgency.id, influence.id);
        };

        onMounted(fetchPriorityData);

        return {
            urgencies,
            influences,
            priorities,
            sortedUrgencies,
            sortedInfluences,
            selectedPriority: store.selectedPriority,
            selectedUrgency,
            selectedInfluence,
            getPriorityColor,
            getPriorityId,
            getPriorityName,
            updateSelection,
        };
    },
};
</script>
  
  
<style scoped>
.vertical-header {
    writing-mode: vertical-rl; /* Устанавливает направление текста вертикально, снизу вверх */
    transform: rotate(180deg); /* Разворачивает текст для читаемости */
}
.priority-selector {
    text-align: center;
    color: var(--p-text-color);
    border-radius: 12px;
    padding-inline: 30px;
    padding-block: 0px;
    transition: all 0.5s;
}

.priority-selector table {
    border-collapse: separate;
    border-spacing: 10px;
    margin: 0 auto;
    width: auto;
}

thead th.influence{
    vertical-align: middle;
    padding-bottom: 10px;
}
  
.priority-selector td {
    width: 80px;
    height: 80px;
    text-align: center;
    vertical-align: middle;
}

.priority-cell {
    border-radius: 50%;
    width: 50px;
    height: 50px;
    cursor: pointer;
    transition: all 0.5s;
    filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.2));
}
  
.priority-cell input {
    display: none;
}
  
.priority-cell:hover {
    filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.2)) contrast(0.6);
}

@media (max-width: 768px) {
    .priority-selector {
        padding-inline: 0.25rem;
    }
    .priority-selector .row {
        --bs-gutter-x: 0.5rem;
    }
    .priority-selector .col-1 {
        flex: 0 0 auto;
        width: auto;
    }
    .priority-selector table {
        border-spacing: 5px;
        width: 100%;
        table-layout: fixed;
    }
    .priority-selector th,
    .priority-selector td {
        padding: 0.1rem;
        font-size: 0.72rem;
        line-height: 1.2;
        overflow-wrap: anywhere;
    }
    thead th.influence {
        padding: 0.1rem 0.1rem 0.4rem;
    }
    .priority-selector td {
        width: auto;
        height: 52px;
    }
    .priority-cell {
        width: 40px;
        height: 40px;
    }
    .vertical-header.fs-4,
    .priority-selector .influence .fs-4 {
        font-size: 0.95rem !important;
    }
}
</style>
  