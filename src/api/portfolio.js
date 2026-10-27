import axiosInstance from '@/utils/axios.js';

const base = '/api/portfolio';

export function getPortfolioDisciplines(studentId) {
    return axiosInstance.get(`${base}/disciplines`, {
        params: { studentId },
    });
}

export function getPortfolioWorks(studentId) {
    return axiosInstance.get(`${base}/works`, {
        params: { studentId },
    });
}

export function uploadPortfolioWork({ studentId, disciplineId, file }) {
    const formData = new FormData();
    formData.append('studentId', String(studentId));
    formData.append('disciplineId', String(disciplineId));
    formData.append('file', file);

    return axiosInstance.post(`${base}/works`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
}

export function downloadPortfolioWork({ studentId, workId }) {
    return axiosInstance.get(`${base}/works/${encodeURIComponent(workId)}/download`, {
        params: { studentId },
        responseType: 'blob',
    });
}
