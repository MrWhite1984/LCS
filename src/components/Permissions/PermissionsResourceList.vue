<template>
    <Transition name="content-fade" mode="out-in">
        <div v-if="loading" key="permissions-skeleton" class="permissions-skeleton">
            <div v-for="idx in skeletonSections" :key="idx" class="mt-4">
                <Skeleton :width="skeletonTitleWidth" height="1.5rem" class="mb-2 skeleton-title" />
                <Skeleton :width="skeletonDescriptionWidth" height="1rem" class="mb-3 skeleton-description" />
                <div :class="['row', gridClass]">
                    <div class="col-auto" v-for="permIdx in skeletonItems" :key="permIdx">
                        <div class="permission-item permission-skeleton-item h-100">
                            <Skeleton width="65%" height="1.2rem" class="mb-2" />
                            <Skeleton width="100%" height="0.95rem" class="mb-2" />
                            <Skeleton width="84%" height="0.95rem" />
                        </div>
                    </div>
                </div>
                <Divider />
            </div>
        </div>
        <div v-else key="permissions-content">
            <div v-for="resource in resources" :key="resource.id || resource.title" class="w-100">
                <div class="row align-items-center">
                    <div class="col-auto pe-0">
                        <h4>{{ resource.title }}</h4>
                    </div>
                    <div class="col-auto pe-0"><Tag :value="resource.type" severity="info" class="mx-2"/></div>
                    <div class="col-auto ps-0">
                        <Tag
                            v-if="!resource.permissions.some(permission => permission.isCustomizable)"
                            value="Нет регулируемых полномочий"
                            severity="warn"
                            icon="pi pi-exclamation-triangle"
                        />
                    </div>
                </div>
                <div class="resource-info">
                    <p class="resource-description">{{ resource.description }}</p>
                </div>
                <div class="w-100">
                    <div :class="['row', gridClass]">
                        <div v-for="permission in resource.permissions" :key="permission.id" class="col">
                            <div class="permission-item h-100">
                                <div class="permission-header">
                                    <h3 class="permission-title">{{ permission.title }}</h3>
                                    <div class="d-flex align-items-center">
                                        <Button class="me-2" text style="padding: 1px;" @click="openDialog(permission.id)" severity="info">
                                            <i class="pi pi-info-circle" style="font-size: 20px;"/>
                                        </Button>
                                        <Dialog
                                            v-model:visible="infoDialogVisible[permission.id]"
                                            modal
                                            :header="permission.title"
                                            :style="{ 'min-width': '20rem', 'max-width': '40rem' }"
                                        >
                                            <p>{{ permission.description }}</p>
                                            <Tag
                                                v-if="permission.isCustomizable"
                                                value="Регулируемое"
                                                severity="success"
                                                icon="pi pi-cog"
                                            />
                                            <Tag
                                                v-else
                                                value="Не регулируемое"
                                                severity="warn"
                                                icon="pi pi-exclamation-triangle"
                                            />
                                        </Dialog>

                                        <div v-if="canToggle && permission.isCustomizable" class="d-flex">
                                            <ToggleSwitch
                                                v-model="permission.enabled"
                                                @update:model-value="onToggle(permission.id, $event)"
                                            >
                                                <template #handle>
                                                    <i
                                                        :class="['pi', { 'pi-check': permission.enabled, 'pi-times': !permission.enabled }]"
                                                        style="font-size: 8px; font-weight: 900;"
                                                    ></i>
                                                </template>
                                            </ToggleSwitch>
                                        </div>
                                        <div v-else-if="permission.enabled" class="d-flex">
                                            <Tag severity="success" icon="pi pi-lock-open" style="padding: 7px;"/>
                                        </div>
                                        <div v-else class="d-flex">
                                            <Tag severity="danger" icon="pi pi-lock" style="padding: 7px;"/>
                                        </div>
                                    </div>
                                </div>
                                <p class="permission-description">{{ permission.description }}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <Divider />
            </div>
        </div>
    </Transition>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
    resources: {
        type: Array,
        default: () => [],
    },
    loading: {
        type: Boolean,
        default: false,
    },
    canToggle: {
        type: Boolean,
        default: false,
    },
    skeletonSections: {
        type: Number,
        default: 3,
    },
    skeletonItems: {
        type: Number,
        default: 8,
    },
    skeletonTitleWidth: {
        type: String,
        default: 'min(22rem, 72%)',
    },
    skeletonDescriptionWidth: {
        type: String,
        default: 'min(42rem, 96%)',
    },
    gridClass: {
        type: String,
        default: 'row-cols-1 row-cols-md-2 row-cols-lg-3 g-3',
    },
});

const emit = defineEmits(['toggle-permission']);

const infoDialogVisible = ref({});

watch(
    () => props.resources,
    (resources) => {
        const next = {};
        resources.forEach((resource) => {
            resource.permissions?.forEach((permission) => {
                next[permission.id] = infoDialogVisible.value[permission.id] ?? false;
            });
        });
        infoDialogVisible.value = next;
    },
    { immediate: true, deep: true },
);

const openDialog = (permissionId) => {
    infoDialogVisible.value[permissionId] = true;
};

const onToggle = (permissionId, isActive) => {
    emit('toggle-permission', { permissionId, isActive });
};
</script>

<style scoped>
.resource-description {
    color: var(--p-grey-1);
}

.permission-item {
    display: flex;
    flex-direction: column;
    padding: 18px;
    border-radius: 12px;
    background: linear-gradient(
        180deg,
        rgba(var(--p-blue-500-rgb), 0.04),
        rgba(255, 255, 255, 0)
    );
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.14);
    transition: all 0.5s;
    box-sizing: border-box;
    position: relative;
}

.permission-item:hover {
    box-shadow: 0 0 0.5rem rgba(0, 0, 0, 0.3);
}

.permissions-skeleton {
    width: 100%;
}

.permissions-skeleton > div {
    width: 100%;
}

.permission-skeleton-item {
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
    background: linear-gradient(
        180deg,
        rgba(var(--p-blue-500-rgb), 0.03),
        rgba(255, 255, 255, 0)
    );
}

.permission-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 5px;
}

.permission-title {
    font-size: 1.1rem;
    font-weight: bold;
    margin: 0;
    max-width: calc(100% - 70px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.permission-description {
    font-size: 14px;
    color: var(--p-grey-1);
    margin-bottom: 8px 0 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

@media (max-width: 768px) {
    .skeleton-title {
        width: 78% !important;
    }

    .skeleton-description {
        width: 100% !important;
    }
}
</style>
