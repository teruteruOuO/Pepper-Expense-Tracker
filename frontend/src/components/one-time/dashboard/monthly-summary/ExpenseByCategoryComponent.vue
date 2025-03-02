<template>
<section class="expense-by-category-component" v-if="summary.expenseByCategory.value">
    <h3>Expense by Category</h3>
    <div class="chart-container">
        <Bar :data="data" :options="options" />
    </div>
</section>
</template>


<script setup>
// This will only show if there's an expense category result summary for the user
import { monthlySummaryStore } from '@/stores/monthly-summary';
import { ref, reactive, computed, onMounted } from 'vue';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
import { Bar } from 'vue-chartjs'
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const summary = monthlySummaryStore();
const transactionType = ref([]);
const transactionAmount = ref([]);
const currency = reactive({
    sign: summary.preferredCurrency.sign,
    name: summary.preferredCurrency.name,
});

// Chart Variables
const data = computed(() => ({
    labels: transactionType.value,
    datasets: [
        {
            label: 'Expense by Category',
            backgroundColor: '#f87979',
            data: transactionAmount.value
        }
    ]
}));
const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false // Hide labels
        },
        title: {
            display: true,
            text: 'Expense by Category'
        }
    },
    scales: {
        y: {
            title: {
                display: true,
                text: `Amount in ${currency.name} (${currency.sign})` // Y-Axis Label
            },
            ticks: {
                callback: function(value) {
                    return currency.sign + value;
                }
            }
        }
    }
};

// Store expense by category in their variables
const storeExpenseByCategory = () => {
    if (!summary.expenseByCategory.value || summary.expenseByCategory.value.length === 0) {
        return;
    }

    transactionType.value = summary.expenseByCategory.value.map(type => type.name);
    transactionAmount.value = summary.expenseByCategory.value.map(type => type.total_amount);
}

// Automatically run storeExpenseByCategory
onMounted(() => {
    storeExpenseByCategory();
});
</script>


<style scoped>
.chart-container {
    width: 500px; /* Adjust this value as needed */
    height: 300px; /* Adjust this value as needed */
}
</style>