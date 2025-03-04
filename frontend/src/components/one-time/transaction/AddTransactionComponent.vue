<template>
<section class="add-transaction-component">
    <h2>Add Transaction Component</h2>
    <section class="loader" v-if="isLoadingGetCurrencyAndBudgets">
    </section>

    <section :class="{ 'feedback': !feedBackFromBackend.success }" v-else-if="retrieveResourcesFail">
        <p>{{ feedBackFromBackend.message }}</p>
    </section>

    <section class="resources-retrieve-success" v-else>
        <form @submit.prevent="addTransaction()">
            <ul>
                <li>
                    <p>Enter values in {{ currencySettings.name }} {{ currencySettings.sign }}</p>
                </li>
                <li>
                    <label for="transaction-name-add">Name: </label>
                    <input type="text" name="transaction-name-add" id="transaction-name-add" required v-model="userTransactionInput.transaction.name">
                </li>
                <li>
                    <label for="transaction-description-add">Description: </label><br>
                    <textarea id="transaction-description-add" placeholder="Enter description..." v-model="userTransactionInput.transaction.description">
                    </textarea>
                </li>
                <li>
                    <label for="transaction-amount-add">Amount: {{ currencySettings.sign }}</label>
                    <input type="number" name="transaction-amount-add" id="transaction-amount-add" step="0.01" v-model="userTransactionInput.transaction.amount" required>
                </li>
                <li>
                    <label for="transaction-type-add">Type: </label>
                    <select name="transaction-type-add" id="transaction-type-add" v-model="userTransactionInput.selectedFromList.type" required>
                        <option value=""></option>
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                    </select>
                </li>
                <li>
                    <label for="transaction-date-add">Date: </label>
                    <input type="datetime-local" name="transaction-date-add" id="transaction-date-add" required v-model="userTransactionInput.transaction.date">
                </li>
                <li>
                    <label for="transaction-category-add">Category: </label>
                    <select name="transaction-category-add" id="transaction-category-add" v-model="userTransactionInput.selectedFromList.category" required>
                        <option v-for="category in categoryList" :key="category.category_id" :value="category.category_id">
                            {{ category.category_name }}
                        </option>
                    </select>
                </li>
                <!-- Appear only if a user has at least one existing budget -->
                <li v-if="budgetList && userTransactionInput.selectedFromList.type === 'expense'">
                    <label for="transaction-budget-add">Budget: </label>
                    <select name="transaction-budget-add" id="transaction-budget-add" v-model="userTransactionInput.selectedFromList.budget">
                        <option :value=null>None</option>
                        <option v-for="budget in budgetList" :key="budget.id" :value="budget.id">
                            {{ budget.name }}
                        </option>
                    </select>
                </li>
                <li>
                    <button type="submit" :class="{ 'is-loading': isLoadingAddTransaction}">
                        <span v-if="!isLoadingAddTransaction">Add Transaction</span>
                        <span v-else>Loading...</span>
                    </button>
                </li>
            </ul>
        </form>

        <section class="feedback" :class="{ 'feedback': !feedBackFromBackend.success }">
            <p>{{ feedBackFromBackend.message }}</p>
        </section>
    </section>
</section>  
</template>

<script setup>
import axios from 'axios';
import { computed, ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';

// Initialize variables
const user = useUserStore();
const router = useRouter();
const isLoadingGetCurrencyAndBudgets = ref(false);
const isLoadingAddTransaction = ref(false);
const retrieveResourcesFail = ref(false);
const feedBackFromBackend = reactive({
    message: "",
    success: false
});
const categoryList = ref(null);
const budgetList = ref(null);
const currencySettings = reactive({
    sign: "",
    name: ""
});
const userTransactionInput = reactive({
    transaction: {
        name: "",
        description: "",
        amount: Number(),
        type: "",
        date: new Date(),
    },
    category: {
        id: Number(),
        name: ""
    },
    budget: {
        id: Number(),
        name: ""
    },
    selectedFromList: {
        type: null,
        category: null,
        budget: null

    }
});

// Ensure optional data like description is always null when left empty 
const description = computed(() => {
    if (userTransactionInput.transaction.description === ""  || userTransactionInput.transaction.description === " ") {
        return null
    } else {
        return userTransactionInput.transaction.description
    }
});

// If type is income, make budget have a value of null
const chosenBudget = computed(() => {
    if (userTransactionInput.selectedFromList.type === 'income') {
        return null
    } else {
        return userTransactionInput.selectedFromList.budget
    }
});

// Retrieve all categories, user's preferred currency and their budgets
const retrieveResources = async () => {
    isLoadingGetCurrencyAndBudgets.value = true;

    try {
        const categoryResponse = await axios.get(`/api/category`);
        const currencyResponse = await axios.get(`/api/currency/${user.userInformation.username}/${user.userInformation.currency_code}`);
        const budgetResponse = await axios.get(`/api/budget/get-name/${user.userInformation.username}`);

        console.log(categoryResponse.data.message);
        console.log(currencyResponse.data.message);
        console.log(budgetResponse.data.message);

        // Store each information
        categoryList.value = categoryResponse.data.category;
        budgetList.value = budgetResponse.data.budget;
        currencySettings.name = currencyResponse.data.currency.name;
        currencySettings.sign = currencyResponse.data.currency.sign;

    } catch (err) {
        console.error(`An error occured while retrieving the user's preferred currency option, categories, and budgets.`);
        console.error(err);
        retrieveResourcesFail.value = true;
        feedBackFromBackend.message = err.response.data.message;
        feedBackFromBackend.success = false;

    } finally {
        isLoadingGetCurrencyAndBudgets.value = false;

    }
}

// Add the user's transaction information to the database
const addTransaction = async () => {
    isLoadingAddTransaction.value = true;

    try {
        const body = {
            name: userTransactionInput.transaction.name,
            description: description.value,
            amount: userTransactionInput.transaction.amount,
            type: userTransactionInput.selectedFromList.type,
            date: userTransactionInput.transaction.date,
            category: userTransactionInput.selectedFromList.category,
            budget: chosenBudget.value
        }
        const response = await axios.post(`/api/transaction/${user.userInformation.username}`, body);
        console.log(response.data.message);

        // Clear the fields
        userTransactionInput.transaction.name = '';
        userTransactionInput.transaction.description = "";
        userTransactionInput.transaction.amount = Number();
        userTransactionInput.selectedFromList.type = null;
        userTransactionInput.transaction.date = new Date();
        userTransactionInput.selectedFromList.category = null;
        userTransactionInput.selectedFromList.budget = null;

        // Route user back to the Savings Page
        alert(`Successfully added ${userTransactionInput.transaction.name} transaction to your account. Routing you back to the Transaction Page.`);
        router.push({ name: 'transaction' });

    } catch (err) {
        console.error(`An error occured while adding the user's transaction information.`);
        console.error(err);
        feedBackFromBackend.message = err.response.data.message;
        feedBackFromBackend.success = false;

    } finally {
        isLoadingAddTransaction.value = false;

    }
}

onMounted(async () => {
    await retrieveResources()
});
</script>


<style scoped>
.add-transaction-component {
    border: 1px solid green;
    border-radius: 5px;
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

.feedback {
    color: red;
}

/* style for isLoading variables */
.is-loading {
    background-color: rgb(94, 94, 30);
    color: gray;
    cursor: not-allowed;
}
</style>