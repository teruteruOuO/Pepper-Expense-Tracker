<template></template>

<script setup>
import { useEmailSignup } from '@/stores/email-signup';
import axios from 'axios';
import { onBeforeRouteLeave } from 'vue-router';

const emailInformation = useEmailSignup();

// Clear email from Pinia store
const clearEmailAndReset = () => {
    console.log("Clearing email from Pinia store...");
    emailInformation.emailStatus.email = "";
    emailInformation.verifyEmailComponent();
    emailInformation.emailStatus.completed = false;
};

// Delete user email from backend (Regular API Call)
const deleteUserEmail = async () => {
    try {
        if (emailInformation.emailStatus.email) {
            console.log(`Deleting user email: ${emailInformation.emailStatus.email}`);
            await axios.delete(`/api/account/sign-up/delete-email/${emailInformation.emailStatus.email}`);
            console.log("Successfully deleted email from backend.");
        }
    } catch (err) {
        console.error('An error occurred while deleting the user email.');
        console.error(err);
    }
};

// Trigger API before leaving the route
onBeforeRouteLeave(async (to, from, next) => {
    if (emailInformation.emailStatus.completed) {
        console.log("Signup completed, skipping onBeforeRouteLeave.");
        next(); // Allow navigation without running the deletion process
        return;
        
    } else {
        const answer = window.confirm("Are you sure you want to leave? Your progress will be lost.");

        if (!answer) {
            console.log("User cancelled navigation.");
            next(false); // Prevents navigation if the user cancels the prompt
            return;
        }

        // Proceed with email deletion if user confirms leaving
        await deleteUserEmail();
        clearEmailAndReset();
        next(); // Continue navigation
    }

    
});
</script>