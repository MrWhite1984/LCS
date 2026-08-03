<template>
    <main>
        <div class="content-wrapper">
            <Transition name="content-fade" mode="out-in">
            <section v-if="isPhone" key="sso-mobile-content" class="sso-mobile-page">
                <header class="sso-mobile-header">
                    <div>
                        <span class="sso-mobile-kicker">Единый вход</span>
                        <h3>SSO-конфигурации</h3>
                        <p>Подключения и параметры авторизации приложений.</p>
                    </div>
                    <div class="sso-mobile-actions">
                        <AddSsoConfig @added="loadConfigs" />
                        <Button
                            icon="pi pi-sync"
                            outlined
                            severity="secondary"
                            aria-label="Обновить список"
                            @click="loadConfigs"
                            :loading="loading"
                            :disabled="loading"
                        />
                    </div>
                </header>

                <div v-if="loading" class="sso-mobile-list">
                    <Skeleton v-for="item in 3" :key="item" height="10.5rem" borderRadius="1rem" />
                </div>

                <div v-else-if="paginatedList.length" class="sso-mobile-list">
                    <article v-for="config in paginatedList" :key="config.id" class="sso-mobile-card">
                        <div class="sso-mobile-card-head">
                            <span class="sso-mobile-icon"><i class="pi pi-shield"></i></span>
                            <div>
                                <strong>{{ config.clientName || 'Без названия' }}</strong>
                                <span>{{ config.applicationType || 'SSO-приложение' }}</span>
                            </div>
                            <DeleteSsoConfig :config="config" @deleted="loadConfigs" />
                        </div>
                        <dl class="sso-mobile-details">
                            <div>
                                <dt>Client ID</dt>
                                <dd>{{ config.clientId || '—' }}</dd>
                            </div>
                            <div>
                                <dt>Grant types</dt>
                                <dd>{{ config.grantTypes?.map((grant) => grant.title).join(', ') || '—' }}</dd>
                            </div>
                            <div>
                                <dt>PKCE</dt>
                                <dd><Tag :value="config.usePkce ? 'Включён' : 'Выключен'" :severity="config.usePkce ? 'success' : 'secondary'" /></dd>
                            </div>
                        </dl>
                    </article>
                </div>

                <div v-else class="sso-mobile-empty">
                    <i class="pi pi-shield"></i>
                    <strong>Конфигураций пока нет</strong>
                    <span>Добавьте первое SSO-подключение, когда будете готовы.</span>
                </div>

                <Paginator
                    v-if="ssoList.length > rowsPerPage"
                    :rows="rowsPerPage"
                    :first="first"
                    :totalRecords="ssoList.length"
                    @page="onPageChange"
                />
            </section>
            <DataTable 
                v-else-if="!loading || ssoList.length"
                key="sso-content"
                :value="paginatedList" 
                dataKey="id" 
                class="mb-4 no-row-hover" 
                paginator
                stripedRows
                :rows="rowsPerPage"
                :totalRecords="ssoList.length"
                :first="first"
                @page="onPageChange"
            >
                <template #header>
                    <div class="d-flex justify-content-between align-items-center">
                        <h3 class="m-0">SSO конфигурации</h3>
                        <div class="page-controls d-flex gap-2">
                            <AddSsoConfig @added="loadConfigs" />
                            <Button 
                                icon="pi pi-sync"
                                outlined
                                severity="secondary"
                                @click="loadConfigs"
                                :loading="loading"
                                :disabled="loading"
                            />
                        </div>
                    </div>
                </template>

                <Column field="clientId" header="ID клиента" />
                <Column field="clientName" header="Клиент" />
                <Column field="clientSecret" header="Secret клиента" />
                <Column field="clientUri" header="URI клиента" />
                <Column field="applicationType" header="Тип приложения" />
                <Column header="Grant Types">
                    <template #body="{ data }">
                        {{ data.grantTypes?.map(g => g.title).join(', ') || '-' }}
                    </template>
                </Column>
                <Column field="tokenEndpointAuthMethod" header="Метод авторизации" />
                <Column field="redirectUri" header="Redirect URI" />
                <Column field="scope" header="Scope" />
                <Column field="usePkce" header="PKCE">
                   <template #body="{ data }">
                        <Tag 
                            :icon="!data.usePkce ? 'pi pi-times' : 'pi pi-check'" 
                            :severity="!data.usePkce ? 'danger' : 'success'" 
                        />
                   </template>
                </Column>
                <Column header="">
                    <template #body="{ data }">
                        <DeleteSsoConfig :config="data" @deleted="loadConfigs" />
                    </template>
                </Column>

                <template #paginatorstart>
                    <div>Всего конфигураций: {{ ssoList.length }}</div>
                </template>

                <template #paginatorend>
                    <div class="d-flex align-items-center">
                        <span>Показать</span>
                        <Select 
                            v-model="rowsPerPage"
                            :options="rowsPerPageOptions"
                            optionLabel="label"
                            optionValue="value"
                            class="search mx-1 px-1"
                        />
                        <span>строк</span>
                    </div>
                </template>

            </DataTable>
            <div v-else key="sso-skeleton" class="table-skeleton">
                <Skeleton width="16rem" height="2rem" class="mb-4" />
                <Skeleton width="100%" height="3rem" class="mb-3" />
                <Skeleton width="100%" height="3rem" class="mb-2" />
                <Skeleton width="100%" height="3rem" class="mb-2" />
                <Skeleton width="100%" height="3rem" class="mb-2" />
                <Skeleton width="100%" height="3rem" class="mb-2" />
            </div>
            </Transition>
        </div>
    </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axiosInstance from "@/utils/axios";

