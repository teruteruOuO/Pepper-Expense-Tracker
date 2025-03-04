<template>
<main class="account-view">
    <h1>Account Page</h1>
    <section class="buttons">
        <ul>
            <li>
                <button type="button" class="update-profile" @click="switchComponent(UpdateProfileComponent)">
                    Update Profile
                </button>
            </li>
            <li>
                <button type="button" class="change-password" @click="switchComponent(PasswordChangeComponent)">
                    Change Password
                </button>
            </li>
            <li>
                <button type="button" class="change-username" @click="switchComponent(UsernameChangeComponent)">
                    Change Username
                </button>
            </li>
            <li>
                <button type="button" class="change-email" @click="switchComponent(EmailChangeComponent)">
                    Change Email
                </button>
            </li>
            <li>
                <button type="button" class="notification" @click="switchComponent(NotificationComponent)">
                    Notification
                </button>
            </li>
            <li>
                <button type="button" class="delete-account" @click="switchComponent(DeleteAccountComponent)">
                    Delete Account
                </button>
            </li>
            <li>
                <button type="button" class="logout" @click="switchComponent(LogoutComponent)">
                    Logout
                </button>
            </li>
        </ul>
    </section>
    <component :is="currentComponent"/>
</main>
</template>


<script setup>
import UpdateProfileComponent from '@/components/one-time/account/UpdateProfileComponent.vue';
import PasswordChangeComponent from '@/components/one-time/account/PasswordChangeComponent.vue';
import UsernameChangeComponent from '@/components/one-time/account/UsernameChangeComponent.vue';
import EmailChangeComponent from '@/components/one-time/account/EmailChangeComponent.vue';
import NotificationComponent from '@/components/one-time/account/NotificationComponent.vue';
import DeleteAccountComponent from '@/components/one-time/account/DeleteAccountComponent.vue';
import LogoutComponent from '@/components/one-time/account/LogoutComponent.vue';
import { shallowRef  } from 'vue';

const currentComponent = shallowRef(UpdateProfileComponent);
// Function to switch components dynamically
const switchComponent = (component) => currentComponent.value = component;
</script>


<style scoped>
h1  {
    text-align: center;
}
ul {
    /* Flex parent */
    display: flex;
    flex-wrap: wrap;
    
    background-color: pink;
}

li {
    /* Makes button the children of UL instead */
    display: contents;
}

button {
    /* flex child */
    flex-grow: 1;
}
</style>