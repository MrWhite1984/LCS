const MEDIA_TOKEN_REGEX = /media:\/\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/gi;
const FILE_EXTENSION_MIME_MAP = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    pdf: 'application/pdf',
    txt: 'text/plain',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    zip: 'application/zip',
    rar: 'application/vnd.rar',
};

function escapeHtml(value = '') {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttribute(value = '') {
    return escapeHtml(value).replace(/`/g, '&#96;');
}

export function extractNewsMediaIds(markdown = '') {
    const ids = new Set();

    String(markdown || '').replace(MEDIA_TOKEN_REGEX, (_, mediaId) => {
        ids.add(mediaId);
        return _;
    });

    return [...ids];
}

export function formatNewsAuthorName(author = null, fallback = 'Пользователь') {
    if (!author) return fallback;

    const parts = [author.lastName, author.firstName, author.middleName]
        .map((value) => String(value || '').trim())
        .filter(Boolean);

    return parts.length > 0 ? parts.join(' ') : fallback;
}

export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result || '');
            resolve(result.includes('base64,') ? result.split('base64,')[1] : result);
        };
        reader.onerror = () => reject(reader.error || new Error('Не удалось прочитать файл.'));
        reader.readAsDataURL(file);
    });
}

export function getFileExtension(fileName = '') {
    const value = String(fileName || '').trim().toLowerCase();
    if (!value.includes('.')) return '';
    return value.split('.').pop() || '';
}

export function guessMimeTypeByName(fileName = '', fallback = 'application/octet-stream') {
    const extension = getFileExtension(fileName);
    return FILE_EXTENSION_MIME_MAP[extension] || fallback;
}

function guessMimeTypeByContent(base64Content = '', fallback = '') {
    const cleanBase64 = String(base64Content || '').replace(/\s/g, '');
    if (!cleanBase64) return fallback;

    if (/^PHN2Zy/i.test(cleanBase64)) return 'image/svg+xml';
    if (/^iVBORw0KGgo/i.test(cleanBase64)) return 'image/png';
    if (/^\/9j\//.test(cleanBase64)) return 'image/jpeg';
    if (/^R0lGOD/.test(cleanBase64)) return 'image/gif';
    if (/^UklGR/i.test(cleanBase64)) return 'image/webp';
    if (/^JVBERi0/i.test(cleanBase64)) return 'application/pdf';

    return fallback;
}

function guessMimeTypeByMediaType(media = null, mediaTypes = [], fallback = '') {
    const title = String(media?.title || '').toLowerCase();
    const typeTitle = String(
        mediaTypes.find((item) => item.id === media?.type)?.title || ''
    ).toLowerCase();
    const haystack = `${title} ${typeTitle}`;

    if (/svg/.test(haystack)) return 'image/svg+xml';
    if (/png/.test(haystack)) return 'image/png';
    if (/jpe?g|jpg/.test(haystack)) return 'image/jpeg';
    if (/gif/.test(haystack)) return 'image/gif';
    if (/webp/.test(haystack)) return 'image/webp';
    if (/bmp/.test(haystack)) return 'image/bmp';
    if (/mp4/.test(haystack)) return 'video/mp4';
    if (/mov/.test(haystack)) return 'video/quicktime';
    if (/webm/.test(haystack)) return 'video/webm';
    if (/avi/.test(haystack)) return 'video/x-msvideo';
    if (/mkv/.test(haystack)) return 'video/x-matroska';
    if (/mp3/.test(haystack)) return 'audio/mpeg';
    if (/wav/.test(haystack)) return 'audio/wav';
    if (/pdf/.test(haystack)) return 'application/pdf';

    return fallback;
}

export function buildDataUrl(base64Content = '', fileName = '', mimeType = '') {
    const cleanBase64 = String(base64Content || '').replace(/\s/g, '');
    if (!cleanBase64) return '';
    const resolvedMimeType = mimeType || guessMimeTypeByName(fileName);
    return `data:${resolvedMimeType};base64,${cleanBase64}`;
}

export function classifyMediaKind(media = null, mediaTypes = []) {
    const title = String(media?.title || '').toLowerCase();
    const typeTitle = String(
        mediaTypes.find((item) => item.id === media?.type)?.title || ''
    ).toLowerCase();
    const haystack = `${title} ${typeTitle}`;

    if (/image|изображ|png|jpg|jpeg|gif|webp|svg|bmp/i.test(haystack)) return 'image';
    if (/video|видео|mp4|mov|avi|webm|mkv/i.test(haystack)) return 'video';
    if (/audio|звук|mp3|wav/i.test(haystack)) return 'audio';
    return 'document';
}

export function resolveMediaTypeId(file, mediaTypes = []) {
    if (!Array.isArray(mediaTypes) || mediaTypes.length === 0) return null;

    const mimeType = String(file?.type || '').toLowerCase();
    const extension = getFileExtension(file?.name || '');

    const matchByKeywords = (keywords = []) => mediaTypes.find((item) => {
        const title = String(item?.title || '').toLowerCase();
        return keywords.some((keyword) => title.includes(keyword));
    });

    if (mimeType.startsWith('image/')) {
        return matchByKeywords(['image', 'изображ'])?.id ?? mediaTypes[0].id;
    }

    if (mimeType.startsWith('video/')) {
        return matchByKeywords(['video', 'видео'])?.id ?? mediaTypes[0].id;
    }

    if (mimeType.startsWith('audio/')) {
        return matchByKeywords(['audio', 'звук'])?.id ?? mediaTypes[0].id;
    }

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
        return matchByKeywords(['image', 'изображ'])?.id ?? mediaTypes[0].id;
    }

    if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(extension)) {
        return matchByKeywords(['video', 'видео'])?.id ?? mediaTypes[0].id;
    }

    return matchByKeywords(['document', 'документ', 'file', 'файл'])?.id ?? mediaTypes[0].id;
}

function renderMediaHtml(mediaId, mediaHtmlMap) {
    return mediaHtmlMap[mediaId] || `<span class="news-media-placeholder">media://${escapeHtml(mediaId)}</span>`;
}

function applyInlineMarkdown(text, mediaHtmlMap = {}) {
    let html = escapeHtml(text);

    html = html.replace(MEDIA_TOKEN_REGEX, (_, mediaId) => `@@MEDIA:${mediaId}@@`);
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) => (
        `<a href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`
    ));
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    html = html.replace(/\n/g, '<br />');
    html = html.replace(/@@MEDIA:([0-9a-f-]{36})@@/g, (_, mediaId) => renderMediaHtml(mediaId, mediaHtmlMap));

    return html;
}

