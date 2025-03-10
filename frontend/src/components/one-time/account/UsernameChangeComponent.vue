<template>
<section class="username-change-component">
    <form @submit.prevent="changeUsername()">
        <h1>Change Username</h1>
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

    <section class="feedback" ref="feedbackSection">
        <p>{{ confirmPasswordFeedback }}</p>
        <p>{{ feedbackFromBackend }}</p>
    </section>
</section>
</template>


<script setup>
import axios from 'axios';
import { ref, reactive, computed, nextTick } from 'vue';
import { useUserStore } from '@/stores/user';

// Initialize variables
const user = useUserStore();
const isLoading = ref(false);
const feedbackFromBackend = ref("");
const feedbackSection = ref(null);
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

        await nextTick();
        feedbackSection.value?.scrollIntoView({ behavior: "smooth", block: "center" });

    } finally {
        isLoading.value = false;
        
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

.feedback {
    color: red;
}
</style>