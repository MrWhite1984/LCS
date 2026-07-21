<template>
    <main class="auth-page">
        <div class="login-page">
            <div class="logoUp"></div>

            <section class="auth-shell">
                <div class="auth-panel auth-panel--form">
                    <div class="auth-form-stack">
                        <div class="login-box">
                            <div class="brand">
                                <span class="brand-kicker">Личный кабинет СибАДИ</span>
                                <h1>Вход в ЛКС</h1>
                            </div>

                            <Button
                                class="sso-button"
                                icon="pi pi-users"
                                label="Система единого входа"
                                outlined
                                @click="ssoLogin"
                                :loading="ssoLoading"
                            />
                            <Button
                                class="guide-button"
                                icon="pi pi-question-circle"
                                label="Как войти в систему?"
                                text
                                @click="openLoginGuide"
                            />
                            <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
                        </div>

                        <div class="theme-switcher-wrap">
                            <ThemeSwitcher auth-inline />
                        </div>
                    </div>
                </div>

                <div class="auth-panel auth-panel--showcase">
                    <div class="showcase-frame">
                        <Transition name="showcase-fade" mode="out-in">
                            <div
                                :key="activeSlide.id"
                                class="showcase-slide"
                                :style="{ backgroundImage: `url(${activeSlide.image})` }"
                            />
                        </Transition>

                        <div class="showcase-overlay"></div>

                        <div class="showcase-content">
                            <div class="showcase-copy">
                                <span class="showcase-pill">Дороги начинаются здесь!</span>
                                <span class="showcase-label">Сибирский государственный автомобильно-дорожный университет</span>
                                <h2>Приветствуем вас в СибАДИ</h2>
                                <p>
                                    Приветствуем вас в СибАДИ - месте, где рождаются инженерные решения будущего!
                                    Здесь вы получите прочные знания, опыт и поддержку на пути к успешной карьере
                                    в сфере транспорта и строительства. Вперёд к новым достижениям!
                                </p>
                            </div>

                            <div class="showcase-card">
                                <div>
                                    <strong>Дороги начинаются здесь!</strong>
                                    <p>
                                        Учитесь, проектируйте и создавайте инфраструктуру, которая меняет города и регионы.
                                    </p>
                                </div>

                                <div class="showcase-meta">
                                    <span class="showcase-counter">{{ activeSlideNumber }}</span>
                                    <div class="showcase-dots" aria-label="Индикатор слайдера">
                                        <button
                                            v-for="(slide, index) in slides"
                                            :key="slide.id"
                                            type="button"
                                            class="showcase-dot"
                                            :class="{ 'is-active': index === activeSlideIndex }"
                                            :aria-label="`Перейти к слайду ${index + 1}`"
                                            @click="setActiveSlide(index)"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import { saveAuthData, startTokenWorker } from '@/utils/TokenService';
import axiosInstance from '@/utils/axios.js';
import { playSplashAndNavigate } from '@/composables/splashTransition';
import ThemeSwitcher from '@/components/Utils/ThemeSwitcher.vue';
import slide1 from '@/assets/backgrounds/slide1.webp';
import slide2 from '@/assets/backgrounds/slide2.webp';
import slide3 from '@/assets/backgrounds/slide3.webp';
import slide4 from '@/assets/backgrounds/slide4.webp';
import slide5 from '@/assets/backgrounds/slide5.webp';
import slide6 from '@/assets/backgrounds/slide6.webp';

const errorMessage = ref('');
const toast = useToast();
const router = useRouter();

const ssoLoading = ref(false);

const slides = [
    { id: 'slide-1', image: slide1 },
    { id: 'slide-2', image: slide2 },
    { id: 'slide-3', image: slide3 },
    { id: 'slide-4', image: slide4 },
    { id: 'slide-5', image: slide5 },
    { id: 'slide-6', image: slide6 },
];

const activeSlideIndex = ref(0);
const activeSlide = computed(() => slides[activeSlideIndex.value]);
const activeSlideNumber = computed(() => `${String(activeSlideIndex.value + 1).padStart(2, '0')}/${String(slides.length).padStart(2, '0')}`);

let sliderIntervalId = null;

const stopSlider = () => {
    if (typeof window === 'undefined' || sliderIntervalId === null) return;
    window.clearInterval(sliderIntervalId);
    sliderIntervalId = null;
};

const startSlider = () => {
    if (typeof window === 'undefined') return;
    stopSlider();
    sliderIntervalId = window.setInterval(() => {
        activeSlideIndex.value = (activeSlideIndex.value + 1) % slides.length;
    }, 5000);
};

