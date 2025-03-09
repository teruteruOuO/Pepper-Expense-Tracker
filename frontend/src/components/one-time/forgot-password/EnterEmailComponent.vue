<template>
<section class="enter-email-component">  
    <h1><label for="email">Send confirmation code to your Email</label></h1>
    <form @submit.prevent="sendCode()">
        <ul>
            <li>
                <input type="email" name="email" id="email" required v-model="email" placeholder="Email"> 
            </li>
            <li class="feedback">
                {{ feedbackFromBackend }}
            </li>
            <li>
                <button type="submit" :class="{ 'is-loading': isLoading }">
                    <span v-if="isLoading">Sending a code to your email...</span>
                    <span v-else>Send Code</span>
                </button>
            </li>
        </ul>
    </form>
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
.enter-email-component > * {
    margin-block-end: 40px;

    /* Center */
    display: flex;
    justify-content: center;
    align-items: center;
}

h1 > label {
    font-size: 2rem;
    text-align: center;
}

ul > li {
    margin-block-end: 40px;
}


li:first-of-type, li:last-of-type {
    margin-block-end: 0px;
}

.feedback {
    color: red;
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
    .enter-email-component {
        margin-block-start: 30px;
    }

    .enter-email-component > * {
        margin-block-end: 30px;
    }

    ul > li {
        margin-block-end: 30px;
    }
}

/* Laptop and above*/
@media screen and (min-width: 768px) {
    .enter-email-component {
        margin-block-start: 0px;
    }

    .enter-code-component > * {
        margin-block-end: 40px;
    }

    ul > li {
        margin-block-end: 40px;
    }

}
</style>