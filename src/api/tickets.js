import axiosInstance from '@/utils/axios.js';
import { USE_MOCK_DATA } from '@/config/mocks/config.js';
import {
    mockGetMyTicket,
    mockGetMyTicketsList,
    mockGetTicketRequestType,
    mockTicketRequestTypes,
} from '@/config/mocks/tickets.js';

const wrapMockResponse = (data) => Promise.resolve({ data });

export function getTicketRequestTypes() {
    if (USE_MOCK_DATA) {
        return wrapMockResponse(mockTicketRequestTypes);
    }

    return axiosInstance.get('/api/tickets/request-types');
}

export function getTicketRequestType(requestTypeId) {
    if (USE_MOCK_DATA) {
        return wrapMockResponse(mockGetTicketRequestType(requestTypeId));
    }

    return axiosInstance.get(`/api/tickets/request-types/${requestTypeId}`);
}

export function listMyTickets(payload) {
    if (USE_MOCK_DATA) {
        return wrapMockResponse(mockGetMyTicketsList(payload));
    }

    return axiosInstance.post('/api/tickets/for-me/list', payload);
}

export function getMyTicket(ticketId) {
    if (USE_MOCK_DATA) {
        return wrapMockResponse(mockGetMyTicket(ticketId));
    }

    return axiosInstance.get(`/api/tickets/for-me/${ticketId}`);
}

export function downloadMyTicketAttachment(ticketId, attachmentId) {
    if (USE_MOCK_DATA) {
        return wrapMockResponse('');
    }

    return axiosInstance.get(`/api/tickets/for-me/${ticketId}/attachments/${attachmentId}`);
}

export function createMyTicket(payload) {
    if (USE_MOCK_DATA) {
        const mockRequestType = mockGetTicketRequestType(payload?.requestTypeId);
        return wrapMockResponse({
            id: crypto.randomUUID(),
            number: 2048,
            requestTypeId: payload?.requestTypeId,
            requestType: mockRequestType,
            status: 'New',
            priority: payload?.priority || 'Medium',
            formData: payload?.formData || '{}',
            requesterSystem: 'mock',
            requesterId: 'mock-user',
            assigneeId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            resolvedAt: null,
            closedAt: null,
            comments: [],
            attachments: [],
        });
    }

    return axiosInstance.post('/api/tickets/for-me', payload);
}
