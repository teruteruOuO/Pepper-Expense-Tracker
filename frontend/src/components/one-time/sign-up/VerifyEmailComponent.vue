<template>
<section class="verify-email">
    <h1><label for="email">Enter your Email</label></h1>
    <form @submit.prevent="verifyEmail">
        <ul>
            <li>
                <input 
                type="email"
                name="email"
                id="email"
                required
                v-model="email"
                placeholder="Email">
            </li>
            <li class="feedback">
                {{ feedbackFromBackend }}
            </li>
            <li>
                <button type="submit">
                    <span v-if="!isLoading">Verify Email</span>
                    <span v-else :class="{ 'is-loading': isLoading }">Sending Code to Your Email...</span>
                </button>
            </li>
        </ul>
    </form>
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
.verify-email > * {
    margin-block-end: 50px;
    
    /* Center */
    display: flex;
    justify-content: center;
    align-items: center;
}

h1 > label {
    font-size: 2rem;
}

.verify-email:last-child {
    margin-block-end: 0px;
}

ul > li {
    margin-block-end: 50px;
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
    .verify-email {
        margin-block-start: 30px;
    }

    .verify-email > * {
        margin-block-end: 30px;
        
    }

    .verify-email:last-child {
        margin-block-end: 0px;
    }

    ul > li {
        margin-block-end: 30px;
    }
}

/* Laptop and above*/
@media screen and (min-width: 768px) {
    .verify-email {
        margin-block-start: 0px;
    }

    .verify-email > * {
        margin-block-end: 50px;
        
    }

    .verify-email:last-child {
        margin-block-end: 0px;
    }

    ul > li {
        margin-block-end: 50px;
    }
}
</style>