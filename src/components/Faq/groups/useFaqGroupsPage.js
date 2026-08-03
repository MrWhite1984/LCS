import { computed, nextTick, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { debounce } from 'lodash';
import axiosInstance from '@/utils/axios.js';
import { getSessionUserId } from '@/utils/TokenService';
import { buildFaqEndpoint, hasFaqSuPermission } from '@/utils/faqEndpoints.js';
import { usePermissionStore } from '@/stores/permissions.js';
import { faqMocks, USE_MOCK_DATA } from '@/config/mockRuntime.js';

const ROOT_PARENT_ID = '00000000-0000-0000-0000-000000000000';

const normalizeGroups = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.groups)) return payload.groups;
    if (Array.isArray(payload.data?.groups)) return payload.data.groups;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.data?.items)) return payload.data.items;
    if (Array.isArray(payload.data)) return payload.data;
    return [];
};

const normalizeArticles = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.articles)) return payload.articles;
    if (Array.isArray(payload.data?.articles)) return payload.data.articles;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.data?.items)) return payload.data.items;
    if (Array.isArray(payload.data)) return payload.data;
    return [];
};

const mapGroupToItem = (group) => ({
    key: `group-${group.id}`,
    id: group.id,
    type: 'group',
    title: group.title || 'Без названия',
    parentId: group.parentId || null,
    authorId: group.authorId || null,
    order: typeof group.order === 'number' ? group.order : 0,
    isVisible: typeof group.isVisible === 'boolean' ? group.isVisible : true,
    expanded: false,
    loaded: false,
    children: [],
});

const buildArticlePath = (article) => {
    const rawPath = article?.path
        || article?.groupPath
        || article?.groupTitle
        || article?.group?.title
        || '';

    if (Array.isArray(rawPath)) {
        return rawPath.filter(Boolean).join(' › ');
    }

    return String(rawPath || '')
        .replace(/\s*(?:\/|>|→|›)\s*/g, ' › ')
        .replace(/\s{2,}/g, ' ')
        .trim();
};

const splitArticlePath = (path) => {
    return String(path || '')
        .split('›')
        .map((segment) => segment.trim())
        .filter(Boolean);
};

const normalizeTitle = (value) => {
    return String(value || '')
        .trim()
        .replace(/\s{2,}/g, ' ')
        .toLowerCase();
};

const mapArticleToItem = (article) => ({
    key: `article-${article.id}`,
    id: article.id,
    type: 'article',
    title: article.question || article.title || 'Без названия',
    question: article.question || article.title || 'Без названия',
    path: buildArticlePath(article),
    pathSegments: splitArticlePath(buildArticlePath(article)),
    groupId: article.groupId || null,
    authorId: article.authorId || null,
    order: typeof article.order === 'number' ? article.order : 0,
    isVisible: typeof article.isVisible === 'boolean' ? article.isVisible : true,
});

const updateGroupById = (list, groupId, updater) => {
    return list.map((item) => {
        if (item.type === 'group' && item.id === groupId) {
            return updater(item);
        }
        if (item.type === 'group' && item.children?.length) {
            return { ...item, children: updateGroupById(item.children, groupId, updater) };
        }
        return item;
    });
};

const removeGroupById = (list, groupId) => {
    return list
        .filter((item) => !(item.type === 'group' && item.id === groupId))
        .map((item) => {
            if (item.type === 'group' && item.children?.length) {
                return { ...item, children: removeGroupById(item.children, groupId) };
            }
            return item;
        });
};

const findGroupById = (list, groupId) => {
    for (const item of list) {
        if (item.type === 'group' && item.id === groupId) return item;
        if (item.type === 'group' && item.children?.length) {
            const found = findGroupById(item.children, groupId);
            if (found) return found;
        }
    }
    return null;
};

const updateArticleById = (list, articleId, updater) => {
    return list.map((item) => {
        if (item.type === 'article' && item.id === articleId) {
            return updater(item);
        }
        if (item.type === 'group' && item.children?.length) {
            return { ...item, children: updateArticleById(item.children, articleId, updater) };
        }
        return item;
    });
};

