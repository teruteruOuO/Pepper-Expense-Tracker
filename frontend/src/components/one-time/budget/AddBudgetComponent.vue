<template>
<section class="add-budget-component">
    <h2>Add Budget Component</h2>

    <form @submit.prevent="addBudget()">
        <ul>
            <li>
                <p>Enter values in {{ currencySettings.name }} {{ currencySettings.sign }}</p>
            </li>
            <li>
                <label for="budget-name-add">Name: </label>
                <input type="text" name="budget-name-add" id="budget-name-add" v-model="userBudgetInput.name" required>
            </li>
            <li>
                <label for="budget-description-add">Description: </label><br>
                <textarea id="budget-description-add" v-model="userBudgetInput.description" placeholder="Enter description...">
                </textarea>
            </li>
            <li>
                <label for="budget-limit-amount-add">Limit Amount: {{ currencySettings.sign }}</label>
                <input type="number" name="budget-limit-amount-add" id="budget-limit-amount-add" v-model="userBudgetInput.limit_amount" step="0.01" required>
            </li>
            <li>
                <label for="budget-start-date-add">Start Date: </label>
                <input type="date" name="budget-start-date-add" id="budget-start-date-add" v-model="userBudgetInput.date.start" required>
            </li>
            <li>
                <label for="budget-end-date-add">End Date: </label>
                <input type="date" name="budget-end-date-add" id="budget-end-date-add" v-model="userBudgetInput.date.end" required>
            </li>
            <li>
                <button type="submit" :class="{ 'is-loading': isLoadingAddBudget}">
                    <span v-if="!isLoadingAddBudget">Add Budget</span>
                    <span v-else>Loading...</span>
                </button>
            </li>
        </ul>
    </form>

    <section class="feedback">
        <p>{{ feedBackFromBackend }}</p>
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
const isLoadingGetCurrency = ref(false);
const isLoadingAddBudget = ref(false);
const feedBackFromBackend = ref("");
const currencySettings = reactive({
    sign: "",
    name: ""
});
const userBudgetInput = reactive({
    name: "",
    description: "",
    limit_amount: Number(),
    date: {
        start: new Date(),
        end: new Date()
    }
});

// Ensure optional data like initial is always null when left empty 
const description = computed(() => {
    if (userBudgetInput.description === ""  || userBudgetInput.description === " ") {
        return null
    } else {
        return userBudgetInput.description
    }
});

// Retrieve the user's preferred currency option
const retrieveCurrencySetting = async () => {
    isLoadingGetCurrency.value = true;

    try {
        const response = await axios.get(`/api/currency/${user.userInformation.username}/${user.userInformation.currency_code}`);

        // Store the currency option
        currencySettings.name = response.data.currency.name;
        currencySettings.sign = response.data.currency.sign;

    } catch (err) {
        console.error(`An error occured while retrieving the user's preferred currency option.`);
        console.error(err);
        feedBackFromBackend.value = err.response.data.message;

    } finally {
        isLoadingGetCurrency.value = false;

    }
}

// Add budget
const addBudget = async () => {
    isLoadingAddBudget.value = true;

    try {
        const body = {
            name: userBudgetInput.name,
            description: description.value,
            limit_amount: Number(userBudgetInput.limit_amount),
            date: {
                start: userBudgetInput.date.start,
                end: userBudgetInput.date.end
            }
        }
        const response = await axios.post(`/api/budget/${user.userInformation.username}`, body);
        console.log(response.data.message);

        // Clear the fields
        userBudgetInput.name = '';
        userBudgetInput.description = "";
        userBudgetInput.limit_amount = Number();
        userBudgetInput.date.start = new Date();
        userBudgetInput.date.end = new Date();

        // Route user back to the Budget Page
        alert(`Successfully added ${userBudgetInput.name} budget to your account. Routing you back to the Budget Page.`);
        router.push({ name: 'budget' });

    } catch (err) {
        console.error(`An error occured while adding the user's budget information.`);
        console.error(err);
        feedBackFromBackend.value = err.response.data.message;

    } finally {
        isLoadingAddBudget.value = false;

    }
}

// Automatically retrieve the user's currency setting
onMounted(async () => {
    await retrieveCurrencySetting();
});

</script>


<style scoped>
.add-budget-component {
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