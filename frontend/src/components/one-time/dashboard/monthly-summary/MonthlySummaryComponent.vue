<template>
<section class="monthly-summary-component">
    <h1>Monthly Summary</h1>

    <section class="loader" v-if="isLoadingPage">
    </section>

    <section class="retrieve-fail" v-else-if="retrieveResourcesFail">
        <p>{{ feedbackFromBackend.message }}</p>
    </section>

    <section class="empty-summary" v-else-if="emptyResult.monthly && emptyResult.run_chart">
        <p>You do not have any records for this month yet. How about adding one?</p>
    </section>

    <section class="retrieve-success" v-else>
        <p>
            Hello {{ user.userInformation.first_name.toUpperCase() }}! This is your summary for 
            <span>
                {{ new Date().toLocaleString('en-US', { month: 'long', timeZone: 'America/Chicago' }) }} 
            </span>
        </p>
        <section class="charts">
            <IncomeExpenseSummaryComponent />
            <ExpenseByCategoryComponent />
            <TopThreeExpenseComponent />
            <RunChartComponent />
        </section>
    </section>
</section>
</template>


<script setup>
import IncomeExpenseSummaryComponent from './IncomeExpenseSummaryComponent.vue';
import ExpenseByCategoryComponent from './ExpenseByCategoryComponent.vue';
import TopThreeExpenseComponent from './TopThreeExpenseComponent.vue';
import RunChartComponent from './RunChartComponent.vue';
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';
import { monthlySummaryStore } from '@/stores/monthly-summary';
import { useUserStore } from '@/stores/user';

const summary = monthlySummaryStore();
const user = useUserStore();
const retrieveResourcesFail = ref(false);
const isLoadingPage = ref(false);
const emptyResult = reactive({
    monthly: false,
    run_chart: false
});
const feedbackFromBackend = reactive({
    message: '',
    success: false
});


// Retrieve the user's currency and monthly summary
const retrieveMonthlySummary = async () => {
    isLoadingPage.value = true;

    try {
        const currencyResponse = await axios.get(`/api/currency/${user.userInformation.username}/${user.userInformation.currency_code}`);
        const summaryResponse = await axios.get(`/api/dashboard/monthly-summary/${user.userInformation.username}`);

        // Retrieve the user's preferred currency
        console.log(currencyResponse.data.message);
        summary.preferredCurrency.name = currencyResponse.data.currency.name;
        summary.preferredCurrency.sign = currencyResponse.data.currency.sign;

        // Retrieve the monthly summary
        console.log(summaryResponse.data.message);

        // If empty, then tell user they don't have anything yet
        const monthlySummary = summaryResponse.data.monthly_summary;
        const runChartSummary = summaryResponse.data.run_chart;
        console.log(`monthly summary (raw):`)
        console.log(monthlySummary);
        console.log(`run chart summary (raw):`)
        console.log(runChartSummary);
        if (!monthlySummary || Object.keys(monthlySummary).length === 0) {
            emptyResult.monthly = true;
        }

        if (!runChartSummary || Object.keys(runChartSummary).length === 0) {
            emptyResult.run_chart = true;
        }

        if (emptyResult.monthly && emptyResult.run_chart) {
            return;
        }

        // Retrieve the monthly summary and store them in the pinia store
        summary.incomeExpenseSummary.value = monthlySummary.income_and_expense_pie ? monthlySummary.income_and_expense_pie : null;
        summary.expenseByCategory.value = monthlySummary.expense_by_category ? monthlySummary.expense_by_category : null;
        summary.topThreeExpenses.value = monthlySummary.top_three_expenses ? monthlySummary.top_three_expenses : null;
        
        if (runChartSummary) {
            summary.expensesPerDay.value = runChartSummary.expenses_per_day ? runChartSummary.expenses_per_day : null;
            summary.incomePerDay.value = runChartSummary.income_per_day ? runChartSummary.income_per_day : null;
            summary.dayListForTheMonth.value = runChartSummary.day_list;
        }

        console.log(`Monthly Summary`);
        console.log(summary.incomeExpenseSummary.value);
        console.log(summary.expenseByCategory.value);
        console.log(summary.topThreeExpenses.value);
        console.log(summary.expensesPerDay.value);
        console.log(summary.incomeExpenseSummary.value);
        console.log(summary.dayListForTheMonth.value);


    } catch (err) {
        console.error(`An error occured while retrieving the user's monthly summary`);
        console.error(err);
        feedbackFromBackend.message = err.response.data.message;
        feedbackFromBackend.success = false;
        retrieveResourcesFail.value = true;

        if (err.response.status === 401 && err.response.data.message == 'Invalid token. Unable to retrieve information') {
            await axios.post('/api/account/logout');
            user.resetUserStore();
            localStorage.removeItem('user');
            router.push({ name: 'login' });
        }

    } finally {
        isLoadingPage.value = false;

    }
}

onMounted( async () => {
    await retrieveMonthlySummary();
})
</script>


<style scoped>
.monthly-summary-component {
    margin-block-start: 20px;
}

h1, p {
    text-align: center;
    margin-block-end: 20px;
}

span {
    color: #ff4161;
    font-weight: bolder;
    font-size: 2rem;
}

.charts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); /* Responsive grid */
    gap: 20px; /* Space between charts */
    justify-items: center; /* Center charts */
    align-items: center;
    width: 100%;
}

/* Make sure the chart containers take the full width of their grid cells */
::v-deep(.chart-container) {
    inline-size: 100%; /* Ensures charts stretch to fit their containers */
    block-size: 300px; /* Adjusts height dynamically */
    max-width: 600px; /* Prevents charts from getting too large */
}

/* Laptop and Above */
@media screen and (min-width: 768px) {
    .charts {
        grid-template-columns: repeat(2, 1fr); /* Two equal columns */
    }

    ::v-deep(.chart-container) {
        block-size: 500px; /* Adjusts height dynamically */
    }
}
</style>
