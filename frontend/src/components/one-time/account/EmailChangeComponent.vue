<template>
<section class="email-change-component">
    <h2>Email Change</h2>
    <section class="loader" v-if="isLoadingPage">
    </section>

    <section class="retrieve-fail" :class="{ 'feedback-success': feedbackFromBackendSuccess, 'feedback-fail': !feedbackFromBackendSuccess }" v-else-if="retrieveResourceFail">
        <p>{{ feedbackFromBackend }}</p>
    </section>

    <section class="success" v-else>
        <section>
            <p>Your current email is: {{ currentEmail }} </p>
        </section>
        <form @submit.prevent="sendCode()">
            <ul>
                <li>
                    <label for="new-email">New Email: </label>
                    <input type="email" name="new-email" id="new-email" required v-model="emailInput.new_email">
                </li>
                <li>
                    <button type="submit" :class="{ 'is-loading': isLoadingSendCode }">
                        <span v-if="!isLoadingSendCode">Send Code</span>
                        <span v-else>Loading...</span>
                    </button>
                </li>
            </ul>
        </form>

        <form @submit.prevent="verifyCode()">
            <ul>
                <li>
                    <label for="code-for-email-change">Code: </label>
                    <input type="text" name="code-for-email-change" id="code-for-email-change" required v-model="emailInput.one_time_code" minlength="6" maxlength="6">
                </li>
                <li>
                    <button type="submit" :class="{ 'is-loading': isLoadingVerifyCode }">
                        <span v-if="!isLoadingVerifyCode">Verify Code and Change Email</span>
                        <span v-else>Loading...</span>
                    </button>
                </li>
            </ul>
        </form>

        <section :class="{ 'feedback-success': feedbackFromBackendSuccess, 'feedback-fail': !feedbackFromBackendSuccess }">
            <p>{{ feedbackFromBackend }}</p>
        </section>
    </section>
    
</section> 
</template>


<script setup>
import axios from 'axios';
import { useUserStore } from '@/stores/user';
import { ref, reactive, onMounted } from 'vue';

// Initialize variables
const user = useUserStore();
const currentEmail = ref("");
const isLoadingSendCode = ref(false);
const isLoadingVerifyCode = ref(false);
const isLoadingPage = ref(false);
const retrieveResourceFail = ref(false);
const feedbackFromBackend = ref("");
const feedbackFromBackendSuccess = ref(false);
const emailInput = reactive({
    new_email: "",
    one_time_code: ""
});

// keeps the email static after it is submitted
const email = ref("");

// Sends a one time code to the user's email
const sendCode = async () => {
    isLoadingSendCode.value = true;

    try {
        const response = await axios.post(`/api/user/change-email/send-code/${user.userInformation.username}`, { new_email: emailInput.new_email });
        email.value = response.data.new_email;
        feedbackFromBackend.value = response.data.message;
        feedbackFromBackendSuccess.value = true;

    } catch (err) {
        console.error(`A server error occured while sending a code to the user's new email.`);
        console.error(err);
        feedbackFromBackend.value = err.response.data.message;
        feedbackFromBackendSuccess.value = false;

    } finally {
        isLoadingSendCode.value = false;

    }
}

// Verify the code and change the email
const verifyCode = async () => {
    isLoadingVerifyCode.value = true;

    if (!email.value) {
        feedbackFromBackend.value = 'You must send a valid email first before you can change your email and enter the code here.';
        feedbackFromBackendSuccess.value = false;
        isLoadingVerifyCode.value = false;
    }

    try {
        const body = { new_email: email.value, one_time_code: emailInput.one_time_code }
        const response = await axios.put(`/api/user/change-email/${user.userInformation.username}`, body);
        alert(response.data.message);
        feedbackFromBackendSuccess.value = true;
        email.value = "";

        // reload the account page
        window.location.reload();

    } catch (err) {
        console.error(`A server error occured while updating the user's email.`);
        console.error(err);
        feedbackFromBackend.value = err.response.data.message;
        feedbackFromBackendSuccess.value = false;

    } finally {
        isLoadingVerifyCode.value = false;

    }
}


// Retrieve the user's current email
const retrieveCurrentEmail = async () => {
    isLoadingPage.value = true;

    try {
        const response = await axios.get(`/api/user/email/${user.userInformation.username}`);
        console.log(response.data.message);
        currentEmail.value = response.data.current_email;

    } catch (err) {
        console.error(`A server error occured while updating the user's email.`);
        console.error(err);
        feedbackFromBackend.value = err.response.data.message;
        feedbackFromBackendSuccess.value = false;
        currentEmail.value = "unknown";
        retrieveResourceFail.value = true;

    } finally {
        isLoadingPage.value = false;

    }
}

// Automatically retrieve the user's current email.
onMounted(async () => {
    await retrieveCurrentEmail();
})
</script>



<style scoped>
.email-change-component {
    border: 1px solid rgb(124, 0, 128);
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

.feedback-fail {
    color: red;
}

.feedback-success {
    color: green;
}

/* style for isLoading variables */
.is-loading {
    background-color: rgb(94, 94, 30);
    color: gray;
    cursor: not-allowed;
}
</style>