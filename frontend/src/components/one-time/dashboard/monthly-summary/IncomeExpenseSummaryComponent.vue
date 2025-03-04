<template>
<section class="income-expense-summary-component" v-if="summary.incomeExpenseSummary.value">
    <h3>Income and Expense</h3>
    <div class="chart-container">
        <Pie :data="data" :options="options" />
    </div>
    <p>
        Your net
        <span v-if="revenue >= 0" class="positive-revenue">
            revenue
        </span> 
        <span v-else class="negative-revenue">
            loss
        </span>
        for this month is: 
        <span :class="{ 'negative-revenue': revenue < 0, 'positive-revenue': revenue >= 0 }">
            {{summary.preferredCurrency.sign}}{{ Math.abs(revenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
        </span>
    </p>
</section>
</template>

<script setup>
// This will only show if there's an income vs expense summary for the user
import { monthlySummaryStore } from '@/stores/monthly-summary';
import { ref, computed, onMounted } from 'vue';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie } from 'vue-chartjs';
ChartJS.register(ArcElement, Tooltip, Legend);
ChartJS.defaults.font.family = 'Bubblegum Sans'; 

const summary = monthlySummaryStore();
const transactionType = ref(['expense', 'income']);
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

// Calculate revenue 
const revenue = computed(() => {
    return transactionAmount.value[1] - transactionAmount.value[0]
});

// Store income and expense in their variables
const storeIncomeAndExpense = () => {
    if (!summary.incomeExpenseSummary.value || summary.incomeExpenseSummary.value.length === 0) {
        return;
    }

    // Ensure default values are set to 0
    transactionAmount.value = [0, 0];

    summary.incomeExpenseSummary.value.forEach(item => {
        if (item.type === 'expense') {
            transactionAmount.value[0] = Number(item.total_amount); // Expense at index 0
        } else if (item.type === 'income') {
            transactionAmount.value[1] = Number(item.total_amount); // Income at index 1
        }
    });
};

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

.negative-revenue {
    color: red;
}

.positive-revenue {
    color: green
}
</style>