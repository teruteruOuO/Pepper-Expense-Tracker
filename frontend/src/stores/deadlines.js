import { ref, reactive } from 'vue';
import { defineStore } from 'pinia';

export const deadlineStore = defineStore('deadlines', () => {
    const dueBudgets = ref([]);
    const dueSavings = ref([]);
    const dueExpenses = ref([]);
    const overdueExpenses = ref([]);
    const preferredCurrency = reactive({
        name: '',
        sign: ''
    });

    return { dueBudgets, dueSavings, dueExpenses, overdueExpenses, preferredCurrency }
});