export const useFaqGroupsPage = () => {
    const router = useRouter();
    const toast = useToast();
    const permissionStore = usePermissionStore();

    const currentUserId = ref(getSessionUserId() || '');
    const canManageAnyFaq = computed(() => hasFaqSuPermission(permissionStore));
    const faqEndpoint = (path) => buildFaqEndpoint(path, permissionStore);
    const items = ref([]);
    const loadingRoot = ref(false);
    const loadingGroupId = ref('');
    const searchQuery = ref('');
    const searchLoading = ref(false);
    const searchResults = ref([]);
    const error = ref('');
    const actionLoading = ref(false);
    const highlightedNodeKey = ref('');
    let highlightedNodeTimer = null;

    const groupDialog = ref({
        visible: false,
        mode: 'create',
        groupId: '',
        parentId: '',
        authorId: '',
        title: '',
        order: 0,
        isVisible: true,
    });

    const deleteDialog = ref({
        visible: false,
        group: null,
    });

    const hasSearchQuery = computed(() => Boolean(searchQuery.value.trim()));

    const searchArticles = async (partOfQuestion) => {
        const normalizedQuery = String(partOfQuestion || '').trim();

        if (!normalizedQuery) {
            searchResults.value = [];
            searchLoading.value = false;
            return;
        }

        searchLoading.value = true;

        try {
            const response = await axiosInstance.get(faqEndpoint('groups/articles/by-question-part'), {
                params: { partOfQuestion: normalizedQuery },
            });
            searchResults.value = normalizeArticles(response.data).map(mapArticleToItem);
        } catch (fetchError) {
            console.debug('Ошибка при поиске статей FAQ:', fetchError);
            searchResults.value = [];
            error.value = 'Не удалось выполнить поиск по статьям.';
        } finally {
            searchLoading.value = false;
        }
    };

    const searchArticlesDebounced = debounce((query) => {
        searchArticles(query);
    }, 350);

    const getNextGroupOrder = (parentId) => {
        const getMaxOrder = (list) => list.reduce((max, item) => {
            const order = Number(item?.order);
            if (!Number.isFinite(order)) return max;
            return Math.max(max, order);
        }, -1);

        if (parentId === ROOT_PARENT_ID) {
            const rootGroups = items.value.filter((item) => item.type === 'group');
            return getMaxOrder(rootGroups) + 1;
        }

        const parent = findGroupById(items.value, parentId);
        if (!parent?.children?.length) return 0;

        const childGroups = parent.children.filter((item) => item.type === 'group');
        return getMaxOrder(childGroups) + 1;
    };

    const fetchSubGroups = async (groupId) => {
        return await axiosInstance.get(faqEndpoint('groups'), {
            params: { parentId: groupId },
        });
    };

    const loadGroupChildren = async (groupId) => {
        loadingGroupId.value = groupId;
        error.value = '';

        try {
            const [subGroupsResponse, articlesResponse] = await Promise.allSettled([
                fetchSubGroups(groupId),
                axiosInstance.get(faqEndpoint(`groups/${groupId}/articles`)),
            ]);

            const subGroupsErrorStatus = subGroupsResponse.status === 'rejected'
                ? Number(subGroupsResponse.reason?.response?.status)
                : 0;
            const articlesErrorStatus = articlesResponse.status === 'rejected'
                ? Number(articlesResponse.reason?.response?.status)
                : 0;

            const canIgnoreSubGroupsError = subGroupsResponse.status === 'rejected' && [404, 204].includes(subGroupsErrorStatus);
            const canIgnoreArticlesError = articlesResponse.status === 'rejected' && [404, 204].includes(articlesErrorStatus);

            if ((subGroupsResponse.status === 'rejected' && !canIgnoreSubGroupsError)
                || (articlesResponse.status === 'rejected' && !canIgnoreArticlesError)) {
                throw subGroupsResponse.status === 'rejected' && !canIgnoreSubGroupsError
                    ? subGroupsResponse.reason
                    : articlesResponse.reason;
            }

            const subGroupsPayload = subGroupsResponse.status === 'fulfilled' ? subGroupsResponse.value.data : [];
            const articlesPayload = articlesResponse.status === 'fulfilled' ? articlesResponse.value.data : [];

            const subGroups = normalizeGroups(subGroupsPayload).map(mapGroupToItem);
            const articles = normalizeArticles(articlesPayload).map(mapArticleToItem);

            items.value = updateGroupById(items.value, groupId, (group) => ({
                ...group,
                loaded: true,
                expanded: true,
                children: [...subGroups, ...articles],
            }));
        } catch (fetchError) {
            console.debug('Ошибка при загрузке данных группы:', fetchError);
            error.value = 'Не удалось загрузить подгруппы или статьи.';
        } finally {
            loadingGroupId.value = '';
        }
    };

    const handleGroupToggle = async (groupId) => {
        const all = [];
        const flatten = (list) => {
            for (const item of list) {
                all.push(item);
                if (item.type === 'group' && item.children?.length) flatten(item.children);
            }
        };
        flatten(items.value);

        const target = all.find((item) => item.type === 'group' && item.id === groupId);
        if (!target) return;

        if (!target.loaded) {
            items.value = updateGroupById(items.value, groupId, (group) => ({
                ...group,
                expanded: true,
            }));
            await loadGroupChildren(groupId);
            return;
        }

        items.value = updateGroupById(items.value, groupId, (group) => ({
            ...group,
            expanded: !group.expanded,
        }));
    };

    const focusTreeNode = async (type, id) => {
        if (!id) return;

        const nodeKey = `${type}-${id}`;
        highlightedNodeKey.value = nodeKey;
        await nextTick();

        const targetNode = document.getElementById(`faq-node-${nodeKey}`);
        targetNode?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });
        targetNode?.focus({ preventScroll: true });

        if (highlightedNodeTimer) {
            clearTimeout(highlightedNodeTimer);
        }

        highlightedNodeTimer = window.setTimeout(() => {
            if (highlightedNodeKey.value === nodeKey) {
                highlightedNodeKey.value = '';
            }
        }, 1800);
    };

    const findGroupByTitle = (list, title) => {
        const normalizedTitle = normalizeTitle(title);

        return list.find((item) => {
            return item.type === 'group' && normalizeTitle(item.title) === normalizedTitle;
        }) || null;
    };

    const focusPathSegment = async (article, segmentIndex) => {
        const pathSegments = Array.isArray(article?.pathSegments) ? article.pathSegments : [];
        const visibleSegments = pathSegments.slice(0, segmentIndex + 1);

        if (!visibleSegments.length) return;

        if (!items.value.length) {
            await fetchRootGroups();
        }

        let currentLevel = items.value.filter((item) => item.type === 'group');
        let targetGroup = null;

        for (const segmentTitle of visibleSegments) {
            targetGroup = findGroupByTitle(currentLevel, segmentTitle);

            if (!targetGroup) {
                toast.add({
                    severity: 'warn',
                    summary: 'FAQ',
                    detail: `Не удалось найти раздел «${segmentTitle}» в дереве FAQ.`,
                    life: 2500,
                });
                return;
            }

            items.value = updateGroupById(items.value, targetGroup.id, (group) => ({
                ...group,
                expanded: true,
            }));

            if (!targetGroup.loaded) {
                await loadGroupChildren(targetGroup.id);
            }

            targetGroup = findGroupById(items.value, targetGroup.id);
            currentLevel = targetGroup?.children?.filter((item) => item.type === 'group') || [];
        }

        await focusTreeNode('group', targetGroup?.id);
    };

    const openArticle = (articleId) => {
        router.push(`/faq/articles/${articleId}`);
    };

    const openCreateSubgroupDialog = (group) => {
        groupDialog.value = {
            visible: true,
            mode: 'create',
            groupId: '',
            parentId: group.id,
            authorId: '',
            title: '',
            order: 0,
            isVisible: true,
        };
    };

    const openCreateRootGroupDialog = () => {
        groupDialog.value = {
            visible: true,
            mode: 'create',
            groupId: '',
            parentId: ROOT_PARENT_ID,
            authorId: '',
            title: '',
            order: 0,
            isVisible: true,
        };
    };

    const openEditGroupDialog = (group) => {
        const target = findGroupById(items.value, group.id);
        if (!target) return;
        groupDialog.value = {
            visible: true,
            mode: 'edit',
            groupId: target.id,
            parentId: target.parentId,
            authorId: target.authorId,
            title: target.title || '',
            order: typeof target.order === 'number' ? target.order : 0,
            isVisible: typeof target.isVisible === 'boolean' ? target.isVisible : true,
        };
    };

    const openDeleteDialog = (group) => {
        const target = findGroupById(items.value, group.id);
        if (!target) return;
        deleteDialog.value = {
            visible: true,
            group: target,
        };
    };

    const closeGroupDialog = () => {
        groupDialog.value.visible = false;
    };

    const closeDeleteDialog = () => {
        deleteDialog.value.visible = false;
        deleteDialog.value.group = null;
    };

    const submitGroupDialog = async () => {
        const payloadTitle = (groupDialog.value.title || '').trim();

        if (!payloadTitle) {
            error.value = 'Название группы не может быть пустым.';
            return;
        }

        actionLoading.value = true;
        error.value = '';
        try {
            if (groupDialog.value.mode === 'create') {
                if (groupDialog.value.parentId !== ROOT_PARENT_ID) {
                    const parent = findGroupById(items.value, groupDialog.value.parentId);
                    if (parent && !parent.loaded) {
                        await loadGroupChildren(groupDialog.value.parentId);
                    }
                }
                const payloadOrder = getNextGroupOrder(groupDialog.value.parentId);

                const payload = {
                    title: payloadTitle,
                    order: payloadOrder,
                };

                if (groupDialog.value.parentId !== ROOT_PARENT_ID) {
                    payload.parentId = groupDialog.value.parentId;
                }

                await axiosInstance.post('/api/faq/addgroup', payload);

                if (groupDialog.value.parentId === ROOT_PARENT_ID) {
                    await fetchRootGroups();
                } else {
                    items.value = updateGroupById(items.value, groupDialog.value.parentId, (target) => ({
                        ...target,
                        loaded: false,
                        expanded: true,
                    }));
                    await loadGroupChildren(groupDialog.value.parentId);
                }
            } else {
                const payloadOrder = Number.isFinite(Number(groupDialog.value.order)) ? Number(groupDialog.value.order) : 0;
                await axiosInstance.put(faqEndpoint(`groups/${groupDialog.value.groupId}`), {
                    parentId: groupDialog.value.parentId,
                    authorId: groupDialog.value.authorId,
                    title: payloadTitle,
                    order: payloadOrder,
                    isVisible: Boolean(groupDialog.value.isVisible),
                });
                items.value = updateGroupById(items.value, groupDialog.value.groupId, (item) => ({
                    ...item,
                    title: payloadTitle,
                    order: payloadOrder,
                    isVisible: Boolean(groupDialog.value.isVisible),
                }));
            }
            closeGroupDialog();
        } catch (actionError) {
            console.debug('Ошибка при сохранении группы:', actionError);
            error.value = groupDialog.value.mode === 'create' ? 'Не удалось создать подгруппу.' : 'Не удалось обновить группу.';
        } finally {
            actionLoading.value = false;
        }
    };

    const confirmDeleteGroup = async () => {
        if (!deleteDialog.value.group?.id) return;
        actionLoading.value = true;
        error.value = '';
        try {
            await axiosInstance.delete(faqEndpoint(`groups/${deleteDialog.value.group.id}`));
            items.value = removeGroupById(items.value, deleteDialog.value.group.id);
            closeDeleteDialog();
        } catch (actionError) {
            console.debug('Ошибка при удалении группы:', actionError);
            error.value = 'Не удалось удалить группу.';
        } finally {
            actionLoading.value = false;
        }
    };

    const handleGroupAction = async ({ action, group }) => {
        if (!group?.id) return;

        if (action === 'create-article') {
            router.push({
                path: '/faq/articles/create',
                query: {
                    groupId: group.id,
                    groupTitle: group.title || '',
                },
            });
            return;
        }

        if (action === 'create-subgroup') {
            openCreateSubgroupDialog(group);
            return;
        }

        if (action === 'edit-group') {
            openEditGroupDialog(group);
            return;
        }

        if (action === 'delete-group') {
            openDeleteDialog(group);
            return;
        }

        if (action === 'toggle-group-visibility') {
            actionLoading.value = true;
            error.value = '';
            try {
                const nextVisible = !Boolean(group.isVisible);
                await axiosInstance.put(faqEndpoint(`groups/${group.id}`), {
                    parentId: group.parentId,
                    authorId: group.authorId,
                    title: group.title,
                    order: typeof group.order === 'number' ? group.order : 0,
                    isVisible: nextVisible,
                });
                items.value = updateGroupById(items.value, group.id, (item) => ({
                    ...item,
                    isVisible: nextVisible,
                }));
                toast.add({
                    severity: 'success',
                    summary: 'FAQ',
                    detail: nextVisible ? 'Группа теперь видима' : 'Группа скрыта',
                    life: 2200,
                });
            } catch (actionError) {
                console.debug('Ошибка при изменении видимости группы:', actionError);
                error.value = 'Не удалось изменить видимость группы.';
            } finally {
                actionLoading.value = false;
            }
            return;
        }

        if (action === 'toggle-article-visibility') {
            actionLoading.value = true;
            error.value = '';
            try {
                const nextVisible = !Boolean(group.isVisible);
                await axiosInstance.put(faqEndpoint(`articles/${group.id}`), {
                    groupId: group.groupId,
                    authorId: group.authorId,
                    question: group.question || group.title,
                    order: typeof group.order === 'number' ? group.order : 0,
                    isVisible: nextVisible,
                });
                items.value = updateArticleById(items.value, group.id, (item) => ({
                    ...item,
                    isVisible: nextVisible,
                }));
                toast.add({
                    severity: 'success',
                    summary: 'FAQ',
                    detail: nextVisible ? 'Статья теперь видима' : 'Статья скрыта',
                    life: 2200,
                });
            } catch (actionError) {
                console.debug('Ошибка при изменении видимости статьи:', actionError);
                error.value = 'Не удалось изменить видимость статьи.';
            } finally {
                actionLoading.value = false;
            }
            return;
        }
    };

    const fetchRootGroups = async () => {
        loadingRoot.value = true;
        error.value = '';
        try {
            if (USE_MOCK_DATA) {
                items.value = normalizeGroups(faqMocks.rootGroups).map(mapGroupToItem);
                return;
            }

            const response = await axiosInstance.get(faqEndpoint('groups'));
            items.value = normalizeGroups(response.data).map(mapGroupToItem);
        } catch (fetchError) {
            console.debug('Ошибка при загрузке корневых групп:', fetchError);
            error.value = 'Не удалось загрузить группы.';
        } finally {
            loadingRoot.value = false;
        }
    };

    fetchRootGroups();

    watch(searchQuery, (value) => {
        if (!value.trim()) {
            searchArticlesDebounced.cancel();
            searchLoading.value = false;
            searchResults.value = [];
            return;
        }

        searchArticlesDebounced(value);
    });

    watch(error, (message) => {
        if (!message) return;
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: message,
            life: 3500,
        });
        error.value = '';
    });

    return {
        ROOT_PARENT_ID,
        currentUserId,
        canManageAnyFaq,
        items,
        loadingRoot,
        loadingGroupId,
        searchQuery,
        hasSearchQuery,
        searchLoading,
        searchResults,
        highlightedNodeKey,
        error,
        actionLoading,
        groupDialog,
        deleteDialog,
        fetchRootGroups,
        openCreateRootGroupDialog,
        handleGroupToggle,
        focusPathSegment,
        openArticle,
        handleGroupAction,
        closeGroupDialog,
        submitGroupDialog,
        closeDeleteDialog,
        confirmDeleteGroup,
    };
};
