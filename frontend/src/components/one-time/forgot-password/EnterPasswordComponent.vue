<template>
<section class="enter-password-component">
    <h1>Enter your new password</h1>
    <form @submit.prevent="changePassword()">
        <ul>
            <li>
                <label for="password">New Password: </label>
                <input type="password" name="password" id="password" required v-model="userPassword.new_password">
            </li>
            <li>
                <label for="confirm-password">Confirm Password: </label>
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

    <section class="feedback fail">
        <p>{{ confirmPasswordFeedback }}</p>
        <p> {{ passwordRegExFeedback }}</p>
        <p :class="{ 'fail': !feedbackFromBackendSuccess, 'success': feedbackFromBackendSuccess }" ref="feedbackSection">{{ feedbackFromBackend }}</p>
    </section>
</section>
</template>


<script setup>
import axios from 'axios';
import { ref, reactive, computed, nextTick } from 'vue';
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
const feedbackSection = ref(null);

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

        await nextTick();
        feedbackSection.value?.scrollIntoView({ behavior: "smooth", block: "center" });

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

        await nextTick();
        feedbackSection.value?.scrollIntoView({ behavior: "smooth", block: "center" });

    } finally {
        isLoading.value = false;

    }
}


</script>


<style scoped>
.enter-password-component > * {
    margin-block-end: 50px;
    
    /* Center */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.enter-password-component h1 {
    text-align: center;
    margin-block-start: 20px;
    margin-block-end: 20px;
}

section.feedback {
    margin-block-end: 0px;
}

form {
    margin-block-end: 10px !important; 
}

ul {
    /* Center */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

ul > li {
    margin-block-end: 20px;
}

li:last-of-type {
    margin-block-end: 0px;
}

p {
    margin-block-end: 20px;
    text-align: center;
}

p:last-of-type {
    margin-block-end: 0px;
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

label {
    display: block;
}

input, select {
    border-radius: 5px;
    inline-size: 312px;
    block-size: 48px;
    border: 1px solid black;
}

.fail {
    color: red;
}

.success {
    color: green;
}

/* Phone Horizontal */
@media screen and (min-width: 576px) {
    .enter-password-component h1 {
        margin-block-start: 30px;
    }
}
</style>