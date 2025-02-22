<template>
<section class="retrieve-transaction-component">
    <section class="add-transaction-link">
        <RouterLink :to="{ name: 'add-transaction' }">Add Transaction</RouterLink>
    </section>

    <section class="is-loading" v-if="!userTransactions && isLoading">
        <p>Retrieving your transactions...</p>
    </section>

    <section class="none" v-else-if="!userTransactions && !isLoading">
        <p>You do not have any transactions yet. Add one!</p>
    </section>

    <section class="success" v-else-if="userTransactions && !isLoading">
        <section class="search-engines">
            <ul>
                <li>
                    <label for="search-transaction">Search: </label>
                    <input type="text" name="search-transaction" id="search-transaction" v-model="searchTransactions">
                </li>
            </ul>
        </section>

        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Budget Name</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="transaction in computedTransactions" :key="transaction.sequence">
                    <td>{{ transaction.name }}</td>
                    <td>{{ transaction.description }}</td>
                    <td>{{ currencySign }}{{ transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</td>
                    <td>{{ transaction.type }}</td>
                    <td>{{ transaction.date }}</td>
                    <td>{{ transaction.category }}</td>
                    <td>{{ transaction.budget }}</td>
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
const userTransactions = ref([]);
const feedbackFromBackend = ref("");
const currencySign = ref('');
const searchTransactions = ref('');

// Retrieve all of the user's transactions
const retrieveTransactions = async () => {
    isLoading.value = true;

    try {
        const response = await axios.get(`/api/transaction/${user.userInformation.username}/${user.userInformation.currency_code}`);
        console.log(response.data.message);

        // Store currency sign
        currencySign.value = response.data.currency_sign;

        // Store all of the retrieved user transactions
        userTransactions.value = response.data.transactions;

    } catch (err) {
        console.error(`An error occured while retrieving the user's transactions.`);
        console.error(err);
        feedbackFromBackend.value = err.response.data.message;
    
    } finally {
        isLoading.value = false;

    }
}

// Search Filter 
const computedTransactions = computed(() => {
    return userTransactions.value.filter(transaction => {
        const searchTerm = searchTransactions.value.toLowerCase();

        // Convert deadline to a formatted string
        const formattedDate = new Date(transaction.date).toLocaleDateString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric' 
        }).toLowerCase();

        return (
            transaction.name.toLowerCase().includes(searchTerm) || 
            (transaction.description?.toLowerCase() || '').includes(searchTerm) || // Handle optional description
            transaction.amount.toString().includes(searchTerm) ||
            transaction.type.toString().includes(searchTerm) ||
            formattedDate.includes(searchTerm) || // Search in formatted deadline
            transaction.category.toString().includes(searchTerm) ||
            (transaction.budget?.toLowerCase() || '').includes(searchTerm) // Handle optional description
        );
    });
});

onMounted(async () => {
    await retrieveTransactions();
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