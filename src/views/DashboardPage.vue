<template>
    <main class="dashboard">
        <section class="hero">
            <div class="hero-content">
                <div class="hero-pill">
                    <i class="pi pi-sparkles"></i>
                    <span>Добро пожаловать</span>
                </div>
                <h1>Добро пожаловать в ЛКС, {{ firstName }}!</h1>
                <p class="subtitle">Быстрый доступ к основным разделам и вашей активности</p>
            </div>
        </section>

        <section class="overview-grid">
            <div class="panel-card schedule-overview-card">
                <div class="panel-header">
                    <div class="panel-header-main">
                        <h3>Расписание</h3>
                        <SelectButton
                            v-model="selectedScheduleType"
                            :options="scheduleModeOptions"
                            optionValue="value"
                            class="schedule-mode-switch"
                        >
                            <template #option="{ option }">
                                <span class="schedule-mode-icon" :title="option.label">
                                    <i :class="option.icon"></i>
                                </span>
                            </template>
                        </SelectButton>
                    </div>
                    <router-link class="panel-header-action" to="/schedule" aria-label="Открыть расписание" v-tooltip.top="'Открыть расписание'">
                        <i class="pi pi-arrow-up-right"></i>
                    </router-link>
                </div>
                <div class="panel-content">
                    <div v-if="scheduleSelection.name" class="schedule-current-target">
                        {{ scheduleSelection.name }}
                    </div>
                    <Transition name="schedule-fade" mode="out-in">
                        <div :key="scheduleViewState" class="schedule-state">
                            <div v-if="scheduleViewState === 'no-selection'" class="activity-item muted">
                                Выберите {{ selectedScheduleTargetLabel }} в расписании, чтобы отобразить
                            </div>
                            <div v-else-if="scheduleViewState === 'loading'" class="schedule-skeleton">
                                <Skeleton width="11rem" height="0.9rem" borderRadius="8px" />

                                <div v-for="item in 3" :key="`schedule-skeleton-${item}`" class="schedule-skeleton-item">
                                    <div class="schedule-skeleton-badges">
                                        <Skeleton width="7.2rem" height="1.65rem" borderRadius="999px" />
                                        <Skeleton width="5.6rem" height="1.55rem" borderRadius="999px" />
                                    </div>
                                    <Skeleton width="92%" height="1rem" borderRadius="8px" />
                                    <Skeleton width="5.4rem" height="1.55rem" borderRadius="999px" />
                                </div>
                            </div>
                            <div v-else-if="scheduleViewState === 'empty'" class="activity-item muted">
                                Ближайших занятий нет
                            </div>
                            <div v-else class="schedule-mini">
                                <div class="schedule-mini-date">Ближайшая дата: {{ scheduleDateLabel }}</div>
                                <div v-for="lesson in todayLessons" :key="lesson.key" class="schedule-mini-item">
                                    <div class="schedule-badges">
                                        <span class="schedule-time badge">{{ lesson.time }}</span>
                                        <span
                                            v-if="lesson.type"
                                            class="schedule-type badge"
                                            :style="{ '--type-color': `var(--p-${lesson.typeColor}-500)` }"
                                        >
                                            {{ lesson.type }}
                                        </span>
                                    </div>
                                    <span class="schedule-title">{{ lesson.title }}</span>
                                    <span class="schedule-room badge" v-if="lesson.room">{{ lesson.room }}</span>
                                </div>
                            </div>
                        </div>
                    </Transition>
                </div>
            </div>

            <div class="panel-card">
                <div class="panel-header">
                    <h3>Последние заявки</h3>
                    <router-link
                        v-if="showRequests"
                        class="panel-header-action"
                        :to="{ path: '/requests', query: { create: '1' } }"
                        aria-label="Создать заявку"
                        v-tooltip.top="'Создать заявку'"
                    >
                        <i class="pi pi-plus"></i>
                    </router-link>
                </div>
                <div class="panel-content">
                    <div v-if="recentTicketsLoading" class="schedule-skeleton">
                        <Skeleton v-for="item in 3" :key="`ticket-skeleton-${item}`" width="100%" height="2.7rem" borderRadius="10px" />
                    </div>
                    <div v-else-if="recentTickets.length" class="recent-tickets">
                        <router-link
                            v-for="ticket in recentTickets"
                            :key="ticket.id"
                            class="recent-ticket"
                            to="/requests"
                        >
                            <div class="recent-ticket-main">
                                <strong>{{ ticket.callSummaryName || ticket.fullName || `Заявка №${ticket.number}` }}</strong>
                                <span>{{ formatTicketDate(ticket.utcDateRegistered || ticket.utcDateModified) }}</span>
                            </div>
                            <Tag :value="ticket.entityStateName || 'Не указан'" :severity="getTicketStatusSeverity(ticket.entityStateName)" />
                        </router-link>
                    </div>
                    <AsyncState
                        v-else-if="recentTicketsError"
                        tone="error"
                        icon="pi pi-exclamation-triangle"
                        title="Не удалось загрузить заявки"
                        description="Проверьте соединение и попробуйте ещё раз."
                        retry
                        @retry="fetchRecentTickets"
                    />
                    <div v-else class="activity-item muted">
                        {{ showRequests ? 'Незакрытых заявок нет' : 'Заявки недоступны' }}
                    </div>
                </div>
            </div>

            <div v-if="showTicketsShortcut" class="panel-card tickets-overview-card">
                <div class="panel-header">
                    <h3>Справки</h3>
                    <div class="panel-header-actions">
                        <router-link
                            v-if="canCreateStudentTickets"
                            class="panel-header-action panel-header-action-primary"
                            to="/tickets/my-requests"
                            aria-label="Создать справку"
                            v-tooltip.top="'Создать справку'"
                        >
                            <i class="pi pi-plus"></i>
                        </router-link>
                        <router-link class="panel-header-action" :to="ticketsDashboardLink" aria-label="Открыть справки" v-tooltip.top="'Открыть справки'">
                            <i class="pi pi-arrow-up-right"></i>
                        </router-link>
                    </div>
                </div>
                <div class="panel-content">
                    <div v-if="recentCertificatesLoading" class="schedule-skeleton">
                        <Skeleton v-for="item in 3" :key="`certificate-skeleton-${item}`" width="100%" height="2.7rem" borderRadius="10px" />
                    </div>
                    <div v-else-if="recentCertificates.length" class="recent-tickets">
                        <router-link
                            v-for="ticket in recentCertificates"
                            :key="ticket.id"
                            class="recent-ticket"
                            to="/tickets/my-requests"
                        >
                            <div class="recent-ticket-main">
                                <strong>{{ ticket.requestType?.title || ticket.requestType?.name || `Справка №${ticket.number}` }}</strong>
                                <span>{{ formatCertificateDate(ticket.createdAt || ticket.updatedAt) }}</span>
                            </div>
                            <Tag :value="getCertificateStatusLabel(ticket.status)" :severity="getCertificateStatusSeverity(ticket.status)" />
                        </router-link>
                    </div>
                    <div v-else class="activity-item muted">Оформляйте справки и отслеживайте их готовность здесь.</div>
                </div>
            </div>
        </section>

        <NewsFeedSection />
    </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import axios from 'axios';
