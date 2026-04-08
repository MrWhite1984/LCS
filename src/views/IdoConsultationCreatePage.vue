<template>
    <main :class="['ido-create-page', { 'ido-create-page-public': !isUserAuthenticated }]">
        <section v-if="!isUserAuthenticated" class="ido-public-hero">
            <div class="ido-public-copy">
                <div class="ido-public-copy-glow ido-public-copy-glow-top"></div>
                <div class="ido-public-copy-glow ido-public-copy-glow-bottom"></div>
                <span class="ido-public-badge">Дополнительные консультации</span>
                <h1 class="ido-public-title">Подача заявки</h1>
                <p class="ido-public-description">
                    Заполните данные заказчика, выберите преподавателя и сразу получите готовый документ.
                </p>
                <div class="ido-public-points">
                    <div class="ido-public-point">
                        <i class="pi pi-check-circle"></i>
                        <span>Форма доступна публично</span>
                    </div>
                    <div class="ido-public-point">
                        <i class="pi pi-users"></i>
                        <span>Выбор преподавателя из списка</span>
                    </div>
                    <div class="ido-public-point">
                        <i class="pi pi-file-word"></i>
                        <span>Документ формируется сразу после отправки</span>
                    </div>
                </div>
            </div>
            <div class="ido-public-side">
                <div class="ido-public-card">
                    <div class="ido-public-inline-card">
                        <div class="ido-public-card-title">Что понадобится</div>
                            <ul class="ido-public-list">
                                <li>Паспортные данные</li>
                                <li>Контактный телефон</li>
                                <li>Тема и объем консультации</li>
                            </ul>
                    </div>
                    <div class="ido-public-requisites">
                        <div class="ido-public-requisites-glow ido-public-requisites-glow-top"></div>
                        <div class="ido-public-requisites-glow ido-public-requisites-glow-bottom"></div>
                        <div class="ido-public-requisites-head">
                            <div class="ido-public-requisites-heading">
                                <span class="ido-public-requisites-badge">Реквизиты</span>
                                <div class="ido-public-requisites-title">Оплата по QR</div>
                            </div>
                            <span class="ido-public-requisites-caption">Быстрый доступ к данным для оплаты</span>
                        </div>
                        <div class="ido-public-requisites-body">
                            <div class="ido-public-qr-box" aria-hidden="true">
                                <img src="@/assets/qr.png" alt="">
                            </div>
                            <div class="ido-public-inn-box">
                                <span class="ido-public-inn-label">ИНН</span>
                                <strong class="ido-public-inn-value">5502029210</strong>
                                <span class="ido-public-inn-note">Используйте этот реквизит при оплате или сверке данных.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <div :class="['ido-form-shell', { 'ido-form-shell-public': !isUserAuthenticated }]">
            <IdoConsultationForm />
        </div>
    </main>
</template>

<script setup>
import IdoConsultationForm from '@/components/Ido/IdoConsultationForm.vue';
import { isAuthenticated } from '@/utils/auth.js';

const isUserAuthenticated = isAuthenticated();
</script>

<style scoped>
.ido-create-page {
    height: 100%;
}

.ido-create-page-public {
    min-height: 100%;
    padding: 2rem 1.25rem 2.5rem;
    background:
        radial-gradient(circle at top left, rgba(var(--p-primary-500-rgb), 0.12), transparent 28%),
        radial-gradient(circle at top right, rgba(var(--p-primary-500-rgb), 0.08), transparent 24%),
        linear-gradient(180deg, color-mix(in srgb, var(--p-primary-500) 3%, white), #ffffff 34%);
}

.ido-public-hero {
    max-width: 1180px;
    margin: 0 auto 1.25rem;
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.9fr);
    gap: 1rem;
    align-items: stretch;
}

.ido-public-copy,
.ido-public-card {
    border-radius: 28px;
    border: 1px solid rgba(var(--p-primary-500-rgb), 0.14);
    background: rgba(255, 255, 255, 0.88);
    box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
    backdrop-filter: blur(12px);
}

.ido-public-copy {
    position: relative;
    padding: 2rem;
    overflow: hidden;
}

.ido-public-copy-glow {
    position: absolute;
    border-radius: 999px;
    pointer-events: none;
    filter: blur(10px);
}

.ido-public-copy-glow-top {
    top: -54px;
    right: 42px;
    width: 170px;
    height: 170px;
    background: rgba(var(--p-primary-500-rgb), 0.08);
}

.ido-public-copy-glow-bottom {
    left: -64px;
    bottom: -72px;
    width: 220px;
    height: 220px;
    background: rgba(var(--p-primary-500-rgb), 0.06);
}

.ido-public-badge {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    padding: 0.35rem 0.8rem;
    border-radius: 999px;
    background: rgba(var(--p-primary-500-rgb), 0.1);
    color: var(--p-primary-color);
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.03em;
}

.ido-public-title {
    position: relative;
    z-index: 1;
    margin: 1rem 0 0;
    font-size: clamp(2rem, 3vw, 3rem);
    line-height: 1.05;
    letter-spacing: -0.04em;
    color: #0f172a;
}

.ido-public-description {
    position: relative;
    z-index: 1;
    margin: 1rem 0 0;
    max-width: 58ch;
    font-size: 1.03rem;
    line-height: 1.7;
    color: #334155;
}

