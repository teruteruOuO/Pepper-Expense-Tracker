<template>
<section class="login-form-component">
    <form @submit.prevent="sendCredentials">
        <ul>
            <li>
                <label for="username">Username: </label>
                <input 
                type="text" 
                name="username" 
                id="username"
                autocomplete
                required
                v-model="credentials.username">
            </li>
            <li>
                <label for="password">Password: </label>
                <input 
                type="password" 
                name="password" 
                id="password"
                autocomplete
                required
                v-model="credentials.password">
            </li>
            <li>
                <button type="submit" :class="{ 'is-loading': isLoading }">
                    <span v-if="isLoading">
                        Loading...
                    </span>
                    <span v-else>
                        Log in
                    </span>
                </button>
            </li>
        </ul>
    </form>

    <section class="forgot-password-link">
        <p><RouterLink :to="{ name: 'forgot-password' }">Forgot your password?</RouterLink></p>
    </section>

    <section class="feedback">
        <p>{{ backendFeedback }}</p>
    </section>
</section>
</template>


<script setup>
import axios from 'axios';
import { RouterLink } from 'vue-router';
import { ref, reactive } from 'vue';
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

    } finally {
        isLoading.value = false;
    }
}
</script>


<style scoped>
.login-form-component {
    border: 1px solid red;
    border-radius: 5px;
}

button {
    border: 1px solid black;
    border-radius: 5px;
    background-color: yellow;
}

button:active {
    background-color: rgb(94, 94, 30);
    color: white;
}

/* style for backend feedback variables */
.feedback {
    color: red;
}

.is-loading {
    background-color: rgb(94, 94, 30);
    color: gray;
    cursor: not-allowed;
}

</style>