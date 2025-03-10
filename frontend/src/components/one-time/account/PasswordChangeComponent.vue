<template>
<section class="password-change-component">
    <form @submit.prevent="changePassword()">
        <h1>Change Password</h1>
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

    <section class="feedback" ref="feedbackSection">
        <p>{{ confirmPasswordFeedback }}</p>
        <p>{{ passwordRegExFeedback }}</p>
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
</style>