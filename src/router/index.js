import { createMemoryHistory, createRouter, createWebHistory } from "vue-router";
import { isAuthenticated } from "@/utils/auth";
import { usePermissionStore } from '@/stores/permissions.js';
import { ensureAuthSession, isSessionExpiredFlag, isLocalAuthBypassActive } from "@/utils/TokenService";
import { ENABLE_PROJECT_OFFICE } from '@/config/features.js';
import { canAccessNewsManagement, hasNewsPermission } from '@/api/news.js';

const routes = [
    { 
        path: "/auth", 
        component: () => import('@/views/AuthPage.vue'),
        name: 'Auth',
        meta: { 
            requiresAuth: false,
            title: 'Вход'
        }
    },
    {
        path: '/noAccess',
        component: () => import('@/components/Utils/PermissionDenied.vue'),
        name: 'NoAccess',
        meta: {
            title: '403',
        }
    },
    {
        path: '/notFound',
        component: () => import('@/components/Utils/NotFound.vue'),
        name: 'NotFound',
        meta: {
            title: '404',
        }
    },
    {
        path: "/login/sso",
        component: () => import('@/views/SsoCallbackPage.vue'),
        meta: {
            title: 'Ожидание авторизации'
        }
    },
    {
        path: "/login-guide",
        component: () => import('@/views/LoginGuidePage.vue'),
        name: 'LoginGuide',
        meta: {
            requiresAuth: false,
            title: 'Как войти в систему?'
        }
    },
    {
        path: "/consultation-request",
        component: () => import('@/views/IdoConsultationCreatePage.vue'),
        name: 'PublicIdoConsultationCreate',
        meta: {
            requiresAuth: false,
            title: 'Подать заявку'
        }
    },
    { 
        path: "/",
        component: () => import('@/views/HomePage.vue'),
        name: 'HomePage',
        redirect: { path: '/overview' },
        meta: { 
            requiresAuth: true,
            title: 'Главная'
        },
        children: [
            // Dashboard
            {
                path: "/overview",
                component: () => import('@/views/DashboardPage.vue'),
                name: 'Dashboard'
            },
            // Users section
            {
                path: "/users",
                component: () => import('@/views/UsersPage.vue'),
                name: 'Users',
                meta: { 
                    permission: { 
                        type: 'User', 
                        action: 'Read' 
                    }, 
                    requiresAuth: true, 
                    title: 'Пользователи' 
                }
            },
            {
                path: "/profile",
                props: (route) => ({ id: route.query.id }),
                component: () => import('@/views/ProfilePage.vue'),
                name: 'Profile',
                meta: { 
                    requiresAuth: true,
                    title: 'Личный кабинет'
                }
            },
            // RBAC section
            {
                path: "/rbac",
                component: () => import('@/views/RbacPage.vue'),
                name: 'Rbac',
                meta: { 
                    permission: { 
                        type: 'Rbac', 
                        action: 'Read' 
                    }, 
                    requiresAuth: true,
                    title: 'Роли'
                }
            },
            {
                path: "/me-permissions",
                component: () => import('@/views/MePermissionsPage.vue'),
                name: 'MePermissions',
                meta: {
                    title: 'Мои полномочия'
                }
            },
            {
                path: "/role-permissions",
                component: () => import('@/views/RolePermissionsPage.vue'),
                name: 'RolePermissions',
                meta: { 
                    permission: { 
                        type: 'Rbac', 
                        action: 'Create' 
                    }, 
                    requiresAuth: true,
                    title: 'Полномочия роли'
                }
            },
            // Services section
            {
                path: "/services",
                component: () => import('@/views/ServicesPage.vue'),
                name: 'Services',
                meta: { 
                    permission: { 
                        type: 'InfraManager', 
                        action: 'Read' 
                    }, 
                    requiresAuth: true,
                    title: 'Микросервисы'
                },
            },
            {
                path: "/services/infraManager",
                component: () => import('@/components/Microservice/InfraManager/InfraManagerTable.vue'),
                name: 'InfraTable',
                meta: {
                    title: 'Все Заявки'
                }
            },
            {
                path: "/services/rating",
                component: () => import('@/components/Microservice/Rating/RatingSeasons.vue'),
                name: 'Seasons',
                meta: {
                    title: 'Сезон'
                }
            },
            {
                path: "/services/rating/season/:idSeason",
                component: () => import('@/components/Microservice/Rating/CertainSeason.vue'),
                name: 'Indicators',
                meta: {
                    title: 'Показатели'
                },
            },
            {
                path: "/services/ml-analytics",
                component: () => import('@/views/MlAnalyticsPage.vue'),
                name: 'MlAnalytics',
                meta: {
                    title: 'ML Analytics'
                }
            },
            {
                path: "/ido/consultations",
                component: () => import('@/views/IdoConsultationCreatePage.vue'),
                name: 'IdoConsultations',
                meta: {
                    requiresAuth: true,
                    title: 'Подать заявку'
                }
            },
            {
                path: "/ido/orders",
                component: () => import('@/views/IdoOrdersPage.vue'),
                name: 'IdoOrders',
                meta: {
                    requiresAuth: true,
                    title: 'Список консультаций'
                }
            },
            {
                path: "/ido/settings",
                component: () => import('@/views/IdoSettingsPage.vue'),
                name: 'IdoSettings',
                meta: {
                    permission: {
                        type: 'Additional_consultation_calculator_SU',
                        action: 'Read'
                    },
                    requiresAuth: true,
                    title: 'Настройки ИДО'
                }
            },
            {
                path: "/umu-sirius",
                component: () => import('@/views/UmuSiriusPage.vue'),
                name: 'UmuSirius',
                meta: {
                    requiresAuth: true,
                    title: 'УМУ ГПХ'
                }
            },
            ...(ENABLE_PROJECT_OFFICE ? [
                {
                    path: "/project-office/projects",
                    component: () => import('@/views/ProjectShowcasePage.vue'),
                    name: 'ProjectShowcaseList',
                    meta: {
                        requiresAuth: true,
                        title: 'Витрина проектов'
                    }
                },
                {
                    path: "/project-office/projects/:id",
                    component: () => import('@/views/ProjectShowcaseDetailsPage.vue'),
                    name: 'ProjectShowcaseDetails',
                    meta: {
                        requiresAuth: true,
                        title: 'Карточка проекта'
                    }
                },
            ] : []),
            // Requests section
            {
                path: "/requests",
                component: () => import('@/views/RequestsPage.vue'),
                name: 'Requests',
                meta: {
                    title: 'Заявки'
                }
            },
            // Schedule section
            {
                path: "/schedule",
                component: () => import('@/views/SchedulePage.vue'),
                name: 'Schedule',
                meta: {
                    title: 'Расписание'
                }
            },
            {
                path: "/faq",
                component: () => import('@/views/FaqPage.vue'),
                name: 'Faq',
                meta: {
                    title: 'Вопросы и ответы'
                }
            },
            {
                path: "/faq/articles/create",
                component: () => import('@/views/FaqArticleCreatePage.vue'),
                name: 'FaqArticleCreate',
                meta: {
                    title: 'Новая статья'
                }
            },
            {
                path: "/faq/articles/:id",
                component: () => import('@/views/FaqArticlePage.vue'),
                name: 'FaqArticle',
                meta: {
                    title: 'Статья'
                }
            },
            {
                path: "/news/manage",
                component: () => import('@/views/news/NewsManagePage.vue'),
                name: 'NewsManage',
                meta: {
                    requiresAuth: true,
                    requiresNewsManagement: true,
                    title: 'Управление новостями'
                }
            },
            {
                path: "/news/manage/create",
                component: () => import('@/views/news/NewsEditorPage.vue'),
                name: 'NewsCreate',
                meta: {
                    requiresAuth: true,
                    requiresNewsManagement: true,
                    requiresNewsAction: 'Create',
                    title: 'Новый пост'
                }
            },
            {
                path: "/news/manage/:postId/edit",
                component: () => import('@/views/news/NewsEditorPage.vue'),
                name: 'NewsEdit',
                meta: {
                    requiresAuth: true,
                    requiresNewsManagement: true,
                    requiresNewsAction: 'Update',
                    title: 'Редактирование поста'
                }
            },
            {
                path: "/schedule/group/:idGroup",
                component: () => import('@/components/Schedule/ScheduleGroup.vue'),
                name: 'ScheduleGroup',
            },
            {
                path: "/schedule/room/:idAudLine",
                component: () => import('@/components/Schedule/ScheduleAud.vue'),
                name: 'ScheduleAud',
            },
            {
                path: "/schedule/teacher/:idTeacher",
                component: () => import('@/components/Schedule/ScheduleTeach.vue'),
                name: 'ScheduleTeach',
            },
            // Notifications
            {
                path: "/notif",
                component: () => import('@/views/NotifPage.vue'),
                meta: { 
                    requiresAuth: true,
                    title: 'Уведомления'
                }
            },
            // ResponsibleTicketStudentGroup
            {
                path: "/tickets/responsibles",
                component: () => import('@/views/ResponsibleTicketsStudentGroup.vue'),
                meta: {
                    permission: {
                        type: 'ResponsibleTicketStudentGroup',
                        action: 'Read'
                    },
                    requiresAuth: true,
                    title: 'Ответственные(справки)'
                }
            },
            // Tickets
            {
                path: "/tickets",
                component: () => import('@/views/TicketsPage.vue'),
                meta: {
                    permission: {
                        type: 'Tickets',
                        action: 'Read'
                    },
                    requiresAuth: true,
                    title: 'Список справок'
                }
            },
            {
                path: "/tickets/my-requests",
                component: () => import('@/views/TicketsStudentPage.vue'),
                meta: {
                    requiresAuth: true,
                    title: 'Заявки на справки'
                }
            },
            // SSO
            {
                path: "/sso/config",
                component: () => import('@/views/SsoConfig.vue'),
                meta: {
                    requiresAuth: true,
                    title: 'Настройка SSO'
                }
            },
            // AutoRoleAssigner
            {
                path: "/autorole",
                component: () => import('@/views/AutoRolesManagerPage.vue'),
                meta: {
                    requiresAuth: true,
                    title: 'Авто Роли'
                }
            }
        ]
    }, 
    {
        path: '/:pathMatch(.*)*',
        redirect: '/notFound'
    }
];

