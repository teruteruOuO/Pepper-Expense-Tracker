<template>
<main class="dashboard-view">
    <h1>Dashboard Page</h1>
    <MonthlySummaryComponent />
</main>
</template>

<script setup>
import { useUserStore } from '@/stores/user';
import MonthlySummaryComponent from '@/components/one-time/dashboard/monthly-summary/MonthlySummaryComponent.vue';

const user = useUserStore();
</script>