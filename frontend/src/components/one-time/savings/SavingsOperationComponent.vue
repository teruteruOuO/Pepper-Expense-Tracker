<template>
<section class="savings-operation-component">
    <h2>Savings Operation Component</h2>
    <section class="loading" v-if="isLoadingPage">
        <p>Retrieving the savings...</p>
    </section>
    
    <section class="failed" v-else-if="!isLoadingPage && !savingsInformation.target" :class="{ 'feedback-fail': !savingsInformation.target, 'feedback-success': savingsInformation.target }">
        <p>{{ feedBackFromBackend.message }}</p>
    </section>

    <section class="success" v-else-if="!isLoadingPage && savingsInformation.target">
        <form @submit.prevent="">
            <ul>
                <li>
                    <label for="current-amount-operation">Add/Deduct to Savings: {{ currencySettings.sign }}</label>
                    <input type="number" name="current-amount-operation" id="current-amount-operation" step="0.01" min="1" v-model="inputValue" required :placeholder="currencySettings.name">
                </li>
                <li>
                    <button type="button" :class="{ 'is-loading': isLoadingOperation }" @click="operateCurrentAmount('add')">
                        <span v-if="!isLoadingOperation">Add</span>
                        <span v-else>Loading...</span>
                    </button>
                </li>
                <li>
                    <button type="button" :class="{ 'is-loading': isLoadingOperation }" @click="operateCurrentAmount('subtract')">
                        <span v-if="!isLoadingOperation">Subtract</span>
                        <span v-else>Loading...</span>
                    </button>
                </li>
                <li>
                    <progress :id="`savings-progress-${savingsInformation.sequence}`" max="100" :value="savingsInformation.progress">{{ savingsInformation.progress }}</progress> ({{ savingsInformation.progress.toFixed(2) }}%)
                </li>
                <li>
                    {{ currencySettings.sign }}{{ savingsInformation.current.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}/{{ currencySettings.sign }}{{ savingsInformation.target.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                </li>
            </ul>
        </form>

        <section class="operation-feedback" :class="{ 'feedback-fail': !feedBackFromBackend.success, 'feedback-success': feedBackFromBackend.success }">
            <p>{{ feedBackFromBackend.message }}</p>
        </section>
    </section>
</section>
</template>


<script setup>
import axios from 'axios';
import { ref, reactive, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { useRoute, useRouter } from 'vue-router';

// Initialize variables
const isLoadingPage = ref(false);
const isLoadingOperation = ref(false);
const feedBackFromBackend = reactive({
    message: '',
    success: false
})
const user = useUserStore();
const route = useRoute();
const router = useRouter();
const inputValue = ref(Number());
const currencySettings = reactive({
    name: '',
    sign: ''
});
const savingsInformation = reactive({
    current: Number(),
    target: Number(),
    progress: Number(),
    sequence: Number()
}); 

// Retrieve the user saving instance's current and target amount
const retrieveProgressAmounts = async () => {
    try {
        const response = await axios.get(`/api/savings/${user.userInformation.username}/current-amount/${route.params.sequence}`);
        console.log(response.data.message);

        // Store the currency option
        currencySettings.name = response.data.currency.name;
        currencySettings.sign = response.data.currency.sign;

        // Store savings amount information
        savingsInformation.current = response.data.savings_amount.current;
        savingsInformation.target = response.data.savings_amount.target;
        savingsInformation.progress = response.data.savings_amount.progress;
        savingsInformation.sequence = response.data.savings_amount.sequence;

    } catch (err) {
        console.error('An error occured while retrieving the user instance amounts.');
        console.error(err);
        feedBackFromBackend.message = err.response.data.message;
        feedBackFromBackend.success = false;

        // If there's no resource (the savings doesn't exist for the user) then reroute them back to the savings page
        if (err.response && err.response.status === 404) {
            alert(feedBackFromBackend.message);
            router.push({ name: 'savings' });
        }
    }
}

// Add or Subtract to the current amount
const operateCurrentAmount = async (operation) => {
    isLoadingOperation.value = true;

    let determiner = {
        present: '',
        past: '',
        present_action: ''
    }

    if (!inputValue.value) {
        isLoadingOperation.value = false;
        return;
    }

    if (operation !== 'add' && operation !== 'subtract') {
        feedBackFromBackend.message = 'Must either add or subtract';
        feedBackFromBackend.success = false;
        isLoadingOperation.value = false;
        return;
    }

    // Determine whether the operation is to add or subtract
    if (operation === 'add') {
        determiner.present = 'add';
        determiner.past = 'added';

    } else {
        determiner.present = 'subtract';
        determiner.past = 'subtracted';
    }

    const answer = window.confirm(`If you continue, ${currencySettings.sign}${inputValue.value} will be ${determiner.past} to your current savings amount (${currencySettings.sign}${savingsInformation.current}). Continue?`);
    if (!answer) {
        console.log(`User refused to ${determiner.present} ${currencySettings.sign}${inputValue.value} to the saving instance's current amount. Stopping the process.`);
        isLoadingOperation.value = false;
        return; // Prevents navigation if the user cancels the prompt
    }

    try {
        const body = {
            current_amount: Number(savingsInformation.current),
            input: Number(inputValue.value),
            operation: determiner.present
        }
        const response = await axios.put(`/api/savings/update-current-amount/${user.userInformation.username}/${savingsInformation.sequence}`, body);
        console.log(response.data.message);

        // reload the update savings page
        alert(response.data.message);
        window.location.reload();

    } catch (err) {
        console.error(`An error occured while trying to ${determiner.present} ${currencySettings.sign}${inputValue.value} to the user's current savings amount.`);
        console.error(err);
        feedBackFromBackend.message = err.response.data.message;
        feedBackFromBackend.success = false;

    } finally {
        isLoadingOperation.value = false;

    }
}


onMounted(async () => {
    isLoadingPage.value = true;
    await retrieveProgressAmounts();
    isLoadingPage.value = false;
});
</script>


<style scoped>
.savings-operation-component {
    border-radius: 5px;
    border: 1px solid rgb(128, 94, 0);
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

ul {
    display: flex;
    flex-wrap: wrap;
}

li:last-of-type {
    color: blue;
}

</style>