import DeleteSsoConfig from "@/components/Sso/DeleteSsoConfig.vue";
import AddSsoConfig from "@/components/Sso/AddSsoConfig.vue";
import { useResponsiveLayout } from '@/composables/useResponsiveLayout.js';

const loading = ref(true);
const { isPhone } = useResponsiveLayout();

const ssoList = ref([]);
const first = ref(0);
const rowsPerPage = ref(5);

const paginatedList = computed(() => {
    const start = first.value;
    const end = first.value + rowsPerPage.value;
    return ssoList.value.slice(start, end);
});

const rowsPerPageOptions = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '15', value: 15 },
];

const onPageChange = (event) => {
    first.value = event.first;
}

onMounted(() => {
   loadConfigs(); 
});

const loadConfigs = async () => {
    loading.value = true;
    try {
        const response = await axiosInstance.get('/api/sso/resources');
        ssoList.value = response.data;
    } catch (error) {
        console.debug('Ошибка при загрузке SSO конфигураций: ', error);
        loading.value = false;
    } finally {
        loading.value = false;
    }
    
}

</script>

<style scoped>
main {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100vh;
    
    box-sizing: border-box;
    color: var(--p-text-color);
}
.header {
    padding: 20px 8rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.content-wrapper {
    height: 100%;
    padding: 10px 2rem;
}

:deep(.no-row-hover .p-datatable-tbody > tr:hover),
:deep(.no-row-hover .p-datatable-tbody > tr.p-row-hover),
:deep(.no-row-hover.p-datatable-hoverable-rows .p-datatable-tbody > tr:hover) {
    background: transparent !important;
}
.table-skeleton {
    width: 100%;
}

.sso-mobile-page {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-bottom: var(--app-mobile-bottom-offset);
}

.sso-mobile-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid color-mix(in srgb, var(--p-primary-color) 16%, var(--p-grey-4));
    border-radius: 1rem;
    background: linear-gradient(135deg, color-mix(in srgb, var(--p-primary-color) 12%, transparent), transparent 62%), var(--p-bg-color-1);
}

.sso-mobile-kicker {
    color: var(--p-primary-color);
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.sso-mobile-header h3 {
    margin: 0.2rem 0 0;
    font-size: 1.28rem;
    font-weight: 800;
    letter-spacing: -0.03em;
}

.sso-mobile-header p {
    margin: 0.35rem 0 0;
    color: var(--p-text-muted-color, var(--p-grey-2));
    font-size: 0.83rem;
    line-height: 1.35;
}

.sso-mobile-actions {
    display: flex;
    gap: 0.45rem;
    flex-shrink: 0;
}

.sso-mobile-list {
    display: grid;
    gap: 0.75rem;
}

.sso-mobile-card {
    padding: 1rem;
    border: 1px solid var(--p-grey-4);
    border-radius: 1rem;
    background: var(--p-bg-color-1);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.sso-mobile-card-head {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.sso-mobile-icon {
    display: grid;
    width: 2.6rem;
    height: 2.6rem;
    place-items: center;
    border-radius: 0.8rem;
    color: var(--p-primary-color);
    background: color-mix(in srgb, var(--p-primary-color) 13%, transparent);
}

.sso-mobile-card-head > div {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    gap: 0.16rem;
}

.sso-mobile-card-head strong {
    overflow: hidden;
    font-size: 1rem;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.sso-mobile-card-head span:not(.sso-mobile-icon) {
    color: var(--p-text-muted-color, var(--p-grey-2));
    font-size: 0.78rem;
}

.sso-mobile-details {
    display: grid;
    gap: 0.55rem;
    margin: 1rem 0 0;
}

.sso-mobile-details div {
    display: grid;
    grid-template-columns: 5.8rem minmax(0, 1fr);
    align-items: center;
    gap: 0.75rem;
}

.sso-mobile-details dt {
    color: var(--p-text-muted-color, var(--p-grey-2));
    font-size: 0.75rem;
    font-weight: 700;
}

.sso-mobile-details dd {
    min-width: 0;
    margin: 0;
    overflow: hidden;
    font-size: 0.82rem;
    text-align: right;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.sso-mobile-empty {
    display: flex;
    min-height: 13rem;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    padding: 1.5rem;
    border: 1px dashed color-mix(in srgb, var(--p-primary-color) 26%, var(--p-grey-4));
    border-radius: 1rem;
    color: var(--p-text-muted-color, var(--p-grey-2));
    text-align: center;
}

.sso-mobile-empty i {
    color: var(--p-primary-color);
    font-size: 1.6rem;
}

.sso-mobile-empty strong {
    color: var(--p-text-color);
}

.sso-mobile-empty span {
    font-size: 0.84rem;
    line-height: 1.4;
}

@media (max-width: 767px) {
    main {
        height: auto;
        min-height: calc(100dvh - 4.25rem);
    }

    .content-wrapper {
        height: auto;
        padding: 0.75rem var(--app-page-padding-x);
    }
}
</style>
