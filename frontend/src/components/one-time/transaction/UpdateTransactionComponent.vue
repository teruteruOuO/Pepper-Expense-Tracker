<template>
<section class="update-transaction-component">
    <h2>Update Transaction Component</h2>
    <section class="loader" v-if="isLoadingPage">
    </section>

    <section :class="{ 'feedback-fail': !feedBackFromBackend.success }" v-else-if="retrieveResourcesFail">
        <p>{{ feedBackFromBackend.message }}</p>
    </section>

    <section class="resources-retrieve-success" v-else>
        <form @submit.prevent="updateTransactionInstance()">
            <ul>
                <li>
                    <p>Enter values in {{ currencySettings.name }} {{ currencySettings.sign }}</p>
                </li>
                <li v-if="transactionInstanceInformation.transaction.type === 'expense'">
                    <p>This expense is {{ transactionInstanceInformation.transaction.resolved ? 'Resolved (Paid)' : 'Unresolved (Unpaid)' }}</p>
                </li>
                <li>
                    <label for="transaction-name-update">Name: </label>
                    <input type="text" name="transaction-name-update" id="transaction-name-update" required v-model="transactionInstanceInformation.transaction.name">
                </li>
                <li>
                    <label for="transaction-description-update">Description: </label><br>
                    <textarea id="transaction-description-update" placeholder="Enter description..." v-model="transactionInstanceInformation.transaction.description">
                    </textarea>
                </li>
                <li>
                    <label for="transaction-amount-update">Amount: {{ currencySettings.sign }}</label>
                    <input type="number" name="transaction-amount-update" id="transaction-amount-update" step="0.01" v-model="transactionInstanceInformation.transaction.amount" required>
                </li>
                <li>
                    <label for="transaction-type-update">Type: </label>
                    <select name="transaction-type-update" id="transaction-type-update" v-model="transactionInstanceInformation.transaction.type" required>
                        <option value=""></option>
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                    </select>
                </li>
                <li>
                    <label for="transaction-date-update">Date: </label>
                    <input type="datetime-local" name="transaction-date-update" id="transaction-date-update" required v-model="transactionInstanceInformation.transaction.date">
                </li>
                <li>
                    <label for="transaction-category-add">Category: </label>
                    <select name="transaction-category-update" id="transaction-category-update" v-model="transactionInstanceInformation.category.id" required>
                        <option v-for="category in categoryList" :key="category.category_id" :value="category.category_id">
                            {{ category.category_name }}
                        </option>
                    </select>
                </li>
                <!-- Appear only if a user has at least one existing budget -->
                <li v-if="budgetList">
                    <label for="transaction-budget-update">Budget: </label>
                    <select name="transaction-budget-update" id="transaction-budget-update" v-model="transactionInstanceInformation.budget.id">
                        <option :value=null>None</option>
                        <option v-for="budget in budgetList" :key="budget.id" :value="budget.id">
                            {{ budget.name }}
                        </option>
                    </select>
                </li>
                <li>
                    <button type="submit" :class="{ 'is-loading': isLoadingUpdate}">
                        <span v-if="!isLoadingUpdate">Update</span>
                        <span v-else>Loading...</span>
                    </button>
                </li>
                <li>
                    <button type="button" @click="deleteTransactionInstance()" :class="{ 'is-loading': isLoadingDelete }">
                        <span v-if="!isLoadingDelete">Delete</span>
                        <span v-else>Deleting...</span>
                    </button>
                </li>
                <li>
                    <button 
                    type="button" 
                    @click="changeTransactionStatus()" 
                    v-if="transactionInstanceInformation.transaction.type === 'expense'" :class="{ 'is-loading': isLoadingResolveStatus }">
                        <span v-if="!isLoadingResolveStatus">
                            <span v-if="transactionInstanceInformation.transaction.resolved">Unresolve</span>
                            <span v-else>Resolve</span>
                        </span>
                        <span v-else>
                            Loading...
                        </span>
                    </button>
                </li>
            </ul>
        </form>

        <section :class="{ 'feedback-fail': !feedBackFromBackend.success }">
            <p>{{ feedBackFromBackend.message }}</p>
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
const isLoadingResolveStatus = ref(false);
const retrieveResourcesFail = ref(false);
const feedBackFromBackend = reactive({
    message: '',
    success: false
})
const user = useUserStore();
const route = useRoute();
const router = useRouter();
const categoryList = ref(null);
const budgetList = ref(null);
const currencySettings = reactive({
    name: '',
    sign: ''
});
const transactionInstanceInformation = reactive({
    transaction: {
        sequence: Number(),
        name: "",
        description: "",
        amount: Number(),
        type: "",
        date: new Date(),
        resolved: null
    },
    category: {
        id: Number(),
        name: ""
    },
    budget: {
        id: Number(),
        name: ""
    }
});

// Ensure optional data like description is always null when left empty 
const description = computed(() => {
    if (transactionInstanceInformation.transaction.description === ""  || transactionInstanceInformation.transaction.description === " ") {
        return null
    } else {
        return transactionInstanceInformation.transaction.description
    }
});

