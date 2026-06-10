import { idoSuResource } from '@/api/ido.js';

const TEACHER_ROLE_MATCHER = /(преподав|доцент|професс|ассистент|старш(?:ий|ая)\s+преподав|ппс)/i;

export function getIdoUserRole(currentUser, permissionStore) {
    return getIdoAvailableRoles(currentUser, permissionStore)[0] || 'employer-lks';
}

export function getIdoAvailableRoles(currentUser, permissionStore) {
    const hasSuAccess = permissionStore?.hasPermission(idoSuResource, 'Read')
        || permissionStore?.hasPermission(idoSuResource, 'Update');

    if (hasSuAccess) return ['su'];

    const roles = Array.isArray(currentUser?.roles) ? currentUser.roles : [];
    const isTeacher = roles.some((role) => {
        const haystack = `${role?.title || ''} ${role?.description || ''}`;
        return TEACHER_ROLE_MATCHER.test(haystack);
    });

    return isTeacher ? ['teacher', 'employer-lks'] : ['employer-lks'];
}

export function buildTeacherLabel(teacher) {
    return [teacher?.surname, teacher?.name, teacher?.patronymic].filter(Boolean).join(' ');
}

export function buildEmployerLabel(employer) {
    return [employer?.surname, employer?.name, employer?.patronymic].filter(Boolean).join(' ');
}

export function downloadBase64Document(docFile, docName, mimeType = 'application/octet-stream') {
    if (!docFile || !docName) return;

    const binary = atob(docFile);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const blob = new Blob([bytes], {
        type: mimeType,
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = docName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function ensureFileNameWithExtension(value, extension, fallbackBaseName = 'document') {
    const normalized = String(value || '').trim();

    if (!normalized) {
        return `${fallbackBaseName}.${extension}`;
    }

    return new RegExp(`\\.${extension}$`, 'i').test(normalized)
        ? normalized
        : `${normalized}.${extension}`;
}

export function downloadIdoDocument(documents, format) {
    if (!documents || !format) return false;

    const config = format === 'pdf'
        ? {
            file: documents.pdfFile,
            name: ensureFileNameWithExtension(documents.pdfName, 'pdf', 'ido-document'),
            mimeType: 'application/pdf',
        }
        : {
            file: documents.docFile,
            name: ensureFileNameWithExtension(documents.docName, 'docx', 'ido-document'),
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        };

    if (!config.file) return false;

    downloadBase64Document(config.file, config.name, config.mimeType);
    return true;
}

export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result || '');
            resolve(result.includes(',') ? result.split(',')[1] : result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function getPrimaryPhone(phones = []) {
    return phones[0]?.number || '';
}

export function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim());
}
