<template>
    <main class="callback-page">
        <div class="background-layer">
            <div class="logoUp"></div>
            <div class="logoDownContainer"></div>
        </div>
        
        <div class="callback-content">
            <ThemeSwitcher />
            <div class="callback-card">
                <div class="card-header">
                    <i class="pi pi-shield-check card-icon"></i>
                    <h2 class="card-title">Завершение входа</h2>
                    <p class="card-subtitle">Система единого входа</p>
                </div>

                <div class="loading-section">
                    <div class="spinner-container">
                        В
                        <div class="spinner-overlay">
                            <i class="pi pi-user"></i>
                        </div>
                    </div>
                    
                    <div class="loading-status">
                        <p class="loading-text">Идёт авторизация...</p>
                        <div class="progress-dots">
                            <span class="dot dot-1"></span>
                            <span class="dot dot-2"></span>
                            <span class="dot dot-3"></span>
                        </div>
                    </div>

                    <div v-if="errorMessage" class="error-section">
                        <i class="pi pi-exclamation-triangle error-icon"></i>
                        <p class="error-message">{{ errorMessage }}</p>
                        <Button 
                            label="Вернуться к входу" 
                            icon="pi pi-arrow-left"
                            class="error-button"
                            @click="router.push('/auth')"
                        />
                    </div>

                    <div v-else class="hint-section">
                        <p class="hint-text">
                            <i class="pi pi-info-circle"></i>
                            Пожалуйста, подождите, пока система завершит авторизацию
                        </p>
                    </div>
                </div>
            </div>
        </div>

    </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { saveAuthData, startTokenWorker } from "@/utils/TokenService";
import axiosInstance from '@/utils/axios.js';
import { playSplashAndNavigate } from '@/composables/splashTransition';

import ThemeSwitcher from '@/components/Utils/ThemeSwitcher.vue';

const router = useRouter();
const toast = useToast();
const errorMessage = ref('');

onMounted(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    if (error) {
        errorMessage.value = formatSsoError(error, errorDescription);
        cleanCallbackUrl();
        return;
    }

    if (code && state) {
        await verifySSO(code, state);
    } else {
        errorMessage.value = 'Отсутствуют необходимые параметры авторизации. Пожалуйста, попробуйте войти снова.';
        cleanCallbackUrl();
    }
});

const verifySSO = async (code, state) => {
    try {
        const response = await axiosInstance.post('/api/auth/sso/verification', {
            code: code,
            state: state
        }, {
            headers: {
                'accept': 'text/plain',
                'Content-Type': 'application/json'
            }
        });

        saveAuthData({
            accessToken: response.data.accessToken,
            userId: response.data.userId,
            refreshTokenValue: response.data.refreshTokenValue,
            refreshTokenExpired: response.data.refreshTokenExpired,
            accessTokenExpired: response.data.accessTokenExpired,
            accessTokenExpiresIn: response.data.accessTokenExpiresIn,
        });

        startTokenWorker();

        cleanCallbackUrl();

        // toast.add({ 
        //     severity: 'success', 
        //     summary: 'Успешная авторизация', 
        //     detail: 'Вы успешно вошли через систему единого входа', 
        //     life: 3000 
        // });

        // setTimeout(() => {
        //     router.push('/');
        // }, 1500);

        playSplashAndNavigate(() => router.push('/'));

    } catch (error) {
        console.error('SSO verification error:', error);
        errorMessage.value = error.response?.data?.message || 'Произошла ошибка при авторизации через систему единого входа. Пожалуйста, попробуйте снова.';
        
        toast.add({ 
            severity: 'error', 
            summary: 'Ошибка авторизации', 
            detail: errorMessage.value, 
            life: 5000 
        });
    }
};

const cleanCallbackUrl = () => {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
};

const formatSsoError = (error, description) => {
    const normalizedDescription = description ? description.replace(/\+/g, ' ') : '';

    if (normalizedDescription) {
        return `Ошибка SSO: ${normalizedDescription}`;
    }

    const errorMap = {
        access_denied: 'Доступ отклонён. Вход был отменён пользователем.',
        invalid_request: 'Некорректный запрос SSO. Попробуйте повторить вход.',
        unauthorized_client: 'Клиент SSO не имеет прав на этот тип входа.',
        server_error: 'Ошибка сервера SSO. Попробуйте позже.',
        temporarily_unavailable: 'SSO временно недоступен. Попробуйте позже.'
    };

    return errorMap[error] || 'Произошла ошибка при авторизации через систему единого входа. Пожалуйста, попробуйте снова.';
};

</script>

<style scoped>
.callback-page {
    min-height: 100vh;
    display: flex;
    position: relative;
    overflow: hidden;
}

