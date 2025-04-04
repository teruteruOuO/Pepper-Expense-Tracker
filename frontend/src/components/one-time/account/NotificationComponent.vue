<template>
<section class="notification-component">
    <section class="loader" v-if="isLoadingPage">
    </section>

    <section class="retrieve-fail" v-else-if="retrieveResourceFail">
        <p>Unable to retrieve your notification status. Please refresh the page or try again later</p>
    </section>
    <section class="retrieve-success" v-else>
        <h1>
            <label for="notification">Notification Status: </label>
        </h1>
        <div class="notification-bar">
            <label class="switch">
                <input type="checkbox" 
                name="notification" 
                id="notification" 
                v-model="isNotificationEnabled" 
                :class="{ 'checked': isNotificationEnabled, 'is-loading': isLoading }"
                @click="changeNotificationStatus()">
                
                <span class="slider round"></span>
            </label>
        </div>
    </section>
</section>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useUserStore } from "@/stores/user";

// Initialize variables
const user = useUserStore();
const isNotificationEnabled = ref(0);
const isLoading = ref(false);
const retrieveResourceFail = ref(false);
const isLoadingPage = ref(false);

// Change user's notification status
const changeNotificationStatus = async (req, res) => {
    isLoading.value = true;

    try {
        const response = await axios.put(`/api/user/notification/${user.userInformation.username}`, { 
            notification: isNotificationEnabled.value ? 0 : 1 // Send the correct value
        });
        console.log(response.data.message);
        isNotificationEnabled.value = response.data.notification ? 1 : 0;

    } catch (err) {
        console.error(`A server error occured while retrieving the user's notification setting.`);
        console.error(err);

        // Revert the toggle in case of an error
        isNotificationEnabled.value = !isNotificationEnabled.value;

    } finally {
        isLoading.value = false;

    }
}

// Retrieve user's notification status
const retrieveNotificationStatus = async (req, res) => {
    isLoadingPage.value = true;
    try {
        const response = await axios.get(`/api/user/notification/${user.userInformation.username}`);
        console.log(response.data.message);
        isNotificationEnabled.value = response.data.notification;

    } catch (err) {
        console.error(`A server error occured while retrieving the user's notification setting.`);
        console.error(err);
        isNotificationEnabled.value = 0;
        retrieveResourceFail.value = true;

    } finally {
        isLoadingPage.value = false;
    }
}

// Automatically retrieve the user's notification status
onMounted(async () => {
    await retrieveNotificationStatus();
})
</script>

<style scoped>
h1 {
    margin-block-start: 30px;
    text-align: center;
}

label {
    font-size: 2rem;
}

div {
    display: flex;
    justify-content: center;
    align-content: center;
}

.switch {
    position: relative;
    display: block;
    width: 120px;
    height: 68px;
}

.switch input { 
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    -webkit-transition: .4s;
    transition: .4s;
}

.slider:before {
    position: absolute;
    content: "";
    height: 52px;
    width: 52px;
    left: 8px;
    bottom: 8px;
    background-color: white;
    -webkit-transition: .4s;
    transition: .4s;
}

input.checked + .slider {
    background-color: pink;
}

input:focus + .slider {
    box-shadow: 0 0 5px pink;
}

input.checked + .slider:before {
    -webkit-transform: translateX(52px);
    -ms-transform: translateX(52px);
    transform: translateX(52px);
}

/* Rounded sliders */
.slider.round {
    border-radius: 34px;
}

.slider.round:before {
    border-radius: 50%;
}

.is-loading {
    cursor: not-allowed;
}
</style>