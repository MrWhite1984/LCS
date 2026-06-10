<template>
    <main>
        <div class="service-card analytics-card" @click="openAnalytics">
            <div class="service-card-top">
                <div class="service-icon-wrap">
                    <i class="pi pi-chart-line"></i>
                </div>
                <span class="service-badge">Прогноз</span>
            </div>
            <div class="service-card-body">
                <h3>Аналитика студентов</h3>
                <p>Академические риски, активность и рекомендации кураторам.</p>
            </div>
            <div class="service-card-footer">
                <span>Открыть аналитику</span>
                <i class="pi pi-arrow-right"></i>
            </div>
        </div>
    </main>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const openAnalytics = () => {
    router.push('/services/ml-analytics');
};
</script>

<style scoped>
main {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
}

.service-card {
    position: relative;
    min-height: 178px;
    padding: 1.1rem;
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    overflow: hidden;
    color: var(--p-text-color);
    background:
        linear-gradient(145deg, rgba(34, 197, 94, 0.13), transparent 46%),
        var(--p-bg-color-1);
    border: 1px solid color-mix(in srgb, #22c55e 24%, var(--p-grey-4));
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.07);
    transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.service-card::after {
    content: "";
    position: absolute;
    inset: auto -2rem -2.7rem auto;
    width: 7rem;
    height: 7rem;
    border-radius: 50%;
    background: rgba(34, 197, 94, 0.11);
    pointer-events: none;
}

.service-card:hover {
    transform: translateY(-4px);
    border-color: rgba(34, 197, 94, 0.44);
    box-shadow: 0 20px 42px rgba(15, 23, 42, 0.12);
    cursor: pointer;
}

.service-card-top,
.service-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.85rem;
    position: relative;
    z-index: 1;
}

.service-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 46px;
    border-radius: 12px;
    color: #15803d;
    background: rgba(34, 197, 94, 0.14);
}

.service-icon-wrap i {
    font-size: 1.35rem;
}

.service-badge {
    padding: 0.28rem 0.58rem;
    border-radius: 999px;
    color: #15803d;
    background: rgba(34, 197, 94, 0.12);
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
}

.service-card-body {
    position: relative;
    z-index: 1;
    margin-top: 1rem;
}

.service-card-body h3 {
    margin: 0;
    font-size: 1.25rem;
}

.service-card-body p {
    margin: 0.5rem 0 0;
    color: var(--p-text-muted-color, var(--p-grey-1));
    line-height: 1.45;
}

.service-card-footer {
    margin-top: 1rem;
    color: #15803d;
    font-size: 0.9rem;
    font-weight: 800;
}
</style>
