<template>
<section class="retrieve-transaction-component">
    <section class="loader" v-if="isLoading">
    </section>

    <section class="retrieve-fail" v-else-if="retrieveResourcesFail">
        <p>{{ feedbackFromBackend }}</p>
    </section>

    <!-- Focus here -->
    <section class="retrieve-success" v-else>
        <section class="add-transaction-link">
            <RouterLink :to="{ name: 'add-transaction' }">Add Transaction</RouterLink>
        </section>

        <section class="none" v-if="!userTransactions">
            <p>You do not have any transactions yet. Add one!</p>
        </section>

        <section class="phone-vertical" v-else-if="isPhoneVertical">
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
                        <th>Amount</th>
                        <th>Type</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="transaction in computedTransactions" 
                    :key="transaction.sequence" 
                    :id="`transaction-entity-${transaction.sequence}`" 
                    @click="enterTransaction(transaction.sequence)"
                    :class="{ 'unresolved-expenses': transaction.type == 'expense' && transaction.resolved == 0 }">
                        <td>{{ transaction.name }}</td>
                        <td>{{ currencySign }}{{ transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</td>
                        <td>{{ transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1) }}</td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section class="phone-horionztal" v-else-if="isPhoneHorizontal">
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
                        <th>Amount</th>
                        <th>Type</th>
                        <th>Date</th>
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
                        <td>{{ currencySign }}{{ transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</td>
                        <td>{{ transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1) }}</td>
                        <td>{{ transaction.date }}</td>
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
        
        <section class="computer" v-else>
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

</section>
</template>


<script setup>
import axios from 'axios';
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
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

// determine table orientation based on screen width
const windowWidth = ref(window.innerWidth);
const updateWidth = () => {
    windowWidth.value = window.innerWidth;
};
// Computed property for visibility based on width range
const isPhoneVertical = computed(() => windowWidth.value <= 600);
const isPhoneHorizontal = computed(() => windowWidth.value <= 1000);

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
    window.addEventListener('resize', updateWidth);

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

onUnmounted(() => window.removeEventListener('resize', updateWidth));
</script>


<style scoped>
/* General Styles start */
.add-transaction-link {
    margin-block-start: 20px;
}

a {
    display: block;
    inline-size: 100%;
    max-inline-size: 150px;
    text-align: center;
    margin: 0 auto;
}

a:link, a:visited {
    color: black;
}

a:focus, a:hover {
    color: pink;
}

a:active {
    color: pink;
}

label {
    display: block;
    margin: 0 auto;
}

li {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-content: center;
}

input {
    border-radius: 5px;
    inline-size: 250px;
    block-size: 38px;
    border: 1px solid black;
    display: block;
    margin: 0 auto;
}

a, li {
    margin-block-end: 20px;
}

.retrieve-fail, .none {
    text-align: center;
}
/* General Styles end */

/* Table Style start */
table {
    border-collapse: separate;
    border-spacing: 0;
    inline-size: 100%;
    max-inline-size: 1500px;
    margin: 0 auto;
}

th, td {
    padding: 0.5rem;
    border-block-end: 1px solid rgb(151, 70, 83); /* Bottom border */
    border-inline-end: 1px solid rgb(151, 70, 83); /* Right border */
}

th {
    background: linear-gradient(to right, white, white, white, rgb(255, 228, 232), rgb(255, 228, 232), white, white, white);
}

.unresolved-expenses {
    background: linear-gradient(to bottom, white, rgba(255, 192, 203, 0.377), white, white, rgba(255, 192, 203, 0.377), white, white, rgba(255, 192, 203, 0.377), white);  
    color: rgb(252, 90, 90);
}

td {
    overflow: hidden;
    text-overflow: ellipsis; /* Adds "..." for ove rflowed text */
    white-space: nowrap;
}

table tr td:first-child, 
table tr th:first-child {
    border-inline-start: 1px solid rgb(151, 70, 83); 
}

table tr th {
    border-block-start: 1px solid rgb(151, 70, 83); 
}

table tr:first-child th:first-child {
    border-top-left-radius: 0.5rem;
}

table tr:first-child th:last-child {
    border-top-right-radius: 0.5rem;
}

table tr:last-child td:first-child {
    border-bottom-left-radius: 0.5rem;
}

table tr:last-child td:last-child {
    border-bottom-right-radius: 0.5rem;
}

tbody tr:hover {
    cursor: pointer;
    background:
        linear-gradient(to bottom, white, rgba(255, 187, 198, 0.5), rgba(255, 255, 255, 0.7), white),  
        linear-gradient(to right, white, rgb(255, 187, 198), white, rgb(255, 187, 198), white, rgb(255, 187, 198));
    color: rgb(255, 14, 54);
}
/* Table Style end */

button {
    border: 1px solid black;
    border-radius: 20px;
    max-inline-size: 170px;
    max-block-size: 30px;
    padding-inline: 10px;
    border: 1px solid black;
    background-color: #FFD0D8;
    text-wrap: wrap;
}

button:focus, button:hover {
    background-color: rgb(255, 225, 230);
    color: rgb(59, 59, 59);
    border-color: rgb(59, 59, 59);
}

button:active, .is-loading {
    background-color: rgb(255, 240, 243);
    color: rgb(102, 101, 101);
    border-color: rgb(117, 117, 117);
    cursor: not-allowed;
}

/* Phone horizontal*/
@media screen and (min-width: 576px) {
    td {
        white-space: wrap;
    }
}

/* Phone horizontal another version*/
@media screen and (min-width: 576px) {
    /* When status type becomes the 5th column */
    td:nth-of-type(5) {
        text-overflow:clip;
    }
}
</style>