// Retrieve the transaction instance's information of the user
const retrieveTransactionInstance = async () => {
    isLoadingPage.value = true;

    try {
        const categoryResponse = await axios.get(`/api/category`);
        const currencyResponse = await axios.get(`/api/currency/${user.userInformation.username}/${user.userInformation.currency_code}`);
        const budgetResponse = await axios.get(`/api/budget/get-name/${user.userInformation.username}`);
        const transactionInstanceResponse = await axios.get(`/api/transaction/${user.userInformation.username}/instance/${route.params.sequence}`);

        console.log(categoryResponse.data.message);
        console.log(currencyResponse.data.message);
        console.log(budgetResponse.data.message);
        console.log(transactionInstanceResponse.data.message);

        // Store each information
        categoryList.value = categoryResponse.data.category;
        budgetList.value = budgetResponse.data.budget;
        currencySettings.name = currencyResponse.data.currency.name;
        currencySettings.sign = currencyResponse.data.currency.sign;

        // Store transaction instance information
        transactionInstanceInformation.transaction.sequence = transactionInstanceResponse.data.transaction_information.transaction.sequence;
        transactionInstanceInformation.transaction.name = transactionInstanceResponse.data.transaction_information.transaction.name;
        transactionInstanceInformation.transaction.description = transactionInstanceResponse.data.transaction_information.transaction.description;
        transactionInstanceInformation.transaction.amount = transactionInstanceResponse.data.transaction_information.transaction.amount;
        transactionInstanceInformation.transaction.type = transactionInstanceResponse.data.transaction_information.transaction.type;
        transactionInstanceInformation.transaction.date = transactionInstanceResponse.data.transaction_information.transaction.date;
        transactionInstanceInformation.transaction.resolved = transactionInstanceResponse.data.transaction_information.transaction.resolved;
        transactionInstanceInformation.category.id = transactionInstanceResponse.data.transaction_information.category.id;
        transactionInstanceInformation.category.name = transactionInstanceResponse.data.transaction_information.category.name;
        transactionInstanceInformation.budget.id = transactionInstanceResponse.data.transaction_information.budget.id;
        transactionInstanceInformation.budget.name = transactionInstanceResponse.data.transaction_information.budget.name;


    } catch (err) {
        console.error(`An error occured while retrieving the saving instance #${route.params.sequence}'s information.`);
        console.error(err);
        feedBackFromBackend.message = err.response.data.message;
        feedBackFromBackend.success = false;
        retrieveResourcesFail.value = true;

        // If there's no resource (the transaction doesn't exist for the user) then reroute them back to the transaction page
        if (err.response && err.response.status === 404) {
            alert(feedBackFromBackend.message);
            router.push({ name: 'transaction' });
        }

    } finally {
        isLoadingPage.value = false;

    }
}

// Update the transaction instance
const updateTransactionInstance = async () => {
    isLoadingUpdate.value = true;
    const answer = window.confirm(`Once you continue, the transaction information for ${transactionInstanceInformation.transaction.name} will be updated. Continue?`);

    if (!answer) {
        console.log("The system stopped trying to update the transaction instance information for the user.");
        isLoadingUpdate.value = false;
        return; // Prevents navigation if the user cancels the prompt
    }  

    try {
        const body = {
            transaction: {
                name: transactionInstanceInformation.transaction.name,
                description: description.value,
                amount: Number(transactionInstanceInformation.transaction.amount),
                type: transactionInstanceInformation.transaction.type,
                date: transactionInstanceInformation.transaction.date,
            },
            category_id: transactionInstanceInformation.category.id,
            budget_id: transactionInstanceInformation.budget.id,
        }
        const response = await axios.put(`/api/transaction/${user.userInformation.username}/${transactionInstanceInformation.transaction.sequence}`, body);
        console.log(response.data.message);

        // reload the update savings page
        alert(response.data.message);
        window.location.reload();

    } catch (err) {
        console.error(`An error occured while updating savings instance #${transactionInstanceInformation.transaction.sequence}.`);
        console.error(err);
        feedBackFromBackend.message = err.response.data.message;
        feedBackFromBackend.success = false;

    } finally {
        isLoadingUpdate.value = false;

    }
}

// Delete this transaction instance 
const deleteTransactionInstance = async () => {
    isLoadingDelete.value = true;
    const answer = window.confirm(`Once you continue, the transaction information for ${transactionInstanceInformation.transaction.name} will be deleted. Continue?`);

    if (!answer) {
        console.log("The system stopped trying to delete the transaction instance information for the user.");
        isLoadingDelete.value = false;
        return; // Prevents navigation if the user cancels the prompt
    }

    try {
        const response = await axios.delete(`/api/transaction/${user.userInformation.username}/${transactionInstanceInformation.transaction.sequence}`);
        console.log(response.data.message);

        // Route the user back to the transaction page
        alert(response.data.message);
        router.push({ name: 'transaction' });

    } catch (err) {
        console.error(`An error occured while deleting transaction instance #${transactionInstanceInformation.transaction.sequence}.`);
        console.error(err);
        feedBackFromBackend.message = err.response.data.message;
        feedBackFromBackend.success = false;

    } finally {
        isLoadingDelete.value = false;
        
    }
}

// Resolve or Unresolve an expense
const changeTransactionStatus = async () => {
    isLoadingResolveStatus.value = true;
    const answer = window.confirm(`Once you continue, the transaction status for ${transactionInstanceInformation.transaction.name} will be updated. Continue?`);

    if (!answer) {
        console.log("The system stopped trying to update the transaction instance status for the user.");
        isLoadingResolveStatus.value = false;
        return; // Prevents navigation if the user cancels the prompt
    } 

    try {
        const response = await axios.put(`/api/transaction/expense-resolution/${user.userInformation.username}/${transactionInstanceInformation.transaction.sequence}`, { resolved: transactionInstanceInformation.transaction.resolved });
        console.log(response.data.message);
        alert(response.data.message);

        // Reload the page
        window.location.reload();

    } catch (err) {
        console.error(`An error occured while changing ${transactionInstanceInformation.transaction.name}'s transaction status.`);
        console.error();
        alert(err.response.data.message);

    } finally {
        isLoadingResolveStatus.value = false;

    }
}

onMounted(async () => {
    await retrieveTransactionInstance();
})
</script>


<style scoped>
.update-transaction-component {
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