<template>
    <div class="umu-page">
        <header class="umu-header">
            <div class="umu-header-copy">
                <div class="umu-title-row">
                    <span class="umu-icon"><i class="pi pi-briefcase"></i></span>
                    <div>
                        <span class="umu-eyebrow">УМУ</span>
                        <h2 class="m-0">ГПХ</h2>
                        <p class="text-color-secondary mt-2 mb-0">
                            Исполнители, договоры, решения УМУ и шаблоны документов.
                        </p>
                    </div>
                </div>
            </div>
            <div class="umu-header-side">
                <div class="umu-stats">
                    <div v-if="canReadResponsible || canReadEmployee" class="umu-stat">
                        <span>Исполнители</span>
                        <strong>{{ executorTotal }}</strong>
                    </div>
                    <div v-if="canReadResponsible || canReadEmployee" class="umu-stat">
                        <span>Договоры</span>
                        <strong>{{ agreementTotal }}</strong>
                    </div>
                    <div v-if="canReadEmployee" class="umu-stat accent">
                        <span>На решении</span>
                        <strong>{{ decisionTotal }}</strong>
                    </div>
                </div>
                <Button class="umu-refresh" icon="pi pi-refresh" label="Обновить" outlined severity="secondary" :loading="loading" @click="refreshActiveTab" />
            </div>
        </header>

        <nav v-if="visibleTabs.length" class="umu-tabs" aria-label="Разделы УМУ">
            <button
                v-for="tab in visibleTabs"
                :key="tab.value"
                type="button"
                class="umu-tab"
                :class="{ 'umu-tab-active': activeTab === tab.value }"
                @click="activeTab = tab.value"
            >
                <i :class="tab.icon"></i>
                <span>{{ tab.label }}</span>
            </button>
        </nav>

        <Message v-else severity="warn" :closable="false">
            Для раздела УМУ не найдены полномочия. Обратитесь к администратору системы.
        </Message>

        <section v-if="activeTab === 'executors'" class="umu-section">
            <div class="umu-toolbar">
                <IconField class="umu-search">
                    <InputIcon class="pi pi-search" />
                    <InputText v-model.trim="executorFilters.executorPartOfName" placeholder="Поиск по ФИО исполнителя" @keyup.enter="applyExecutorFilters" />
                </IconField>
                <div class="umu-actions">
                    <Button icon="pi pi-filter" label="Найти" @click="applyExecutorFilters" />
                    <Button icon="pi pi-eraser" outlined severity="secondary" @click="resetExecutorFilters" />
                    <Button v-if="canCreateResponsible" icon="pi pi-plus" label="Исполнитель" @click="openExecutorDialog()" />
                </div>
            </div>

            <Card class="umu-table-shell">
                <template #title>
                    <div class="umu-card-title">
                        <i class="pi pi-users"></i>
                        <span>Исполнители</span>
                    </div>
                </template>
                <template #subtitle>Список исполнителей, доступных текущему пользователю.</template>
                <template #content>
                    <DataTable
                        lazy
                        :paginator="executorTotal > 0"
                        stripedRows
                        scrollable
                        :rows="executorPage.pageSize"
                        :totalRecords="executorTotal"
                        :value="executors"
                        :loading="executorLoading"
                        :rowsPerPageOptions="[5, 10, 20]"
                        :rowClass="getExecutorRowClass"
                        @page="onExecutorPage"
                        @row-click="onExecutorRowClick"
                    >
                        <template #empty>
                            <div class="umu-empty">
                                <i class="pi pi-users"></i>
                                <strong>Исполнители не найдены</strong>
                                <span>Создайте исполнителя или измените фильтр.</span>
                            </div>
                        </template>

                        <Column header="Исполнитель" style="min-width: 240px;">
                            <template #body="{ data }">
                                <div class="umu-main-cell">
                                    <strong>{{ buildExecutorFullName(data) || '-' }}</strong>
                                    <span>{{ data.email || 'Email не указан' }}</span>
                                </div>
                            </template>
                        </Column>
                        <Column field="phoneNumber" header="Телефон" style="min-width: 150px;" />
                        <Column field="address" header="Адрес" style="min-width: 280px;">
                            <template #body="{ data }">
                                {{ data.address || '-' }}
                            </template>
                        </Column>
                        <Column header="Действия" style="min-width: 250px;">
                            <template #body="{ data }">
                                <div class="umu-row-actions">
                                    <Button
                                        icon="pi pi-file"
                                        label="ПДн"
                                        size="small"
                                        outlined
                                        :loading="documentLoading === `personal-${data.versionId}`"
                                        @click.stop="downloadPersonalData(data)"
                                    />
                                    <Button
                                        v-if="canCreateResponsible"
                                        icon="pi pi-wallet"
                                        label="Реквизиты"
                                        size="small"
                                        outlined
                                        severity="secondary"
                                        @click.stop="openPaymentDialog(data)"
                                    />
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </section>

        <section v-if="activeTab === 'agreements'" class="umu-section">
            <div class="umu-toolbar">
                <div class="umu-filter-grid">
                    <IconField>
                        <InputIcon class="pi pi-search" />
                        <InputText v-model.trim="agreementFilters.executorPartOfName" placeholder="Исполнитель" @keyup.enter="applyAgreementFilters" />
                    </IconField>
                    <Select v-model="agreementFilters.isClosed" :options="closedOptions" optionLabel="label" optionValue="value" placeholder="Статус закрытия" showClear />
                    <Select v-if="canReadEmployee" v-model="agreementFilters.isApproved" :options="approvalOptions" optionLabel="label" optionValue="value" placeholder="Решение" showClear />
                </div>
                <div class="umu-actions">
                    <Button icon="pi pi-filter" label="Найти" @click="applyAgreementFilters" />
                    <Button icon="pi pi-eraser" outlined severity="secondary" @click="resetAgreementFilters" />
                    <Button v-if="canCreateResponsible" icon="pi pi-plus" label="Договор" @click="openAgreementDialog()" />
                </div>
            </div>

            <Card class="umu-table-shell">
                <template #title>
                    <div class="umu-card-title">
                        <i class="pi pi-file-edit"></i>
                        <span>Договоры</span>
                    </div>
                </template>
                <template #subtitle>Плановые периоды, услуги, суммы и документы по договорам.</template>
                <template #content>
                    <DataTable
                        lazy
                        :paginator="agreementTotal > 0"
                        stripedRows
                        scrollable
                        :rows="agreementPage.pageSize"
                        :totalRecords="agreementTotal"
                        :value="agreements"
                        :loading="agreementLoading"
                        :rowsPerPageOptions="[5, 10, 20]"
                        :rowClass="getAgreementRowClass"
                        @page="onAgreementPage"
                        @row-click="onAgreementRowClick"
                    >
                        <template #empty>
                            <div class="umu-empty">
                                <i class="pi pi-file-edit"></i>
                                <strong>Договоры не найдены</strong>
                                <span>Создайте договор или измените фильтры.</span>
                            </div>
                        </template>

                        <Column header="Исполнитель" style="min-width: 240px;">
                            <template #body="{ data }">
                                {{ buildExecutorFullName(data.executor) || '-' }}
                            </template>
                        </Column>
                        <Column header="Период" style="min-width: 210px;">
                            <template #body="{ data }">
                                {{ formatUmuDisplayDate(data.plannedStartAgreementDate) }} - {{ formatUmuDisplayDate(data.plannedEndAgreementDate) }}
                            </template>
                        </Column>
                        <Column header="Услуги" style="min-width: 240px;">
                            <template #body="{ data }">
                                {{ buildServicesSummary(data.services) }}
                            </template>
                        </Column>
                        <Column header="Сумма" style="min-width: 140px;">
                            <template #body="{ data }">
                                {{ formatAgreementSum(data) }}
                            </template>
                        </Column>
                        <Column header="Статус" style="min-width: 140px;">
                            <template #body="{ data }">
                                <Tag :value="getUmuAgreementStatus(data).label" :severity="getUmuAgreementStatus(data).severity" />
                            </template>
                        </Column>
                        <Column v-if="showAgreementActionsColumn" header="Действия" style="min-width: 260px;">
                            <template #body="{ data }">
                                <div class="umu-row-actions">
                                    <Button
                                        v-if="data.isApproved && !data.isClosed"
                                        icon="pi pi-print"
                                        label="Печать"
                                        size="small"
                                        :loading="documentLoading === `agreement-${data.id}`"
                                        @click.stop="downloadAgreement(data)"
                                    />
                                    <Button
                                        v-if="data.isApproved"
                                        :icon="data.isClosed ? 'pi pi-download' : 'pi pi-lock'"
                                        :label="data.isClosed ? 'Закрыт' : 'Закрыть'"
                                        size="small"
                                        outlined
                                        severity="secondary"
                                        @click.stop="openCloseDialog(data)"
                                    />
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </section>

        <section v-if="activeTab === 'decisions'" class="umu-section">
            <Card class="umu-table-shell">
                <template #title>
                    <div class="umu-card-title">
                        <i class="pi pi-check-circle"></i>
                        <span>Договоры без решения</span>
                    </div>
                </template>
                <template #subtitle>Очередь договоров, которые ожидают принятия или отклонения.</template>
                <template #content>
                    <DataTable
                        lazy
                        :paginator="decisionTotal > 0"
                        stripedRows
                        scrollable
                        :rows="decisionPage.pageSize"
                        :totalRecords="decisionTotal"
                        :value="decisionAgreements"
                        :loading="decisionLoading"
                        :rowsPerPageOptions="[5, 10, 20]"
                        @page="onDecisionPage"
                    >
                        <template #empty>
                            <div class="umu-empty">
                                <i class="pi pi-check-circle"></i>
                                <strong>Нет договоров на решении</strong>
                                <span>Очередь решений пуста.</span>
                            </div>
                        </template>

                        <Column header="Исполнитель" style="min-width: 240px;">
                            <template #body="{ data }">
                                {{ buildExecutorFullName(data.executor) || '-' }}
                            </template>
                        </Column>
                        <Column header="Период" style="min-width: 210px;">
                            <template #body="{ data }">
                                {{ formatUmuDisplayDate(data.plannedStartAgreementDate) }} - {{ formatUmuDisplayDate(data.plannedEndAgreementDate) }}
                            </template>
                        </Column>
                        <Column header="Услуги" style="min-width: 260px;">
                            <template #body="{ data }">
                                {{ buildServicesSummary(data.services) }}
                            </template>
                        </Column>
                        <Column header="Действия" style="min-width: 220px;">
                            <template #body="{ data }">
                                <Button icon="pi pi-send" label="Создать решение" size="small" @click.stop="openSolutionDialog(data)" />
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </section>

        <section v-if="activeTab === 'templates'" class="umu-section">
            <Card class="umu-template-card">
                <template #title>
                    <div class="umu-card-title">
                        <i class="pi pi-file-word"></i>
                        <span>Шаблоны документов</span>
                    </div>
                </template>
                <template #subtitle>Администратор системы управляет только актуальными шаблонами.</template>
                <template #content>
                    <div class="umu-template-layout">
                        <div class="umu-field">
                            <label for="umu-template-type">Тип шаблона</label>
                            <Select
                                id="umu-template-type"
                                v-model="templateForm.teplateTypeId"
                                :options="templateTypes"
                                optionLabel="name"
                                optionValue="id"
                                placeholder="Выберите тип"
                                @change="loadActualTemplate"
                            />
                        </div>
                        <div class="umu-field">
                            <label for="umu-template-name">Название</label>
                            <InputText id="umu-template-name" v-model.trim="templateForm.name" placeholder="Название шаблона" />
                        </div>
                        <div class="umu-field">
                            <label>Файл шаблона</label>
                            <FileDropzone
                                accept=".doc,.docx,.odt"
                                compact
                                icon="pi pi-file-word"
                                title="Перетащите шаблон"
                                :subtitle="templateFileName || 'или нажмите, чтобы выбрать DOC/DOCX/ODT'"
                                @select="handleTemplateFile"
                            />
                        </div>
                        <Button
                            icon="pi pi-upload"
                            label="Установить шаблон"
                            :loading="templateSaving"
                            :disabled="!canCreateSu || templateForm.teplateTypeId === null || templateForm.teplateTypeId === undefined || !templateForm.name || !templateForm.content"
                            @click="saveTemplate"
                        />
                    </div>
                </template>
            </Card>
        </section>

        <Dialog v-model:visible="executorDialogVisible" modal :header="executorForm.versionId ? 'Изменить исполнителя' : 'Создать исполнителя'" class="umu-dialog" :style="{ width: 'min(980px, calc(100vw - 2rem))' }">
            <div class="umu-form-sections">
                <section class="umu-form-section">
                    <div class="umu-section-title">
                        <i class="pi pi-user"></i>
                        <div>
                            <strong>Основные данные</strong>
                            <span>ФИО и базовая информация исполнителя</span>
                        </div>
                    </div>
                    <div class="umu-form-grid compact">
                        <div class="umu-field">
                            <label for="executor-last-name">Фамилия</label>
                            <InputText id="executor-last-name" v-model.trim="executorForm.lastName" />
                        </div>
                        <div class="umu-field">
                            <label for="executor-first-name">Имя</label>
                            <InputText id="executor-first-name" v-model.trim="executorForm.firstName" />
                        </div>
                        <div class="umu-field">
                            <label for="executor-middle-name">Отчество</label>
                            <InputText id="executor-middle-name" v-model.trim="executorForm.middleName" />
                        </div>
                        <div class="umu-field">
                            <label for="executor-birth">Дата рождения</label>
                            <DatePicker id="executor-birth" v-model="executorForm.dateOfBirth" showIcon showButtonBar :manualInput="false" />
                        </div>
                        <div class="umu-field">
                            <label for="executor-citizenship">Гражданство</label>
                            <InputText id="executor-citizenship" v-model.trim="executorForm.citizenship" />
                        </div>
                    </div>
                </section>

                <section class="umu-form-section">
                    <div class="umu-section-title">
                        <i class="pi pi-id-card"></i>
                        <div>
                            <strong>Документы</strong>
                            <span>Паспортные данные и идентификаторы</span>
                        </div>
                    </div>
                    <div class="umu-form-grid compact">
                        <div class="umu-field">
                            <label for="executor-passport-series">Серия паспорта</label>
                            <InputMask
                                id="executor-passport-series"
                                v-model="executorForm.passportSeries"
                                mask="9999"
                                placeholder="0000"
                            />
                        </div>
                        <div class="umu-field">
                            <label for="executor-passport-number">Номер паспорта</label>
                            <InputMask
                                id="executor-passport-number"
                                v-model="executorForm.passportNumber"
                                mask="999999"
                                placeholder="000000"
                            />
                        </div>
                        <div class="umu-field">
                            <label for="executor-passport-date">Дата выдачи</label>
                            <DatePicker id="executor-passport-date" v-model="executorForm.passportIssueDate" showIcon showButtonBar :manualInput="false" />
                        </div>
                        <div class="umu-field umu-span-2">
                            <label for="executor-passport-place">Кем выдан</label>
                            <InputText id="executor-passport-place" v-model.trim="executorForm.passportIssuePlace" />
                        </div>
                        <div class="umu-field">
                            <label for="executor-snils">СНИЛС</label>
                            <InputMask
                                id="executor-snils"
                                v-model="executorForm.snils"
                                mask="999-999-999 99"
                                placeholder="000-000-000 00"
                            />
                        </div>
                        <div class="umu-field">
                            <label for="executor-inn">ИНН</label>
                            <InputMask
                                id="executor-inn"
                                v-model="executorForm.inn"
                                mask="999999999999"
                                placeholder="000000000000"
                            />
                        </div>
                    </div>
                </section>

                <section class="umu-form-section">
                    <div class="umu-section-title">
                        <i class="pi pi-map-marker"></i>
                        <div>
                            <strong>Контакты и адрес</strong>
                            <span>Как связаться с исполнителем и что попадет в документы</span>
                        </div>
                    </div>
                    <div class="umu-form-grid compact">
                        <div class="umu-field">
                            <label for="executor-phone">Телефон</label>
                            <InputMask
                                id="executor-phone"
                                v-model="executorForm.phoneNumber"
                                mask="+7 (999) 999-99-99"
                                placeholder="+7 (___) ___-__-__"
                            />
                        </div>
                        <div class="umu-field">
                            <label for="executor-email">Email</label>
                            <InputText
                                id="executor-email"
                                v-model.trim="executorForm.email"
                                type="email"
                                placeholder="name@example.ru"
                            />
                        </div>
                        <div class="umu-field umu-span-all">
                            <label for="executor-address">Адрес регистрации</label>
                            <InputText
                                id="executor-address"
                                v-model.trim="executorForm.address"
                                placeholder="644000, Омск, ул. Ленина, д. 1, кв. 1"
                            />
                            <small>Укажите одной строкой: почтовый индекс, населенный пункт, улица, дом, квартира.</small>
                        </div>
                    </div>
                </section>
            </div>
            <template #footer>
                <Button label="Отмена" icon="pi pi-times" text severity="secondary" :disabled="executorSaving" @click="executorDialogVisible = false" />
                <Button label="Сохранить" icon="pi pi-check" :loading="executorSaving" @click="saveExecutor" />
            </template>
        </Dialog>

        <Dialog v-model:visible="paymentDialogVisible" modal header="Реквизиты исполнителя" class="umu-dialog" :style="{ width: 'min(860px, calc(100vw - 2rem))' }">
            <div class="umu-payment-head">
                <strong>{{ buildExecutorFullName(selectedExecutor) }}</strong>
                <Button v-if="canCreateResponsible" icon="pi pi-plus" label="Новые реквизиты" size="small" @click="openPaymentForm()" />
            </div>
            <DataTable
                :value="paymentDetails"
                :loading="paymentLoading"
                stripedRows
                :rowClass="getPaymentDetailsRowClass"
                @row-click="onPaymentDetailsRowClick"
            >
                <template #empty>
                    <div class="umu-empty compact">Реквизиты не найдены</div>
                </template>
                <Column header="Банк">
                    <template #body="{ data }">{{ data.bank?.name || '-' }}</template>
                </Column>
                <Column field="bik" header="БИК" />
                <Column field="currentAccount" header="Расчетный счет" />
            </DataTable>

            <div v-if="paymentFormVisible" class="umu-payment-form">
                <Divider />
                <div class="umu-form-grid">
                    <div class="umu-field">
                        <label for="payment-bank">Банк</label>
                        <AutoComplete
                            id="payment-bank"
                            v-model="selectedBank"
                            :suggestions="bankSuggestions"
                            optionLabel="name"
                            dropdown
                            :loading="bankLoading"
                            placeholder="Выберите или введите новый банк"
                            emptyMessage="Банк не найден"
                            @update:modelValue="handleBankModelUpdate"
                            @complete="searchBankOptions"
                            @item-select="handleBankSelect"
                        >
                            <template #option="{ option }">
                                <div class="umu-bank-option">
                                    <strong>{{ option.name }}</strong>
                                    <span v-if="getBankBik(option) || getBankCorrespondentAccount(option)">
                                        {{ getBankBik(option) || 'БИК не указан' }}
                                        <template v-if="getBankCorrespondentAccount(option)"> · к/с {{ getBankCorrespondentAccount(option) }}</template>
                                    </span>
                                </div>
                            </template>
                        </AutoComplete>
                    </div>
                    <div class="umu-field">
                        <label for="payment-bik">БИК</label>
                        <InputMask id="payment-bik" v-model="paymentForm.bik" mask="999999999" placeholder="000000000" />
                    </div>
                    <div class="umu-field">
                        <label for="payment-current">Расчетный счет</label>
                        <InputMask id="payment-current" v-model="paymentForm.currentAccount" mask="99999999999999999999" placeholder="00000000000000000000" />
                    </div>
                    <div class="umu-field">
                        <label for="payment-correspondent">Корреспондентский счет</label>
                        <InputMask id="payment-correspondent" v-model="paymentForm.correspondentAccount" mask="99999999999999999999" placeholder="00000000000000000000" />
                    </div>
                </div>
                <div class="umu-form-actions">
                    <Button label="Сохранить реквизиты" icon="pi pi-check" :loading="paymentSaving" @click="savePaymentDetails" />
                </div>
            </div>
        </Dialog>

        <Dialog v-model:visible="agreementDialogVisible" modal :header="agreementForm.id ? 'Изменить договор' : 'Создать договор'" class="umu-dialog" :style="{ width: 'min(780px, calc(100vw - 2rem))' }">
            <div class="umu-form-sections">
                <section class="umu-form-section agreement-section">
                    <div class="umu-section-title">
                        <i class="pi pi-user"></i>
                        <div>
                            <strong>Исполнитель</strong>
                            <span>Кто оказывает услуги и куда перечислять оплату</span>
                        </div>
                    </div>
                    <div class="umu-agreement-main-grid">
                        <div class="umu-field">
                            <label for="agreement-executor">Исполнитель</label>
                            <AutoComplete
                                id="agreement-executor"
                                v-model="selectedAgreementExecutor"
                                :suggestions="executorSuggestions"
                                optionLabel="fullName"
                                forceSelection
                                dropdown
                                :disabled="Boolean(agreementForm.id)"
                                :loading="executorSuggestLoading"
                                placeholder="Начните вводить ФИО исполнителя"
                                @complete="searchExecutorOptions"
                                @item-select="handleAgreementExecutorSelect"
                            />
                        </div>
                        <div class="umu-field">
                            <label for="agreement-payment">Реквизиты</label>
                            <Select
                                id="agreement-payment"
                                v-model="agreementForm.paymentDetailsId"
                                :options="agreementPaymentDetails"
                                optionLabel="label"
                                optionValue="id"
                                placeholder="Выберите реквизиты"
                            />
                        </div>
                    </div>
                </section>

                <section class="umu-form-section agreement-section">
                    <div class="umu-section-title">
                        <i class="pi pi-calendar-clock"></i>
                        <div>
                            <strong>Условия</strong>
                            <span>Плановый период, стоимость часа и приказ</span>
                        </div>
                    </div>
                    <div class="umu-agreement-details-grid">
                        <div class="umu-field">
                            <label for="agreement-hour-price">Цена часа</label>
                            <InputNumber id="agreement-hour-price" v-model="agreementForm.hourPrice" :minFractionDigits="0" :maxFractionDigits="2" :useGrouping="false" />
                        </div>
                        <div class="umu-field">
                            <label for="agreement-start">Плановое начало</label>
                            <DatePicker id="agreement-start" v-model="agreementForm.plannedStartAgreementDate" showIcon showButtonBar :manualInput="false" />
                        </div>
                        <div class="umu-field">
                            <label for="agreement-end">Плановое окончание</label>
                            <DatePicker id="agreement-end" v-model="agreementForm.plannedEndAgreementDate" showIcon showButtonBar :manualInput="false" />
                        </div>
                        <div class="umu-field">
                            <label for="agreement-order-date">Дата приказа</label>
                            <DatePicker id="agreement-order-date" v-model="agreementForm.orderDate" showIcon showButtonBar :manualInput="false" />
                        </div>
                        <div class="umu-field umu-order-number-field">
                            <label for="agreement-order-number">Номер приказа</label>
                            <InputText id="agreement-order-number" v-model.trim="agreementForm.orderNumber" />
                        </div>
                    </div>
                </section>
            </div>

            <Divider />

            <div class="umu-services-editor">
                <div class="umu-payment-head">
                    <strong>Услуги и часы</strong>
                    <Button icon="pi pi-plus" label="Добавить услугу" size="small" outlined @click="addAgreementService" />
                </div>
                <div class="umu-inline-create-card">
                    <InputText
                        v-model.trim="newServiceName"
                        placeholder="Название новой услуги"
                        @keyup.enter="createAgreementService"
                    />
                    <Button
                        icon="pi pi-plus"
                        label="Создать услугу"
                        outlined
                        :loading="serviceCreating"
                        :disabled="!newServiceName"
                        @click="createAgreementService"
                    />
                </div>
                <div v-for="(service, index) in agreementServices" :key="service.uid" class="umu-service-row agreement">
                    <Select
                        v-model="service.serviceId"
                        :options="services"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Услуга"
                        filter
                        :loading="serviceLoading"
                        emptyMessage="Услуги не найдены"
                        emptyFilterMessage="Услуги не найдены"
                        @show="ensureServicesLoaded"
                    />
                    <InputNumber v-model="service.plannedHours" placeholder="План, ч" :minFractionDigits="0" :maxFractionDigits="2" :useGrouping="false" />
                    <Button class="umu-icon-button" icon="pi pi-trash" severity="danger" outlined @click="removeAgreementService(index)" />
                </div>
            </div>

            <template #footer>
                <Button label="Отмена" icon="pi pi-times" text severity="secondary" :disabled="agreementSaving" @click="agreementDialogVisible = false" />
                <Button label="Сохранить" icon="pi pi-check" :loading="agreementSaving" @click="saveAgreement" />
            </template>
        </Dialog>

        <Dialog v-model:visible="solutionDialogVisible" modal header="Решение по договору" class="umu-dialog" :style="{ width: 'min(680px, calc(100vw - 2rem))' }">
            <div class="umu-solution">
                <div class="umu-info-strip">
                    <span>{{ buildExecutorFullName(selectedAgreement?.executor) }}</span>
                    <strong>{{ formatAgreementSum(selectedAgreement) }}</strong>
                </div>
                <div class="umu-field">
                    <label for="solution-approved">Решение</label>
                    <Select id="solution-approved" v-model="solutionForm.isApproved" :options="solutionOptions" optionLabel="label" optionValue="value" />
                </div>
                <div v-if="solutionForm.isApproved === false" class="umu-field">
                    <label for="solution-comment">Причина отклонения</label>
                    <Textarea id="solution-comment" v-model.trim="solutionForm.disapprovedComment" rows="4" autoResize />
                </div>
            </div>
            <template #footer>
                <Button label="Отмена" icon="pi pi-times" text severity="secondary" :disabled="solutionSaving" @click="solutionDialogVisible = false" />
                <Button label="Сохранить решение" icon="pi pi-check" :loading="solutionSaving" @click="saveSolution" />
            </template>
        </Dialog>

        <Dialog v-model:visible="closeDialogVisible" modal :header="selectedAgreement?.isClosed ? 'Документы закрытия' : 'Закрыть договор'" class="umu-dialog" :style="{ width: 'min(760px, calc(100vw - 2rem))' }">
            <div class="umu-close-date-grid">
                <div class="umu-field">
                    <label for="close-start">Фактическое начало</label>
                    <DatePicker id="close-start" v-model="closeForm.factStartDate" showIcon showButtonBar :manualInput="false" :disabled="selectedAgreement?.isClosed" />
                </div>
                <div class="umu-field">
                    <label for="close-end">Фактическое окончание</label>
                    <DatePicker id="close-end" v-model="closeForm.factEndDate" showIcon showButtonBar :manualInput="false" :disabled="selectedAgreement?.isClosed" />
                </div>
            </div>

            <Divider />

            <div class="umu-services-editor">
                <strong>Фактическое время оказания услуг</strong>
                <div v-for="service in closeServices" :key="service.serviceId" class="umu-close-service-row">
                    <div class="umu-close-service-name">
                        <strong>{{ service.name }}</strong>
                        <span v-if="service.plannedHours">План: {{ service.plannedHours }} ч</span>
                    </div>
                    <div class="umu-close-service-hours">
                        <label>Факт, ч</label>
                        <InputNumber v-model="service.factHours" placeholder="0" :minFractionDigits="0" :maxFractionDigits="2" :useGrouping="false" :disabled="selectedAgreement?.isClosed" />
                    </div>
                </div>
            </div>

            <template #footer>
                <Button label="Отмена" icon="pi pi-times" text severity="secondary" :disabled="closeSaving" @click="closeDialogVisible = false" />
                <Button
                    :label="selectedAgreement?.isClosed ? 'Скачать документы' : 'Закрыть и скачать'"
                    :icon="selectedAgreement?.isClosed ? 'pi pi-download' : 'pi pi-lock'"
                    :loading="closeSaving"
                    @click="closeAgreement"
                />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { debounce } from 'lodash';
