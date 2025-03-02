<template>
<section class="income-expense-summary-component" v-if="summary.incomeExpenseSummary.value">
    <h3>Income and Expense</h3>
    <div class="chart-container">
        <Pie :data="data" :options="options" />
    </div>
</section>
</template>

<script setup>
// This will only show if there's an income vs expense summary for the user
import { monthlySummaryStore } from '@/stores/monthly-summary';
import { ref, computed, onMounted } from 'vue';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie } from 'vue-chartjs';
ChartJS.register(ArcElement, Tooltip, Legend);

const summary = monthlySummaryStore();
const transactionType = ref([]);
const transactionAmount = ref([]);

// Chart Variables
const data = computed(() => ({
    labels: transactionType.value,
    datasets: [
        {
            backgroundColor: ['pink', 'red'],
            data: transactionAmount.value
        }
    ]
}));
const options = {
    responsive: true,
    plugins: {
        title: {
            display: true,
            text: 'Income vs. Expense'
        }
    }
};

// Store income and expense in their variables
const storeIncomeAndExpense = () => {
    if (!summary.incomeExpenseSummary.value || summary.incomeExpenseSummary.value.length === 0) {
        return;
    }

    transactionType.value = summary.incomeExpenseSummary.value.map(type => type.type);
    transactionAmount.value = summary.incomeExpenseSummary.value.map(type => type.total_amount);
}

// Automatically run storeIncomeAndExpense
onMounted(() => {
    storeIncomeAndExpense();
});
</script>


<style scoped>
.chart-container {
    width: 300px; /* Adjust this value as needed */
    height: 300px; /* Adjust this value as needed */
}
</style>