<template>
    <section class="logout-component">
        <button @click="logoutUser">Logout of the Account</button>
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
section {
    margin-block-start: 30px;
    display: flex;
    justify-content: center;
    align-content: center;
}

button {
    border: 1px solid black;
    border-radius: 5px;
    inline-size: 312px;
    block-size: 48px;
    border: 1px solid black;
    background-color: #FFD0D8;

}

button:focus, button:hover {
    background-color: rgb(255, 225, 230);
    color: rgb(59, 59, 59);
    border-color: rgb(59, 59, 59);
}

button:active, .is-loading {
    color: rgb(102, 101, 101);
    border-color: rgb(117, 117, 117);
    cursor: not-allowed;
}
</style>