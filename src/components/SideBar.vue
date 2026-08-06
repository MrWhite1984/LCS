<template>
    <ConfirmDialog></ConfirmDialog>
    <div 
        class="sidebar-container" 
        :class="[
            ['season-' + currentSeason, 'bg-image-' + currentSeason],
            { 'sidebar-mobile': isMobileMode },
            { 'sidebar-collapsed': collapsed, 'sidebar-expanded': !collapsed }
        ]"
    >
        <div class="rectangle" :class="{ 'season-overlay': !collapsed, 'collapsed': collapsed }">
            <div class="sidebar-top">
                <div v-if="debugMode && !collapsed" class="season-debug">
                    <Button 
                        icon="pi pi-refresh"
                        @click="cycleSeason"
                        text
                        size="small"
                        v-tooltip="'Сменить сезон'"
                    />
                    <Tag :value="seasonName" :severity="getSeasonSeverity(currentSeason)"/>
                </div>

                <div class="d-flex align-items-center justify-content-center logo-wrapper">
                    <router-link to="/overview" class="logoLCS">
                        <Lcs />
                    </router-link>
                </div>

                <button
                    v-if="collapsed"
                    type="button"
                    class="collapsed-search-trigger"
                    aria-label="Открыть поиск"
                    v-tooltip.right="'Поиск'"
                    @click="requestSearchFocus"
                >
                    <i class="pi pi-search"></i>
                </button>

                <IconField class="searchBar">
                    <InputIcon class="pi pi-search" />
                    <InputText 
                        id="searchQuery" 
                        name="searchQuery" 
                        class="search" 
                        v-model="searchQuery" 
                        placeholder="Поиск..." 
                    />
                </IconField>
            </div>

            <div class="sidebar-middle">
                <div v-if="searchQuery.trim()" class="navigation-search-results">
                    <div class="navigation-search-caption">Результаты поиска</div>
                    <div v-if="isNavigationSearchLoading" class="navigation-search-skeletons" aria-live="polite" aria-label="Поиск разделов">
                        <div v-for="width in [74, 58, 68]" :key="width" class="navigation-search-skeleton">
                            <Skeleton shape="circle" size="1.25rem" />
                            <div class="navigation-search-skeleton-copy">
                                <Skeleton :width="`${width}%`" height="0.8rem" />
                                <Skeleton width="36%" height="0.58rem" />
                            </div>
                        </div>
                    </div>
                    <template v-else>
                        <button
                            v-for="item in displayedNavigationSearchResults"
                            :key="item.path"
                            type="button"
                            class="menu-item menu-item-button navigation-search-item"
                            @click="navigateFromSearch(item.path)"
                        >
                            <div class="menu-item-content">
                                <i :class="item.icon"></i>
                                <div class="menucrumb navigation-search-copy">
                                    <span>{{ item.name }}</span>
                                    <small>{{ item.section }}</small>
                                </div>
                            </div>
                        </button>
                    </template>
                    <div v-if="!isNavigationSearchLoading && !displayedNavigationSearchResults.length" class="navigation-search-empty">
                        Ничего не найдено
                    </div>
                </div>

                <template v-else>
                <div class="menu menu-primary">
                    <template v-for="item in topItems" :key="item.id">
                        <button
                            v-if="item.id === 'notifications'"
                            type="button"
                            class="menu-item menu-item-button notification-menu-item"
                            :class="{ 'active-link': isNotificationsItemActive }"
                            @click="toggleNotificationsPopover"
                            v-tooltip.right="collapsed ? item.name : ''"
                        >
                            <div class="menu-item-content">
                                <Badge
                                    v-if="collapsed && notificationStore.unreadCount > 0"
                                    :value="notificationStore.unreadCount"
                                    severity="danger"
                                    class="notification-badge-collapsed"
                                />
                                <i :class="item.icon"></i>
                                <div class="menucrumb">
                                    <span>{{ item.name }}</span>
                                </div>
                                <Badge
                                    v-if="!collapsed && notificationStore.unreadCount > 0"
                                    :value="notificationStore.unreadCount"
                                    class="p-badge ms-3"
                                />
                            </div>
                        </button>

                        <router-link
                            v-else
                            :to="item.path"
                            class="menu-item"
                            active-class="active-link"
                            v-tooltip.right="collapsed ? item.name : ''"
                        >
                            <div class="menu-item-content">
                                <i :class="item.icon"></i>
                                <div class="menucrumb">
                                    <span>{{ item.name }}</span>
                                </div>
                            </div>
                        </router-link>
                    </template>

                    <Popover
                        ref="notificationsPopoverRef"
                        class="notifications-popover"
                        @show="handleNotificationsPopoverShow"
                        @hide="handleNotificationsPopoverHide"
                    >
                        <NotificationStack @navigate="handleNotificationNavigate" />
                    </Popover>
                </div>

                <div class="sidebar-nav-divider" aria-hidden="true"></div>
    
                <div class="menu" :class="{ 'mb-4': collapsed }">
                    <button
                        v-if="showServicesMenu"
                        type="button"
                        class="menu-item menu-item-button"
                        :class="{ 'active-link': servicesModalVisible }"
                        @click="toggleServicesPopover"
                        v-tooltip.right="collapsed ? 'Сервисы' : ''"
                    >
                        <div class="menu-item-content">
                            <i class="pi pi-th-large"></i>
                            <div class="menucrumb menucrumb-with-arrow">
                                <span>Сервисы</span>
                                <i class="pi pi-angle-right service-arrow"></i>
                            </div>
                        </div>
                    </button>
                    <button
                        v-for="item in directMenuItems"
                        :key="item.path"
                        type="button"
                        class="menu-item menu-item-button"
                        :class="{ 'menu-item-health': item.id === 'health-checks', 'active-link': route.path === item.path }"
                        @click="router.push(item.path)"
                        v-tooltip.right="collapsed ? item.name : ''"
                    >
                        <div class="menu-item-content">
                            <i :class="item.icon"></i>
                            <div class="menucrumb">
                                <span>{{ item.name }}</span>
                            </div>
                        </div>
                    </button>
                </div>
                </template>

            </div>
            
            <div class="sidebar-bottom">

                <div v-if="!collapsed && allowSeasonSelection" class="season-selector">
                    <div class="season-label">
                        <i :class="seasonIcon" class="me-2"></i>
                        <span>Сезон: {{ seasonName }}</span>
                    </div>
                    <Select 
                        v-model="selectedSeason"
                        :options="seasonOptions"
                        optionLabel="name"
                        optionValue="value"
                        @change="onSeasonChange"
                        class="season-select"
                        :placeholder="'Авто (' + seasonName + ')'"
                    />
                </div>

                <AccentColorEditor :isSideBarCollapse="collapsed" />

                <router-link 
                    class="profile" 
                    :to="profileLink"
                    v-tooltip.right="collapsed ? 'Профиль' : ''"
                >
                    <div class="profile-content">
                        <div class="avatar-wrapper">
                            <Avatar 
                                :label="initials" 
                                size="xlarge" 
                                shape="circle" 
                                class="initials-circle"
                            />
                        </div>
                        <div class="profile-info">
                            <div class="middle">
                                <div class="name">{{ fullName }}</div>
                                <div class="email">
                                    {{ email }}
                                </div>
                            </div>
                        </div>
                    </div>
                </router-link>

                <div class="row">
                    <div class="col">
                        <button @click="confirmLogout()" class="logout-button" v-tooltip.right="collapsed ? 'Выйти' : ''">
                            <div class="logout-content" :class="{ 'collapsed': collapsed }">
                                <i class="pi pi-sign-out"></i>
                                <p class="logout-text">Выйти из аккаунта</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <ServicesCatalogModal
        :visible="servicesModalVisible"
        :items="servicesCatalogItems"
        :platform-items="platformsCatalogItems"
        :admin-items="adminCatalogItems"
        @update:visible="onServicesModalVisibilityChange"
    />
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import Popover from 'primevue/popover';

