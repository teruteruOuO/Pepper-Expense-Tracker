<template>
<section class="update-account-information">
    <section class="loader" v-if="isLoadingComponent">
        <p></p>
    </section>

    <section class="retrieve-fail"v-else-if="retrieveResourcesFail">
        <p>{{ feedbackFromBackend.message }}</p>
    </section>

    <section class="retrieve-success" v-else>
        <h1>Update Profile</h1>
        <form @submit.prevent="updateProfileInformation()">
            <ul>
                <li>
                    <label for="first-name">First Name: </label>
                    <input type="text" name="first-name" id="first-name" required v-model="currentUserInformation.name.first" placeholder="Required">
                </li>
                <li>
                    <label for="initial">Initial: </label>
                    <input type="text" name="initial" id="initial" minlength="1" maxlength="1" v-model="currentUserInformation.name.initial">
                </li>
                <li>
                    <label for="last-name">Last Name: </label>
                    <input type="text" name="last-name" id="last-name" required v-model="currentUserInformation.name.last" placeholder="Required">
                </li>
                <li>
                    <label for="address">Address: </label>
                    <input type="text" name="address" id="address" required v-model="currentUserInformation.location.address" placeholder="Required"> 
                </li>
                <li>
                    <label for="city">City: </label>
                    <input type="text" name="city" id="city" required v-model="currentUserInformation.location.city" placeholder="Required">
                </li>
                <li>
                    <label for="state">State: </label>
                    <select name="state" id="state" required v-model="currentUserInformation.location.state" placeholder="Required">
                        <option v-for="state in statesList" :key="state.abbreviation" :value="state.abbreviation">{{ state.name }}</option>
                    </select>
                </li>
                <li>
                    <label for="zip">Zip: </label>
                    <input type="text" name="zip" id="zip" v-model="currentUserInformation.location.zip" @input="validateZip" pattern="^\d{5}$" maxlength="5" required placeholder="Required">
                </li>
                <li>
                    <label for="currency_code">Preferred Currency: </label>
                    <select name="currency_code" id="currency_code" required v-model="currentUserInformation.currency.code" placeholder="Required">
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

        <section class="feedback" ref="feedbackSection">
            <p>{{ feedbackFromBackend.message }}</p>
        </section>
    </section>

</section>
</template>


<script setup>
import axios from 'axios';
import { useUserStore } from '@/stores/user';
import { onMounted, ref, reactive, computed, nextTick } from 'vue';
import { statesList } from '@/assets/misc-scripts/state-list';

// Initialize variables
const user = useUserStore();
const retrieveResourcesFail = ref(false);
const isLoadingUpdateProfile = ref(false);
const isLoadingComponent = ref(false);
const feedbackSection = ref(null);
const feedbackFromBackend = reactive({
    message: '',
    success: false
});
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
    isLoadingComponent.value = true;

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
        feedbackFromBackend.message = err.response.data.message;
        feedbackFromBackend.success = false;
        retrieveResourcesFail.value = true;

    } finally {
        isLoadingComponent.value = false;

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
        feedbackFromBackend.message = err.response.data.message;
        feedbackFromBackend.success = false;

        await nextTick();
        feedbackSection.value?.scrollIntoView({ behavior: "smooth", block: "center" });


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
h1 {
    margin-block-start: 30px;
    margin-block-end: 30px;
}

h1, p {
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

.feedback {
    color: red;
}

/* Laptop and above:*/
@media screen and (min-width: 768px) {
    ul {
        display: grid;
        grid-template-columns: repeat(2, 1fr); /* Two equal columns */
        gap: 20px 30px; /* Adjust spacing */
        inline-size: 700px; /* Adjust width for better alignment */
    }

    /* Make the button full width in a single column */
    li:last-child {
        grid-column: span 2;
        text-align: center;
    }
}
</style>