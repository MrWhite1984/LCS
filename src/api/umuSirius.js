import axiosInstance from '@/utils/axios.js';
import qs from 'qs';

export const umuSiriusResponsibleResource = 'Umu_sirius_responsible_employee_department';
export const umuSiriusEmployeeResource = 'Umu_sirius_employee_educational_department';
export const umuSiriusSuResource = 'Umu_sirius_SU';

const base = '/api/umusirius';

export function getUmuSiriusExecutors(isUmuEmployee, payload) {
    const endpoint = isUmuEmployee ? `${base}/executors/umu/by-filters` : `${base}/executors/by-filters`;
    return axiosInstance.post(endpoint, payload);
}

export function getUmuSiriusExecutor(id, isUmuEmployee = false) {
    const endpoint = isUmuEmployee ? `${base}/executors/${id}/umu` : `${base}/executors/${id}`;
    return axiosInstance.get(endpoint);
}

export function createUmuSiriusExecutor(payload) {
    return axiosInstance.post(`${base}/executors`, payload);
}

export function updateUmuSiriusExecutor(id, payload) {
    return axiosInstance.put(`${base}/executors/${id}/umu`, payload);
}

export function getUmuSiriusPersonalDataAgreements(executorId, isUmuEmployee = false) {
    const endpoint = isUmuEmployee
        ? `${base}/executors/${executorId}/personal-data-agreements/umu`
        : `${base}/executors/${executorId}/personal-data-agreements`;
    return axiosInstance.get(endpoint);
}

export function getUmuSiriusAgreements(isUmuEmployee, payload) {
    const endpoint = isUmuEmployee ? `${base}/agreements/umu/by-filters` : `${base}/agreements/by-filters`;
    return axiosInstance.post(endpoint, payload);
}

export function getUmuSiriusAgreement(id, isUmuEmployee = false) {
    const endpoint = isUmuEmployee ? `${base}/agreements/${id}/umu` : `${base}/agreements/${id}`;
    return axiosInstance.get(endpoint);
}

export function createUmuSiriusAgreement(payload) {
    return axiosInstance.post(`${base}/agreements`, payload);
}

export function updateUmuSiriusAgreement(id, payload) {
    return axiosInstance.put(`${base}/agreements/${id}`, payload);
}

export function addUmuSiriusAgreementSolution(id, params) {
    return axiosInstance.put(`${base}/agreements/${id}/add-solution`, null, { params });
}

export function getUmuSiriusAgreementDocuments(id, isUmuEmployee = false) {
    const endpoint = isUmuEmployee
        ? `${base}/agreements/${id}/documents/agreement/umu`
        : `${base}/agreements/${id}/documents/agreement`;
    return axiosInstance.get(endpoint);
}

export function getUmuSiriusTerminationDocuments(id, params, services) {
    return axiosInstance.post(`${base}/agreements/${id}/documents/termination`, services, {
        params,
        paramsSerializer: (queryParams) => qs.stringify(queryParams, { allowDots: true }),
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

export function getUmuSiriusServices(isUmuEmployee = false, params = {}) {
    const endpoint = isUmuEmployee ? `${base}/services/umu` : `${base}/services`;
    return axiosInstance.get(endpoint, { params });
}

export function createUmuSiriusService(params) {
    return axiosInstance.post(`${base}/services`, null, { params });
}

export function getUmuSiriusBanks() {
    return axiosInstance.get(`${base}/banks/all`);
}

export function searchUmuSiriusBanks(partOfName) {
    return axiosInstance.get(`${base}/banks/by-name`, {
        params: { partOfName },
    });
}

export function createUmuSiriusBank(bankName) {
    return axiosInstance.post(`${base}/banks`, null, {
        params: { bankName },
    });
}

export function getUmuSiriusPaymentDetails(executorId, params = {}) {
    return axiosInstance.get(`${base}/executors/${executorId}/payment-details`, { params });
}

export function createUmuSiriusPaymentDetails(executorId, payload) {
    return axiosInstance.post(`${base}/executors/${executorId}/payment-details`, payload);
}

export function updateUmuSiriusPaymentDetails(paymentDetailsId, payload) {
    return axiosInstance.put(`${base}/executors/payment-details/${paymentDetailsId}`, payload);
}

export function getUmuSiriusTemplateTypes() {
    return axiosInstance.get(`${base}/templates/types`);
}

export function getUmuSiriusActualTemplate(typeId) {
    return axiosInstance.get(`${base}/templates/actual/by-type/${typeId}`);
}

export function setUmuSiriusTemplate(payload) {
    return axiosInstance.post(`${base}/templates`, payload);
}
