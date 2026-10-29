import axiosInstance from '@/utils/axios.js';

const base = '/api/surveys';

export function getPendingSurveys() {
    return axiosInstance.get(`${base}/pending`);
}

export function getSurveyForUser(surveyId) {
    return axiosInstance.get(`${base}/${encodeURIComponent(surveyId)}`);
}

export function submitSurvey(surveyId, { answers, draft = false }) {
    return axiosInstance.post(`${base}/${encodeURIComponent(surveyId)}/submit`, {
        answers,
        draft,
    });
}

export function skipSurvey(surveyId) {
    return axiosInstance.post(`${base}/${encodeURIComponent(surveyId)}/skip`);
}

export function skipAllSurveys() {
    return axiosInstance.post(`${base}/skip-all`);
}
