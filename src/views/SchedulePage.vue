<template>
    <div class="schedule-container">
        <header class="schedule-hero">
            <span class="schedule-eyebrow">Учебный календарь</span>
            <h2 class="title">Расписание занятий</h2>
            <p>Выберите, чьё расписание хотите посмотреть, и найдите нужную запись.</p>
        </header>

        <section v-if="years.length" class="year-selection">
            <div class="schedule-section-heading">
                <span>Учебный год</span>
                <small>Выберите период</small>
            </div>
            <div class="year-options">
                <button
                    v-for="year in years"
                    :key="year"
                    type="button"
                    @click="selectYear(year)"
                    :class="{'active': selectedYear === year}"
                >
                    {{ year }}
                </button>
            </div>
        </section>

        <section class="category-selection">
            <div class="schedule-section-heading">
                <span>Что ищем?</span>
                <small>Выберите раздел</small>
            </div>
            <div class="category-options">
                <button
                    v-for="category in categories"
                    :key="category.id"
                    type="button"
                    @click="selectCategory(category)"
                    :class="{'active': selectedCategory === category.id}"
                >
                    <i :class="category.icon"></i>
                    <span>{{ category.name }}</span>
                    <small>{{ category.description }}</small>
                </button>
            </div>
        </section>

        <div class="schedule-search-section">
            <label for="search">Поиск в разделе «{{ selectedCategoryMeta.name }}»</label>
            <IconField class="searchBar">
                <InputIcon class="pi pi-search" />
                <InputText id="search" name="search" placeholder="Начните вводить название" class="search" v-model="searchQuery" />
            </IconField>
        </div>
        
        <div class="schedule position-relative">
            <Transition name="content-fade" mode="out-in">
                <div key="schedule-content" class="schedule-visible" v-if="loading === false">
                    <div v-if="computedFilteredSchedule.length" class="schedule-results-heading">
                        <span>{{ selectedCategoryMeta.name }}</span>
                        <small>{{ computedFilteredSchedule.length }} {{ scheduleItemsLabel }}</small>
                    </div>
                    <div class="schedule-grid">
                        <div
                            v-for="item in paginatedSchedule"
                            :key="item.id"
                            class="schedule-card"
                            role="button"
                            tabindex="0"
                            @click="goToSchedule(item)"
                            @keydown.enter="goToSchedule(item)"
                            @keydown.space.prevent="goToSchedule(item)"
                        >
                            <div class="card-content">
                                <template v-if="selectedCategory === 1">
                                    <h4 class="card-title">{{ item.name }}</h4>
                                    <Tag class="card-subtitle" :severity="severityFacul(item.facul)">{{ item.facul }}</Tag>
                                    <p class="card-info">{{ item.kurs }} курс</p>
                                </template>

                                <template v-else-if="selectedCategory === 2">
                                    <i class="pi pi-building room-icon"></i>
                                    <h4 class="room-title">{{ item.name }}</h4>
                                    <p class="room-info">Аудитория</p>
                                </template>

                                <template v-else-if="selectedCategory === 3">
                                    <i class="pi pi-user teacher-icon"></i>
                                    <h4 class="teacher-name">{{ item.name }}</h4>
                                    <p v-if="item.kaf" class="teacher-kaf">{{ item.kaf || 'Кафедра не указана' }}</p>
                                </template>
                            </div>
                            <i class="pi pi-angle-right schedule-card-arrow"></i>
                        </div>
                    </div>

                    <div v-if="!paginatedSchedule.length" class="schedule-empty-state">
                        <i class="pi pi-calendar-times"></i>
                        <strong>Расписание пока не найдено</strong>
                        <span>Попробуйте выбрать другой учебный год или раздел.</span>
                    </div>

                    <Paginator
                        v-if="computedFilteredSchedule.length > rowsPerPage"
                        :rows="rowsPerPage" 
                        :totalRecords="computedFilteredSchedule.length"
                        :rowsPerPageOptions="[5, 10, 15]"
                        @page="onPageChange"
                        @update:rows="onRowsPerPageOptions"
                        class="paginatorSchedule"
                    />
                </div>

                <Skeleton key="schedule-skeleton" v-else class="position-absolute" style="top: 20px;" width="100%" height="40vh" borderRadius="12px"></Skeleton>
            </Transition>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import axios from "axios";
