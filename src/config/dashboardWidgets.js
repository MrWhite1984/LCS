import { defineAsyncComponent } from 'vue';

/**
 * Реестр виджетов главной страницы ЛКС.
 * Новый виджет = SFC в src/components/DashboardWidgets/ + строка здесь.
 *
 *  id            — стабильный строковый идентификатор (сохраняется в БД).
 *  name          — заголовок карточки в палитре.
 *  icon          — класс иконки PrimeUI (pi pi-*).
 *  component      — async-компонент виджета.
 *  defaultColumn  — колонка (0..2) в дефолтной раскладке.
 *  permissionFilter?(permStore) — возвращает true, если виджет доступен пользователю.
 *                  Если false — виджет не появляется в палитре и pruning
 *                  убирает его из сохранённой раскладки при загрузке.
 */
export const WIDGET_REGISTRY = [
    {
        id: 'schedule',
        name: 'Расписание',
        icon: 'pi pi-calendar',
        component: defineAsyncComponent(() => import('@/components/DashboardWidgets/ScheduleWidget.vue')),
        defaultColumn: 0,
    },
    {
        id: 'recentTickets',
        name: 'Последние заявки',
        icon: 'pi pi-ticket',
        component: defineAsyncComponent(() => import('@/components/DashboardWidgets/RecentTicketsWidget.vue')),
        defaultColumn: 1,
    },
    {
        id: 'certificates',
        name: 'Справки',
        icon: 'pi pi-file',
        component: defineAsyncComponent(() => import('@/components/DashboardWidgets/CertificatesWidget.vue')),
        defaultColumn: 1,
        permissionFilter: (permStore) => (
            permStore.hasPermission('Tickets', 'Read')
            || permStore.hasPermission('TicketsStudent', 'Read')
            || permStore.hasPermission('TicketsStudent', 'Create')
        ),
    },
    {
        id: 'news',
        name: 'Новости',
        icon: 'pi pi-megaphone',
        component: defineAsyncComponent(() => import('@/components/DashboardWidgets/NewsWidget.vue')),
        defaultColumn: 2,
    },
    {
        id: 'surveys',
        name: 'Опросы',
        icon: 'pi pi-clipboard',
        component: defineAsyncComponent(() => import('@/components/DashboardWidgets/SurveysWidget.vue')),
        defaultColumn: 0,
    },
    {
        id: 'gradebook',
        name: 'Зачётка',
        icon: 'pi pi-id-card',
        component: defineAsyncComponent(() => import('@/components/DashboardWidgets/GradebookWidget.vue')),
        // По умолчанию не размещён — доступен только через палитру в режиме редактирования.
        defaultColumn: 2,
    },
];

export const WIDGETS_BY_ID = WIDGET_REGISTRY.reduce((acc, widget) => {
    acc[widget.id] = widget;
    return acc;
}, {});

export const KNOWN_WIDGET_IDS = new Set(WIDGET_REGISTRY.map((widget) => widget.id));

/**
 * Базовая раскладка (один источник истины). Применяется, если у пользователя
 * ещё нет сохранённой строки. Соответствует текущему виду главной страницы.
 */
export const DEFAULT_LAYOUT = {
    version: 1,
    columns: [
        ['schedule'],
        ['recentTickets', 'certificates'],
        ['news'],
    ],
};

/**
 * Виджеты, доступные пользователю (по permissionFilter), как массив описаний.
 */
export function availableWidgets(permStore) {
    return WIDGET_REGISTRY.filter((widget) => (
        !widget.hidden
        && (!widget.permissionFilter || widget.permissionFilter(permStore))
    ));
}

/**
 * Доступен ли виджет пользователю.
 */
export function isWidgetAvailable(widgetId, permStore) {
    const widget = WIDGETS_BY_ID[widgetId];
    if (!widget || widget.hidden) return false;
    return !widget.permissionFilter || widget.permissionFilter(permStore);
}