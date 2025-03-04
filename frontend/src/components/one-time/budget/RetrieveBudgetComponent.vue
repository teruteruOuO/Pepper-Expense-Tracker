<template>
<section class="retrieve-budget-component">
    <section class="loader" v-if="isLoading">
    </section>

    <section class="retrieve-fail" v-else-if="retrieveResourcesFail">
        <p>{{ feedbackFromBackend }}</p>
    </section>

    <section class="none" v-else-if="!userBudgets">
        <section class="add-savings-link">
            <RouterLink :to="{ name: 'add-budget' }">Add Budget</RouterLink>
        </section>
        <p>You do not have any budgets yet. Add one!</p>
    </section>

    <section class="success" v-else>
        <section class="add-savings-link">
            <RouterLink :to="{ name: 'add-budget' }">Add Budget</RouterLink>
        </section>
        <section class="search-engines">
            <ul>
                <li>
                    <label for="search-budget">Search: </label>
                    <input type="text" name="search-budget" id="search-budget" v-model="searchBudgets">
                </li>
            </ul>
        </section>

        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Used Amount</th>
                    <th>Meter</th>
                    <th>Limit Amount</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="budget in computedBudgets" :key="budget.id" @click="enterBudget(budget.id)">
                    <td>{{ budget.name }}</td>
                    <td>{{ budget.description }}</td>
                    <td>{{ currencySign }}{{ budget.amount.used.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</td>
                    <td><meter :value="budget.progress" min="0" max="100" low="25" high="75" optimum="0">{{ budget.progress }}</meter>{{ budget.progress.toFixed(2) }}%</td>
                    <td>{{ currencySign }}{{ budget.amount.limit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</td>
                    <td>{{ budget.date.start }}</td>
                    <td>{{ budget.date.end }}</td>
                </tr>
            </tbody>
        </table>
    </section>
</section>
</template>


<script setup>
import axios from 'axios';
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { RouterLink } from 'vue-router';
import { useRouter } from 'vue-router';

// Initialize variables
const user = useUserStore();
const router = useRouter();
const isLoading = ref(false);
const userBudgets = ref([]);
const feedbackFromBackend = ref("");
const retrieveResourcesFail = ref(false);
const currencySign = ref('');
const searchBudgets = ref('');

// Retrieve all of the user's transactions
const retrieveBudgets = async () => {
    isLoading.value = true;

    try {
        const response = await axios.get(`/api/budget/${user.userInformation.username}/${user.userInformation.currency_code}`);
        console.log(response.data.message);

        // Store currency sign
        currencySign.value = response.data.currency_sign;

        // Store all of the retrieved user budgets
        userBudgets.value = response.data.budgets;

    } catch (err) {
        console.error(`An error occured while retrieving the user's budgets.`);
        console.error(err);
        feedbackFromBackend.value = err.response.data.message;
        retrieveResourcesFail.value = true;
    
    } finally {
        isLoading.value = false;

    }
}

// Search Filter 
const computedBudgets = computed(() => {
    return userBudgets.value.filter(budget => {
        const searchTerm = searchBudgets.value.toLowerCase();

        // Convert start date to a formatted string
        const formattedStartDate = new Date(budget.date.start).toLocaleDateString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric' 
        }).toLowerCase();

        // Convert end date to a formatted string
        const formattedEndDate = new Date(budget.date.end).toLocaleDateString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric' 
        }).toLowerCase();

        return (
            budget.name.toLowerCase().includes(searchTerm) || 
            (budget.description?.toLowerCase() || '').includes(searchTerm) || // Handle optional description
            budget.amount.used.toString().includes(searchTerm) ||
            budget.amount.limit.toString().includes(searchTerm) ||
            formattedStartDate.includes(searchTerm) || // Search in formatted deadline
            formattedEndDate.includes(searchTerm) // Search in formatted deadline
        );
    });
});

// Route to update page for each savings
const enterBudget = (budget_id) => {
    router.push({ name: 'update-budget', params: { budget_id } });
}

onMounted(async () => {
    await retrieveBudgets();
});

</script>


<style scoped>
table, th, tr, td {
    border: 1px solid black;
    text-align: left;
}

tbody tr:hover {
    cursor: pointer;
    background-color: pink;
}
</style>