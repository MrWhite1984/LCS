export const SURVEY_ADMIN_RESOURCES = [
    'SurveysAdmin',
    'SurveysAudience',
    'SurveysTemplates',
    'SurveysResults',
    'SurveysAccessGrant',
];

const SURVEY_ADMIN_ACTIONS = ['Create', 'Read', 'Update', 'Delete'];

export const canManageSurveys = (permissionStore) => {
    if (!permissionStore) return false;

    return SURVEY_ADMIN_RESOURCES.some((resource) => (
        SURVEY_ADMIN_ACTIONS.some((action) => permissionStore.hasPermission(resource, action))
    ));
};
