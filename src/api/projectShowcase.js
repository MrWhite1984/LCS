import axiosInstance from '@/utils/axios.js';
import { USE_PROJECT_SHOWCASE_MOCK_DATA } from '@/mocks/config.js';
import {
    mockAddCriterias,
    mockAddProjectDocument,
    mockAddGeneralInformation,
    mockAddLksUserToSystem,
    mockAddMeToSystem,
    mockAddParticipant,
    mockAddProjectManager,
    mockAddResource,
    mockAddRoadMapItem,
    mockAddTasks,
    mockAddUser,
    mockChangeVisibility,
    mockCreateSolution,
    mockDeleteProjectDocument,
    mockGetCheckList,
    mockGetDepartmentsByPartOfName,
    mockGetInitiatorTypes,
    mockGetJournal,
    mockGetMeInSystem,
    mockGetProjectDocument,
    mockGetProjectDocuments,
    mockGetParticipants,
    mockGetProject,
    mockGetProjectsList,
    mockGetProjectTypes,
    mockGetResourceTypes,
    mockGetRoadMap,
    mockGetScientificDirectionsSystem,
    mockGetUserByLksId,
    mockInitiateProject,
    mockSearchLksUsers,
    mockSearchUsers,
    mockUpdateRoadMapItem,
    mockUpdateRoadMapItemDocuments,
} from '@/mocks/projectShowcase.js';

export const projectShowcaseInitiatorResource = 'ProjectShowcase_Initiator';
export const projectShowcaseSuResource = 'ProjectShowcase_SU';
export const PROJECT_SHOWCASE_LKS_SEARCH_MIN_LENGTH = 4;

const PROJECT_SHOWCASE_BASE = '/api/projectshowcase';

const listEndpointMap = {
    'public': `${PROJECT_SHOWCASE_BASE}/projects/public`,
    'all': `${PROJECT_SHOWCASE_BASE}/projects/all`,
    'me': `${PROJECT_SHOWCASE_BASE}/projects/me`,
    'for-project-office-solution': `${PROJECT_SHOWCASE_BASE}/projects/for-project-office-solution`,
};

const wrapMockResponse = (data) => Promise.resolve({ data });
const isValidLksSearchPart = (value = '') => value.trim().length >= PROJECT_SHOWCASE_LKS_SEARCH_MIN_LENGTH;

const normalizeLksSearchParts = (query = '') => String(query || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const buildLksSearchRequests = (query = '') => {
    const [firstPart = '', secondPart = '', thirdPart = ''] = normalizeLksSearchParts(query);
    const requests = [];

    if (!firstPart) return requests;

    if (!secondPart) {
        if (!isValidLksSearchPart(firstPart)) return requests;

        requests.push(
            { lastName: firstPart },
            { firstName: firstPart },
            { middleName: firstPart },
        );

        return requests;
    }

    const directQuery = {
        lastName: isValidLksSearchPart(firstPart) ? firstPart : undefined,
        firstName: isValidLksSearchPart(secondPart) ? secondPart : undefined,
        middleName: isValidLksSearchPart(thirdPart) ? thirdPart : undefined,
    };

    const reverseQuery = {
        lastName: isValidLksSearchPart(secondPart) ? secondPart : undefined,
        firstName: isValidLksSearchPart(firstPart) ? firstPart : undefined,
        middleName: isValidLksSearchPart(thirdPart) ? thirdPart : undefined,
    };

    [directQuery, reverseQuery].forEach((params) => {
        if (Object.values(params).some(Boolean)) {
            requests.push(params);
        }
    });

    const uniqueRequests = Array.from(new Map(
        requests.map((params) => [JSON.stringify(params), params]),
    ).values());

    return uniqueRequests;
};

const mergeLksSearchResults = (responses = []) => Array.from(new Map(
    responses
        .flatMap((response) => Array.isArray(response.data) ? response.data : [])
        .map((user) => [user?.id ?? JSON.stringify(user), user]),
).values());

export function getProjectsList(mode = 'public', params = {}) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        return wrapMockResponse(mockGetProjectsList(mode, params));
    }
    return axiosInstance.get(listEndpointMap[mode] || listEndpointMap.public, { params });
}

export function getProject(projectId, userId) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        return wrapMockResponse(mockGetProject(projectId, userId));
    }
    return axiosInstance.get(`${PROJECT_SHOWCASE_BASE}/projects/${projectId}`, {
        params: userId ? { userId } : undefined,
    });
}