import Lcs from '@/assets/logo/lcs.svg';

import NotificationStack from '@/components/Notifications/NotificationStack.vue';
import { useNotificationStore } from '@/stores/notifications.js';
import { usePermissionStore } from '@/stores/permissions.js';
import { disconnectNotificationsHub } from '@/utils/notificationHub.js';

import AccentColorEditor from './Utils/AccentColorEditor.vue';
import ServicesCatalogModal from './ServicesCatalogModal.vue';

import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { useRoute, useRouter } from 'vue-router';
import { clearAuthData } from '@/utils/TokenService.js';
import { resetRequestAccessCache } from '@/utils/requestAccess.js';
import { getCurrentUser, resetCurrentUserCache } from '@/utils/currentUser.js';
import { runLogoutClipTransition } from '@/composables/logoutTransition';
import { useResponsiveLayout } from '@/composables/useResponsiveLayout.js';
import { useAppNavigation } from '@/composables/useAppNavigation.js';

// Импортируем утилиты для сезонов
import { 
    getCurrentSeason, 
    getSeasonName, 
    getSeasonIcon,
} from '@/utils/seasons.js';
import { syncPrimaryTheme } from '@/utils/accentTheme.js';

const props = defineProps({
    collapsed: {
        type: Boolean,
        default: false
    },
    mobile: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['overlay-open', 'overlay-close', 'request-expand']);

const confirm = useConfirm();
const toast = useToast();
const router = useRouter();
const route = useRoute();

const notificationStore = useNotificationStore();
const permissionStore = usePermissionStore();

// Сезоны
const debugMode = ref(false);
const allowSeasonSelection = ref(false);
const currentSeason = ref(getCurrentSeason());
const selectedSeason = ref(null);
const { isPhone } = useResponsiveLayout();
const isMobileMode = computed(() => props.mobile || isPhone.value);

// Опции для выбора сезона
const seasonOptions = [
    { name: 'Авто (по месяцу)', value: null },
    { name: 'Зима', value: 'winter' },
    { name: 'Весна', value: 'spring' },
    { name: 'Лето', value: 'summer' },
    { name: 'Осень', value: 'autumn' }
];

const userId = ref(null);
const firstName = ref('');
const lastName = ref('');
const email = ref('');
const initials = ref('');
const fullName = ref('');
const searchQuery = ref('');
const displayedNavigationSearchResults = ref([]);
const isNavigationSearchLoading = ref(false);
let navigationSearchTimer = null;
const servicesModalVisible = ref(false);
const notificationsPopoverRef = ref(null);
const notificationsPopoverVisible = ref(false);
const {
    hasPermission,
    topItems,
    serviceItems,
    adminItems,
    ticketsItems: visibleTicketsMenuItems,
    idoItems: visibleIdoMenuItems,
    umuSiriusItems: visibleUmuSiriusMenuItems,
    projectOfficeItems: visibleProjectOfficeMenuItems,
    showTicketsMenu,
    showIdoMenu,
    showUmuSiriusMenu,
    showProjectOfficeMenu,
} = useAppNavigation();

// Вычисляемые свойства для сезона
const seasonName = computed(() => getSeasonName(currentSeason.value));
const seasonIcon = computed(() => getSeasonIcon(currentSeason.value));
const profileLink = computed(() => {
    if (!userId.value) return '/profile';

    const params = new URLSearchParams({ id: String(userId.value) });
    return `/profile?${params.toString()}`;
});
const isNotificationsItemActive = computed(() => (
    notificationsPopoverVisible.value || route.path === '/notif'
));

const healthCheckItem = computed(() => adminItems.value.find((item) => item.id === 'health-checks'));
const adminCatalogItems = computed(() => adminItems.value.filter((item) => item.id !== 'health-checks'));
const directMenuItems = computed(() => [
    ...serviceItems.value.filter((item) => ['schedule', 'faq'].includes(item.id)),
    ...(healthCheckItem.value ? [healthCheckItem.value] : []),
]);
const servicesCatalogItems = computed(() => {
    const items = serviceItems.value
        .filter((item) => !['schedule', 'faq', 'umu-sirius', 'project-office'].includes(item.id));

    if (showTicketsMenu.value) {
        items.push({ id: 'tickets', name: 'Справки', icon: 'pi pi-ticket', children: visibleTicketsMenuItems.value });
    }

    if (showIdoMenu.value) {
        items.push({ id: 'ido', name: 'ИДО', icon: 'pi pi-building-columns', children: visibleIdoMenuItems.value });
    }

    return items;
});

const platformsCatalogItems = computed(() => {
    const items = [];

    if (showUmuSiriusMenu.value) {
        items.push({ id: 'umu-sirius', name: 'УМУ', icon: 'pi pi-briefcase', children: visibleUmuSiriusMenuItems.value, badge: 'Скоро' });
    }

    if (showProjectOfficeMenu.value) {
        items.push({ id: 'project-office', name: 'Проектный офис', icon: 'pi pi-paperclip', children: visibleProjectOfficeMenuItems.value, badge: 'Скоро', disabled: true });
    }

    return items;
});

const showServicesMenu = computed(() => (
    servicesCatalogItems.value.length > 0
    || platformsCatalogItems.value.length > 0
    || adminItems.value.length > 0
    || hasPermission('InfraManager', 'Read')
));
const navigationSearchResults = computed(() => {
    const query = searchQuery.value.trim().toLowerCase();
    if (!query) return [];

    const withSection = (items, section) => (Array.isArray(items?.value)
        ? items.value.map((item) => ({ ...item, section }))
        : []);

    const entries = [
        ...withSection(topItems, 'Основное'),
        ...withSection(serviceItems, 'Сервисы'),
        ...withSection(visibleTicketsMenuItems, 'Справки'),
        ...withSection(visibleIdoMenuItems, 'ИДО'),
        ...withSection(visibleUmuSiriusMenuItems, 'УМУ'),
        ...withSection(visibleProjectOfficeMenuItems, 'Проектный офис'),
        ...withSection(adminItems, 'Администрирование'),
    ];

    return [...new Map(entries.map((item) => [item.path, item])).values()]
        .filter((item) => item.name.toLowerCase().includes(query))
        .slice(0, 8);
});

watch(searchQuery, (query) => {
    window.clearTimeout(navigationSearchTimer);

    if (!query.trim()) {
        isNavigationSearchLoading.value = false;
        displayedNavigationSearchResults.value = [];
        return;
    }

    isNavigationSearchLoading.value = true;
    navigationSearchTimer = window.setTimeout(() => {
        displayedNavigationSearchResults.value = navigationSearchResults.value;
        isNavigationSearchLoading.value = false;
    }, 240);
});

onBeforeUnmount(() => {
    window.clearTimeout(navigationSearchTimer);
});

// Функции
const getInitials = (firstName, lastName) => {
    const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
    return initials;
};

const toggleServicesPopover = () => {
    servicesModalVisible.value = true;
    emit('overlay-open');
};

const navigateFromSearch = async (path) => {
    searchQuery.value = '';
    await router.push(path);
};

const requestSearchFocus = () => {
    emit('request-expand');
};

const onServicesModalVisibilityChange = (visible) => {
    servicesModalVisible.value = visible;

    if (!visible) {
        emit('overlay-close');
    }
};

const positionNotificationsPopover = () => {
    const container = notificationsPopoverRef.value?.container;
    const target = notificationsPopoverRef.value?.target;

    if (!container || !target) {
        return;
    }

    const targetRect = target.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const viewportTop = window.scrollY + 12;
    const viewportLeft = window.scrollX + 12;
    const maxLeft = window.scrollX + window.innerWidth - containerRect.width - 12;
    const maxTop = window.scrollY + window.innerHeight - containerRect.height - 12;

    const left = Math.max(
        viewportLeft,
        Math.min(window.scrollX + targetRect.right + 14, maxLeft)
    );
    const top = Math.max(
        viewportTop,
        Math.min(window.scrollY + targetRect.top - 6, maxTop)
    );

    container.style.left = `${left}px`;
    container.style.top = `${top}px`;
    container.style.margin = '0';
    container.removeAttribute('data-p-popover-flipped');
    container.classList.remove('p-popover-flipped');
};

const toggleNotificationsPopover = (event) => {
    notificationsPopoverRef.value?.toggle(event);
};

const handleNotificationsPopoverShow = async () => {
    notificationsPopoverVisible.value = true;
    await nextTick();
    positionNotificationsPopover();
};

const handleNotificationsPopoverHide = () => {
    notificationsPopoverVisible.value = false;
};

const handleNotificationNavigate = () => {
    notificationsPopoverRef.value?.hide();
};

// Функции для работы с сезонами
const getSeasonSeverity = (season) => {
    const severityMap = {
        'winter': 'info',
        'spring': 'success',
        'summer': 'warning',
        'autumn': 'danger'
    };
    return severityMap[season] || 'secondary';
};

const cycleSeason = () => {
    const seasons = ['winter', 'spring', 'summer', 'autumn'];
    const currentIndex = seasons.indexOf(currentSeason.value);
    const nextIndex = (currentIndex + 1) % seasons.length;
    currentSeason.value = seasons[nextIndex];
    saveSeasonPreference();
};

const onSeasonChange = (value) => {
    if (value) {
        currentSeason.value = value;
    } else {
        currentSeason.value = getCurrentSeason();
    }
    saveSeasonPreference();
};

const saveSeasonPreference = () => {
    if (selectedSeason.value) {
        localStorage.setItem('seasonOverride', selectedSeason.value);
    } else {
        localStorage.removeItem('seasonOverride');
    }
};

const loadSeasonPreference = () => {
    const savedSeason = localStorage.getItem('seasonOverride');
    if (savedSeason && ['winter', 'spring', 'summer', 'autumn'].includes(savedSeason)) {
        selectedSeason.value = savedSeason;
        currentSeason.value = savedSeason;
    } else {
        selectedSeason.value = null;
        currentSeason.value = getCurrentSeason();
    }
};

watch(currentSeason, () => {
    syncPrimaryTheme();
});

watch(
    () => route.path,
    () => {
        notificationsPopoverRef.value?.hide();
        servicesModalVisible.value = false;
    },
    { immediate: true }
);

watch(
    () => props.collapsed,
    (collapsed) => {
        if (collapsed) {
            notificationsPopoverRef.value?.hide();
        }
    }
);

let lastCheckedMonth = null;

const confirmLogout = () => {
    confirm.require({
        message: 'Вы действительно хотите выйти?',
        header: 'Выход из аккаунта',
        icon: 'pi pi-info-circle',
        rejectLabel: 'Отмена',
        rejectProps: {
            label: 'Cancel',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Выйти',
            severity: 'danger'
        },
        accept: () => {
            logout();
        },
        reject: () => {
            toast.add({ severity: 'info', summary: 'Отклонено', detail: 'Вы отклонили выход', life: 3000 })
        }
    });
};

const logout = async () => {
    let ssoLogoutUrl = null;

    try {
        const response = await axiosInstance.post('/api/auth/sso/logout/redirection');
        ssoLogoutUrl = response.data || null;
    } catch (error) {
        console.error('Не удалось получить URL для выхода из SSO:', error);
    }

    await disconnectNotificationsHub();
    notificationStore.reset();
    clearAuthData();
    await permissionStore.clearPermissions();
    await permissionStore.$reset();
    resetRequestAccessCache();
    resetCurrentUserCache();

    sessionStorage.setItem('loggedOut', '1');

    if (ssoLogoutUrl) {
        await runLogoutClipTransition(() => {
            window.location.href = ssoLogoutUrl;
            return new Promise(() => {});
        });
    } else {
        await runLogoutClipTransition(() => router.push('/auth'));
    }
};

onMounted(async () => {
    loadSeasonPreference();
    syncPrimaryTheme();
    lastCheckedMonth = new Date().getMonth();

    try {
        const response = await getCurrentUser();

        firstName.value = response.firstName;
        lastName.value = response.lastName;
        email.value = response.email;

        fullName.value = `${firstName.value} ${lastName.value}`.trim();
        initials.value = getInitials(firstName.value, lastName.value);

        userId.value = response.id;
        localStorage.setItem('firstName', response.firstName);

    } catch (error) {
        console.debug('Ошибка при получении информации о пользователе: ', error);
    }
});
</script>

<style scoped>
/* ============ ОСНОВНЫЕ СТИЛИ САЙДБАРА ============ */
.sidebar-container {
    --sidebar-tint: rgba(var(--p-blue-500-rgb), 0.22);
    height: 100vh;
    display: flex;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
    transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    will-change: width;
    contain: strict;
    isolation: isolate;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    background: rgba(var(--p-bg-color-rgb), 0.16);
}

.sidebar-container.sidebar-collapsed {
    width: 100% !important;
}

.sidebar-container.sidebar-expanded {
    width: 100% !important;
}

.sidebar-container.sidebar-mobile {
    min-height: 100%;
    height: 100%;
}

/* ============ МАТОВОЕ СТЕКЛО И МИКРОЗЕРНО ============ */
.sidebar-container::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 1;
    z-index: 0;
    background:
        radial-gradient(circle at 12% 8%, var(--sidebar-tint), transparent 42%),
        radial-gradient(circle at 92% 78%, rgba(255, 255, 255, 0.13), transparent 38%),
        linear-gradient(160deg, rgba(255, 255, 255, 0.14), transparent 55%);
    transition: background 0.7s ease;
}

