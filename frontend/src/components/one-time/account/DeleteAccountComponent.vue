<template>
<section class="delete-account-component">
    <h1>Delete Account</h1>
    <form @submit.prevent="sendCode()">
        <ul>
            <li>
                <label for="password-delete-account">Current Password: </label>
                <input type="password" name="password-delete-account" id="password-delete-account" required v-model="userPasswords.current_password">
            </li>
            <li>
                <label for="confirm-password-delete-account">Confirm Password: </label>
                <input type="password" name="confirm-password-delete-account" id="confirm-password-delete-account" required v-model="userPasswords.confirm_password">
            </li>
            <li>
                <button type="submit" :class="{ 'is-loading': isLoadingSendCode }">
                    <span v-if="!isLoadingSendCode">Send Code</span>
                    <span v-else>Loading...</span>
                </button>
            </li>
        </ul>
    </form>

    <form @submit.prevent="deleteAccount()">
        <ul>
            <li>
                <label for="code-delete-account">Code: </label>
                <input type="text" name="code-delete-account" id="code-delete-account" required maxlength="6" minlength="6" v-model="oneTimeCode">
            </li>
            <li>
                <button type="submit" :class="{ 'is-loading': isLoadingDeleteAccount }">
                    <span v-if="!isLoadingDeleteAccount">Delete Account</span>
                    <span v-else>Loading...</span>
                </button>
            </li>
        </ul>
    </form>

    <section class="feedback" :class="{ 'success': feedbackFromBackendSuccess, 'fail': !feedbackFromBackendSuccess }" ref="feedbackSection">
        <p>{{ feedbackFromBackend }}</p>
        <p>{{ confirmPasswordFeedback }}</p>
    </section>
</section>
</template>


<script setup>
import axios from 'axios';
import { ref, reactive, computed, nextTick } from 'vue';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';

// Initialize variables
const isLoadingSendCode = ref(false);
const isLoadingDeleteAccount= ref(false);
const feedbackFromBackend = ref("");
const feedbackFromBackendSuccess = ref(false);
const feedbackSection = ref(null);
const user = useUserStore();
const router = useRouter();
const oneTimeCode = ref("");
const userPasswords = reactive({
    current_password: "",
    confirm_password: ""
});

// Informs user that password and confirm password fields do not match
const confirmPasswordFeedback = computed(() => {
    if (
        (userPasswords.current_password && userPasswords.confirm_password) 
        && 
        (userPasswords.current_password !== userPasswords.confirm_password)
    ) {
        return "* Password and Confirm Password must match";

    } else {
        return null;
    }
});


// Send a one time code to the user's email
const sendCode = async () => {
    isLoadingSendCode.value = true;
    const answer = window.confirm("If you continue, we will send a one time code that will be used to delete your account. Continue?");

    if (!answer) {
        console.log("The system stopped sending a one time code of deletion to the user's email.");
        isLoadingSendCode.value = false;
        return; // Prevents navigation if the user cancels the prompt
        
    }

    try {
        // Do not continue with the remainder of the process if passwords do not match and adhere to the password safety rules
        if (confirmPasswordFeedback.value) {
            console.error('Confirm Password is not solved yet; therefore, username change process will not continue');
            return;
        }
        const response = await axios.post(`/api/user/delete-account/send-code/${user.userInformation.username}`, { current_password: userPasswords.current_password });
        feedbackFromBackendSuccess.value = true;
        feedbackFromBackend.value = response.data.message;

    } catch (err) {
        console.error(`A server error occured while trying to send a one time code to your email.`);
        console.error(err);
        feedbackFromBackendSuccess.value = false;
        feedbackFromBackend.value = `* ${err.response.data.message}`;
        
    } finally {
        isLoadingSendCode.value = false;

        await nextTick();
        feedbackSection.value?.scrollIntoView({ behavior: "smooth", block: "center" });

    }
}

const deleteAccount = async (req, res) => {
    isLoadingDeleteAccount.value = true;

    const answer = window.confirm("If you continue, your account will be permanently deleted and can never be retrieved again. Continue?");

    if (!answer) {
        console.log("The system stopped trying to delete the user's account.");
        isLoadingDeleteAccount.value = false;
        return; // Prevents navigation if the user cancels the prompt
        
    }  
    
    try {
        const response = await axios.delete(`/api/user/delete-account/${user.userInformation.username}`, { data: { one_time_code: oneTimeCode.value }});
        console.log(response.data.message);

        // Remove the user's information in the local storage
        user.resetUserStore();
        localStorage.removeItem('user');

        // Route back to the login page
        router.push({ name: 'login' });
        alert('Your account has been successfully deleted. Adios!');

    } catch (err) {
        console.error('A server error occured while trying to delete your account.');
        console.error(err);
        feedbackFromBackendSuccess.value = false;
        feedbackFromBackend.value = `* ${err.response.data.message}`;

        await nextTick();
        feedbackSection.value?.scrollIntoView({ behavior: "smooth", block: "center" });

    } finally {
        isLoadingDeleteAccount.value = false;

    }
}
</script>


<style scoped>
h1 {
    margin-block-start: 30px;
    margin-block-end: 30px;
}

h1, .feedback {
    text-align: center;
}

form {
    display: contents;
}

/* Flex Layout start */
ul {
    /* Flex parent */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-content: center;
    gap: 20px 20px;

    inline-size: 325px;
    margin: 0 auto;
    margin-block-end: 20px;
}

li {
    /* Flex children */
    margin: 0 auto;
}
/* Flex Layout end */

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

input, textarea, select {
    display: block;
    border-radius: 5px;
    inline-size: 312px;
    block-size: 48px;
    border: 1px solid black;
}

textarea {
    resize: vertical;
}

.fail {
    color: red;
}

.success {
    color: green;
}
</style>