import { useRouter } from 'vue-router';
import { useGroupsStore } from '@/stores/groups';
import {
    categoryToScheduleType,
    getLastScheduleSelection,
    getSavedScheduleCategory,
    saveScheduleSelection,
    saveSelectedScheduleCategory,
    scheduleTypeToCategory
} from '@/utils/scheduleStorage.js';
import { scheduleMocks, USE_MOCK_DATA } from '@/config/mockRuntime.js';


const filteredSchedule = ref([]);
const years = ref([]);
const selectedYear = ref("");
const selectedCategory = ref(1);
const searchQuery = ref("");

const loading = ref(false);
const router = useRouter();

const currentPage = ref(0);
const rowsPerPage = ref(10); // Количество карточек на странице (по умолчанию)

const groupsStore = useGroupsStore();

const paginatedSchedule = computed(() => {
    const start = currentPage.value * rowsPerPage.value;
    const end = start + rowsPerPage.value;
    return computedFilteredSchedule.value.slice(start, end);
});

// Функция для получения ключа хранилища по категории
const getSearchKey = (categoryId) => `searchQuery_category_${categoryId}`;

// Обновление значения `searchQuery` в `localStorage`
watch(searchQuery, (newQuery) => {
    localStorage.setItem(getSearchKey(selectedCategory.value), newQuery);
});

// Фильтрация списка по введенному запросу
const computedFilteredSchedule = computed(() => {
    if (!searchQuery.value.trim()) {
        return filteredSchedule.value;
    }
    const query = searchQuery.value.toLowerCase();
    return filteredSchedule.value.filter(item =>
        item.name.toLowerCase().includes(query) || 
        (item.facul && item.facul.toLowerCase().includes(query))
    );
});

// Обработчик paginator
const onRowsPerPageOptions = (newRows) => {
    rowsPerPage.value = newRows;
    currentPage.value = 0;
}

const onPageChange = (event) => {
    currentPage.value = event.page;
};

const goToSchedule = (item) => {
    const type = categoryToScheduleType(selectedCategory.value);
    saveScheduleSelection({ type, id: item.id, name: item.name, setAsLast: true });

    if (selectedCategory.value === 1) router.push({ path: `/schedule/group/${item.id}` });
    else if (selectedCategory.value === 2) router.push({ path: `/schedule/room/${item.id}` });
    else if (selectedCategory.value === 3) router.push({ path: `/schedule/teacher/${item.id}` });
}

const fetchYears = async () => {
    if (USE_MOCK_DATA) {
        years.value = scheduleMocks.years || [];
        if (years.value.length > 0) selectedYear.value = years.value[years.value.length - 1];
        return;
    }

    try {
        const response = await axios.get('https://umu.sibadi.org/api/Rasp/ListYears');
        years.value = response.data.data.years;
        
        if (years.value.length > 0) {
            selectedYear.value = years.value[years.value.length - 1];
        }
    } catch (error) {
        console.debug('Ошибка при получении годов: ', error);
    }
};

// Универсальная функция для загрузки данных
const fetchSchedule = async (url) => {
    if (!selectedYear.value) return; // Проверяем, установлен ли год

    try {
        loading.value = true;
        if (USE_MOCK_DATA) {
            const itemsByCategory = {
                1: scheduleMocks.groups || [],
                2: scheduleMocks.rooms || [],
                3: scheduleMocks.teachers || [],
            };
            filteredSchedule.value = itemsByCategory[selectedCategory.value] || [];
            if (selectedCategory.value === 1) groupsStore.setGroups(filteredSchedule.value);
            return;
        }

        const response = await axios.get(url, {
            params: { year: selectedYear.value }
        });
        filteredSchedule.value = response.data.data;
        if(url.match("raspGrouplist").length > 0) {
            groupsStore.setGroups(response.data.data);
        }
    } catch (error) {
        console.error('Ошибка при загрузке расписания: ', error);
    } finally {
        loading.value = false;
    }
};

// Функции для разных категорий
const fetchScheduleGroup = () => fetchSchedule('https://umu.sibadi.org/api/raspGrouplist');
const fetchScheduleAudit = () => fetchSchedule('https://umu.sibadi.org/api/raspAudlist');
const fetchScheduleTeacher = () => fetchSchedule('https://umu.sibadi.org/api/raspTeacherlist');