.sidebar-container::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0.075;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.9'/%3E%3C/svg%3E");
    background-size: 170px 170px;
    mix-blend-mode: soft-light;
}

/* ============ ОСНОВНОЙ КОНТЕЙНЕР ============ */
.rectangle {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 1.5rem 1rem;
    transition: padding 0.42s cubic-bezier(0.22, 1, 0.36, 1), background 0.28s ease;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
    will-change: transform, padding;
    background: linear-gradient(
        160deg,
        rgba(var(--p-bg-color-rgb), 0.66) 0%,
        rgba(var(--p-bg-color-2-rgb), 0.44) 100%
    );
    backdrop-filter: blur(24px) saturate(135%);
    -webkit-backdrop-filter: blur(24px) saturate(135%);
    position: relative;
    z-index: 1;
}

.rectangle.season-overlay {
    background: linear-gradient(
        145deg,
        color-mix(in srgb, var(--sidebar-tint) 52%, rgba(var(--p-bg-color-rgb), 0.66)) 0%,
        rgba(var(--p-bg-color-2-rgb), 0.44) 64%
    );
}

.rectangle.collapsed {
    padding: 1.5rem 0.5rem;
}

/* ============ СТРУКТУРНЫЕ БЛОКИ ============ */
.sidebar-top {
    flex-shrink: 0;
    z-index: 2;
}

