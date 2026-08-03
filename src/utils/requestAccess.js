import axiosInstance from '@/utils/axios.js';
import { getSessionUserId } from '@/utils/TokenService';
import { USE_MOCK_DATA } from '@/config/mockRuntime.js';

const INFRA_MANAGER_SYSTEM_TYPE = 0;

let cachedResult = null;
let cachedUserId = null;
let inflightPromise = null;

function persist(result) {
    localStorage.setItem('InfraStatus', result.showRequests ? 'true' : 'false');
    localStorage.setItem('infraManagerUserId', result.infraManagerUserId || '');
}

export async function getRequestAccess(force = false) {
    const currentUserId = getSessionUserId();

    if (!force) {
        if (inflightPromise) return inflightPromise;
        if (cachedResult && cachedUserId === currentUserId) return cachedResult;
    }

    inflightPromise = (async () => {
        try {
            if (USE_MOCK_DATA) {
                cachedResult = {
                    showRequests: true,
                    infraManagerUserId: 'mock-infra-user',
                };
                cachedUserId = currentUserId;
                return cachedResult;
            }

            const response = await axiosInstance.get('/api/users/other-accounts/getall');
            const accounts = response.data?.accounts || [];
            const infraAccount = accounts.find((account) => Number(account.systemType) === INFRA_MANAGER_SYSTEM_TYPE);

            cachedResult = {
                showRequests: Boolean(infraAccount),
                infraManagerUserId: infraAccount?.userIdInOtherSystem || '',
            };
            cachedUserId = currentUserId;
        } catch (error) {
            cachedResult = {
                showRequests: false,
                infraManagerUserId: '',
            };
            cachedUserId = currentUserId;
        } finally {
            persist(cachedResult);
            inflightPromise = null;
        }

        return cachedResult;
    })();

    return inflightPromise;
}

export function resetRequestAccessCache() {
    cachedResult = null;
    cachedUserId = null;
    inflightPromise = null;
}
