import { reactive } from 'vue';

const splashState = reactive({
    active: false,
    onCovered: null,
    onFinished: null
});

export function showSplashTransition({ onCovered, onFinished } = {}) {
    splashState.onCovered = typeof onCovered === 'function' ? onCovered : null;
    splashState.onFinished = typeof onFinished === 'function' ? onFinished : null;
    splashState.active = true;
}

export async function playSplashAndNavigate(navigate) {
    return new Promise((resolve) => {
        showSplashTransition({
            onCovered: async () => {
                if (typeof navigate !== 'function') return;
                try {
                    await navigate();
                } catch (error) {
                    console.debug('Ошибка навигации под splash:', error);
                }
            },
            onFinished: resolve
        });
    });
}

export function handleSplashCovered() {
    const callback = splashState.onCovered;
    splashState.onCovered = null;
    if (callback) callback();
}

export function handleSplashFinished() {
    const callback = splashState.onFinished;
    splashState.active = false;
    splashState.onCovered = null;
    splashState.onFinished = null;
    if (callback) callback();
}

export function useSplashTransitionState() {
    return splashState;
}