.sidebar-middle {
    position: relative;
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    margin: .5rem 0;
    scrollbar-width: none;

    mask-image: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0.35) 0%,
        black 12%,
        black 88%,
        rgba(0, 0, 0, 0.35) 100%
    );
    -webkit-mask-image: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0.35) 0%,
        black 12%,
        black 88%,
        rgba(0, 0, 0, 0.35) 100%
    );
}

.sidebar-middle::-webkit-scrollbar {
    display: none;
}

.navigation-search-results {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding: 0.5rem 0;
}

.navigation-search-caption {
    padding: 0 0.75rem 0.45rem;
    color: var(--p-text-muted-color, var(--p-text-color-secondary));
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.navigation-search-item {
    min-height: 52px;
}

.navigation-search-skeletons {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.navigation-search-skeleton {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    min-height: 52px;
    padding: 0.65rem 0.75rem;
}

.navigation-search-skeleton-copy {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
    gap: 0.38rem;
}

.navigation-search-copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.1rem;
}

.navigation-search-copy small {
    color: var(--p-text-muted-color, var(--p-text-color-secondary));
    font-size: 0.72rem;
    font-weight: 500;
}

.navigation-search-empty {
    padding: 1rem 0.75rem;
    color: var(--p-text-muted-color, var(--p-text-color-secondary));
    font-size: 0.9rem;
    text-align: center;
}

/* Фоновый градиент */
.sidebar-middle::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;
    opacity: 0.3;
    
    background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.8) 100%
    );
    
    .p-dark & {
        background: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.6) 100%
        );
    }
}

