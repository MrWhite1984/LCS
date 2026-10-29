import axiosInstance from '@/utils/axios.js';

const base = '/api/surveys/admin';

export function getAdminSurveys(params = {}) {
    return axiosInstance.get(`${base}/surveys`, { params });
}

export function getAdminSurvey(id) {
    return axiosInstance.get(`${base}/surveys/${encodeURIComponent(id)}`);
}

export function getAdminSurveyQuestions(id) {
    return axiosInstance.get(`${base}/surveys/${encodeURIComponent(id)}/questions`);
}

export function createAdminSurvey(payload) {
    return axiosInstance.post(`${base}/surveys`, payload);
}

export function updateAdminSurvey(id, payload) {
    return axiosInstance.put(`${base}/surveys/${encodeURIComponent(id)}`, payload);
}

export function publishAdminSurvey(id) {
    return axiosInstance.post(`${base}/surveys/${encodeURIComponent(id)}/publish`);
}

export function closeAdminSurvey(id) {
    return axiosInstance.post(`${base}/surveys/${encodeURIComponent(id)}/close`);
}

export function deleteAdminSurvey(id) {
    return axiosInstance.delete(`${base}/surveys/${encodeURIComponent(id)}`);
}

export function createAdminQuestion(surveyId, payload) {
    return axiosInstance.post(`${base}/surveys/${encodeURIComponent(surveyId)}/questions`, payload);
}

export function updateAdminQuestion(questionId, payload) {
    return axiosInstance.put(`${base}/questions/${encodeURIComponent(questionId)}`, payload);
}

export function deleteAdminQuestion(questionId) {
    return axiosInstance.delete(`${base}/questions/${encodeURIComponent(questionId)}`);
}

export function reorderAdminQuestions(surveyId, questionIds) {
    return axiosInstance.put(`${base}/surveys/${encodeURIComponent(surveyId)}/questions/order`, { questionIds });
}

export function getAdminAudience(surveyId) {
    return axiosInstance.get(`${base}/surveys/${encodeURIComponent(surveyId)}/audience`);
}

export function upsertAdminAudience(surveyId, audience) {
    return axiosInstance.put(`${base}/surveys/${encodeURIComponent(surveyId)}/audience`, { audience });
}

export function evaluateAdminAudience(payload) {
    return axiosInstance.post(`${base}/audience/evaluate`, payload);
}

export function getAdminGroups(params = {}) {
    return axiosInstance.get(`${base}/groups`, { params });
}

export function getAdminUserOptions(params = {}) {
    return axiosInstance.get(`${base}/users`, { params });
}

export function getAdminElectiveGroups(params = {}) {
    return axiosInstance.get(`${base}/elective-groups`, { params });
}

export function buildAdminElectives(payload) {
    return axiosInstance.post(`${base}/electives/build`, payload);
}

export function getAdminFields() {
    return axiosInstance.get(`${base}/fields`);
}

export function upsertAdminField(payload) {
    return axiosInstance.put(`${base}/fields`, payload);
}

export function checkAdminFieldUsage(id) {
    return axiosInstance.get(`${base}/fields/${encodeURIComponent(id)}/usage`);
}

export function deleteAdminField(id) {
    return axiosInstance.delete(`${base}/fields/${encodeURIComponent(id)}`);
}

export function getAdminPresets() {
    return axiosInstance.get(`${base}/presets`);
}

export function upsertAdminPreset(payload) {
    return axiosInstance.put(`${base}/presets`, payload);
}

export function deleteAdminPreset(id) {
    return axiosInstance.delete(`${base}/presets/${encodeURIComponent(id)}`);
}

export function grantAdminAccess(payload) {
    return axiosInstance.post(`${base}/access`, payload);
}

export function getAdminTemplates() {
    return axiosInstance.get(`${base}/templates`);
}

export function upsertAdminTemplate(payload) {
    return axiosInstance.put(`${base}/templates`, payload);
}

export function deleteAdminTemplate(id) {
    return axiosInstance.delete(`${base}/templates/${encodeURIComponent(id)}`);
}

export function createAdminSurveyFromTemplate(templateId, payload) {
    return axiosInstance.post(`${base}/templates/${encodeURIComponent(templateId)}/create-survey`, payload);
}

export function createAdminSeriesFromTemplate(payload) {
    return axiosInstance.post(`${base}/series/from-template`, payload);
}

export function getAdminSeries(params = {}) {
    return axiosInstance.get(`${base}/series`, { params });
}

export function getAdminSeriesById(id) {
    return axiosInstance.get(`${base}/series/${encodeURIComponent(id)}`);
}

export function updateAdminSeries(payload) {
    return axiosInstance.put(`${base}/series`, payload);
}

export function publishAdminSeries(id, segmentKeys = []) {
    return axiosInstance.post(`${base}/series/${encodeURIComponent(id)}/publish`, { segmentKeys });
}

export function closeAdminSeries(id, segmentKeys = []) {
    return axiosInstance.post(`${base}/series/${encodeURIComponent(id)}/close`, { segmentKeys });
}

export function archiveAdminSeries(id) {
    return axiosInstance.post(`${base}/series/${encodeURIComponent(id)}/archive`);
}

export function getAdminProgress(surveyId) {
    return axiosInstance.get(`${base}/surveys/${encodeURIComponent(surveyId)}/progress`);
}

export function getAdminResults(params = {}) {
    return axiosInstance.get(`${base}/results`, { params });
}

export function getAdminResponses(params = {}) {
    return axiosInstance.get(`${base}/responses`, { params });
}

export function exportAdminResults(params = {}) {
    return axiosInstance.get(`${base}/results/export`, {
        params,
        responseType: 'blob',
    });
}
