// stores/permissions.js
import { defineStore } from 'pinia';
import axiosInstance from '@/utils/axios.js';
import { isSessionExpiredFlag, isLocalAuthBypassActive } from '../utils/TokenService';

export const usePermissionStore = defineStore('permissions', {
  state: () => ({
    permissions: [],
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
          const { data } = await axiosInstance.get('/api/users/me/permissions');
          this.permissions = data;
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
      this.isLoaded = false;
      this.isLoading = false;
      this.loadingPromise = null;
    },

    hasPermission(resourceType, actionType) {
      if (isLocalAuthBypassActive()) {
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