.sidebar-bottom {
    display: flex;
    flex-direction: column;
    gap: .5rem;
    position: relative;
    padding-top: 1rem;
    z-index: 2;
    width: 100%;
    box-sizing: border-box;
}

.sidebar-bottom::before {
    position: absolute;
    top: 0;
    right: 1rem;
    left: 1rem;
    height: 1px;
    content: '';
    background: linear-gradient(
        90deg,
        transparent,
        color-mix(in srgb, var(--p-text-color) 20%, transparent),
        transparent
    );
}
.rectangle.collapsed .sidebar-bottom {
    padding: 0.5rem 0 0.125rem;
}

.rectangle.collapsed .sidebar-bottom::before {
    right: 0.65rem;
    left: 0.65rem;
}
.rectangle:not(.collapsed) .sidebar-bottom {
    align-items: stretch;
}
.rectangle.collapsed .sidebar-bottom {
    align-items: center;
}
.rectangle.collapsed .profile {
    padding: 0.5rem;
    justify-content: center;
}

.rectangle.collapsed .initials-circle {
    width: 44px !important;
    height: 44px !important;
    font-size: 16px;
}

.rectangle.collapsed .logout-button {
    padding: 0.5rem;
    justify-content: center;
}

/* ============ ЛОГОТИП ============ */
.logo-wrapper {
    margin-bottom: 2rem;
    transition: margin 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.rectangle.collapsed .logo-wrapper {
    margin-bottom: 1.5rem;
}

.logoLCS {
    display: block;
    transform: scale(1);
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    will-change: transform;
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15));
}

.rectangle:not(.collapsed) .logoLCS {
    transform: scale(0.85);
}

.rectangle.collapsed .logoLCS {
    transform: scale(0.5);
}

.logoLCS:hover {
    transform: scale(0.95);
    filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.25));
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ============ ПОИСК ============ */
.searchBar {
    opacity: 1;
    max-height: 44px;
    transform: translateY(0);
    transition: 
        opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1),
        max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1),
        margin 0.4s cubic-bezier(0.16, 1, 0.3, 1),
        transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    will-change: opacity, max-height, margin, transform;
}

.collapsed-search-trigger {
    display: grid;
    width: 48px;
    height: 48px;
    margin: 0 auto 0.75rem;
    place-items: center;
    border: 1px solid transparent;
    border-radius: 12px;
    background: transparent;
    color: var(--p-text-color);
    cursor: pointer;
    transition: background 0.22s ease, color 0.22s ease, transform 0.22s ease;
}

