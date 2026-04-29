<template>
    <SelectButton v-model="selectedTheme" optionValue="value" optionLabel="value" :options="themeOptions" class="mb-2 w-100" v-if="!isAuthPage && isSideBarCollapse === false">
        <template #option="slotProps">
            <i :class="slotProps.option.icon"></i>
        </template>
    </SelectButton>
    <button type="button" class="bt-inline" @click="themeToggle" v-if="isAuthPage && authInline">
        <span class="bt-inline-copy">
            <span class="bt-inline-label">Тема оформления</span>
            <span class="bt-inline-value">{{ currentThemeLabel }}</span>
        </span>
        <span class="bt-inline-icon">
            <i :class="`pi ${ iconClass }`"></i>
        </span>
    </button>
    <div class="col-lg-auto" @click="themeToggle" v-else-if="isAuthPage">
        <div class="bt" optionValue="value">
            <i :class="`pi ${ iconClass }`" class="me-2 me-lg-0"></i>
            <span class="d-lg-none fs-6">{{ currentThemeLabel }}</span>
        </div>
    </div>
    <div class="col-lg-auto" @click="themeToggle" v-if="isSideBarCollapse">
        <div class="bt1" optionValue="value1" v-tooltip="'Сменить тему'">
            <i :class="`pi ${ iconClass }`"></i>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { refreshAccentForThemeChange } from '@/utils/accentTheme.js';

const props = defineProps({
    isSideBarCollapse: {
        type: Boolean,
        default: false
    },
    authInline: {
        type: Boolean,
        default: false
    }
});

const themeOptions = ref([
    { icon: 'pi pi-sun', label: 'Светлая', value: 'light' },
    { icon: 'pi pi-moon', label: 'Тёмная', value: 'dark' },
    { icon: 'pi pi-hourglass', label: 'Авто', value: 'auto' }
]);

const savedTheme = themeOptions.value.some(opt => opt.value === localStorage.getItem('theme')) 
    ? localStorage.getItem('theme') 
    : 'auto';
const selectedTheme = ref(savedTheme);

const route = useRoute();
const isAuthPage = computed(() => route.path === '/auth' || route.path === '/noAccess' || route.path === '/notFound' || route.path === '/login/sso');

const iconClass = computed(() => {
    if (selectedTheme.value === 'dark') return 'pi-moon';
    if (selectedTheme.value === 'light') return 'pi-sun';
    return 'pi-hourglass';
});

const currentThemeLabel = computed(() => {
    const theme = themeOptions.value.find(option => option.value === selectedTheme.value);
    return theme ? theme.label : '';
})

onMounted(() => {
    applyTheme(selectedTheme.value);
});

watch(selectedTheme, (newTheme) => {
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
});

function applyTheme(theme) {
    const root = document.documentElement;

    if (theme === 'auto') {
        theme = getAutoTheme();
    }

    if (theme === 'dark') {
        root.classList.add('p-dark')
    } else {
        root.classList.remove('p-dark');
    }

    refreshAccentForThemeChange();

}

function getAutoTheme() {
    const hour = new Date().getHours();
    return (hour >= 18 || hour < 6) ? 'dark' : 'light';
}

function themeToggle() {
    const newTheme = selectedTheme.value === 'dark' ? 'light' 
                   : selectedTheme.value === 'light' ? 'auto' 
                   : 'dark';
    
    selectedTheme.value = newTheme;
}
</script>

<style scoped>
.bt {
    position: absolute;
    top: 35px;
    right: 35px;
    width: 30px;
    height: 30px;
    padding: 22px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--p-bg-color-2);
    color: var(--p-text-color);
    cursor: pointer;
    z-index: 999;
    transition: all 0.5s;
}

.bt1 {
    /* position: absolute; */
    /* bottom: 214px; */
    /* left: 23px; */
    width: 30px;
    height: 30px;
    padding: 22px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--p-grey-5);
    color: var(--p-text-color);
    cursor: pointer;
    z-index: 999;
    transition: all 0.5s;
}
.bt1:hover {
    background-color: var(--p-grey-3);
}
.bt:hover {
    background-color: var(--p-grey-3);
}

.bt-inline {
    width: 100%;
    margin-top: 0.4rem;
    padding: 0.95rem 1rem;
    border: 1px solid color-mix(in srgb, var(--p-text-muted-color) 18%, transparent);
    border-radius: 16px;
    background: color-mix(in srgb, var(--p-bg-color-2) 84%, transparent);
    color: var(--p-text-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.9rem;
    cursor: pointer;
    transition: background-color 0.35s ease, border-color 0.35s ease, transform 0.25s ease, color 0.35s ease;
}

.bt-inline:hover {
    background: color-mix(in srgb, var(--p-blue-400) 16%, var(--p-bg-color-2));
    border-color: color-mix(in srgb, var(--p-blue-400) 30%, transparent);
    transform: translateY(-1px);
}

.bt-inline-copy {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.18rem;
    text-align: left;
}

.bt-inline-label {
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--p-text-muted-color);
}

.bt-inline-value {
    font-size: 1rem;
    font-weight: 700;
    color: var(--p-text-color);
}

.bt-inline-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--p-blue-400) 14%, transparent);
    color: var(--p-blue-400);
    flex-shrink: 0;
    transition: background-color 0.35s ease, color 0.35s ease;
}

@media (max-width: 896px) {
    .bt {
        width: 22%;
        padding: 18px 50px;
    }

    .bt-inline {
        padding: 0.9rem 0.95rem;
    }
}
</style>