export function getSuProject(projectId) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        return wrapMockResponse(mockGetProject(projectId));
    }
    return axiosInstance.get(`${PROJECT_SHOWCASE_BASE}/su/projects/${projectId}`);
}

export function initiateProject(payload) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        return wrapMockResponse(mockInitiateProject(payload));
    }
    return axiosInstance.post(`${PROJECT_SHOWCASE_BASE}/projects/initiate-project`, payload);
}

export function getInitiatorTypes() {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        return wrapMockResponse(mockGetInitiatorTypes());
    }
    return axiosInstance.get(`${PROJECT_SHOWCASE_BASE}/projects/initiator-types`);
}

export function getProjectShowcaseDepartmentsByPartOfName(partOfName = '') {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        return wrapMockResponse(mockGetDepartmentsByPartOfName(partOfName));
    }
    return axiosInstance.get(`${PROJECT_SHOWCASE_BASE}/departments/by-part-of-name`, {
        params: { partOfName },
    });
}

export function createProjectSolution(payload) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        mockCreateSolution(payload);
        return wrapMockResponse(null);
    }
    return axiosInstance.post(`${PROJECT_SHOWCASE_BASE}/projects/create-solution`, payload);
}

export function getProjectTypes() {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        return wrapMockResponse(mockGetProjectTypes());
    }
    return axiosInstance.get(`${PROJECT_SHOWCASE_BASE}/projects/get-project-types`);
}

export function getScientificDirectionsSystem() {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        return wrapMockResponse(mockGetScientificDirectionsSystem());
    }
    return axiosInstance.get(`${PROJECT_SHOWCASE_BASE}/scientific-directions/system`);
}

export function addProjectGeneralInformation(projectId, payload) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        mockAddGeneralInformation(projectId, payload);
        return wrapMockResponse(null);
    }
    return axiosInstance.post(`${PROJECT_SHOWCASE_BASE}/projects/${projectId}/add-general-information`, payload);
}

export function addProjectManager(projectId, userId, division) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        mockAddProjectManager(projectId, userId, division);
        return wrapMockResponse(null);
    }
    return axiosInstance.post(`${PROJECT_SHOWCASE_BASE}/projects/${projectId}/add-project-manager`, null, {
        params: { userId, division },
    });
}

export function addProjectTasks(projectId, tasks) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        mockAddTasks(projectId, tasks);
        return wrapMockResponse(null);
    }
    return axiosInstance.post(`${PROJECT_SHOWCASE_BASE}/projects/${projectId}/add-tasks`, tasks);
}

export function getResourceTypes() {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        return wrapMockResponse(mockGetResourceTypes());
    }
    return axiosInstance.get(`${PROJECT_SHOWCASE_BASE}/projects/get-resource-types`);
}

export function addProjectResource(projectId, payload) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        mockAddResource(projectId, payload);
        return wrapMockResponse(null);
    }
    return axiosInstance.post(`${PROJECT_SHOWCASE_BASE}/projects/${projectId}/add-resource`, null, {
        params: payload,
    });
}

export function addProjectCriterias(projectId, criterias) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        mockAddCriterias(projectId, criterias);
        return wrapMockResponse(null);
    }
    return axiosInstance.post(`${PROJECT_SHOWCASE_BASE}/projects/${projectId}/add-criterias`, criterias);
}

export function getProjectCheckList(projectId) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        return wrapMockResponse(mockGetCheckList(projectId));
    }
    return axiosInstance.get(`${PROJECT_SHOWCASE_BASE}/projects/${projectId}/get-check-list`);
}

export function changeProjectVisibility(projectId, isPublic = true) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        mockChangeVisibility(projectId);
        return wrapMockResponse(null);
    }
    return axiosInstance.put(`${PROJECT_SHOWCASE_BASE}/project/${projectId}/change-visibility`, null, {
        params: { isPublic },
    });
}

export function getProjectParticipants(projectId) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        return wrapMockResponse(mockGetParticipants(projectId));
    }
    return axiosInstance.get(`${PROJECT_SHOWCASE_BASE}/projects/${projectId}/participiants`);
}

export function addProjectParticipant(projectId, payload) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        mockAddParticipant(projectId, payload);
        return wrapMockResponse(null);
    }
    return axiosInstance.post(`${PROJECT_SHOWCASE_BASE}/projects/${projectId}/add-participiant`, null, {
        params: payload,
    });
}

