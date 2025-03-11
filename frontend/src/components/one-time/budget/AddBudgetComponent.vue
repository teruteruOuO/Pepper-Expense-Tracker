<template>
<section class="add-budget-component">
    <section class="loader" v-if="isLoadingGetCurrency">
    </section>

    <section class="retrieve-fail" v-else-if="retrieveResourcesFail">
        <p>{{ feedBackFromBackend }}</p>
    </section>

    <section class="success" v-else>
        <h1>New Budget Entry</h1>
        <form @submit.prevent="addBudget()">
            <ul>
                <li>
                    <label for="budget-name-add">Name: </label>
                    <input type="text" name="budget-name-add" id="budget-name-add" v-model="userBudgetInput.name" required placeholder="Required">
                </li>
                <li>
                    <label for="budget-description-add">Description: </label><br>
                    <textarea id="budget-description-add" v-model="userBudgetInput.description">
                    </textarea>
                </li>
                <li>
                    <label for="budget-limit-amount-add">Limit Amount: </label>
                    <input type="number" name="budget-limit-amount-add" id="budget-limit-amount-add" v-model="userBudgetInput.limit_amount" step="0.01" required :placeholder="`${currencySettings.name} (${currencySettings.sign})`">
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

        <section class="feedback" ref="feedbackSection">
            <p>{{ feedBackFromBackend }}</p>
        </section>
    </section>
    
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
const isLoadingAddBudget = ref(false);
const feedBackFromBackend = ref("");
const feedbackSection = ref(null);
const retrieveResourcesFail = ref(false);
const currencySettings = reactive({
    sign: "",
    name: ""
});
const userBudgetInput = reactive({
    name: "",
    description: "",
    limit_amount: null,
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
        retrieveResourcesFail.value = true;

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
        
        await nextTick();
        feedbackSection.value?.scrollIntoView({ behavior: "smooth", block: "center" });

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
    .add-budget-component {
        margin-block-start: 50px;
    }
}
</style>