import axiosInstance from '@/utils/axios.js';
import NewsFeedSection from '@/components/News/NewsFeedSection.vue';
import AsyncState from '@/components/Utils/AsyncState.vue';
import { usePermissionStore } from '@/stores/permissions.js';
import { getRequestAccess } from '@/utils/requestAccess.js';
import { getCurrentUser } from '@/utils/currentUser.js';
import { formatDateOmskFromUtcString } from '@/utils/date.js';
import { getInfraStatusSeverity } from '@/utils/infraStatus.js';
import { listMyTickets } from '@/api/tickets.js';
import { requestMocks, ticketMocks, USE_MOCK_DATA } from '@/config/mockRuntime.js';
import {
    buildSchedulePath,
    getLastScheduleSelection,
    getScheduleSelectionByType,
    normalizeScheduleType,
    SCHEDULE_TYPE_GROUP,
    SCHEDULE_TYPE_ROOM,
    SCHEDULE_TYPE_TEACHER
} from '@/utils/scheduleStorage.js';

const DASHBOARD_SCHEDULE_TYPE_KEY = 'dashboardScheduleType';
const permissionStore = usePermissionStore();
const firstName = ref(localStorage.getItem('firstName') || '');
const roleTitle = ref('');
const isBlocked = ref(false);
const infraStatusText = ref('—');
const showRequests = ref(localStorage.getItem('InfraStatus') === 'true');
const todayLessons = ref([]);
const scheduleDateLabel = ref('');
const isScheduleLoading = ref(false);
const recentTickets = ref([]);
const recentTicketsLoading = ref(false);
const recentTicketsError = ref(false);
const recentCertificates = ref([]);
const recentCertificatesLoading = ref(false);
let scheduleRequestId = 0;

