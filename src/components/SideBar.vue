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

                <IconField v-if="!collapsed" class="searchBar">
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
                <div class="menu" :class="{ 'mt-3': !collapsed, 'my-4': collapsed }">
                    <template v-for="item in topItems" :key="item.id">
                        <button
                            v-if="item.id === 'notifications'"
                            type="button"
                            class="menu-item menu-item-button"
                            :class="{ 'active-link': isNotificationsItemActive }"
                            @click="toggleNotificationsPopover"
                            v-tooltip.right="collapsed ? item.name : ''"
                        >
                            <div class="menu-item-content">
                                <OverlayBadge
                                    v-if="collapsed && notificationStore.unreadCount > 0"
                                    :value="notificationStore.unreadCount"
                                    severity="danger"
                                    class="notification-badge-collapsed"
                                />
                                <i :class="item.icon"></i>
                                <div v-if="!collapsed" class="menucrumb">
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
                                <div v-if="!collapsed" class="menucrumb">
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
    
                <div class="menu" :class="{ 'mb-4': collapsed }">
                    <div v-if="!collapsed && serviceItems.length" class="general mt-2">Сервисы</div>
                    <div v-for="item in serviceItems" :key="item.path">
                        <router-link 
                            :to="item.path" 
                            class="menu-item" 
                            active-class="active-link"
                            v-tooltip.right="collapsed ? item.name : ''"
                        >
                            <div class="menu-item-content">
                                <i :class="item.icon"></i>
                                <div v-if="!collapsed" class="menucrumb">
                                    <span>{{ item.name }}</span>
                                    <Badge 
                                        v-if="item.path === '/notif' && notificationStore.unreadCount > 0"
                                        :value="notificationStore.unreadCount"
                                        class="p-badge ms-3"
                                    />
                                </div>
                            </div>
                        </router-link>
                    </div>
                    <div v-if="showTicketsMenu" class="ido-menu-group">
                        <button
                            type="button"
                            class="menu-item menu-item-button"
                            :class="{ 'active-link': isTicketsRoute, 'menu-item-open': ticketsMenuOpen && !collapsed }"
                            @click="toggleTicketsMenu"
                            v-tooltip.right="collapsed ? 'Справки' : ''"
                        >
                            <div class="menu-item-content">
                                <i class="pi pi-ticket"></i>
                                <div v-if="!collapsed" class="menucrumb menucrumb-with-arrow">
                                    <span>Справки</span>
                                    <i class="pi pi-angle-down ido-arrow" :class="{ 'ido-arrow-open': ticketsMenuOpen }"></i>
                                </div>
                            </div>
                        </button>
                        <Transition name="ido-submenu">
                            <div v-if="ticketsMenuOpen && !collapsed" class="ido-submenu">
                                <router-link
                                    v-for="item in visibleTicketsMenuItems"
                                    :key="item.path"
                                    :to="item.path"
                                    class="ido-submenu-item"
                                    active-class="ido-submenu-item-active"
                                >
                                    <i :class="item.icon"></i>
                                    <span>{{ item.name }}</span>
                                </router-link>
                            </div>
                        </Transition>
                    </div>
                    <div v-if="showIdoMenu" class="ido-menu-group">
                        <button
                            type="button"
                            class="menu-item menu-item-button"
                            :class="{ 'active-link': isIdoRoute, 'menu-item-open': idoMenuOpen && !collapsed }"
                            @click="toggleIdoMenu"
                            v-tooltip.right="collapsed ? 'ИДО' : ''"
                        >
                            <div class="menu-item-content">
                                <i class="pi pi-building-columns"></i>
                                <div v-if="!collapsed" class="menucrumb menucrumb-with-arrow">
                                    <span>ИДО</span>
                                    <i class="pi pi-angle-down ido-arrow" :class="{ 'ido-arrow-open': idoMenuOpen }"></i>
                                </div>
                            </div>
                        </button>
                        <Transition name="ido-submenu">
                            <div v-if="idoMenuOpen && !collapsed" class="ido-submenu">
                                <router-link
                                    v-for="item in visibleIdoMenuItems"
                                    :key="item.path"
                                    :to="item.path"
                                    class="ido-submenu-item"
                                    active-class="ido-submenu-item-active"
                                >
                                    <i :class="item.icon"></i>
                                    <span>{{ item.name }}</span>
                                </router-link>
                            </div>
                        </Transition>
                    </div>
                    <div v-if="showUmuSiriusMenu" class="ido-menu-group">
                        <button
                            type="button"
                            class="menu-item menu-item-button"
                            :class="{ 'active-link': isUmuSiriusRoute, 'menu-item-open': umuSiriusMenuOpen && !collapsed }"
                            @click="toggleUmuSiriusMenu"
                            v-tooltip.right="collapsed ? 'УМУ' : ''"
                        >
                            <div class="menu-item-content">
                                <i class="pi pi-briefcase"></i>
                                <div v-if="!collapsed" class="menucrumb menucrumb-with-arrow">
                                    <span>УМУ</span>
                                    <i class="pi pi-angle-down ido-arrow" :class="{ 'ido-arrow-open': umuSiriusMenuOpen }"></i>
                                </div>
                            </div>
                        </button>
                        <Transition name="ido-submenu">
                            <div v-if="umuSiriusMenuOpen && !collapsed" class="ido-submenu">
                                <router-link
                                    v-for="item in visibleUmuSiriusMenuItems"
                                    :key="item.path"
                                    :to="item.path"
                                    class="ido-submenu-item"
                                    active-class="ido-submenu-item-active"
                                >
                                    <i :class="item.icon"></i>
                                    <span>{{ item.name }}</span>
                                </router-link>
                            </div>
                        </Transition>
                    </div>
                    <div v-if="showProjectOfficeMenu" class="ido-menu-group">
                        <button
                            type="button"
                            class="menu-item menu-item-button"
                            :class="{ 'active-link': isProjectOfficeRoute, 'menu-item-open': projectOfficeMenuOpen && !collapsed }"
                            @click="toggleProjectOfficeMenu"
                            v-tooltip.right="collapsed ? 'Проектный офис' : ''"
                        >
                            <div class="menu-item-content">
                                <i class="pi pi-paperclip"></i>
                                <div v-if="!collapsed" class="menucrumb menucrumb-with-arrow">
                                    <span>Проектный офис</span>
                                    <i class="pi pi-angle-down ido-arrow" :class="{ 'ido-arrow-open': projectOfficeMenuOpen }"></i>
                                </div>
                            </div>
                        </button>
                        <Transition name="ido-submenu">
                            <div v-if="projectOfficeMenuOpen && !collapsed" class="ido-submenu">
                                <router-link
                                    v-for="item in visibleProjectOfficeMenuItems"
                                    :key="item.path"
                                    :to="item.path"
                                    class="ido-submenu-item"
                                    active-class="ido-submenu-item-active"
                                >
                                    <i :class="item.icon"></i>
                                    <span>{{ item.name }}</span>
                                </router-link>
                            </div>
                        </Transition>
                    </div>
                </div>
    
                <div class="menu">
                    <div v-if="!collapsed && hasPermission('User', 'Read')" class="general mt-2">Администрирование</div>
                    <div v-for="item in filteredMenuItems" :key="item.path">
                        <router-link 
                            :to="item.path" 
                            class="menu-item"
                            active-class="active-link"
                            v-tooltip.right="collapsed ? item.name : ''"
                        >
                            <div class="menu-item-content">
                                <i :class="item.icon"></i>
                                <div v-if="!collapsed" class="menucrumb">
                                    <span>{{ item.name }}</span>
                                </div>
                            </div>
                        </router-link>
                    </div>
                </div>

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
                        <div v-if="!collapsed" class="profile-info">
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
                                <p v-if="!collapsed" class="logout-text">Выйти из аккаунта</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import Popover from 'primevue/popover';

