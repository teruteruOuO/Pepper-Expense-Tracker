import { ref, reactive } from 'vue';
import { defineStore } from 'pinia';

export const monthlySummaryStore = defineStore('monthly-summary', () => {
    const incomeExpenseSummary = ref([]);
    const expenseByCategory = ref([]);
    const topThreeExpenses = ref([]);
    const expensesPerDay = ref([]);
    const incomePerDay = ref([]);
    const dayListForTheMonth = ref([]);
    const preferredCurrency = reactive({
        name: '',
        sign: ''
    });

    return { incomeExpenseSummary, expenseByCategory, topThreeExpenses, expensesPerDay, incomePerDay, dayListForTheMonth, preferredCurrency }
});