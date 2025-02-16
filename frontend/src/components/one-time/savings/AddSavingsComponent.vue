<template>
<section class="add-savings-component">
    <h2>Add savings component</h2>

    <form @submit.prevent="addSavings">
        <ul>
            <li>
                <p>Enter values in {{ currencySettings.name }} {{ currencySettings.sign }}</p>
            </li>
            <li>
                <label for="savings-name-add">Name: </label>
                <input type="text" name="savings-name-add" id="savings-name-add" v-model="userSavingsInput.name" required>
            </li>
            <li>
                <label for="savings-description-add">Description: </label><br>
                <textarea id="savings-description-add" v-model="userSavingsInput.description" placeholder="Enter description...">
                </textarea>
            </li>
            <li>
                <label for="savings-deadline-add">Deadline: </label>
                <input type="date" name="savings-deadline-add" id="savings-deadline-add" v-model="userSavingsInput.deadline" required>
            </li>
            <li>
                <label for="savings-current-amount-add">Current Amount: {{ currencySettings.sign }}</label>
                <input type="number" name="savings-current-amount-add" id="savings-current-amount-add" v-model="userSavingsInput.amount.current" step="0.01">
            </li>
            <li>
                <label for="savings-target-amount-add">Target Amount: {{ currencySettings.sign }}</label>
                <input type="number" name="savings-target-amount-add" id="savings-target-amount-add" v-model="userSavingsInput.amount.target" step="0.01" required>
            </li>
            <li>
                <button type="submit" :class="{ 'is-loading': isLoadingAddSavings }">
                    <span v-if="!isLoadingAddSavings">Add Savings</span>
                    <span v-else>Loading...</span>
                </button>
            </li>
        </ul>

        <section class="feedback">
            <p>{{ feedBackFromBackend }}</p>
        </section>
    </form>
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
const isLoadingAddSavings = ref(false);
const feedBackFromBackend = ref("");
const currencySettings = reactive({
    sign: "",
    name: ""
});
const userSavingsInput = reactive({
    name: "",
    description: "",
    deadline: new Date(),
    amount: {
        current: 0.00,
        target: Number()
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


// Computed variables for inputs that need to be immediately validated
// Ensure optional data like initial is always null when left empty 
const description = computed(() => {
    if (userSavingsInput.description === ""  || userSavingsInput.description === " ") {
        return null
    } else {
        return userSavingsInput.description
    }
});

// Add savings
const addSavings = async () => {
    isLoadingAddSavings.value = true;

    try {
        const body = {
            name: userSavingsInput.name,
            description: description.value,
            deadline: userSavingsInput.deadline,
            amount: {
                current: Number(userSavingsInput.amount.current),
                target: Number(userSavingsInput.amount.target)
            }
        }
        const response = await axios.post(`/api/savings/${user.userInformation.username}`, body);
        console.log(response.data.message);

        // Clear the fields
        userSavingsInput.name = '';
        userSavingsInput.description = "";
        userSavingsInput.deadline = new Date();
        userSavingsInput.amount.current = Number();
        userSavingsInput.amount.target = Number();

        // Route user back to the Savings Page
        alert(`Successfully added ${userSavingsInput.name} savings to your account. Routing you back to the Savings Page.`);
        router.push({ name: 'savings' });

    } catch (err) {
        console.error(`An error occured while adding the user's savings information.`);
        console.error(err);
        feedBackFromBackend.value = err.response.data.message;

    } finally {
        isLoadingAddSavings.value = false;

    }
}


// Automatically retrieve the user's currency setting
onMounted(async () => {
    await retrieveCurrencySetting();
});

</script>


<style scoped>
.add-savings-component {
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