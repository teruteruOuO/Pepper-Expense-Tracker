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
            <tr v-for="budget in deadlines.dueBudgets.value" :key="budget.id" @click="enterBudget(budget.id)">
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
import { useRouter } from 'vue-router';

const router = useRouter();
const deadlines = deadlineStore();

// Route to update page for each budget
const enterBudget = (budget_id) => {
    router.push({ name: 'update-budget', params: { budget_id } });
}
</script>


<style scoped>
meter {
    display: block;
    margin: auto;
}
</style>