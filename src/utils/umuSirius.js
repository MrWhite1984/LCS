import { downloadBase64Document, ensureFileNameWithExtension } from '@/utils/ido.js';

export const UMU_DEFAULT_HOUR_PRICE = 541;
export const UMU_DEFAULT_ORDER_DATE = '2025-08-20';
export const UMU_DEFAULT_ORDER_NUMBER = 'П-25-278/АФ';

export function formatUmuDate(value) {
    if (!value) return '';

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const normalized = String(value).trim();
    if (!normalized) return '';

    const displayDateMatch = normalized.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (displayDateMatch) {
        const [, day, month, year] = displayDateMatch;
        return `${year}-${month}-${day}`;
    }

    return normalized.slice(0, 10);
}

export function parseUmuDate(value) {
    const normalized = formatUmuDate(value);
    if (!normalized) return null;

    const [year, month, day] = normalized.split('-').map(Number);
    if (!year || !month || !day) return null;

    return new Date(year, month - 1, day);
}

export function formatUmuDisplayDate(value) {
    const normalized = formatUmuDate(value);
    if (!normalized) return '-';

    const [year, month, day] = normalized.split('-');
    return `${day}.${month}.${year}`;
}

export function toUmuDateOnly(value) {
    const date = parseUmuDate(value);
    if (!date) return null;

    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()],
    };
}

export function buildExecutorFullName(executor) {
    return [executor?.lastName, executor?.firstName, executor?.middleName].filter(Boolean).join(' ');
}

export function formatUmuCurrency(value) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 2,
    }).format(Number(value || 0));
}

export function getUmuAgreementStatus(agreement) {
    if (agreement?.isClosed) {
        return { label: 'Закрыт', severity: 'secondary' };
    }

    if (agreement?.isApproved) {
        return { label: 'Принят', severity: 'success' };
    }

    if (agreement?.disapprovedComment) {
        return { label: 'Отклонен', severity: 'danger' };
    }

    return { label: 'На решении', severity: 'warning' };
}

export function downloadUmuDocument(document) {
    if (!document?.content) return false;

    const name = String(document.name || 'umu-document.docx');
    const extension = name.includes('.') ? name.split('.').pop() : 'docx';
    const mimeType = extension?.toLowerCase() === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    downloadBase64Document(
        document.content,
        ensureFileNameWithExtension(name, extension || 'docx', 'umu-document'),
        mimeType
    );

    return true;
}

export function downloadUmuDocuments(documents) {
    const list = Array.isArray(documents) ? documents : [documents].filter(Boolean);
    let downloaded = 0;

    list.forEach((document) => {
        if (downloadUmuDocument(document)) {
            downloaded += 1;
        }
    });

    return downloaded;
}

export function compactObject(payload) {
    return Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    );
}
