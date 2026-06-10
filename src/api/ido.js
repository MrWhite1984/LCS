import axiosInstance from '@/utils/axios.js';

const IDO_SU_RESOURCE = 'Additional_consultation_calculator_SU';

export const idoSuResource = IDO_SU_RESOURCE;

export function searchTeachers(partOfName) {
    return axiosInstance.get('/api/ido/acc/teachers', {
        params: { partOfName },
    });
}

export function getTeacherDivisions(teacherId) {
    return axiosInstance.get(`/api/ido/acc/teachers/divisions/${teacherId}`);
}

export function createIdoOrder(payload) {
    return axiosInstance.post('/api/ido/acc/create-order', payload);
}

export function createPublicIdoOrder(payload) {
    return axiosInstance.post('/api/ido/acc/for-all/create-order', payload);
}

export function fetchCurrentUserPhones() {
    return axiosInstance.get('/api/users/me/phones');
}

export function getIdoOrders(role, params = {}) {
    const endpointMap = {
        'teacher': '/api/ido/acc/orders/user/teacher',
        'employer-lks': '/api/ido/acc/orders/user/employer-lks',
        'su': '/api/ido/acc/su/orders',
    };

    return axiosInstance.get(endpointMap[role] || endpointMap['employer-lks'], { params });
}

export function exportIdoOrdersReport(params = {}) {
    return axiosInstance.get('/api/ido/acc/su/export/excel', { params });
}

export function getIdoOrder(role, orderId) {
    const base = role === 'su' ? '/api/ido/acc/su/orders' : '/api/ido/acc/orders';
    return axiosInstance.get(`${base}/${orderId}`);
}

export function getIdoOrderDocuments(role, orderId) {
    const base = role === 'su' ? '/api/ido/acc/su/orders' : '/api/ido/acc/orders';
    return axiosInstance.get(`${base}/${orderId}/documents`);
}

export function setOrderPaid(orderId, isPaid) {
    return axiosInstance.put(`/api/ido/acc/su/orders/${orderId}/set-paid`, null, {
        params: { isPaid },
    });
}

export function setOrderCanceled(orderId, isCanceled) {
    return axiosInstance.put(`/api/ido/acc/su/orders/${orderId}/set-canceled`, null, {
        params: { isCanceled },
    });
}

export function setOrderCompleted(orderId, isCompleted) {
    return axiosInstance.put(`/api/ido/acc/su/orders/${orderId}/set-completed`, null, {
        params: { isCompleted },
    });
}

export function getAcademicDegrees() {
    return axiosInstance.get('/api/ido/acc/su/academic-degrees');
}

export function updateAcademicDegreePercent(academicDegreeId, percent) {
    return axiosInstance.put(`/api/ido/acc/su/academic-degrees/${academicDegreeId}`, null, {
        params: { percent },
    });
}

export function getAcademicRanks() {
    return axiosInstance.get('/api/ido/acc/su/academic-ranks');
}

export function updateAcademicRankPercent(academicRankId, percent) {
    return axiosInstance.put(`/api/ido/acc/su/academic-ranks/${academicRankId}`, null, {
        params: { percent },
    });
}

export function getCalculationSettings() {
    return axiosInstance.get('/api/ido/acc/su/settings');
}

export function updateStandardNumberOfHours(standardNumberOfHours) {
    return axiosInstance.put('/api/ido/acc/su/settings/standard-number-of-hours', null, {
        params: { standardNumberOfHours },
    });
}

export function updateAccrualOnWages(accrualOnWages) {
    return axiosInstance.put('/api/ido/acc/su/settings/accrual-on-wages', null, {
        params: { accrualOnWages },
    });
}

export function updateDevelopmentOfSibadi(developmentOfSibADI) {
    return axiosInstance.put('/api/ido/acc/su/settings/development-of-sibadi', null, {
        params: { developmentOfSibADI },
    });
}

export function updateVat(vat) {
    return axiosInstance.put('/api/ido/acc/su/settings/vat', null, {
        params: { vat },
    });
}

export function uploadIdoTemplate(template) {
    return axiosInstance.put('/api/ido/acc/su/set-template', { template });
}

export function syncAcademicData() {
    return axiosInstance.put('/api/ido/acc/su/sync-academic-data');
}
