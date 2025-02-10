<template>
<section class="password-change-component">
    <h2>Password Change Component</h2>
    <form @submit.prevent="changePassword()">
        <ul>
            <li>
                <label for="old-password">Current Password: </label>
                <input type="password" name="old-password" id="old-password" required v-model="userPasswords.old_password">
            </li>
            <li>
                <label for="new-password">New Password: </label>
                <input type="password" name="new-password" id="new-password" required v-model="userPasswords.new_password">
            </li>
            <li>
                <label for="confirm-password">Confirm Password: </label>
                <input type="password" name="confirm-password" id="confirm-password" required v-model="userPasswords.confirm_password">
            </li>
            <li>
                <button type="submit" :class="{ 'is-loading': isLoading }">
                    <span v-if="!isLoading">Change Password</span>
                    <span v-else>Loading...</span>
                </button>
            </li>
        </ul>
    </form>

    <section class="feedback">
        <p>{{ confirmPasswordFeedback }}</p>
        <p>{{ passwordRegExFeedback }}</p>
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
const userPasswords = reactive({
    old_password: "",
    new_password: "",
    confirm_password: ""

});

/* Computed variables */
// Informs user that password and confirm password fields do not match
const confirmPasswordFeedback = computed(() => {
    if (
        (userPasswords.new_password && userPasswords.confirm_password) 
        && 
        (userPasswords.new_password !== userPasswords.confirm_password)
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
    if (userPasswords.new_password && !passwordRegex.test(userPasswords.new_password)) {
        return "* Your password must contain at least one upper case and lowercase letters, one number, and one special character";
    } else {
        return null;
    }
});


// User updates their password
const changePassword = async () => {
    isLoading.value = true;
    const answer = window.confirm("If you continue, your password will be updated. Continue?");

    if (!answer) {
        console.log("User stopped attempting to changer their password.");
        isLoading.value = false;
        return; // Prevents navigation if the user cancels the prompt
        
    }

    try {
        // Do not continue with the remainder of the process if passwords do not match and adhere to the password safety rules
        if (confirmPasswordFeedback.value || passwordRegExFeedback.value) {
            console.error('Confirm Password and Password RegEx Feedback are not solved yet; therefore, password change process will not continue');
            return;
        }

        const body = { old_password: userPasswords.old_password, new_password: userPasswords.new_password }
        const response = await axios.put(`/api/user/change-password/${user.userInformation.username}`, body);

        // reload the account page
        alert(response.data.message);
        window.location.reload();

    } catch (err) {
        console.error(`An error occured while trying to update the user's password in PasswordChangeComponent in AccountView.`);
        console.error(err);
        feedbackFromBackend.value = `* ${err.response.data.message}`;

    } finally {
        isLoading.value = false;

    }
}


</script>


<style scoped>
.password-change-component {
    border: 1px solid salmon;
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