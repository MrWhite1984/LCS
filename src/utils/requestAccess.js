import { getSessionUserId } from '@/utils/TokenService';
import { USE_MOCK_DATA } from '@/config/mockRuntime.js';
import { getCurrentUser } from '@/utils/currentUser.js';

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

            // The current-user response already contains external accounts, so
            // don't make an additional `getall` request during application startup.
            const currentUser = await getCurrentUser();
            const accounts = Array.isArray(currentUser?.externalAccounts)
                ? currentUser.externalAccounts
                : [];
            const infraAccount = accounts.find((account) => Number(account.systemType) === INFRA_MANAGER_SYSTEM_TYPE);

            cachedResult = {
                showRequests: Boolean(infraAccount),
                infraManagerUserId: infraAccount?.userIdInOtherSystem || '',
            };
            cachedUserId = currentUser?.id || currentUserId;
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
