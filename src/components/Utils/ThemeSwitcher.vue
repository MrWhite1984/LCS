<template>
    <SelectButton v-model="selectedTheme" optionValue="value" optionLabel="value" :options="themeOptions" class="mb-2 w-100" v-if="!isAuthPage && isSideBarCollapse === false">
        <template #option="slotProps">
            <i :class="slotProps.option.icon"></i>
        </template>
    </SelectButton>
    <div class="col-lg-auto" @click="themeToggle" v-if="isAuthPage">
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
import { applySmartTextContrast } from '@/utils/accentTheme.js';

const props = defineProps({
    isSideBarCollapse: {
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

    applySmartTextContrast();

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

@media (max-width: 896px) {
    .bt {
        width: 22%;
        padding: 18px 50px;
    }
}
</style>
