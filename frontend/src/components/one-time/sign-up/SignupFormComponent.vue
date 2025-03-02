<template>
<section class="signup-form-component">
    <h2>Sign Up Form</h2>
    <section class="loader" v-if="isLoadingCurrencyOptions">
    </section>

    <section class="retrieve-fail" v-else="retrieveResourcesFail">
        <p>{{ feedbackFromBackend }}</p>
    </section>

    <section class="success" v-else>
        <form @submit.prevent="signupUser()">
            <ul>
                <li>
                    <label for="first">First Name: </label>
                    <input type="text" name="first" id="first" required v-model="userSignupInformation.name.first">
                </li>
                <li>
                    <label for="initial">Middle Name: </label>
                    <input type="text" name="initial" id="initial" minlength="1" maxlength="1" v-model="userSignupInformation.name.initial">
                </li>
                <li>
                    <label for="last">Last Name: </label>
                    <input type="text" name="last" id="last" required v-model="userSignupInformation.name.last">
                </li>
                <li>
                    <label for="address">Address Name: </label>
                    <input type="text" name="address" id="address" required v-model="userSignupInformation.location.address">
                </li>
                <li>
                    <label for="city">City: </label>
                    <input type="text" name="city" id="city" required v-model="userSignupInformation.location.city">
                </li>
                <li>
                    <label for="state">State: </label>
                    <select name="state" id="state" required v-model="userSignupInformation.location.state">
                        <option value="" disabled>Select a state</option>
                        <option v-for="state in statesList" :key="state.abbreviation" :value="state.abbreviation">{{ state.name }}</option>
                    </select>
                </li>
                <li>
                    <label for="zip">Zip: </label>
                    <input type="text" name="zip" id="zip" v-model="userSignupInformation.location.zip" @input="validateZip" pattern="^\d{5}$" maxlength="5" required>
                </li>
                <li>
                    <label for="username">Username: </label>
                    <input type="text" name="username" id="username" required v-model="userSignupInformation.credentials.username">
                </li>
                <li>
                    <label for="password">Password: </label>
                    <input type="password" name="password" id="password" required v-model="userSignupInformation.credentials.password">
                </li>
                <li>
                    <label for="confirm-password">Confirm Password: </label>
                    <input type="password" name="confirm-password" id="confirm-password" required v-model="userSignupInformation.credentials.confirm_password">
                </li>
                <li>
                    <label for="currency_code">Preferred Currency: </label>
                    <select name="currency_code" id="currency_code" required v-if="isLoadingCurrencyOptions">
                        <option value="loading">Loading...</option>
                    </select>
                    <select name="currency_code" id="currency_code" required v-model="selectedCurrency" v-else>
                        <option v-for="currency in currencyOptions" :key="currency.code" :value="currency.code">{{ currency.name }}</option>
                    </select>
                </li>
                <li>
                    <button type="submit">
                        <span v-if="isLoadingSignup" :class="{ 'is-loading': isLoadingSignup }">Loading...</span>
                        <span v-else>Sign Up</span>
                    </button>
                </li>
            </ul>
        </form>

        <section class="feedback">
            <p>{{ confirmPasswordFeedback }}</p>
            <p>{{ passwordRegExFeedback }}</p>
            <p :class="{ 'backend-feedback-success': feedbackFromBackendSuccess, 'feedback': !feedbackFromBackendSuccess }">{{ feedbackFromBackend }}</p>
        </section>
    </section>
    
</section>
</template>


<script setup>
import axios from 'axios';
import { ref, reactive, computed, onMounted } from 'vue';
import { useEmailSignup } from '@/stores/email-signup';
import { useRouter } from 'vue-router';
import { statesList } from '@/assets/misc-scripts/state-list';

// Initialize variables
const router = useRouter();
const signupInformation = useEmailSignup();
const isLoadingCurrencyOptions = ref(false);
const isLoadingSignup = ref(false);
const feedbackFromBackend = ref("");
const feedbackFromBackendSuccess = ref(false);
const retrieveResourcesFail = ref(false);

const currencyOptions = ref([]);
const selectedCurrency = ref("USD");
const userSignupInformation = reactive({
    name: {
        first: "",
        initial: "",
        last: ""
    },
    location: {
        address: "",
        city: "",
        state: "",
        zip: ""
    },
    credentials: {
        username: "",
        password: "",
        confirm_password: ""
    },
    currency_code: ""
});


