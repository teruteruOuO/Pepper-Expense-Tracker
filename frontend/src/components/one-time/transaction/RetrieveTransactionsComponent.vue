<template>
<section class="retrieve-transaction-component">
    <section class="loader" v-if="isLoading">
    </section>

    <section class="is-loading" v-else-if="retrieveResourcesFail">
        <p>{{ feedbackFromBackend }}</p>
    </section>

    <section class="none" v-else-if="!userTransactions">
        <p>You do not have any transactions yet. Add one!</p>
        <section class="add-transaction-link">
            <RouterLink :to="{ name: 'add-transaction' }">Add Transaction</RouterLink>
        </section>
    </section>

    <section class="success" v-else>
        <section class="add-transaction-link">
            <RouterLink :to="{ name: 'add-transaction' }">Add Transaction</RouterLink>
        </section>
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
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="transaction in computedTransactions" 
                :key="transaction.sequence" 
                :id="`transaction-entity-${transaction.sequence}`" 
                @click="enterTransaction(transaction.sequence)"
                :class="{ 'unresolved-expenses': transaction.type == 'expense' && transaction.resolved == 0 }">
                    <td>{{ transaction.name }}</td>
                    <td>{{ transaction.description }}</td>
                    <td>{{ currencySign }}{{ transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</td>
                    <td>{{ transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1) }}</td>
                    <td>{{ transaction.date }}</td>
                    <td>{{ transaction.category }}</td>
                    <td>{{ transaction.budget }}</td>
                    <td>
                        <button type="button" 
                        v-if="transaction.type == 'expense'" 
                        @click.stop="changeTransactionStatus(transaction)"
                        :class="{ 'is-loading': isLoadingStatus} ">
                            <span v-if="!isLoadingStatus">{{ transaction.resolved ? 'Resolved' : 'Unresolved'}}</span>
                            <span v-else>Loading...</span>
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
    </section>
</section>
</template>


<script setup>
import axios from 'axios';
import { ref, computed, onMounted, nextTick } from 'vue';
import { useUserStore } from '@/stores/user';
import { RouterLink } from 'vue-router';
import { useRouter } from 'vue-router';

// Initialize variables
const user = useUserStore();
const router = useRouter();
const isLoading = ref(false);
const isLoadingStatus = ref(false);
const retrieveResourcesFail = ref(false);
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
        retrieveResourcesFail.value = true;
    
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
            transaction.type.toLowerCase().toString().includes(searchTerm) ||
            formattedDate.includes(searchTerm) || // Search in formatted deadline
            transaction.category.toLowerCase().includes(searchTerm) ||
            (transaction.budget?.toLowerCase() || '').includes(searchTerm) // Handle optional description
        );
    });
});

// Route to update page for each transaction
const enterTransaction = (sequence) => {
    router.push({ name: 'update-transaction', params: { sequence } });
}

// Resolve or Unresolve an expense
const changeTransactionStatus = async (transaction) => {
    isLoadingStatus.value = true;
    const answer = window.confirm(`Once you continue, the transaction status for ${transaction.name} will be updated. Continue?`);

    if (!answer) {
        console.log("The system stopped trying to update the transaction instance status for the user.");
        isLoadingStatus.value = false;
        return; // Prevents navigation if the user cancels the prompt
    } 

    try {
        const response = await axios.put(`/api/transaction/expense-resolution/${user.userInformation.username}/${transaction.sequence}`, { resolved: transaction.resolved });
        console.log(response.data.message);
        alert(response.data.message);

        // Store the clicked row sequence in localStorage before reload
        localStorage.setItem("lastClickedTransaction", transaction.sequence);

        // Reload the page
        window.location.reload();

    } catch (err) {
        console.error(`An error occured while changing ${transaction.name}'s transaction status.`);
        console.error();
        alert(err.response.data.message);

    } finally {
        isLoadingStatus.value = false;

    }
}

onMounted(async () => {
    await retrieveTransactions();

    // If clicking 
    const lastClicked = localStorage.getItem("lastClickedTransaction");

    if (lastClicked) {
        // Find the corresponding row and scroll to it
        nextTick(() => {
            const row = document.getElementById(`transaction-entity-${lastClicked}`);
            if (row) {
                row.scrollIntoView({ behavior: "smooth", block: "center" });
            }

            // Remove the stored value so it doesn’t keep scrolling on future reloads
            localStorage.removeItem("lastClickedTransaction");
        });
    }
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

button {
    border: 1px hidden black;
    border-radius: 5px;
    background-color: yellow;
}

button:active {
    background-color: rgb(94, 94, 30);
    color: white;
}

/* style for isLoading variables */
.is-loading {
    background-color: rgb(94, 94, 30);
    color: gray;
    cursor: not-allowed;
}

.unresolved-expenses {
    background-color: rgb(252, 149, 108);
}
</style>