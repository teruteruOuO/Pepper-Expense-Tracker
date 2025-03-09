<template>
<section class="add-savings-component">
    <h1>New Savings Entry</h1>

    <form @submit.prevent="addSavings">
        <ul>
            <li>
                <label for="savings-name-add">Name: </label>
                <input type="text" name="savings-name-add" id="savings-name-add" v-model="userSavingsInput.name" required placeholder="Required">
            </li>
            <li>
                <label for="savings-description-add">Description: </label><br>
                <textarea id="savings-description-add" v-model="userSavingsInput.description">
                </textarea>
            </li>
            <li>
                <label for="savings-deadline-add">Deadline: </label>
                <input type="date" name="savings-deadline-add" id="savings-deadline-add" v-model="userSavingsInput.deadline" required placeholder="Required">
            </li>
            <li>
                <label for="savings-current-amount-add">Current Amount:</label>
                <input type="number" name="savings-current-amount-add" id="savings-current-amount-add" v-model="userSavingsInput.amount.current" step="0.01" :placeholder="`${currencySettings.name} (${currencySettings.sign})`">
            </li>
            <li>
                <label for="savings-target-amount-add">Target Amount:</label>
                <input type="number" name="savings-target-amount-add" id="savings-target-amount-add" v-model="userSavingsInput.amount.target" step="0.01" required :placeholder="`${currencySettings.name} (${currencySettings.sign})`">
            </li>
            <li>
                <button type="submit" :class="{ 'is-loading': isLoadingAddSavings }">
                    <span v-if="!isLoadingAddSavings">Add Savings</span>
                    <span v-else>Loading...</span>
                </button>
            </li>
        </ul>

        <section class="feedback" ref="feedbackSection">
            <p>{{ feedBackFromBackend }}</p>
        </section>
    </form>
</section>
</template>


<script setup>
import axios from 'axios';
import { computed, ref, reactive, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';

// Initialize variables
const user = useUserStore();
const router = useRouter();
const isLoadingGetCurrency = ref(false);
const isLoadingAddSavings = ref(false);
const feedBackFromBackend = ref("");
const feedbackSection = ref(null);
const currencySettings = reactive({
    sign: "",
    name: ""
});
const userSavingsInput = reactive({
    name: "",
    description: "",
    deadline: new Date(),
    amount: {
        current: null,
        target: null
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

        await nextTick();
        feedbackSection.value?.scrollIntoView({ behavior: "smooth", block: "center" });

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

.feedback {
    color: red;
}

/* Laptop and above*/
@media screen and (min-width: 768px) {
    .add-savings-component {
        margin-block-start: 100px;
    }
}
</style>