const normalizeRoleName = (role) => String(
    role?.roleName ?? role?.name ?? ''
).trim().toLowerCase();

export const getUserRoleNames = (user) => Array.from(new Set(
    (Array.isArray(user?.roles) ? user.roles : [])
        .map(normalizeRoleName)
        .filter(Boolean)
));

export const hasUserRole = (user, roleName) => (
    getUserRoleNames(user).includes(String(roleName || '').trim().toLowerCase())
);

export const isSuperAdmin = (user) => hasUserRole(user, 'superadmin');

export const isLecturer = (user) => hasUserRole(user, 'lecturer');