const categories = [
    {
        "id": 1,
        "icon": "pi pi-users",
        "name": "По группам",
        "description": "Группа",
        "command": fetchScheduleGroup,
    },
    {
        "id": 2,
        "icon": "pi pi-building",
        "name": "По аудиториям",
        "description": "Аудитория",
        "command": fetchScheduleAudit,
    },
    {
        "id": 3,
        "icon": "pi pi-user",
        "name": "По преподавателям" ,
        "description": "Преподаватель",
        "command": fetchScheduleTeacher,
    },
];

const selectedCategoryMeta = computed(() => (
    categories.find((category) => category.id === selectedCategory.value) || categories[0]
));
const scheduleItemsLabel = computed(() => {
    const count = computedFilteredSchedule.value.length;
    if (count % 10 === 1 && count % 100 !== 11) return 'запись';
    if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'записи';
    return 'записей';
});

const severityFacul = computed(() => (facul) => {
    const map = {
        "АДПГС": "danger",
        "ИСЭиУ": "warn",
        "ИСУ": "warn",
        "АТНиСТ": "info",
        "ЗФ": "success",
        "ИМА": "primary"
    };
    return map[facul] || "secondary";
});

const selectCategory = (category) => {
    selectedCategory.value = category.id;
    searchQuery.value = localStorage.getItem(getSearchKey(selectedCategory.value)) || "";
    category.command();
};

const selectYear = (year) => {
    selectedYear.value = year;
};

// Следим за изменением года и загружаем данные
watch(selectedYear, () => {
    if (loading.value) return; // Не перезапускаем загрузку, если она уже идет
    const currentCategory = categories.find(cat => cat.id === selectedCategory.value);
    if (currentCategory && currentCategory.command) {
        currentCategory.command();
    }
});

watch(selectedCategory, (newCategory) => {
    saveSelectedScheduleCategory(newCategory);
})

onMounted(() => {
    const savedCategory = getSavedScheduleCategory();
    const lastSelection = getLastScheduleSelection();

    if (savedCategory) selectedCategory.value = savedCategory;
    else if (lastSelection?.id) selectedCategory.value = scheduleTypeToCategory(lastSelection.type);

    searchQuery.value = localStorage.getItem(getSearchKey(selectedCategory.value)) || "";
    
    fetchYears().then(() => {
        const currentCategory = categories.find(cat => cat.id === selectedCategory.value);
        if (currentCategory && currentCategory.command) {
            currentCategory.command();
        }
    });
});

</script>

<style scoped>
.schedule-container {
    min-height: 100%;
    color: var(--p-text-color);
    padding: 10px 2rem;
    border-radius: 10px;
    transition: all 0.5s;
}
.year-selection {
    padding: 20px;
    background: var(--p-grey-7);
    margin: 0;
    border-radius: 12px;
    transition: all 0.5s;
}
.category-selection {
    margin: 30px 0 0;
    background: var(--p-grey-7);
    padding: 20px;
    border-radius: 12px;
    transition: all 0.5s;
}
.year-selection button, .category-selection button {
    background: var(--p-grey-6);
    color: var(--p-text-color);
    width: 100%;
    padding: 10px 20px;
    border: none;
    cursor: pointer;
    border-radius: 12px;
    transition: all 0.5s;
}
.year-selection button:hover, .category-selection button:hover {
    background: var(--p-blue-500-low-op);
    color: rgb(var(--p-color-icon-menu));
}

.year-selection button.active, .category-selection button.active {
    background: var(--p-blue-500-low-op);
    color: rgb(var(--p-color-icon-menu));
    }

.searchBar {
    margin: 30px 0 0;
}
.search {
    border-radius: 12px;
    transition: all 0.5s;
    width: 100%; 
}

/* Сетка карточек */
.schedule-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(clamp(240px, 45vw, 300px), 1fr));
    gap: 15px;
    margin-top: 30px;
}