import { useToast } from 'primevue/usetoast';
import { usePermissionStore } from '@/stores/permissions.js';
import {
    addUmuSiriusAgreementSolution,
    createUmuSiriusAgreement,
    createUmuSiriusBank,
    createUmuSiriusExecutor,
    createUmuSiriusPaymentDetails,
    createUmuSiriusService,
    getUmuSiriusAgreementDocuments,
    getUmuSiriusAgreements,
    getUmuSiriusBanks,
    getUmuSiriusExecutors,
    getUmuSiriusPaymentDetails,
    getUmuSiriusPersonalDataAgreements,
    getUmuSiriusServices,
    getUmuSiriusTemplateTypes,
    getUmuSiriusTerminationDocuments,
    getUmuSiriusActualTemplate,
    searchUmuSiriusBanks,
    setUmuSiriusTemplate,
    umuSiriusEmployeeResource,
    umuSiriusResponsibleResource,
    umuSiriusSuResource,
    updateUmuSiriusAgreement,
    updateUmuSiriusExecutor,
    updateUmuSiriusPaymentDetails,
} from '@/api/umuSirius.js';
import { fileToBase64 } from '@/utils/ido.js';
import FileDropzone from '@/components/Utils/FileDropzone.vue';
import {
    UMU_DEFAULT_HOUR_PRICE,
    UMU_DEFAULT_ORDER_DATE,
    UMU_DEFAULT_ORDER_NUMBER,
    buildExecutorFullName,
    compactObject,
    downloadUmuDocuments,
    formatUmuCurrency,
    formatUmuDate,
    formatUmuDisplayDate,
    getUmuAgreementStatus,
    parseUmuDate,
} from '@/utils/umuSirius.js';

