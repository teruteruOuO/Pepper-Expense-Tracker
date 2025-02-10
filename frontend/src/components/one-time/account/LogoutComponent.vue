<template>
    <section class="logout-component">
        <p>Temporary location for log out functionality</p>
        <button @click="logoutUser">Log out</button>
    </section>
</template>

<script setup>
import axios from 'axios';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';

// Initialize Variables
const router = useRouter();
const user = useUserStore();

// Logout use after clicking the button
const logoutUser = async () => {
    await axios.post('/api/account/logout');
    user.resetUserStore();
    localStorage.removeItem('user');
    router.push({ name: 'login' });
}
</script>

<style scoped>
.logout-component {
    border: 1px solid red;
    border-radius: 5px;
}
</style>