import { ref, reactive } from 'vue';
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', () => {
    const userInformation = reactive({
        username: "",
        currency_code: "",
        first_name: ""
    });

    const resetUserStore = () => {
        userInformation.username = "";
        userInformation.first_name = "";
        userInformation.currency_code = "";
    }

    return { userInformation, resetUserStore }
}, { persist: { enabled: true } });