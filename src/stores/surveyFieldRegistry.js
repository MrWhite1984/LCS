import { defineStore } from 'pinia';
import { getAdminFields } from '@/api/surveysAdmin.js';

export const useSurveyFieldRegistry = defineStore('surveyFieldRegistry', {
    state: () => ({
        fields: [],
        loaded: false,
        isLoading: false,
        loadingPromise: null,
    }),

    actions: {
        async load(force = false) {
            if (this.loaded && !force) return this.fields;
            if (this.loadingPromise) return this.loadingPromise;

            this.isLoading = true;
            this.loadingPromise = (async () => {
                try {
                    const response = await getAdminFields();
                    this.fields = Array.isArray(response.data?.fields) ? response.data.fields : [];
                    this.loaded = true;
                    return this.fields;
                } finally {
                    this.isLoading = false;
                    this.loadingPromise = null;
                }
            })();

            return this.loadingPromise;
        },

        async refresh() {
            return this.load(true);
        },

        getField(code) {
            return this.fields.find((field) => field.code === code) || null;
        },

        getCodes() {
            return this.fields.map((field) => field.code);
        },
    },
});
