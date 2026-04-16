import { useToast } from 'primevue/usetoast';

export function useGlobalNotifications() {
    const toast = useToast();

    function addToast({ severity, summary, detail }) {
        toast.add({ severity, summary, detail, life: 3000 });
    }

    return { addToast };
}
