<template>
<section class="deadline">
    <h1>Deadline Summary</h1>

    <section class="loader" v-if="isLoadingPage">
    </section>

    <section class="retrieve-fail" v-else-if="retrieveResourcesFail">
        <p>{{ feedbackFromBackend.message }}</p>
    </section>

    <section class="none" v-else-if="emptyResult">
        <p>You don't have any budgets, expenses, or savings that are due soon.</p>
    </section>

    <section class="retrieve-success" v-else>
        <p>
            {{ user.userInformation.first_name }}, these are the records that are due within <span>
                30 days.
            </span>
        </p>
        <section class="tables">
            <DueBudgetsComponent />
            <DueSavingsComponent />
            <DueExpensesComponent />
            <OverdueExpensesComponent />
        </section>
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

<style scoped>
.deadline {
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

::v-deep(table) {
    border-radius: 15px; 
    overflow: hidden;
    inline-size: 100%; /* Adjust width as needed */
    max-inline-size: 1000px; /* Prevents it from getting too wide */
    margin: 0 auto; /* Centers the table */
}

::v-deep(table), ::v-deep(th), ::v-deep(tr), ::v-deep(td) {
    border: 1px solid black;
    text-align: center;
}

::v-deep(td) {
    overflow: hidden;
    text-overflow: ellipsis; /* Adds "..." for overflowed text */
    white-space: nowrap;
}

::v-deep(tbody tr:hover) {
    background:
        linear-gradient(to bottom, white, rgba(255, 187, 198, 0.5), rgba(255, 255, 255, 0.7), white),  
        linear-gradient(to right, white, rgb(255, 187, 198), white, rgb(255, 187, 198), white, rgb(255, 187, 198));
    color: rgb(255, 14, 54);
    cursor: pointer;
}

.tables {
    display: grid;
    grid-template-columns: 1fr; /* Default: Single column on small screens */
    gap: 20px;
    max-inline-size: 1300px; /* Prevents excessive stretching */
    margin: 0 auto; /* Centers the grid */
}

.tables > * {
    border: 1px solid black;
    border-radius: 5px;
    margin: 0 auto;
}

::v-deep(h3) {
    text-align: center;
    color: rgb(252, 38, 74);
}

/* Phone Horizontal */
@media screen and (min-width: 576px) {
    ::v-deep(td) {
        white-space: wrap;
    }
}

/* Laptop and Above */
@media screen and (min-width: 768px) {
    .tables {
        grid-template-columns: repeat(2, 1fr); /* Two equal columns */
    }
}
</style>