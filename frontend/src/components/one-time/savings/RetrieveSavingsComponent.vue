<template>
<section class="retrieve-savings-component">
    <section class="loader" v-if="isLoading">
    </section>

    <section class="retrieve-fail" v-else-if="retrieveResourcesFail">
        <p>{{ feedbackFromBackend }}</p>
    </section>

    <!-- Retrieve Success -->
    <section class="retrieve-success" v-else>
        <section class="add-savings-link">
            <RouterLink :to="{ name: 'add-savings' }">Add Savings</RouterLink>
        </section>

        <section class="none" v-if="!userSavings">
            <p>You do not have any savings yet. Add one!</p>
        </section>

        <section class="phone" v-else-if="isPhone">
            <section class="search-engines">
                <ul>
                    <li>
                        <label for="search-saving">Search: </label>
                        <input type="text" name="search-saving" id="search-saving" v-model="searchSavings">
                    </li>
                </ul>
            </section>

            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Progress</th>
                        <th>Deadline</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="saving in computedSavings" :key="saving.sequence" @click="enterSaving(saving.sequence)">
                        <td>{{ saving.name }}</td>
                        <td><progress :id="`saving-progress-${saving.sequence}`" max="100" :value="saving.progress">{{ saving.progress }}</progress> {{ saving.progress.toFixed(2) }}%</td>
                        <td>{{ saving.deadline }}</td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section class="computer" v-else>
            <section class="search-engines">
                <ul>
                    <li>
                        <label for="search-saving">Search: </label>
                        <input type="text" name="search-saving" id="search-saving" v-model="searchSavings">
                    </li>
                </ul>
            </section>
            
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Current Amount</th>
                        <th>Target Amount</th>
                        <th>Progress</th>
                        <th>Deadline</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="saving in computedSavings" :key="saving.sequence" @click="enterSaving(saving.sequence)">
                        <td>{{ saving.name }}</td>
                        <td>{{ currencySign }}{{ saving.current_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</td>
                        <td>{{ currencySign }}{{ saving.target_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</td>
                        <td><progress :id="`saving-progress-${saving.sequence}`" max="100" :value="saving.progress">{{ saving.progress }}</progress> {{ saving.progress.toFixed(2) }}%</td>
                        <td>{{ saving.deadline }}</td>
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
const userSavings = ref([]);
const feedbackFromBackend = ref("");
const retrieveResourcesFail = ref(false);
const currencySign = ref('');
const searchSavings = ref('');

// determine table orientation based on screen width
const windowWidth = ref(window.innerWidth);
const updateWidth = () => {
    windowWidth.value = window.innerWidth;
};
// Computed property for visibility based on width range
const isPhone = computed(() => windowWidth.value <= 576);


// Retrieve the all of the user's savings
const retrieveSavings = async () => {
    isLoading.value = true;

    try {
        const response = await axios.get(`/api/savings/${user.userInformation.username}/${user.userInformation.currency_code}`);
        console.log(response.data.message);

        // Store currency sign
        currencySign.value = response.data.currency_sign;

        // Store all of the retrieved user savings
        userSavings.value = response.data.savings;

    } catch (err) {
        console.error(`An error occured while retrieving the user's savings in RetrieveSavingsComponent in SavingsView.`);
        console.error(err);
        feedbackFromBackend.value = err.response.data.message;
        retrieveResourcesFail.value = true;
    
    } finally {
        isLoading.value = false;

    }
}

// Search Filter (by name, description, current, or target amount)
const computedSavings = computed(() => {
    return userSavings.value.filter(saving => {
        const searchTerm = searchSavings.value.toLowerCase();

        // Convert deadline to a formatted string
        const formattedDeadline = new Date(saving.deadline).toLocaleDateString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric' 
        }).toLowerCase();

        return (
            saving.name.toLowerCase().includes(searchTerm) || 
            (saving.description?.toLowerCase() || '').includes(searchTerm) || // Handle optional description
            saving.current_amount.toString().includes(searchTerm) ||
            saving.target_amount.toString().includes(searchTerm) ||
            formattedDeadline.includes(searchTerm) // Search in formatted deadline
        );
    });
});

// Route to update page for each savings
const enterSaving = (sequence) => {
    router.push({ name: 'update-savings', params: { sequence } });
}

// Automatically trigger retrieve savings
onMounted(async () => {
    await retrieveSavings();
    window.addEventListener('resize', updateWidth);
});

onUnmounted(() => window.removeEventListener('resize', updateWidth));
</script>


<style scoped>
/* General Styles start */
progress {
    display: block;
    margin: 0 auto;
}

.add-savings-link {
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
/* General Styles end */


/* Table Style start */
table {
    border-collapse: separate;
    border-spacing: 0;
    inline-size: 100%;
    max-inline-size: 1200px;
    margin: 0 auto;
}

th, td {
    padding: 0.5rem;
    border-block-end: 1px solid rgb(151, 70, 83); /* Bottom border */
    border-inline-end: 1px solid rgb(151, 70, 83); /* Right border */
}

th {
    background: linear-gradient(to right, white, rgb(255, 228, 232), white, rgb(255, 228, 232), white);
}

td {
    overflow: hidden;
    text-overflow: ellipsis; /* Adds "..." for overflowed text */
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
    background-color: rgb(255, 243, 245);
    color: rgb(255, 14, 54);
}
/* Table Style end */

</style>