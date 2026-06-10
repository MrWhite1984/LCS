<template>
    <main>
        <div class="service-card infra-card" @click="table">
            <div class="service-card-top">
                <div class="service-icon-wrap">
                    <i class="pi pi-ticket"></i>
                </div>
                <div class="service-actions">
                    <span class="service-badge">Заявки</span>
                    <Button
                        class="action"
                        type="button"
                        icon="pi pi-ellipsis-v"
                        @click.stop="toggle"
                        aria-haspopup="true"
                        aria-controls="overlay_menu"
                        text
                        rounded
                        severity="secondary"
                    />
                    <Menu ref="menu" :model="menuItems" :popup="true" id="overlay_menu"/>
                </div>
            </div>
            <div class="service-card-body">
                <h3>ИТ-заявки</h3>
                <p>Заявки, связи пользователей и управление ИТ-процессами.</p>
            </div>
            <div class="service-card-footer">
                <span>Открыть заявки</span>
                <i class="pi pi-arrow-right"></i>
            </div>
        </div>
        <InfraManagerCreate ref="infraCreateRef"/>
        <InfraManagerDelete ref="infraDeleteRef"/>
        <InfraManagerSearchUsers ref="infraSearchRef"/>
    </main>
</template>

<script setup>
import { ref, nextTick } from "vue";
import { useRouter } from "vue-router";

import InfraManagerCreate from '@/components/InfraManager/InfraManagerCreate.vue';
import InfraManagerSearchUsers from '@/components/InfraManager/InfraManagerSearchUsers.vue';
import InfraManagerDelete from '@/components/InfraManager/InfraManagerDelete.vue';

const menu = ref();
const menuItems = ref([{
    label: 'Действия',
    items: [
        { label: 'Связка пользователей', icon: 'pi pi-link', command: () => { showCreateDialog() } },
        { label: 'Удаление связи', icon: 'pi pi-trash', command: () => { showDeleteDialog() } },
        { label: 'Поиск пользоватлей', icon: 'pi pi-user', command: () => { showSearchDialog() } },
    ]
}]);

const toggle = (event) => {
    menu.value.toggle(event);
};

const router = useRouter();

const table = () => {
    router.push("/services/infraManager");
}

const infraCreateRef = ref(null); // InfraManagerCreate
const infraDeleteRef = ref(null); // InfraManagerDelete
const infraSearchRef = ref(null); // InfraManagerSearchUsers

// Вызываем метод для открытия диалога в дочернем компоненте
const showCreateDialog = () => { nextTick(() => { infraCreateRef.value?.openDialogCreate(); }); };
const showDeleteDialog = () => { nextTick(() => { infraDeleteRef.value?.openDialogDelete(); }); };
const showSearchDialog = () => { nextTick(() => { infraSearchRef.value?.openDialogSearch(); }); };

</script>

<style scoped>
main {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
}

.service-card {
    position: relative;
    min-height: 178px;
    padding: 1.1rem;
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    overflow: hidden;
    color: var(--p-text-color);
    background:
        linear-gradient(145deg, rgba(59, 130, 246, 0.12), transparent 46%),
        var(--p-bg-color-1);
    border: 1px solid color-mix(in srgb, #3b82f6 22%, var(--p-grey-4));
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.07);
    transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.service-card::after {
    content: "";
    position: absolute;
    inset: auto -2rem -2.7rem auto;
    width: 7rem;
    height: 7rem;
    border-radius: 50%;
    background: rgba(59, 130, 246, 0.12);
    pointer-events: none;
}

.service-card:hover {
    transform: translateY(-4px);
    border-color: rgba(59, 130, 246, 0.42);
    box-shadow: 0 20px 42px rgba(15, 23, 42, 0.12);
    cursor: pointer;
}

.service-card-top,
.service-card-footer,
.service-actions {
    display: flex;
    align-items: center;
}

.service-card-top {
    justify-content: space-between;
    gap: 0.85rem;
    position: relative;
    z-index: 1;
}

.service-actions {
    gap: 0.35rem;
}

.service-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 46px;
    border-radius: 12px;
    color: #2563eb;
    background: rgba(59, 130, 246, 0.14);
}

.service-icon-wrap i {
    font-size: 1.35rem;
}

.service-badge {
    padding: 0.28rem 0.58rem;
    border-radius: 999px;
    color: #2563eb;
    background: rgba(59, 130, 246, 0.12);
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
}

.service-card-body {
    position: relative;
    z-index: 1;
    margin-top: 1rem;
}

.service-card-body h3 {
    margin: 0;
    font-size: 1.25rem;
}

.service-card-body p {
    margin: 0.5rem 0 0;
    color: var(--p-text-muted-color, var(--p-grey-1));
    line-height: 1.45;
}

.service-card-footer {
    position: relative;
    z-index: 1;
    justify-content: space-between;
    gap: 0.75rem;
    margin-top: 1rem;
    color: #2563eb;
    font-size: 0.9rem;
    font-weight: 800;
}

.action {
    width: 2.35rem;
    height: 2.35rem;
}
</style>
