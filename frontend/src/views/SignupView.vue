<template>
<main class="signup-view">
    <VerifyEmailComponent v-if="signupInformation.emailStatus.components.verify_email"/>
    <EnterCodeComponent v-else-if="signupInformation.emailStatus.components.enter_code"/>
    <SignupFormComponent v-else-if="signupInformation.emailStatus.components.sign_up"/>
    
    <!-- Listens for behavior: When user closes the tab during the 2nd stage of sign-up or when they navigate back to Login page
    This deletes the email in the database that is used to sign up but never completed -->
    <CancelSignUpComponent v-if="!signupInformation.emailStatus.completed"/>
</main>
</template>

<script setup>
import VerifyEmailComponent from '@/components/one-time/sign-up/VerifyEmailComponent.vue';
import EnterCodeComponent from '@/components/one-time/sign-up/EnterCodeComponent.vue';
import SignupFormComponent from '@/components/one-time/sign-up/SignupFormComponent.vue';
import CancelSignUpComponent from '@/components/one-time/sign-up/CancelSignUpComponent.vue';
import { useEmailSignup } from '@/stores/email-signup';

const signupInformation = useEmailSignup();
</script>

<style scoped>
main {
    /* Center the component */
    justify-content: center;
    align-content: center;
}
</style>