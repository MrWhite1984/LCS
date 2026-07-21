<template>
    <main class="login-guide-page">
        <div class="login-guide">
            <header class="guide-header">
                <span class="guide-kicker">Личный кабинет СибАДИ</span>
                <h1>Регистрация в личном кабинете СибАДИ. Инструкция</h1>
            </header>

            <div class="guide-blocks">
                <section
                    v-for="step in steps"
                    :key="step.id"
                    :id="step.id"
                    class="guide-block"
                >
                    <div class="guide-block-text">
                        <span class="guide-step-title">{{ step.title }}</span>
                        <p>
                            <template v-for="(part, idx) in step.textParts" :key="idx">
                                <a v-if="part.anchor" :href="`#${part.anchor}`" class="guide-anchor-link">{{ part.text }}</a>
                                <template v-else>{{ part.text }}</template>
                            </template>
                        </p>

                        <div v-if="step.note" class="guide-note">
                            <span class="guide-note-title">Примечание</span>
                            <p>{{ step.note }}</p>
                            <div v-if="step.noteImage" class="guide-block-image guide-note-image">
                                <img :src="step.noteImage" :alt="`${step.title}, примечание`" />
                            </div>
                            <p v-if="step.noteAfter">{{ step.noteAfter }}</p>
                        </div>
                    </div>

                    <div v-if="step.image" class="guide-block-image">
                        <img :src="step.image" :alt="step.caption || step.title" />
                        <span v-if="step.caption" class="guide-caption">{{ step.caption }}</span>
                    </div>
                </section>
            </div>
        </div>
    </main>
</template>

<script setup>
import step01 from '@/assets/instructions/login-guide/step-01.png';
import step02 from '@/assets/instructions/login-guide/step-02.png';
import step03 from '@/assets/instructions/login-guide/step-03.png';
import step04 from '@/assets/instructions/login-guide/step-04.png';
import step05 from '@/assets/instructions/login-guide/step-05.png';
import step06 from '@/assets/instructions/login-guide/step-06.png';
import step07 from '@/assets/instructions/login-guide/step-07.png';
import step07Note from '@/assets/instructions/login-guide/step-07-note.png';
import step09 from '@/assets/instructions/login-guide/step-09.png';
import step10 from '@/assets/instructions/login-guide/step-10.png';
import step12 from '@/assets/instructions/login-guide/step-12.png';
import step13 from '@/assets/instructions/login-guide/step-13.png';
import step14 from '@/assets/instructions/login-guide/step-14.png';

const steps = [
    {
        id: 'step-1',
        title: 'Шаг 1',
        textParts: [
            { text: 'Для входа в Личный кабинет СибАДИ перейдите на страницу: https://lk.sibadi.org/auth (Рис. 1).' },
        ],
        image: step01,
        caption: 'Рис. 1',
    },
    {
        id: 'step-2',
        title: 'Шаг 2',
        textParts: [
            { text: 'Нажмите на кнопку Система единого входа (Рис. 2).' },
        ],
        image: step02,
        caption: 'Рис. 2',
    },
    {
        id: 'step-3',
        title: 'Шаг 3',
        textParts: [
            { text: 'Если вы впервые используете Систему единого входа, нажмите на кнопку Восстановить пароль (Рис. 3). Если у вас уже есть данные для входа, перейдите к ' },
            { text: 'шагу 12', anchor: 'step-12' },
            { text: '.' },
        ],
        image: step03,
        caption: 'Рис. 3',
    },
    {
        id: 'step-4',
        title: 'Шаг 4',
        textParts: [
            { text: 'В поле Email введите свой адрес электронной почты (тот адрес, который вы указывали при трудоустройстве и на который вам приходит Расчетный листок) (Рис. 4).' },
        ],
        image: step04,
        caption: 'Рис. 4',
    },
    {
        id: 'step-5',
        title: 'Шаг 5',
        textParts: [
            { text: 'Нажмите кнопку Отправить запрос (Рис. 5).' },
        ],
        image: step05,
        caption: 'Рис. 5',
    },
    {
        id: 'step-6',
        title: 'Шаг 6',
        textParts: [
            { text: 'Перейдите в ваш почтовый сервис. Там вы увидите письмо от СибАДИ (Рис. 6).' },
        ],
        image: step06,
        caption: 'Рис. 6',
    },
    {
        id: 'step-7',
        title: 'Шаг 7',
        textParts: [
            { text: 'Откройте это письмо. В нем вам будет предложено нажать на кнопку сброса пароля (если кнопка не работает, нажмите на ссылку ниже) (Рис. 7).' },
        ],
        image: step07,
        caption: 'Рис. 7',
        note: 'При нажатии на кнопку сброса пароля, ваш почтовый сервис может запросить подтверждение перехода (Рис. 8).',
        noteImage: step07Note,
        noteAfter: 'Если сервис запрашивает такое подтверждение, нажмите Продолжить (может отличаться в зависимости от сервиса). После этого вас перенаправит на страницу восстановления пароля.',
    },
    {
        id: 'step-8',
        title: 'Шаг 8',
        textParts: [
            { text: 'На странице сброса пароля: введите новый пароль и повторите его в поле ниже.' },
        ],
        note: 'Ваш пароль должен состоять минимум из 8 символов и содержать буквы в верхнем и нижнем регистре (большие и маленькие) и хотя бы одну цифру.',
    },
    {
        id: 'step-9',
        title: 'Шаг 9',
        textParts: [
            { text: 'Нажмите на кнопку Установить пароль (Рис. 9).' },
        ],
        image: step09,
        caption: 'Рис. 9',
    },
    {
        id: 'step-10',
        title: 'Шаг 10',
        textParts: [
            { text: 'После успешного изменения пароля (Рис. 10), вы можете вернуться на страницу входа: https://lk.sibadi.org/auth.' },
        ],
        image: step10,
        caption: 'Рис. 10',
    },
    {
        id: 'step-11',
        title: 'Шаг 11',
        textParts: [
            { text: 'На странице входа, нажмите на кнопку Система единого входа.' },
        ],
    },
    {
        id: 'step-12',
        title: 'Шаг 12',
        textParts: [
            { text: 'Введите данные (адрес электронной почты и пароль) и нажмите кнопку Войти (Рис. 11).' },
        ],
        image: step12,
        caption: 'Рис. 11',
    },
    {
        id: 'step-13',
        title: 'Шаг 13',
        textParts: [
            { text: 'Система единого входа запросит у вас разрешение на доступ к вашей учетной записи. Нажмите на кнопку Разрешить (Рис. 12).' },
        ],
        image: step13,
        caption: 'Рис. 12',
    },
    {
        id: 'step-14',
        title: 'Шаг 14',
        textParts: [
            { text: 'Вас перенаправит на главную страницу Личного кабинета СибАДИ (Рис. 13).' },
        ],
        image: step14,
        caption: 'Рис. 13',
    },
];
</script>