const toast = useToast();
const permissionStore = usePermissionStore();

const activeTab = ref('');
const loading = ref(false);
const documentLoading = ref('');

const canReadResponsible = computed(() => permissionStore.hasPermission(umuSiriusResponsibleResource, 'Read'));
const canCreateResponsible = computed(() => permissionStore.hasPermission(umuSiriusResponsibleResource, 'Create'));
const canUpdateResponsible = computed(() => permissionStore.hasPermission(umuSiriusResponsibleResource, 'Update'));
const canReadEmployee = computed(() => permissionStore.hasPermission(umuSiriusEmployeeResource, 'Read'));
const canUpdateEmployee = computed(() => permissionStore.hasPermission(umuSiriusEmployeeResource, 'Update'));
const canReadSu = computed(() => permissionStore.hasPermission(umuSiriusSuResource, 'Read'));
const canCreateSu = computed(() => permissionStore.hasPermission(umuSiriusSuResource, 'Create'));
const canUpdateExecutor = computed(() => canUpdateResponsible.value || canUpdateEmployee.value);
const isUmuEmployeeMode = computed(() => canReadEmployee.value);

const visibleTabs = computed(() => [
    { value: 'executors', label: 'Исполнители', icon: 'pi pi-users', visible: canReadResponsible.value || canReadEmployee.value },
    { value: 'agreements', label: 'Договоры', icon: 'pi pi-file-edit', visible: canReadResponsible.value || canReadEmployee.value },
    { value: 'decisions', label: 'Решения', icon: 'pi pi-check-circle', visible: canReadEmployee.value },
    { value: 'templates', label: 'Шаблоны', icon: 'pi pi-file-word', visible: canReadSu.value },
].filter((tab) => tab.visible));

