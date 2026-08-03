import axiosInstance from '@/utils/axios.js';
import { ticketMocks, USE_MOCK_DATA } from '@/config/mockRuntime.js';

const wrapMockResponse = (data) => Promise.resolve({ data });

export function getTicketRequestTypes() {
    if (USE_MOCK_DATA) {
        return wrapMockResponse(ticketMocks.mockTicketRequestTypes || []);
    }

    return axiosInstance.get('/api/tickets/request-types');
}

export function getTicketRequestType(requestTypeId) {
    if (USE_MOCK_DATA) {
        return wrapMockResponse(ticketMocks.mockGetTicketRequestType?.(requestTypeId) ?? null);
    }

    return axiosInstance.get(`/api/tickets/request-types/${requestTypeId}`);
}

export function listMyTickets(payload) {
    if (USE_MOCK_DATA) {
        return wrapMockResponse(ticketMocks.mockGetMyTicketsList?.(payload) ?? []);
    }

    return axiosInstance.post('/api/tickets/for-me/list', payload);
}

export function getMyTicket(ticketId) {
    if (USE_MOCK_DATA) {
        return wrapMockResponse(ticketMocks.mockGetMyTicket?.(ticketId) ?? null);
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
        const mockRequestType = ticketMocks.mockGetTicketRequestType?.(payload?.requestTypeId) ?? null;
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