const scheduleModeOptions = [
    { label: 'Группа', value: SCHEDULE_TYPE_GROUP, icon: 'pi pi-users' },
    { label: 'Аудитория', value: SCHEDULE_TYPE_ROOM, icon: 'pi pi-building' },
    { label: 'Преподаватель', value: SCHEDULE_TYPE_TEACHER, icon: 'pi pi-user' }
];

const lastSchedule = getLastScheduleSelection();
const savedDashboardType = localStorage.getItem(DASHBOARD_SCHEDULE_TYPE_KEY);
const selectedScheduleType = ref(normalizeScheduleType(lastSchedule.type || savedDashboardType));
const scheduleSelection = ref(getScheduleSelectionByType(selectedScheduleType.value));

const selectedScheduleTargetLabel = computed(() => ({
    [SCHEDULE_TYPE_GROUP]: 'группу',
    [SCHEDULE_TYPE_ROOM]: 'аудиторию',
    [SCHEDULE_TYPE_TEACHER]: 'преподавателя',
}[selectedScheduleType.value] || 'группу'));
const scheduleViewState = computed(() => {
    if (!scheduleSelection.value.id) return 'no-selection';
    if (isScheduleLoading.value) return 'loading';
    if (todayLessons.value.length === 0) return 'empty';
    return 'content';
});

const openScheduleLink = computed(() => buildSchedulePath(selectedScheduleType.value, scheduleSelection.value.id));
const canReadTickets = computed(() => permissionStore.hasPermission('Tickets', 'Read'));
const canAccessStudentTickets = computed(() => (
    permissionStore.hasPermission('TicketsStudent', 'Read')
    || permissionStore.hasPermission('TicketsStudent', 'Create')
));
const canCreateStudentTickets = computed(() => permissionStore.hasPermission('TicketsStudent', 'Create'));
const showTicketsShortcut = computed(() => canReadTickets.value || canAccessStudentTickets.value);
const ticketsDashboardLink = computed(() => (
    canReadTickets.value ? '/tickets' : '/tickets/my-requests'
));

const getTicketStatusSeverity = getInfraStatusSeverity;
const formatTicketDate = (date) => formatDateOmskFromUtcString(date);
const formatCertificateDate = (date) => formatDateOmskFromUtcString(date);
const getCertificateStatusSeverity = (status) => ({
    New: 'info',
    Open: 'warning',
    Assigned: 'info',
    Pending: 'warning',
    Resolved: 'success',
    Closed: 'secondary',
    Cancelled: 'danger',
}[status] || 'contrast');
const getCertificateStatusLabel = (status) => ({
    New: 'Новая',
    Open: 'Открыта',
    Assigned: 'В работе',
    Pending: 'Ожидание',
    Resolved: 'Готова',
    Closed: 'Закрыта',
    Cancelled: 'Отменена',
}[status] || status || 'Не указан');