export function renderNewsMarkdown(markdown = '', mediaHtmlMap = {}) {
    const source = String(markdown || '').replace(/\r\n/g, '\n');
    if (!source.trim()) return '<p class="news-markdown-empty">Пусто</p>';

    const lines = source.split('\n');
    const blocks = [];
    let paragraphBuffer = [];
    let listType = null;
    let listBuffer = [];
    let inCodeBlock = false;
    let codeBuffer = [];

    const flushParagraph = () => {
        if (paragraphBuffer.length === 0) return;
        blocks.push(`<p>${applyInlineMarkdown(paragraphBuffer.join('\n'), mediaHtmlMap)}</p>`);
        paragraphBuffer = [];
    };

    const flushList = () => {
        if (listBuffer.length === 0 || !listType) return;
        const items = listBuffer
            .map((item) => `<li>${applyInlineMarkdown(item, mediaHtmlMap)}</li>`)
            .join('');
        blocks.push(`<${listType}>${items}</${listType}>`);
        listBuffer = [];
        listType = null;
    };

    const flushCodeBlock = () => {
        if (!inCodeBlock) return;
        blocks.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
        codeBuffer = [];
        inCodeBlock = false;
    };

    for (const line of lines) {
        if (line.trim().startsWith('```')) {
            flushParagraph();
            flushList();
            if (inCodeBlock) {
                flushCodeBlock();
            } else {
                inCodeBlock = true;
                codeBuffer = [];
            }
            continue;
        }

        if (inCodeBlock) {
            codeBuffer.push(line);
            continue;
        }

        const trimmed = line.trim();

        if (!trimmed) {
            flushParagraph();
            flushList();
            continue;
        }

        const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
            flushParagraph();
            flushList();
            const level = headingMatch[1].length;
            blocks.push(`<h${level}>${applyInlineMarkdown(headingMatch[2], mediaHtmlMap)}</h${level}>`);
            continue;
        }

        const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
        if (bulletMatch) {
            flushParagraph();
            if (listType && listType !== 'ul') flushList();
            listType = 'ul';
            listBuffer.push(bulletMatch[1]);
            continue;
        }

        const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
        if (orderedMatch) {
            flushParagraph();
            if (listType && listType !== 'ol') flushList();
            listType = 'ol';
            listBuffer.push(orderedMatch[1]);
            continue;
        }

        const quoteMatch = trimmed.match(/^>\s?(.*)$/);
        if (quoteMatch) {
            flushParagraph();
            flushList();
            blocks.push(`<blockquote>${applyInlineMarkdown(quoteMatch[1], mediaHtmlMap)}</blockquote>`);
            continue;
        }

        paragraphBuffer.push(line);
    }

    flushParagraph();
    flushList();
    flushCodeBlock();

    return blocks.join('');
}