const setActiveSlide = (index) => {
    activeSlideIndex.value = index;
    startSlider();
};

const generateCodeVerifier = () => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomValues = new Uint8Array(64);
    window.crypto.getRandomValues(randomValues);

    let result = '';
    for (let i = 0; i < randomValues.length; i++) {
        result += charset[randomValues[i] % charset.length];
    }

    return result;
};

const openLoginGuide = () => {
    const url = router.resolve({ name: 'LoginGuide' }).href;
    window.open(url, '_blank', 'noopener');
};

const ssoLogin = async () => {
    ssoLoading.value = true;
    errorMessage.value = '';

    try {
        const codeVerifier = generateCodeVerifier();

        const response = await axiosInstance.post('/api/auth/sso/redirection', codeVerifier);

        if (response.data) {
            sessionStorage.setItem('codeVerifier', codeVerifier);
            window.location.href = response.data;
        } else {
            throw new Error('Не удалось получить URL для SSO авторизации');
        }
    } catch (error) {
        console.error('SSO login error:', error);
        errorMessage.value = 'Ошибка при подключении к системе единого входа';
        toast.add({
            severity: 'error',
            summary: 'Ошибка SSO',
            detail: 'Не удалось подключиться к системе единого входа',
            life: 5000,
        });
    } finally {
        ssoLoading.value = false;
    }
};

onMounted(() => {
    startSlider();

    if (sessionStorage.getItem('loggedOut') === '1') {
        sessionStorage.removeItem('loggedOut');
        toast.add({
            severity: 'success',
            summary: 'Выход выполнен',
            detail: 'Вы вышли из аккаунта',
            life: 3000,
        });
    }
});

onBeforeUnmount(() => {
    stopSlider();
});
</script>

<style scoped>
.auth-page {
    margin: 0;
    padding: 0;
}

