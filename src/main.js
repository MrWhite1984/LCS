import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import ToastService from 'primevue/toastservice';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";
import 'primeicons/primeicons.css';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import router from './router';
import Noir from './presets/Noir.js';
// import { Form } from '@primevue/forms';

import AppState from './plugins/appState.js';
import { createPinia } from 'pinia';

import Tooltip from 'primevue/tooltip';
import { getCurrentSeason } from '@/utils/seasons.js';
import { syncPrimaryTheme } from '@/utils/accentTheme.js';

const app = createApp(App);
const pinia = createPinia();

const seasonOverride = localStorage.getItem('seasonOverride');
const initialSeason = ['winter', 'spring', 'summer', 'autumn'].includes(seasonOverride)
    ? seasonOverride
    : getCurrentSeason();
syncPrimaryTheme(initialSeason);

app.use(PrimeVue, {
    theme: {
        preset: Noir,
        options: {
            prefix: 'p',
            darkModeSelector: '.p-dark',
            cssLayer: false,
        },
        ripple: true,
    },
    locale: {
        firstDayOfWeek: 1,
        dayNames: ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
        dayNamesShort: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
        dayNamesMin: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
        monthNames: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
        monthNamesShort: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
        today: "Сегодня",
        clear: "Очистить",
        dateFormat: "dd.mm.yy",
        weekHeader: "Нед"
    }
});
app.use(AppState);
app.use(ToastService);
app.use(ConfirmationService);
app.directive('tooltip', Tooltip);

app.use(pinia)
app.use(router);

app.mount('#app');
