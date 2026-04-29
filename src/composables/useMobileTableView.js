import { computed, ref, watch } from 'vue';

export const TABLE_VIEW_MODE = 'table';
export const STACKED_CARDS_MODE = 'stacked-cards';

export const useMobileTableView = ({
    items,
    currentPage,
    rowsPerPage,
    isPhone,
    sliceItems = true,
}) => {
    const showMobileFilters = ref(false);

    const viewMode = computed(() => (
        isPhone.value ? STACKED_CARDS_MODE : TABLE_VIEW_MODE
    ));
    const isCardMode = computed(() => viewMode.value === STACKED_CARDS_MODE);
    const firstRowIndex = computed(() => Math.max(0, (currentPage.value - 1) * rowsPerPage.value));
    const currentPageItems = computed(() => (
        sliceItems
            ? items.value.slice(firstRowIndex.value, firstRowIndex.value + rowsPerPage.value)
            : items.value
    ));

    watch(isCardMode, (value) => {
        if (!value) {
            showMobileFilters.value = false;
        }
    });

    return {
        viewMode,
        isCardMode,
        firstRowIndex,
        currentPageItems,
        showMobileFilters,
    };
};
