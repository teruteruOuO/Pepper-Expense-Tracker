<template>
<header class="header-component">
    <div class="title">
        <img src="../../public/favicon/android-chrome-192x192.png" alt="logo">
        <h1>Pepper's Expense Tracker</h1>
    </div>
    
    <nav>
        <ul v-if="isLoggedIn">
            <li><RouterLink :to="{ name: 'dashboard' }">Dashboard</RouterLink></li>
            <li><RouterLink :to="{ name: 'transaction' }">Transaction</RouterLink></li>
            <li><RouterLink :to="{ name: 'budget' }">Budget</RouterLink></li>
            <li><RouterLink :to="{ name: 'savings' }">Savings</RouterLink></li>
            <li><RouterLink :to="{ name: 'account' }">Account</RouterLink></li>
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
/* Phone Vertical*/
h1 {
    text-align: center;
    flex-direction: row;
    justify-content: center;
    align-content: center;
}

.title {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-content: center;
}

img {
    inline-size: 100px;
    block-size: 100px;
    display: none;
}

nav > ul {
    /* flex parent*/
    display: flex;
    align-items: center;
    justify-content: center;
    row-gap: 5px;
    column-gap: 5px;
    flex-wrap: wrap;

    font-size: 2rem;
}

/* Making the child element take over Li's document precendence in the DOM */
li {
    display: contents;  
}

/* Link styles */
a {
    background-color: black;
    border: 1px solid black;
    font-size: 1.1rem;
    color: white;
    padding: 10px 20px;
    
    /* Center Text */
    display: flex;
    justify-content: center;
    align-items: center;
    text-decoration: none;

    /* flex item*/
    flex-grow: 0;
    flex-basis: 1;
}

a:link, a:visited {
    color: white;
}

a:focus, a:hover {
    background-color: white;
    color: rgb(59, 59, 59);
    border-color: rgb(59, 59, 59);
}

a:active {
    background: linear-gradient(to bottom, white, white, pink, white, white);
    color: rgb(102, 101, 101);
    border-color: white;
}

/* Phone horizontal*/
@media screen and (min-width: 576px) {
    img {
        display: block;
        inline-size: 75px;
        block-size: 75px;
    }
}

/* Laptop */
@media screen and (min-width: 768px) {
    header {
        /* Flex parent */
        /* Center */
        display: flex;
        justify-content: center;
        align-items: center;
        max-inline-size: 1200px;
        margin: auto;
    }

    /* Header children */
    header > * {
        flex-grow: 1;
    }

    img {
        inline-size: 100px;
        block-size: 100px;
    }

    div.title {
        margin-inline-start: 75px;
        margin-inline-end: 75px;
    }

    ul {
        block-size: 100%;
    }

    a {
        block-size: 100%;
        /* Center Text */
        display: flex;
        justify-content: center;
        align-items: center;
    }
}
</style>