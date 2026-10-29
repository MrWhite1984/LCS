export const getApiErrorMessage = (error, fallback = 'Попробуйте позже.') => {
    const data = error?.response?.data;
    const validationError = data?.errors && typeof data.errors === 'object'
        ? Object.values(data.errors).flat().find(Boolean)
        : null;

    return validationError || data?.title || data?.message || fallback;
};
