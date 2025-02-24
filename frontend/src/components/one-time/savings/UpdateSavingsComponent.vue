<template>
<section class="update-savings-component">
    <h2>Update Savings Component</h2>
    <section class="loading" v-if="isLoadingPage">
        <p>Retrieving the savings...</p>
    </section>

    <section class="failed" v-else-if="!isLoadingPage && !savingsInstanceInformation.information">
        <p>{{ feedBackFromBackend.message }}</p>
    </section>

    <section class="success" v-else-if="!isLoadingPage && savingsInstanceInformation.information">
        <form @submit.prevent="updateSavingsInstance()">
            <h3>Update Savings information</h3>
            <ul>
                <li>
                    <label for="savings-name-update">Name: </label>
                    <input type="text" name="savings-name-update" id="savings-name-update" required v-model="savingsInstanceInformation.information.name">
                </li>
                <li>
                    <label for="savings-description-update">Description: </label><br>
                    <textarea id="savings-description-update" placeholder="Enter description..." v-model="savingsInstanceInformation.information.description">
                    </textarea>
                </li>
                <li>
                    <label for="savings-deadline-update">Deadline: </label>
                    <input type="date" name="savings-deadline-update" id="savings-deadline-update" required v-model="savingsInstanceInformation.information.deadline">
                </li>
                <li>
                    <label for="savings-current-amount-update">Current Amount: {{ currencySettings.sign }}</label>
                    <input type="number" name="savings-current-amount-update" id="savings-current-amount-update" step="0.01" v-model="savingsInstanceInformation.amount.current" :placeholder="currencySettings.name">
                </li>
                <li>
                    <label for="savings-target-amount-update">Target Amount: {{ currencySettings.sign }}</label>
                    <input type="number" name="savings-target-amount-update" id="savings-target-amount-update" step="0.01" required v-model="savingsInstanceInformation.amount.target" :placeholder="currencySettings.name">
                </li>
                <li>
                    <button type="submit" :class="{ 'is-loading': isLoadingUpdate }">
                        <span v-if="!isLoadingUpdate">Update</span>
                        <span v-else>Updating...</span>
                    </button>
                </li>
                <li>
                    <button type="button" @click="deleteSavingsInstance()" :class="{ 'is-loading': isLoadingDelete }">
                        <span v-if="!isLoadingDelete">Delete</span>
                        <span v-else>Deleting...</span>
                    </button>
                </li>
            </ul>
        </form>

        <section :class="{ 'feedback-fail': !feedBackFromBackend.success, 'feedback-success': feedBackFromBackend.success }">
            <p>{{  feedBackFromBackend.message }}</p>
        </section>
    </section>
</section>
</template>

<script setup>
import axios from 'axios';
import { ref, reactive, onMounted, computed } from 'vue';
import { useUserStore } from '@/stores/user';
import { useRoute, useRouter } from 'vue-router';

// Initialize variables
const isLoadingPage = ref(false);
const isLoadingUpdate = ref(false);
const isLoadingDelete = ref(false);
const feedBackFromBackend = reactive({
    message: '',
    success: false
})
const user = useUserStore();
const route = useRoute();
const router = useRouter();
const currencySettings = reactive({
    name: '',
    sign: ''
});
const savingsInstanceInformation = reactive({
    sequence: Number(),
    information: {
        name: '',
        description: '',
        deadline: new Date()
    },
    amount: {
        current: Number(),
        target: Number()
    }
}); 

