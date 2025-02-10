<template>
<section class="username-change-component">
    <h2>Change Username</h2>
    <form @submit.prevent="changeUsername()">
        <ul>
            <li>
                <label for="new-username">New username: </label>
                <input type="text" name="new-username" id="new-username" required v-model="userCredentials.new_username">
            </li>
            <li>
                <label for="current-password-change-username">Current password: </label>
                <input type="password" name="current-password-change-username" id="current-password-change-username" required v-model="userCredentials.current_password">
            </li>
            <li>
                <label for="confirm-password-change-username">Confirm password: </label>
                <input type="password" name="confirm-password-change-username" id="confirm-password-change-username" required v-model="userCredentials.confirm_password">
            </li>
            <li>
                <button type="submit" :class="{ 'is-loading': isLoading }">
                    <span v-if="!isLoading">Change Username</span>
                    <span v-else>Loading...</span>
                </button>
            </li>
        </ul>
    </form>

    <section class="feedback">
        <p>{{ confirmPasswordFeedback }}</p>
        <p>{{ feedbackFromBackend }}</p>
    </section>
</section>
</template>


<script setup>
import axios from 'axios';
import { ref, reactive, computed } from 'vue';
import { useUserStore } from '@/stores/user';

// Initialize variables
const user = useUserStore();
const isLoading = ref(false);
const feedbackFromBackend = ref("");
const userCredentials = reactive({
    current_password: "",
    new_username: "",
    confirm_password: ""

});

/* Computed variables */
// Informs user that password and confirm password fields do not match
const confirmPasswordFeedback = computed(() => {
    if (
        (userCredentials.current_password && userCredentials.confirm_password) 
        && 
        (userCredentials.current_password !== userCredentials.confirm_password)
    ) {
        return "* Password and Confirm Password must match";
    } else {
        return null;
    }
});

// Change user's username
const changeUsername = async (req, res) => {
    isLoading.value = true;
    const answer = window.confirm("If you continue, your username will be updated. Continue?");

    if (!answer) {
        console.log("User stopped attempting to changer their username.");
        isLoading.value = false;
        return; // Prevents navigation if the user cancels the prompt
        
    }

    try {
        // Do not continue with the remainder of the process if passwords do not match and adhere to the password safety rules
        if (confirmPasswordFeedback.value) {
            console.error('Confirm Password is not solved uet; therefore, username change process will not continue');
            return;
        }

        const body = {
            new_username: userCredentials.new_username,
            current_password: userCredentials.current_password
        }
        const response = await axios.put(`/api/user/change-username/${user.userInformation.username}`, body);

        // Change the username in the local storage
        user.userInformation.username = response.data.new_username;

        // reload the account page
        alert(response.data.message);
        window.location.reload();
    } catch (err) {
        console.error(`An error occured while attempting to change the user's username`);
        console.error(err);
        feedbackFromBackend.value = `* ${err.response.data.message}`;

    } finally {
        isLoading.value = false;
        
    }
}

</script>


<style scoped>
.username-change-component {
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