.logoUp {
    position: absolute;
    top: 35px;
    left: 35px;
    width: 100%;
    height: 40px;
    background-repeat: no-repeat;
    z-index: 1;
    background-image: url('/src/assets/logo/logoUp.svg');
}

.logoDownContainer {
    position: absolute;
    bottom: 0;
    z-index: 1;
    width: 70%;
    left: 30px;
    height: 30%;
    transition: background-image 0.5s ease;
}

.logoDownContainer::before, .logoDownContainer::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    transition: opacity 0.5s ease;
    z-index: 0;
    opacity: 0;
}

.logoDownContainer::before {
    background-image: url('/src/assets/logo/sibadi.png');
    opacity: 1;
}

.logoDownContainer::after {
    background-image: url('/src/assets/logo/sibadi_dark.png');
}

.p-dark .logoDownContainer::before {
    opacity: 0;
}

.p-dark .logoDownContainer::after {
    opacity: 1;
}

.callback-page::before, .callback-page::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    transition: opacity 0.5s ease;
    z-index: 0;
    opacity: 0;
}

.callback-page::before {
    background-image: url('/src/assets/backgrounds/lp_bg_light.png');
    opacity: 1;
}

.callback-page::after {
    background-image: url('/src/assets/backgrounds/lp_bg_dark.png');
}

.p-dark .callback-page::before {
    opacity: 0;
}

.p-dark .callback-page::after {
    opacity: 1;
}

.callback-content {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    min-height: 100vh;
    z-index: 2;
    padding: 20px;
}

.callback-card {
    background: var(--p-bg-color-1);
    padding: 40px;
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    max-width: 420px;
    width: 100%;
    text-align: center;
    backdrop-filter: blur(10px);
    animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.card-header {
    margin-bottom: 2rem;
}

.card-icon {
    font-size: 3rem;
    color: var(--p-primary-color);
    margin-bottom: 1rem;
    display: block;
}

.card-title {
    color: var(--p-text-color);
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
}

.card-subtitle {
    color: var(--p-grey-1);
    font-size: 1rem;
    margin: 0;
}

.loading-section {
    margin: 2rem 0;
}

.spinner-container {
    position: relative;
    display: inline-block;
    margin-bottom: 1.5rem;
}

.spinner-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--p-primary-color);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.2rem;
}

.loading-status {
    margin-bottom: 1.5rem;
}

.loading-text {
    color: var(--p-text-color);
    font-size: 1.1rem;
    font-weight: 500;
    margin: 0 0 1rem 0;
}

.progress-dots {
    display: flex;
    justify-content: center;
    gap: 6px;
}

.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--p-primary-color);
    opacity: 0.4;
    animation: pulse 1.4s ease-in-out infinite both;
}

.dot-1 { animation-delay: -0.32s; }
.dot-2 { animation-delay: -0.16s; }
.dot-3 { animation-delay: 0s; }

@keyframes pulse {
    0%, 80%, 100% {
        transform: scale(0.8);
        opacity: 0.4;
    }
    40% {
        transform: scale(1.2);
        opacity: 1;
    }
}

.error-section {
    background: var(--p-red-100);
    border-radius: 12px;
    padding: 1.5rem;
    margin-top: 1rem;
    animation: shake 0.5s ease-in-out;
}

.p-dark .error-section {
    background: color-mix(in srgb, var(--p-red-500), transparent 84%);
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}

.error-icon {
    color: var(--p-red-600);
    font-size: 2rem;
    margin-bottom: 0.5rem;
    display: block;
}

.p-dark .error-icon {
    color: var(--p-red-300);
}

.error-message {
    color: var(--p-red-600);
    margin: 0 0 1rem 0;
    line-height: 1.4;
}

.p-dark .error-message {
    color: var(--p-red-300);
}

.error-button {
    width: 100%;
}

.hint-section {
    background: var(--p-sky-100);
    border-radius: 12px;
    padding: 1rem;
    margin-top: 1rem;
}

.p-dark .hint-section {
    background: color-mix(in srgb, var(--p-sky-500), transparent 84%);
}

.hint-text {
    color: var(--p-sky-700);
    font-size: 0.9rem;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.p-dark .hint-text {
    color: var(--p-sky-300);
}

.hint-text i {
    color: var(--p-sky-700);
}

.p-dark .hint-text i {
    color: var(--p-sky-300);
}

@media (max-width: 768px) {
    .callback-card {
        padding: 30px 20px;
        margin: 20px;
    }
    
    .card-title {
        font-size: 1.3rem;
    }
    
    .custom-spinner {
        width: 60px !important;
        height: 60px !important;
    }
    
    .spinner-overlay {
        width: 30px;
        height: 30px;
        font-size: 1rem;
    }
}
</style>
