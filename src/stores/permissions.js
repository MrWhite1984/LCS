// stores/permissions.js
import { defineStore } from 'pinia';
import axiosInstance from '@/utils/axios.js';
import { isSessionExpiredFlag, isLocalAuthBypassActive } from '../utils/TokenService';
import { getCurrentUser } from '@/utils/currentUser.js';
import { getUserRoleNames } from '@/utils/roles.js';

export const usePermissionStore = defineStore('permissions', {
  state: () => ({
    permissions: [],
    roleNames: [],
    isLoaded: false,
    isLoading: false,
    loadingPromise: null,
  }),

  actions: {
    async fetchPermissions() {
      if (this.isLoaded) return;
      if (isSessionExpiredFlag()) return;
      if (this.loadingPromise) return this.loadingPromise;

      this.isLoading = true;
      this.loadingPromise = (async () => {
        try {
          const [{ data }, currentUser] = await Promise.all([
            axiosInstance.get('/api/users/me/permissions'),
            getCurrentUser(),
          ]);

          this.permissions = Array.isArray(data) ? data : [];
          this.roleNames = getUserRoleNames(currentUser);
          this.isLoaded = true;
        } catch (error) {
          console.debug('Ошибка при загрузке полномочий:', error);
          throw error;
        } finally {
          this.isLoading = false;
          this.loadingPromise = null;
        }
      })();

      return this.loadingPromise;
    },

    clearPermissions() {
      this.permissions = [];
      this.roleNames = [];
      this.isLoaded = false;
      this.isLoading = false;
      this.loadingPromise = null;
    },

    hasPermission(resourceType, actionType) {
      if (isLocalAuthBypassActive()) {
        return true;
      }

      // `roleName` is a stable SSO identifier, unlike a display title.
      // The backend remains the authority for all other permission checks.
      if (this.roleNames.includes('superadmin')) {
        return true;
      }

      const resource = this.permissions.find(
        item => item.type === resourceType
      );

      if (!resource) return false;

      return resource.permissions.some(
        permission => permission.type === actionType
      );
    },
  },
});