.collapsed-search-trigger:hover {
    background: var(--p-blue-500-low-op);
    color: var(--p-primary-color);
    transform: translateY(-1px);
}

.collapsed-search-trigger .pi {
    font-size: 1.25rem;
}

.rectangle.collapsed .searchBar {
    opacity: 0;
    max-height: 0;
    margin: 0;
    transform: translateY(-10px);
    pointer-events: none;
}

.search {
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    font-size: 14px;
    width: 100%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.search:focus {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(var(--p-blue-500-rgb), 0.5);
    box-shadow: 0 0 0 3px rgba(var(--p-blue-500-rgb), 0.1);
}

/* ============ МЕНЮ ============ */
.menu {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: .125rem;
    transition: gap 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    contain: layout style;
}

.sidebar-nav-divider {
    height: 1px;
    margin: 0.7rem 1rem 0.85rem;
    background: linear-gradient(
        90deg,
        transparent,
        color-mix(in srgb, var(--p-text-color) 20%, transparent),
        transparent
    );
    opacity: 0.8;
    transition: margin 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
}

.rectangle.collapsed .sidebar-nav-divider {
    margin: 0.4rem 0.65rem;
    opacity: 0.5;
}

.menu-primary {
    margin-top: 1rem;
}

.menu-item {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    height: 48px;
    border-radius: 12px;
    transition:
        background-color 0.3s cubic-bezier(0.16, 1, 0.3, 1),
        border-color 0.3s cubic-bezier(0.16, 1, 0.3, 1),
        box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1),
        transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
        color 0s linear;
    text-decoration: none;
    color: var(--p-text-color);
    border: 2px solid transparent;
    contain: layout;
    background: transparent;
    overflow: hidden;
}

.menu-item-button {
    padding: 0;
    appearance: none;
    cursor: pointer;
}

.menu-item-health {
    margin-top: 0.25rem;
    border: 1px solid rgba(34, 197, 94, 0.2);
    background: linear-gradient(90deg, rgba(34, 197, 94, 0.1), transparent);
}

.menu-item-health .menu-item-content > .pi {
    color: #16a34a;
}

.menu-item-health:not(.active-link)::before {
    content: '';
    width: 0.42rem;
    height: 0.42rem;
    margin-left: 0.65rem;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
}

.rectangle.collapsed .menu-item-health:not(.active-link)::before {
    display: none;
}

.menu-item-content {
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
    position: relative;
    padding: 0 1rem;
    transition: padding 0.42s cubic-bezier(0.22, 1, 0.36, 1);
}

.rectangle.collapsed .menu-item-content {
    padding: 0;
    justify-content: center;
}

.menu-item:hover {
    background: var(--p-blue-500-low-op) !important;
    color: rgb(var(--p-color-icon-menu));
}

.menu-item.active-link {
    background: var(--p-blue-500-low-op);
    color: var(--p-primary-500);
    box-shadow: 
        0 4px 12px rgba(var(--p-blue-500-rgb), 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    animation: menu-active-switch 0.42s cubic-bezier(0.22, 1, 0.36, 1);
}

.menu-item-open {
    border-color: rgba(var(--p-blue-500-rgb), 0.18);
}

.p-dark .menu-item.active-link {
    color: var(--p-primary-300);
}

/* ============ ИКОНКИ МЕНЮ ============ */
.menu-item .pi {
    font-size: 1.25rem;
    position: relative;
    transition:
        transform 0.42s cubic-bezier(0.22, 1, 0.36, 1),
        margin 0.42s cubic-bezier(0.22, 1, 0.36, 1),
        font-size 0.42s cubic-bezier(0.22, 1, 0.36, 1),
        color 0s linear;
    will-change: transform;
    min-width: 24px;
    text-align: center;
}

.menu-item.active-link .pi {
    animation: menu-icon-pop 0.42s cubic-bezier(0.22, 1, 0.36, 1);
}

.rectangle:not(.collapsed) .menu-item .pi {
    margin-right: 1rem;
}

/* Иконки остаются на одной оси во время раскрытия сайдбара. */
.rectangle:not(.collapsed) .menu-item-content {
    padding-left: 0;
}

.rectangle.collapsed .menu-item .pi {
    margin: 0;
    font-size: 1.25rem;
}

/* ============ ТЕКСТ МЕНЮ ============ */
.menucrumb {
    font-family: 'SF Pro Rounded';
    font-weight: 500;
    font-size: 0.9375rem;
    opacity: 1;
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    transition: 
        opacity 0.18s ease,
        max-width 0.36s cubic-bezier(0.22, 1, 0.36, 1),
        transform 0.36s cubic-bezier(0.22, 1, 0.36, 1);
    will-change: opacity, max-width, transform;
    transform: translateX(0);
    text-overflow: ellipsis;
}

.menu-item.active-link .menucrumb {
    animation: menu-label-glide 0.42s cubic-bezier(0.22, 1, 0.36, 1);
}

.rectangle.collapsed .menucrumb {
    opacity: 0;
    max-width: 0;
    transform: translateX(-10px);
}

.rectangle:not(.collapsed) .menucrumb {
    opacity: 1;
    max-width: 200px;
    transform: translateX(0);
    transition-delay: 0.055s;
}

.menucrumb-with-arrow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    width: 100%;
}

