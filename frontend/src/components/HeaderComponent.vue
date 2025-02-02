<template>
<header class="header-component">
    <h1>This is the header</h1>
    <nav>
        <ul v-if="isLoggedIn">
            <li>Dashboard</li>
            <li>Transaction</li>
            <li>Budget</li>
            <li>Savings</li>
            <li>Account</li>
        </ul>
        <ul v-else>
            <li><RouterLink :to="{ name: 'login' }">Login</RouterLink></li>
            <li><RouterLink :to="{ name: 'sign-up' }">Sign Up</RouterLink></li>
        </ul>
    </nav>
</header>
</template>

<script setup>
import { RouterLink } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { computed } from 'vue';

const user = useUserStore();

// If user is logged in, then Dashboard, Transaction, Budget, Savings, and Account pages link are shown to the header; otherwise, show only Login and Sign Up page links
const isLoggedIn = computed(() => {
    const verdict = user.userInformation.username && user.userInformation.first_name ? true : false;
    return verdict;
});

</script>

<style scoped>
/* Phone Horizontal */
@media screen and (min-width: 576px) {
    header {
        grid-template-areas: 
        "h1 nav";
    }
}

/* Laptop */
@media screen and (min-width: 768px) {

}

/* Desktop */
@media screen and (min-width: 1024px) {

}

/* Large Desktop */
@media screen and (min-width: 1200px) {

}
</style>