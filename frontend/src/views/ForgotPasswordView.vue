<template>
<main class="forgot-password-view">
    <h1>Forgot Password</h1>
    <EnterEmailComponent v-if="monitorForgotPassword.forgotPasswordStatus.components.enter_email"/>
    <EnterCodeComponent v-else-if="monitorForgotPassword.forgotPasswordStatus.components.enter_code"/>
    <EnterPasswordComponent v-else-if="monitorForgotPassword.forgotPasswordStatus.components.enter_password"/>

    <!-- Listens for behavior: When user closes the tab during the 2nd stage of sign-up or when they navigate back to Login page
    This deletes the email in the database that is used to sign up but never completed -->
    <CancelForgotPasswordComponent v-if="!monitorForgotPassword.forgotPasswordStatus.completed"/>

</main>
</template>

<script setup>
import EnterEmailComponent from '@/components/one-time/forgot-password/EnterEmailComponent.vue';
import EnterCodeComponent from '@/components/one-time/forgot-password/EnterCodeComponent.vue';
import EnterPasswordComponent from '@/components/one-time/forgot-password/EnterPasswordComponent.vue';
import CancelForgotPasswordComponent from '@/components/one-time/forgot-password/CancelForgotPasswordComponent.vue';
import { useForgotPassword } from '@/stores/forgot-password';

const monitorForgotPassword = useForgotPassword();
</script>