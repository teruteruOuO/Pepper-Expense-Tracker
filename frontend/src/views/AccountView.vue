<template>
<main class="account-view">
    <h1>Account Page</h1>
    <UpdateProfileComponent />
    <PasswordChangeComponent />
    <LogoutComponent />
</main>
</template>


<script setup>
import UpdateProfileComponent from '@/components/one-time/account/UpdateProfileComponent.vue';
import PasswordChangeComponent from '@/components/one-time/account/PasswordChangeComponent.vue';
import LogoutComponent from '@/components/one-time/account/LogoutComponent.vue';
</script>


<style scoped>
</style>