.ido-arrow {
    margin-left: auto;
    margin-right: 0 !important;
    font-size: 0.95rem !important;
    transition: transform 0.25s ease;
}

.ido-arrow-open {
    transform: rotate(180deg);
}

.service-arrow {
    margin-left: auto;
    margin-right: 0 !important;
    font-size: 0.95rem !important;
    transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.menu-item:hover .service-arrow,
.menu-item.active-link .service-arrow {
    transform: translateX(3px);
}

.ido-menu-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.ido-submenu {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-left: 1.1rem;
    padding: 0.35rem 0 0.35rem 1rem;
    border-left: 1px solid rgba(var(--p-blue-500-rgb), 0.18);
}

.ido-submenu-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 40px;
    padding: 0.65rem 0.85rem;
    border-radius: 12px;
    color: var(--p-text-color);
    text-decoration: none;
    transition: all 0.25s ease;
}

.ido-submenu-item:hover,
.ido-submenu-item-active {
    background: rgba(var(--p-blue-500-rgb), 0.12);
    color: rgb(var(--p-color-icon-menu));
}

.ido-submenu-item .pi {
    font-size: 0.95rem;
}

.ido-submenu-enter-active,
.ido-submenu-leave-active {
    transition: all 0.25s ease;
    overflow: hidden;
}

.ido-submenu-enter-from,
.ido-submenu-leave-to {
    opacity: 0;
    transform: translateY(-6px);
    max-height: 0;
}

.ido-submenu-enter-to,
.ido-submenu-leave-from {
    opacity: 1;
    transform: translateY(0);
    max-height: 240px;
}

/* ============ ЗАГОЛОВКИ РАЗДЕЛОВ ============ */
.general {
    font-family: 'SF Pro Rounded';
    font-weight: 700;
    font-size: 0.875rem;
    color: var(--p-text-color);
    opacity: 1;
    max-height: 40px;
    overflow: hidden;
    padding: 0.5rem 1rem 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: 
        opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1),
        max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1),
        padding 0.4s cubic-bezier(0.16, 1, 0.3, 1),
        margin 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    will-change: opacity, max-height, padding, margin;
}

.rectangle.collapsed .general {
    opacity: 0;
    max-height: 0;
    padding: 0;
    margin: 0;
}

.rectangle:not(.collapsed) .general {
    opacity: 1;
    max-height: 40px;
    transition-delay: 0.2s;
}

/* ============ ПРОФИЛЬ ============ */
.profile {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    border-radius: 12px;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    text-decoration: none;
    color: var(--p-text-color);
    background: rgba(255, 255, 255, 0.15);
    border: 2px solid transparent;
    contain: layout;
    width: 100%;
}

.profile:hover {
    background: var(--p-blue-500-low-op);
    border-color: var(--p-blue-500-low-op);
}

.profile-content {
    display: flex;
    align-items: center;
    width: 100%;
    transition: gap 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    gap: 1rem;
}

.rectangle.collapsed .profile-content {
    justify-content: center;
    gap: 0;
}

.rectangle.collapsed .profile {
    padding: 0.25rem 0.5rem;
}