.ido-public-inline-card {
    position: relative;
    z-index: 1;
    margin-top: 1.35rem;
    padding: 1.15rem 1.2rem;
    border-radius: 24px;
    border: 1px solid rgba(var(--p-primary-500-rgb), 0.14);
    background:
        linear-gradient(145deg, rgba(var(--p-primary-500-rgb), 0.1), rgba(255, 255, 255, 0.9)),
        #ffffff;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.86),
        0 12px 26px rgba(15, 23, 42, 0.05);
}

.ido-public-points {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 0.85rem;
    margin-top: 1.5rem;
}

.ido-public-point {
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
    padding: 1rem 1.05rem;
    border-radius: 20px;
    border: 1px solid rgba(var(--p-primary-500-rgb), 0.08);
    background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(var(--p-primary-500-rgb), 0.05)),
        #ffffff;
    color: #1e293b;
    font-weight: 600;
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.04);
}

.ido-public-point .pi {
    margin-top: 0.15rem;
    color: var(--p-primary-color);
}

.ido-public-side {
    display: flex;
}

.ido-public-card {
    width: 100%;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
}

.ido-public-card-title {
    font-size: 1rem;
    font-weight: 700;
    color: #0f172a;
}

.ido-public-list {
    margin: 1rem 0 0;
    padding-left: 1.2rem;
    color: #475569;
    line-height: 1.8;
}

.ido-public-requisites {
    position: relative;
    padding: 1rem;
    border-radius: 22px;
    border: 1px solid rgba(var(--p-primary-500-rgb), 0.14);
    background:
        linear-gradient(160deg, rgba(var(--p-primary-500-rgb), 0.16), rgba(255, 255, 255, 0.96) 42%, rgba(var(--p-primary-500-rgb), 0.05)),
        #ffffff;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.78),
        0 18px 36px rgba(15, 23, 42, 0.08);
    width: 100%;
    overflow: hidden;
}

.ido-public-requisites-glow {
    position: absolute;
    border-radius: 999px;
    pointer-events: none;
    filter: blur(8px);
}

.ido-public-requisites-glow-top {
    top: -32px;
    right: -18px;
    width: 140px;
    height: 140px;
    background: rgba(var(--p-primary-500-rgb), 0.14);
}

.ido-public-requisites-glow-bottom {
    left: -36px;
    bottom: -54px;
    width: 160px;
    height: 160px;
    background: rgba(var(--p-primary-500-rgb), 0.08);
}

.ido-public-requisites-head {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.ido-public-requisites-heading {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
}

.ido-public-requisites-badge {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0.2rem 0.7rem;
    border-radius: 999px;
    background: rgba(var(--p-primary-500-rgb), 0.12);
    color: #0f172a;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.ido-public-requisites-title {
    color: #0f172a;
    font-size: 1.15rem;
    font-weight: 800;
    letter-spacing: -0.02em;
}

.ido-public-requisites-caption {
    max-width: 18ch;
    color: #64748b;
    font-size: 0.84rem;
    line-height: 1.45;
    text-align: right;
}

.ido-public-requisites-body {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 132px minmax(0, 1fr);
    gap: 1rem;
    margin-top: 1.15rem;
    align-items: center;
}

.ido-public-qr-box {
    position: relative;
    aspect-ratio: 1;
    padding: 0.55rem;
    border-radius: 24px;
    border: 1px solid rgba(var(--p-primary-500-rgb), 0.16);
    background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(var(--p-primary-500-rgb), 0.05)),
        #ffffff;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.8),
        0 12px 28px rgba(15, 23, 42, 0.08);
    overflow: hidden;
}

.ido-public-qr-box img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #ffffff;
}

.ido-public-inn-box {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
}

.ido-public-inn-label {
    color: #64748b;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.ido-public-inn-value {
    display: inline-flex;
    align-items: center;
    min-height: 52px;
    padding: 0.9rem 1rem;
    border-radius: 18px;
    border: 1px solid rgba(var(--p-primary-500-rgb), 0.16);
    background: rgba(255, 255, 255, 0.82);
    color: #0f172a;
    font-size: 1.05rem;
    letter-spacing: 0.08em;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.ido-public-inn-note {
    color: #64748b;
    font-size: 0.88rem;
    line-height: 1.5;
}

.ido-form-shell {
    height: 100%;
}

.ido-form-shell-public {
    max-width: 1180px;
    margin: 0 auto;
    border-radius: 32px;
    border: 1px solid rgba(var(--p-primary-500-rgb), 0.12);
    background: rgba(255, 255, 255, 0.84);
    box-shadow: 0 22px 60px rgba(15, 23, 42, 0.09);
    backdrop-filter: blur(12px);
    overflow: hidden;
}

@media (max-width: 992px) {
    .ido-public-hero {
        grid-template-columns: 1fr;
    }

    .ido-public-points {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .ido-create-page-public {
        padding: 1rem 0.75rem 1.5rem;
    }

    .ido-public-copy,
    .ido-public-card {
        border-radius: 22px;
    }

    .ido-public-copy {
        padding: 1.4rem;
    }

    .ido-public-requisites-body {
        grid-template-columns: 1fr;
    }

    .ido-public-qr-box {
        max-width: 180px;
    }

    .ido-form-shell-public {
        border-radius: 24px;
    }
}
</style>
