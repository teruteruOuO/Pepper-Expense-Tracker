<template>
<section class="enter-email-component">
    <h2>Forgot Password Component</h2>
    <form @submit.prevent="sendCode()">
        <ul>
            <li>
                <label for="email">Email: </label>
                <input type="email" name="email" id="email" required v-model="email"> 
            </li>
            <li>
                <button type="submit" :class="{ 'is-loading': isLoading }">
                    <span v-if="isLoading">Sending a code to your email...</span>
                    <span v-else>Send Code</span>
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
import { ref } from 'vue';
import axios from 'axios';
import { useForgotPassword } from '@/stores/forgot-password';

// Initialize variables
const monitorForgotPassword = useForgotPassword();
const isLoading = ref(false);
const feedbackFromBackend = ref("");
const email = ref("");

// Send email to the backend server to have backend server send a code to the user's email
const sendCode = async () => {
    isLoading.value = true;

    try {
        const response = await axios.post('/api/account/forgot-password/send-code', { email: email.value });
        console.log(response.data.message);

        // Temporarily store the email in the local storage
        monitorForgotPassword.forgotPasswordStatus.completed = false;
        monitorForgotPassword.forgotPasswordStatus.email = response.data.email;

        // Switch component to EnterCodeComponent
        monitorForgotPassword.enterCodeComponent();

    } catch (err) {
        console.error("An error occured while sending a code to the user's email in EnterEmailComponent in ForgotPasswordView");
        console.error(err);
        feedbackFromBackend.value = err.response.data.message;

    } finally {
        isLoading.value = false;
    }
}

</script>


<style scoped>
.enter-email-component {
    border: 1px solid red;
    border-radius: 5px;
}

.feedback {
    color: red;
}

button {
    background-color: yellow;
    color: red;
    border: 1px solid black;
    border-radius: 5px;
}

.is-loading {
    cursor: not-allowed;
    background-color: gray;
}
</style>