const fetchRecentTickets = async () => {
    if (!showRequests.value) {
        recentTickets.value = [];
        return;
    }

    recentTicketsLoading.value = true;
    recentTicketsError.value = false;
    try {
        if (USE_MOCK_DATA) {
            recentTickets.value = requestMocks.slice(0, 3);
            return;
        }

        const response = await axiosInstance.get('/api/infra-manager/users/me/calls', {
            params: { page: 1, pageSize: 20 },
        });
        recentTickets.value = (response.data?.entities || [])
            .filter((ticket) => ticket.entityStateName !== 'Закрыта' && !ticket.utcDateClosed)
            .sort((left, right) => new Date(right.utcDateRegistered || right.utcDateModified) - new Date(left.utcDateRegistered || left.utcDateModified))
            .slice(0, 3);
    } catch (error) {
        console.debug('Ошибка при загрузке последних заявок:', error);
        recentTickets.value = [];
        recentTicketsError.value = true;
    } finally {
        recentTicketsLoading.value = false;
    }
};

const fetchRecentCertificates = async () => {
    if (!canAccessStudentTickets.value) {
        recentCertificates.value = [];
        return;
    }

    recentCertificatesLoading.value = true;
    try {
        if (USE_MOCK_DATA) {
            recentCertificates.value = (ticketMocks.mockTickets?.tickets || []).slice(0, 3);
            return;
        }

        const response = await listMyTickets({ page: 1, pageSize: 3 });
        recentCertificates.value = (response.data?.tickets || [])
            .slice()
            .sort((left, right) => new Date(right.createdAt || right.updatedAt) - new Date(left.createdAt || left.updatedAt))
            .slice(0, 3);
    } catch (error) {
        console.debug('Ошибка при загрузке последних справок:', error);
        recentCertificates.value = [];
    } finally {
        recentCertificatesLoading.value = false;
    }
};

const fetchUserStatus = async () => {
    try {
        const me = await getCurrentUser();
        firstName.value = me.firstName || '';
        localStorage.setItem('firstName', firstName.value);
        roleTitle.value = me.roles?.[0]?.title || '';
        isBlocked.value = !!me.isBlocked;
    } catch (error) {
        console.debug('Ошибка при загрузке статуса пользователя:', error);
    }
};

const fetchRequestAvailability = async () => {
    const requestAccess = await getRequestAccess();
    showRequests.value = requestAccess.showRequests;
};

const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getScheduleParamName = (type) => {
    if (type === SCHEDULE_TYPE_ROOM) return 'idAudLine';
    if (type === SCHEDULE_TYPE_TEACHER) return 'idTeacher';
    return 'idGroup';
};

const fetchScheduleForDate = async (date) => {
    if (!scheduleSelection.value.id) return [];

    try {
        const formattedDate = formatLocalDate(date);
        const paramName = getScheduleParamName(selectedScheduleType.value);
        const response = await axios.get(
            `https://umu.sibadi.org/api/Rasp?${paramName}=${scheduleSelection.value.id}&sdate=${formattedDate}`
        );
        const lessons = response.data?.data?.rasp || [];
        return lessons.filter((lesson) => {
            if (!lesson?.дата) return false;
            const lessonDate = new Date(lesson.дата);
            return formatLocalDate(lessonDate) === formattedDate;
        });
    } catch (error) {
        return [];
    }
};

const cleanDiscipline = (discipline) => {
    const match = discipline?.match(/^(лек|лаб|пр|экз|зач)\s*/i, '');
    let type = '';
    let color = 'blue';
    if (match) {
        const typeAbbr = match[1].toLowerCase();
        switch (typeAbbr) {
            case 'лек':
                type = 'Лекция';
                color = 'green';
                break;
            case 'лаб':
                type = 'Лабораторная';
                color = 'purple';
                break;
            case 'пр':
                type = 'Практика';
                color = 'amber';
                break;
            case 'экз':
                type = 'Экзамен';
                color = 'sky';
                break;
            case 'зач':
                type = 'Зачет';
                color = 'sky';
                break;
            default:
                type = '';
        }
    }
    return {
        cleanedDiscipline: discipline?.replace(/^(лек|лаб|пр.|экз|зач)\s*/i, '') || discipline,
        type,
        color
    };
};

