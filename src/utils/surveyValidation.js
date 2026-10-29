const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INN_PATTERN = /^(\d{10}|\d{12})$/;

const isFiniteNumber = (value) => {
    if (value === null || value === undefined || value === '') return false;
    return Number.isFinite(Number(value));
};

export const isEmptySurveyAnswer = (question, value) => {
    if (!question || question.type === 'heading') return false;

    if (question.type === 'multi') {
        return !Array.isArray(value) || value.length === 0;
    }

    return value === null || value === undefined || String(value).trim() === '';
};

export const validateSurveyQuestion = (question, value) => {
    if (!question || question.type === 'heading') return null;

    if (isEmptySurveyAnswer(question, value)) {
        return question.isRequired ? 'Заполните обязательный вопрос' : null;
    }

    const stringValue = String(value).trim();

    switch (question.type) {
        case 'email':
            return EMAIL_PATTERN.test(stringValue)
                ? null
                : 'Введите корректный адрес электронной почты';

        case 'inn':
            return INN_PATTERN.test(stringValue)
                ? null
                : 'ИНН должен содержать 10 или 12 цифр';

        case 'url':
            try {
                const url = new URL(stringValue);
                return ['http:', 'https:'].includes(url.protocol)
                    ? null
                    : 'Ссылка должна начинаться с http:// или https://';
            } catch {
                return 'Введите корректную ссылку, например https://example.com';
            }

        case 'number':
            return isFiniteNumber(value) ? null : 'Введите число';

        case 'integer':
            return Number.isInteger(Number(value)) ? null : 'Введите целое число';

        case 'rating': {
            const rating = Number(value);
            const min = question.scaleMin ?? 1;
            const max = question.scaleMax ?? 5;
            return Number.isFinite(rating) && rating >= min && rating <= max
                ? null
                : `Поставьте оценку от ${min} до ${max}`;
        }

        case 'scale': {
            const scale = Number(value);
            const min = question.scaleMin ?? 1;
            const max = question.scaleMax ?? 10;
            return Number.isFinite(scale) && scale >= min && scale <= max
                ? null
                : `Выберите значение от ${min} до ${max}`;
        }

        case 'single':
        case 'select':
        case 'yes_no': {
            if (question.type === 'yes_no') {
                return ['Да', 'Нет'].includes(stringValue)
                    ? null
                    : 'Выберите «Да» или «Нет»';
            }

            const options = question.options || [];
            return options.some((option) => String(option.id) === stringValue)
                ? null
                : 'Выберите вариант из списка';
        }

        case 'multi': {
            const options = question.options || [];
            return value.every((optionId) => options.some((option) => String(option.id) === String(optionId)))
                ? null
                : 'Выберите варианты из списка';
        }

        case 'date': {
            if (value instanceof Date) {
                return Number.isNaN(value.getTime()) ? 'Выберите корректную дату' : null;
            }

            const date = new Date(value);
            return Number.isNaN(date.getTime()) ? 'Выберите корректную дату' : null;
        }

        default:
            return null;
    }
};