.schedule-empty-state {
    display: flex;
    min-height: 12rem;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    margin-top: 1.5rem;
    padding: 1.5rem;
    border: 1px dashed rgba(var(--p-blue-500-rgb), 0.22);
    border-radius: 18px;
    color: var(--p-text-muted-color, var(--p-grey-2));
    text-align: center;
}

.schedule-empty-state i {
    color: var(--p-primary-color);
    font-size: 1.5rem;
}

.schedule-empty-state strong {
    color: var(--p-text-color);
}

.schedule-card {
    position: relative;
    background: var(--p-grey-7);
    border-radius: 12px;
    padding: 15px;
    transition: all 0.5s;
}

.schedule-card:hover {
    background: var(--p-blue-500-low-op);
    color: rgb(var(--p-color-icon-menu));
    cursor: pointer;
}
.teacher-icon {
    position: absolute;
    top: 15px;
    right: 15px;
    font-size: 2rem;
    color: var(--p-blue-500);
    margin-bottom: 10px;
}
.teacher-name {
    font-size: 1.2rem;
    font-weight: bold;
    width: 70%;
}
.room-icon {
    position: absolute;
    top: 15px;
    right: 15px;
    font-size: 2rem;
    color: var(--p-blue-500);
    margin-bottom: 10px;
}

.room-title {
    font-size: 1.2rem;
    font-weight: bold;
}
.room-info {
    font-size: 0.9rem;
    margin: 5px 0;
}

.card-title {
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 10px;
}

.card-subtitle {
    position: absolute;
    top: 15px;
    right: 15px;

    font-size: 0.9rem;
}

.card-info {
    font-size: 0.9rem;
    margin: 5px 0;
}

.category-selection  .pi {
    font-size: 1.5rem;
}

:deep(.p-paginator) {
    margin-top: 30px !important;
}

@media (max-width: 640px) {
    .schedule-container {
        padding: 0.75rem;
    }

    .header .title {
        margin: 0 0 1rem;
        font-size: 1.45rem;
    }

    .year-selection,
    .category-selection {
        padding: 0.75rem;
    }

    .category-selection {
        margin-top: 1rem;
    }

    .category-selection button {
        padding: 0.8rem 0.75rem;
    }

    .searchBar,
    .schedule-grid {
        margin-top: 1rem;
    }

    .schedule-grid {
        grid-template-columns: 1fr;
    }
}

/* Mobile-first schedule layout overrides */
.schedule-container {
    padding: 1.25rem clamp(1rem, 3vw, 2rem) calc(1.5rem + var(--app-mobile-bottom-offset));
}
.schedule-hero { padding: 0.35rem 0 1.2rem; }
.schedule-eyebrow {
    display: inline-flex;
    margin-bottom: 0.4rem;
    color: var(--p-primary-color);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}
.schedule-hero .title {
    margin: 0;
    font-size: clamp(1.55rem, 4vw, 2rem);
    font-weight: 800;
    letter-spacing: -0.04em;
}
.schedule-hero p {
    max-width: 42rem;
    margin: 0.4rem 0 0;
    color: var(--p-text-muted-color, var(--p-grey-2));
    line-height: 1.45;
}
.year-selection,
.category-selection {
    padding: 1rem;
    border: 1px solid color-mix(in srgb, var(--p-primary-color) 13%, var(--p-grey-4));
    border-radius: 1rem;
}
.year-selection {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    background: color-mix(in srgb, var(--p-primary-color) 4%, var(--p-bg-color-1));
}
.category-selection { margin-top: 1rem; background: var(--p-bg-color-1); }
.schedule-section-heading { display: flex; flex-direction: column; gap: 0.18rem; }
.schedule-section-heading span { font-size: 0.96rem; font-weight: 750; }
.schedule-section-heading small { color: var(--p-text-muted-color, var(--p-grey-2)); font-size: 0.76rem; }
.year-options { display: flex; gap: 0.5rem; overflow-x: auto; scrollbar-width: none; }
.year-options::-webkit-scrollbar { display: none; }
.year-options button {
    min-width: 6.8rem;
    padding: 0.62rem 0.78rem;
    border: 1px solid var(--p-grey-4);
    border-radius: 0.75rem;
    color: var(--p-text-color);
    background: var(--p-bg-color-1);
    cursor: pointer;
    font-weight: 700;
    transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
}
.year-options button:hover,
.year-options button.active {
    border-color: color-mix(in srgb, var(--p-primary-color) 55%, transparent);
    color: var(--p-primary-color);
    background: color-mix(in srgb, var(--p-primary-color) 13%, transparent);
}
.category-options {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
    margin-top: 0.85rem;
}
.category-options button {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 0.45rem 0.65rem;
    min-height: 5.1rem;
    padding: 0.85rem;
    border: 1px solid var(--p-grey-4);
    border-radius: 0.9rem;
    color: var(--p-text-color);
    background: color-mix(in srgb, var(--p-primary-color) 3%, var(--p-bg-color-1));
    cursor: pointer;
    text-align: left;
    transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}
