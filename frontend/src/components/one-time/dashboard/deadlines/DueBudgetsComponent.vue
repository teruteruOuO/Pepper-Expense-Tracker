<template>
<section class="due-budgets-component" v-if="deadlines.dueBudgets.value">
    <h3>Due Budgets</h3>
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Due Date</th>
                <th>Used Amount Progress</th>
                <th>Days Until Due</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="budget in deadlines.dueBudgets.value" :key="budget.id">
                <td>{{ budget.name }}</td>
                <td>{{ budget.end_date }}</td>
                <td><meter :value="budget.progress" min="0" max="100" low="25" high="75" optimum="0">{{ budget.progress }}</meter>{{ budget.progress }}%</td>
                <td>{{ budget.days_until_due }}</td>
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