const closedOptions = [
    { label: 'Открытые', value: false },
    { label: 'Закрытые', value: true },
];
const approvalOptions = [
    { label: 'Принятые', value: true },
    { label: 'Без принятия', value: false },
];
const solutionOptions = [
    { label: 'Принять', value: true },
    { label: 'Отклонить', value: false },
];

const executors = ref([]);
const executorTotal = ref(0);
const executorLoading = ref(false);
const executorPage = reactive({ page: 1, pageSize: 10 });
const executorFilters = reactive({ executorPartOfName: '' });

const agreements = ref([]);
const agreementTotal = ref(0);
const agreementLoading = ref(false);
const agreementPage = reactive({ page: 1, pageSize: 10 });
const agreementFilters = reactive({
    executorPartOfName: '',
    isClosed: null,
    isApproved: null,
});
const showAgreementActionsColumn = computed(() => agreements.value.some((agreement) => agreement.isApproved));

const decisionAgreements = ref([]);
const decisionTotal = ref(0);
const decisionLoading = ref(false);
const decisionPage = reactive({ page: 1, pageSize: 10 });

const services = ref([]);
const serviceLoading = ref(false);
const serviceCreating = ref(false);
const newServiceName = ref('');
const templateTypes = ref([]);
const templateSaving = ref(false);
const templateFileName = ref('');
const templateForm = reactive({
    name: '',
    content: '',
    teplateTypeId: null,
});

const executorDialogVisible = ref(false);
const executorSaving = ref(false);
const executorForm = reactive(createEmptyExecutorForm());

const selectedExecutor = ref(null);
const paymentDialogVisible = ref(false);
const paymentFormVisible = ref(false);
const paymentLoading = ref(false);
const paymentSaving = ref(false);
const paymentDetails = ref([]);
const paymentForm = reactive(createEmptyPaymentForm());
const selectedBank = ref(null);
const bankSuggestions = ref([]);
const bankLoading = ref(false);

const agreementDialogVisible = ref(false);
const agreementSaving = ref(false);
const agreementForm = reactive(createEmptyAgreementForm());
const agreementServices = ref([]);
const selectedAgreementExecutor = ref(null);
const agreementPaymentDetails = ref([]);
const executorSuggestions = ref([]);
const executorSuggestLoading = ref(false);
const removedAgreementServices = ref([]);

const selectedAgreement = ref(null);
const solutionDialogVisible = ref(false);
const solutionSaving = ref(false);
const solutionForm = reactive({
    isApproved: true,
    disapprovedComment: '',
});

const closeDialogVisible = ref(false);
const closeSaving = ref(false);
const closeForm = reactive({
    factStartDate: null,
    factEndDate: null,
});
const closeServices = ref([]);

function createEmptyExecutorForm() {
    return {
        versionId: '',
        firstName: '',
        lastName: '',
        middleName: '',
        dateOfBirth: null,
        passportNumber: '',
        passportSeries: '',
        passportIssueDate: null,
        passportIssuePlace: '',
        snils: '',
        inn: '',
        address: '',
        phoneNumber: '',
        email: '',
        citizenship: '',
    };
}

function createEmptyPaymentForm() {
    return {
        id: '',
        bankId: null,
        bik: '',
        currentAccount: '',
        correspondentAccount: '',
    };
}

function createEmptyAgreementForm() {
    return {
        id: '',
        executorVersionId: '',
        paymentDetailsId: '',
        plannedStartAgreementDate: null,
        plannedEndAgreementDate: null,
        hourPrice: UMU_DEFAULT_HOUR_PRICE,
        orderDate: parseUmuDate(UMU_DEFAULT_ORDER_DATE),
        orderNumber: UMU_DEFAULT_ORDER_NUMBER,
    };
}

function assignReactive(target, source) {
    Object.keys(target).forEach((key) => {
        target[key] = source[key];
    });
}

function resolveValues(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.values)) return data.values;
    if (Array.isArray(data?.entities)) return data.entities;
    return [];
}

function resolveTotal(data, fallbackLength = 0) {
    return Number(data?.valuesCount ?? data?.totalCount ?? data?.countAllEntities ?? fallbackLength);
}

function isFilledId(value) {
    return value !== null && value !== undefined && value !== '';
}

function buildAgreementFilters(pageState, filters = {}) {
    return compactObject({
        page: pageState.page,
        pageSize: pageState.pageSize,
        executorPartOfName: filters.executorPartOfName,
        isClosed: filters.isClosed,
        isApproved: filters.isApproved,
        isDisapprovedCommentExist: filters.isDisapprovedCommentExist,
    });
}

function buildServicesSummary(list = []) {
    if (!Array.isArray(list) || !list.length) return '-';

    return list
        .map((service) => {
            const hours = service.plannedNumberOfHours ?? service.factNumberOfHours;
            return `${service.name || 'Услуга'}${hours ? ` (${hours} ч.)` : ''}`;
        })
        .join(', ');
}

function formatAgreementSum(agreement) {
    const hours = (agreement?.services || []).reduce((sum, service) => sum + Number(service.plannedNumberOfHours || 0), 0);
    return formatUmuCurrency(hours * Number(agreement?.hourPrice || 0));
}

async function fetchExecutors() {
    executorLoading.value = true;

    try {
        const response = await getUmuSiriusExecutors(isUmuEmployeeMode.value, compactObject({
            page: executorPage.page,
            pageSize: executorPage.pageSize,
            executorPartOfName: executorFilters.executorPartOfName,
        }));
        executors.value = resolveValues(response.data);
        executorTotal.value = resolveTotal(response.data, executors.value.length);
    } catch (error) {
        console.debug('Ошибка загрузки исполнителей УМУ:', error);
        executors.value = [];
        executorTotal.value = 0;
        showError('Исполнители', 'Не удалось загрузить список исполнителей.');
    } finally {
        executorLoading.value = false;
    }
}

async function fetchAgreements() {
    agreementLoading.value = true;

    try {
        const response = await getUmuSiriusAgreements(
            isUmuEmployeeMode.value,
            buildAgreementFilters(agreementPage, agreementFilters)
        );
        agreements.value = resolveValues(response.data);
        agreementTotal.value = resolveTotal(response.data, agreements.value.length);
    } catch (error) {
        console.debug('Ошибка загрузки договоров УМУ:', error);
        agreements.value = [];
        agreementTotal.value = 0;
        showError('Договоры', 'Не удалось загрузить список договоров.');
    } finally {
        agreementLoading.value = false;
    }
}

async function fetchDecisions() {
    if (!canReadEmployee.value) return;

    decisionLoading.value = true;

    try {
        const response = await getUmuSiriusAgreements(true, buildAgreementFilters(decisionPage, {
            isApproved: false,
            isDisapprovedCommentExist: false,
        }));
        decisionAgreements.value = resolveValues(response.data);
        decisionTotal.value = resolveTotal(response.data, decisionAgreements.value.length);
    } catch (error) {
        console.debug('Ошибка загрузки решений УМУ:', error);
        decisionAgreements.value = [];
        decisionTotal.value = 0;
        showError('Решения', 'Не удалось загрузить очередь решений.');
    } finally {
        decisionLoading.value = false;
    }
}

