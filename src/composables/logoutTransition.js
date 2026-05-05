import { reactive } from 'vue';

const LOGOUT_SHRINK_MS = 420;

const logoutTransitionState = reactive({
    phase: 'idle'
});

function nextFrame() {
    return new Promise((resolve) => {
        requestAnimationFrame(() => resolve());
    });
}

function copyScrollState(sourceRoot, cloneRoot) {
    const sourceNodes = [sourceRoot, ...sourceRoot.querySelectorAll('*')];
    const cloneNodes = [cloneRoot, ...cloneRoot.querySelectorAll('*')];

    for (let index = 0; index < sourceNodes.length; index += 1) {
        const sourceNode = sourceNodes[index];
        const cloneNode = cloneNodes[index];

        if (!(sourceNode instanceof HTMLElement) || !(cloneNode instanceof HTMLElement)) {
            continue;
        }

        cloneNode.scrollTop = sourceNode.scrollTop;
        cloneNode.scrollLeft = sourceNode.scrollLeft;
    }
}

function createLogoutOverlay() {
    if (typeof document === 'undefined') return null;

    const sourceShell = document.querySelector('.app-shell');
    if (!(sourceShell instanceof HTMLElement)) return null;

    const overlay = sourceShell.cloneNode(true);
    if (!(overlay instanceof HTMLElement)) return null;

    copyScrollState(sourceShell, overlay);

    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100dvh';
    overlay.style.minHeight = '100dvh';
    overlay.style.overflow = 'hidden';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '10000';
    overlay.style.background = 'transparent';
    overlay.style.webkitClipPath = 'circle(150vmax at 50vw 50vh)';
    overlay.style.clipPath = 'circle(150vmax at 50vw 50vh)';
    overlay.style.willChange = 'clip-path';
    overlay.style.isolation = 'isolate';

    const overlayToasts = overlay.querySelector('.p-toast');
    if (overlayToasts instanceof HTMLElement) {
        overlayToasts.style.display = 'none';
    }

    document.body.appendChild(overlay);

    return overlay;
}

export function useLogoutTransitionState() {
    return logoutTransitionState;
}

export async function runLogoutClipTransition(navigate) {
    if (logoutTransitionState.phase !== 'idle') return;
    if (typeof navigate !== 'function') return;

    const overlay = createLogoutOverlay();

    if (!(overlay instanceof HTMLElement) || typeof overlay.animate !== 'function') {
        await navigate();
        return;
    }

    logoutTransitionState.phase = 'running';

    try {
        await nextFrame();

        const navigationPromise = Promise.resolve(navigate());
        const animation = overlay.animate(
            {
                clipPath: [
                    'circle(150vmax at 50vw 50vh)',
                    'circle(0px at 50vw 50vh)'
                ],
                webkitClipPath: [
                    'circle(150vmax at 50vw 50vh)',
                    'circle(0px at 50vw 50vh)'
                ]
            },
            {
                duration: LOGOUT_SHRINK_MS,
                easing: 'cubic-bezier(0.24, 0.8, 0.3, 1)',
                fill: 'forwards'
            }
        );

        await Promise.allSettled([navigationPromise, animation.finished]);
    } finally {
        overlay.remove();
        logoutTransitionState.phase = 'idle';
    }
}
