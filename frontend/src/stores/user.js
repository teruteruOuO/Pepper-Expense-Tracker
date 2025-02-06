import { ref, reactive } from 'vue';
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', () => {
    const userInformation = reactive({
        username: "",
        first_name: ""
    });

    const settings = reactive({
        currency_sign: "",
        currency_code: ""
    });

    const resetUserStore = () => {
        userInformation.username = "";
        userInformation.first_name = "";
        settings.currency_sign = "";
        settings.currency_code = "";
    }

    return { userInformation, settings, resetUserStore }
}, { persist: { enabled: true } });