async function fetchServices() {
    serviceLoading.value = true;

    try {
        const response = await getUmuSiriusServices(!canReadResponsible.value && canReadEmployee.value);
        services.value = resolveValues(response.data).filter((service) => (
            service?.id !== null && service?.id !== undefined && service?.name
        ));
    } catch (error) {
        console.debug('Ошибка загрузки услуг УМУ:', error);
        services.value = [];
        showError('Услуги', 'Не удалось загрузить список услуг.');
    } finally {
        serviceLoading.value = false;
    }
}

function ensureServicesLoaded() {
    if (!services.value.length && !serviceLoading.value) {
        fetchServices();
    }
}

async function fetchTemplateTypes() {
    if (!canReadSu.value) return;

    try {
        const response = await getUmuSiriusTemplateTypes();
        templateTypes.value = resolveValues(response.data);
    } catch (error) {
        console.debug('Ошибка загрузки типов шаблонов УМУ:', error);
        templateTypes.value = [];
    }
}

function applyExecutorFilters() {
    executorPage.page = 1;
    fetchExecutors();
}

function resetExecutorFilters() {
    executorFilters.executorPartOfName = '';
    applyExecutorFilters();
}

function applyAgreementFilters() {
    agreementPage.page = 1;
    fetchAgreements();
}

function resetAgreementFilters() {
    agreementFilters.executorPartOfName = '';
    agreementFilters.isClosed = null;
    agreementFilters.isApproved = null;
    applyAgreementFilters();
}

function onExecutorPage(event) {
    executorPage.page = event.page + 1;
    executorPage.pageSize = event.rows;
    fetchExecutors();
}

function onAgreementPage(event) {
    agreementPage.page = event.page + 1;
    agreementPage.pageSize = event.rows;
    fetchAgreements();
}

function onDecisionPage(event) {
    decisionPage.page = event.page + 1;
    decisionPage.pageSize = event.rows;
    fetchDecisions();
}

function openExecutorDialog(executor = null) {
    assignReactive(executorForm, createEmptyExecutorForm());

    if (executor) {
        assignReactive(executorForm, {
            versionId: executor.versionId || '',
            firstName: executor.firstName || '',
            lastName: executor.lastName || '',
            middleName: executor.middleName || '',
            dateOfBirth: parseUmuDate(executor.dateOfBirth),
            passportNumber: executor.passportNumber || '',
            passportSeries: executor.passportSeries || '',
            passportIssueDate: parseUmuDate(executor.passportIssueDate),
            passportIssuePlace: executor.passportIssuePlace || '',
            snils: executor.snils || '',
            inn: executor.inn || '',
            address: executor.address || '',
            phoneNumber: executor.phoneNumber || '',
            email: executor.email || '',
            citizenship: executor.citizenship || '',
        });
    }

    executorDialogVisible.value = true;
}

function getExecutorRowClass() {
    return canUpdateExecutor.value ? 'umu-clickable-row' : '';
}

function onExecutorRowClick(event) {
    if (!canUpdateExecutor.value) return;

    openExecutorDialog(event.data);
}

function buildExecutorPayload() {
    return compactObject({
        firstName: executorForm.firstName,
        lastName: executorForm.lastName,
        middleName: executorForm.middleName,
        dateOfBirth: formatUmuDate(executorForm.dateOfBirth),
        passportNumber: executorForm.passportNumber,
        passportSeries: executorForm.passportSeries,
        passportIssueDate: formatUmuDate(executorForm.passportIssueDate),
        passportIssuePlace: executorForm.passportIssuePlace,
        snils: executorForm.snils,
        inn: executorForm.inn,
        address: executorForm.address,
        phoneNumber: executorForm.phoneNumber,
        email: executorForm.email,
        citizenship: executorForm.citizenship,
    });
}

async function saveExecutor() {
    if (!executorForm.firstName || !executorForm.lastName) {
        showWarn('Исполнитель', 'Заполните имя и фамилию.');
        return;
    }

    executorSaving.value = true;

    try {
        if (executorForm.versionId) {
            await updateUmuSiriusExecutor(executorForm.versionId, buildExecutorPayload());
        } else {
            await createUmuSiriusExecutor(buildExecutorPayload());
        }
        executorDialogVisible.value = false;
        await fetchExecutors();
        showSuccess('Исполнитель', 'Данные исполнителя сохранены.');
    } catch (error) {
        console.debug('Ошибка сохранения исполнителя УМУ:', error);
        showError('Исполнитель', 'Не удалось сохранить исполнителя.');
    } finally {
        executorSaving.value = false;
    }
}

async function downloadPersonalData(executor) {
    documentLoading.value = `personal-${executor.versionId}`;

    try {
        const response = await getUmuSiriusPersonalDataAgreements(executor.versionId, isUmuEmployeeMode.value);
        const count = downloadUmuDocuments(response.data);
        if (!count) throw new Error('Пустой ответ');
    } catch (error) {
        console.debug('Ошибка загрузки соглашения ПДн УМУ:', error);
        showError('Соглашение ПДн', 'Не удалось скачать документы исполнителя.');
    } finally {
        documentLoading.value = '';
    }
}

async function openPaymentDialog(executor) {
    selectedExecutor.value = executor;
    paymentDialogVisible.value = true;
    paymentFormVisible.value = false;
    await loadPaymentDetails();
}

async function loadPaymentDetails() {
    if (!selectedExecutor.value?.versionId) return;

    paymentLoading.value = true;

    try {
        const response = await getUmuSiriusPaymentDetails(selectedExecutor.value.versionId, {
            page: 1,
            pageSize: 100,
        });
        paymentDetails.value = resolveValues(response.data);
    } catch (error) {
        console.debug('Ошибка загрузки реквизитов УМУ:', error);
        paymentDetails.value = [];
    } finally {
        paymentLoading.value = false;
    }
}

function openPaymentForm(details = null) {
    assignReactive(paymentForm, createEmptyPaymentForm());
    selectedBank.value = null;

    if (details) {
        assignReactive(paymentForm, {
            id: details.id || '',
            bankId: details.bank?.id || null,
            bik: details.bik || '',
            currentAccount: details.currentAccount || '',
            correspondentAccount: details.correspondentAccount || '',
        });
        selectedBank.value = details.bank || null;
    }

    paymentFormVisible.value = true;
}

function getPaymentDetailsRowClass() {
    return 'umu-clickable-row';
}

function onPaymentDetailsRowClick(event) {
    openPaymentForm(event.data);
}

const loadBanksDebounced = debounce(async (query) => {
    bankLoading.value = true;

    try {
        const response = query?.trim()
            ? await searchUmuSiriusBanks(query.trim())
            : await getUmuSiriusBanks();
        bankSuggestions.value = resolveValues(response.data).filter((bank) => bank?.id && bank?.name);
    } catch (error) {
        console.debug('Ошибка поиска банков УМУ:', error);
        bankSuggestions.value = [];
    } finally {
        bankLoading.value = false;
    }
}, 250);

function searchBankOptions(event) {
    loadBanksDebounced(event.query);
}

function getBankBik(bank = {}) {
    return bank.bik || bank.bic || bank.bankBik || bank.bankBIK || '';
}

function getBankCorrespondentAccount(bank = {}) {
    return bank.correspondentAccount
        || bank.correspondent_account
        || bank.correspondentAccountNumber
        || bank.corrAccount
        || bank.correspondent
        || '';
}

function handleBankSelect(event) {
    const bank = event.value || {};
    const bik = getBankBik(bank);
    const correspondentAccount = getBankCorrespondentAccount(bank);

    paymentForm.bankId = bank.id || null;
    if (bik) paymentForm.bik = bik;
    if (correspondentAccount) paymentForm.correspondentAccount = correspondentAccount;
}

function handleBankModelUpdate(value) {
    if (typeof value === 'string') {
        paymentForm.bankId = null;
        return;
    }

    if (value?.id) {
        handleBankSelect({ value });
    }
}

function getSelectedBankName() {
    if (typeof selectedBank.value === 'string') {
        return selectedBank.value.trim();
    }

    return selectedBank.value?.name?.trim() || '';
}

async function ensurePaymentBankSelected() {
    if (paymentForm.bankId) return true;

    const bankName = getSelectedBankName();
    if (!bankName) return false;

    const createdResponse = await createUmuSiriusBank(bankName);
    const createdBank = createdResponse.data && typeof createdResponse.data === 'object'
        ? createdResponse.data
        : null;

    if (createdBank?.id) {
        selectedBank.value = createdBank;
        handleBankSelect({ value: createdBank });
        return true;
    }

    const searchResponse = await searchUmuSiriusBanks(bankName);
    const foundBank = resolveValues(searchResponse.data).find((bank) => (
        bank?.name?.trim().toLowerCase() === bankName.toLowerCase()
    )) || resolveValues(searchResponse.data)[0];

    if (foundBank?.id) {
        selectedBank.value = foundBank;
        handleBankSelect({ value: foundBank });
        return true;
    }

    throw new Error('Созданный банк не найден');
}

async function savePaymentDetails() {
    if (!selectedExecutor.value?.versionId || (!paymentForm.bankId && !getSelectedBankName())) {
        showWarn('Реквизиты', 'Выберите банк или введите новый.');
        return;
    }

    paymentSaving.value = true;

    try {
        await ensurePaymentBankSelected();

        const payload = compactObject({
            bankId: paymentForm.bankId,
            bik: paymentForm.bik,
            currentAccount: paymentForm.currentAccount,
            correspondentAccount: paymentForm.correspondentAccount,
        });

        if (paymentForm.id) {
            await updateUmuSiriusPaymentDetails(paymentForm.id, payload);
        } else {
            await createUmuSiriusPaymentDetails(selectedExecutor.value.versionId, payload);
        }
        paymentFormVisible.value = false;
        await loadPaymentDetails();
        showSuccess('Реквизиты', 'Реквизиты сохранены.');
    } catch (error) {
        console.debug('Ошибка сохранения реквизитов УМУ:', error);
        showError('Реквизиты', 'Не удалось сохранить реквизиты.');
    } finally {
        paymentSaving.value = false;
    }
}