const setScheduleLessons = (lessons, date) => {
    const mapRoom = (lesson) => {
        if (selectedScheduleType.value === SCHEDULE_TYPE_GROUP) return lesson.аудитория;
        if (selectedScheduleType.value === SCHEDULE_TYPE_ROOM) return lesson.группа;
        return lesson.аудитория || lesson.группа;
    };

    todayLessons.value = lessons.slice(0, 4).map((lesson, index) => ({
        key: lesson.код || index,
        time: `${lesson.начало.replace('-', ':')} - ${lesson.конец.replace('-', ':')}`,
        title: cleanDiscipline(lesson.дисциплина).cleanedDiscipline,
        type: cleanDiscipline(lesson.дисциплина).type,
        typeColor: cleanDiscipline(lesson.дисциплина).color,
        room: mapRoom(lesson)
    }));
    scheduleDateLabel.value = date.toLocaleDateString('ru-RU', {
        weekday: 'short',
        day: '2-digit',
        month: 'long'
    });
};

const fetchNearestSchedule = async () => {
    const requestId = ++scheduleRequestId;

    if (!scheduleSelection.value.id) {
        isScheduleLoading.value = false;
        todayLessons.value = [];
        scheduleDateLabel.value = '';
        return;
    }

    isScheduleLoading.value = true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
        for (let offset = 0; offset <= 7; offset += 1) {
            if (requestId !== scheduleRequestId) return;

            const date = new Date(today);
            date.setDate(today.getDate() + offset);
            const lessons = await fetchScheduleForDate(date);

            if (requestId !== scheduleRequestId) return;

            if (lessons.length > 0) {
                setScheduleLessons(lessons, date);
                return;
            }
        }

        todayLessons.value = [];
        scheduleDateLabel.value = '';
    } finally {
        if (requestId === scheduleRequestId) {
            isScheduleLoading.value = false;
        }
    }
};

watch(selectedScheduleType, (newType) => {
    localStorage.setItem(DASHBOARD_SCHEDULE_TYPE_KEY, newType);
    scheduleSelection.value = getScheduleSelectionByType(newType);
    fetchNearestSchedule();
});

watch(showRequests, (canRead) => {
    if (canRead) {
        fetchRecentTickets();
    } else {
        recentTickets.value = [];
    }
}, { immediate: true });

watch(canAccessStudentTickets, (canRead) => {
    if (canRead) {
        fetchRecentCertificates();
    } else {
        recentCertificates.value = [];
    }
}, { immediate: true });

onMounted(() => {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);

    fetchUserStatus();
    fetchRequestAvailability();
    scheduleSelection.value = getScheduleSelectionByType(selectedScheduleType.value);
    fetchNearestSchedule();
});
</script>

