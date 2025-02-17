<template>
<main class="update-savings-view">
    <h1>Update Savings View</h1>
    <p>Warning: Conversions are done at the 8th decimal place, so other currencies aside from USD will be rounded</p>
    <SavingsOperationComponent />
    <UpdateSavingsComponent />
</main> 
</template>

<script setup>
import UpdateSavingsComponent from '@/components/one-time/savings/UpdateSavingsComponent.vue';
import SavingsOperationComponent from '@/components/one-time/savings/SavingsOperationComponent.vue';
</script>

<style scoped>
main > p {
    color: red;
}
</style>