function openAgreementDialog(agreement = null) {
    assignReactive(agreementForm, createEmptyAgreementForm());
    agreementServices.value = [];
    removedAgreementServices.value = [];
    selectedAgreementExecutor.value = null;
    agreementPaymentDetails.value = [];

    if (agreement) {
        selectedAgreement.value = agreement;
        selectedAgreementExecutor.value = {
            ...agreement.executor,
            fullName: buildExecutorFullName(agreement.executor),
        };
        assignReactive(agreementForm, {
            id: agreement.id || '',
            executorVersionId: agreement.executor?.versionId || '',
            paymentDetailsId: agreement.paymentDetails?.id || '',
            plannedStartAgreementDate: parseUmuDate(agreement.plannedStartAgreementDate),
            plannedEndAgreementDate: parseUmuDate(agreement.plannedEndAgreementDate),
            hourPrice: Number(agreement.hourPrice || UMU_DEFAULT_HOUR_PRICE),
            orderDate: parseUmuDate(agreement.orderDate || UMU_DEFAULT_ORDER_DATE),
            orderNumber: agreement.orderNumber || UMU_DEFAULT_ORDER_NUMBER,
        });
        agreementServices.value = (agreement.services || []).map((service) => ({
            uid: crypto.randomUUID(),
            serviceId: service.id,
            plannedHours: service.plannedNumberOfHours ?? null,
        }));
        loadAgreementPaymentDetails(agreement.executor?.versionId);
    } else {
        addAgreementService();
    }

    agreementDialogVisible.value = true;
}

function canEditAgreementRow(agreement) {
    return canUpdateResponsible.value && !agreement?.isClosed;
}

function getAgreementRowClass(agreement) {
    return canEditAgreementRow(agreement) ? 'umu-clickable-row' : '';
}

function onAgreementRowClick(event) {
    if (!canEditAgreementRow(event.data)) return;

    openAgreementDialog(event.data);
}

const loadExecutorsDebounced = debounce(async (query) => {
    executorSuggestLoading.value = true;

    try {
        const response = await getUmuSiriusExecutors(isUmuEmployeeMode.value, compactObject({
            page: 1,
            pageSize: 20,
            executorPartOfName: query?.trim(),
        }));
        executorSuggestions.value = resolveValues(response.data).map((executor) => ({
            ...executor,
            fullName: buildExecutorFullName(executor),
        }));
    } catch (error) {
        console.debug('Ошибка поиска исполнителей УМУ:', error);
        executorSuggestions.value = [];
    } finally {
        executorSuggestLoading.value = false;
    }
}, 250);

function searchExecutorOptions(event) {
    loadExecutorsDebounced(event.query);
}

function handleAgreementExecutorSelect(event) {
    const executor = event.value;
    agreementForm.executorVersionId = executor.versionId;
    agreementForm.paymentDetailsId = '';
    loadAgreementPaymentDetails(executor.versionId);
}

async function loadAgreementPaymentDetails(executorVersionId) {
    if (!executorVersionId) return;

    try {
        const response = await getUmuSiriusPaymentDetails(executorVersionId, {
            page: 1,
            pageSize: 100,
        });
        agreementPaymentDetails.value = resolveValues(response.data).map((details) => ({
            ...details,
            label: `${details.bank?.name || 'Банк'} · ${details.currentAccount || 'счет не указан'}`,
        }));
    } catch (error) {
        console.debug('Ошибка загрузки реквизитов для договора УМУ:', error);
        agreementPaymentDetails.value = [];
    }
}

function addAgreementService() {
    agreementServices.value.push({
        uid: crypto.randomUUID(),
        serviceId: null,
        plannedHours: null,
    });
}

function selectAgreementService(serviceId) {
    const emptyRow = agreementServices.value.find((service) => !isFilledId(service.serviceId));

    if (emptyRow) {
        emptyRow.serviceId = serviceId;
        return;
    }

    agreementServices.value.push({
        uid: crypto.randomUUID(),
        serviceId,
        plannedHours: null,
    });
}

async function createAgreementService() {
    const serviceName = newServiceName.value.trim();
    if (!serviceName) {
        showWarn('Услуги', 'Введите название услуги.');
        return;
    }

    const existingService = services.value.find((service) => (
        service?.name?.trim().toLowerCase() === serviceName.toLowerCase()
    ));

    if (existingService) {
        selectAgreementService(existingService.id);
        newServiceName.value = '';
        showWarn('Услуги', 'Такая услуга уже есть в справочнике.');
        return;
    }

    serviceCreating.value = true;

    try {
        await createUmuSiriusService({ name: serviceName });
        await fetchServices();

        const createdService = services.value.find((service) => (
            service?.name?.trim().toLowerCase() === serviceName.toLowerCase()
        ));

        if (createdService) {
            selectAgreementService(createdService.id);
        }

        newServiceName.value = '';
        showSuccess('Услуги', 'Услуга добавлена в справочник.');
    } catch (error) {
        console.debug('Ошибка создания услуги УМУ:', error);
        showError('Услуги', 'Не удалось создать услугу.');
    } finally {
        serviceCreating.value = false;
    }
}

function removeAgreementService(index) {
    const [removed] = agreementServices.value.splice(index, 1);
    if (agreementForm.id && isFilledId(removed?.serviceId)) {
        removedAgreementServices.value.push(removed.serviceId);
    }
}

function buildAgreementPayload() {
    const servicesPayload = agreementServices.value
        .filter((service) => isFilledId(service.serviceId))
        .map((service) => compactObject({
            serviceId: service.serviceId,
            plannedHours: service.plannedHours,
        }));

    if (agreementForm.id) {
        return compactObject({
            addServicesIdsAndHours: servicesPayload,
            removeServicesIds: [...new Set(removedAgreementServices.value)],
            plannedStartAgreementDate: formatUmuDate(agreementForm.plannedStartAgreementDate),
            plannedEndAgreementDate: formatUmuDate(agreementForm.plannedEndAgreementDate),
            hourPrice: agreementForm.hourPrice,
            paymentDetails: agreementForm.paymentDetailsId,
        });
    }

    return compactObject({
        executorVersionId: agreementForm.executorVersionId,
        servicesIdsAndHours: servicesPayload,
        plannedStartAgreementDate: formatUmuDate(agreementForm.plannedStartAgreementDate),
        plannedEndAgreementDate: formatUmuDate(agreementForm.plannedEndAgreementDate),
        hourPrice: agreementForm.hourPrice,
        paymentDetailsId: agreementForm.paymentDetailsId,
        orderDate: formatUmuDate(agreementForm.orderDate),
        orderNumber: agreementForm.orderNumber,
    });
}

async function saveAgreement() {
    if (!agreementForm.executorVersionId || !agreementForm.paymentDetailsId || !agreementServices.value.some((service) => isFilledId(service.serviceId))) {
        showWarn('Договор', 'Выберите исполнителя, реквизиты и хотя бы одну услугу.');
        return;
    }

    agreementSaving.value = true;

    try {
        if (agreementForm.id) {
            await updateUmuSiriusAgreement(agreementForm.id, buildAgreementPayload());
        } else {
            await createUmuSiriusAgreement(buildAgreementPayload());
        }
        agreementDialogVisible.value = false;
        await fetchAgreements();
        showSuccess('Договор', 'Договор сохранен.');
    } catch (error) {
        console.debug('Ошибка сохранения договора УМУ:', error);
        showError('Договор', 'Не удалось сохранить договор.');
    } finally {
        agreementSaving.value = false;
    }
}

async function downloadAgreement(agreement) {
    documentLoading.value = `agreement-${agreement.id}`;

    try {
        const response = await getUmuSiriusAgreementDocuments(agreement.id, isUmuEmployeeMode.value);
        const count = downloadUmuDocuments(response.data);
        if (!count) throw new Error('Пустой ответ');
    } catch (error) {
        console.debug('Ошибка печати договора УМУ:', error);
        showError('Печать договора', 'Не удалось скачать документы договора.');
    } finally {
        documentLoading.value = '';
    }
}

function openSolutionDialog(agreement) {
    selectedAgreement.value = agreement;
    solutionForm.isApproved = true;
    solutionForm.disapprovedComment = '';
    solutionDialogVisible.value = true;
}

async function saveSolution() {
    if (solutionForm.isApproved === false && !solutionForm.disapprovedComment) {
        showWarn('Решение', 'Укажите причину отклонения.');
        return;
    }

    solutionSaving.value = true;

    try {
        await addUmuSiriusAgreementSolution(selectedAgreement.value.id, compactObject({
            isApproved: solutionForm.isApproved,
            disapprovedComment: solutionForm.isApproved ? '' : solutionForm.disapprovedComment,
        }));
        solutionDialogVisible.value = false;
        await Promise.all([fetchDecisions(), fetchAgreements()]);
        showSuccess('Решение', 'Решение сохранено.');
    } catch (error) {
        console.debug('Ошибка сохранения решения УМУ:', error);
        showError('Решение', 'Не удалось сохранить решение.');
    } finally {
        solutionSaving.value = false;
    }
}

function openCloseDialog(agreement) {
    selectedAgreement.value = agreement;
    closeForm.factStartDate = parseUmuDate(agreement.factStartAgreementDate || agreement.plannedStartAgreementDate);
    closeForm.factEndDate = parseUmuDate(agreement.factEndAgreementDate || agreement.plannedEndAgreementDate);
    closeServices.value = (agreement.services || []).map((service) => ({
        serviceId: service.id,
        name: service.name,
        plannedHours: service.plannedNumberOfHours ?? null,
        factHours: service.factNumberOfHours ?? service.plannedNumberOfHours ?? null,
    }));
    closeDialogVisible.value = true;
}

