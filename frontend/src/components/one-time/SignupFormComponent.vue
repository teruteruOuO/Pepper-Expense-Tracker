<template>
<section class="sign-up-form">
    <form @submit.prevent="signUpUser">
        <ul>
            <li>
                <label for="first-name">First Name: </label>
                <input 
                type="text"
                name="first-name"
                id="first-name"
                required
                v-model="signUpInformation.name.first">
            </li>
            <li>
                <label for="initial">Initial: </label>
                <input 
                type="text"
                name="initial"
                id="initial"
                maxlength="1"
                minlength="1"
                v-model="signUpInformation.name.initial">
            </li>
            <li>
                <label for="last-name">Last Name: </label>
                <input 
                type="text"
                name="last-name"
                id="last-name"
                required
                v-model="signUpInformation.name.last">
            </li>
            <li>
                <label for="email">Email: </label>
                <input 
                type="email"
                name="email"
                id="email"
                required
                v-model="signUpInformation.email">
            </li>
            <li>
                <label for="username">Username: </label>
                <input 
                type="text"
                name="username"
                id="username"
                required
                v-model="signUpInformation.credentials.username">
            </li>
            <li>
                <label for="password">Password: </label>
                <input 
                type="password"
                name="password"
                id="password"
                required
                autocomplete
                v-model="signUpInformation.credentials.password">
            </li>
            <li>
                <label for="confirm-password">Confirm Password: </label>
                <input 
                type="password"
                name="confirm-password"
                id="confirm-password"
                required
                autocomplete
                v-model="signUpInformation.credentials.confirm_password">
            </li>
            <li>
                <button type="submit" :class="{ 'is-loading': isLoading }">
                    <span v-if="!isLoading">Sign Up</span>
                    <span v-else>Loading...</span>
                </button>
            </li>
        </ul>
    </form>

    <section class="feedback">
        <p class="confirm-password-feedback">{{ confirmPasswordFeedback}}</p>
        <p class="password-regex-feedback">{{ passwordRegExFeedback }}</p>
        <p :class="{ 'backend-feedback-success': backendServerFeedbackSuccess, 'feedback': !backendServerFeedbackSuccess }">{{ backendServerFeedback }}</p>
    </section>
</section>
</template>

<script setup>
import axios from 'axios';
import { useRouter } from 'vue-router';
import { ref, reactive, computed } from 'vue';

// Initialize variables
const router = useRouter();
const isLoading = ref(false);
const backendServerFeedback = ref("");
const backendServerFeedbackSuccess = ref(false);
const signUpInformation = reactive({
    name: 
        {
            first: "",
            initial: "",
            last: ""
        },
    credentials:
        {
            username: "",
            password: "",
            confirm_password: ""
        },
    email: ""
});

/* Computed variables */
// Informs user that password and confirm password fields do not match
const confirmPasswordFeedback = computed(() => {
    if (
        (signUpInformation.credentials.password && signUpInformation.credentials.confirm_password) 
        && 
        (signUpInformation.credentials.password !== signUpInformation.credentials.confirm_password)
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
    if (signUpInformation.credentials.password && !passwordRegex.test(signUpInformation.credentials.password)) {
        return "* Your password must contain at least one upper case and lowercase letters, one number, and one special character";
    } else {
        return null;
    }
})

// Ensure optional data like initial is always null when left empty 
const initial = computed(() => {
    if (signUpInformation.name.initial === ""  || signUpInformation.name.initial === " ") {
        return null
    } else {
        return signUpInformation.name.initial
    }
});

// Async function to send the user's sign up information to the backend server
const signUpUser = async () => {
    isLoading.value = true;

    try {
        // Do not continue with the remainder of the process if passwords do not match and adhere to the password safety rules
        if (confirmPasswordFeedback.value || passwordRegExFeedback.value) {
            console.error('Confirm Password and Password RegEx Feedback are not solved yet; therefore, sign up process will not continue');
            return;
        }

        const body = {
            name: 
                {
                    first: signUpInformation.name.first,
                    initial: initial.value,
                    last: signUpInformation.name.last
                },
            credentials: 
                {
                    username: signUpInformation.credentials.username,
                    password: signUpInformation.credentials.password
                },
            email: signUpInformation.email
        }
        const response = await axios.post("/api/account/sign-up", body);
        backendServerFeedbackSuccess.value = true;
        backendServerFeedback.value = `${response.data.message}. You will be redirected to the Login page after 5 seconds.`;

        // Clear the Sign Up Form inputs
        signUpInformation.credentials.username = "";
        signUpInformation.credentials.password = "";
        signUpInformation.credentials.confirm_password = "";
        signUpInformation.name.first = "";
        signUpInformation.name.initial = "";
        signUpInformation.name.last = "";
        signUpInformation.email = "";
        isLoading.value = false;

        // Redirect after 5 seconds
        setTimeout(() => { router.push({ name: 'login' }) }, 5000);

    } catch (err) {
        console.error("An error occured in the SignupFormComponent");
        console.error(err);

        backendServerFeedbackSuccess.value = false;
        backendServerFeedback.value = err.response.data.message;
        isLoading.value = false;

    } finally {
        isLoading.value = false;
    }

}


</script>

<style scoped>
.sign-up-form {
    border: 1px solid red;
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

/* style for backend feedback variables */
.feedback {
    color: red;
}

.backend-feedback-success {
    color: green;
}

/* style for isLoading variables */
.is-loading {
    background-color: rgb(94, 94, 30);
    color: gray;
    cursor: not-allowed;
}

</style>