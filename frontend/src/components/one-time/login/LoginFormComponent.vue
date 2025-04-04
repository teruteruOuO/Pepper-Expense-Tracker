<template>
<section class="login-form-component">
    <h1>Login</h1>
    <form @submit.prevent="sendCredentials">
        <ul>
            <li>
                <input 
                type="text" 
                name="username" 
                id="username"
                autocomplete
                required
                v-model="credentials.username"
                placeholder="Username">
            </li>
            <li>
                <input 
                type="password" 
                name="password" 
                id="password"
                autocomplete
                required
                v-model="credentials.password"
                placeholder="Password">
            </li>
            <li>
                <RouterLink :to="{ name: 'forgot-password' }">Forgot password?</RouterLink>
            </li>
            <li>
                <button type="submit" :class="{ 'is-loading': isLoading }">
                    <span v-if="isLoading">
                        Loading...
                    </span>
                    <span v-else>
                        Login
                    </span>
                </button>
            </li>
            <li class="feedback" ref="feedbackSection"> 
                <p>{{ backendFeedback }}</p>
            </li>
        </ul>
    </form>

    <section class="sign-up-link">
        <p>Don't have an account? <RouterLink :to="{ name: 'sign-up' }">Sign up</RouterLink></p>
    </section>
</section>
</template>


<script setup>
import axios from 'axios';
import { RouterLink } from 'vue-router';
import { ref, reactive, nextTick } from 'vue';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';

// Initialize variables
const user = useUserStore();
const router = useRouter();
const isLoading = ref(false);
const backendFeedback = ref("");
const credentials = reactive({
    username: "",
    password: ""
});
const feedbackSection = ref(null);

// Send credentials to the backend server to validate 
const sendCredentials = async () => {
    isLoading.value = true;

    try {
        const body = {
            username: credentials.username,
            password: credentials.password
        }
        const response = await axios.post('/api/account/login', body);
        const user_data = response.data.user;

        // Store user's username, first name, and currency settings to the local storage
        user.userInformation.username = user_data.username;
        user.userInformation.first_name = user_data.first_name;
        user.userInformation.currency_code = user_data.currency_code;

        // Redirect user to the dashboard page
        router.push({ name: 'dashboard' });
        isLoading.value = false;

    } catch (err) {
        console.error("An error occured while sending the user's credentials to the backend server in LoginFormComponent");
        console.error(err);
        backendFeedback.value = err.response.data.message;
        isLoading.value = false;

        await nextTick();
        feedbackSection.value?.scrollIntoView({ behavior: "smooth", block: "center" });

    } finally {
        isLoading.value = false;
    }
}
</script>


<style scoped>
.login-form-component > * {
    margin-block-end: 20px;

    /* Center */
    display: flex;
    justify-content: center;
    align-items: center;
}

ul > li {
    margin-block-end: 20px;
}

.sign-up-link {
    color: #BCBCBC;
}

.sign-up-link, li:nth-of-type(2), li:nth-of-type(4) {
    margin-block-end: 0px;
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
    background-color: rgb(255, 240, 243);
    color: rgb(102, 101, 101);
    border-color: rgb(117, 117, 117);
    cursor: not-allowed;
}

a:link, a:visited {
    color: black;
}

a:focus, a:hover {
    color: pink;
}

a:active {
    color: pink;
}

/* style for backend feedback variables */
.feedback {
    color: red;
}

input {
    border-radius: 5px;
    inline-size: 312px;
    block-size: 48px;
    border: 1px solid black;
}

h1 {
    /* Center text */
    display: flex;
    justify-content: center;
    align-items: center;
}

/* Phone Horizontal */
@media screen and (min-width: 576px) {
    .login-form-component {
        margin-block-start: 30px;
    }

    .login-form-component > * {
        margin-block-end: 30px;

    }

    ul > li {
        margin-block-end: 30px;
    }


    .sign-up-link, li:nth-of-type(2){
        margin-block-end: 0px;
    }
}

/* Laptop and above*/
@media screen and (min-width: 768px) {
    .login-form-component > * {
        margin-block-end: 50px;

    }

    ul > li {
        margin-block-end: 50px;
    }


    .sign-up-link, li:nth-of-type(2){
        margin-block-end: 0px;
    }
}

</style>