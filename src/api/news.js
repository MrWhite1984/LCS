import axiosInstance from '@/utils/axios.js';

export const newsEditorResource = 'News_editor';
export const newsAdminResource = 'News_editor_su';

export const NEWS_PAGE_SIZE = 5;
export const NEWS_COMMENT_PAGE_SIZE = 10;
export const NEWS_PERMISSION_ACTIONS = ['Read', 'Create', 'Update', 'Delete'];

const NEWS_BASE = '/api/news';

export function hasNewsPermission(permissionStore, action) {
    return permissionStore.hasPermission(newsEditorResource, action) || permissionStore.hasPermission(newsAdminResource, action);
}

export function hasNewsAdminPermission(permissionStore, action) {
    return permissionStore.hasPermission(newsAdminResource, action);
}

export function canAccessNewsManagement(permissionStore) {
    return NEWS_PERMISSION_ACTIONS.some((action) => hasNewsPermission(permissionStore, action));
}

export function getVisiblePosts(params = {}) {
    return axiosInstance.get(`${NEWS_BASE}/posts`, { params });
}

export function getBookmarkedPosts(params = {}) {
    return axiosInstance.get(`${NEWS_BASE}/posts/bookmarked`, { params });
}

export function getPostsByTags(tagIds = [], params = {}) {
    return axiosInstance.post(`${NEWS_BASE}/posts/by-tags`, tagIds, { params });
}

export function getAuthorPosts(params = {}) {
    return axiosInstance.get(`${NEWS_BASE}/posts/authors`, { params });
}

export function getAuthorPostsByAuthor(authorId, params = {}) {
    return axiosInstance.get(`${NEWS_BASE}/su/posts/authors/${authorId}`, { params });
}

export function getPost(postId, options = {}) {
    const path = options.su ? `${NEWS_BASE}/su/posts/${postId}` : `${NEWS_BASE}/posts/${postId}`;
    return axiosInstance.get(path);
}

export function createPost(payload) {
    return axiosInstance.post(`${NEWS_BASE}/posts/add`, payload);
}

export function updatePost(postId, payload) {
    return axiosInstance.put(`${NEWS_BASE}/posts/${postId}`, null, {
        params: {
            title: payload?.title,
            body: payload?.body,
        },
    });
}

export function changePostVisibility(postId, isVisible, options = {}) {
    const path = options.su ? `${NEWS_BASE}/su/posts/change-visible/${postId}` : `${NEWS_BASE}/posts/change-visible/${postId}`;
    return axiosInstance.put(path, null, {
        params: { isVisible },
    });
}

export function softDeletePost(postId, options = {}) {
    const path = options.su ? `${NEWS_BASE}/su/posts/soft-delete/${postId}` : `${NEWS_BASE}/posts/soft-delete/${postId}`;
    return axiosInstance.put(path);
}

export function addMarkedPost(postId) {
    return axiosInstance.post(`${NEWS_BASE}/posts/add-marked/${postId}`);
}

export function addPostView(postId) {
    return axiosInstance.post(`${NEWS_BASE}/posts/add-view/${postId}`);
}

export function addPostReaction(postId, emojiId) {
    return axiosInstance.post(`${NEWS_BASE}/posts/add-reaction/${postId}`, null, {
        params: { emojiId },
    });
}

export function deleteReaction({ postId, commentId, emojiId }) {
    return axiosInstance.delete(`${NEWS_BASE}/reactions`, {
        params: {
            postId,
            commentId,
            emojiId,
        },
    });
}

export function addTagToPost(postId, tagId, options = {}) {
    const path = options.su ? `${NEWS_BASE}/su/posts/add-tag/${postId}` : `${NEWS_BASE}/posts/add-tag/${postId}`;
    return axiosInstance.put(path, null, {
        params: { tagId },
    });
}

export function removeTagFromPost(postId, tagId) {
    return axiosInstance.put(`${NEWS_BASE}/posts/${postId}/tags/${tagId}`);
}

export function searchTags(partOfName) {
    return axiosInstance.get(`${NEWS_BASE}/tags/get-tags-by-part-of-name`, {
        params: { partOfName },
    });
}

export function createTag(name) {
    return axiosInstance.post(`${NEWS_BASE}/tags/add`, null, {
        params: { name },
    });
}

export function renameTag(tagId, name) {
    return axiosInstance.put(`${NEWS_BASE}/tags/${tagId}`, null, {
        params: { name },
    });
}

export function deleteTag(tagId) {
    return axiosInstance.delete(`${NEWS_BASE}/tags/${tagId}`);
}

