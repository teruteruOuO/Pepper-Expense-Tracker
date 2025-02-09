<template></template>

<script setup>
import axios from 'axios';
import { onBeforeRouteLeave } from 'vue-router';
import { useForgotPassword } from '@/stores/forgot-password';

const monitorForgotPassword = useForgotPassword();

// Clear progress for forgot password and return to the EnterEmailComponent
const clearForgotPasswordProgress = () => {
    console.log('Resetting Forgot Password progress in Pinia store');
    monitorForgotPassword.forgotPasswordStatus.email = "";
    monitorForgotPassword.enterEmailComponent();
    monitorForgotPassword.forgotPasswordStatus.completed = false;
}

// Delete any one time codes associated with the email
const deleteCodesFromUserEmail = async () => {
    try {
        if (monitorForgotPassword.forgotPasswordStatus.email) {
            console.log(`Deleting one time codes for the user with the email ${monitorForgotPassword.forgotPasswordStatus.email}'`);
            await axios.delete(`/api/account/forgot-password/delete-codes/${monitorForgotPassword.forgotPasswordStatus.email}`);
            console.log(`Successfully deleted one time codes for the email ${monitorForgotPassword.forgotPasswordStatus.email}`);
        }

    } catch (err) {
        console.error('An error occured while deleting codes from the user in CancelForgotPasswordComponent');
        console.error(err);
    }
}

// Trigger the API each time the user attempts to leave the page
onBeforeRouteLeave(async (to, from, next) => {
    if (monitorForgotPassword.forgotPasswordStatus.completed) {
        console.log('Forgot Password progress completed. Skipping onBeforeRouteLeave.');
        next() // Allow navigation without running the deletion process
        return;
    
    } else {
        const answer = window.confirm("Are you sure you want to leave? Your progress will be lost.");

        if (!answer) {
            console.log('User cancelled navigation.');
            next(false); // Prevents navigation if the user cancels the prompt
            return;
        }

        // Proceed with email deletion if user confirms leaving
        await deleteCodesFromUserEmail();
        clearForgotPasswordProgress();
        next();
    }
});

</script>