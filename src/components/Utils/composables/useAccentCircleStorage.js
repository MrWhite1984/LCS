export const useAccentCircleStorage = ({ storageKey, clampPointToCircle }) => {
    const saveCircleLayout = ({ circles, selectedCircleId, nextCircleId }) => {
        if (typeof localStorage === 'undefined') return;

        const payload = {
            v: 1,
            circles: circles.map((circle) => ({
                id: Number(circle.id),
                x: Number(circle.x),
                y: Number(circle.y),
            })),
            selectedCircleId: selectedCircleId == null ? null : Number(selectedCircleId),
            nextCircleId: Number(nextCircleId),
        };

        localStorage.setItem(storageKey, JSON.stringify(payload));
    };

    const loadCircleLayout = () => {
        if (typeof localStorage === 'undefined') return null;

        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return null;

            const parsed = JSON.parse(raw);
            const parsedCircles = Array.isArray(parsed?.circles) ? parsed.circles : [];
            const normalized = parsedCircles
                .map((circle) => {
                    const id = Number(circle?.id);
                    const x = Number(circle?.x);
                    const y = Number(circle?.y);
                    if (!Number.isFinite(id) || !Number.isFinite(x) || !Number.isFinite(y)) return null;
                    const point = clampPointToCircle(x, y);
                    return { id, x: point.x, y: point.y };
                })
                .filter(Boolean);

            const circles = normalized.length ? [normalized[0]] : [];
            const requestedSelected = Number(parsed?.selectedCircleId);
            const hasSelected = circles.some((circle) => circle.id === requestedSelected);
            const selectedCircleId = hasSelected ? requestedSelected : (circles[0]?.id ?? null);
            const maxId = circles.length ? Math.max(...circles.map((circle) => circle.id)) : 0;
            const requestedNext = Number(parsed?.nextCircleId);
            const nextCircleId = Number.isFinite(requestedNext) ? Math.max(requestedNext, maxId + 1) : maxId + 1;

            return { circles, selectedCircleId, nextCircleId };
        } catch (error) {
            console.debug('Не удалось восстановить круги AccentColorEditor:', error);
            return null;
        }
    };

    return {
        saveCircleLayout,
        loadCircleLayout,
    };
};