// Retrieve the saving instance's information of the user
const retrieveSavingsInstance = async () => {
    isLoadingPage.value = true;

    try {
        const response = await axios.get(`/api/savings/${user.userInformation.username}/instance/${route.params.sequence}`);
        console.log(response.data.message);

        // Store currency information
        currencySettings.name = response.data.currency.name;
        currencySettings.sign = response.data.currency.sign;

        // Store savings instance information
        savingsInstanceInformation.sequence = response.data.savings.sequence;
        savingsInstanceInformation.information.name = response.data.savings.information.name;
        savingsInstanceInformation.information.description = response.data.savings.information.description;
        savingsInstanceInformation.information.deadline = response.data.savings.information.deadline;
        savingsInstanceInformation.amount.current = response.data.savings.amount.current;
        savingsInstanceInformation.amount.target = response.data.savings.amount.target;
 
    } catch (err) {
        console.error(`An error occured while retrieving the saving instance #${route.params.sequence}'s information.`);
        console.error(err);
        feedBackFromBackend.message = err.response.data.message;
        feedBackFromBackend.success = false;

    } finally {
        isLoadingPage.value = false;

    }
}

// Ensure optional data like initial is always null when left empty 
const description = computed(() => {
    if (savingsInstanceInformation.information.description === ""  || savingsInstanceInformation.information.description === " ") {
        return null
    } else {
        return savingsInstanceInformation.information.description
    }
});

// Update the saving instance
const updateSavingsInstance = async () => {
    isLoadingUpdate.value = true;
    const answer = window.confirm(`Once you continue, the savings information for ${savingsInstanceInformation.information.name} will be updated. Continue?`);

    if (!answer) {
        console.log("The system stopped trying to update the savings instance information for the user.");
        isLoadingUpdate.value = false;
        return; // Prevents navigation if the user cancels the prompt
    }  

    try {
        const body = {
            information: {
                name: savingsInstanceInformation.information.name,
                description: description.value,
                deadline: savingsInstanceInformation.information.deadline
            },
            amount: {
                current: Number(savingsInstanceInformation.amount.current),
                target: Number(savingsInstanceInformation.amount.target)
            }
        }
        const response = await axios.put(`/api/savings/update/${user.userInformation.username}/${savingsInstanceInformation.sequence}`, body);
        console.log(response.data.message);

        // reload the update savings page
        alert(response.data.message);
        window.location.reload();

    } catch (err) {
        console.error(`An error occured while updating savings instance #${savingsInstanceInformation.sequence}.`);
        console.error(err);
        feedBackFromBackend.message = err.response.data.message;
        feedBackFromBackend.success = false;

    } finally {
        isLoadingUpdate.value = false;

    }
}

// Delete this savings instance 
const deleteSavingsInstance = async () => {
    isLoadingDelete.value = true;
    const answer = window.confirm(`Once you continue, the savings information for ${savingsInstanceInformation.information.name} will be deleted. Continue?`);

    if (!answer) {
        console.log("The system stopped trying to delete the savings instance information for the user.");
        isLoadingDelete.value = false;
        return; // Prevents navigation if the user cancels the prompt
    }

    try {
        const response = await axios.delete(`/api/savings/${user.userInformation.username}/${savingsInstanceInformation.sequence}`);
        console.log(response.data.message);

        // Route the user back to the savings page
        alert(response.data.message);
        router.push({ name: 'savings' });

    } catch (err) {
        console.error(`An error occured while deleting savings instance #${savingsInstanceInformation.sequence}.`);
        console.error(err);
        feedBackFromBackend.message = err.response.data.message;
        feedBackFromBackend.success = false;

    } finally {
        isLoadingDelete.value = false;
        
    }
}

// Automatically retrieve the saving instance information of the user.
onMounted(async () => {
    await retrieveSavingsInstance();
});
</script>


<style scoped>
.update-savings-component {
    border-radius: 5px;
    border: 1px solid rgb(14, 73, 202);
}

button {
    border: 1px solid black;
    border-radius: 5px;
    background-color: yellow;
}

button:active {
    background-color: rgb(94, 94, 30);
    color: white;
}

.feedback-fail {
    color: red;
}

.feedback-success {
    color: green;
}

/* style for isLoading variables */
.is-loading {
    background-color: rgb(94, 94, 30);
    color: gray;
    cursor: not-allowed;
}
</style>