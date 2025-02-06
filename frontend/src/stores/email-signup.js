import { reactive } from 'vue';
import { defineStore } from 'pinia';

export const useEmailSignup = defineStore('email-signup', () => {
    const emailStatus = reactive({
        email: "",
        completed: false, // use if signup form is successfully completed
        components: {
            verify_email: true,
            enter_code: false,
            sign_up: false
        }
    });

    // Enables VerifyEmailComponent to show in the Sign Up Page
    const verifyEmailComponent = () => {
        emailStatus.components.verify_email = true,
        emailStatus.components.enter_code = false,
        emailStatus.components.sign_up = false
    }

    // Enables EnterCodeComponent to show in the Sign Up Page
    const enterCodeComponent = () => {
        emailStatus.components.verify_email = false,
        emailStatus.components.enter_code = true,
        emailStatus.components.sign_up = false
    }

    // Enables SignUpComponent to show in the Sign Up Page
    const signUpComponent = () => {
        emailStatus.components.verify_email = false,
        emailStatus.components.enter_code = false,
        emailStatus.components.sign_up = true
    }


    return { emailStatus, verifyEmailComponent, enterCodeComponent, signUpComponent }
}, { persist: { enabled: true } });