export function createNewsMediaHtml(media = null, mediaTypes = []) {
    if (!media?.id || !media?.content) {
        return '<span class="news-media-placeholder">Контент недоступен</span>';
    }

    const kind = classifyMediaKind(media, mediaTypes);
    const mimeType = guessMimeTypeByName(media.title, '')
        || guessMimeTypeByContent(media.content, '')
        || guessMimeTypeByMediaType(media, mediaTypes, '')
        || 'application/octet-stream';
    const dataUrl = buildDataUrl(media.content, media.title, mimeType);
    const title = escapeHtml(media.title || `media://${media.id}`);
    const downloadName = escapeAttribute(media.title || `media-${media.id}`);

    if (!dataUrl) {
        return `<span class="news-media-placeholder">${title}</span>`;
    }

    if (kind === 'image') {
        return `
            <figure class="news-media-figure">
                <img class="news-media-image" src="${dataUrl}" alt="${title}" />
                <figcaption>${title}</figcaption>
            </figure>
        `;
    }

    if (kind === 'video') {
        return `
            <figure class="news-media-figure">
                <video class="news-media-video" src="${dataUrl}" controls preload="metadata"></video>
                <figcaption>${title}</figcaption>
            </figure>
        `;
    }

    if (kind === 'audio') {
        return `
            <figure class="news-media-figure">
                <audio class="news-media-audio" src="${dataUrl}" controls preload="metadata"></audio>
                <figcaption>${title}</figcaption>
            </figure>
        `;
    }

    return `
        <a class="news-media-link" href="${dataUrl}" download="${downloadName}" target="_blank" rel="noopener noreferrer">
            <i class="pi pi-paperclip"></i>
            <span>${title}</span>
        </a>
    `;
}

export function insertAroundSelection(textarea, prefix, suffix = prefix, placeholder = 'текст') {
    const element = textarea;
    if (!element) {
        return { value: '', selectionStart: 0, selectionEnd: 0 };
    }

    const value = element.value || '';
    const selectionStart = element.selectionStart ?? value.length;
    const selectionEnd = element.selectionEnd ?? value.length;
    const hasSelection = selectionEnd > selectionStart;
    const selectedText = hasSelection ? value.slice(selectionStart, selectionEnd) : placeholder;
    const nextValue = `${value.slice(0, selectionStart)}${prefix}${selectedText}${suffix}${value.slice(selectionEnd)}`;
    const cursorStart = selectionStart + prefix.length;
    const cursorEnd = cursorStart + selectedText.length;

    return {
        value: nextValue,
        selectionStart: cursorStart,
        selectionEnd: cursorEnd,
    };
}
