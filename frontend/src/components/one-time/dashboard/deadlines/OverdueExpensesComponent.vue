<template>
<section class="overdue-expenses-component" v-if="deadlines.overdueExpenses.value">
    <h3>Overdue Expenses</h3>
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Due Date</th>
                <th>Days Overdue</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="expense in deadlines.overdueExpenses.value" :key="expense.sequence" @click="enterTransaction(expense.sequence)">
                <td>{{ expense.name }}</td>
                <td>{{ expense.deadline }}</td>
                <td>{{ expense.days_overdue }}</td>
            </tr>
        </tbody>
    </table>
</section>
</template>


<script setup>
import { deadlineStore } from '@/stores/deadlines';
import { useRouter } from 'vue-router';

const router = useRouter();
const deadlines = deadlineStore();

// Route to update page for each transaction
const enterTransaction = (sequence) => {
    router.push({ name: 'update-transaction', params: { sequence } });
}
</script>