<template>
<section class="update-account-information">
    <h2>Update Profile Information</h2>
    <form @submit.prevent="updateProfileInformation()">
        <ul>
            <li>
                <label for="first-name">First Name: </label>
                <input type="text" name="first-name" id="first-name" required v-model="currentUserInformation.name.first">
            </li>
            <li>
                <label for="initial">Initial: </label>
                <input type="text" name="initial" id="initial" minlength="1" maxlength="1" v-model="currentUserInformation.name.initial">
            </li>
            <li>
                <label for="last-name">Last Name: </label>
                <input type="text" name="last-name" id="last-name" required v-model="currentUserInformation.name.last">
            </li>
            <li>
                <label for="address">Address: </label>
                <input type="text" name="address" id="address" required v-model="currentUserInformation.location.address">
            </li>
            <li>
                <label for="city">City: </label>
                <input type="text" name="city" id="city" required v-model="currentUserInformation.location.city">
            </li>
            <li>
                <label for="state">State: </label>
                <select name="currency_code" id="currency_code" required v-if="isLoadingProfile">
                    <option value="loading">Loading...</option>
                </select>
                <select name="state" id="state" required v-model="currentUserInformation.location.state" v-else>
                    <option v-for="state in statesList" :key="state.abbreviation" :value="state.abbreviation">{{ state.name }}</option>
                </select>
            </li>
            <li>
                <label for="zip">Zip: </label>
                <input type="text" name="zip" id="zip" v-model="currentUserInformation.location.zip" @input="validateZip" pattern="^\d{5}$" maxlength="5" required>
            </li>
            <li>
                <label for="currency_code">Preferred Currency: </label>
                <select name="currency_code" id="currency_code" required v-if="isLoadingCurrencyOptions">
                    <option value="loading">Loading...</option>
                </select>
                <select name="currency_code" id="currency_code" required v-model="currentUserInformation.currency.code" v-else>
                    <option v-for="currency in currencyOptions" :key="currency.code" :value="currency.code">{{ currency.name }}</option>
                </select>
            </li>
            <li>
                <button type="submit" :class="{ 'is-loading': isLoadingUpdateProfile }">
                    <span v-if="!isLoadingUpdateProfile">Update Account</span>
                    <span v-else>Loading...</span>
                </button>
            </li>
        </ul>
    </form>

    <section class="feedback">
        <p>{{ feedbackFromBackend }}</p>
    </section>
</section>
</template>


<script setup>
import axios from 'axios';
import { useUserStore } from '@/stores/user';
import { onMounted, ref, reactive, computed } from 'vue';
import { statesList } from '@/assets/misc-scripts/state-list';

// Initialize variables
const user = useUserStore();
const isLoadingProfile = ref(false);
const isLoadingCurrencyOptions = ref(false);
const isLoadingUpdateProfile = ref(false);
const feedbackFromBackend = ref("");
const currencyOptions = ref([]);
const currentUserInformation = reactive({
    name: {
        first: "",
        initial: null,
        last: ""
    },
    currency: {
        code: "",
        name: ""
    },
    location: {
        address: "",
        city: "",
        state: "",
        zip: ""
    }
});

// Ensure optional data like initial is always null when left empty 
const initial = computed(() => {
    if (currentUserInformation.name.initial === ""  || currentUserInformation.name.initial === " ") {
        return null
    } else {
        return currentUserInformation.name.initial
    }
});

/* Functions*/
// Real-time ZIP code validation
const validateZip = () => {
    currentUserInformation.location.zip = currentUserInformation.location.zip.replace(/\D/g, '').slice(0, 5);
};

// Function for requesting and retrieving the user's profile information
const requestUserInformation = async () => {
    isLoadingProfile.value = true;
    isLoadingCurrencyOptions.value = true;

    let loadingState = isLoadingProfile.value ? "Loading..." : null;
    currentUserInformation.name.first = loadingState;
    currentUserInformation.name.initial = loadingState;
    currentUserInformation.name.last = loadingState;
    currentUserInformation.currency.code = loadingState;
    currentUserInformation.location.address = loadingState;
    currentUserInformation.location.city = loadingState;
    currentUserInformation.location.state = loadingState;

    try {
        const response = await axios.get(`/api/user/profile/${user.userInformation.username}`);
        const response2 = await axios.get(`/api/currency`);
        const userInformationFromBackend = response.data.user;

        // Store profile information in a variable
        currentUserInformation.name.first = userInformationFromBackend.name.first;
        currentUserInformation.name.initial = userInformationFromBackend.name.initial;
        currentUserInformation.name.last = userInformationFromBackend.name.last;
        currentUserInformation.currency.code = userInformationFromBackend.currency.code;
        currentUserInformation.currency.name  = userInformationFromBackend.currency.name; 
        currentUserInformation.location.address = userInformationFromBackend.location.address;
        currentUserInformation.location.city = userInformationFromBackend.location.city;
        currentUserInformation.location.state = userInformationFromBackend.location.state;
        currentUserInformation.location.zip = userInformationFromBackend.location.zip;

        // Store currency options in a variable
        currencyOptions.value = response2.data.currency;
        console.log("Successfully retrieved the user's profile information.");

    } catch (err) {
        console.error("An error occcured during a GET request for user's basic information in Update Account Component.");
        console.error(err);
        feedbackFromBackend.value = err.response.data.message;

    } finally {
        isLoadingProfile.value = false;
        isLoadingCurrencyOptions.value = false;

    }
}

// User updates their profile information
const updateProfileInformation = async (req, res) => {
    isLoadingUpdateProfile.value = true;
    const answer = window.confirm("If you continue, your information will be updated. Continue?");

    if (!answer) {
        console.log("User cancelled update information.");
        isLoadingUpdateProfile.value = false;
        return; // Prevents navigation if the user cancels the prompt
        
    }

    try {
        const body = {
            name: {
                first: currentUserInformation.name.first,
                initial: initial.value,
                last: currentUserInformation.name.last
            },
            currency_code: currentUserInformation.currency.code,
            location: {
                address: currentUserInformation.location.address,
                city: currentUserInformation.location.city,
                state: currentUserInformation.location.state,
                zip: currentUserInformation.location.zip
            }
        }
        const response = await axios.put(`/api/user/profile/${user.userInformation.username}`, body);

        // Update first name and currency code in the local storage
        user.userInformation.first_name = response.data.profile_details.first;
        user.userInformation.currency_code = response.data.profile_details.currency_code;

        // reload the account page
        window.location.reload();
        
    } catch (err) {
        console.error(`An error occured while attempting to update the user's profile information in UpdateProfileComponent in Account View.`);
        console.error(err);
        feedbackFromBackend.value = err.response.data.message;

    } finally {
        isLoadingUpdateProfile.value = false;

    }
}


// Automatically request for the user's first and last name, initial, email, notifications, and currency setting
onMounted(async () => {
    await requestUserInformation();
});

</script>


<style scoped>
.update-account-information {
    border: 1px solid green;
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

.feedback {
    color: red;
}

/* style for isLoading variables */
.is-loading {
    background-color: rgb(94, 94, 30);
    color: gray;
    cursor: not-allowed;
}
</style>