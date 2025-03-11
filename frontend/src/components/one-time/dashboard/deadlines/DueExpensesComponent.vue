<template>
<section class="due-expenses-component" v-if="deadlines.dueExpenses.value">
    <h3>Due Expenses</h3>
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Due Date</th>
                <th>Days Until Due</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="expense in deadlines.dueExpenses.value" :key="expense.sequence" @click="enterTransaction(expense.sequence)">
                <td>{{ expense.name }}</td>
                <td>{{ expense.deadline }}</td>
                <td>{{ expense.days_until_due }}</td>
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