<style scoped>
h3 {
    margin: 0 !important;
}
.dashboard {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: var(--app-page-padding-y) var(--app-page-padding-x) 1.5rem;
    gap: 24px;
    isolation: isolate;
    overflow: hidden;
}
.dashboard::before {
    content: "";
    position: absolute;
    inset: -30% -10% auto -10%;
    height: 420px;
    z-index: -1;
    pointer-events: none;
    background:
        radial-gradient(circle at 18% 24%, rgba(var(--p-primary-500-rgb), 0.15), transparent 50%),
        radial-gradient(circle at 86% 8%, rgba(var(--p-amber-500-rgb), 0.10), transparent 42%);
    filter: blur(8px);
    animation: driftBg 14s ease-in-out infinite alternate;
}
.hero {
    padding: 0.35rem 0 0.15rem;
    opacity: 0;
    transform: translateY(12px);
    animation: revealUp 0.62s cubic-bezier(0.16, 1, 0.3, 1) 0.05s forwards;
}
.hero-content {
    position: relative;
    z-index: 1;
}
.hero h1 {
    font-size: 2.2rem;
    color: var(--p-text-color);
    margin: 0 0 6px;
}
.hero-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 0.8rem;
    background: rgba(var(--p-primary-500-rgb), 0.12);
    color: var(--p-primary-color);
    margin-bottom: 12px;
}
.hero-actions {
    display: flex;
    gap: 12px;
    margin-top: 16px;
    flex-wrap: wrap;
}
.hero-cta {
    text-decoration: none;
    padding: 10px 16px;
    border-radius: 16px;
    background: rgba(var(--p-primary-500-rgb), 0.16);
    border: 1px solid rgba(var(--p-primary-500-rgb), 0.24);
    color: var(--p-text-color);
    font-weight: 600;
    transition: all 0.2s ease;
}
.hero-cta:hover {
    transform: translateY(-1px);
    border-color: rgba(var(--p-primary-500-rgb), 0.36);
}
.hero-cta.secondary {
    background: transparent;
}
.subtitle {
    margin: 0;
    color: var(--p-grey-2);
}
.overview-grid h3 {
    margin: 0 0 12px;
    color: var(--p-text-color);
}
.actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
}
.action-card {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 14px 16px;
    border-radius: 16px;
    text-decoration: none;
    color: var(--p-text-color);
    background: linear-gradient(
        180deg,
        rgba(var(--p-primary-500-rgb), 0.04),
        rgba(255, 255, 255, 0)
    );
    border: 1px solid rgba(var(--p-primary-500-rgb), 0.14);
    transition: transform 0.28s ease, border-color 0.28s ease, box-shadow 0.28s ease, background 0.28s ease;
    opacity: 0;
    transform: translateY(16px);
    animation: revealUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.action-card:hover {
    border-color: rgba(var(--p-primary-500-rgb), 0.3);
    transform: translateY(-4px);
    box-shadow: 0 10px 24px rgba(var(--p-primary-500-rgb), 0.12);
}
.action-card:nth-child(1) { animation-delay: 0.16s; }
.action-card:nth-child(2) { animation-delay: 0.24s; }
.action-card:nth-child(3) { animation-delay: 0.32s; }
.action-icon {
    width: 40px;
    height: 40px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(var(--p-primary-500-rgb), 0.12);
    border: 1px solid rgba(var(--p-primary-500-rgb), 0.2);
}
.action-card .pi {
    font-size: 1.2rem;
    color: rgba(var(--p-primary-500-rgb), 0.8);
}
.action-title {
    font-weight: 600;
}
.action-subtitle {
    font-size: 0.85rem;
    color: var(--p-grey-2);
}
.overview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
}
.panel-card {
    container-type: inline-size;
    padding: 16px;
    border-radius: 16px;
    background: linear-gradient(
        180deg,
        rgba(var(--p-primary-500-rgb), 0.03),
        rgba(255, 255, 255, 0)
    );
    border: 1px solid rgba(var(--p-primary-500-rgb), 0.12);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
    opacity: 0;
    transform: translateY(14px);
    animation: revealUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    transition: transform 0.28s ease, border-color 0.28s ease, box-shadow 0.28s ease;
}
.panel-card:hover {
    transform: translateY(-3px);
    border-color: rgba(var(--p-primary-500-rgb), 0.28);
}
.overview-grid .panel-card:nth-child(1) { animation-delay: 0.38s; }
.overview-grid .panel-card:nth-child(2) { animation-delay: 0.46s; }
.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}
.panel-header-main,
.panel-header-actions {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-width: 0;
}
.panel-header-main {
    flex: 1 1 auto;
}
.panel-header-main h3 {
    margin: 0;
    white-space: nowrap;
}
.panel-header-action {
    display: grid;
    width: 2.15rem;
    height: 2.15rem;
    flex: 0 0 auto;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--p-primary-color) 18%, transparent);
    border-radius: 0.72rem;
    background: color-mix(in srgb, var(--p-primary-color) 8%, transparent);
    color: var(--p-primary-color);
    text-decoration: none;
    transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}
