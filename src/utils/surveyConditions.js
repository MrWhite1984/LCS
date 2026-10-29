const isEmpty = (value) => (
    value === null
    || value === undefined
    || value === ''
    || (Array.isArray(value) && value.length === 0)
);

const nodeValue = (node) => {
    if (node.listValue !== null && node.listValue !== undefined) return node.listValue;
    if (node.boolValue !== null && node.boolValue !== undefined) return node.boolValue;
    if (node.doubleValue !== null && node.doubleValue !== undefined) return node.doubleValue;
    if (node.intValue !== null && node.intValue !== undefined) return node.intValue;
    return node.stringValue;
};

const asNumber = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
};

const isBooleanLike = (value) => {
    if (typeof value === 'boolean') return true;
    if (typeof value === 'string') {
        const text = value.trim().toLowerCase();
        return ['true', 'false', 'да', 'нет', 'yes', 'no'].includes(text);
    }
    return false;
};

const toBooleanString = (value) => {
    if (value === true || value === 1) return 'true';
    if (value === false || value === 0) return 'false';

    const text = String(value ?? '').trim().toLowerCase();
    if (['true', '1', 'да', 'yes'].includes(text)) return 'true';
    if (['false', '0', 'нет', 'no'].includes(text)) return 'false';

    return text;
};

const compareEquals = (answer, expected) => {
    if (Array.isArray(expected)) {
        const answerList = Array.isArray(answer) ? answer : [answer];
        return expected.some((item) => answerList.map(String).includes(String(item)));
    }

    if (Array.isArray(answer)) {
        return answer.map(String).includes(String(expected));
    }

    if (isBooleanLike(answer) || isBooleanLike(expected)) {
        return toBooleanString(answer) === toBooleanString(expected);
    }

    const answerNumber = asNumber(answer);
    const expectedNumber = asNumber(expected);
    if (answerNumber !== null && expectedNumber !== null) {
        return answerNumber === expectedNumber;
    }

    return String(answer ?? '') === String(expected ?? '');
};

const evaluateField = (node, answers) => {
    if (node.target && node.target !== 'answer') {
        return true;
    }

    const field = String(node.field || '');
    if (!field.startsWith('q.')) {
        return true;
    }

    const questionId = field.slice(2);
    const answer = answers[questionId];
    const expected = nodeValue(node);

    switch (node.op) {
        case 'eq':
            return compareEquals(answer, expected);
        case 'neq':
            return !compareEquals(answer, expected);
        case 'gt':
        case 'gte':
        case 'lt':
        case 'lte': {
            const answerNumber = asNumber(Array.isArray(answer) ? answer[0] : answer);
            const expectedNumber = asNumber(expected);
            if (answerNumber === null || expectedNumber === null) return false;

            if (node.op === 'gt') return answerNumber > expectedNumber;
            if (node.op === 'gte') return answerNumber >= expectedNumber;
            if (node.op === 'lt') return answerNumber < expectedNumber;
            return answerNumber <= expectedNumber;
        }
        case 'in':
        case 'not_in': {
            const list = Array.isArray(expected) ? expected.map(String) : [String(expected ?? '')];
            const answerList = Array.isArray(answer) ? answer.map(String) : [String(answer ?? '')];
            const hasIntersection = answerList.some((item) => list.includes(item));
            return node.op === 'in' ? hasIntersection : !hasIntersection;
        }
        case 'is_set':
            return !isEmpty(answer);
        case 'is_not_set':
            return isEmpty(answer);
        default:
            return true;
    }
};

export const evaluateSurveyCondition = (node, answers) => {
    if (!node) return true;

    if (node.type === 'and') {
        return (node.children || []).every((child) => evaluateSurveyCondition(child, answers));
    }

    if (node.type === 'or') {
        return (node.children || []).some((child) => evaluateSurveyCondition(child, answers));
    }

    if (node.type === 'not') {
        return !evaluateSurveyCondition((node.children || [])[0], answers);
    }

    if (node.type === 'field' || node.field) {
        return evaluateField(node, answers);
    }

    return true;
};

export const isSurveyQuestionVisible = (question, answers) => (
    evaluateSurveyCondition(question?.showWhen, answers)
);
