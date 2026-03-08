<template>
  <div class="app-root">
    <div class="app-shell" :class="logoutPhaseClass">
      <Toast />
      <router-view />
    </div>
    <div v-if="splashState.active" class="global-splash-overlay">
      <SplashScreen class="global-splash-logo" @covered="onSplashCovered" @finished="onSplashFinished" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import Toast from 'primevue/toast';
import { useRoute } from 'vue-router';
import SplashScreen from '@/components/Utils/SplashScreen.vue';
import {
  handleSplashCovered,
  handleSplashFinished,
  useSplashTransitionState
} from '@/composables/splashTransition';
import { useLogoutTransitionState } from '@/composables/logoutTransition';

import { useGlobalNotifications } from '@/plugins/useGlobalNotifications'; 
const { addToast } = useGlobalNotifications();
const splashState = useSplashTransitionState();
const logoutTransitionState = useLogoutTransitionState();
const logoutPhaseClass = computed(() => {
  if (logoutTransitionState.phase === 'shrinking') return 'logout-shrinking';
  if (logoutTransitionState.phase === 'hold') return 'logout-hold';
  return '';
});

const route = useRoute();

onMounted(() => {
  // Listen for toast messages from the app
  window.addEventListener('toast', (event) => {
    const { severity, summary, detail, userName } = event.detail;
    
    const page = event.detail.page || route.name;

    addToast({ severity, summary, detail, userName, page });
  });
});

const onSplashCovered = () => {
  handleSplashCovered();
};

const onSplashFinished = () => {
  handleSplashFinished();
};
</script>

<style scoped>
.app-root {
  position: relative;
  min-height: 100vh;
}

.app-shell {
  min-height: 100vh;
  -webkit-clip-path: circle(300vmax at 50vw 50vh);
  clip-path: circle(300vmax at 50vw 50vh);
  will-change: clip-path;
}

.app-shell.logout-shrinking {
  transition:
    -webkit-clip-path 0.42s cubic-bezier(0.24, 0.8, 0.3, 1),
    clip-path 0.42s cubic-bezier(0.24, 0.8, 0.3, 1);
  -webkit-clip-path: circle(0px at 50vw 50vh);
  clip-path: circle(0px at 50vw 50vh);
}

.app-shell.logout-hold {
  -webkit-clip-path: circle(0px at 50vw 50vh);
  clip-path: circle(0px at 50vw 50vh);
}

.global-splash-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: transparent;
}

.global-splash-logo {
  width: 100%;
  height: 100%;
}
</style>