.login-page {
    --auth-surface: rgba(255, 255, 255, 0.8);
    --auth-surface-border: rgba(255, 255, 255, 0.55);
    --auth-shadow: 0 32px 80px rgba(24, 42, 74, 0.14);
    --showcase-shadow: 0 32px 72px rgba(12, 18, 31, 0.26);
    --showcase-text-color: #ffffff;
    --showcase-muted-color: rgba(255, 255, 255, 0.82);
    --showcase-soft-color: rgba(255, 255, 255, 0.68);
    --showcase-pill-bg: rgba(255, 255, 255, 0.78);
    --showcase-pill-border: rgba(255, 255, 255, 0.86);
    --showcase-pill-color: #12263f;
    --showcase-card-bg: rgba(255, 255, 255, 0.78);
    --showcase-card-border: rgba(255, 255, 255, 0.88);
    --showcase-card-text: #10233c;
    --showcase-card-muted: rgba(16, 35, 60, 0.72);
    --showcase-dot-bg: var(--p-grey-1);
    --showcase-dot-active: var(--p-text-color);
    --showcase-counter-color: var(--p-text-color);
    --showcase-overlay:
        linear-gradient(180deg, rgba(8, 14, 24, 0.04) 0%, rgba(8, 14, 24, 0.22) 24%, rgba(8, 14, 24, 0.54) 100%),
        linear-gradient(120deg, rgba(7, 16, 29, 0.42) 0%, rgba(7, 16, 29, 0.14) 42%, rgba(7, 16, 29, 0.48) 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100dvh;
    width: 100vw;
    position: relative;
    overflow: hidden;
    background:
        radial-gradient(circle at top left, rgba(36, 92, 171, 0.16), transparent 32%),
        radial-gradient(circle at bottom right, rgba(75, 151, 255, 0.18), transparent 28%),
        linear-gradient(135deg, #f6f9ff 0%, #eef3fb 46%, #e3edf8 100%);
}

.p-dark .login-page {
    --auth-surface: rgba(13, 20, 35, 0.82);
    --auth-surface-border: rgba(124, 146, 186, 0.18);
    --auth-shadow: 0 34px 86px rgba(3, 8, 18, 0.4);
    --showcase-shadow: 0 32px 72px rgba(0, 0, 0, 0.44);
    --showcase-text-color: #ffffff;
    --showcase-muted-color: rgba(255, 255, 255, 0.82);
    --showcase-soft-color: rgba(255, 255, 255, 0.62);
    --showcase-pill-bg: rgba(255, 255, 255, 0.14);
    --showcase-pill-border: rgba(255, 255, 255, 0.22);
    --showcase-pill-color: #ffffff;
    --showcase-card-bg: rgba(10, 16, 27, 0.56);
    --showcase-card-border: rgba(255, 255, 255, 0.12);
    --showcase-card-text: #ffffff;
    --showcase-card-muted: rgba(255, 255, 255, 0.78);
    --showcase-dot-bg: rgba(255, 255, 255, 0.28);
    --showcase-dot-active: #ffffff;
    --showcase-counter-color: rgba(255, 255, 255, 0.76);
    --showcase-overlay:
        linear-gradient(180deg, rgba(6, 11, 20, 0.08) 0%, rgba(6, 11, 20, 0.28) 22%, rgba(6, 11, 20, 0.76) 100%),
        linear-gradient(120deg, rgba(4, 10, 19, 0.7) 0%, rgba(8, 13, 24, 0.32) 46%, rgba(6, 12, 21, 0.8) 100%);
    background:
        radial-gradient(circle at top left, rgba(53, 116, 215, 0.18), transparent 28%),
        radial-gradient(circle at bottom right, rgba(49, 99, 184, 0.14), transparent 30%),
        linear-gradient(145deg, #09111d 0%, #0d1626 54%, #122238 100%);
}

.logoUp {
    position: absolute;
    top: 32px;
    left: 32px;
    width: 360px;
    height: 42px;
    background-color: var(--p-text-color);
    -webkit-mask-image: url('/src/assets/logo/logoUp.svg');
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-size: contain;
    -webkit-mask-position: left center;
    mask-image: url('/src/assets/logo/logoUp.svg');
    mask-repeat: no-repeat;
    mask-size: contain;
    mask-position: left center;
    z-index: 3;
    transition: background-color 0.35s ease;
    animation: authFadeDown 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.auth-shell {
    position: relative;
    z-index: 1;
    width: min(1360px, calc(100vw - 64px));
    min-height: min(820px, calc(100dvh - 72px));
    display: grid;
    grid-template-columns: minmax(360px, 460px) minmax(420px, 1fr);
    gap: 28px;
    align-items: stretch;
}

.auth-panel {
    min-width: 0;
}

.auth-panel--form {
    display: flex;
    align-items: center;
    justify-content: center;
}

.auth-form-stack {
    width: min(100%, 420px);
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    animation: authFadeUp 0.72s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.login-box {
    width: 100%;
    padding: 2.5rem;
    border-radius: 30px;
    border: 1px solid var(--auth-surface-border);
    background: var(--auth-surface);
    box-shadow: var(--auth-shadow);
    backdrop-filter: blur(18px);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.brand {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.login-box > *,
.theme-switcher-wrap,
.showcase-copy > *,
.showcase-card {
    opacity: 0;
    animation: authFadeUp 0.72s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.login-box > :nth-child(1) {
    animation-delay: 0.08s;
}

.login-box > :nth-child(2) {
    animation-delay: 0.16s;
}

.login-box > :nth-child(3) {
    animation-delay: 0.24s;
}

.theme-switcher-wrap {
    animation-delay: 0.34s;
}

.brand-kicker {
    font-size: 0.88rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--p-blue-400);
}

.brand h1 {
    margin: 0;
    color: var(--p-text-color);
    font-size: clamp(2.25rem, 3vw, 3.4rem);
    line-height: 0.95;
    font-weight: 900;
}

.brand-description {
    margin: 0;
    color: var(--p-text-muted-color);
    font-size: 1rem;
    line-height: 1.6;
}

.sso-button,
.submit-button {
    width: 100%;
    min-height: 54px;
    border-radius: 16px;
    font-size: 1.05rem;
    font-weight: 700;
}

.sso-button {
    color: var(--p-blue-400);
    border-color: color-mix(in srgb, var(--p-blue-400) 50%, transparent);
    background: rgba(255, 255, 255, 0.45);
}

.p-dark .sso-button {
    background: rgba(17, 26, 42, 0.58);
}

.sso-button:hover {
    background: var(--p-blue-400) !important;
    color: #fff !important;
}

.guide-button {
    width: 100%;
    justify-content: center;
    color: var(--p-text-muted-color);
    font-weight: 600;
}

.guide-button:hover {
    color: var(--p-blue-400);
}

.divider {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 22px;
    color: var(--p-text-muted-color);
    font-size: 0.92rem;
}

.divider::before {
    content: '';
    position: absolute;
    inset: 50% 0 auto;
    border-top: 1px solid color-mix(in srgb, var(--p-text-muted-color) 20%, transparent);
}

.divider span {
    position: relative;
    z-index: 1;
    padding: 0 0.85rem;
    background: var(--auth-surface);
}

.login-form {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
}

.field-label {
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--p-text-color);
}

.field-group {
    width: 100%;
}

.field-group :deep(.p-inputgroupaddon) {
    border-radius: 12px 0 0 12px;
    border-color: rgba(133, 153, 183, 0.28);
    background: rgba(255, 255, 255, 0.78);
    color: var(--p-text-muted-color);
}

.field-group :deep(.p-inputtext),
.field-group :deep(.p-password-input) {
    min-height: 54px;
    border-radius: 0 12px 12px 0 !important;
    border-color: rgba(133, 153, 183, 0.28);
    background: rgba(255, 255, 255, 0.78);
}

.p-dark .field-group :deep(.p-inputgroupaddon),
.p-dark .field-group :deep(.p-inputtext),
.p-dark .field-group :deep(.p-password-input) {
    background: rgba(17, 26, 42, 0.72);
}

.field-group :deep(.p-password) {
    width: 100%;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 0.25rem;
}

.forgot-password {
    padding-inline: 0;
    color: var(--p-text-muted-color);
}

.submit-button {
    margin-top: 0.4rem;
    box-shadow: 0 16px 30px rgba(17, 51, 89, 0.24);
}

.error-message {
    margin: 0.15rem 0 0;
    color: var(--p-red-500);
    font-size: 0.92rem;
    line-height: 1.4;
    text-align: center;
}

.theme-switcher-wrap {
    width: 100%;
}

.auth-panel--showcase {
    display: flex;
    align-items: stretch;
    justify-content: stretch;
}

.showcase-frame {
    position: relative;
    width: 100%;
    min-height: 100%;
    overflow: hidden;
    border-radius: 34px;
    box-shadow: var(--showcase-shadow);
    background: #09111d;
    isolation: isolate;
    transition: box-shadow 0.45s ease, background-color 0.45s ease;
    animation: authReveal 0.95s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: 0.14s;
}

.showcase-slide,
.showcase-overlay {
    position: absolute;
    inset: 0;
}

.showcase-slide {
    background-size: cover;
    background-position: center;
    transform: scale(1.02);
}

.showcase-overlay {
    background: var(--showcase-overlay);
    transition: background 0.55s ease;
}

.showcase-content {
    position: relative;
    z-index: 1;
    height: 100%;
    min-height: min(820px, calc(100dvh - 72px));
    padding: 2.25rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 1.5rem;
    color: var(--showcase-text-color);
    transition: color 0.45s ease;
}

.showcase-copy {
    max-width: 640px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.showcase-copy > :nth-child(1) {
    animation-delay: 0.28s;
}

.showcase-copy > :nth-child(2) {
    animation-delay: 0.36s;
}

.showcase-copy > :nth-child(3) {
    animation-delay: 0.44s;
}

.showcase-copy > :nth-child(4) {
    animation-delay: 0.52s;
}

.showcase-pill {
    align-self: flex-start;
    padding: 0.55rem 1rem;
    border-radius: 999px;
    background: var(--showcase-pill-bg);
    border: 1px solid var(--showcase-pill-border);
    backdrop-filter: blur(10px);
    font-size: 0.88rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--showcase-pill-color);
    transition: background-color 0.45s ease, border-color 0.45s ease, color 0.45s ease, box-shadow 0.45s ease;
}

.showcase-label {
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    color: var(--showcase-muted-color);
    transition: color 0.45s ease;
}

.showcase-copy h2 {
    margin: 0;
    font-size: clamp(2rem, 4vw, 3.5rem);
    line-height: 1;
    font-weight: 900;
    max-width: 11ch;
}

.showcase-copy p {
    margin: 0;
    max-width: 56ch;
    color: var(--showcase-muted-color);
    font-size: 1.04rem;
    line-height: 1.7;
    transition: color 0.45s ease;
}

.showcase-card {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 1.25rem;
    padding: 1.4rem 1.5rem;
    border-radius: 24px;
    background: var(--showcase-card-bg);
    border: 1px solid var(--showcase-card-border);
    backdrop-filter: blur(18px);
    color: var(--showcase-card-text);
    transition: background-color 0.45s ease, border-color 0.45s ease, color 0.45s ease, box-shadow 0.45s ease;
    animation-delay: 0.62s;
}

.showcase-card-label {
    display: inline-block;
    margin-bottom: 0.55rem;
    font-size: 0.82rem;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--showcase-card-muted);
    transition: color 0.45s ease;
}

.showcase-card strong {
    display: block;
    font-size: clamp(1.35rem, 2vw, 2rem);
    line-height: 1.1;
    font-weight: 800;
}

.showcase-card p {
    margin: 0.75rem 0 0;
    max-width: 40ch;
    color: var(--showcase-card-muted);
    line-height: 1.6;
    transition: color 0.45s ease;
}

.showcase-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 1rem;
    flex-shrink: 0;
}

.showcase-counter {
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--showcase-counter-color);
    transition: color 0.45s ease;
}

.showcase-dots {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.55rem;
}

.showcase-dot {
    width: 11px;
    height: 11px;
    padding: 0;
    border: none;
    border-radius: 999px;
    background: var(--showcase-dot-bg);
    cursor: pointer;
    transition: transform 0.25s ease, background-color 0.45s ease, width 0.25s ease;
}

.showcase-dot.is-active {
    width: 34px;
    background: var(--showcase-dot-active);
}

.showcase-dot:hover {
    transform: scale(1.05);
}

.showcase-fade-enter-active,
.showcase-fade-leave-active {
    transition: opacity 0.8s ease, transform 0.8s ease;
}

.showcase-fade-enter-from,
.showcase-fade-leave-to {
    opacity: 0;
    transform: scale(1.04);
}

@keyframes authFadeUp {
    from {
        opacity: 0;
        transform: translate3d(0, 22px, 0);
    }

    to {
        opacity: 1;
        transform: translate3d(0, 0, 0);
    }
}

@keyframes authFadeDown {
    from {
        opacity: 0;
        transform: translate3d(0, -16px, 0);
    }

    to {
        opacity: 1;
        transform: translate3d(0, 0, 0);
    }
}

@keyframes authReveal {
    from {
        opacity: 0;
        transform: translate3d(0, 18px, 0) scale(0.975);
    }

    to {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
    }
}

@media (prefers-reduced-motion: reduce) {
    .logoUp,
    .auth-form-stack,
    .login-box > *,
    .theme-switcher-wrap,
    .showcase-frame,
    .showcase-copy > *,
    .showcase-card {
        animation: none !important;
        opacity: 1 !important;
        transform: none !important;
    }

    .showcase-fade-enter-active,
    .showcase-fade-leave-active,
    .showcase-frame,
    .showcase-overlay,
    .showcase-content,
    .showcase-pill,
    .showcase-label,
    .showcase-copy p,
    .showcase-card,
    .showcase-card-label,
    .showcase-card p,
    .showcase-counter,
    .showcase-dot {
        transition-duration: 0.01ms !important;
    }
}

@media (max-width: 1120px) {
    .auth-shell {
        width: min(980px, calc(100vw - 40px));
        grid-template-columns: minmax(320px, 390px) minmax(0, 1fr);
        gap: 20px;
    }

    .showcase-content {
        padding: 1.6rem;
    }

    .showcase-copy h2 {
        max-width: 13ch;
    }
}

@media (max-width: 896px) {
    .logoUp {
        top: 20px;
        left: 20px;
        width: 180px;
        height: 28px;
    }

    .auth-shell {
        width: min(100vw - 24px, 740px);
        min-height: auto;
        grid-template-columns: 1fr;
        gap: 16px;
        padding: 78px 0 24px;
    }

    .login-box {
        width: 100%;
        padding: 1.4rem;
        border-radius: 24px;
    }

    .auth-panel--showcase {
        order: -1;
    }

    .showcase-frame {
        min-height: 460px;
        border-radius: 28px;
    }

    .showcase-content {
        min-height: 460px;
        padding: 1.25rem;
    }

    .showcase-copy p {
        font-size: 0.98rem;
        line-height: 1.6;
    }

    .showcase-card {
        flex-direction: column;
        align-items: flex-start;
    }

    .showcase-meta {
        width: 100%;
        align-items: flex-start;
    }

    .showcase-dots {
        justify-content: flex-start;
    }
}

@media (max-width: 560px) {
    .login-page {
        padding-inline: 12px;
    }

    .auth-shell {
        width: 100%;
        padding-top: 70px;
    }

    .brand h1 {
        font-size: 2rem;
    }

    .brand-description {
        font-size: 0.94rem;
    }

    .showcase-frame,
    .showcase-content {
        min-height: 400px;
    }

    .showcase-copy h2 {
        font-size: 1.8rem;
    }

    .showcase-copy p,
    .showcase-card p {
        font-size: 0.92rem;
    }
}
</style>
