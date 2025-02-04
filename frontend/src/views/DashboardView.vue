<template>
<main class="dashboard-view">
    <h1>Dashboard Page</h1>
    <p>Hello {{ user.userInformation.first_name }}! Your current currency settings involve using the {{ user.settings.currency_sign }} sign</p>

</main>
</template>

<script setup>
import { useUserStore } from '@/stores/user';

const user = useUserStore();
</script>