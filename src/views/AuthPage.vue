<template>
    <main>
        <div class="login-page">
            <div class="logoUp"></div>
            <div class="logoDownContainer"></div>
            <ThemeSwitcher />
            <div class="login-container">
                <div class="login-box">
                    <div class="brand">
                        <h2>Вход в ЛКС</h2>
                    </div>

                    <Button 
                        class="sso-button my-2"
                        icon="pi pi-users"
                        label="Система единого входа"
                        outlined
                        @click="ssoLogin"
                        :loading="ssoLoading"
                    />
                    <form @submit.prevent="auth">
                        <InputGroup class="my-2">
                            <InputGroupAddon>
                                <i class="pi pi-at"></i>
                            </InputGroupAddon>
                            <InputText placeholder="Email" id="email" name="email" v-model="email" required/>
                        </InputGroup>
                        <InputGroup class="my-2">
                            <InputGroupAddon>
                                <i class="pi pi-key"></i>
                            </InputGroupAddon>
                            <Password v-model="password" id="password" name="password" toggleMask :feedback="false" placeholder="Пароль" required />
                        </InputGroup>
                        <div>
                            <Button label="Забыли пароль?" text class="forgot-password" />
                        </div>
                        <Button class="but my-2 mb-0" type="submit" label="Войти" />
                        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
                    </form>
                </div>
                
            </div>
        </div>
    </main>
</template>

<script setup>
import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import { saveAuthData, startTokenWorker } from "@/utils/TokenService";
import axiosInstance from '@/utils/axios.js';
import { playSplashAndNavigate } from '@/composables/splashTransition';

import ThemeSwitcher from '@/components/Utils/ThemeSwitcher.vue';

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const toast = useToast();
const router = useRouter();

const ssoLoading = ref(false);

const auth = async () => {
    errorMessage.value = '';

    try {
        const response = await axiosInstance.post('/api/auth/login', {
            email: email.value,
            password: password.value
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

        playSplashAndNavigate(() =>
            router.replace({
                name: 'Dashboard',
                query: { message: 'success', summary: 'Успешно', detail: 'Вы вошли в личный кабинет' },
            })
        );

    } catch (error) {
        errorMessage.value = error.response?.data?.message || 'Неверный логин или пароль';
        // toast.add({ severity: 'error', summary: 'Ошибка', detail: errorMessage.value, life: 3000 });
    }
};

const ssoLogin = async () => {
    ssoLoading.value = true;
    errorMessage.value ='';

    try {
        const response = await axiosInstance.get('/api/auth/sso/redirection', {
            headers: {
                'accept': 'text/plain'
            }
        });

        if (response.data) {
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
            life: 5000 
        });
    } finally {
        ssoLoading.value = false;
    }
};

</script>


<style scoped>
.logoUp {
    position: absolute;
    top: 35px;
    left: 35px;
    width: 400px;
    height: 40px;
    background-color: var(--p-text-color);
    -webkit-mask-image: url('/src/assets/logo/logoUp.svg');
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-size: contain;
    -webkit-mask-position: left center;
    mask-image: url('/src/assets/logo/logoUp.svg');
    mask-repeat: no-repeat;
    mask-size: contain;
    mask-position: left center;
    z-index: 1;
    transition: background-color 0.35s ease;
    @media (max-width: 896px) {
        width: 150px;
        height: 28px;
    }
}
.logoDownContainer {
    position: absolute;
    bottom: 0;
    z-index: 1;
    width: 70%;
    left: 30px;
    height: 30%; /* Задаем высоту контейнера */
    transition: background-image 0.5s ease; /* Плавная смена фона */
    @media (max-width: 896px) {
        height: 10%;
    }
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
   transition: opacity 0.5s ease; /* Плавная смена */
   z-index: 0;
   opacity: 0;
}

.logoDownContainer::before {
   background-image: url('/src/assets/logo/sibadi.png'); /* Светлое изображение */
   opacity: 1; /* Показываем светлую картинку по умолчанию */
}

.logoDownContainer::after {
   background-image: url('/src/assets/logo/sibadi_dark.png'); /* Темное изображение */
}

/* Когда включена темная тема */
.p-dark .logoDownContainer::before {
   opacity: 0; /* Скрываем светлую картинку */
}

.p-dark .logoDownContainer::after {
   opacity: 1; /* Показываем темную картинку */
}
.but {
    width: 100%;
    height: 50px;
    font-size: 1.25rem;
    border-radius: 12px;
}

.sso-button {
    width: 100%;
    height: 50px;
    font-size: 1.1rem;
    border-radius: 12px;
    color: var(--p-blue-400);
    border-color: var(--p-blue-400);
    background: transparent;
}

.sso-button:hover {
    background: var(--p-blue-400) !important;
    color: white !important;
}

main {
    margin: 0;
    padding: 0;
}
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100dvh;
  width: 100vw;
  position: relative;
  overflow: hidden;
  background: linear-gradient(145deg, var(--p-bg-color-2) 0%, var(--p-bg-color-1) 100%);
}
.error-message {
    color: var(--p-red-500);
    font-size: 14px;
    margin-top: 8px;
    margin-bottom: 0;
    text-align: center;
}

.login-page::before, .login-page::after {
   content: "";
   position: absolute;
   top: 0;
   left: 0;
   width: 100%;
   height: 100%;
   transition: opacity 0.5s ease;
   z-index: 0;
}

.login-page::before {
   background:
      radial-gradient(circle at 14% 18%, rgba(var(--p-primary-500-rgb), 0.24), transparent 44%),
      radial-gradient(circle at 88% 82%, rgba(var(--p-primary-500-rgb), 0.14), transparent 48%),
      linear-gradient(135deg, #dbe4f5, #cfdaf0 58%, #c6d3ec);
   opacity: 1;
}

.login-page::after {
   background:
      radial-gradient(circle at 10% 14%, rgba(var(--p-primary-500-rgb), 0.24), transparent 44%),
      radial-gradient(circle at 90% 86%, rgba(var(--p-primary-500-rgb), 0.14), transparent 48%),
      linear-gradient(145deg, rgba(9, 14, 28, 0.90), rgba(16, 24, 40, 0.78));
   opacity: 0;
}
.p-dark .login-page::before {
   opacity: 0;
}

.p-dark .login-page::after {
   opacity: 1;
}

.login-container {
    background: var(--p-bg-color-1);
    padding: 28px 40px;
    border-radius: 12px;
    transition: background 0.5s ease;
    z-index: 1;
}

.login-box {
    max-width: 300px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}
form {
    display: flex;
    flex-direction: column;
    place-items: center;
}

.brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 20px;
}

.brand h2 {
    color: var(--p-text-color);
    font-weight: 800;
    transition: all 0.5s;
}

.forgot-password {
    font-size: 16px;
    color: var(--p-grey-1);
}

@media (max-width: 768px) {
    .border-wrap {
        background: none;
        padding: 0;
    }
    .but {
        font-size: 18px;
        font-weight: 400;
    }
    .forgot-password {
        font-size: 16px;
    }
    .sso-button {
        font-size: 1rem;
    }
}
</style>
