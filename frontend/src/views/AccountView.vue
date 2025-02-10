<template>
<main class="account-view">
    <h1>Account Page</h1>
    <UpdateProfileComponent />
    <LogoutComponent />
</main>
</template>


<script setup>
import UpdateProfileComponent from '@/components/one-time/account/UpdateProfileComponent.vue';
import LogoutComponent from '@/components/one-time/account/LogoutComponent.vue';
</script>


<style scoped>
</style>