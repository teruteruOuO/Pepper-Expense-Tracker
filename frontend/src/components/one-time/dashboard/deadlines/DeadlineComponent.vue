<template>
<section class="deadline">
    <h2>Deadline Component</h2>

    <section class="loader" v-if="isLoadingPage">
    </section>

    <section class="retrieve-fail" v-else-if="retrieveResourcesFail">
        <p>{{ feedbackFromBackend.message }}</p>
    </section>

    <section class="none" v-else-if="emptyResult">
        <p>You don't have any budgets, expenses, or savings that are due soon.</p>
    </section>

    <section class="success" v-else>
        <DueBudgetsComponent />
        <DueSavingsComponent />
        <DueExpensesComponent />
        <OverdueExpensesComponent />
    </section>
</section> 
</template>


<script setup>
import DueBudgetsComponent from './DueBudgetsComponent.vue';
import DueSavingsComponent from './DueSavingsComponent.vue';
import DueExpensesComponent from './DueExpensesComponent.vue';
import OverdueExpensesComponent from './OverdueExpensesComponent.vue';
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';
import { useUserStore } from '@/stores/user';
import { deadlineStore } from '@/stores/deadlines';

const user = useUserStore();
const deadlines = deadlineStore();
const isLoadingPage = ref(false);
const retrieveResourcesFail = ref(false);
const emptyResult = ref(false);
const feedbackFromBackend = reactive({
    message: '',
    success: false
});

// Retrieve the user's preferred currency and deadline summary
const retrieveDeadline = async () => {
    isLoadingPage.value = true;

    try {
        const response = await axios.get(`/api/dashboard/deadlines/${user.userInformation.username}`);

        // Retrieve the deadline summary
        console.log(response.data.message);
        console.log(response.data.deadline_summary);

        // Don't continue if there are no deadline records
        const deadlineSummary = response.data.deadline_summary;
        if (!deadlineSummary || Object.keys(deadlineSummary).length === 0) {
            emptyResult.value = true;
        }

        // Retrieve data for each category
        deadlines.dueBudgets.value = deadlineSummary.due_budgets;
        deadlines.dueSavings.value = deadlineSummary.due_savings;
        deadlines.dueExpenses.value = deadlineSummary.due_expense_transactions;
        deadlines.overdueExpenses.value = deadlineSummary.overdue_expense_transactions;

        console.log(`Deadline Summary:`);
        console.log(deadlines.dueBudgets.value);
        console.log(deadlines.dueSavings.value);
        console.log(deadlines.dueExpenses.value);
        console.log(deadlines.overdueExpenses.value);

    } catch (err) {
        console.error(`An error occured while retrieving the user's deadline summary.`);
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

onMounted(async () => {
    await retrieveDeadline();
});
</script>