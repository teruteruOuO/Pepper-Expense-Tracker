<template>
<section class="enter-code-component">
    <h1><label for="code">Enter the Correct Code</label></h1>
    <form @submit.prevent="validateCode()">
        <ul>
            <li>
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
                <button type="submit" :class="{ 'is-loading': isLoadingEnterCode }">
                    <span v-if="!isLoadingEnterCode">Enter</span>
                    <span v-else>Verifying Code</span>
                </button>
            </li>
            <li>
                <button type="button" @click="resendCode()" :class="{ 'is-loading': isLoadingResendCode }">
                    <span v-if="!isLoadingResendCode">Resend Code</span>
                    <span v-else>Resending a new code to your email</span>
                </button>
            </li>
        </ul>
    </form>

    <section ref="feedbackSection" class="feedback" :class="{ 'fail': feedbackFromBackendStyle === 'fail',  'success': feedbackFromBackendStyle === 'success'}">
        <p>{{ feedbackFromBackend }}</p>
    </section>
</section>
</template>


<script setup>
import axios from 'axios';
import { useForgotPassword } from '@/stores/forgot-password';
import { ref, nextTick } from 'vue';

// Initialize variables
const isLoadingResendCode = ref(false);
const isLoadingEnterCode = ref(false);
const monitorForgotPassword = useForgotPassword();
const feedbackFromBackend = ref("");
const feedbackFromBackendStyle = ref("");
const codeFromUser = ref("");
const feedbackSection = ref(null); 

// Resend a new code to the user's email
const resendCode = async () => {
    isLoadingResendCode.value = true;

    try {
        // Ask backend server to resend a code to the user
        const response = await axios.post('/api/account/forgot-password/send-code', { email: monitorForgotPassword.forgotPasswordStatus.email });
        feedbackFromBackend.value = response.data.message;
        feedbackFromBackendStyle.value = 'success';
        codeFromUser.value = "";
        
    } catch (err) {
        console.error('An error occured while resending a code to the user in EnterCodeComponent in ForgotPasswordView.');
        console.error(err);
        feedbackFromBackend.value = err.response.data.message;
        feedbackFromBackendStyle.value = 'fail';

    } finally {
        isLoadingResendCode.value = false;

        await nextTick();
        feedbackSection.value?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

// Compare the code sent to the user and the code the user provided in the form
const validateCode = async () => {
    isLoadingEnterCode.value = true;

    try {
        // Validate user code input and the the code from the database
        const body = { code: codeFromUser.value, email: monitorForgotPassword.forgotPasswordStatus.email }
        const response = await axios.post('/api/account/validate-code', body);
        codeFromUser.value = "";
        console.log(response.data.message);

        // Move to EnterPasswordComponent stage
        monitorForgotPassword.enterPasswordComponent();
        
    } catch (err) {
        console.error('An error occured while validating the code');
        console.error(err);
        feedbackFromBackend.value = err.response.data.message;
        feedbackFromBackendStyle.value = 'fail';
        
        await nextTick();
        feedbackSection.value?.scrollIntoView({ behavior: "smooth", block: "center" });

    } finally {
        isLoadingEnterCode.value = false;
    }
}
</script>

<style scoped>
.enter-code-component > * {
    margin-block-end: 50px;
    
    /* Center */
    display: flex;
    justify-content: center;
    align-items: center;
}

h1 {
    text-align: center;
}

h1 > label {
    font-size: 2rem;
}

ul > li {
    margin-block-end: 50px;
}

li:last-of-type {
    margin-block-end: 0px;
}

.feedback {
    margin-block-end: 0px;
}

.fail {
    color: red;
}

.success {
    color: green;
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

input {
    border-radius: 5px;
    inline-size: 312px;
    block-size: 48px;
    border: 1px solid black;
}

/* Phone Horizontal */
@media screen and (min-width: 576px) {
    .enter-code-component {
        margin-block-start: 30px;
    }

    .enter-code-component > * {
        margin-block-end: 30px;
    }

    ul > li {
        margin-block-end: 30px;
    }

    .feedback {
        margin-block-end: 0px;
    }
}

/* Laptop and above*/
@media screen and (min-width: 768px) {
    .enter-code-component > * {
        margin-block-end: 40px;
    }

    ul > li {
        margin-block-end: 40px;
    }

    .feedback {
        margin-block-end: 0px;
    }
}
</style>