.avatar-wrapper {
    flex-shrink: 0;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.initials-circle {
    background: linear-gradient(135deg, var(--p-blue-500), var(--p-blue-700));
    color: white;
    font-weight: 700;
    font-family: 'SF Pro Rounded', -apple-system, BlinkMacSystemFont, sans-serif;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    will-change: transform;
    box-shadow: 0 4px 12px rgba(var(--p-blue-500-rgb), 0.3);
}

.rectangle.collapsed .initials-circle {
    transform: scale(0.9);
}

.profile-info {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    transition: opacity 0.18s ease, max-width 0.36s cubic-bezier(0.22, 1, 0.36, 1), transform 0.36s cubic-bezier(0.22, 1, 0.36, 1);
}

.rectangle.collapsed .profile-info {
    opacity: 0;
    max-width: 0;
    transform: translateX(-8px);
}

.rectangle:not(.collapsed) .profile-info {
    opacity: 1;
    max-width: 200px;
    transform: translateX(0);
    transition-delay: 0.055s;
}

.middle {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.name {
    font-family: 'SF Pro Rounded', -apple-system, BlinkMacSystemFont, sans-serif;
    font-weight: 600;
    font-size: 1rem;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.email {
    font-family: 'SF Pro Rounded', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 0.875rem;
    color: var(--p-text-color-secondary);
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* ============ КНОПКА ВЫХОДА ============ */
.logout-button {
    width: 100%;
    border: 2px solid transparent;
    background: transparent;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    color: var(--p-text-color);
    cursor: pointer;
    contain: layout;
}

.logout-button:hover {
    border-color: var(--p-red-500);
    color: var(--p-red-500);
}

.logout-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.logout-content.collapsed {
    gap: 0;
}

.logout-icon {
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    flex-shrink: 0;
}

.logout-text {
    font-family: 'SF Pro Rounded';
    font-weight: 500;
    font-size: 0.9375rem;
    margin: 0;
    transition: 
        opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1),
        max-width 0.4s cubic-bezier(0.16, 1, 0.3, 1),
        transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    will-change: opacity, max-width, transform;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.rectangle.collapsed .logout-text {
    opacity: 0;
    max-width: 0;
    transform: translateX(-10px);
}

.rectangle:not(.collapsed) .logout-text {
    opacity: 1;
    max-width: 200px;
    transform: translateX(0);
    transition-delay: 0.055s;
}

/* ============ БЕЙДЖИ ============ */
.p-badge {
    background: linear-gradient(135deg, var(--p-red-500), var(--p-red-700));
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 10px;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 2px 8px rgba(var(--p-red-500-rgb), 0.3);
    margin-left: auto;
}

.notification-badge-collapsed {
    position: absolute;
    top: 4px;
    right: 7px;
    z-index: 12;
    min-width: 1.1rem;
    height: 1.1rem;
    margin: 0;
    padding: 0 0.25rem;
    line-height: 1.1rem;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform-origin: center;
}

.notification-menu-item {
    overflow: visible;
}

:deep(.notifications-popover.p-popover) {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    overflow: visible;
}

:deep(.notifications-popover .p-popover-content) {
    padding: 0 !important;
    background: transparent !important;
}

/* ============ SEASON SELECTOR ============ */
.season-selector {
    margin: 1rem 0;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.season-label {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
    font-family: 'SF Pro Rounded', -apple-system, BlinkMacSystemFont, sans-serif;
    font-weight: 500;
    color: var(--p-text-color);
}

.season-select {
    width: 100%;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ============ АНИМАЦИЯ ПРИ ПЕРЕКЛЮЧЕНИИ ============ */
.sidebar-container {
    animation: sidebarEntrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes sidebarEntrance {
    0% {
        opacity: 0;
        transform: translateX(-20px);
    }
    100% {
        opacity: 1;
        transform: translateX(0);
    }
}

/* ============ ОПТИМИЗАЦИЯ ДЛЯ MOBILE ============ */
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}

/* ============ TOOLTIP ADJUSTMENTS ============ */
[v-tooltip] {
    position: relative;
}

/* ============ DARK THEME ADJUSTMENTS ============ */
.p-dark .rectangle {
    background: linear-gradient(
        180deg,
        rgba(30, 30, 40, 0.15) 0%,
        rgba(20, 20, 30, 0.65) 100%
    );
    border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.p-dark .search {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    color: var(--p-text-color);
}

.p-dark .menu-item.active-link {
    background: var(--p-blue-500-low-op) !important;
}

/* ============ PERFORMANCE OPTIMIZATIONS ============ */
.sidebar-container,
.rectangle,
.menu-item,
.profile,
.logout-button {
    transform: translateZ(0);
    backface-visibility: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/* ============ RTL SUPPORT ============ */
[dir="rtl"] .sidebar-container {
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    border-right: none;
}

[dir="rtl"] .menu-item:hover {
    transform: translateX(-4px);
}

@keyframes menu-active-switch {
    0% {
        transform: translateX(6px) scale(0.985);
        filter: saturate(0.9);
    }
    60% {
        transform: translateX(-1px) scale(1.008);
        filter: saturate(1.06);
    }
    100% {
        transform: translateX(0) scale(1);
        filter: saturate(1);
    }
}

@keyframes menu-active-bar {
    0% {
        opacity: 0;
        transform: translateY(-50%) scaleY(0.3);
    }
    100% {
        opacity: 1;
        transform: translateY(-50%) scaleY(1);
    }
}

@keyframes menu-icon-pop {
    0% {
        transform: scale(0.85) translateX(-3px);
    }
    55% {
        transform: scale(1.12) translateX(1px);
    }
    100% {
        transform: scale(1) translateX(0);
    }
}

@keyframes menu-label-glide {
    0% {
        opacity: 0.45;
        transform: translateX(8px);
    }
    100% {
        opacity: 1;
        transform: translateX(0);
    }
}

[dir="rtl"] .rectangle.collapsed .menucrumb {
    transform: translateX(10px);
}

[dir="rtl"] .logout-button:hover {
    transform: translateX(-4px);
}

/* ============ DEBUG MODE ============ */
.season-debug {
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 1000;
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

/* ============ RESPONSIVE ADJUSTMENTS ============ */
@media (max-width: 767px) {
    .sidebar-container:not(.sidebar-mobile) {
        width: 90px !important;
        max-width: 90px;
        border-radius: 0;
    }
    
    .sidebar-container.sidebar-expanded:not(.sidebar-mobile) {
        width: 280px !important;
        max-width: 280px;
    }

    .sidebar-container.sidebar-mobile {
        width: 100% !important;
        max-width: none;
        border-radius: 0;
    }
    
    .rectangle {
        padding: 1rem 0.5rem;
    }
    
    .rectangle:not(.collapsed) {
        padding: 1.5rem 1rem;
    }
}

@media (max-height: 700px) {
    .sidebar-middle {
        margin: 0.5rem 0;
    }
    
    .menu {
        margin-bottom: 0.75rem;
    }
    
    .menu-item {
        height: 42px;
    }
}

/* ============ ЭФФЕКТ ПРИ СКРОЛЛЕ ============ */
.sidebar-middle.scrolling::after {
    opacity: 1;
}

/* ============ PRINT STYLES ============ */
@media print {
    .sidebar-container {
        display: none;
    }
}

/* ============ ОПТИМИЗАЦИЯ ДЛЯ IOS ============ */
@supports (-webkit-touch-callout: none) {
    .sidebar-middle {
        -webkit-overflow-scrolling: touch;
    }
}
</style>
