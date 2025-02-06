<template>
<section class="verify-email">
    <h2>Verify Email</h2>
    <form @submit.prevent="verifyEmail">
        <ul>
            <li>
                <label for="email">Email: </label>
                <input 
                type="email"
                name="email"
                id="email"
                required
                v-model="email">
            </li>
            <li>
                <button type="submit">
                    <span v-if="!isLoading">Verify Email</span>
                    <span v-else :class="{ 'is-loading': isLoading }">Sending Code to Your Email...</span>
                </button>
            </li>
        </ul>
    </form>

    <section class="feedback">
        <p>{{ feedbackFromBackend }}</p>
    </section>
</section>
</template>


<script setup>
import axios from 'axios';
import { useEmailSignup } from '@/stores/email-signup';
import { ref } from 'vue';

// Initialize variables
const isLoading = ref(false);
const emailInformation = useEmailSignup();
const feedbackFromBackend = ref("");
const email = ref('');

// Store email information temporarily in the database server
const verifyEmail = async () => {
    isLoading.value = true;

    try {
        // Send the email to the backend server
        console.log('Current provided email is:', email.value);
        const response = await axios.post('/api/account/sign-up/email-verification', { email: email.value });

        // Store the email to the local storage temporarily
        emailInformation.emailStatus.email = response.data.email;
        emailInformation.emailStatus.completed = false;

        // Email of the code to the user should be sent by this time
        console.log(response.data.message);
        console.log('Your email from the database is:', response.data.email);

        // Switch from this component to EnterCodeComponent (The switching takes place in SignupView)
        emailInformation.enterCodeComponent();

    } catch (err) {
        console.error("An error occured while attempting to verify the user's email in the Verify Email Component in Sign Up Page");
        console.error(err);
        feedbackFromBackend.value = err.response.data.message;

    } finally {
        isLoading.value = false;
    }
}

</script>


<style scoped>
button {
    border-radius: 5px;
    border: 1px solid black;
    background-color: pink;
}

button:active, .is-loading {
    cursor: not-allowed;
    background-color: red;
}

.feedback {
    color: red;
}
</style>