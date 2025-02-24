<template>
<main class="update-budget-view">
    <h1>Update Budget Page</h1>
    <UpdateBudgetComponent />
    <BudgetTransactionsComponent />
</main>
</template>


<script setup>
import UpdateBudgetComponent from '@/components/one-time/budget/UpdateBudgetComponent.vue';
import BudgetTransactionsComponent from '@/components/one-time/budget/BudgetTransactionsComponent.vue';
</script>