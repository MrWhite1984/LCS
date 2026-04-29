import { computed, onBeforeUnmount, onMounted, readonly, ref } from 'vue';

export const APP_BREAKPOINTS = Object.freeze({
    phoneMax: 768,
    tabletMax: 1024,
});

const viewportWidth = ref(
    typeof window === 'undefined' ? APP_BREAKPOINTS.tabletMax : window.innerWidth
);
const viewportHeight = ref(
    typeof window === 'undefined' ? 800 : window.innerHeight
);

let activeConsumers = 0;

const syncViewport = () => {
    viewportWidth.value = window.innerWidth;
    viewportHeight.value = window.innerHeight;
};

const attachViewportListener = () => {
    if (typeof window === 'undefined') return;
    window.addEventListener('resize', syncViewport, { passive: true });
    syncViewport();
};

const detachViewportListener = () => {
    if (typeof window === 'undefined') return;
    window.removeEventListener('resize', syncViewport);
};

export const useResponsiveLayout = () => {
    onMounted(() => {
        activeConsumers += 1;

        if (activeConsumers === 1) {
            attachViewportListener();
        } else {
            syncViewport();
        }
    });

    onBeforeUnmount(() => {
        activeConsumers = Math.max(0, activeConsumers - 1);

        if (activeConsumers === 0) {
            detachViewportListener();
        }
    });

    const isPhone = computed(() => viewportWidth.value <= APP_BREAKPOINTS.phoneMax);
    const isTablet = computed(
        () => viewportWidth.value > APP_BREAKPOINTS.phoneMax
            && viewportWidth.value <= APP_BREAKPOINTS.tabletMax
    );
    const isDesktop = computed(() => viewportWidth.value > APP_BREAKPOINTS.tabletMax);
    const isCompactLayout = computed(() => viewportWidth.value <= APP_BREAKPOINTS.tabletMax);

    return {
        breakpoints: APP_BREAKPOINTS,
        viewportWidth: readonly(viewportWidth),
        viewportHeight: readonly(viewportHeight),
        isPhone,
        isTablet,
        isDesktop,
        isCompactLayout,
    };
};
