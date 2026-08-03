import {
    projectShowcaseInitiatorResource,
    projectShowcaseSuResource,
} from '@/api/projectShowcase.js';
import { isLecturer } from '@/utils/roles.js';

export const PROJECT_SHOWCASE_USER_ID_STORAGE_KEY = 'projectShowcaseUserId';

export const PROJECT_SHOWCASE_LIST_LABELS = {
    'public': 'Публичные',
    'all': 'Все',
    'me': 'Мои',
    'for-project-office-solution': 'Ожидают',
};

export function getStoredProjectShowcaseUserId() {
    const rawValue = localStorage.getItem(PROJECT_SHOWCASE_USER_ID_STORAGE_KEY);
    if (!rawValue) return null;

    const value = Number(rawValue);
    return Number.isFinite(value) ? value : null;
}

export function storeProjectShowcaseUserId(value) {
    if (!Number.isFinite(Number(value))) {
        localStorage.removeItem(PROJECT_SHOWCASE_USER_ID_STORAGE_KEY);
        return null;
    }

    const normalizedValue = Number(value);
    localStorage.setItem(PROJECT_SHOWCASE_USER_ID_STORAGE_KEY, String(normalizedValue));
    return normalizedValue;
}

export function clearProjectShowcaseUserId() {
    localStorage.removeItem(PROJECT_SHOWCASE_USER_ID_STORAGE_KEY);
}

export function buildProjectShowcaseListModes(permissionStore, hasShowcaseAccount = false) {
    const modes = [{ value: 'public', label: PROJECT_SHOWCASE_LIST_LABELS.public }];

    if (hasShowcaseAccount) {
        modes.push({ value: 'me', label: PROJECT_SHOWCASE_LIST_LABELS.me });
    }

    if (permissionStore?.hasPermission(projectShowcaseSuResource, 'Read')) {
        modes.splice(1, 0, { value: 'all', label: PROJECT_SHOWCASE_LIST_LABELS.all });
        modes.push({
            value: 'for-project-office-solution',
            label: PROJECT_SHOWCASE_LIST_LABELS['for-project-office-solution'],
        });
    }

    return modes;
}

export function resolveDefaultProjectShowcaseMode(permissionStore, hasShowcaseAccount = false) {
    if (permissionStore?.hasPermission(projectShowcaseSuResource, 'Read')) {
        return 'all';
    }

    if (hasShowcaseAccount) return 'me';
    return 'public';
}

export function isTeacherRole(currentUser) {
    return isLecturer(currentUser);
}

export function canCreateProject(permissionStore) {
    return permissionStore?.hasPermission(projectShowcaseInitiatorResource, 'Create');
}

export function canEditOwnProject(permissionStore) {
    return permissionStore?.hasPermission(projectShowcaseInitiatorResource, 'Update');
}

export function canReadAllProjects(permissionStore) {
    return permissionStore?.hasPermission(projectShowcaseSuResource, 'Read');
}

export function canCreateProjectSolution(permissionStore) {
    return permissionStore?.hasPermission(projectShowcaseSuResource, 'Create');
}

export function getProjectDetailsMode(permissionStore) {
    return canReadAllProjects(permissionStore) ? 'su' : 'user';
}

export function resolveProjectShowcaseUserIdFromResponse(response) {
    return Number(
        response?.data?.userResponse?.id
        || response?.userResponse?.id
        || response?.data?.userResponse?.user?.id
        || 0
    ) || null;
}

export function buildProjectShowcaseFullName(user) {
    if (!user) return 'Не указан';

    const person = user.personalData || user;
    return [
        person?.lastName,
        person?.firstName,
        person?.middleName,
    ].filter(Boolean).join(' ') || 'Не указан';
}

export function resolveProjectInitiatorUserId(project) {
    const candidates = [
        project?.initiator?.user?.id,
        project?.initiator?.id,
        project?.projectInitiator?.user?.id,
        project?.projectInitiator?.id,
    ];

    const value = candidates.find((candidate) => Number.isFinite(Number(candidate)));
    return value === undefined ? null : Number(value);
}

export function isProjectInitiator(project, showcaseUserId) {
    if (!showcaseUserId) return false;

    const candidates = [
        project?.initiator?.user?.id,
        project?.initiator?.id,
    ].map((value) => Number(value)).filter(Number.isFinite);

    return candidates.includes(Number(showcaseUserId));
}

export function canPublishProject(project, checklist) {
    if (!project || project.isPublic || !checklist) return false;

    return Object.values(checklist).every(Boolean);
}

export function normalizeProjectsList(payload, pagination = {}) {
    const projects = Array.isArray(payload?.projects) ? payload.projects : [];
    const currentPage = Number(pagination?.page) || 1;
    const pageSize = Number(pagination?.pageSize) || projects.length || 10;
    const totalPages = Number(payload?.projectCount || 0);

    let totalRecords = 0;

    if (totalPages > 0) {
        totalRecords = totalPages * pageSize;

        if (currentPage >= totalPages && projects.length <= pageSize) {
            totalRecords = ((totalPages - 1) * pageSize) + projects.length;
        }
    }

    return {
        projects,
        totalPages,
        totalRecords,
    };
}

export function normalizeProject(payload) {
    return payload?.project || null;
}

export function normalizeProjectJournal(payload) {
    const logs = Array.isArray(payload?.projectLogs)
        ? payload.projectLogs
        : Array.isArray(payload?.logs)
            ? payload.logs
            : Array.isArray(payload)
                ? payload
                : [];

    const totalRecords = Number(
        payload?.projectLogsCount
        || payload?.projectCount
        || payload?.count
        || payload?.totalCount
        || logs.length
    );

    return {
        logs,
        totalRecords,
    };
}

export function describeProjectVisibility(project) {
    return project?.isPublic ? 'Опубликован' : 'Черновик';
}

export function formatProjectBoolean(value) {
    return value ? 'Да' : 'Нет';
}

export function toIsoDate(value) {
    if (!value) return null;

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function buildProjectShowcaseErrorMessage(error, fallbackText) {
    return error?.response?.data?.message
        || error?.response?.data?.title
        || fallbackText;
}

const projectShowcaseTypeLabels = {
    IndustrialPartner: 'Индустриальный партнер',
    Department: 'Кафедра',
    Student: 'Обучающийся',
    Other: 'Другое',
    Materials: 'Материалы',
    Material: 'Материалы',
    Equipment: 'Оборудование',
    Software: 'Программное обеспечение',
    Program: 'Программное обеспечение',
    InformationBase: 'Информационная база',
    Financing: 'Финансирование',
    Funding: 'Финансирование',
    ResearchProject: 'Исследовательский проект',
    Research: 'Исследовательский проект',
    ScientificProject: 'Исследовательский проект',
    Applied: 'Прикладной проект',
    AppliedProject: 'Прикладной проект',
    Innovative: 'Инновационный проект',
    InnovativeProject: 'Инновационный проект',
    IndustrialProject: 'Индустриальный проект',
    Industrial: 'Индустриальный проект',
    EducationalProject: 'Образовательный проект',
    Educational: 'Образовательный проект',
};

export function translateProjectShowcaseTypeTitle(title) {
    if (!title) return 'Не указан';
    return projectShowcaseTypeLabels[title] || title;
}
