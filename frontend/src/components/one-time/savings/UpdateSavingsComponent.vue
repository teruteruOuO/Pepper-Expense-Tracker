<template>
<section class="update-savings-component">
    <section class="loader" v-if="isLoadingPage">
    </section>

    <section class="retrieve-fail" v-else-if="retrieveResourcesFail">
        <p>{{ feedBackFromBackend.message }}</p>
    </section>

    <section class="retrieve-success" v-else>
        <h1>Update Savings</h1>
        <form @submit.prevent="updateSavingsInstance()">
            <ul>
                <li>
                    <label for="savings-name-update">Name: </label>
                    <input type="text" name="savings-name-update" id="savings-name-update" required v-model="savingsInstanceInformation.information.name" placeholder="Required">
                </li>
                <li>
                    <label for="savings-description-update">Description: </label><br>
                    <textarea id="savings-description-update" v-model="savingsInstanceInformation.information.description">
                    </textarea>
                </li>
                <li>
                    <label for="savings-deadline-update">Deadline: </label>
                    <input type="date" name="savings-deadline-update" id="savings-deadline-update" required v-model="savingsInstanceInformation.information.deadline" placeholder="Required">
                </li>
                <li>
                    <label for="savings-current-amount-update">Current Amount:</label>
                    <input type="number" name="savings-current-amount-update" id="savings-current-amount-update" step="0.01" v-model="savingsInstanceInformation.amount.current" :placeholder="`${currencySettings.name} (${currencySettings.sign})`">
                </li>
                <li>
                    <label for="savings-target-amount-update">Target Amount:</label>
                    <input type="number" name="savings-target-amount-update" id="savings-target-amount-update" step="0.01" required v-model="savingsInstanceInformation.amount.target" :placeholder="`${currencySettings.name} (${currencySettings.sign})`">
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

        <section class="feedback" :class="{ 'fail': !feedBackFromBackend.success, 'success': feedBackFromBackend.success }" ref="feedbackSection">
            <p>{{  feedBackFromBackend.message }}</p>
        </section>
    </section>
</section>
</template>

<script setup>
import axios from 'axios';
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
import { useUserStore } from '@/stores/user';
import { useRoute, useRouter } from 'vue-router';

// Initialize variables
const isLoadingPage = ref(false);
const isLoadingUpdate = ref(false);
const isLoadingDelete = ref(false);
const retrieveResourcesFail = ref(false);
const feedbackSection = ref(null);
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
        retrieveResourcesFail.value = true;

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

        await nextTick();
        feedbackSection.value?.scrollIntoView({ behavior: "smooth", block: "center" });

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

        await nextTick();
        feedbackSection.value?.scrollIntoView({ behavior: "smooth", block: "center" });

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
h1 {
    margin-block-start: 30px;
    margin-block-end: 30px;
}

h1, p {
    text-align: center;
}

form {
    display: contents;
}

/* Flex Layout start */
ul {
    /* Flex parent */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-content: center;
    gap: 20px 20px;

    inline-size: 325px;
    margin: 0 auto;
    margin-block-end: 20px;
}

li {
    /* Flex children */
    margin: 0 auto;
}
/* Flex Layout end */

button {
    border: 1px solid black;
    border-radius: 5px;
    inline-size: 312px;
    block-size: 48px;
    border: 1px solid black;
    background-color: #FFD0D8;
}

button:focus, button:hover {
    background-color: rgb(255, 225, 230);
    color: rgb(59, 59, 59);
    border-color: rgb(59, 59, 59);
}

button:active, .is-loading {
    color: rgb(102, 101, 101);
    border-color: rgb(117, 117, 117);
    cursor: not-allowed;
}

input, textarea {
    display: block;
    border-radius: 5px;
    inline-size: 312px;
    block-size: 48px;
    border: 1px solid black;
}

textarea {
    resize: vertical;
}

.fail {
    color: red;
}

.success {
    color: green;
}

/* Laptop and above*/
@media screen and (min-width: 768px) {
    .update-savings-component {
        margin-block-start: 70px;
    }
}
</style>