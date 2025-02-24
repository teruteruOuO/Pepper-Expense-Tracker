<template>
<section class="update-budget-component">
    <section class="loading" v-if="isLoadingPage">
        <p>Retrieving your transaction information, preferred currency, and categories...</p>
    </section>

    <section :class="{ 'feedback-fail': !feedBackFromBackend.success }" v-else-if="retrieveResourcesFail">
        <p>{{ feedBackFromBackend.message }}</p>
    </section>

    <section class="success" v-else>
        <form @submit.prevent="updateBudgetInstance()">
            <ul>
                <li>
                    <p>Enter values in {{ currencySettings.name }} {{ currencySettings.sign }}</p>
                    <p>Used amount can only be manipulated by adding or removing an expense transaction to this budget</p>
                </li>
                <li>
                    <label for="budget-name-update">Name: </label>
                    <input type="text" name="budget-name-update" id="budget-name-update" v-model="budgetInstanceInformation.name" required>
                </li>
                <li>
                    <label for="budget-description-update">Description: </label><br>
                    <textarea id="budget-description-update" v-model="budgetInstanceInformation.description" placeholder="Enter description...">
                    </textarea>
                </li>
                <li>
                    <p>Total used amount: {{ currencySettings.sign }}{{ budgetInstanceInformation.amount.used.toFixed(2) }}</p>
                </li>
                <li>
                    <label for="budget-limit-amount-update">Limit Amount: {{ currencySettings.sign }}</label>
                    <input type="number" name="budget-limit-amount-update" id="budget-limit-amount-update" v-model="budgetInstanceInformation.amount.limit" step="0.01" required>
                </li>
                <li>
                    <label for="budget-progress-update">Progress: </label>
                    <meter :value="budgetInstanceInformation.progress" min="0" max="100" low="25" high="75" optimum="0" name="budget-progress-update" id="budget-progress-update">{{ budgetInstanceInformation.progress }}</meter> 
                    <span> {{ budgetInstanceInformation.progress.toFixed(2) }}%</span>
                </li>
                <li>
                    <label for="budget-start-date-update">Start Date: </label>
                    <input type="date" name="budget-start-date-update" id="budget-start-date-update" v-model="budgetInstanceInformation.date.start" required>
                </li>
                <li>
                    <label for="budget-end-date-add">End Date: </label>
                    <input type="date" name="budget-end-date-update" id="budget-end-date-update" v-model="budgetInstanceInformation.date.end" required>
                </li>
                <li>
                    <button type="submit" :class="{ 'is-loading': isLoadingUpdate}">
                        <span v-if="!isLoadingUpdate">Update</span>
                        <span v-else>Loading...</span>
                    </button>
                </li>
                <li>
                    <button type="button" :class="{ 'is-loading': isLoadingDelete }" @click="deleteBudgetInstance()">
                        <span v-if="!isLoadingDelete">Delete</span>
                        <span v-else>Loading...</span>
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
const retrieveResourcesFail = ref(false);
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
const budgetInstanceInformation = reactive({
    id: Number(),
    name: '',
    description: '',
    progress: Number(),
    date: {
        start: new Date(),
        end: new Date()
    },
    amount: {
        used: Number(),
        limit: Number()
    }
}); 

// Ensure optional data like initial is always null when left empty 
const description = computed(() => {
    if (budgetInstanceInformation.description === ""  || budgetInstanceInformation.description === " ") {
        return null
    } else {
        return budgetInstanceInformation.description
    }
});

// Retrieve the budget instance's information of the user
const retrieveBudgetInstance = async () => {
    isLoadingPage.value = true;

    try {
        const response = await axios.get(`/api/budget/${user.userInformation.username}/instance/${route.params.budget_id}`);
        console.log(response.data.message);

        // Store currency information
        currencySettings.name = response.data.currency.name;
        currencySettings.sign = response.data.currency.sign;

        // Store budget instance information
        budgetInstanceInformation.id = response.data.budget.id;
        budgetInstanceInformation.name = response.data.budget.name;
        budgetInstanceInformation.description = response.data.budget.description;
        budgetInstanceInformation.progress = response.data.budget.progress;
        budgetInstanceInformation.date.start = response.data.budget.date.start;
        budgetInstanceInformation.date.end = response.data.budget.date.end;
        budgetInstanceInformation.amount.used = response.data.budget.amount.used;
        budgetInstanceInformation.amount.limit = response.data.budget.amount.limit;
 
    } catch (err) {
        console.error(`An error occured while retrieving the budget instance #${route.params.budget_id}'s information.`);
        console.error(err);
        feedBackFromBackend.message = err.response.data.message;
        feedBackFromBackend.success = false;
        retrieveResourcesFail.value = true;

        // If there's no resource (the budget doesn't exist for the user) then reroute them back to the budget page
        if (err.response && err.response.status === 404) {
            alert(feedBackFromBackend.message);
            router.push({ name: 'budget' });
        }

    } finally {
        isLoadingPage.value = false;

    }
}

// Update the budget instance
const updateBudgetInstance = async () => {
    isLoadingUpdate.value = true;
    const answer = window.confirm(`Once you continue, the budget information for ${budgetInstanceInformation.name} will be updated. Continue?`);

    if (!answer) {
        console.log("The system stopped trying to update the budget instance information for the user.");
        isLoadingUpdate.value = false;
        return; // Prevents navigation if the user cancels the prompt
    }  

    try {
        const body = {
            name: budgetInstanceInformation.name,
            description: description.value,
            limit_amount: Number(budgetInstanceInformation.amount.limit),
            date: {
                start: budgetInstanceInformation.date.start,
                end: budgetInstanceInformation.date.end,
            },
            
        }
        const response = await axios.put(`/api/budget/${user.userInformation.username}/${budgetInstanceInformation.id}`, body);
        console.log(response.data.message);

        // reload the update budget page
        alert(response.data.message);
        window.location.reload();

    } catch (err) {
        console.error(`An error occured while updating budget instance #${budgetInstanceInformation.id}.`);
        console.error(err);
        feedBackFromBackend.message = err.response.data.message;
        feedBackFromBackend.success = false;

    } finally {
        isLoadingUpdate.value = false;

    }
}

// Delete this budget instance 
const deleteBudgetInstance = async () => {
    isLoadingDelete.value = true;
    const answer = window.confirm(`Once you continue, the budget information for ${budgetInstanceInformation.name} will be deleted. Continue?`);

    if (!answer) {
        console.log("The system stopped trying to delete the budget instance information for the user.");
        isLoadingDelete.value = false;
        return; // Prevents navigation if the user cancels the prompt
    }

    try {
        const response = await axios.delete(`/api/budget/${user.userInformation.username}/${budgetInstanceInformation.id}`);
        console.log(response.data.message);

        // Route the user back to the budget page
        alert(response.data.message);
        router.push({ name: 'budget' });

    } catch (err) {
        console.error(`An error occured while deleting budget instance #${budgetInstanceInformation.id}.`);
        console.error(err);
        feedBackFromBackend.message = err.response.data.message;
        feedBackFromBackend.success = false;

    } finally {
        isLoadingDelete.value = false;
        
    }
}

onMounted(async () => {
    await retrieveBudgetInstance();
})
</script>


<style scoped>
.update-budget-component {
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