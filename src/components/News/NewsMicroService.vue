<template>
    <main>
        <div class="card h-100" @click="openNews">
            <div class="row">
                <div class="col">
                    <div class="card-body">
                        <div class="row mb-1 align-items-center justify-content-between">
                            <div class="col-auto">
                                <div class="header">
                                    <h3>NewsService</h3>
                                    <h5 class="card-text">Управление новостной лентой и редакционным контуром</h5>
                                </div>
                            </div>
                            <div class="col-auto">
                                <i class="pi pi-megaphone service-icon"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

function openNews() {
    router.push('/news/manage');
}
</script>

<style scoped>
main {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
}

.card {
    border-radius: 12px;
    transition: all 0.5s;
    background-color: var(--p-grey-7);
    color: var(--p-text-color);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    border: 2px solid transparent;
}

.card:hover {
    border: 2px solid var(--p-blue-500);
    background-color: var(--p-blue-500-low-op);
    color: rgb(var(--p-color-icon-menu));
    cursor: pointer;
}

.card-text {
    font-size: 1.15rem;
    font-family: 'SF Pro Rounded', sans-serif;
    color: var(--p-grey-1);
    margin-top: 10px;
    max-width: 28rem;
}

.card-body {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}

.service-icon {
    font-size: 1.6rem;
    color: rgba(var(--p-blue-500-rgb), 0.75);
}
</style>

