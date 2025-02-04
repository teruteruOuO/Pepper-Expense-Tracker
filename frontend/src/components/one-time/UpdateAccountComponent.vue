<template>
<section class="update-account-information">
    <h2>Update Account Information</h2>
    <form @submit.prevent>
        <ul>
            <li>
                <label for="first-name">First Name: </label>
                <input 
                type="text" 
                name="first-name" 
                id="first-name" 
                required
                v-model="currentUserInformation.name.first">
            </li>
            <li>
                <label for="initial">Initial: </label>
                <input 
                type="text" 
                name="initial" 
                id="initial" 
                required
                minlength="1"
                maxlength="1"
                v-model="currentUserInformation.name.initial">
            </li>
            <li>
                <label for="last-name">Last Name: </label>
                <input 
                type="text" 
                name="last-name" 
                id="last-name" 
                required
                v-model="currentUserInformation.name.last">
            </li>
            <li>
                <label for="email">Email: </label>
                <input 
                type="email" 
                name="email" 
                id="email" 
                required
                v-model="currentUserInformation.email">
            </li>
            <li>
                <label for="currency-name">Currency Name: </label>
                <input 
                type="text" 
                name="currency-name" 
                id="currency-name" 
                required
                v-model="currentUserInformation.settings.currency_name">
            </li>
            <li>
                <fieldset>
                    <legend>Notification</legend>
                    <ul>
                        <li>
                            <label for="notification-on">On </label>
                            <input 
                            type="radio"
                            name="notification"
                            id="notification-on"
                            :value="1"
                            v-model="currentUserInformation.settings.notification">
                        </li>
                        <li>
                            <label for="notification-off">Off </label>
                            <input 
                            type="radio"
                            name="notification"
                            id="notification-off"
                            :value="0"
                            v-model="currentUserInformation.settings.notification">
                        </li>
                    </ul>
                </fieldset>
            </li>
            <li>
                <button type="submit">Update Account</button>
            </li>
        </ul>
    </form>
</section>
</template>


<script setup>
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { onMounted, ref, reactive, computed } from 'vue';

// Initialize variables
const router = useRouter();
const user = useUserStore();
const isLoading = ref(false);
const currentUserInformation = reactive({
    name: {
        first: "",
        initial: null,
        last: ""
    },
    settings: {
        currency_code: "",
        currency_name: "",
        notification: 0
    },
    email: ""
});

// Function for requesting and retrieving the user's first and last name, initial, email, notifications, and currency setting
const requestUserInformation = async () => {
    isLoading.value = true;

    let loadingState = isLoading.value ? "Loading..." : null;
    currentUserInformation.name.first = loadingState;
    currentUserInformation.name.initial = loadingState;
    currentUserInformation.name.last = loadingState;
    currentUserInformation.settings.currency_name = loadingState;
    currentUserInformation.email = loadingState;

    try {
        const response = await axios.get(`/api/user/get-basic-information/${user.userInformation.username}`);
        const userInformationFromBackend = response.data.user;

        currentUserInformation.name.first = userInformationFromBackend.name.first;
        currentUserInformation.name.initial = userInformationFromBackend.name.initial;
        currentUserInformation.name.last = userInformationFromBackend.name.last;
        currentUserInformation.settings.currency_name = userInformationFromBackend.settings.currency_name;
        currentUserInformation.settings.notification = userInformationFromBackend.settings.notification;
        currentUserInformation.email = userInformationFromBackend.email;
        console.log("Successfully retrieved the user's basic information.");

    } catch (err) {
        console.error("An error occcured during a GET request for user's basic information in Update Account Component.");
        console.error(err);
    } finally {
        isLoading.value = false;
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
</style>