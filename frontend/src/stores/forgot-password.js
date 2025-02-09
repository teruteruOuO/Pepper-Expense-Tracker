import { reactive } from 'vue';
import { defineStore } from 'pinia';

export const useForgotPassword = defineStore('forgot-password', () => {
    const forgotPasswordStatus = reactive({
        email: "",
        completed: false,
        components: {
            enter_email: true,
            enter_code: false,
            enter_password: false
        }
    });

    // Enables EmailEmailComponent to show in the Forgot Password Page
    const enterEmailComponent = () => {
        forgotPasswordStatus.components.enter_email = true,
        forgotPasswordStatus.components.enter_code = false,
        forgotPasswordStatus.components.enter_password = false
    }

    // Enables EnterCodeComponent to show in the Forgot Password Page
    const enterCodeComponent = () => {
        forgotPasswordStatus.components.enter_email = false,
        forgotPasswordStatus.components.enter_code = true,
        forgotPasswordStatus.components.enter_password = false
    }

    // Enables SignUpComponent to show in the Forgot Password Page
    const enterPasswordComponent = () => {
        forgotPasswordStatus.components.enter_email = false,
        forgotPasswordStatus.components.enter_code = false,
        forgotPasswordStatus.components.enter_password = true
    }


    return { forgotPasswordStatus, enterEmailComponent, enterCodeComponent, enterPasswordComponent }
}, { persist: { enabled: true } });