<template>
  <div class="app-root">
    <div class="app-shell">
      <Toast />
      <router-view />
    </div>
    <div v-if="splashState.active" class="global-splash-overlay">
      <SplashScreen class="global-splash-logo" @covered="onSplashCovered" @finished="onSplashFinished" />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import Toast from 'primevue/toast';
import { useRoute } from 'vue-router';
import SplashScreen from '@/components/Utils/SplashScreen.vue';
import {
  handleSplashCovered,
  handleSplashFinished,
  useSplashTransitionState
} from '@/composables/splashTransition';

import { useGlobalNotifications } from '@/plugins/useGlobalNotifications'; 
const { addToast } = useGlobalNotifications();
const splashState = useSplashTransitionState();

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
