const mockModules = import.meta.glob('./mocks/*.js', { eager: true });

const configModule = mockModules['./mocks/config.js'] ?? {};

export const USE_MOCK_DATA = Boolean(configModule.USE_MOCK_DATA);
export const USE_PROJECT_SHOWCASE_MOCK_DATA = Boolean(configModule.USE_PROJECT_SHOWCASE_MOCK_DATA);
export const FAQ_ADMIN_SEGMENT = String(configModule.FAQ_ADMIN_SEGMENT || 'su');

export const ticketMocks = mockModules['./mocks/tickets.js'] ?? {};
export const projectShowcaseMocks = mockModules['./mocks/projectShowcase.js'] ?? {};
export const userMocks = mockModules['./mocks/user.js'] ?? {};
export const requestMocks = mockModules['./mocks/requests.js']?.requestMocks ?? [];
export const faqMocks = mockModules['./mocks/faq.js']?.faqMocks ?? {};
export const scheduleMocks = mockModules['./mocks/schedule.js']?.scheduleMocks ?? {};
