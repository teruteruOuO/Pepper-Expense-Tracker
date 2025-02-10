<template>
<main class="dashboard-view">
    <h1>Dashboard Page</h1>
    <p>Hello {{ user.userInformation.first_name }}! Your current currency settings is {{ user.userInformation.currency_code }}</p>

</main>
</template>

<script setup>
import { useUserStore } from '@/stores/user';

const user = useUserStore();
</script>