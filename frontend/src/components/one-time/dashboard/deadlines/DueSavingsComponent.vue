<template>
<section class="due-savings-component" v-if="deadlines.dueSavings.value">
    <h3>Due Savings</h3>
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Due Date</th>
                <th>Progress</th>
                <th>Days Until Due</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="savings in deadlines.dueSavings.value" :key="savings.sequence">
                <td>{{ savings.name }}</td>
                <td>{{ savings.deadline }}</td>
                <td><progress :id="`saving-progress-${savings.sequence}`" max="100" :value="savings.progress">{{ savings.progress }}</progress>{{ savings.progress }}%</td>
                <td>{{ savings.days_until_due }}</td>
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
progress {
    display: block;
    margin: 0 auto;
}
</style>