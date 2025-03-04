<template>
<section class="expense-by-category-component" v-if="summary.dayListForTheMonth.value && (summary.incomePerDay.value || summary.expensesPerDay.value)">
    <h3>Daily cash in and cash out status</h3>
    <p>Note: Only takes paid expenses</p>
    <div class="chart-container">
        <Line :data="data" :options="options" />
    </div>
</section>
</template>


<script setup>
// This will only show if there's a run chart result from the backend for the user
import { monthlySummaryStore } from '@/stores/monthly-summary';
import { ref, reactive, computed, onMounted } from 'vue';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from 'vue-chartjs'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const summary = monthlySummaryStore();
const transactionExpense = ref([]);
const transactionIncome = ref([]);
const currency = reactive({
    sign: summary.preferredCurrency.sign,
    name: summary.preferredCurrency.name,
});

// Chart Variables
const data = computed(() => ({
    labels: summary.dayListForTheMonth.value,
    datasets: [
        {
            label: 'Daily Total Expense',
            borderColor: 'pink',
            backgroundColor: 'pink',
            data: transactionExpense.value
        },
        {
            label: 'Daily Total Income',
            borderColor: 'red',
            backgroundColor: 'red',
            data: transactionIncome.value
        }
    ]
}));
const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: true // Show labels in legend
        },
        title: {
            display: true,
            text: 'Daily Income & Expense'
        }
    },
    scales: {
        x: {
            title: {
                display: true,
                text: 'Day' // X-Axis Label
            }
        },
        y: {
            beginAtZero: true,
            title: {
                display: true,
                text: `Amount in ${currency.name} (${currency.sign})` // Y-Axis Label
            },
            ticks: {
                callback: function(value) {
                    return currency.sign + value.toLocaleString('en-US', { maximumFractionDigits: 0 });
                }
            }
        }
    }
};

// Store runchart in their variables
const storeRunChart = () => {
    if (!summary.dayListForTheMonth.value) {
        return;
    }

    transactionExpense.value = [];
    transactionIncome.value = [];

    summary.dayListForTheMonth.value.forEach(day => {
        let incomeFound = false;
        let expenseFound = false;

        if (summary.incomePerDay.value) {
            for (let income of summary.incomePerDay.value) {
                if (income.day === day) {
                    transactionIncome.value.push(income.total_income_amount);
                    incomeFound = true;
                    break;
                }
            }

            if (!incomeFound) {
                transactionIncome.value.push(0);
            }
        }
        
        if (summary.expensesPerDay.value) {
            for (let expense of summary.expensesPerDay.value) {
                if (expense.day === day) {
                    transactionExpense.value.push(expense.total_expense_amount);
                    expenseFound = true;
                    break;
                }
            }

            if (!expenseFound) {
                transactionExpense.value.push(0);
            }
        }

        
    });
}

// Automatically run storeRunChart
onMounted(() => {
    storeRunChart();
});
</script>


<style scoped>
.chart-container {
    width: 500px; /* Adjust this value as needed */
    height: 300px; /* Adjust this value as needed */
}
</style>