async function closeAgreement() {
    const serviceHours = closeServices.value.map((service) => compactObject({
        serviceId: service.serviceId,
        factHours: service.factHours,
    }));

    if (!serviceHours.length || closeServices.value.some((service) => service.factHours === null || service.factHours === undefined || service.factHours === '')) {
        showWarn('Закрытие договора', 'Заполните фактические часы по всем услугам.');
        return;
    }

    const dates = {
        factStartDate: formatUmuDate(closeForm.factStartDate),
        factEndDate: formatUmuDate(closeForm.factEndDate),
    };

    closeSaving.value = true;

    try {
        const response = await getUmuSiriusTerminationDocuments(selectedAgreement.value.id, dates, serviceHours);
        const count = downloadUmuDocuments(response.data);
        if (!count) throw new Error('Пустой ответ');

        if (!selectedAgreement.value.isClosed) {
            await updateUmuSiriusAgreement(selectedAgreement.value.id, compactObject({
                addServicesIdsAndHours: serviceHours,
                plannedStartAgreementDate: formatUmuDate(selectedAgreement.value.plannedStartAgreementDate),
                plannedEndAgreementDate: formatUmuDate(selectedAgreement.value.plannedEndAgreementDate),
                factStartAgreementDate: dates.factStartDate,
                factEndAgreementDate: dates.factEndDate,
                hourPrice: selectedAgreement.value.hourPrice,
                paymentDetails: selectedAgreement.value.paymentDetails?.id,
                isClosed: true,
            }));
            await fetchAgreements();
        }

        closeDialogVisible.value = false;
        showSuccess('Закрытие договора', 'Документы закрытия скачаны.');
    } catch (error) {
        console.debug('Ошибка закрытия договора УМУ:', error);
        showError('Закрытие договора', 'Не удалось закрыть договор или скачать документы.');
    } finally {
        closeSaving.value = false;
    }
}

async function loadActualTemplate() {
    if (templateForm.teplateTypeId === null || templateForm.teplateTypeId === undefined) return;

    try {
        const response = await getUmuSiriusActualTemplate(templateForm.teplateTypeId);
        templateForm.name = response.data?.name || '';
    } catch (error) {
        console.debug('Актуальный шаблон УМУ не найден:', error);
        templateForm.name = '';
    }
}

async function handleTemplateFile(files) {
    const file = Array.isArray(files) ? files[0] : null;
    if (!file) return;

    templateForm.name = templateForm.name || file.name;
    templateForm.content = await fileToBase64(file);
    templateFileName.value = file.name;
}

async function saveTemplate() {
    templateSaving.value = true;

    try {
        await setUmuSiriusTemplate({
            name: templateForm.name,
            content: templateForm.content,
            teplateTypeId: templateForm.teplateTypeId,
        });
        templateForm.content = '';
        templateFileName.value = '';
        showSuccess('Шаблон', 'Шаблон установлен.');
    } catch (error) {
        console.debug('Ошибка сохранения шаблона УМУ:', error);
        showError('Шаблон', 'Не удалось установить шаблон.');
    } finally {
        templateSaving.value = false;
    }
}

async function refreshActiveTab() {
    loading.value = true;

    try {
        if (activeTab.value === 'executors') await fetchExecutors();
        if (activeTab.value === 'agreements') await fetchAgreements();
        if (activeTab.value === 'decisions') await fetchDecisions();
        if (activeTab.value === 'templates') await fetchTemplateTypes();
    } finally {
        loading.value = false;
    }
}

function showSuccess(summary, detail) {
    toast.add({ severity: 'success', summary, detail, life: 3000 });
}

function showWarn(summary, detail) {
    toast.add({ severity: 'warn', summary, detail, life: 3500 });
}

function showError(summary, detail) {
    toast.add({ severity: 'error', summary, detail, life: 4000 });
}

watch(activeTab, (tab) => {
    if (tab === 'executors' && !executors.value.length) fetchExecutors();
    if (tab === 'agreements' && !agreements.value.length) fetchAgreements();
    if (tab === 'decisions' && !decisionAgreements.value.length) fetchDecisions();
    if (tab === 'templates' && !templateTypes.value.length) fetchTemplateTypes();
});

onMounted(async () => {
    activeTab.value = visibleTabs.value[0]?.value || '';
    await fetchServices();
});
</script>

<style scoped>
.umu-page {
    display: flex;
    flex-direction: column;
    gap: 1.15rem;
    min-height: 100%;
    padding: 1rem 2rem 2rem;
    color: var(--p-text-color);
    background:
        linear-gradient(180deg, color-mix(in srgb, var(--p-content-background) 76%, transparent), transparent 280px),
        radial-gradient(circle at top right, color-mix(in srgb, var(--p-primary-500) 10%, transparent), transparent 32rem);
}

.umu-header,
.umu-toolbar,
.umu-payment-head,
.umu-form-actions {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
}

.umu-header {
    align-items: stretch;
    padding: 1.15rem;
    border-radius: 18px;
    border: 1px solid color-mix(in srgb, var(--p-primary-500) 10%, var(--p-content-border-color));
    background:
        linear-gradient(135deg, color-mix(in srgb, var(--p-content-background) 96%, var(--p-primary-500)), var(--p-content-background)),
        var(--p-content-background);
    box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
}

.umu-header-copy {
    display: flex;
    align-items: center;
}

.umu-header-side {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.umu-title-row {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.umu-icon {
    width: 3.5rem;
    height: 3.5rem;
    display: grid;
    place-items: center;
    border-radius: 14px;
    background:
        linear-gradient(135deg, color-mix(in srgb, var(--p-primary-500) 18%, transparent), color-mix(in srgb, var(--p-green-500) 9%, transparent));
    color: var(--p-primary-color);
    border: 1px solid color-mix(in srgb, var(--p-primary-500) 16%, var(--p-content-border-color));
}

.umu-icon .pi {
    font-size: 1.25rem;
}

.umu-eyebrow {
    display: inline-flex;
    margin-bottom: 0.25rem;
    color: var(--p-primary-color);
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.umu-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(8rem, 1fr));
    gap: 0.6rem;
}

.umu-stat {
    min-width: 8rem;
    padding: 0.75rem 0.85rem;
    border-radius: 12px;
    background: color-mix(in srgb, var(--p-content-background) 80%, var(--p-surface-100, #f8fafc));
    border: 1px solid color-mix(in srgb, var(--p-content-border-color) 82%, transparent);
}

.umu-stat span {
    display: block;
    margin-bottom: 0.2rem;
    color: var(--p-text-color-secondary);
    font-size: 0.78rem;
    font-weight: 700;
}

.umu-stat strong {
    font-size: 1.2rem;
    line-height: 1;
}

.umu-stat.accent strong {
    color: #b45309;
}

.umu-refresh {
    min-height: 2.65rem;
}

.umu-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    padding: 0.4rem;
    border-radius: 14px;
    border: 1px solid var(--p-content-border-color);
    background: var(--p-content-background);
    width: fit-content;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
}

.umu-tab {
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: var(--p-text-color-secondary);
    min-height: 2.35rem;
    padding: 0.58rem 0.9rem;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
    transition: background-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
}

.umu-tab:hover {
    background: color-mix(in srgb, var(--p-primary-500) 8%, transparent);
    color: var(--p-text-color);
}

.umu-tab-active {
    background: var(--p-primary-color);
    color: var(--p-primary-contrast-color);
    box-shadow: 0 8px 18px color-mix(in srgb, var(--p-primary-500) 22%, transparent);
}

.umu-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.umu-toolbar {
    flex-wrap: wrap;
    align-items: center;
    padding: 0.9rem;
    border: 1px solid var(--p-content-border-color);
    border-radius: 14px;
    background: color-mix(in srgb, var(--p-content-background) 92%, transparent);
}

.umu-search {
    min-width: min(420px, 100%);
    flex: 1;
}

.umu-filter-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(180px, 1fr));
    gap: 0.75rem;
    flex: 1;
}

.umu-actions,
.umu-row-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.umu-actions {
    justify-content: flex-end;
}

.umu-table-shell,
.umu-template-card {
    border: 1px solid color-mix(in srgb, var(--p-content-border-color) 72%, transparent);
    border-radius: 14px;
    overflow: hidden;
    background: var(--p-content-background);
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.035);
}

.umu-table-shell :deep(.p-card-body),
.umu-template-card :deep(.p-card-body) {
    padding: 0.95rem;
}

.umu-table-shell :deep(.p-card-title),
.umu-template-card :deep(.p-card-title) {
    margin-bottom: 0.15rem;
    color: var(--p-text-color);
    font-size: 0.98rem;
}

.umu-table-shell :deep(.p-card-subtitle),
.umu-template-card :deep(.p-card-subtitle) {
    color: var(--p-text-color-secondary);
    font-size: 0.88rem;
    margin-bottom: 0.85rem;
}

.umu-card-title {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
}

.umu-card-title .pi {
    width: 1.8rem;
    height: 1.8rem;
    display: grid;
    place-items: center;
    border-radius: 10px;
    background: color-mix(in srgb, var(--p-primary-500) 10%, transparent);
    color: var(--p-primary-color);
}

.umu-main-cell {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.umu-main-cell span {
    color: var(--p-text-color-secondary);
    font-size: 0.9rem;
}

.umu-empty {
    min-height: 13rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    color: var(--p-text-color-secondary);
    text-align: center;
}

.umu-empty.compact {
    min-height: 80px;
}

.umu-empty .pi {
    width: 3.2rem;
    height: 3.2rem;
    display: grid;
    place-items: center;
    border-radius: 16px;
    background:
        linear-gradient(135deg, color-mix(in srgb, var(--p-primary-500) 11%, transparent), color-mix(in srgb, var(--p-green-500) 8%, transparent));
    color: var(--p-primary-color);
    font-size: 1.2rem;
}

.umu-form-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.95rem;
}

