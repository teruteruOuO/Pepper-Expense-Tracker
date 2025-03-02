<template>
<section class="monthly-summary-component">
    <h2>Monthly Summary Component</h2>

    <section class="loader" v-if="isLoadingPage">
    </section>

    <section class="retrieve-fail" v-else-if="retrieveResourcesFail">
        <p>{{ feedbackFromBackend.message }}</p>
    </section>

    <section class="empty-summary" v-else-if="emptyResult.monthly && emptyResult.run_chart">
        <p>You do not have any records for this month yet. How about adding one?</p>
    </section>

    <section class="success" v-else>
        <p>
            Hello {{ user.userInformation.first_name }}! This is your summary for 
            {{ new Date().toLocaleString('en-US', { month: 'long', timeZone: 'UTC' }) }} 
        </p>
        <IncomeExpenseSummaryComponent />
        <ExpenseByCategoryComponent />
        <TopThreeExpenseComponent />
        <RunChartComponent />
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

    } finally {
        isLoadingPage.value = false;

    }
}

onMounted( async () => {
    await retrieveMonthlySummary();
})

</script>
