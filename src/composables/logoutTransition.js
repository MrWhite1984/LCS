import { reactive } from 'vue';

const LOGOUT_SHRINK_MS = 420;

const logoutTransitionState = reactive({
    phase: 'idle'
});

function wait(ms) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
    });
}

function nextFrame() {
    return new Promise((resolve) => {
        requestAnimationFrame(() => resolve());
    });
}

export function useLogoutTransitionState() {
    return logoutTransitionState;
}

export async function runLogoutClipTransition(navigate) {
    if (logoutTransitionState.phase !== 'idle') return;
    if (typeof navigate !== 'function') return;

    const canUseViewTransition =
        typeof document !== 'undefined' &&
        typeof document.startViewTransition === 'function';

    if (canUseViewTransition) {
        logoutTransitionState.phase = 'running';
        document.documentElement.classList.add('logout-view-transition');

        try {
            const transition = document.startViewTransition(async () => {
                await navigate();
            });

            await transition.ready;

            const animation = document.documentElement.animate(
                {
                    clipPath: [
                        'circle(150vmax at 50vw 50vh)',
                        'circle(0px at 50vw 50vh)'
                    ]
                },
                {
                    duration: LOGOUT_SHRINK_MS,
                    easing: 'cubic-bezier(0.24, 0.8, 0.3, 1)',
                    pseudoElement: '::view-transition-old(root)'
                }
            );

            await animation.finished;
            await transition.finished;
        } finally {
            document.documentElement.classList.remove('logout-view-transition');
            logoutTransitionState.phase = 'idle';
        }

        return;
    }

    logoutTransitionState.phase = 'shrinking';
    await wait(LOGOUT_SHRINK_MS);
    logoutTransitionState.phase = 'hold';

    try {
        await navigate();
    } finally {
        await nextFrame();
        logoutTransitionState.phase = 'idle';
    }
}
