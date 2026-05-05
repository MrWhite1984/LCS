<script setup>
import NotificationStack from '@/components/Notifications/NotificationStack.vue';
</script>

<template>
    <main>
        <div class="content-wrap">
            <NotificationStack />
        </div>
    </main>
</template>

<style scoped>
main {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
}

.content-wrap {
    flex-grow: 1;
    padding: 20px 8rem;
    color: var(--p-text-color);
    transition: all 0.5s;
}

h2 {
    margin-bottom: 20px;
    font-size: 2rem;
    color: var(--p-text-color);
    transition: all 0.5s;
}

@media (max-width: 1024px) {
    .content-wrap {
        padding: 20px 2rem;
    }
}

@media (max-width: 640px) {
    .content-wrap {
        padding: 16px 1rem;
    }
}
</style>
