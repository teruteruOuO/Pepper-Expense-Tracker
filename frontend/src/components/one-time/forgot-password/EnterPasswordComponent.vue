<template>
<section class="enter-password-component">
    <h2>Enter your new password</h2>
    <form @submit.prevent="changePassword()">
        <ul>
            <li>
                <label for="password">New Password: </label>
                <input type="password" name="password" id="password" required v-model="userPassword.new_password">
            </li>
            <li>
                <label for="password">Confirm Password: </label>
                <input type="password" name="confirm-password" id="confirm-password" required v-model="userPassword.confirm_password">
            </li>
            <li>
                <button type="submit" :class="{ 'is-loading': isLoading }">
                    <span v-if="!isLoading">Enter</span>
                    <span v-else>Loading...</span>
                </button>
            </li>
        </ul>
    </form>

    <section class="feedback">
        <p class="feedback-fail">{{ confirmPasswordFeedback }}</p>
        <p class="feedback-fail"> {{ passwordRegExFeedback }}</p>
        <p :class="{ 'feedback-fail': !feedbackFromBackendSuccess, 'feedback-success': feedbackFromBackendSuccess }">{{ feedbackFromBackend }}</p>
    </section>
</section>
</template>


<script setup>
import axios from 'axios';
import { ref, reactive, computed } from 'vue';
import { useForgotPassword } from '@/stores/forgot-password';
import { useRouter } from 'vue-router';

// Initialize variables
const isLoading = ref(false);
const feedbackFromBackend = ref("");
const feedbackFromBackendSuccess = ref(false);
const router = useRouter();
const monitorForgotPassword = useForgotPassword();
const userPassword = reactive({
    new_password: "",
    confirm_password: ""
});

/* Computed variables */
// Informs user that password and confirm password fields do not match
const confirmPasswordFeedback = computed(() => {
    if (
        (userPassword.new_password && userPassword.confirm_password) 
        && 
        (userPassword.new_password !== userPassword.confirm_password)
    ) {
        return "* Password and Confirm Password must match";
    } else {
        return null;
    }
});

// Informs user that their password must match the following criteria
// Contains at least one uppercase letter.
// Contains at least one lowercase letter.
// Contains at least one number.
// Contains at least one special character (@, #, $, %, etc.).
const passwordRegExFeedback = computed( () => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (userPassword.new_password && !passwordRegex.test(userPassword.new_password)) {
        return "* Your password must contain at least one upper case and lowercase letters, one number, and one special character";
    } else {
        return null;
    }
});


/* Function */
const changePassword = async() => {
    isLoading.value = true;

    try {
        // Do not continue with the remainder of the process if passwords do not match and adhere to the password safety rules
        if (confirmPasswordFeedback.value || passwordRegExFeedback.value) {
            console.error('Confirm Password and Password RegEx Feedback are not solved yet; therefore, sign up process will not continue');
            return;
        }

        const body = { 
            new_password: userPassword.new_password, 
            email: monitorForgotPassword.forgotPasswordStatus.email 
        }
        const response = await axios.post('/api/account/forgot-password/change-password', body);
        feedbackFromBackendSuccess.value = true;
        feedbackFromBackend.value = `${response.data.message}. You will be redirected to the Login page after 5 seconds.`;

        // Clear the form
        userPassword.confirm_password = "";
        userPassword.new_password = ""
        isLoading.value = false;
        monitorForgotPassword.forgotPasswordStatus.completed = true;

        // Redirect after 5 seconds
        setTimeout(() => {
            // Clear email-sign up pinia store and revert it back to its original state
            monitorForgotPassword.forgotPasswordStatus.completed = true;
            monitorForgotPassword.forgotPasswordStatus.email = "";
            monitorForgotPassword.enterEmailComponent();
            localStorage.removeItem('forgot-password');
            router.push({ name: 'login' }); 
        }, 5000);


    } catch (err) {
        console.error(`An error occured while changing the user's password in EnterPasswordComponent in ForgotPasswordView.`);
        console.error(err);
        feedbackFromBackendSuccess.value = false;
        feedbackFromBackend.value = `* ${err.response.data.message}`;
        isLoadingSignup.value = false;

    } finally {
        isLoading.value = false;

    }
}


</script>


<style>
.enter-password-component {
    border: 1px solid red;

}

.feedback-fail {
    color: red;
}

.feedback-success {
    color: green;
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