import Lcs from '@/assets/logo/lcs.svg';

import NotificationStack from '@/components/Notifications/NotificationStack.vue';
import { useNotificationStore } from '@/stores/notifications.js';
import { usePermissionStore } from '@/stores/permissions.js';
import { disconnectNotificationsHub } from '@/utils/notificationHub.js';

import AccentColorEditor from './Utils/AccentColorEditor.vue';

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
const ticketsMenuOpen = ref(false);
const idoMenuOpen = ref(false);
const umuSiriusMenuOpen = ref(false);
const projectOfficeMenuOpen = ref(false);
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
const defaultTicketsPath = computed(() => visibleTicketsMenuItems.value[0]?.path || '/tickets');
const isTicketsRoute = computed(() => (
    route.path === '/tickets' || route.path.startsWith('/tickets/my-requests')
));
const isIdoRoute = computed(() => route.path.startsWith('/ido'));
const isUmuSiriusRoute = computed(() => route.path.startsWith('/umu-sirius'));
const isProjectOfficeRoute = computed(() => route.path.startsWith('/project-office'));
const isNotificationsItemActive = computed(() => (
    notificationsPopoverVisible.value || route.path === '/notif'
));

const filteredMenuItems = computed(() => {
    return adminItems.value.filter(item =>
        item.name.toLowerCase().startsWith(searchQuery.value.toLowerCase())
    );
});

// Функции
const getInitials = (firstName, lastName) => {
    const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
    return initials;
};

const toggleIdoMenu = () => {
    if (props.collapsed) {
        router.push('/ido/consultations');
        return;
    }

    idoMenuOpen.value = !idoMenuOpen.value;
};

const toggleTicketsMenu = () => {
    if (props.collapsed) {
        router.push(defaultTicketsPath.value);
        return;
    }

    ticketsMenuOpen.value = !ticketsMenuOpen.value;
};

