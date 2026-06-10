import { computed, onMounted, ref } from 'vue';
import { usePermissionStore } from '@/stores/permissions.js';
import { getRequestAccess } from '@/utils/requestAccess.js';
import { idoSuResource } from '@/api/ido.js';
import {
    umuSiriusEmployeeResource,
    umuSiriusResponsibleResource,
    umuSiriusSuResource,
} from '@/api/umuSirius.js';
import { projectShowcaseInitiatorResource, projectShowcaseSuResource } from '@/api/projectShowcase.js';
import { ENABLE_PROJECT_OFFICE } from '@/config/features.js';

const TOP_NAV_ITEMS = [
    { id: 'overview', name: 'Главная', path: '/overview', icon: 'pi pi-home' },
    { id: 'notifications', name: 'Уведомления', path: '/notif', icon: 'pi pi-bell' },
];

const SERVICE_NAV_ITEMS = [
    { id: 'requests', name: 'Заявки', path: '/requests', icon: 'pi pi-pen-to-square' },
    { id: 'schedule', name: 'Расписание', path: '/schedule', icon: 'pi pi-calendar' },
    { id: 'faq', name: 'Вопросы и ответы', path: '/faq', icon: 'pi pi-question-circle' },
];

const ADMIN_NAV_ITEMS = [
    { id: 'users', name: 'Пользователи', path: '/users', icon: 'pi pi-users' },
    { id: 'rbac', name: 'Роли', path: '/rbac', icon: 'pi pi-sitemap' },
    { id: 'services', name: 'Микросервисы', path: '/services', icon: 'pi pi-desktop' },
    { id: 'sso', name: 'Настройка SSO', path: '/sso/config', icon: 'pi pi-cog' },
    { id: 'autorole', name: 'Авто-Роли', path: '/autorole', icon: 'pi pi-objects-column' },
    {
        id: 'ticket-responsibles',
        name: 'Ответственные (справки)',
        path: '/tickets/responsibles',
        icon: 'pi pi-user-plus',
    },
];

const QUICK_ACTION_ITEMS = [
    { id: 'overview', name: 'Главная', path: '/overview', icon: 'pi pi-home' },
    { id: 'requests', name: 'Заявки', path: '/requests', icon: 'pi pi-pen-to-square' },
    { id: 'notifications', name: 'Уведомления', path: '/notif', icon: 'pi pi-bell' },
    { id: 'profile', name: 'Профиль', path: '/profile', icon: 'pi pi-user' },
];

export const useAppNavigation = () => {
    const permissionStore = usePermissionStore();
    const showRequests = ref(false);

    const hasPermission = (type, action) => permissionStore.hasPermission(type, action);
    const canAccessStudentTickets = () => (
        hasPermission('TicketsStudent', 'Read') || hasPermission('TicketsStudent', 'Create')
    );

    const isItemVisible = (path) => {
        const permissionMap = {
            '/rbac': hasPermission('Rbac', 'Read'),
            '/users': hasPermission('User', 'Read'),
            '/sso/config': hasPermission('SsoResource', 'Read'),
            '/autorole': hasPermission('RoleAutoAssigner', 'Read'),
            '/faq': hasPermission('FAQ', 'Read'),
            '/tickets': hasPermission('Tickets', 'Read'),
            '/tickets/my-requests': canAccessStudentTickets(),
            '/tickets/responsibles': hasPermission('ResponsibleTicketStudentGroup', 'Read'),
            '/services': hasPermission('InfraManager', 'Read'),
        };

        if (path === '/requests') {
            return showRequests.value;
        }

        return permissionMap[path] !== undefined ? permissionMap[path] : true;
    };

    const topItems = computed(() => TOP_NAV_ITEMS.filter((item) => isItemVisible(item.path)));
    const serviceItems = computed(() => SERVICE_NAV_ITEMS.filter((item) => isItemVisible(item.path)));
    const adminItems = computed(() => ADMIN_NAV_ITEMS.filter((item) => isItemVisible(item.path)));
    const ticketsItems = computed(() => [
        {
            name: 'Список справок',
            path: '/tickets',
            icon: 'pi pi-list',
            hidden: !hasPermission('Tickets', 'Read'),
        },
        {
            name: 'Заявки на справки',
            path: '/tickets/my-requests',
            icon: 'pi pi-file-edit',
            hidden: !canAccessStudentTickets(),
        },
    ].filter((item) => !item.hidden));

    const canReadIdoSettings = computed(() => hasPermission(idoSuResource, 'Read'));
    const idoItems = computed(() => [
        { name: 'Подать заявку', path: '/ido/consultations', icon: 'pi pi-file-edit' },
        { name: 'Список консультаций', path: '/ido/orders', icon: 'pi pi-list-check' },
        {
            name: 'Настройки ИДО',
            path: '/ido/settings',
            icon: 'pi pi-sliders-h',
            hidden: !canReadIdoSettings.value,
        },
    ].filter((item) => !item.hidden));

    const canReadUmuSirius = computed(() => (
        hasPermission(umuSiriusResponsibleResource, 'Read')
        || hasPermission(umuSiriusEmployeeResource, 'Read')
        || hasPermission(umuSiriusSuResource, 'Read')
    ));
    const umuSiriusItems = computed(() => [
        {
            name: 'ГПХ',
            path: '/umu-sirius',
            icon: 'pi pi-file-check',
            hidden: !canReadUmuSirius.value,
        },
    ].filter((item) => !item.hidden));

    const canReadProjectShowcaseAll = computed(() => hasPermission(projectShowcaseSuResource, 'Read'));
    const canCreateProjectShowcase = computed(() => hasPermission(projectShowcaseInitiatorResource, 'Create'));
    const projectOfficeItems = computed(() => {
        if (!ENABLE_PROJECT_OFFICE) return [];

        const items = [
            { name: 'Банк проектов', path: '/project-office/projects', icon: 'pi pi-folder-open' }
        ].filter((item) => !item.hidden);

        return [...new Map(items.map((item) => [item.path, item])).values()];
    });

    const quickActions = computed(() => QUICK_ACTION_ITEMS.filter((item) => isItemVisible(item.path)));

    onMounted(async () => {
        try {
            const requestAccess = await getRequestAccess();
            showRequests.value = requestAccess.showRequests;
        } catch (error) {
            console.debug('Не удалось определить доступность раздела заявок:', error);
        }
    });

    return {
        showRequests,
        hasPermission,
        topItems,
        serviceItems,
        adminItems,
        ticketsItems,
        idoItems,
        umuSiriusItems,
        projectOfficeItems,
        quickActions,
        showTicketsMenu: computed(() => ticketsItems.value.length > 0),
        showIdoMenu: computed(() => true),
        showUmuSiriusMenu: computed(() => umuSiriusItems.value.length > 0),
        showProjectOfficeMenu: computed(() => ENABLE_PROJECT_OFFICE && projectOfficeItems.value.length > 0),
    };
};
