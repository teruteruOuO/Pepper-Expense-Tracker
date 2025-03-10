<template>
<main class="account-view">
    <section class="buttons">
        <ul>
            <li>
                <button type="button" class="update-profile" @click="switchComponent(`UpdateProfileComponent`)">
                    Update Profile
                </button>
            </li>
            <li>
                <button type="button" class="change-password" @click="switchComponent(`PasswordChangeComponent`)">
                    Change Password
                </button>
            </li>
            <li>
                <button type="button" class="change-username" @click="switchComponent(`UsernameChangeComponent`)">
                    Change Username
                </button>
            </li>
            <li>
                <button type="button" class="change-email" @click="switchComponent(`EmailChangeComponent`)">
                    Change Email
                </button>
            </li>
            <li>
                <button type="button" class="notification" @click="switchComponent(`NotificationComponent`)">
                    Notification
                </button>
            </li>
            <li>
                <button type="button" class="delete-account" @click="switchComponent(`DeleteAccountComponent`)">
                    Delete Account
                </button>
            </li>
            <li>
                <button type="button" class="logout" @click="switchComponent(`LogoutComponent`)">
                    Logout
                </button>
            </li>
        </ul>
    </section>
    <component :is="currentComponent"/>
</main>
</template>


<script setup>
import { ref, onMounted } from 'vue';
import UpdateProfileComponent from '@/components/one-time/account/UpdateProfileComponent.vue';
import PasswordChangeComponent from '@/components/one-time/account/PasswordChangeComponent.vue';
import UsernameChangeComponent from '@/components/one-time/account/UsernameChangeComponent.vue';
import EmailChangeComponent from '@/components/one-time/account/EmailChangeComponent.vue';
import NotificationComponent from '@/components/one-time/account/NotificationComponent.vue';
import DeleteAccountComponent from '@/components/one-time/account/DeleteAccountComponent.vue';
import LogoutComponent from '@/components/one-time/account/LogoutComponent.vue';

// Map component names to actual component objects
const componentMap = {
    UpdateProfileComponent,
    PasswordChangeComponent,
    UsernameChangeComponent,
    EmailChangeComponent,
    NotificationComponent,
    DeleteAccountComponent,
    LogoutComponent
};

// Retrieve stored component or default to UpdateProfileComponent
const storedComponent = localStorage.getItem('selectedAccountComponent') || 'UpdateProfileComponent';
const currentComponent = ref(componentMap[storedComponent]);

// Function to switch components and store selection
const switchComponent = (componentName) => {
    currentComponent.value = componentMap[componentName];
    localStorage.setItem('selectedAccountComponent', componentName);
};

// Ensure selected component persists on page reload
onMounted(() => {
    const savedComponent = localStorage.getItem('selectedAccountComponent');
    if (savedComponent && componentMap[savedComponent]) {
        currentComponent.value = componentMap[savedComponent];
    }
});
</script>


<style scoped>
.buttons, li {
    display: contents;
}

ul {
    display: flex;
    justify-content: center;
    align-content: center;
    margin-block-start: 20px;
    flex-wrap: wrap;
    column-gap: 10px;
    row-gap: 10px;
}

button {
    border: 1px solid black;
    border-radius: 20px;
    inline-size: 170px;
    block-size: 30px;
    padding-inline: 10px;
    border: 1px solid black;
    background-color: #FFD0D8;
}

button:focus, button:hover {
    background-color: rgb(255, 225, 230);
    color: rgb(59, 59, 59);
    border-color: rgb(59, 59, 59);
}

button:active {
    background-color: rgb(255, 240, 243);
    color: rgb(102, 101, 101);
    border-color: rgb(117, 117, 117);
    cursor: not-allowed;
}
</style>