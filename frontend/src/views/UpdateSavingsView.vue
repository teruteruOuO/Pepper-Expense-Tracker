<template>
<main class="update-savings-view">
    <h1>Update Savings View</h1>
    <SavingsOperationComponent />
    <UpdateSavingsComponent />
</main> 
</template>

<script setup>
import UpdateSavingsComponent from '@/components/one-time/savings/UpdateSavingsComponent.vue';
import SavingsOperationComponent from '@/components/one-time/savings/SavingsOperationComponent.vue';
</script>