/* Computed variables */
// Informs user that password and confirm password fields do not match
const confirmPasswordFeedback = computed(() => {
    if (
        (userSignupInformation.credentials.password && userSignupInformation.credentials.confirm_password) 
        && 
        (userSignupInformation.credentials.password !== userSignupInformation.credentials.confirm_password)
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
    if (userSignupInformation.credentials.password && !passwordRegex.test(userSignupInformation.credentials.password)) {
        return "* Your password must contain at least one upper case and lowercase letters, one number, and one special character";
    } else {
        return null;
    }
});

// Ensure optional data like initial is always null when left empty 
const initial = computed(() => {
    if (userSignupInformation.name.initial === ""  || userSignupInformation.name.initial === " ") {
        return null
    } else {
        return userSignupInformation.name.initial
    }
});


/* Functions*/
// Real-time ZIP code validation
const validateZip = () => {
    userSignupInformation.location.zip = userSignupInformation.location.zip.replace(/\D/g, '').slice(0, 5);
};

// Validated sign-up information
const signupUser = async () => {
    isLoadingSignup.value = true; 

    try {
        // Do not continue with the remainder of the process if passwords do not match and adhere to the password safety rules
        if (confirmPasswordFeedback.value || passwordRegExFeedback.value) {
            console.error('Confirm Password and Password RegEx Feedback are not solved yet; therefore, sign up process will not continue');
            return;
        }

        // Send user input to the backend server to validate
        const body = {
            name: {
                first: userSignupInformation.name.first,
                initial: initial.value,
                last: userSignupInformation.name.last
            },
            location: {
                address: userSignupInformation.location.address,
                city: userSignupInformation.location.city,
                state: userSignupInformation.location.state,
                zip: String(userSignupInformation.location.zip)
            },
            credentials: {
                username: userSignupInformation.credentials.username,
                password: userSignupInformation.credentials.password
            },
            currency_code: selectedCurrency.value
        }
        const response = await axios.put(`/api/account/sign-up/${signupInformation.emailStatus.email}`, body);
        feedbackFromBackendSuccess.value = true;
        feedbackFromBackend.value = `${response.data.message}. You will be redirected to the Login page after 5 seconds.`;

        // Clear the Sign Up Form inputs
        userSignupInformation.credentials.username = "";
        userSignupInformation.credentials.password = "";
        userSignupInformation.credentials.confirm_password = "";
        userSignupInformation.location.address = "";
        userSignupInformation.location.city = "";
        userSignupInformation.location.state = "";
        userSignupInformation.location.zip = "";
        userSignupInformation.name.first = "";
        userSignupInformation.name.initial = "";
        userSignupInformation.name.last = "";
        isLoadingSignup.value = false;
        signupInformation.emailStatus.completed = true;

        // Redirect after 5 seconds
        setTimeout(() => {
            // Clear email-sign up pinia store and revert it back to its original state
            signupInformation.emailStatus.completed = true;
            signupInformation.emailStatus.email = "";
            signupInformation.verifyEmailComponent();
            localStorage.removeItem('email-signup');
            router.push({ name: 'login' }); 
        }, 5000);


    } catch (err) {
        console.error('An error occured while signing the user up in SignupFormComponent in SignupView');
        console.error(err);
        feedbackFromBackendSuccess.value = false;
        feedbackFromBackend.value = `* ${err.response.data.message}`;
        isLoadingSignup.value = false;

    } finally { 
        isLoadingSignup.value = false;
    }
}


// Requests for currency options from the database server
const getCurrencyOptions = async () => {
    isLoadingCurrencyOptions.value = true;

    try {
        // Retrieve currency options
        const response = await axios.get('/api/currency');
        console.log(response.data.message);

        // Store currency options in a variable
        currencyOptions.value = response.data.currency;

    } catch (err) {
        console.error('An error occured while retrieving currency options in SignupFormComponent in SignupView');
        console.error(err);
        feedbackFromBackend.value = err.response.data.message;
        feedbackFromBackendSuccess.value = false;
        retrieveResourcesFail.value = true;

    } finally {
        isLoadingCurrencyOptions.value = false;
    }
}

// Automatiically perform getCurrencyOptions when the component loads up
onMounted(async () => {
    await getCurrencyOptions();
})
</script>


<style scoped>
.signup-form-component {
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