.panel-header-action:hover {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--p-primary-color) 36%, transparent);
    background: color-mix(in srgb, var(--p-primary-color) 16%, transparent);
}
.panel-header-action-primary {
    background: var(--p-primary-color);
    border-color: var(--p-primary-color);
    color: var(--p-primary-contrast-color, #fff);
}
.panel-header-action-primary:hover {
    background: var(--p-primary-600);
}
.panel-title {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.panel-header:first-child {
    color: rgba(var(--p-primary-500-rgb), 0.8);
}

.panel-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.schedule-mode-switch :deep(.p-togglebutton-content) {
    padding: 2px 0.5rem;
}

:deep(.p-togglebutton) {
    background: linear-gradient(
        180deg,
        rgba(var(--p-primary-500-rgb), 0.45),
        rgba(var(--p-primary-500-rgb), 0.05)
    ) !important;
}
:deep(.p-togglebutton-checked::before) {
    background: rgba(var(--p-primary-400-rgb), 0.35) !important;
}
.schedule-mode-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    font-size: 1rem;
}
.schedule-current-target {
    color: var(--p-text-color);
    font-weight: 600;
}
.activity-item {
    color: var(--p-text-color);
}
.activity-item.muted {
    color: var(--p-text-color);
    font-size: 0.85rem;
}
.recent-tickets {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.recent-ticket {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border: 1px solid rgba(var(--p-primary-500-rgb), 0.14);
    border-radius: 12px;
    color: inherit;
    text-decoration: none;
    transition: background-color 0.2s ease, border-color 0.2s ease;
}
.recent-ticket:hover {
    background: rgba(var(--p-primary-500-rgb), 0.08);
    border-color: rgba(var(--p-primary-500-rgb), 0.3);
}
.recent-ticket-main {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 2px;
}
.recent-ticket-main strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.recent-ticket-main span {
    color: var(--p-grey-2);
    font-size: 0.78rem;
}
.schedule-mini {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.schedule-state {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.schedule-skeleton {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.schedule-skeleton-item {
    display: grid;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 16px;
    background: linear-gradient(
        180deg,
        rgba(var(--p-primary-500-rgb), 0.08),
        rgba(255, 255, 255, 0)
    );
    border: 1px solid rgba(var(--p-primary-500-rgb), 0.14);
}
.schedule-skeleton-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}
.schedule-mini-date {
    font-size: 0.85rem;
    color: var(--p-grey-2);
}
.schedule-mini-item {
    display: grid;
    grid-template-rows: auto auto auto;
    align-items: start;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 16px;
    background: linear-gradient(
        180deg,
        rgba(var(--p-primary-500-rgb), 0.08),
        rgba(255, 255, 255, 0)
    );
    border: 1px solid rgba(var(--p-primary-500-rgb), 0.16);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
    transition: transform 0.24s ease, border-color 0.24s ease;
}
.schedule-mini-item:hover {
    transform: translateX(4px);
    border-color: rgba(var(--p-primary-500-rgb), 0.26);
}
.schedule-badges {
    color: var(--p-text-color);
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
}
.badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
.schedule-time {
    font-size: 0.85rem;
    color: var(--p-primary-500);
    white-space: nowrap;
    background: rgba(var(--p-primary-500-rgb), 0.12);
    border: 1px solid rgba(var(--p-primary-500-rgb), 0.2);
    padding: 4px 8px;
    border-radius: 999px;
}
.schedule-title {
    font-size: 0.95rem;
    color: var(--p-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.schedule-room {
    font-size: 0.85rem;
    color: var(--p-primary-500);
    background: rgba(var(--p-primary-500-rgb), 0.12);
    border: 1px solid rgba(var(--p-primary-500-rgb), 0.2);
    padding: 4px 8px;
    border-radius: 999px;
    white-space: nowrap;
    justify-self: start;
}
.schedule-type {
    font-size: 0.8rem;
    color: var(--type-color);
    border: 1px solid color-mix(in srgb, var(--type-color), transparent 60%);
    background: color-mix(in srgb, var(--type-color), transparent 90%);
    padding: 4px 8px;
    border-radius: 999px;
    white-space: nowrap;
}

.p-dark .schedule-time,
.p-dark .schedule-room {
    color: var(--p-primary-200);
}

.schedule-fade-enter-active,
.schedule-fade-leave-active {
    transition: opacity 0.28s ease, transform 0.28s ease;
}
.schedule-fade-enter-from,
.schedule-fade-leave-to {
    opacity: 0;
    transform: translateY(6px);
}

@keyframes revealUp {
    from {
        opacity: 0;
        transform: translateY(18px) scale(0.985);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@keyframes pulseGlow {
    0%,
    100% {
        transform: scale(1);
        opacity: 0.8;
    }
    50% {
        transform: scale(1.08);
        opacity: 1;
    }
}

@keyframes driftBg {
    from {
        transform: translate3d(0, 0, 0);
    }
    to {
        transform: translate3d(0, 18px, 0);
    }
}

@media (prefers-reduced-motion: reduce) {
    .dashboard::before,
    .hero,
    .hero-glow,
    .action-card,
    .panel-card {
        animation: none !important;
        transform: none !important;
        opacity: 1 !important;
    }
    .action-card,
    .panel-card,
    .schedule-mini-item {
        transition: none !important;
    }
}

@media (max-width: 1024px) {
    .dashboard {
        padding-bottom: 1.5rem;
    }
    .hero h1 {
        font-size: 2rem;
    }
}

@media (min-width: 641px) and (max-width: 1200px) {
    .panel-header {
        align-items: flex-start;
    }

    .panel-header-main {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 0.6rem;
    }

    .schedule-mode-switch {
        width: 100%;
        max-width: 22rem;
    }

    .schedule-mode-switch :deep(.p-togglebutton) {
        flex: 1 1 0;
        min-width: 0;
    }
}

@container (max-width: 28rem) {
    .schedule-overview-card .panel-header {
        align-items: flex-start;
    }

    .schedule-overview-card .panel-header-main {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 0.6rem;
    }

    .schedule-overview-card .schedule-mode-switch {
        width: 100%;
        max-width: none;
    }

    .schedule-overview-card .schedule-mode-switch :deep(.p-togglebutton) {
        flex: 1 1 0;
        min-width: 0;
    }
}

@media (max-width: 640px) {
    .dashboard {
        padding-bottom: var(--app-mobile-bottom-offset);
        gap: 18px;
    }
    .hero {
        padding: 0.15rem 0;
    }
    .hero h1 {
        font-size: 1.65rem;
        line-height: 1.15;
    }
    .hero-pill {
        margin-bottom: 10px;
    }
    .actions-grid,
    .overview-grid {
        grid-template-columns: 1fr;
    }
    .action-card,
    .panel-card {
        border-radius: 18px;
    }
    .panel-header {
        align-items: flex-start;
        gap: 0.75rem;
        flex-wrap: nowrap;
    }

    .panel-header-main {
        flex: 1;
        flex-wrap: wrap;
        gap: 0.45rem 0.65rem;
    }

    .schedule-mode-switch :deep(.p-togglebutton) {
        min-height: 2.65rem;
    }

    .schedule-mode-switch :deep(.p-togglebutton-content) {
        justify-content: center;
        padding: 0.35rem 0.7rem;
    }

    .schedule-mode-icon {
        min-width: 2rem;
        font-size: 1.05rem;
    }

    .status-grid {
        grid-template-columns: 1fr;
    }

}
</style>