.umu-form-grid.compact {
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 0.85rem;
}

.umu-form-grid.compact > .umu-field {
    grid-column: span 2;
}

.umu-form-grid.compact > .umu-span-2 {
    grid-column: span 4;
}

.umu-form-grid.compact > .umu-span-all {
    grid-column: 1 / -1;
}

.umu-form-sections {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
}

.umu-form-section {
    display: grid;
    grid-template-columns: minmax(12rem, 0.34fr) minmax(0, 1fr);
    gap: 1rem;
    padding: 1rem;
    border-radius: 14px;
    border: 1px solid color-mix(in srgb, var(--p-content-border-color) 72%, transparent);
    background: color-mix(in srgb, var(--p-content-background) 96%, var(--p-primary-500));
}

.umu-form-section.compact-title {
    grid-template-columns: minmax(10rem, 0.28fr) minmax(0, 1fr);
}

.umu-form-section.agreement-section {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    padding: 0.9rem;
}

.umu-form-section.agreement-section .umu-section-title {
    padding-bottom: 0.75rem;
    border-bottom: 1px solid color-mix(in srgb, var(--p-content-border-color) 56%, transparent);
}

.umu-agreement-main-grid,
.umu-agreement-details-grid {
    display: grid;
    gap: 0.85rem;
    min-width: 0;
}

.umu-agreement-main-grid {
    grid-template-columns: minmax(0, 1fr);
}

.umu-agreement-details-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.umu-agreement-details-grid .umu-order-number-field {
    grid-column: 1 / -1;
}

.umu-section-title {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    min-width: 0;
}

.umu-section-title .pi {
    width: 2.15rem;
    height: 2.15rem;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 10px;
    background: color-mix(in srgb, var(--p-primary-500) 12%, transparent);
    color: var(--p-primary-color);
}

.umu-section-title strong,
.umu-section-title span {
    display: block;
}

.umu-section-title strong {
    margin-top: 0.15rem;
    color: var(--p-text-color);
    font-size: 0.95rem;
}

.umu-section-title span {
    margin-top: 0.2rem;
    color: var(--p-text-color-secondary);
    font-size: 0.82rem;
    line-height: 1.35;
}

.umu-field {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
}

.umu-field label {
    font-weight: 700;
    color: var(--p-text-color);
    font-size: 0.9rem;
}

.umu-field small {
    color: var(--p-text-color-secondary);
    line-height: 1.4;
}

.umu-close-date-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
}

.umu-close-service-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 8.5rem;
    gap: 1rem;
    align-items: center;
    padding: 0.85rem;
    border-radius: 12px;
    border: 1px solid var(--p-content-border-color);
    background: color-mix(in srgb, var(--p-content-background) 94%, var(--p-primary-500));
}

.umu-close-service-name {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
}

.umu-close-service-name strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--p-text-color);
}

.umu-close-service-name span,
.umu-close-service-hours label {
    color: var(--p-text-color-secondary);
    font-size: 0.82rem;
}

.umu-close-service-hours {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
}

.umu-close-service-hours :deep(.p-inputnumber),
.umu-close-service-hours :deep(.p-inputnumber-input) {
    width: 100%;
    min-width: 0;
}

.umu-bank-option {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
}

.umu-bank-option strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.umu-bank-option span {
    color: var(--p-text-color-secondary);
    font-size: 0.82rem;
}

.umu-wide {
    grid-column: span 2;
}

.umu-dialog :deep(.p-dialog-content) {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-top: 0.5rem;
}

.umu-dialog :deep(.p-dialog) {
    border-radius: 18px;
}

.umu-dialog :deep(.p-dialog-header) {
    padding-bottom: 0.75rem;
}

.umu-payment-form,
.umu-services-editor,
.umu-solution {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.umu-service-row {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) 160px auto;
    gap: 0.75rem;
    align-items: center;
    padding: 0.7rem;
    border-radius: 12px;
    border: 1px solid var(--p-content-border-color);
    background: color-mix(in srgb, var(--p-content-background) 94%, var(--p-primary-500));
}

.umu-inline-create-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.6rem;
    align-items: center;
    padding: 0.65rem;
    border-radius: 12px;
    border: 1px dashed var(--p-content-border-color);
    background: color-mix(in srgb, var(--p-content-background) 96%, var(--p-primary-500));
}

.umu-inline-create-card :deep(.p-inputtext) {
    width: 100%;
    min-width: 0;
}

.umu-service-row.agreement {
    grid-template-columns: minmax(0, 1fr) minmax(6.75rem, 8rem) 2.75rem;
    gap: 0.6rem;
    padding: 0.65rem;
    overflow: hidden;
}

.umu-service-row.agreement > * {
    min-width: 0;
}

.umu-service-row.agreement :deep(.p-select),
.umu-service-row.agreement :deep(.p-inputnumber) {
    width: 100%;
    min-width: 0;
}

.umu-service-row.agreement :deep(.p-inputnumber-input) {
    width: 100%;
    min-width: 0;
}

.umu-icon-button {
    width: 2.75rem;
    min-width: 2.75rem;
    height: 2.75rem;
    padding: 0;
    justify-self: end;
}

.umu-icon-button :deep(.p-button-label) {
    display: none;
}

.umu-service-row.two {
    grid-template-columns: minmax(220px, 1fr) 180px;
}

.umu-info-strip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.9rem 1rem;
    border-radius: 12px;
    background: color-mix(in srgb, var(--p-primary-500) 6%, var(--p-content-background));
    border: 1px solid color-mix(in srgb, var(--p-primary-500) 10%, var(--p-content-border-color));
}

.umu-template-layout {
    display: grid;
    grid-template-columns: minmax(13rem, 0.8fr) minmax(14rem, 1fr) minmax(18rem, 1.4fr) auto;
    gap: 1rem;
    align-items: end;
}

.umu-template-layout :deep(.file-dropzone) {
    min-height: 5.75rem;
    border-radius: 12px;
}

.umu-table-shell :deep(.p-datatable-thead > tr > th) {
    background: color-mix(in srgb, var(--p-content-background) 90%, var(--p-primary-500));
    color: var(--p-text-color);
    font-weight: 700;
    border-color: color-mix(in srgb, var(--p-content-border-color) 64%, transparent);
    padding-top: 0.95rem;
    padding-bottom: 0.95rem;
}

.umu-table-shell :deep(.p-datatable) {
    border: 1px solid color-mix(in srgb, var(--p-content-border-color) 62%, transparent);
    border-radius: 12px;
    overflow: hidden;
}

.umu-table-shell :deep(.p-datatable-table) {
    border-spacing: 0;
}

.umu-table-shell :deep(.p-datatable-tbody > tr > td) {
    border-color: color-mix(in srgb, var(--p-content-border-color) 42%, transparent);
    padding-top: 0.85rem;
    padding-bottom: 0.85rem;
}

.umu-table-shell :deep(.p-datatable-tbody > tr) {
    transition: background-color 0.15s ease;
}

.umu-table-shell :deep(.p-datatable-tbody > tr:hover) {
    background: color-mix(in srgb, var(--p-primary-500) 6%, transparent);
}

.umu-table-shell :deep(.p-datatable-tbody > tr.umu-clickable-row) {
    cursor: pointer;
}

.umu-table-shell :deep(.p-datatable-tbody > tr.umu-clickable-row:hover) {
    background: color-mix(in srgb, var(--p-primary-500) 8%, transparent);
}

.umu-table-shell :deep(.p-paginator) {
    border-top: 1px solid var(--p-content-border-color);
}

.umu-page :deep(.p-inputtext),
.umu-page :deep(.p-select),
.umu-page :deep(.p-autocomplete),
.umu-page :deep(.p-inputnumber) {
    width: 100%;
}

@media (max-width: 1100px) {
    .umu-form-grid,
    .umu-filter-grid,
    .umu-template-layout {
        grid-template-columns: 1fr;
    }

    .umu-form-section {
        grid-template-columns: 1fr;
    }

    .umu-close-date-grid {
        grid-template-columns: 1fr;
    }

    .umu-agreement-main-grid,
    .umu-agreement-details-grid {
        grid-template-columns: 1fr;
    }

    .umu-agreement-details-grid .umu-order-number-field {
        grid-column: auto;
    }

    .umu-form-grid.compact {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .umu-form-grid.compact > .umu-field,
    .umu-form-grid.compact > .umu-span-2,
    .umu-form-grid.compact > .umu-span-all {
        grid-column: span 1;
    }

    .umu-form-grid.compact > .umu-span-all {
        grid-column: 1 / -1;
    }

    .umu-wide {
        grid-column: auto;
    }
}

@media (max-width: 768px) {
    .umu-page {
        padding: 1rem;
        background: transparent;
    }

    .umu-header,
    .umu-header-side,
    .umu-toolbar,
    .umu-payment-head {
        flex-direction: column;
    }

    .umu-stats {
        grid-template-columns: 1fr;
        width: 100%;
    }

    .umu-stat {
        width: 100%;
    }

    .umu-actions,
    .umu-search,
    .umu-tabs {
        width: 100%;
    }

    .umu-actions :deep(.p-button) {
        flex: 1;
    }

    .umu-service-row,
    .umu-service-row.two,
    .umu-inline-create-card {
        grid-template-columns: 1fr;
    }

    .umu-service-row.agreement {
        grid-template-columns: 1fr;
    }

    .umu-close-service-row {
        grid-template-columns: 1fr;
    }

    .umu-icon-button {
        width: 100%;
        justify-self: stretch;
    }

    .umu-form-grid.compact {
        grid-template-columns: 1fr;
    }

    .umu-form-grid.compact > .umu-field,
    .umu-form-grid.compact > .umu-span-2,
    .umu-form-grid.compact > .umu-span-all {
        grid-column: 1 / -1;
    }
}
</style>
