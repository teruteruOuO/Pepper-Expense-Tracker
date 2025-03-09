<template>
<section class="top-three-expense-component chart-container" v-if="summary.topThreeExpenses.value">
    <Bar :data="data" :options="options" />
</section>
</template>


<script setup>
// This will only show if there's an income vs expense summary for the user
import { monthlySummaryStore } from '@/stores/monthly-summary';
import { ref, reactive, computed, onMounted } from 'vue';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
import { Bar } from 'vue-chartjs'
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
ChartJS.defaults.font.family = 'Gill Sans'; 

const summary = monthlySummaryStore();
const transactionName = ref([]);
const transactionAmount = ref([]);
const currency = reactive({
    sign: summary.preferredCurrency.sign,
    name: summary.preferredCurrency.name,
});

// Chart Variables
const data = computed(() => ({
    labels: transactionName.value,
    datasets: [
        {
            label: 'Top Three Expenses',
            backgroundColor: 'pink',
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
            text: 'Top 3 Expenses',
            font: {
                size: 20
            }
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
                    return currency.sign + value.toLocaleString('en-US', { maximumFractionDigits: 0 });
                }
            }
        }
    }
};

// Store top three expenses in their variables
const storeTopThreeExpenses = () => {
    if (!summary.topThreeExpenses.value || summary.topThreeExpenses.value.length === 0) {
        return;
    }

    transactionName.value = summary.topThreeExpenses.value.map(type => type.name);
    transactionAmount.value = summary.topThreeExpenses.value.map(type => type.amount);
}

// Automatically run storeTopThreeExpenses
onMounted(() => {
    storeTopThreeExpenses();
});
</script>


<style scoped>
</style>