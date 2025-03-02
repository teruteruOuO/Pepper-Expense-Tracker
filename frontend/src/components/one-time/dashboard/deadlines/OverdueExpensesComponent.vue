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
            <tr v-for="expense in deadlines.overdueExpenses.value" :key="expense.sequence">
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

const deadlines = deadlineStore();
</script>


<style scoped>
table, th, tr, td {
    border: 1px solid black;
    text-align: center;
}

tbody tr:hover {
    background-color: pink;
}
</style>