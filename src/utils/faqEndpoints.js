import { FAQ_ADMIN_SEGMENT } from '@/config/mocks/config.js';

const FAQ_SU_PERMISSION = 'FAQ_SU';

export const hasFaqSuPermission = (permissionStore) => {
    if (!permissionStore || !Array.isArray(permissionStore.permissions)) return false;

    return permissionStore.permissions.some((resource) => (
        resource?.type === FAQ_SU_PERMISSION
        && Array.isArray(resource.permissions)
        && resource.permissions.length > 0
    ));
};

export const buildFaqEndpoint = (path, permissionStore) => {
    const normalizedPath = String(path || '').replace(/^\/+/, '');

    if (!hasFaqSuPermission(permissionStore)) {
        return `/api/faq/${normalizedPath}`;
    }

    return `/api/faq/${FAQ_ADMIN_SEGMENT}/${normalizedPath}`;
};
