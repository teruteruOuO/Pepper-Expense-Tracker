<template>
<section class="signup-form-component">
    <section class="loader" v-if="isLoadingCurrencyOptions">
    </section>

    <section class="retrieve-fail" v-else="retrieveResourcesFail">
        <p>{{ feedbackFromBackend }}</p>
    </section>

    <section class="retrieve-success" v-else>
        <h1>Enter your Information</h1>
        <form @submit.prevent="signupUser()">
            <ul>
                <li>
                    <label for="first">First Name: </label>
                    <input type="text" name="first" id="first" required v-model="userSignupInformation.name.first" placeholder="Required">
                </li>
                <li>
                    <label for="initial">Middle Name: </label>
                    <input type="text" name="initial" id="initial" minlength="1" maxlength="1" v-model="userSignupInformation.name.initial">
                </li>
                <li>
                    <label for="last">Last Name: </label>
                    <input type="text" name="last" id="last" required v-model="userSignupInformation.name.last" placeholder="Required">
                </li>
                <li>
                    <label for="address">Address Name: </label>
                    <input type="text" name="address" id="address" required v-model="userSignupInformation.location.address" placeholder="Required">
                </li>
                <li>
                    <label for="city">City: </label>
                    <input type="text" name="city" id="city" required v-model="userSignupInformation.location.city" placeholder="Required"> 
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
                    <input type="text" name="zip" id="zip" v-model="userSignupInformation.location.zip" @input="validateZip" pattern="^\d{5}$" maxlength="5" required placeholder="Required">
                </li>
                <li>
                    <label for="username">Username: </label>
                    <input type="text" name="username" id="username" required v-model="userSignupInformation.credentials.username" placeholder="Required">
                </li>
                <li>
                    <label for="password">Password: </label>
                    <input type="password" name="password" id="password" required v-model="userSignupInformation.credentials.password" placeholder="Required">
                </li>
                <li>
                    <label for="confirm-password">Confirm Password: </label>
                    <input type="password" name="confirm-password" id="confirm-password" required v-model="userSignupInformation.credentials.confirm_password" placeholder="Required">
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

        <section class="feedback fail">
            <p>{{ confirmPasswordFeedback }}</p>
            <p>{{ passwordRegExFeedback }}</p>
            <p ref="feedbackSection" class='feedback' :class="{ 'success': feedbackFromBackendSuccess, 'fail': !feedbackFromBackendSuccess }">{{ feedbackFromBackend }}</p>
        </section>
    </section>
    
</section>
</template>


<script setup>
import axios from 'axios';
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
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
const feedbackSection = ref(null); 

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

        await nextTick();
        feedbackSection.value?.scrollIntoView({ behavior: "smooth", block: "center" });

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
.signup-form-component > * {
    margin-block-end: 50px;
    
    /* Center */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.signup-form-component h1 {
    text-align: center;
    margin-block-start: 20px;
    margin-block-end: 20px;
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

.retrieve-fail {
    text-align: center;
}

/* Phone Horizontal */
@media screen and (min-width: 576px) {
    .signup-form-component h1 {
        margin-block-start: 30px;
        margin-block-end: 30px;
    }

    ul {
        /* Center */
        display: flex;
        flex-direction: row;
        justify-content: center;
        flex-wrap: wrap;
        align-items: center;
    }
    
    li:last-of-type {
        flex: 0 0 100%; /* Forces the button to take a full row */
        display: flex;
        justify-content: center; /* Centers the button */
        order: 1; /* Ensures it appears last */
    }

    p:last-of-type {
        margin-block-end: 0px;
    }

    /* Button styles */
    button {
        max-inline-size: 312px; /* Prevents it from stretching too wide */
        inline-size: 100%;
    }
}

/* Laptop and above*/
@media screen and (min-width: 768px) {


    ul {
        display: grid;
        grid-template-columns: repeat(2, 1fr); /* Creates 2 equal columns */
        gap: 20px; /* Adds spacing between columns */
        justify-content: center;
        align-items: start;
    }

    li {
        flex: none; /* Resets flex styles */
        width: 100%;
    }

    /* Ensure the button takes the full width and stays below */
    li:last-of-type {
        grid-column: span 2;
        display: flex;
        justify-content: center;
    }

    button {
        max-inline-size: 312px; /* Keeps button from stretching */
        inline-size: 100%;
    }
}

</style>