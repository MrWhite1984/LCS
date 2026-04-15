<template>
    <div class="project-placeholder">
        <div class="project-placeholder-icon">
            <i :class="icon"></i>
        </div>
        <div class="project-placeholder-copy">
            <h4>{{ title }}</h4>
            <p>{{ description }}</p>
        </div>
    </div>
</template>

<script setup>
defineProps({
    icon: {
        type: String,
        default: 'pi pi-spin pi-cog',
    },
    title: {
        type: String,
        default: 'Раздел в разработке',
    },
    description: {
        type: String,
        default: 'Этот блок появится в одном из следующих обновлений.',
    },
});
</script>

<style scoped>
.project-placeholder {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.4rem;
    border-radius: 18px;
    border: 1px dashed rgba(var(--p-blue-500-rgb), 0.24);
    background: linear-gradient(180deg, rgba(var(--p-blue-500-rgb), 0.09), rgba(var(--p-blue-500-rgb), 0.03));
}

.project-placeholder-icon {
    width: 3.5rem;
    height: 3.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 18px;
    background: rgba(var(--p-blue-500-rgb), 0.12);
    color: var(--p-primary-color);
    font-size: 1.45rem;
}

.project-placeholder-copy h4 {
    margin: 0;
}

.project-placeholder-copy p {
    margin: 0.35rem 0 0;
    color: var(--p-grey-1);
}
</style>