const toggleUmuSiriusMenu = () => {
    if (props.collapsed) {
        router.push('/umu-sirius');
        return;
    }

    umuSiriusMenuOpen.value = !umuSiriusMenuOpen.value;
};

const toggleProjectOfficeMenu = () => {
    if (props.collapsed) {
        router.push('/project-office/projects');
        return;
    }

    projectOfficeMenuOpen.value = !projectOfficeMenuOpen.value;
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
    (path) => {
        notificationsPopoverRef.value?.hide();

        if (path === '/tickets' || path.startsWith('/tickets/my-requests')) {
            ticketsMenuOpen.value = true;
        }
        if (path.startsWith('/ido')) {
            idoMenuOpen.value = true;
        }
        if (path.startsWith('/umu-sirius')) {
            umuSiriusMenuOpen.value = true;
        }
        if (path.startsWith('/project-office')) {
            projectOfficeMenuOpen.value = true;
        }
    },
    { immediate: true }
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
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
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

/* ============ ФОНОВОЕ ИЗОБРАЖЕНИЕ ============ */
.sidebar-container::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0.7;
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
    filter: blur(2px);
    z-index: -1;
    transition: 
        background-image 1.2s cubic-bezier(0.4, 0, 0.2, 1),
        opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: background-image, opacity;
}

.sidebar-container.season-winter::before {
    background-image: url('/src/assets/backgrounds/winter.webp');
    opacity: 0.4;
}

.sidebar-container.season-spring::before {
    background-image: url('/src/assets/backgrounds/spring.webp');
    opacity: 0.2;
}

.sidebar-container.season-summer::before {
    background-image: url('/src/assets/backgrounds/summer.webp');
    opacity: 0.2;
}

.sidebar-container.season-autumn::before {
    background-image: url('/src/assets/backgrounds/autism.webp');
    opacity: 0.2;
}

.sidebar-container.bg-image::before {
    background-image: url('/src/assets/backgrounds/winter.webp');
    opacity: 0.8;
}

/* ============ ОСНОВНОЙ КОНТЕЙНЕР ============ */
.rectangle {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 1.5rem 1rem;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
    will-change: transform, padding;
    background: linear-gradient(
        180deg,
        rgba(var(--p-bg-color-rgb), 0.95) 0%,
        rgba(var(--p-bg-color-2-rgb), 0.85) 100%
    );
    position: relative;
}

.rectangle.season-overlay {
    background: linear-gradient(
        180deg,
        var(--season-gradient-start) 0%,
        var(--season-gradient-end) 100%
    );
    z-index: 1;
}

.rectangle.collapsed {
    padding: 1.5rem 0.5rem;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.1s;
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
    padding-top: 0.5rem;
    z-index: 2;
    width: 100%;
    box-sizing: border-box;
}
.rectangle.collapsed .sidebar-bottom {
    padding: 0.125rem 0;
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

.rectangle.collapsed .menu {
    gap: 0.5rem;
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

.menu-item-content {
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
    position: relative;
    padding: 0 1rem;
    transition: padding 0.3s cubic-bezier(0.16, 1, 0.3, 1);
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

.menu-item.active-link::before {
    content: '';
    position: absolute;
    left: 0.35rem;
    top: 50%;
    width: 0.22rem;
    height: 62%;
    border-radius: 999px;
    transform: translateY(-50%);
    background: var(--p-primary-500);
    box-shadow: 0 0 16px color-mix(in srgb, var(--p-primary-500) 60%, transparent);
    animation: menu-active-bar 0.42s cubic-bezier(0.22, 1, 0.36, 1);
}

/* ============ ИКОНКИ МЕНЮ ============ */
.menu-item .pi {
    font-size: 1.25rem;
    position: relative;
    transition:
        transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
        margin 0.3s cubic-bezier(0.16, 1, 0.3, 1),
        font-size 0.3s cubic-bezier(0.16, 1, 0.3, 1),
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

.rectangle.collapsed .menu-item .pi {
    margin: 0;
    font-size: 1.5rem;
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
        opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1),
        max-width 0.4s cubic-bezier(0.16, 1, 0.3, 1),
        transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
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
    position: absolute;
}

.rectangle:not(.collapsed) .menucrumb {
    opacity: 1;
    max-width: 200px;
    transform: translateX(0);
    transition-delay: 0.15s;
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
    transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.rectangle.collapsed .profile-info {
    opacity: 0;
    max-width: 0;
}

.rectangle:not(.collapsed) .profile-info {
    opacity: 1;
    max-width: 200px;
    transition-delay: 0.15s;
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
    transition-delay: 0.15s;
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
    top: 10px;
    right: 20px;
    z-index: 10;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform-origin: center;
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
@media (max-width: 768px) {
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
