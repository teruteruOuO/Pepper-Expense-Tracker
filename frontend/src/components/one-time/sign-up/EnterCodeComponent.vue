<template>
<section class="enter-code-component">
    <h2>Enter Code Component</h2>
    <form @submit.prevent="validateCode()">
        <ul>
            <li>
                <label for="code">Code: </label>
                <input 
                type="text" 
                name="code" 
                id="code" 
                required 
                minlength="6" 
                maxlength="6"
                v-model="codeFromUser">
            </li>
            <li>
                <button type="submit">
                    <span v-if="!isLoadingEnterCode">Enter</span>
                    <span v-else :class="{ 'is-loading': isLoadingEnterCode }">Loading...</span>
                </button>
            </li>
            <li>
                <button type="button" @click="resendCode()">
                    <span v-if="!isLoadingResendCode">Resend a new code</span>
                    <span v-else :class="{ 'is-loading': isLoadingResendCode }">Sending a new code...</span>
                </button>
            </li>
        </ul>
    </form>

    <section :class="{ 'feedback-fail': feedbackFromBackendStyle === 'fail',  'feedback-success': feedbackFromBackendStyle === 'success'}">
        <p>{{ feedbackFromBackend }}</p>
    </section>
</section>
</template>


<script setup>
import axios from 'axios';
import { useEmailSignup } from '@/stores/email-signup';
import { ref } from 'vue';

// Initialize variables
const isLoadingResendCode = ref(false);
const isLoadingEnterCode = ref(false);
const emailInformation = useEmailSignup();
const feedbackFromBackend = ref("");
const feedbackFromBackendStyle = ref("");
const codeFromUser = ref("");

// Resend a new code to the user's email
const resendCode = async () => {
    isLoadingResendCode.value = true;

    try {
        // Ask backend server to resend a code to the user
        const response = await axios.post('/api/account/sign-up/resend-code', { email: emailInformation.emailStatus.email });
        feedbackFromBackend.value = response.data.message;
        feedbackFromBackendStyle.value = 'success';
        codeFromUser.value = "";
        
    } catch (err) {
        console.error('An error occured while resending a code to the user in EnterCodeComponent in Sign Up Page.');
        console.error(err);
        feedbackFromBackend.value = err.response.data.message;
        feedbackFromBackendStyle.value = 'fail';

    } finally {
        isLoadingResendCode.value = false;
    }
}

// Compare the code sent to the user and the code the user provided in the form
const validateCode = async () => {
    isLoadingEnterCode.value = true;

    try {
        // Validate user code input and the the code from the database
        const body = { code: codeFromUser.value, email: emailInformation.emailStatus.email }
        const response = await axios.post('/api/account/validate-code', body);
        codeFromUser.value = "";
        console.log(response.data.message);

        // Move to SignupFormComponent stage
        emailInformation.signUpComponent();
        
    } catch (err) {
        console.error('An error occured while validating the code');
        console.error(err);
        feedbackFromBackend.value = err.response.data.message;
        feedbackFromBackendStyle.value = 'fail';
        

    } finally {
        isLoadingEnterCode.value = false;
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

.feedback-fail {
    color: red;
}

.feedback-success {
    color: green;
}
</style>