<style scoped>
.login-guide-page {
    min-height: 100dvh;
    padding: 2.5rem 1.5rem 4rem;
    background:
        radial-gradient(900px 220px at 10% 0%, rgba(var(--p-blue-500-rgb), 0.08), transparent 60%),
        linear-gradient(180deg, var(--p-bg-color-2) 0%, var(--p-bg-color-1) 86%);
}

.login-guide {
    max-width: 880px;
    margin: 0 auto;
}

.guide-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 2rem;
}

.guide-kicker {
    font-size: 0.88rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--p-blue-400);
}

.guide-header h1 {
    margin: 0;
    font-size: clamp(1.5rem, 2.6vw, 2.1rem);
    font-weight: 800;
    color: var(--p-text-color);
    line-height: 1.25;
}

.guide-blocks {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.guide-block {
    background: var(--p-bg-color-1);
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid var(--p-grey-4);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
    scroll-margin-top: 1.5rem;
}

.guide-block-text {
    padding: 1.05rem 1.2rem;
    line-height: 1.7;
    color: var(--p-text-color);
    font-size: 1rem;
}

.guide-step-title {
    display: block;
    font-weight: 700;
    font-size: 1.05rem;
    margin-bottom: 0.4rem;
    color: var(--p-blue-500);
}

.guide-block-text p {
    margin: 0;
}

.guide-anchor-link {
    color: var(--p-red-500);
    font-weight: 600;
    text-decoration: underline;
}

.guide-note {
    margin-top: 0.9rem;
    padding: 0.85rem 1rem;
    border-radius: 10px;
    background: var(--p-bg-color-2);
    border: 1px solid var(--p-grey-4);
}

.guide-note-title {
    display: block;
    font-weight: 700;
    margin-bottom: 0.35rem;
    color: var(--p-text-color);
}

.guide-note p {
    margin: 0.35rem 0 0;
    color: var(--p-text-color);
}

.guide-note-image {
    margin-top: 0.7rem;
}

.guide-block-image {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    padding: 0 1.2rem 1.2rem;
}

.guide-block-image img {
    width: 100%;
    max-height: 560px;
    object-fit: contain;
    border-radius: 10px;
    border: 1px solid var(--p-grey-4);
    background: var(--p-bg-color-2);
}

.guide-caption {
    font-size: 0.88rem;
    color: var(--p-grey-1);
}

@media (max-width: 640px) {
    .login-guide-page {
        padding: 1.5rem 1rem 3rem;
    }

    .guide-block-text,
    .guide-block-image {
        padding-inline: 0.9rem;
    }
}
</style>