const router = createRouter({
    history: typeof window !== "undefined" ? createWebHistory() : createMemoryHistory(),
    routes
});

router.beforeEach(async (to, from) => {
    let title = typeof to.meta.title === 'string' ? to.meta.title : 'none';

    if (to.name === 'ScheduleGroup') {
        title = 'Загрузка...';
    }

    document.title = `${title} - LCS`;

    const permissionStore = usePermissionStore();
    const requiresAuthRoute = to.matched.some(record => record.meta.requiresAuth);

    if (isLocalAuthBypassActive()) {
        return true;
    }

    if ((requiresAuthRoute || to.path === "/auth") && !isAuthenticated() && !isSessionExpiredFlag()) {
        await ensureAuthSession();
    }

     // Если пользователь авторизован, загружаем полномочия
    if (isAuthenticated() && !permissionStore.isLoaded && !isSessionExpiredFlag()) {
        try {
            await permissionStore.fetchPermissions();  // Дожидаемся загрузки полномочий
        } catch (error) {
            console.debug('Ошибка при загрузке полномочий:', error);

            // Если ошибка сервера, перенаправляем на страницу "Нет доступы"
            if (error.response?.status === 502) {
                return { path: '/noAccess' };
            }

            return { path: '/auth' };
        }
    }

    if (to.path === '/auth' && isAuthenticated() && !isSessionExpiredFlag()) {
        return { path: '/overview' };  // Перенаправляем на главную страницу
    }
    
    // Проверка авторизации
    if (requiresAuthRoute) {
        if (!isAuthenticated() || isSessionExpiredFlag()) {
            return {
                path: '/auth',
                replace: true
            };
        }
    }

    // Проверка полномочий, если маршрут требует их
    if (to.meta.permission) {
        const { type, action } = to.meta.permission;
        if (permissionStore.hasPermission(type, action)) {
            return true;  // Продолжаем маршрут
        } else {
            return { path: '/noAccess' };  // Если полномочий нет, перенаправляем на страницу "Нет доступа"
        }
    }

    if (typeof to.meta.requiresNewsAction === 'string') {
        if (!hasNewsPermission(permissionStore, to.meta.requiresNewsAction)) {
            return { path: '/noAccess' };
        }
    } else if (to.matched.some((record) => record.meta.requiresNewsManagement)) {
        if (!canAccessNewsManagement(permissionStore)) {
            return { path: '/noAccess' };
        }
    }

    return true; // Разрешаем навигацию
});

router.afterEach((to) => {
    if (to.meta.requiresAuth) {
        if (!isAuthenticated()) {
            if (window) {
                window.history.replaceState(null, '', window.location.href);
                window.onpopstate = () => {
                    window.history.forward();
                }
            }
        }
    }
})


export default router;