export function getEmojies() {
    return axiosInstance.get(`${NEWS_BASE}/emojies`);
}

export function createEmoji(code) {
    return axiosInstance.post(`${NEWS_BASE}/emojies`, null, {
        params: { code },
    });
}

export function deleteEmoji(emojiId) {
    return axiosInstance.delete(`${NEWS_BASE}/emojies/${emojiId}`);
}

export function getComments(postId, params = {}) {
    return axiosInstance.get(`${NEWS_BASE}/comments/${postId}`, { params });
}

export function createCommentToPost(postId, payload) {
    return axiosInstance.post(`${NEWS_BASE}/comments/add-to-post/${postId}`, payload);
}

export function createCommentToComment(postId, payload) {
    return axiosInstance.post(`${NEWS_BASE}/comments/add-to-comment/${postId}`, payload);
}

export function updateComment(commentId, body) {
    return axiosInstance.put(`${NEWS_BASE}/comments/${commentId}`, null, {
        params: { body },
    });
}

export function softDeleteComment(commentId, options = {}) {
    const path = options.su ? `${NEWS_BASE}/su/comments/soft-delete/${commentId}` : `${NEWS_BASE}/comments/soft-delete/${commentId}`;
    return axiosInstance.put(path);
}

export function addCommentReaction(commentId, emojiId) {
    return axiosInstance.post(`${NEWS_BASE}/comments/add-reaction/${commentId}`, null, {
        params: { emojiId },
    });
}

export function uploadMedia(payload) {
    return axiosInstance.post(`${NEWS_BASE}/media`, payload);
}

export function getMedia(mediaId) {
    return axiosInstance.get(`${NEWS_BASE}/media/${mediaId}`);
}

export function deleteMedia(mediaId) {
    return axiosInstance.delete(`${NEWS_BASE}/media/${mediaId}`);
}

export function getMediaTypes() {
    return axiosInstance.get(`${NEWS_BASE}/media/types`);
}

const normalizeAuthor = (author = null) => ({
    id: author?.id || null,
    firstName: author?.firstName || '',
    lastName: author?.lastName || '',
    middleName: author?.middleName || '',
});

const normalizeTag = (tag = null) => ({
    id: tag?.id ?? null,
    name: tag?.name || '',
});

const normalizeEmoji = (emoji = null) => ({
    id: emoji?.id ?? null,
    code: emoji?.code || '',
});

const normalizeEmojiReaction = (reaction = null) => ({
    emoji: normalizeEmoji(reaction?.emoji),
    count: Number(reaction?.count || 0),
    isUserReact: Boolean(reaction?.isUserReact),
});

export function normalizePost(post = null) {
    return {
        id: post?.id || null,
        title: post?.title || '',
        body: post?.body || '',
        author: normalizeAuthor(post?.author),
        createdAt: post?.createdAt || null,
        isVisible: Boolean(post?.isVisible),
        emojiReactions: Array.isArray(post?.emojiReactions) ? post.emojiReactions.map(normalizeEmojiReaction) : [],
        tags: Array.isArray(post?.tags) ? post.tags.map(normalizeTag) : [],
        viewsCount: Number(post?.viewsCount || 0),
        isUserViewed: Boolean(post?.isUserViewed),
        isMarked: Boolean(post?.isMarked),
    };
}

export function normalizeComment(comment = null) {
    return {
        id: comment?.id || null,
        body: comment?.body || '',
        author: normalizeAuthor(comment?.author),
        createdAt: comment?.createdAt || null,
        isSoftDeleted: Boolean(comment?.isSoftDeleted),
        hasChildren: Boolean(comment?.hasChildren),
        emojiReactions: Array.isArray(comment?.emojiReactions) ? comment.emojiReactions.map(normalizeEmojiReaction) : [],
    };
}

export function normalizeMedia(media = null) {
    return {
        id: media?.id || null,
        title: media?.title || '',
        type: media?.type ?? null,
        content: media?.content || '',
    };
}

export function normalizeMediaType(type = null) {
    return {
        id: type?.id ?? null,
        title: type?.title || '',
    };
}

export function normalizePostsResponse(payload = {}) {
    return {
        posts: Array.isArray(payload?.posts) ? payload.posts.map(normalizePost) : [],
        pageCount: Number(payload?.pageCount || 0),
    };
}

export function normalizeCommentsResponse(payload = {}) {
    return {
        comments: Array.isArray(payload?.comments) ? payload.comments.map(normalizeComment) : [],
        pageCount: Number(payload?.pageCount || 0),
    };
}

export function normalizeMediaResponse(payload = {}) {
    return {
        media: normalizeMedia(payload?.media),
    };
}