.category-options button > i {
    display: grid;
    width: 2rem;
    height: 2rem;
    grid-row: span 2;
    place-items: center;
    border-radius: 0.65rem;
    color: var(--p-primary-color);
    background: color-mix(in srgb, var(--p-primary-color) 12%, transparent);
    font-size: 1rem;
}
.category-options button > span { min-width: 0; font-weight: 750; }
.category-options button > small { color: var(--p-text-muted-color, var(--p-grey-2)); font-size: 0.72rem; }
.category-options button:hover,
.category-options button.active {
    border-color: color-mix(in srgb, var(--p-primary-color) 52%, transparent);
    background: color-mix(in srgb, var(--p-primary-color) 12%, var(--p-bg-color-1));
}
.category-options button:hover { transform: translateY(-1px); }
.schedule-search-section { margin-top: 1rem; }
.schedule-search-section > label { display: block; margin-bottom: 0.45rem; font-size: 0.84rem; font-weight: 700; }
.searchBar { width: 100%; margin-top: 0; }
.search { width: 100%; border-radius: 0.85rem; }
.schedule-results-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 1.2rem;
}
.schedule-results-heading > span { font-size: 1rem; font-weight: 800; }
.schedule-results-heading > small {
    padding: 0.32rem 0.55rem;
    border-radius: 999px;
    color: var(--p-primary-color);
    background: color-mix(in srgb, var(--p-primary-color) 10%, transparent);
    font-size: 0.72rem;
    font-weight: 700;
}
.schedule-grid { gap: 0.75rem; margin-top: 0.75rem; }
.schedule-card {
    min-height: 6.75rem;
    padding: 1rem 2.9rem 1rem 1rem;
    border: 1px solid var(--p-grey-4);
    border-radius: 1rem;
    background: var(--p-bg-color-1);
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
    cursor: pointer;
    transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.schedule-card:hover {
    border-color: color-mix(in srgb, var(--p-primary-color) 48%, transparent);
    background: color-mix(in srgb, var(--p-primary-color) 7%, var(--p-bg-color-1));
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
    transform: translateY(-2px);
}
.schedule-card:focus-visible { outline: 2px solid var(--p-primary-color); outline-offset: 2px; }
.schedule-card-arrow { position: absolute; top: 50%; right: 1rem; color: var(--p-primary-color); font-size: 1.05rem; transform: translateY(-50%); }
.teacher-icon, .room-icon { display: none; }
.teacher-name,
.room-title { margin: 0; font-size: 1.02rem; font-weight: 750; }
.room-info,
.card-info { margin: 0.42rem 0 0; color: var(--p-text-muted-color, var(--p-grey-2)); font-size: 0.82rem; }
.card-title {
    max-width: calc(100% - 4rem);
    margin: 0;
    overflow: hidden;
    font-size: 1.02rem;
    font-weight: 750;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.card-subtitle {
    top: 1rem;
    right: 2.8rem;
    max-width: 4.2rem;
    overflow: hidden;
    font-size: 0.72rem;
    text-overflow: ellipsis;
    white-space: nowrap;
}

@media (max-width: 640px) {
    .schedule-container { padding: 0.85rem var(--app-page-padding-x) calc(1rem + var(--app-mobile-bottom-offset)); }
    .schedule-hero { padding-top: 0.1rem; }
    .year-selection { align-items: flex-start; flex-direction: column; }
    .category-selection { padding: 0.85rem; }
    .category-options { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .category-options button:last-child { grid-column: 1 / -1; }
    .schedule-card { min-height: 6.25rem; }
}
</style>
