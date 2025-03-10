<template>
<section class="retrieve-budget-component">
    <section class="loader" v-if="isLoading">
    </section>

    <section class="retrieve-fail" v-else-if="retrieveResourcesFail">
        <p>{{ feedbackFromBackend }}</p>
    </section>

    <!-- Retrieve Success -->
    <section class="retrieve-success" v-else>
        <section class="add-budget-link">
            <RouterLink :to="{ name: 'add-budget' }">Add Budget</RouterLink>
        </section>

        <section class="none" v-if="!userBudgets">
            <p>You do not have any budgets yet. Add one!</p>
        </section>

        <section class="phone" v-else-if="isPhone">
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
                        <th>Meter</th>
                        <th>End Date</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="budget in computedBudgets" :key="budget.id" @click="enterBudget(budget.id)" :class="{ 'over-budget': budget.progress >= 100 }">
                        <td>{{ budget.name }}</td>
                        <td><meter :value="budget.progress" min="0" max="100" low="25" high="75" optimum="0">{{ budget.progress }}</meter>{{ budget.progress.toFixed(2) }}%</td>
                        <td>{{ budget.date.end }}</td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section class="computer" v-else>
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
                        <th>Used Amount</th>
                        <th>Meter</th>
                        <th>Limit Amount</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="budget in computedBudgets" :key="budget.id" @click="enterBudget(budget.id)" :class="{ 'over-budget': budget.progress >= 100 }">
                        <td>{{ budget.name }}</td>
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
</section>
</template>


<script setup>
import axios from 'axios';
import { ref, computed, onMounted, onUnmounted } from 'vue';
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

// determine table orientation based on screen width
const windowWidth = ref(window.innerWidth);
const updateWidth = () => {
    windowWidth.value = window.innerWidth;
};
// Computed property for visibility based on width range
const isPhone = computed(() => windowWidth.value <= 576);

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
    window.addEventListener('resize', updateWidth);
});

onUnmounted(() => window.removeEventListener('resize', updateWidth));
</script>


<style scoped>
/* General Styles start */
meter {
    display: block;
    margin: 0 auto;
}

.add-budget-link {
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
    max-inline-size: 1300px;
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

.over-budget {
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

/* Phone horizontal*/
@media screen and (min-width: 576px) {
    td {
        white-space: wrap;
    }
}
</style>