export function getProjectJournal(projectId, params = {}) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        return wrapMockResponse(mockGetJournal(projectId, params));
    }
    return axiosInstance.get(`${PROJECT_SHOWCASE_BASE}/projects/${projectId}/journal`, { params });
}

export function getProjectRoadMap(projectId) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        return wrapMockResponse(mockGetRoadMap(projectId));
    }
    return axiosInstance.get(`${PROJECT_SHOWCASE_BASE}/projects/${projectId}/road-map`);
}

export function getMeInProjectShowcaseSystem() {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        return wrapMockResponse(mockGetMeInSystem());
    }
    return axiosInstance.get(`${PROJECT_SHOWCASE_BASE}/users/get-me-in-system`);
}

export function addMeToProjectShowcaseSystem() {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        return wrapMockResponse(mockAddMeToSystem());
    }
    return axiosInstance.post(`${PROJECT_SHOWCASE_BASE}/users/add-me-to-system`);
}

export function getProjectShowcaseUserByLksId(lksId) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        return wrapMockResponse(mockGetUserByLksId(lksId));
    }
    return axiosInstance.get(`${PROJECT_SHOWCASE_BASE}/users/get-user-by-lks-id`, {
        params: { lksId },
    });
}

export function addLksUserToProjectShowcaseSystem(lksId) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        return wrapMockResponse(mockAddLksUserToSystem(lksId));
    }
    return axiosInstance.post(`${PROJECT_SHOWCASE_BASE}/users/add-lks-user-to-system`, null, {
        params: { lksId },
    });
}

export function searchProjectShowcaseUsers(partOfName) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        return wrapMockResponse(mockSearchUsers(partOfName));
    }
    return axiosInstance.get(`${PROJECT_SHOWCASE_BASE}/users/get-users-by-initials`, {
        params: { partOfName },
    });
}

export function searchProjectShowcaseLksUsers(query = '') {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        return wrapMockResponse(mockSearchLksUsers(query));
    }

    const requests = buildLksSearchRequests(query);

    if (!requests.length) {
        return wrapMockResponse([]);
    }

    return Promise.all(
        requests.map((params) => axiosInstance.post(`${PROJECT_SHOWCASE_BASE}/users/lks/list`, null, { params })),
    ).then((responses) => ({
        data: mergeLksSearchResults(responses),
    }));
}

export function addProjectShowcaseUser(payload) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        return wrapMockResponse(mockAddUser(payload));
    }
    return axiosInstance.post(`${PROJECT_SHOWCASE_BASE}/users/add-user-to-system`, payload);
}

export function addRoadMapItem(projectId, payload) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        mockAddRoadMapItem(projectId, payload);
        return wrapMockResponse(null);
    }
    return axiosInstance.post(`${PROJECT_SHOWCASE_BASE}/project/${projectId}/add-road-map-item`, payload);
}

export function getProjectDocuments(projectId) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        return wrapMockResponse(mockGetProjectDocuments(projectId));
    }
    return axiosInstance.get(`${PROJECT_SHOWCASE_BASE}/project/${projectId}/documents`);
}

export function addProjectDocument(projectId, payload) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        return wrapMockResponse(mockAddProjectDocument(projectId, payload));
    }
    return axiosInstance.post(`${PROJECT_SHOWCASE_BASE}/project/${projectId}/add-document`, payload);
}

export function getProjectDocument(documentId) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        return wrapMockResponse(mockGetProjectDocument(documentId));
    }
    return axiosInstance.get(`${PROJECT_SHOWCASE_BASE}/projects/documents/${documentId}`);
}

export function deleteProjectDocument(documentId) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        mockDeleteProjectDocument(documentId);
        return wrapMockResponse(null);
    }
    return axiosInstance.delete(`${PROJECT_SHOWCASE_BASE}/projects/documents/${documentId}`);
}

export function updateRoadMapItem(itemId, payload) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        mockUpdateRoadMapItem(itemId, payload);
        return wrapMockResponse(null);
    }
    return axiosInstance.put(`${PROJECT_SHOWCASE_BASE}/projects/road-map-item/${itemId}`, payload);
}

export function updateRoadMapItemDocuments(itemId, payload) {
    if (USE_PROJECT_SHOWCASE_MOCK_DATA) {
        mockUpdateRoadMapItemDocuments(itemId, payload);
        return wrapMockResponse(null);
    }
    return axiosInstance.put(`${PROJECT_SHOWCASE_BASE}/projects/road-map-item/${itemId}/documents`, payload);
}
